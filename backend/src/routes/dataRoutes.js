import express from "express";
import {
    addDataForTimeSlot,
    getDataForDate,
    getAllDocuments,
    deleteDataObjectById
} from "../controllers/dataController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const dataRouter = express.Router();

dataRouter.post("/add-data", authMiddleware, addDataForTimeSlot);
dataRouter.get("/get-data", authMiddleware, getDataForDate); // this is used to get data for a specific date or slot and is used in the frontend to get data for a specific date or slot
dataRouter.get("/get-all-documents",  getAllDocuments);  // this is used to get all documents for a specific user and is used in the frontend to get all documents for a specific user
dataRouter.delete("/delete-data/:id",  deleteDataObjectById); // this is used to delete a specific data object by id and is used in the frontend to delete a specific data object by id

export default dataRouter;