import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Copy, Clock, Plus, Search, Image, Paperclip, Download, X, ImagePlus, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
const BLOCKED_EXTENSIONS = [".exe", ".msi", ".bat", ".cmd", ".com", ".scr", ".pif"];
const MAX_SCREENSHOTS = 5;
const MAX_FILES = 5;

const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
};

const formatTTL = (hours) => {
    if (!hours) return "";
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const rem = hours % 24;
    return rem === 0 ? `${days}d` : `${days}d ${rem}h`;
};

function getTimeRemaining(expiresAt) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h remaining`;
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
}

export default function RoomView() {
    const { code } = useParams();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Add entry form
    const [showForm, setShowForm] = useState(false);
    const [entryTitle, setEntryTitle] = useState("");
    const [entryCode, setEntryCode] = useState("");
    const [screenshots, setScreenshots] = useState([]);
    const [uploadFiles, setUploadFiles] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    // Lightbox
    const [lightbox, setLightbox] = useState(null); // { entryId, index }

    // Expanded code entries
    const [expandedEntries, setExpandedEntries] = useState({});

    const toggleExpand = (id) => setExpandedEntries((p) => ({ ...p, [id]: !p[id] }));

    const fetchRoom = async () => {
        try {
            setLoading(true);
            const result = await api.getRoom(code);
            setRoom(result.data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoom();
    }, [code]);

    // Upload handlers
    const getTotalUploadSize = () =>
        [...screenshots, ...uploadFiles].reduce((sum, f) => sum + f.size, 0);

    const addUploads = (incoming) => {
        if (!room) return;
        const maxAllowed = room.maxSize - room.totalSize;
        let runningSize = getTotalUploadSize();
        const newSS = [];
        const newFiles = [];

        for (const file of Array.from(incoming)) {
            const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
            if (BLOCKED_EXTENSIONS.includes(ext)) { toast.error(`${file.name}: Blocked.`); continue; }
            if (runningSize + file.size > maxAllowed) { toast.error(`Would exceed room storage.`); break; }

            const isImage = IMAGE_TYPES.includes(file.type);
            if (isImage && screenshots.length + newSS.length < MAX_SCREENSHOTS) newSS.push(file);
            else if (!isImage && uploadFiles.length + newFiles.length < MAX_FILES) newFiles.push(file);
            else { toast.error(`${file.name}: Limit reached.`); continue; }
            runningSize += file.size;
        }

        if (newSS.length) setScreenshots((p) => [...p, ...newSS]);
        if (newFiles.length) setUploadFiles((p) => [...p, ...newFiles]);
        const total = newSS.length + newFiles.length;
        if (total) toast.success(`${total} file${total > 1 ? "s" : ""} added`);
    };

    const handleAddEntry = async () => {
        if (!entryCode.trim() && screenshots.length === 0 && uploadFiles.length === 0) {
            toast.error("Add some code, screenshots, or files");
            return;
        }
        setIsAdding(true);
        try {
            await api.addRoomEntry(code, { code: entryCode.trim(), title: entryTitle || "Untitled" }, screenshots, uploadFiles);
            toast.success("Entry added!");
            setEntryTitle("");
            setEntryCode("");
            setScreenshots([]);
            setUploadFiles([]);
            setShowForm(false);
            await fetchRoom();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsAdding(false);
        }
    };

    const copyCode = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const downloadFile = async (url, filename) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } catch {
            toast.error("Download failed");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
                <div className="text-center" style={{ color: "var(--muted-foreground)" }}>
                    <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--primary-color)", borderTopColor: "transparent" }} />
                    <p>Joining room...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
                <div className="text-center space-y-4" style={{ color: "var(--foreground)" }}>
                    <h2 className="text-2xl font-bold">Room Not Found</h2>
                    <p style={{ color: "var(--muted-foreground)" }}>{error}</p>
                    <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium" style={{ backgroundColor: "var(--primary-color)", color: "var(--foreground)", textDecoration: "none" }}>
                        <Plus className="w-4 h-4" /> Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const usagePercent = room ? Math.min(100, (room.totalSize / room.maxSize) * 100) : 0;

    return (
        <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">

                {/* Room Header */}
                <div className="rounded-lg p-5" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{room.name}</h1>
                            <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
                                <span className="font-mono px-2 py-0.5 rounded" style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)" }}>
                                    {room.code}
                                </span>
                                <button onClick={() => copyCode(room.code)} className="hover:underline cursor-pointer" style={{ color: "var(--primary-color)" }}>Copy Code</button>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{getTimeRemaining(room.expiresAt)}</span>
                                <span className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: "var(--secondary-color)", border: "1px solid var(--border-color)" }}>{formatTTL(room.ttlHours)}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowForm((p) => !p)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                            style={{ backgroundColor: "var(--primary-color)", color: "var(--foreground)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-hover)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-color)"; }}
                        >
                            <Plus className="w-4 h-4" />
                            Add Entry
                        </button>
                    </div>

                    {/* Storage bar */}
                    <div>
                        <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                            <span>{formatSize(room.totalSize)} / {formatSize(room.maxSize)} used</span>
                            <span>{usagePercent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--input-bg)" }}>
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${usagePercent}%`,
                                    backgroundColor: usagePercent > 90 ? "var(--danger-color)" : "var(--primary-color)",
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Add Entry Form */}
                {showForm && (
                    <div className="rounded-lg p-5 space-y-4" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
                        <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>New Entry</h2>

                        <input
                            type="text"
                            placeholder="Title (optional)"
                            value={entryTitle}
                            onChange={(e) => setEntryTitle(e.target.value)}
                            maxLength={100}
                            className="w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
                            style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--foreground)" }}
                        />

                        <textarea
                            placeholder="Paste code here..."
                            value={entryCode}
                            onChange={(e) => setEntryCode(e.target.value)}
                            maxLength={100000}
                            className="w-full h-48 rounded-md pl-4 pr-3 py-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 transition-all"
                            style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--foreground)" }}
                        />

                        {/* Upload zone */}
                        <div
                            className="rounded-md p-3 text-center cursor-pointer transition-all"
                            style={{
                                backgroundColor: isDragging ? "var(--secondary-hover)" : "var(--input-bg)",
                                border: isDragging ? "2px dashed var(--primary-color)" : "2px dashed var(--border-color)",
                            }}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                            onDrop={(e) => { e.preventDefault(); setIsDragging(false); addUploads(e.dataTransfer.files); }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <ImagePlus className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                                <Paperclip className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                            </div>
                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                {isDragging ? "Drop here..." : "Add screenshots & files"}
                            </p>
                            <input ref={fileInputRef} type="file" multiple onChange={(e) => { if (e.target.files) { addUploads(e.target.files); e.target.value = ""; } }} className="hidden" />
                        </div>

                        {/* Preview thumbnails */}
                        {screenshots.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {screenshots.map((file, i) => (
                                    <div key={`ss-${i}`} className="relative group rounded overflow-hidden" style={{ width: "72px", height: "72px", border: "1px solid var(--border-color)" }}>
                                        <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                                        <button onClick={() => setScreenshots((p) => p.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "white" }}><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* File list */}
                        {uploadFiles.length > 0 && (
                            <div className="space-y-1">
                                {uploadFiles.map((file, i) => (
                                    <div key={`f-${i}`} className="flex items-center justify-between rounded px-2.5 py-1.5 text-xs" style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)" }}>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Paperclip className="w-3 h-3 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                                            <span className="truncate" style={{ color: "var(--foreground)" }}>{file.name}</span>
                                            <span className="shrink-0" style={{ color: "var(--muted-foreground)" }}>{formatSize(file.size)}</span>
                                        </div>
                                        <button onClick={() => setUploadFiles((p) => p.filter((_, j) => j !== i))} style={{ color: "var(--muted-foreground)" }}><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                {getTotalUploadSize() > 0 && `${formatSize(getTotalUploadSize())} selected`}
                            </span>
                            <button
                                onClick={handleAddEntry}
                                disabled={isAdding}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors"
                                style={{ backgroundColor: isAdding ? "var(--muted)" : "var(--primary-color)", color: "var(--foreground)", cursor: isAdding ? "not-allowed" : "pointer" }}
                            >
                                {isAdding ? "Adding..." : "Submit Entry"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Entries */}
                {room.entries.length === 0 && !showForm ? (
                    <div className="text-center py-12" style={{ color: "var(--muted-foreground)" }}>
                        <p className="text-lg mb-2">No entries yet</p>
                        <p className="text-sm">Click "Add Entry" to share something in this room</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {room.entries.map((entry) => (
                            <div key={entry.id} className="rounded-lg p-5 space-y-3" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
                                <div className="flex justify-between items-center">
                                    <h3 className="font-medium" style={{ color: "var(--foreground)" }}>{entry.title}</h3>
                                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                        {new Date(entry.createdAt).toLocaleString()}
                                        {entry.entrySize > 0 && ` · ${formatSize(entry.entrySize)}`}
                                    </span>
                                </div>

                                {/* Code */}
                                {entry.code && (
                                    <div className="relative">
                                        <div
                                            className="rounded-md cursor-pointer transition-all"
                                            style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)" }}
                                            onClick={() => toggleExpand(entry.id)}
                                        >
                                            {expandedEntries[entry.id] ? (
                                                <pre className="overflow-auto p-3 font-mono text-sm" style={{ color: "var(--foreground)", maxHeight: "500px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                    <code>{entry.code}</code>
                                                </pre>
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-2.5">
                                                    <code className="font-mono text-sm truncate flex-1" style={{ color: "var(--foreground)" }}>
                                                        {entry.code.split("\n")[0]}
                                                    </code>
                                                    <Eye className="w-4 h-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); copyCode(entry.code); }}
                                            className="absolute top-2 right-2 p-1.5 rounded-md text-xs transition-colors"
                                            style={{ backgroundColor: "var(--secondary-color)", color: "var(--foreground)", border: "1px solid var(--border-color)" }}
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}

                                {/* Screenshots */}
                                {entry.screenshots && entry.screenshots.length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                        {entry.screenshots.map((ss, i) => (
                                            <div key={i} className="relative group" style={{ width: "120px", height: "90px" }}>
                                                <img
                                                    src={api.getRoomScreenshotUrl(room.code, entry.id, i)}
                                                    alt={ss.name}
                                                    className="rounded cursor-pointer object-cover hover:opacity-80 transition-opacity w-full h-full"
                                                    style={{ border: "1px solid var(--border-color)" }}
                                                    onClick={() => setLightbox({ entryId: entry.id, index: i })}
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        downloadFile(api.getRoomScreenshotUrl(room.code, entry.id, i), ss.name);
                                                    }}
                                                    className="absolute bottom-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                    style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "white" }}
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Files */}
                                {entry.files && entry.files.length > 0 && (
                                    <div className="space-y-1">
                                        {entry.files.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between rounded px-3 py-2" style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)" }}>
                                                <div className="flex items-center gap-2 min-w-0 text-sm">
                                                    <Paperclip className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                                                    <span className="truncate" style={{ color: "var(--foreground)" }}>{file.name}</span>
                                                    <span className="text-xs shrink-0" style={{ color: "var(--muted-foreground)" }}>{formatSize(file.size)}</span>
                                                </div>
                                                <button
                                                    onClick={() => downloadFile(api.getRoomFileUrl(room.code, entry.id, i), file.name)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium shrink-0 ml-2 cursor-pointer"
                                                    style={{ backgroundColor: "var(--primary-color)", color: "var(--foreground)" }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-hover)"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-color)"; }}
                                                >
                                                    <Download className="w-3 h-3" /> Download
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                    <p style={{ color: "var(--muted-foreground)" }}>
                        Created on {new Date(room.createdAt).toLocaleString()} · Expires on {new Date(room.expiresAt).toLocaleString()} · {room.entries.length} entries
                    </p>
                </div>
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
                    onClick={() => setLightbox(null)}
                >
                    <button
                        className="absolute top-4 right-4 z-[60] p-2 rounded-full cursor-pointer"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
                        onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <button
                        className="absolute top-4 right-16 z-[60] p-2 rounded-full cursor-pointer"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            const ss = room.entries.find(en => en.id === lightbox.entryId)?.screenshots?.[lightbox.index];
                            if (ss) downloadFile(api.getRoomScreenshotUrl(room.code, lightbox.entryId, lightbox.index), ss.name);
                        }}
                    >
                        <Download className="w-6 h-6" />
                    </button>
                    <img
                        src={api.getRoomScreenshotUrl(room.code, lightbox.entryId, lightbox.index)}
                        alt="Screenshot"
                        className="max-w-full max-h-[90vh] rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
