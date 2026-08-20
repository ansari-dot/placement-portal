import {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
} from "../service/students.service.js";
import { studentSchema } from "../validator/studentModelsValidator.js";
import NotificationModel from "../model/notification.model.js";

export const createStudentController = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is missing" });
        }

        // Validate request body with Zod
        const validatedData = studentSchema.parse(req.body);

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
        const students = await getAllStudents();
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

        res.status(200).json({
            message: "Student deleted successfully",
            success: true,
        });
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
};