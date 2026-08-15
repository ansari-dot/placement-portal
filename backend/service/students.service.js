import StudentModel from "../model/student.model.js";

// Generate a unique student ID based on the current year and the last student ID in the database
const generateStudentId = async () => {
    const prefix = "STU";
    const year = new Date().getFullYear().toString().slice(-2);

    const lastStudent = await StudentModel
        .findOne({ studentId: new RegExp(`^${prefix}-${year}-`) })
        .sort({ createdAt: -1 });

    let newIdNumber = 1;

    if (lastStudent?.studentId) {
        const lastNumber = parseInt(lastStudent.studentId.split("-")[2], 10);

        if (!Number.isNaN(lastNumber)) {
            newIdNumber = lastNumber + 1;
        }
    }

    return `${prefix}-${year}-${newIdNumber.toString().padStart(3, "0")}`;
};

export const createStudent = async (studentData) => {
    if (!studentData.studentId) {
        studentData.studentId = await generateStudentId();
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