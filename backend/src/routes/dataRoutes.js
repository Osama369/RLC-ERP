import express from "express";
import {
    addDataForTimeSlot,
    getDataForDate,
    getAllDocuments,
    deleteDataObjectById,
    getWinningNumbers,
    setWinningNumbers,
    deleteIndividualEntries
} from "../controllers/dataController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const dataRouter = express.Router();

dataRouter.post("/add-data", authMiddleware, addDataForTimeSlot);
dataRouter.get("/get-data", authMiddleware, getDataForDate); // this is used to get data for a specific date or slot and is used in the frontend to get data for a specific date or slot
dataRouter.get("/get-all-documents",  getAllDocuments);  // this is used to get all documents for a specific user and is used in the frontend to get all documents for a specific user
dataRouter.delete("/delete-data/:id", authMiddleware,  deleteDataObjectById); // this is used to delete a specific data object by id and is used in the frontend to delete a specific data object by id
dataRouter.get("/get-winning-numbers", authMiddleware, getWinningNumbers); // this is used to get winning numbers for a specific date and time slot
dataRouter.post("/set-winning-numbers", authMiddleware, setWinningNumbers); // this is used to set winning numbers for a specific date and time slot
dataRouter.delete('/delete-individual-entries', authMiddleware, deleteIndividualEntries); // this is used to delete individual entries based on provided IDs

export default dataRouter;