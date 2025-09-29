import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Link as LinkIcon, Clipboard, Clock } from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

export default function CreateCode() {
    const navigate = useNavigate();
    const [description, setDescription] = useState("");
    const [filename, setFilename] = useState("");
    const [code, setCode] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!code.trim()) {
            toast.error("Please enter some code before creating a link");
            return;
        }

        setIsCreating(true);

        try {
            const gistData = {
                code: code.trim(),
                title: description || "Untitled",
                // fileName: filename || "untitled.txt",
            };

            const result = await api.createGist(gistData);

            toast.success("Code snippet created successfully!");

            // Copy link to clipboard
            const shareLink = `${window.location.origin}/code/${result.data.id}`;
            try {
                await navigator.clipboard.writeText(shareLink);
                toast.info("Link copied to clipboard!");
            } catch (clipboardError) {
                console.warn("Failed to copy to clipboard:", clipboardError);
            }

            // Navigate to the created gist
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
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
                                Create New Code Share
                            </h1>
                            <p style={{ color: "var(--muted-foreground)" }}>Share your code with your classmates easily</p>
                        </div>
                        <Link
                            to="/recent"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium"
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
                            Recent Pastes
                        </Link>
                    </div>

                    <div
                        className="rounded-lg p-6 space-y-4"
                        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}
                    >
                        <div>
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
                                    focusRingColor: "var(--primary-color)",
                                }}
                            />
                        </div>

                        {/* <div>
                            <input
                                type="text"
                                placeholder="Filename including extension (Optional)"
                                value={filename}
                                onChange={(e) => setFilename(e.target.value)}
                                className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 transition-all"
                                style={{
                                    backgroundColor: "var(--input-bg)",
                                    border: "1px solid var(--border-color)",
                                    color: "var(--foreground)",
                                    focusRingColor: "var(--primary-color)",
                                }}
                            />
                        </div> */}

                        <div className="relative">
                            <textarea
                                placeholder="Enter your code here..."
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full h-80 rounded-md pl-4 pr-3 py-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 transition-all"
                                style={{
                                    lineHeight: "1.5",
                                    backgroundColor: "var(--input-bg)",
                                    border: "1px solid var(--border-color)",
                                    color: "var(--foreground)",
                                    focusRingColor: "var(--primary-color)",
                                }}
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                                {code.length.toLocaleString()} / 100,000 characters
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handlePaste}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 gap-2 transition-colors focus:outline-none focus:ring-2"
                                    style={{
                                        backgroundColor: "var(--secondary-color)",
                                        color: "var(--foreground)",
                                        border: "1px solid var(--border-color)",
                                        minWidth: "120px",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = "var(--secondary-hover)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = "var(--secondary-color)";
                                    }}
                                >
                                    <Clipboard className="w-4 h-4" />
                                    Paste Code
                                </button>

                                <button
                                    onClick={handleCreate}
                                    disabled={isCreating}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 gap-2 transition-colors focus:outline-none focus:ring-2"
                                    style={{
                                        backgroundColor: isCreating ? "var(--muted)" : "var(--primary-color)",
                                        color: "var(--foreground)",
                                        cursor: isCreating ? "not-allowed" : "pointer",
                                        minWidth: "120px",
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
