import React, { useState } from "react";
import { Check, X, FilePenLine, Flag, Users } from "lucide-react";

function ResearcherReviewDashboard() {
    const [activeTab, setActiveTab] = useState("suggestions");
    const [message, setMessage] = useState("");

    // Mock data
    const mockSuggestions = [
        {
            id: 1,
            participant: "Betül Aslan",
            artifact: "User Interface Comparison",
            type: "Content",
            text: "Intro paragraph could be more concise.",
            original: "This mock artifact presents two versions...",
            edited: "This artifact compares two UI layouts for clarity and usability.",
            status: "Pending",
        },
        {
            id: 2,
            participant: "Ali Demir",
            artifact: "Research Paper Draft",
            type: "Grammar",
            text: "Fix grammar in the second paragraph.",
            original: "Participants was instructed to rate.",
            edited: "Participants were instructed to rate.",
            status: "Pending",
        },
    ];

    const mockReports = [
        {
            id: 1,
            participant: "Zeynep Kaya",
            artifact: "AI Generated Summary",
            reason: "Inappropriate language",
            description: "The summary includes unprofessional wording.",
            status: "Pending",
        },
    ];

    const handleAction = (type, id, decision) => {
        setMessage(`${type} #${id} marked as ${decision} ✅ (mock)`);
        setTimeout(() => setMessage(""), 2500);
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Researcher Review Dashboard</h2>
            <p style={styles.subtitle}>Manage reports, suggestions, and participant feedback.</p>

            {/* Tabs */}
            <div style={styles.tabs}>
                <button
                    style={activeTab === "suggestions" ? styles.activeTab : styles.tab}
                    onClick={() => setActiveTab("suggestions")}
                >
                    <FilePenLine size={16} /> Suggestions
                </button>
                <button
                    style={activeTab === "reports" ? styles.activeTab : styles.tab}
                    onClick={() => setActiveTab("reports")}
                >
                    <Flag size={16} /> Reports
                </button>
                <button
                    style={activeTab === "comparison" ? styles.activeTab : styles.tab}
                    onClick={() => setActiveTab("comparison")}
                >
                    <Users size={16} /> Compare Participants
                </button>
            </div>

            {message && <div style={styles.message}>{message}</div>}

            {/* Suggestions Panel */}
            {activeTab === "suggestions" && (
                <div style={styles.grid}>
                    {mockSuggestions.map((s) => (
                        <div key={s.id} style={styles.card}>
                            <h3 style={styles.cardTitle}>{s.artifact}</h3>
                            <p style={styles.meta}>
                                <strong>Participant:</strong> {s.participant} | <strong>Type:</strong> {s.type}
                            </p>
                            <p style={styles.text}><strong>Suggestion:</strong> {s.text}</p>
                            <div style={styles.versionBox}>
                                <div style={styles.subBox}>
                                    <strong>Original:</strong>
                                    <p style={styles.original}>{s.original}</p>
                                </div>
                                <div style={styles.subBox}>
                                    <strong>Edited:</strong>
                                    <p style={styles.edited}>{s.edited}</p>
                                </div>
                            </div>
                            <div style={styles.actionRow}>
                                <button style={styles.approveBtn} onClick={() => handleAction("Suggestion", s.id, "Approved")}>
                                    <Check size={16} /> Approve
                                </button>
                                <button style={styles.rejectBtn} onClick={() => handleAction("Suggestion", s.id, "Rejected")}>
                                    <X size={16} /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reports Panel */}
            {activeTab === "reports" && (
                <div style={styles.grid}>
                    {mockReports.map((r) => (
                        <div key={r.id} style={styles.card}>
                            <h3 style={styles.cardTitle}>{r.artifact}</h3>
                            <p style={styles.meta}>
                                <strong>Participant:</strong> {r.participant}
                            </p>
                            <p><strong>Reason:</strong> {r.reason}</p>
                            <p><strong>Description:</strong> {r.description}</p>
                            <div style={styles.actionRow}>
                                <button style={styles.approveBtn} onClick={() => handleAction("Report", r.id, "Reviewed")}>
                                    <Check size={16} /> Mark Reviewed
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Comparison Panel */}
            {activeTab === "comparison" && (
                <div style={styles.comparisonBox}>
                    <h3>Participant Comparison</h3>
                    <table style={styles.table}>
                        <thead>
                        <tr>
                            <th>Participant</th>
                            <th>Avg Rating</th>
                            <th>Comments</th>
                            <th>Suggestions</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>Betül Aslan</td>
                            <td>4.6</td>
                            <td>12</td>
                            <td>3</td>
                        </tr>
                        <tr>
                            <td>Ali Demir</td>
                            <td>4.2</td>
                            <td>8</td>
                            <td>2</td>
                        </tr>
                        <tr>
                            <td>Zeynep Kaya</td>
                            <td>3.9</td>
                            <td>10</td>
                            <td>1</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
        padding: "40px",
    },
    title: {
        fontSize: "2rem",
        fontWeight: "800",
        background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    subtitle: { color: "rgba(255,255,255,0.6)", marginBottom: "20px" },
    tabs: { display: "flex", gap: "12px", marginBottom: "20px" },
    tab: {
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "10px",
        padding: "10px 16px",
        color: "rgba(255,255,255,0.7)",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        cursor: "pointer",
    },
    activeTab: {
        background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
        borderRadius: "10px",
        padding: "10px 16px",
        color: "#fff",
        fontWeight: "700",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        cursor: "pointer",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "20px",
    },
    card: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "20px",
        backdropFilter: "blur(10px)",
    },
    cardTitle: { fontWeight: "700", marginBottom: "10px" },
    meta: { color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", marginBottom: "10px" },
    text: { color: "rgba(255,255,255,0.85)", marginBottom: "10px" },
    versionBox: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginBottom: "10px",
    },
    subBox: {
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        padding: "8px",
    },
    original: { color: "#fca5a5", fontSize: "0.9rem" },
    edited: { color: "#86efac", fontSize: "0.9rem" },
    actionRow: {
        display: "flex",
        gap: "10px",
        justifyContent: "space-between",
    },
    approveBtn: {
        flex: 1,
        background: "rgba(34,197,94,0.15)",
        border: "1px solid rgba(34,197,94,0.4)",
        color: "#4ade80",
        borderRadius: "10px",
        padding: "8px",
        cursor: "pointer",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
    },
    rejectBtn: {
        flex: 1,
        background: "rgba(239,68,68,0.15)",
        border: "1px solid rgba(239,68,68,0.4)",
        color: "#f87171",
        borderRadius: "10px",
        padding: "8px",
        cursor: "pointer",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
    },
    comparisonBox: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "20px",
        backdropFilter: "blur(10px)",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "10px",
    },
    message: {
        background: "rgba(255,255,255,0.08)",
        padding: "10px 15px",
        borderRadius: "10px",
        color: "#93c5fd",
        marginBottom: "20px",
        textAlign: "center",
    },
};

export default ResearcherReviewDashboard;
