import express from "express";
import {
    createStudentController,
    getAllStudentsController,
    getAllStudentsUnfilteredController,
    getStudentByIdController,
    updateStudentController,
    deleteStudentController,
    assignCoordinatorController,
} from "../controller/student.controller.js";
import { protectRoute, softAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", createStudentController);
router.get("/", softAuth, getAllStudentsController);
router.get("/all", getAllStudentsUnfilteredController);
router.get("/:id", getStudentByIdController);
router.put("/:id", updateStudentController);
router.patch("/:id/assign-coordinator", protectRoute, assignCoordinatorController);
router.delete("/:id", deleteStudentController);

export default router;
