import {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
} from "../service/students.service.js";
import { purgeStudentFromWorkflows } from "../service/workflow.service.js";
import { studentSchema } from "../validator/studentModelsValidator.js";
import NotificationModel from "../model/notification.model.js";

export const createStudentController = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is missing" });
        }

        // Validate request body with Zod
        const validatedData = studentSchema.parse(req.body);

        // No auto-assign — coordinator is assigned manually via "Assign Coordinator"

        const student = await createStudent(validatedData);

        // Trigger Notification
        try {
            const studentName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'A new student';
            await NotificationModel.create({
                title: 'New Student Added',
                desc: `${studentName} was successfully added to student roster`,
                type: 'student',
                link: '/my-students',
            });
        } catch (nErr) {
            console.error("Failed to create notification:", nErr);
        }

        res.status(201).json({
            message: "Student created successfully",
            success: true,
            data: student,
        });
    } catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({
                message: "Validation failed",
                success: false,
                errors: error.issues.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
        }
        res.status(400).json({ message: error.message, success: false });
    }
};

export const getAllStudentsController = async (req, res) => {
    try {
        let filter = {};

        if (req.user && req.user.role !== 'Administrator') {
            // Coordinators and non-admin roles: only see their explicitly assigned students
            filter = { assignedCoordinator: req.user._id };
        } else if (req.user && req.user.role === 'Administrator') {
            // Administrator sees ALL students
            // Optional: filter by coordinatorId query param for the coordinator-switcher dropdown
            if (req.query.coordinatorId === 'unassigned') {
                filter = { $or: [{ assignedCoordinator: null }, { assignedCoordinator: { $exists: false } }] };
            } else if (req.query.coordinatorId) {
                filter = { assignedCoordinator: req.query.coordinatorId };
            }
            // else filter stays {} — all students returned
        }

        const students = await getAllStudents(filter);
        res.status(200).json({
            message: "Students fetched successfully",
            success: true,
            data: students,
        });
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
};

export const getStudentByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await getStudentById(id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                success: false,
            });
        }

        res.status(200).json({
            message: "Student fetched successfully",
            success: true,
            data: student,
        });
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
};

export const updateStudentController = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is missing" });
        }

        // Validate request body with Zod (partial update)
        const validatedData = studentSchema.partial().parse(req.body);

        const student = await updateStudent(id, validatedData);

        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                success: false,
            });
        }

        res.status(200).json({
            message: "Student updated successfully",
            success: true,
            data: student,
        });
    } catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({
                message: "Validation failed",
                success: false,
                errors: error.issues.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
        }
        res.status(400).json({ message: error.message, success: false });
    }
};

export const deleteStudentController = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await deleteStudent(id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                success: false,
            });
        }

        // Cascade: remove from all workflow steps (requests, appointments, internships)
        // Uses both the MongoDB _id string and the business studentId (e.g. "STU1")
        try {
            await purgeStudentFromWorkflows(id, student.studentId || '');
        } catch (purgeErr) {
            // Log but don't fail the response — student is already deleted
            console.error("Workflow cascade purge failed:", purgeErr.message);
        }

        res.status(200).json({
            message: "Student deleted successfully",
            success: true,
        });
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
};

// Returns ALL students with no coordinator filtering — used by the "Students" search page
export const getAllStudentsUnfilteredController = async (req, res) => {
    try {
        const students = await getAllStudents({});
        res.status(200).json({
            message: "All students fetched successfully",
            success: true,
            data: students,
        });
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
};

// ─── Assign / Change / Remove Coordinator ─────────────────────────────────
// FIXED: previously this only overwrote assignedCoordinator/assignedCoordinatorName
// and never recorded WHO the student was assigned to before, or WHEN each
// change happened. The Student Profile page needs "All coordinators to whom
// the student was assigned, with dates" — so every call now:
//   1. Reads the student's CURRENT coordinator (before overwriting it)
//   2. Determines the action type: 'Assigned' (had none before), 'Changed'
//      (had a different one before), or 'Removed' (new value is null)
//   3. Pushes a full history entry ($push, so it never wipes prior entries)
//   4. Then updates the live assignedCoordinator / assignedCoordinatorName
// `req.user` (the logged-in admin performing the action) is captured as
// `assignedBy` / `assignedByUserId` so the history also shows who made the change.
export const assignCoordinatorController = async (req, res) => {
    try {
        const { id } = req.params;
        const { coordinatorId, coordinatorName } = req.body;

        const currentStudent = await getStudentById(id);
        if (!currentStudent) {
            return res.status(404).json({
                message: "Student not found",
                success: false,
            });
        }

        const previousCoordinatorId   = currentStudent.assignedCoordinator || null;
        const previousCoordinatorName = currentStudent.assignedCoordinatorName || '';

        let action = 'Assigned';
        if (!coordinatorId) {
            action = 'Removed';
        } else if (previousCoordinatorId) {
            action = 'Changed';
        }

        const historyEntry = {
            coordinatorId: coordinatorId || null,
            coordinatorName: coordinatorName || '',
            action,
            previousCoordinatorName,
            assignedBy: req.user?.name || req.user?.email || '',
            assignedByUserId: req.user?._id || req.user?.id || null,
            date: new Date(),
        };

        const student = await updateStudent(id, {
            assignedCoordinator: coordinatorId || null,
            assignedCoordinatorName: coordinatorName || '',
            assignedCoordinatorAt: coordinatorId ? new Date() : null,
            $push: { coordinatorHistory: historyEntry },
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                success: false,
            });
        }

        res.status(200).json({
            message: coordinatorId
                ? (action === 'Changed'
                    ? `Coordinator changed from ${previousCoordinatorName || 'Unassigned'} to ${coordinatorName || 'coordinator'} successfully`
                    : `Student assigned to ${coordinatorName || 'coordinator'} successfully`)
                : "Coordinator unassigned successfully",
            success: true,
            data: student,
        });
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
};