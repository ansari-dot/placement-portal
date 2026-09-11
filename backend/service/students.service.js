import mongoose from "mongoose";
import StudentModel from "../model/student.model.js";

// Helper to derive uppercase initials from RTO or College name
const getCollegeInitials = (name) => {
    if (!name || typeof name !== 'string') return "STU";
    const clean = name.trim();
    if (!clean) return "STU";
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
        return words.map((w) => w[0].toUpperCase()).join("");
    } else if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }
    return "STU";
};

// Generate a unique student ID based on college/RTO initials + sequential number (e.g. CE1, AC1)
// Fix: uses $regex with $options to avoid the RegExp object issue with Mongoose,
// strips the prefix to extract the trailing number so STU10 → 10 (not 1 from /\d+/ first match).
const generateStudentId = async (rtoName) => {
    const initials = getCollegeInitials(rtoName);

    // Escape the initials so any special chars in RTO name don't break the regex
    const escapedInitials = initials.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Query MongoDB using $regex string + $options (avoids Mongoose RegExp quirks)
    const regexPattern = `^${escapedInitials}\\d+$`;
    const existingStudents = await StudentModel.find(
        { studentId: { $regex: regexPattern, $options: 'i' } },
        { studentId: 1 }
    ).lean();

    let maxNum = 0;

    existingStudents.forEach((stu) => {
        if (stu.studentId) {
            // Strip the initials prefix (case-insensitive) then parse the remaining digits
            const prefixRegex = new RegExp(`^${escapedInitials}`, 'i');
            const suffix = stu.studentId.replace(prefixRegex, '');
            const num = parseInt(suffix, 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
        }
    });

    return `${initials}${maxNum + 1}`;
};

export const createStudent = async (studentData) => {
    if (!studentData.studentId) {
        const collegeName = studentData.institute || studentData.assignedRto || studentData.rto || "";
        studentData.studentId = await generateStudentId(collegeName);
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