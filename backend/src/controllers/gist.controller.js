import Gist, { MIN_TTL_HOURS, MAX_TTL_HOURS } from "../models/Gist.js";
import { generateUniqueId } from "../utils/utils.js";

const processUploads = (reqFiles, fieldName) => {
    const items = reqFiles?.[fieldName] || [];
    return items.map((file) => ({
        data: file.buffer,
        contentType: file.mimetype,
        name: file.originalname,
        size: file.size,
    }));
};

export const createGist = async (req, res) => {
    try {
        const { code, title = "Untitled", fileName = "untitled.txt" } = req.body;
        let ttlHours = parseInt(req.body.ttlHours) || MAX_TTL_HOURS;

        const codeContent = (code && typeof code === "string") ? code.trim() : "";
        const screenshots = processUploads(req.files, "screenshots");
        const files = processUploads(req.files, "files");

        if (!codeContent && screenshots.length === 0 && files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide code, screenshots, or files",
            });
        }

        if (codeContent.length > 100000) {
            return res.status(400).json({
                success: false,
                message: "Code content too large (max 100KB)",
            });
        }

        ttlHours = Math.max(MIN_TTL_HOURS, Math.min(MAX_TTL_HOURS, ttlHours));

        const uniqueId = await generateUniqueId();
        const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

        const gist = new Gist({
            id: uniqueId,
            code: codeContent,
            fileName: typeof fileName === "string" ? fileName.trim() : "untitled.txt",
            title: typeof title === "string" ? title.trim() : "Untitled",
            screenshots,
            files,
            ttlHours,
            expiresAt,
        });

        await gist.save();

        res.status(201).json({
            success: true,
            data: {
                id: gist.id,
                title: gist.title,
                fileName: gist.fileName,
                ttlHours: gist.ttlHours,
                screenshotCount: gist.screenshots.length,
                fileCount: gist.files.length,
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

        const gist = await Gist.findOne({
            id: id.toLowerCase(),
            expiresAt: { $gt: new Date() },
        }).select("-screenshots.data -files.data");

        if (!gist) {
            return res.status(404).json({
                success: false,
                message: "Code snippet not found or expired",
            });
        }

        const screenshotsMeta = gist.screenshots.map((s, index) => ({
            index,
            name: s.name,
            size: s.size,
            contentType: s.contentType,
            url: `/api/gists/${gist.id}/screenshots/${index}`,
        }));

        const filesMeta = gist.files.map((f, index) => ({
            index,
            name: f.name,
            size: f.size,
            contentType: f.contentType,
            url: `/api/gists/${gist.id}/files/${index}`,
        }));

        res.status(200).json({
            success: true,
            data: {
                id: gist.id,
                code: gist.code,
                fileName: gist.fileName,
                title: gist.title,
                ttlHours: gist.ttlHours,
                screenshots: screenshotsMeta,
                files: filesMeta,
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

// Serve a screenshot (inline)
export const getScreenshot = async (req, res) => {
    try {
        const { id, index } = req.params;
        const idx = parseInt(index);

        if (!id || id.length !== 4 || isNaN(idx) || idx < 0 || idx > 4) {
            return res.status(400).json({ success: false, message: "Invalid request" });
        }

        const gist = await Gist.findOne({
            id: id.toLowerCase(),
            expiresAt: { $gt: new Date() },
        }).select("screenshots");

        if (!gist || !gist.screenshots[idx]) {
            return res.status(404).json({ success: false, message: "Screenshot not found" });
        }

        const screenshot = gist.screenshots[idx];
        res.set("Content-Type", screenshot.contentType);
        res.set("Content-Length", screenshot.size);
        res.set("Cache-Control", "public, max-age=86400");
        res.send(screenshot.data);
    } catch (error) {
        console.error("Error serving screenshot:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Serve a file (as download)
export const getFile = async (req, res) => {
    try {
        const { id, index } = req.params;
        const idx = parseInt(index);

        if (!id || id.length !== 4 || isNaN(idx) || idx < 0 || idx > 4) {
            return res.status(400).json({ success: false, message: "Invalid request" });
        }

        const gist = await Gist.findOne({
            id: id.toLowerCase(),
            expiresAt: { $gt: new Date() },
        }).select("files");

        if (!gist || !gist.files[idx]) {
            return res.status(404).json({ success: false, message: "File not found" });
        }

        const file = gist.files[idx];
        res.set("Content-Type", file.contentType);
        res.set("Content-Length", file.size);
        res.set("Content-Disposition", `attachment; filename="${encodeURIComponent(file.name)}"`);
        res.set("Cache-Control", "public, max-age=86400");
        res.send(file.data);
    } catch (error) {
        console.error("Error serving file:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getAllGists = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const skip = (page - 1) * limit;

        const gists = await Gist.find({ expiresAt: { $gt: new Date() } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("id title fileName ttlHours createdAt expiresAt");

        const total = await Gist.countDocuments({ expiresAt: { $gt: new Date() } });

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

        const gist = await Gist.findOne({
            id: id.toLowerCase(),
            expiresAt: { $gt: new Date() },
        }).select("-screenshots.data -files.data");

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
                title: gist.title,
                fileName: gist.fileName,
                ttlHours: gist.ttlHours,
                screenshotCount: gist.screenshots.length,
                fileCount: gist.files.length,
                createdAt: gist.createdAt,
                expiresAt: gist.expiresAt,
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
