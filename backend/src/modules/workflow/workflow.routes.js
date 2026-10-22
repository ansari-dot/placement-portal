import express from 'express';
import {
  createWorkflowController,
  getAllWorkflowsController,
  getWorkflowByIdController,
  updateWorkflowController,
  deleteWorkflowController,
  updateWorkflowStepController,
  addStudentsToWorkflowController,
  removeStudentFromWorkflowController,
  createInternshipRequestController,
  updateInternshipRequestController,
  deleteInternshipRequestController,
  createAppointmentController,
  updateAppointmentController,
  deleteAppointmentController,
  createInternshipController,
  updateInternshipController,
  deleteInternshipController,
  bulkDeleteInternshipRequestsController,
  bulkDeleteAppointmentsController,
  bulkDeleteInternshipsController,
  getWorkflowDashboardDataController,
  getWorkflowStudentsController,
  checkPlacementAlertsController,
} from './workflow.controller.js';
import { authenticate } from '../../core/guards/auth.guard.js';
import { requireRoles } from '../../core/guards/roles.guard.js';

const router = express.Router();

router.use(authenticate);

const canManage = requireRoles('Administrator', 'Admin', 'Coordinator', 'Placement Coordinator', 'Staff');
const canUpdatePlacement = requireRoles('Administrator', 'Admin', 'Coordinator', 'Placement Coordinator', 'Staff', 'Industry', 'Industry/Host');
const isAdminOnly = requireRoles('Administrator', 'Admin');

// Workflow CRUD
router.post('/', canManage, createWorkflowController);
router.get('/', getAllWorkflowsController);
router.get('/dashboard', getWorkflowDashboardDataController);
router.get('/students', getWorkflowStudentsController);
router.post('/check-placement-alerts', canManage, checkPlacementAlertsController);
router.get('/:id', getWorkflowByIdController);
router.put('/:id', canManage, updateWorkflowController);
router.delete('/:id', isAdminOnly, deleteWorkflowController);

// Step Management
router.patch('/:id/step', canManage, updateWorkflowStepController);

// Students in Workflow
router.post('/:id/students', canManage, addStudentsToWorkflowController);
router.delete('/:id/students/:studentId', canManage, removeStudentFromWorkflowController);

// Internship Requests (Step 2)
router.post('/:id/requests', canManage, createInternshipRequestController);
router.post('/:id/requests/bulk-delete', canManage, bulkDeleteInternshipRequestsController);
router.put('/:id/requests/:requestId', canManage, updateInternshipRequestController);
router.delete('/:id/requests/:requestId', canManage, deleteInternshipRequestController);

// Appointments (Step 3)
router.post('/:id/appointments', canManage, createAppointmentController);
router.post('/:id/appointments/bulk-delete', canManage, bulkDeleteAppointmentsController);
router.put('/:id/appointments/:appointmentId', canUpdatePlacement, updateAppointmentController);
router.delete('/:id/appointments/:appointmentId', canManage, deleteAppointmentController);

// Internships (Step 4)
router.post('/:id/internships', canManage, createInternshipController);
router.post('/:id/internships/bulk-delete', canManage, bulkDeleteInternshipsController);
router.put('/:id/internships/:internshipId', canUpdatePlacement, updateInternshipController);
router.delete('/:id/internships/:internshipId', canManage, deleteInternshipController);

export default router;
