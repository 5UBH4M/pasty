import multer from "multer";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total across all uploads
const MAX_SCREENSHOTS = 5;
const MAX_FILES = 5;

const storage = multer.memoryStorage();

// Block dangerous executables, allow everything else
const BLOCKED_EXTENSIONS = [".exe", ".msi", ".bat", ".cmd", ".com", ".scr", ".pif"];

const fileFilter = (req, file, cb) => {
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
    if (BLOCKED_EXTENSIONS.includes(ext)) {
        cb(new Error(`Blocked file type: ${ext}`), false);
        return;
    }

    // For screenshots field, only allow images
    if (file.fieldname === "screenshots" && !ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(new Error(`Invalid image type: ${file.mimetype}. Only PNG, JPEG, GIF, and WebP allowed.`), false);
        return;
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_TOTAL_SIZE, // per-file limit set to total (validated below)
        files: MAX_SCREENSHOTS + MAX_FILES,
    },
}).fields([
    { name: "screenshots", maxCount: MAX_SCREENSHOTS },
    { name: "files", maxCount: MAX_FILES },
]);

// Middleware wrapper: runs multer then validates combined size
export const handleUploadErrors = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "File too large. Total upload limit is 10MB.",
                });
            }
            if (err.code === "LIMIT_FILE_COUNT") {
                return res.status(400).json({
                    success: false,
                    message: "Too many files. Max 5 screenshots + 5 files.",
                });
            }
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`,
            });
        }
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message,
            });
        }

        // Validate combined size of all uploads
        const allFiles = [
            ...(req.files?.screenshots || []),
            ...(req.files?.files || []),
        ];
        const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);

        if (totalSize > MAX_TOTAL_SIZE) {
            return res.status(400).json({
                success: false,
                message: `Total upload size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds 10MB limit.`,
            });
        }

        next();
    });
};
