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

// Generate a unique student ID based on college/RTO initials + sequential number (e.g. CE 1, AC 1)
const generateStudentId = async (rtoName) => {
    const initials = getCollegeInitials(rtoName);
    const regex = new RegExp(`^${initials}\\s*(\\d+)$`, "i");

    const existingStudents = await StudentModel.find({ studentId: regex });
    let maxNum = 0;

    existingStudents.forEach((stu) => {
        if (stu.studentId) {
            const match = stu.studentId.match(/\d+/);
            if (match) {
                const num = parseInt(match[0], 10);
                if (num > maxNum) maxNum = num;
            }
        }
    });

    return `${initials} ${maxNum + 1}`;
};

export const createStudent = async (studentData) => {
    if (!studentData.studentId) {
        const collegeName = studentData.institute || studentData.assignedRto || studentData.rto || "";
        studentData.studentId = await generateStudentId(collegeName);
    }
    const student = await StudentModel.create(studentData);
    return student;
};

export const getAllStudents = async () => {
    return await StudentModel.find().sort({ createdAt: -1 });
};

export const getStudentById = async (id) => {
    return await StudentModel.findById(id);
};

export const updateStudent = async (id, studentData) => {
    return await StudentModel.findByIdAndUpdate(id, studentData, {
        returnDocument: "after",
        runValidators: true,
    });
};
export const deleteStudent = async (id) => {
    return await StudentModel.findByIdAndDelete(id);
};