import express from "express";
import {
    createStudentController,
    getAllStudentsController,
    getStudentByIdController,
    updateStudentController,
    deleteStudentController,
} from "../controller/student.controller.js";

const router = express.Router();

router.post("/", createStudentController);
router.get("/", getAllStudentsController);
router.get("/:id", getStudentByIdController);
router.put("/:id", updateStudentController);
router.delete("/:id", deleteStudentController);

export default router;