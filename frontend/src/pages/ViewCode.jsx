import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Copy, Calendar, Clock, Plus, Search, Image, Paperclip, Download, X } from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

const formatTTL = (hours) => {
    if (!hours) return "";
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const rem = hours % 24;
    return rem === 0 ? `${days}d` : `${days}d ${rem}h`;
};

const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
};

function getTimeRemaining(expiresAt) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h remaining`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
}

export default function ViewCode() {
    const { id } = useParams();
    const [gist, setGist] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    useEffect(() => {
        const fetchGist = async () => {
            try {
                setIsLoading(true);
                const result = await api.getGist(id);
                setGist(result.data);
            } catch (err) {
                setError(err.message);
                toast.error("Failed to load code snippet");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchGist();
        }
    }, [id]);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(gist.code);
            toast.success("Code copied to clipboard!");
        } catch (err) {
            toast.error("Failed to copy code");
        }
    };

    const copyLink = async () => {
        try {
            const currentUrl = window.location.href;
            await navigator.clipboard.writeText(currentUrl);
            toast.success("Link copied to clipboard!");
        } catch (err) {
            toast.error("Failed to copy link");
        }
    };

    const downloadFile = async (url, filename) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Download failed");
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Failed to download file");
        }
    };

    if (isLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
            >
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                        style={{ borderColor: "var(--primary-color)" }}
                    ></div>
                    <p style={{ color: "var(--muted-foreground)" }}>Loading code snippet...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
            >
                <div className="text-center">
                    <div className="text-6xl mb-4" style={{ color: "var(--danger-color)" }}>
                        ⚠️
                    </div>
                    <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
                        Code Not Found
                    </h1>
                    <p className="mb-4" style={{ color: "var(--muted-foreground)" }}>{error}</p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
                        style={{
                            backgroundColor: "var(--primary-color)",
                            color: "var(--foreground)",
                            textDecoration: "none",
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        Create New
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
        >
            <div className="w-full max-w-4xl px-4 py-8">
                <div className="mb-6 outline-none"></div>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
                                {gist.title || "Untitled"}
                            </h1>
                            <div className="flex items-center gap-4 text-sm flex-wrap" style={{ color: "var(--muted-foreground)" }}>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(gist.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Copy className="w-4 h-4" />
                                    ID: {gist.id}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(gist.id);
                                            toast.success("ID copied!");
                                        }}
                                        className="ml-1 p-1 rounded transition-colors"
                                        style={{
                                            backgroundColor: "var(--secondary-color)",
                                            border: "1px solid var(--border-color)",
                                            cursor: "pointer",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = "var(--secondary-hover)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = "var(--secondary-color)";
                                        }}
                                        title="Copy ID"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {getTimeRemaining(gist.expiresAt)}
                                    {gist.ttlHours && (
                                        <span className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: "var(--secondary-color)", border: "1px solid var(--border-color)" }}>
                                            {formatTTL(gist.ttlHours)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium"
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
                                <Plus className="w-4 h-4" />
                                New
                            </Link>
                            <Link
                                to="/recent"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium"
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
                    </div>

                    {/* Code Display — only shown if paste has code */}
                    {gist.code && (
                    <div
                        className="rounded-lg p-6 space-y-4"
                        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                                Code
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={copyToClipboard}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 gap-2 transition-colors"
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
                                    <Copy className="w-4 h-4" />
                                    Copy Code
                                </button>
                                <button
                                    onClick={copyLink}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 gap-2 transition-colors"
                                    style={{
                                        backgroundColor: "var(--primary-color)",
                                        color: "var(--foreground)",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = "var(--primary-hover)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = "var(--primary-color)";
                                    }}
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy Link
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <pre
                                className="overflow-auto rounded-md p-4 font-mono text-sm"
                                style={{
                                    backgroundColor: "var(--input-bg)",
                                    border: "1px solid var(--border-color)",
                                    color: "var(--foreground)",
                                    maxHeight: "600px",
                                }}
                            >
                                <code>{gist.code}</code>
                            </pre>
                        </div>
                    </div>
                    )}

                    {/* Screenshots Gallery */}
                    {gist.screenshots && gist.screenshots.length > 0 && (
                        <div
                            className="rounded-lg p-6 space-y-4"
                            style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}
                        >
                            <div className="flex items-center gap-2">
                                <Image className="w-5 h-5" style={{ color: "var(--foreground)" }} />
                                <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                                    Screenshots ({gist.screenshots.length})
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {gist.screenshots.map((screenshot, index) => (
                                    <div
                                        key={index}
                                        className="relative rounded-md overflow-hidden group"
                                        style={{ border: "1px solid var(--border-color)" }}
                                    >
                                        <img
                                            src={api.getScreenshotUrl(gist.id, index)}
                                            alt={screenshot.name}
                                            className="w-full h-40 object-cover cursor-pointer transition-transform group-hover:scale-105"
                                            loading="lazy"
                                            onClick={() => setLightboxIndex(index)}
                                        />
                                        <div
                                            className="absolute bottom-0 left-0 right-0 text-xs px-2 py-1 truncate pointer-events-none"
                                            style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}
                                        >
                                            {screenshot.name} · {(screenshot.size / 1024).toFixed(0)}KB
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                downloadFile(api.getScreenshotUrl(gist.id, index), screenshot.name);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                                            style={{ backgroundColor: "var(--primary-color)", color: "var(--foreground)" }}
                                            title="Download Image"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* Files */}
                    {gist.files && gist.files.length > 0 && (
                        <div
                            className="rounded-lg p-6 space-y-3"
                            style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}
                        >
                            <div className="flex items-center gap-2">
                                <Paperclip className="w-5 h-5" style={{ color: "var(--foreground)" }} />
                                <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                                    Files ({gist.files.length})
                                </h2>
                            </div>
                            <div className="space-y-1.5">
                                {gist.files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between rounded-md px-3 py-2.5"
                                        style={{
                                            backgroundColor: "var(--input-bg)",
                                            border: "1px solid var(--border-color)",
                                        }}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Paperclip className="w-4 h-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                                            <span className="text-sm truncate" style={{ color: "var(--foreground)" }}>{file.name}</span>
                                            <span className="text-xs shrink-0" style={{ color: "var(--muted-foreground)" }}>{formatSize(file.size)}</span>
                                        </div>
                                        <button
                                            onClick={() => downloadFile(api.getFileUrl(gist.id, index), file.name)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ml-2 cursor-pointer"
                                            style={{
                                                backgroundColor: "var(--primary-color)",
                                                color: "var(--foreground)",
                                                border: "none"
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-hover)"; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-color)"; }}
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div
                        className="rounded-lg p-4 text-sm"
                        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)" }}
                    >
                        <p style={{ color: "var(--muted-foreground)" }}>
                            Created on {new Date(gist.createdAt).toLocaleString()} · Expires on{" "}
                            {new Date(gist.expiresAt).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxIndex !== null && gist.screenshots && gist.screenshots[lightboxIndex] && (
                <div
                    className="fixed inset-0 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 60 }}
                    onClick={() => setLightboxIndex(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full cursor-pointer hover:bg-white/20 transition-colors"
                        style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={api.getScreenshotUrl(gist.id, lightboxIndex)}
                        alt={gist.screenshots[lightboxIndex].name}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div
                        className="absolute bottom-4 flex flex-col items-center gap-2"
                        style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                        <div className="text-sm">
                            {gist.screenshots[lightboxIndex].name} · {lightboxIndex + 1}/{gist.screenshots.length}
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                downloadFile(api.getScreenshotUrl(gist.id, lightboxIndex), gist.screenshots[lightboxIndex].name);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                            style={{ backgroundColor: "var(--primary-color)", color: "var(--foreground)" }}
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
