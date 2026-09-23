import express from "express";
import { createRoom, getRoom, addEntry, getEntryScreenshot, getEntryFile } from "../controllers/room.controller.js";
import { handleUploadErrors } from "../middleware/upload.js";

const router = express.Router();

router.post("/", createRoom);
router.get("/:code", getRoom);
router.post("/:code/entries", handleUploadErrors, addEntry);
router.get("/:code/entries/:entryId/screenshots/:index", getEntryScreenshot);
router.get("/:code/entries/:entryId/files/:index", getEntryFile);

export default router;
