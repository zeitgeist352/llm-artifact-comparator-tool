import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Flag, FilePenLine, FileDown, Send, X } from "lucide-react";

function ArtifactDetailPage() {
    const navigate = useNavigate();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [message, setMessage] = useState("");
    const [showReport, setShowReport] = useState(false);
    const [showSuggest, setShowSuggest] = useState(false);
    const [report, setReport] = useState({ reason: "", description: "" });
    const [suggestion, setSuggestion] = useState({ type: "grammar", text: "" });

    const handleSubmit = () => {
        if (rating === 0 || comment.trim() === "") {
            setMessage("⚠️ Please provide both rating and comment!");
            return;
        }
        setMessage("✅ Evaluation submitted successfully (mock)!");
        setRating(0);
        setComment("");
    };

    const handleReportSubmit = () => {
        setShowReport(false);
        alert(`🚩 Report submitted (mock):\nReason: ${report.reason}\nDescription: ${report.description}`);
        setReport({ reason: "", description: "" });
    };

    const handleSuggestSubmit = () => {
        setShowSuggest(false);
        alert(`✍️ Suggestion submitted (mock):\nType: ${suggestion.type}\nText: ${suggestion.text}`);
        setSuggestion({ type: "grammar", text: "" });
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate("/demo/evaluate-list")}>
                    <ArrowLeft size={18} /> Back
                </button>
                <h2 style={styles.title}>User Interface Comparison</h2>
                <p style={styles.subtitle}>Compare UI layouts for usability and clarity.</p>
            </div>

            {/* Content */}
            <div style={styles.main}>
                {/* Artifact Preview */}
                <div style={styles.previewBox}>
                    <h3 style={styles.previewTitle}>Artifact Content</h3>
                    <div style={styles.previewContent}>
                        <p>
                            “This mock artifact presents two versions of a user interface layout.
                            Participants are expected to rate clarity, usability, and alignment
                            of the visual components.”
                        </p>
                    </div>
                </div>

                {/* Evaluation Panel */}
                <div style={styles.panel}>
                    <h3 style={styles.panelTitle}>Your Evaluation</h3>

                    {/* Rating */}
                    <div style={styles.ratingSection}>
                        {[1, 2, 3, 4, 5].map((val) => (
                            <Star
                                key={val}
                                size={28}
                                color={val <= rating ? "#facc15" : "#555"}
                                fill={val <= rating ? "#facc15" : "transparent"}
                                style={{ cursor: "pointer", transition: "0.2s" }}
                                onClick={() => setRating(val)}
                            />
                        ))}
                    </div>

                    {/* Comment */}
                    <textarea
                        placeholder="Write your comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        style={styles.textarea}
                    />

                    <button style={styles.submitBtn} onClick={handleSubmit}>
                        <Send size={18} style={{ marginRight: "6px" }} /> Submit Evaluation
                    </button>

                    {message && <div style={styles.message}>{message}</div>}

                    {/* Actions */}
                    <div style={styles.actionRow}>
                        <button style={styles.actionBtn} onClick={() => setShowReport(true)}>
                            <Flag size={16} /> Report
                        </button>
                        <button style={styles.actionBtn} onClick={() => setShowSuggest(true)}>
                            <FilePenLine size={16} /> Suggest Correction
                        </button>
                        <button style={styles.actionBtn}>
                            <FileDown size={16} /> Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            {showReport && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>🚩 Report Artifact</h3>
                            <X style={styles.closeIcon} onClick={() => setShowReport(false)} />
                        </div>
                        <label style={styles.label}>Reason</label>
                        <input
                            type="text"
                            placeholder="Enter reason..."
                            value={report.reason}
                            onChange={(e) => setReport({ ...report, reason: e.target.value })}
                            style={styles.input}
                        />
                        <label style={styles.label}>Description</label>
                        <textarea
                            placeholder="Describe the issue..."
                            value={report.description}
                            onChange={(e) => setReport({ ...report, description: e.target.value })}
                            style={styles.textarea}
                        />
                        <button style={styles.modalBtn} onClick={handleReportSubmit}>
                            Submit Report
                        </button>
                    </div>
                </div>
            )}

            {/* Suggest Modal */}
            {showSuggest && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>✍️ Suggest Correction</h3>
                            <X style={styles.closeIcon} onClick={() => setShowSuggest(false)} />
                        </div>

                        {/* Type Selection */}
                        <label style={styles.label}>Type</label>
                        <select
                            value={suggestion.type}
                            onChange={(e) => setSuggestion({ ...suggestion, type: e.target.value })}
                            style={styles.select}
                        >
                            <option value="grammar">Grammar</option>
                            <option value="content">Content</option>
                        </select>

                        {/* Suggestion Text */}
                        <label style={styles.label}>Explanation</label>
                        <textarea
                            placeholder="Explain what should be corrected..."
                            value={suggestion.text}
                            onChange={(e) => setSuggestion({ ...suggestion, text: e.target.value })}
                            style={styles.textarea}
                        />

                        {/* 🆕 Edited Version */}
                        <label style={styles.label}>Edited Version (optional)</label>
                        <div style={styles.editBoxContainer}>
                            <div style={styles.originalBox}>
                                <strong>Original:</strong>
                                <p style={styles.originalText}>
                                    “This mock artifact presents two versions of a user interface layout...”
                                </p>
                            </div>
                            <textarea
                                placeholder="Write your improved version here..."
                                value={suggestion.editedVersion || ""}
                                onChange={(e) => setSuggestion({ ...suggestion, editedVersion: e.target.value })}
                                style={styles.editedTextarea}
                            />
                        </div>

                        <button
                            style={styles.modalBtn}
                            onClick={() => {
                                setShowSuggest(false);
                                alert(`✍️ Suggestion submitted (mock):
Type: ${suggestion.type}
Text: ${suggestion.text}
Edited Version: ${suggestion.editedVersion || "N/A"}`);
                                setSuggestion({ type: "grammar", text: "", editedVersion: "" });
                            }}
                        >
                            Submit Suggestion
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* --- STYLES --- */
const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
        padding: "40px",
        position: "relative",
    },
    header: { textAlign: "center", marginBottom: "30px" },
    backBtn: {
        position: "absolute",
        left: "40px",
        top: "40px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.7)",
        padding: "6px 12px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        cursor: "pointer",
    },
    title: {
        fontSize: "2rem",
        fontWeight: "800",
        background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    subtitle: { color: "rgba(255,255,255,0.6)", fontSize: "1rem" },
    main: {
        display: "flex",
        gap: "40px",
        justifyContent: "center",
        flexWrap: "wrap",
        maxWidth: "1200px",
        margin: "0 auto",
    },
    previewBox: {
        flex: 1,
        minWidth: "400px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(6,182,212,0.3)",
        borderRadius: "16px",
        padding: "20px",
    },
    previewTitle: { fontWeight: "700", marginBottom: "10px" },
    previewContent: { color: "rgba(255,255,255,0.75)", lineHeight: "1.6" },
    panel: {
        flex: 1,
        minWidth: "400px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: "16px",
        padding: "20px",
    },
    panelTitle: { fontWeight: "700", marginBottom: "10px" },
    ratingSection: { display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" },
    textarea: {
        width: "100%",
        minHeight: "100px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "10px",
        color: "#fff",
        padding: "10px",
        fontFamily: "inherit",
        fontSize: "0.95rem",
        resize: "none",
        marginBottom: "15px",
    },
    submitBtn: {
        background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
        color: "#fff",
        border: "none",
        padding: "10px 20px",
        borderRadius: "12px",
        fontWeight: "700",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        marginBottom: "15px",
    },
    message: { color: "#a5b4fc", textAlign: "center", marginBottom: "10px" },
    actionRow: { display: "flex", justifyContent: "space-between", marginTop: "20px" },
    actionBtn: {
        flex: 1,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.8)",
        padding: "10px",
        borderRadius: "10px",
        margin: "0 5px",
        cursor: "pointer",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
    },
    /* --- MODALS --- */
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    modal: {
        width: "420px",
        background: "rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding: "24px",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.15)",
    },
    modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" },
    modalTitle: { fontSize: "1.2rem", fontWeight: "700" },
    closeIcon: { cursor: "pointer", color: "rgba(255,255,255,0.6)" },
    label: { fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", marginBottom: "5px", display: "block" },
    input: {
        width: "100%",
        padding: "10px",
        marginBottom: "15px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.05)",
        color: "#fff",
    },
    select: {
        width: "100%",
        padding: "10px",
        marginBottom: "15px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.05)",
        color: "#fff",
    },
    modalBtn: {
        background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
        color: "#fff",
        border: "none",
        padding: "10px",
        borderRadius: "10px",
        fontWeight: "700",
        width: "100%",
        cursor: "pointer",
    },
    editBoxContainer: {
        marginTop: "10px",
        marginBottom: "15px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "10px",
        padding: "10px",
    },
    originalBox: {
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        padding: "8px 10px",
        marginBottom: "10px",
    },
    originalText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: "0.9rem",
        marginTop: "5px",
    },
    editedTextarea: {
        width: "100%",
        height: "80px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "8px",
        color: "#fff",
        padding: "8px",
        fontFamily: "inherit",
        fontSize: "0.9rem",
        resize: "none",
    },

};

export default ArtifactDetailPage;
