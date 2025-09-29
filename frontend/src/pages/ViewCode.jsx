import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Copy, Eye, Calendar, FileText, Plus, Clock } from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

export default function ViewCode() {
    const { id } = useParams();
    const [gist, setGist] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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
                    <p style={{ color: "var(--muted-foreground)" }}>{error}</p>
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
                            <div className="flex items-center gap-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
                                {/* <div className="flex items-center gap-1">
                                    <FileText className="w-4 h-4" />
                                    {gist.fileName}
                                </div> */}
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(gist.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    ID: {gist.id}
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
                                <Clock className="w-4 h-4" />
                                Recent
                            </Link>
                        </div>
                    </div>

                    {/* Code Display */}
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

                    {/* Footer Info */}
                    <div
                        className="rounded-lg p-4 text-sm"
                        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)" }}
                    >
                        <p style={{ color: "var(--muted-foreground)" }}>
                            This code snippet was created on {new Date(gist.createdAt).toLocaleString()} and will expire on{" "}
                            {new Date(gist.expiresAt).toLocaleString()}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
