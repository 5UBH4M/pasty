import Gist from "../models/Gist.js";
import { generateUniqueId } from "../utils/utils.js";

export const createGist = async (req, res) => {
    try {
        const { code, title = "Untitled", fileName = "untitled.txt" } = req.body;

        if (!code || typeof code !== "string" || code.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Code content is required",
            });
        }

        if (code.length > 100000) {
            return res.status(400).json({
                success: false,
                message: "Code content too large (max 100KB)",
            });
        }

        const uniqueId = await generateUniqueId(); // Generate unique 4-digit ID

        const gist = new Gist({
            id: uniqueId,
            code: code,
            fileName: fileName.trim(),
            title: title.trim(),
        });

        await gist.save();

        res.status(201).json({
            success: true,
            data: {
                id: gist.id,
                title: gist.title,
                fileName: gist.fileName,
                createdAt: gist.createdAt,
                expiresAt: gist.expiresAt,
            },
            message: "Code snippet created successfully",
        });
    } catch (error) {
        console.error("Error creating gist:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getGist = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || id.length !== 4) {
            return res.status(400).json({
                success: false,
                message: "Invalid gist ID format",
            });
        }

        const gist = await Gist.findOne({ id: id.toLowerCase() });

        if (!gist) {
            return res.status(404).json({
                success: false,
                message: "Code snippet not found or expired",
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: gist.id,
                code: gist.code,
                fileName: gist.fileName,
                title: gist.title,
                createdAt: gist.createdAt,
                expiresAt: gist.expiresAt,
            },
        });
    } catch (error) {
        console.error("Error fetching gist:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getAllGists = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const gists = await Gist.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).select("id title fileName createdAt code");

        const total = await Gist.countDocuments({});

        res.status(200).json({
            success: true,
            data: gists,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching all gists:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const searchGist = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || id.length !== 4) {
            return res.status(400).json({
                success: false,
                message: "Invalid gist ID format. ID must be exactly 4 characters long.",
            });
        }

        const gist = await Gist.findOne({ id: id.toLowerCase() });

        if (!gist) {
            return res.status(404).json({
                success: false,
                message: "Code snippet not found",
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: gist.id,
                title: gist.title,
                fileName: gist.fileName,
                createdAt: gist.createdAt,
            },
        });
    } catch (error) {
        console.error("Error searching gist:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
