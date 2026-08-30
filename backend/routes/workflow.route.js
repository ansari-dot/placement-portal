import express from "express";
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
  getWorkflowDashboardDataController,
  getWorkflowStudentsController,
} from "../controller/workflow.controller.js";
import { softAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ===== Workflow CRUD =====
router.post("/", createWorkflowController);
router.get("/", getAllWorkflowsController);
router.get("/dashboard", getWorkflowDashboardDataController);
router.get("/students", softAuth, getWorkflowStudentsController);
router.get("/:id", getWorkflowByIdController);
router.put("/:id", updateWorkflowController);
router.delete("/:id", deleteWorkflowController);

// ===== Workflow Step Management =====
router.patch("/:id/step", updateWorkflowStepController);

// ===== Students in Workflow =====
router.post("/:id/students", addStudentsToWorkflowController);
router.delete("/:id/students/:studentId", removeStudentFromWorkflowController);

// ===== Internship Requests (Step 2) =====
router.post("/:id/requests", createInternshipRequestController);
router.put("/:id/requests/:requestId", updateInternshipRequestController);
router.delete("/:id/requests/:requestId", deleteInternshipRequestController);

// ===== Appointments (Step 3) =====
router.post("/:id/appointments", createAppointmentController);
router.put("/:id/appointments/:appointmentId", updateAppointmentController);
router.delete("/:id/appointments/:appointmentId", deleteAppointmentController);

// ===== Internships (Step 4) =====
router.post("/:id/internships", createInternshipController);
router.put("/:id/internships/:internshipId", updateInternshipController);
router.delete("/:id/internships/:internshipId", deleteInternshipController);

export default router;