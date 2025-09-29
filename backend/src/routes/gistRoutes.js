import express from "express";
import { createGist, getGist, getAllGists, searchGist } from "../controllers/gist.controller.js";

const router = express.Router();

router.post("/", createGist);
router.get("/", getAllGists);
router.get("/search/:id", searchGist);
router.get("/:id", getGist);

export default router;
