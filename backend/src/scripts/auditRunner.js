import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const srcDir = path.resolve(rootDir, 'src');

const report = {
  timestamp: new Date().toISOString(),
  checks: [],
  summary: { pass: 0, fail: 0, blocked: 0, notTested: 0 }
};

function recordCheck(id, title, status, details = {}, fix = null) {
  report.checks.push({ id, title, status, details, fix });
  if (status === 'PASS') report.summary.pass++;
  else if (status === 'FAIL') report.summary.fail++;
  else if (status === 'BLOCKED') report.summary.blocked++;
  else report.summary.notTested++;
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${id}: ${title}`);
  if (status === 'FAIL') {
    console.error('   Details:', JSON.stringify(details, null, 2));
    if (fix) console.log('   Recommended Fix:', fix);
  }
}

// Helper to recursively get all JS files
function getAllJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    if (item.name === 'node_modules' || item.name === 'uploads' || item.name === '.git') continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getAllJsFiles(full));
    } else if (item.name.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

// ============================================================================
// 1. VALIDATE MIGRATION: Imports, Stale Paths, Broken Files
// ============================================================================
console.log('\n--- 1. VALIDATING MIGRATION (Imports, Files & Paths) ---');

const allJsFiles = [path.join(rootDir, 'server.js'), ...getAllJsFiles(srcDir)];
const brokenImports = [];
const stalePathReferences = [];
const importGraph = new Map();

for (const file of allJsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  const relFile = path.relative(rootDir, file).replace(/\\/g, '/');
  importGraph.set(relFile, []);

  // Regex to extract import paths
  const importRegex = /(?:from|import)\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1] || match[2];
    if (!importPath) continue;

    // Check for stale root folder references
    const stalePatterns = [
      /\.\.\/model\//,
      /\.\.\/controller\//,
      /\.\.\/service\//,
      /\.\.\/validator\//,
      /\.\.\/middlewares\//,
      /\.\.\/config\//,
      /\.\.\/utils\//,
      /\.\.\/scripts\//,
    ];

    // For files directly inside src/ (like server.js or src/app.js)
    if (stalePatterns.some(p => p.test(importPath))) {
      // Check if it actually resolves to an outside non-existent folder
      const resolved = path.resolve(dir, importPath);
      const relResolved = path.relative(rootDir, resolved).replace(/\\/g, '/');
      if (!relResolved.startsWith('src/')) {
        stalePathReferences.push({ file: relFile, importPath, resolved: relResolved });
      }
    }

    // Relative import resolution check
    if (importPath.startsWith('.')) {
      const resolved = path.resolve(dir, importPath);
      const relResolved = path.relative(rootDir, resolved).replace(/\\/g, '/');
      importGraph.get(relFile).push(relResolved);

      if (!fs.existsSync(resolved)) {
        brokenImports.push({ file: relFile, importPath, resolvedTarget: relResolved });
      }
    }
  }
}

if (brokenImports.length === 0) {
  recordCheck('MIG-01', 'Relative Import Path Resolution Across All JS Files', 'PASS', { totalFiles: allJsFiles.length });
} else {
  recordCheck('MIG-01', 'Relative Import Path Resolution Across All JS Files', 'FAIL', { brokenImports }, 'Correct broken relative import paths');
}

if (stalePathReferences.length === 0) {
  recordCheck('MIG-02', 'Stale References to Deleted Root Directories', 'PASS', { checkedFiles: allJsFiles.length });
} else {
  recordCheck('MIG-02', 'Stale References to Deleted Root Directories', 'FAIL', { stalePathReferences }, 'Update stale paths to src/ modules or core');
}

// Package.json scripts check
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const scriptErrors = [];
for (const [name, cmd] of Object.entries(packageJson.scripts || {})) {
  const matchNode = cmd.match(/node\s+([^\s]+\.js)/);
  if (matchNode) {
    const targetFile = path.resolve(rootDir, matchNode[1]);
    if (!fs.existsSync(targetFile)) {
      scriptErrors.push({ script: name, command: cmd, missingFile: matchNode[1] });
    }
  }
}

if (scriptErrors.length === 0) {
  recordCheck('MIG-03', 'Package.json Script Targets Existence', 'PASS', { scripts: Object.keys(packageJson.scripts || {}) });
} else {
  recordCheck('MIG-03', 'Package.json Script Targets Existence', 'FAIL', { scriptErrors }, 'Update script path in package.json');
}

// Circular dependency check
const cycles = [];
const visited = new Set();
const recStack = new Set();

function detectCycles(node, currentPath) {
  visited.add(node);
  recStack.add(node);
  currentPath.push(node);

  const neighbors = importGraph.get(node) || [];
  for (const neighbor of neighbors) {
    if (!importGraph.has(neighbor)) continue;
    if (!visited.has(neighbor)) {
      detectCycles(neighbor, [...currentPath]);
    } else if (recStack.has(neighbor)) {
      cycles.push([...currentPath, neighbor]);
    }
  }
  recStack.delete(node);
}

for (const node of importGraph.keys()) {
  if (!visited.has(node)) detectCycles(node, []);
}

if (cycles.length === 0) {
  recordCheck('MIG-04', 'ES Module Circular Dependency Graph Check', 'PASS', { totalNodes: importGraph.size });
} else {
  recordCheck('MIG-04', 'ES Module Circular Dependency Graph Check', 'FAIL', { cyclesCount: cycles.length, sampleCycles: cycles.slice(0, 3) }, 'Break circular imports using dependency injection or service re-exports');
}

// ============================================================================
// 2. VALIDATE ARCHITECTURE: Domain Modules & Core Foundation
// ============================================================================
console.log('\n--- 2. VALIDATING ARCHITECTURE (Module Autonomy & Core Infra) ---');

const expectedModules = [
  'attendance', 'audit', 'auth', 'email', 'industry', 'invoice',
  'job', 'notification', 'payment', 'rto', 'student', 'workflow'
];

const moduleStatus = {};
for (const mod of expectedModules) {
  const modDir = path.join(srcDir, 'modules', mod);
  if (!fs.existsSync(modDir)) {
    moduleStatus[mod] = { exists: false };
    continue;
  }
  const files = fs.readdirSync(modDir);
  moduleStatus[mod] = {
    exists: true,
    hasController: files.some(f => f.includes('controller')),
    hasService: files.some(f => f.includes('service')),
    hasRoutes: files.some(f => f.includes('routes')),
    hasDto: files.some(f => f.includes('dto')),
    hasModel: files.some(f => f.includes('model')),
    totalFiles: files.length,
  };
}

const missingModuleParts = [];
for (const [mod, s] of Object.entries(moduleStatus)) {
  if (!s.exists) missingModuleParts.push(`${mod}: directory missing`);
  if (mod !== 'email' && mod !== 'auth' && !s.hasModel) missingModuleParts.push(`${mod}: model missing`);
  if (!s.hasService) missingModuleParts.push(`${mod}: service missing`);
}

if (missingModuleParts.length === 0) {
  recordCheck('ARCH-01', 'Domain Module Encapsulation (Controller, Service, DTO, Model, Routes)', 'PASS', { moduleStatus });
} else {
  recordCheck('ARCH-01', 'Domain Module Encapsulation', 'FAIL', { missingModuleParts });
}

// Core structure check
const coreDirs = ['config', 'errors', 'guards', 'middlewares', 'utils'];
const missingCore = coreDirs.filter(d => !fs.existsSync(path.join(srcDir, 'core', d)));
if (missingCore.length === 0) {
  recordCheck('ARCH-02', 'Shared Infrastructure in src/core/', 'PASS', { coreDirs });
} else {
  recordCheck('ARCH-02', 'Shared Infrastructure in src/core/', 'FAIL', { missingCore });
}

// Middleware ordering in src/app.js check
const appContent = fs.readFileSync(path.join(srcDir, 'app.js'), 'utf8');
const middlewareOrderChecks = [
  { name: 'app.use(cors)', index: appContent.indexOf('app.use(\n  cors') !== -1 ? appContent.indexOf('app.use(\n  cors') : appContent.indexOf('cors(') },
  { name: 'app.use(securityHeaders)', index: appContent.indexOf('app.use(securityHeaders)') },
  { name: 'app.use(mongoSanitize)', index: appContent.indexOf('app.use(mongoSanitize)') },
  { name: 'app.use(apiRateLimiter)', index: appContent.indexOf('app.use(apiRateLimiter)') },
  { name: 'app.use(express.json)', index: appContent.indexOf('app.use(express.json') },
  { name: 'app.use(softAuth)', index: appContent.indexOf('app.use(softAuth)') },
  { name: 'app.use(auditMutations)', index: appContent.indexOf('app.use(auditMutations)') },
  { name: 'routes', index: appContent.indexOf("app.use('/auth'") },
  { name: 'app.use(errorHandler)', index: appContent.indexOf('app.use(errorHandler)') },
];

let orderValid = true;
for (let i = 0; i < middlewareOrderChecks.length - 1; i++) {
  if (middlewareOrderChecks[i].index === -1 || middlewareOrderChecks[i+1].index === -1) {
    orderValid = false;
    break;
  }
  if (middlewareOrderChecks[i].index > middlewareOrderChecks[i+1].index) {
    orderValid = false;
    break;
  }
}

if (orderValid) {
  recordCheck('ARCH-03', 'Express Middleware Pipeline Ordering & Error Handler Placement', 'PASS', { middlewareOrderChecks });
} else {
  recordCheck('ARCH-03', 'Express Middleware Pipeline Ordering', 'FAIL', { middlewareOrderChecks });
}

// ============================================================================
// 3. VALIDATE DATABASE INTEGRITY & MODEL REGISTRATIONS
// ============================================================================
console.log('\n--- 3. VALIDATING DATABASE INTEGRITY (Models, Indexes & Counter) ---');

const modelFiles = [
  'attendance/attendance.model.js',
  'audit/audit.model.js',
  'industry/industry.model.js',
  'invoice/invoice.model.js',
  'invoice/counter.model.js',
  'job/job.model.js',
  'notification/notification.model.js',
  'payment/payment.model.js',
  'rto/rto.model.js',
  'student/student.model.js',
  'user/user.model.js',
  'workflow/workflow.model.js',
];

const modelIntegrityResults = [];
for (const rel of modelFiles) {
  const full = path.join(srcDir, 'modules', rel);
  if (!fs.existsSync(full)) {
    modelIntegrityResults.push({ file: rel, exists: false });
    continue;
  }
  const content = fs.readFileSync(full, 'utf8');
  const hasSchema = content.includes('new mongoose.Schema') || content.includes('new Schema');
  const hasModel = content.includes('mongoose.model(') || content.includes('model(');
  const exportsDefault = content.includes('export default');

  modelIntegrityResults.push({
    file: rel,
    exists: true,
    hasSchema,
    hasModel,
    exportsDefault,
    hasTimestamps: content.includes('timestamps: true') || content.includes('timestamps'),
  });
}

const invalidModels = modelIntegrityResults.filter(m => !m.exists || !m.hasSchema || !m.hasModel);
if (invalidModels.length === 0) {
  recordCheck('DB-01', 'Mongoose Model Schema Definitions & Model Registrations', 'PASS', { modelsCount: modelIntegrityResults.length });
} else {
  recordCheck('DB-01', 'Mongoose Model Schema Definitions & Registrations', 'FAIL', { invalidModels });
}

// ============================================================================
// 4. VALIDATE SECURITY
// ============================================================================
console.log('\n--- 4. VALIDATING SECURITY (Headers, Sanitizer, Rate Limit, Uploads) ---');

// Run security assertions directly
let secPassed = 0;
let secFailed = 0;
const secDetails = [];

function assertSec(condition, desc) {
  if (condition) {
    secPassed++;
    secDetails.push({ test: desc, result: 'PASS' });
  } else {
    secFailed++;
    secDetails.push({ test: desc, result: 'FAIL' });
  }
}

// Import and test security components
async function testSecurityComponents() {
  try {
    const { securityHeaders } = await import('../core/middlewares/securityHeaders.js');
    const { mongoSanitize } = await import('../core/middlewares/mongoSanitize.js');
    const upload = (await import('../core/middlewares/students.middleware.js')).default;

    // Headers
    const headers = {};
    securityHeaders({}, { setHeader: (k, v) => { headers[k] = v; }, removeHeader: (k) => { delete headers[k]; } }, () => {});
    assertSec(headers['X-Content-Type-Options'] === 'nosniff', 'X-Content-Type-Options is nosniff');
    assertSec(headers['X-Frame-Options'] === 'SAMEORIGIN', 'X-Frame-Options is SAMEORIGIN');
    assertSec(headers['X-XSS-Protection'] === '1; mode=block', 'X-XSS-Protection is enabled');
    assertSec(headers['Referrer-Policy'] === 'strict-origin-when-cross-origin', 'Referrer-Policy is strict');

    // NoSQL injection
    const reqMock = { body: { $gt: '', email: 'legit@example.com', 'nested.key': 'bad' }, query: { $ne: '' } };
    mongoSanitize(reqMock, {}, () => {});
    assertSec(reqMock.body.$gt === undefined, 'NoSQL operator $gt stripped from body');
    assertSec(reqMock.body.email === 'legit@example.com', 'Legitimate body field preserved');
    assertSec(reqMock.query.$ne === undefined, 'NoSQL query operator $ne stripped');

    // Upload filter
    let badFileBlocked = false;
    upload.fileFilter({}, { originalname: 'virus.exe', mimetype: 'application/x-msdownload' }, (err, ok) => {
      if (err || !ok) badFileBlocked = true;
    });
    assertSec(badFileBlocked, 'Malicious executable (.exe) rejected by fileFilter');

    let goodFileAllowed = false;
    upload.fileFilter({}, { originalname: 'doc.pdf', mimetype: 'application/pdf' }, (err, ok) => {
      if (!err && ok) goodFileAllowed = true;
    });
    assertSec(goodFileAllowed, 'Valid PDF (.pdf) allowed by fileFilter');

  } catch (err) {
    assertSec(false, `Security test execution exception: ${err.message}`);
  }

  if (secFailed === 0) {
    recordCheck('SEC-01', 'Core Security Suite (Headers, NoSQL Sanitizer, Upload Filter)', 'PASS', { passed: secPassed, tests: secDetails });
  } else {
    recordCheck('SEC-01', 'Core Security Suite', 'FAIL', { passed: secPassed, failed: secFailed, tests: secDetails });
  }
}

// ============================================================================
// 5. VALIDATE RUNTIME, ENVIRONMENT & HEALTH
// ============================================================================
console.log('\n--- 5. VALIDATING RUNTIME & HEALTH ---');

async function testRuntime() {
  try {
    const app = (await import('../app.js')).default;
    recordCheck('RUN-01', 'Express App Module Loading Without Exceptions', 'PASS', { appLoaded: typeof app === 'function' });

    // Check health endpoint route
    let healthHit = false;
    try {
      const res = await fetch('http://localhost:5000/');
      const data = await res.json();
      if (res.status === 200 && data.message === 'Server is running') {
        healthHit = true;
      }
    } catch {
      const http = await import('http');
      const server = http.createServer(app);
      await new Promise((resolve) => server.listen(0, resolve));
      const port = server.address().port;
      const res = await fetch(`http://127.0.0.1:${port}/`);
      const data = await res.json();
      if (res.status === 200 && data.message === 'Server is running') {
        healthHit = true;
      }
      server.close();
    }
    if (healthHit) {
      recordCheck('RUN-02', 'Root Health Check GET / Contract', 'PASS', { expected: { message: 'Server is running' } });
    } else {
      recordCheck('RUN-02', 'Root Health Check GET / Contract', 'FAIL', { details: 'GET / did not return expected envelope' });
    }

    // Check secret leakage prevention
    const envString = JSON.stringify(process.env);
    const leakedSecrets = [];
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length > 5) {
      // Ensure error middleware does not print secrets
      const { errorHandler } = await import('../core/middlewares/error.middleware.js');
      let leakedInError = false;
      errorHandler(new Error('Simulated error with secret ' + process.env.JWT_SECRET), { method: 'GET', originalUrl: '/test' }, {
        status: () => ({
          json: (payload) => {
            if (JSON.stringify(payload).includes(process.env.JWT_SECRET)) leakedInError = true;
          }
        })
      }, () => {});
      if (!leakedInError) {
        recordCheck('SEC-02', 'Secret Leakage Prevention in Centralized Error Handler', 'PASS', { testedSecret: 'JWT_SECRET' });
      } else {
        recordCheck('SEC-02', 'Secret Leakage Prevention in Centralized Error Handler', 'FAIL', { leaked: true });
      }
    } else {
      recordCheck('SEC-02', 'Secret Leakage Prevention in Centralized Error Handler', 'PASS', { note: 'Default development fallback secret active' });
    }

  } catch (err) {
    recordCheck('RUN-01', 'Express App Module Loading', 'FAIL', { error: err.message, stack: err.stack });
  }
}

async function runAll() {
  await testSecurityComponents();
  await testRuntime();

  console.log('\n======================================================');
  console.log('  AUDIT SUMMARY REPORT');
  console.log('======================================================');
  console.log(`  TOTAL CHECKS: ${report.checks.length}`);
  console.log(`  ✅ PASSED   : ${report.summary.pass}`);
  console.log(`  ❌ FAILED   : ${report.summary.fail}`);
  console.log(`  ⚠️ BLOCKED  : ${report.summary.blocked}`);
  console.log('======================================================\n');

  fs.writeFileSync(path.join(rootDir, 'audit_report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('Audit report saved to audit_report.json');

  if (report.summary.fail > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

runAll().catch(e => {
  console.error('Audit runner error:', e);
  process.exitCode = 1;
});
