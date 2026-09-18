import mongoose from "mongoose";
import StudentModel from "../model/student.model.js";

// ─── Sequential Student ID Generator ───────────────────────────────────────
// Generates plain sequential IDs: STU1, STU2, STU3... regardless of RTO/college
// name. This replaces the old initials-based scheme (e.g. "AC1", "XY1") which
// was confusing because it looked like an RTO name rather than a student ID.
//
// Finds the highest existing "STU<number>" and increments by 1. If no student
// with this prefix exists yet, starts at STU1.
const STUDENT_ID_PREFIX = "STU";

const generateStudentId = async () => {
    const escapedPrefix = STUDENT_ID_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = `^${escapedPrefix}\\d+$`;

    const existingStudents = await StudentModel.find(
        { studentId: { $regex: regexPattern, $options: 'i' } },
        { studentId: 1 }
    ).lean();

    let maxNum = 0;
    const prefixRegex = new RegExp(`^${escapedPrefix}`, 'i');

    existingStudents.forEach((stu) => {
        if (stu.studentId) {
            const suffix = stu.studentId.replace(prefixRegex, '');
            const num = parseInt(suffix, 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
        }
    });

    return `${STUDENT_ID_PREFIX}${maxNum + 1}`;
};

export const createStudent = async (studentData) => {
    // Normalize: treat whitespace-only ("   ") the same as empty, so it doesn't
    // accidentally get saved as a "manual" ID and skip auto-generation.
    const manualId = (studentData.studentId || '').trim();

    if (manualId) {
        // ── Manual path: user typed an ID — respect it, but verify it's unique
        // first so we return a clean error instead of a raw MongoDB E11000
        // duplicate-key crash.
        const existing = await StudentModel.findOne({ studentId: manualId }).lean();
        if (existing) {
            const err = new Error(`Student ID "${manualId}" is already in use. Please choose a different ID or leave it blank to auto-generate one.`);
            err.isDuplicateStudentId = true;
            throw err;
        }
        studentData.studentId = manualId;
    } else {
        // ── Auto path: nothing entered — generate the next sequential ID
        studentData.studentId = await generateStudentId();
    }

    const student = await StudentModel.create(studentData);
    return student;
};

export const getAllStudents = async (filter = {}) => {
    return await StudentModel.find(filter).sort({ createdAt: -1 });
};

export const getStudentById = async (id) => {
    if (mongoose.Types.ObjectId.isValid(id)) {
        const student = await StudentModel.findById(id);
        if (student) return student;
    }
    return await StudentModel.findOne({ studentId: id });
};

export const updateStudent = async (id, studentData) => {
    if (mongoose.Types.ObjectId.isValid(id)) {
        const student = await StudentModel.findByIdAndUpdate(id, studentData, {
            returnDocument: "after",
            runValidators: true,
        });
        if (student) return student;
    }
    return await StudentModel.findOneAndUpdate({ studentId: id }, studentData, {
        returnDocument: "after",
        runValidators: true,
    });
};

export const deleteStudent = async (id) => {
    if (mongoose.Types.ObjectId.isValid(id)) {
        const student = await StudentModel.findByIdAndDelete(id);
        if (student) return student;
    }
    return await StudentModel.findOneAndDelete({ studentId: id });
};