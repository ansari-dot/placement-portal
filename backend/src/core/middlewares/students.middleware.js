import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure destination directory exists safely
const uploadDir = 'uploads/students/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    // Strip path traversal sequences & non-alphanumeric characters
    const sanitizedExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const cleanPrefix = path.basename(file.originalname, sanitizedExt).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const uniqueSuffix = `${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    cb(null, `${cleanPrefix}_${uniqueSuffix}${sanitizedExt}`);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
]);

const filterFiles = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  const isMimeValid = ALLOWED_MIME_TYPES.has(file.mimetype);
  const isExtValid = ALLOWED_EXTENSIONS.has(ext);

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${ext || file.mimetype}. Only PDF, Word documents, and images are permitted.`));
  }
};

const upload = multer({
  storage,
  fileFilter: filterFiles,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB safe maximum
    files: 5,
  },
});

export default upload;