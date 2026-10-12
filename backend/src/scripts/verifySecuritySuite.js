import { securityHeaders } from '../core/middlewares/securityHeaders.js';
import { mongoSanitize } from '../core/middlewares/mongoSanitize.js';
import upload from '../core/middlewares/students.middleware.js';
import { authRateLimiter } from '../core/middlewares/rateLimiter.js';

let passed = 0;
let failed = 0;

const assert = (condition, description) => {
  if (condition) {
    passed++;
    console.log(`[PASS] ${description}`);
  } else {
    failed++;
    console.error(`[FAIL] ${description}`);
  }
};

console.log('=== RUNNING SECURITY HARDENING VERIFICATION SUITE ===\n');

// 1. Test Security Headers
const mockReq = {};
const headersSet = {};
const mockRes = {
  setHeader: (k, v) => { headersSet[k] = v; },
  removeHeader: (k) => { delete headersSet[k]; },
};
securityHeaders(mockReq, mockRes, () => { });

assert(headersSet['X-Content-Type-Options'] === 'nosniff', 'Security Header: X-Content-Type-Options is set to nosniff');
assert(headersSet['X-Frame-Options'] === 'SAMEORIGIN', 'Security Header: X-Frame-Options is set to SAMEORIGIN');
assert(headersSet['X-XSS-Protection'] === '1; mode=block', 'Security Header: X-XSS-Protection is enabled');
assert(headersSet['Referrer-Policy'] === 'strict-origin-when-cross-origin', 'Security Header: Referrer-Policy is strict');

// 2. Test NoSQL Injection Sanitization
const dirtyBody = {
  email: 'victim@example.com',
  password: 'Password123',
  $gt: '',
  profile: {
    bio: 'Normal text',
    $where: 'sleep(5000)',
    'nested.key': 'evil',
  },
};
const dirtyReq = { body: dirtyBody, query: { $ne: null, page: 1 }, params: {} };
mongoSanitize(dirtyReq, {}, () => { });

assert(dirtyReq.body.$gt === undefined, 'NoSQL Sanitizer: Operator $gt stripped from body');
assert(dirtyReq.body.profile.$where === undefined, 'NoSQL Sanitizer: Nested operator $where stripped');
assert(dirtyReq.body.profile['nested.key'] === undefined, 'NoSQL Sanitizer: Key with dot stripped');
assert(dirtyReq.body.email === 'victim@example.com', 'NoSQL Sanitizer: Legitimate email field preserved');
assert(dirtyReq.query.$ne === undefined && dirtyReq.query.page === 1, 'NoSQL Sanitizer: Query operator stripped while legitimate page preserved');

// 3. Test File Upload Extension & MIME Protection
// Mock multer filterFiles
const filterFiles = upload.fileFilter;

let badFileRejected = false;
filterFiles({}, { originalname: 'malicious_script.exe', mimetype: 'application/x-msdownload' }, (err, allowed) => {
  if (err || !allowed) badFileRejected = true;
});
assert(badFileRejected, 'File Upload Security: .exe binary rejected');

let spoofedMimeRejected = false;
filterFiles({}, { originalname: 'malicious.php', mimetype: 'application/pdf' }, (err, allowed) => {
  if (err || !allowed) spoofedMimeRejected = true;
});
assert(spoofedMimeRejected, 'File Upload Security: Spoofed MIME type with .php extension rejected');

let validPdfAccepted = false;
filterFiles({}, { originalname: 'resume.pdf', mimetype: 'application/pdf' }, (err, allowed) => {
  if (!err && allowed) validPdfAccepted = true;
});
assert(validPdfAccepted, 'File Upload Security: Valid .pdf file accepted');

console.log(`\n=== SECURITY VERIFICATION COMPLETE ===`);
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);

if (failed > 0) process.exit(1);
else process.exit(0);
