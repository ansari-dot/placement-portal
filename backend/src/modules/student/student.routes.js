import express from 'express';
import {
  createStudentController,
  getAllStudentsController,
  getAllStudentsUnfilteredController,
  getStudentByIdController,
  updateStudentController,
  deleteStudentController,
  assignCoordinatorController,
  downloadBulkTemplateController,
  bulkImportStudentsController,
  bulkUploadDocumentsController,
  repairStudentRtoController,
  bulkAssignRtoController,
  bulkUpdateStatusController,
  bulkDeleteStudentsController,
  reconcileStudentStatusesController,
} from './student.controller.js';
import multer from 'multer';
import { requireRoles } from '../../core/guards/roles.guard.js';
import { authenticate } from '../../core/guards/auth.guard.js';
import { validateBody } from '../../core/middlewares/validate.middleware.js';
import { studentSchema } from './student.dto.js';

const router = express.Router();

router.use(authenticate);

// ===== Bulk import (must be before /:id) =====
const canManage = requireRoles('Administrator', 'Coordinator', 'Staff');
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /\.xlsx$/i.test(file.originalname)),
});
const docsUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 500 },
  fileFilter: (req, file, cb) => cb(null, /\.(pdf|jpe?g|png|docx?|webp)$/i.test(file.originalname)),
});

router.get('/bulk/template', canManage, downloadBulkTemplateController);
router.post('/bulk/import', canManage, excelUpload.single('file'), bulkImportStudentsController);
router.post('/bulk/documents', canManage, docsUpload.array('files', 500), bulkUploadDocumentsController);
router.post('/bulk/assign-rto', canManage, bulkAssignRtoController);
router.patch('/bulk/status', canManage, bulkUpdateStatusController);
router.post('/bulk/delete', canManage, bulkDeleteStudentsController);

// ===== Status reconciliation (Admin only) =====
router.post('/reconcile-statuses', requireRoles('Administrator', 'Admin'), reconcileStudentStatusesController);

const canCreateStudent = requireRoles('Administrator', 'Admin', 'Coordinator', 'Placement Coordinator', 'Staff', 'RTO Manager', 'RTO');

router.post('/', canCreateStudent, validateBody(studentSchema), createStudentController);
router.get('/', getAllStudentsController);
router.get('/all', getAllStudentsUnfilteredController);
router.get('/:id', getStudentByIdController);
router.put('/:id', validateBody(studentSchema.partial()), updateStudentController);
router.patch('/:id/assign-coordinator', canManage, assignCoordinatorController);
router.post('/repair/rto', canManage, repairStudentRtoController);
router.delete('/:id', requireRoles('Administrator', 'Admin'), deleteStudentController);

export default router;
