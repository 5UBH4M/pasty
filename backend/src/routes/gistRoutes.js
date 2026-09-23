import express from "express";
import { createGist, getGist, getAllGists, searchGist, getScreenshot, getFile } from "../controllers/gist.controller.js";
import { handleUploadErrors } from "../middleware/upload.js";

const router = express.Router();

router.post("/", handleUploadErrors, createGist);
router.get("/", getAllGists);
router.get("/search/:id", searchGist);
router.get("/:id", getGist);
router.get("/:id/screenshots/:index", getScreenshot);
router.get("/:id/files/:index", getFile);

export default router;
