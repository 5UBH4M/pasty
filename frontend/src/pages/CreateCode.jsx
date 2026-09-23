import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Link as LinkIcon, Clipboard, Search, Clock, ImagePlus, Paperclip, X, Users } from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

const formatTTL = (hours) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const rem = hours % 24;
    return rem === 0 ? `${days}d` : `${days}d ${rem}h`;
};

const MAX_SCREENSHOTS = 5;
const MAX_FILES = 5;
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
const BLOCKED_EXTENSIONS = [".exe", ".msi", ".bat", ".cmd", ".com", ".scr", ".pif"];

const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
};

export default function CreateCode() {
    const navigate = useNavigate();
    const [description, setDescription] = useState("");
    const [code, setCode] = useState("");
    const [ttlHours, setTtlHours] = useState(168);
    const [screenshots, setScreenshots] = useState([]);
    const [uploadFiles, setUploadFiles] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [ttlOpen, setTtlOpen] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const fileInputRef = useRef(null);
    const ttlRef = useRef(null);

    const getTotalSize = (ss = screenshots, uf = uploadFiles) =>
        [...ss, ...uf].reduce((sum, f) => sum + f.size, 0);

    // Close TTL popover on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ttlRef.current && !ttlRef.current.contains(e.target)) {
                setTtlOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const addUploads = (incoming) => {
        let runningSize = getTotalSize();
        const newScreenshots = [];
        const newFiles = [];

        for (const file of Array.from(incoming)) {
            const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
            if (BLOCKED_EXTENSIONS.includes(ext)) {
                toast.error(`${file.name}: Blocked file type.`);
                continue;
            }
            if (runningSize + file.size > MAX_TOTAL_SIZE) {
                toast.error(`${file.name}: Would exceed 10MB total limit.`);
                break;
            }

            const isImage = IMAGE_TYPES.includes(file.type);
            if (isImage && screenshots.length + newScreenshots.length < MAX_SCREENSHOTS) {
                newScreenshots.push(file);
            } else if (!isImage && uploadFiles.length + newFiles.length < MAX_FILES) {
                newFiles.push(file);
            } else {
                toast.error(`${file.name}: Maximum ${isImage ? "screenshots" : "files"} limit reached.`);
                continue;
            }
            runningSize += file.size;
        }

        if (newScreenshots.length > 0) setScreenshots((prev) => [...prev, ...newScreenshots]);
        if (newFiles.length > 0) setUploadFiles((prev) => [...prev, ...newFiles]);
        const total = newScreenshots.length + newFiles.length;
        if (total > 0) toast.success(`${total} file${total > 1 ? "s" : ""} added`);
    };

    const removeScreenshot = (index) => {
        setScreenshots((prev) => prev.filter((_, i) => i !== index));
    };

    const removeUploadFile = (index) => {
        setUploadFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        addUploads(e.dataTransfer.files);
    };

    const handleFileSelect = (e) => {
        if (e.target.files) {
            addUploads(e.target.files);
            e.target.value = "";
        }
    };

    const handleCreate = async () => {
        if (!code.trim() && screenshots.length === 0 && uploadFiles.length === 0) {
            toast.error("Please add some code, screenshots, or files before creating a link");
            return;
        }

        setIsCreating(true);

        try {
            const gistData = {
                code: code.trim(),
                title: description || "Untitled",
                ttlHours,
            };

            const result = await api.createGist(gistData, screenshots, uploadFiles);

            toast.success("Code snippet created successfully!");

            // Copy link to clipboard
            const shareLink = `${window.location.origin}/code/${result.data.id}`;
            try {
                await navigator.clipboard.writeText(shareLink);
                toast.info("Link copied to clipboard!");
            } catch (clipboardError) {
                console.warn("Failed to copy to clipboard:", clipboardError);
            }

            navigate(`/code/${result.data.id}`);
        } catch (error) {
            console.error("Error creating gist:", error);
            toast.error(error.message || "Failed to create code snippet");
        } finally {
            setIsCreating(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;
            const newValue = value.substring(0, start) + "    " + value.substring(end);
            setCode(newValue);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 4;
            }, 0);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setCode(text);
                toast.success("Code pasted successfully!");
            }
        } catch (error) {
            console.error("Failed to paste from clipboard:", error);
            toast.error("Failed to paste from clipboard. Please paste manually using Ctrl+V");
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
        >
            <div className="w-full max-w-4xl px-4 py-8">
                <h1
                    className="text-center text-3xl sm:text-5xl font-bold tracking-[0.3em] sm:tracking-[0.5em] mb-6 sm:mb-8 select-none"
                    style={{
                        color: "var(--primary-color)",
                        textShadow: "0 0 30px rgba(139, 92, 246, 0.3)",
                        textIndent: "0.3em",
                    }}
                >
                    PASTY
                </h1>
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2" style={{ color: "var(--foreground)" }}>
                                Create New Code Share
                            </h1>
                            <p className="text-sm sm:text-base" style={{ color: "var(--muted-foreground)" }}>Share your code with your classmates easily</p>
                        </div>
                        <Link
                            to="/recent"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium self-start sm:self-auto"
                            style={{
                                backgroundColor: "var(--secondary-color)",
                                color: "var(--foreground)",
                                border: "1px solid var(--border-color)",
                                textDecoration: "none",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "var(--secondary-hover)";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "var(--secondary-color)";
                            }}
                        >
                            <Search className="w-4 h-4" />
                            Search
                        </Link>
                    </div>

                    {/* Room Bar */}
                    <div
                        className="rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3 flex-wrap"
                        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}
                    >
                        <Users className="w-5 h-5" style={{ color: "var(--primary-color)" }} />
                        <span className="text-sm font-medium mr-auto" style={{ color: "var(--foreground)" }}>Rooms</span>

                        {/* Join */}
                        <div className="flex items-center gap-1.5">
                            <input
                                type="text"
                                placeholder="6-digit code"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toLowerCase().slice(0, 6))}
                                onKeyDown={(e) => { if (e.key === "Enter" && joinCode.length === 6) navigate(`/room/${joinCode}`); }}
                                maxLength={6}
                                className="w-28 rounded-md px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 transition-all"
                                style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--foreground)" }}
                            />
                            <button
                                onClick={() => { if (joinCode.length === 6) navigate(`/room/${joinCode}`); else toast.error("Enter a 6-digit room code"); }}
                                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer"
                                style={{ backgroundColor: "var(--secondary-color)", color: "var(--foreground)", border: "1px solid var(--border-color)" }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--secondary-hover)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--secondary-color)"; }}
                            >
                                Join
                            </button>
                        </div>

                        {/* Create */}
                        <button
                            onClick={async () => {
                                try {
                                    const result = await api.createRoom({ name: "New Room", ttlHours: 168 });
                                    toast.success(`Room created! Code: ${result.data.code}`);
                                    navigate(`/room/${result.data.code}`);
                                } catch (err) {
                                    toast.error(err.message);
                                }
                            }}
                            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer"
                            style={{ backgroundColor: "var(--primary-color)", color: "var(--foreground)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-hover)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-color)"; }}
                        >
                            Create Room
                        </button>
                    </div>

                    <div
                        className="rounded-lg p-6 space-y-4"
                        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}
                    >
                        {/* Description + TTL row */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Code description (Optional)"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 transition-all"
                                    style={{
                                        backgroundColor: "var(--input-bg)",
                                        border: "1px solid var(--border-color)",
                                        color: "var(--foreground)",
                                    }}
                                />
                            </div>
                            <div className="relative" ref={ttlRef}>
                                <button
                                    type="button"
                                    onClick={() => setTtlOpen((prev) => !prev)}
                                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer whitespace-nowrap"
                                    style={{
                                        backgroundColor: "var(--input-bg)",
                                        border: "1px solid var(--border-color)",
                                        color: "var(--foreground)",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--secondary-hover)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--input-bg)"; }}
                                >
                                    <Clock className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                                    {formatTTL(ttlHours)}
                                </button>

                                {/* Smooth Slider Popover */}
                                {ttlOpen && (
                                    <div
                                        className="absolute right-0 top-full mt-1.5 rounded-lg px-4 py-3 z-20"
                                        style={{
                                            backgroundColor: "var(--card-bg)",
                                            border: "1px solid var(--border-color)",
                                            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                                            width: "220px",
                                        }}
                                    >
                                        <div className="text-center text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
                                            {formatTTL(ttlHours)}
                                        </div>
                                        <input
                                            type="range"
                                            min={1}
                                            max={168}
                                            value={ttlHours}
                                            onChange={(e) => setTtlHours(parseInt(e.target.value))}
                                            className="w-full cursor-pointer accent-[var(--primary-color)]"
                                        />
                                        <div className="flex justify-between mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                                            <span>1h</span>
                                            <span>7d</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Code textarea */}
                        <div className="relative">
                            <textarea
                                placeholder="Enter your code here..."
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onKeyDown={handleKeyDown}
                                maxLength={100000}
                                className="w-full h-80 rounded-md pl-4 pr-3 py-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 transition-all"
                                style={{
                                    lineHeight: "1.5",
                                    backgroundColor: "var(--input-bg)",
                                    border: "1px solid var(--border-color)",
                                    color: "var(--foreground)",
                                }}
                            />
                        </div>

                        {/* Upload Zone — images + files in one */}
                        <div>
                            <div
                                className="rounded-md p-4 text-center cursor-pointer transition-all"
                                style={{
                                    backgroundColor: isDragging ? "var(--secondary-hover)" : "var(--input-bg)",
                                    border: isDragging ? "2px dashed var(--primary-color)" : "2px dashed var(--border-color)",
                                }}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <ImagePlus className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />
                                    <Paperclip className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />
                                </div>
                                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                                    {isDragging
                                        ? "Drop files here..."
                                        : "Drag & drop or click to add screenshots & files"}
                                </p>
                                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>
                                    Images, ZIP, PDF, TXT, and more · 10MB total
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>

                            {/* Screenshot Previews */}
                            {screenshots.length > 0 && (
                                <div className="flex gap-3 mt-3 flex-wrap">
                                    {screenshots.map((file, index) => (
                                        <div
                                            key={`ss-${index}`}
                                            className="relative group rounded-md overflow-hidden"
                                            style={{
                                                width: "100px",
                                                height: "100px",
                                                border: "1px solid var(--border-color)",
                                            }}
                                        >
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeScreenshot(index);
                                                }}
                                                className="absolute top-1 right-1 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{
                                                    backgroundColor: "rgba(0,0,0,0.7)",
                                                    color: "white",
                                                }}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                            <div
                                                className="absolute bottom-0 left-0 right-0 text-xs px-1 py-0.5 truncate"
                                                style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}
                                            >
                                                {formatSize(file.size)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* File List */}
                            {uploadFiles.length > 0 && (
                                <div className={`space-y-1.5 ${screenshots.length > 0 ? "mt-3" : "mt-3"}`}>
                                    {uploadFiles.map((file, index) => (
                                        <div
                                            key={`f-${index}`}
                                            className="flex items-center justify-between rounded-md px-3 py-2 text-sm"
                                            style={{
                                                backgroundColor: "var(--input-bg)",
                                                border: "1px solid var(--border-color)",
                                            }}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Paperclip className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                                                <span className="truncate" style={{ color: "var(--foreground)" }}>{file.name}</span>
                                                <span className="shrink-0 text-xs" style={{ color: "var(--muted-foreground)" }}>{formatSize(file.size)}</span>
                                            </div>
                                            <button
                                                onClick={() => removeUploadFile(index)}
                                                className="p-0.5 rounded transition-colors shrink-0 ml-2"
                                                style={{ color: "var(--muted-foreground)" }}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer: stats + buttons */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4">
                            <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                                {code.length.toLocaleString()} chars
                                {(screenshots.length > 0 || uploadFiles.length > 0) && (
                                    <span className="ml-2">
                                        · {formatSize(getTotalSize())} / 10MB
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handlePaste}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 gap-2 transition-colors focus:outline-none focus:ring-2 flex-1 sm:flex-none"
                                    style={{
                                        backgroundColor: "var(--secondary-color)",
                                        color: "var(--foreground)",
                                        border: "1px solid var(--border-color)",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = "var(--secondary-hover)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = "var(--secondary-color)";
                                    }}
                                >
                                    <Clipboard className="w-4 h-4" />
                                    Paste
                                </button>

                                <button
                                    onClick={handleCreate}
                                    disabled={isCreating}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 gap-2 transition-colors focus:outline-none focus:ring-2 flex-1 sm:flex-none"
                                    style={{
                                        backgroundColor: isCreating ? "var(--muted)" : "var(--primary-color)",
                                        color: "var(--foreground)",
                                        cursor: isCreating ? "not-allowed" : "pointer",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isCreating) {
                                            e.target.style.backgroundColor = "var(--primary-hover)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isCreating) {
                                            e.target.style.backgroundColor = "var(--primary-color)";
                                        }
                                    }}
                                >
                                    <LinkIcon className="w-4 h-4" />
                                    {isCreating ? "Creating..." : "Create Link"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
