// CreateStudyPage.js — FINAL VERSION WITH FIXED CUSTOM FLOW (NO BACKEND CALL BEFORE TEMPLATE)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function CreateStudyPage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [studyType, setStudyType] = useState("BUG_CATEGORIZATION");
    const [loading, setLoading] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [particles, setParticles] = useState([]);

    const [hoveredType, setHoveredType] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, direction: "right" });

    const navigate = useNavigate();

    /* ---------------- DEFAULT ARTIFACT COUNTS ---------------- */
    const DEFAULT_COUNTS = {
        BUG_CATEGORIZATION: 1,
        CODE_CLONE: 2,
        SNAPSHOT_TESTING: 3,
        SOLID_DETECTION: 1,
    };

    /* ---------------- PARTICLES (MyStudiesPage ile aynı) ---------------- */
    useEffect(() => {
        const generated = [...Array(55)].map(() => ({
            id: crypto.randomUUID(),
            left: Math.random() * 100,
            top: Math.random() * 100,
            delay: -(Math.random() * 15).toFixed(2),
            duration: 16 + Math.random() * 10,
        }));
        setParticles(generated);
    }, []);

    /* ---------------- TOAST ---------------- */
    const showToast = (text, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, text, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    };

    /* ---------------- SUBMIT ---------------- */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (title.trim().length < 3 || description.trim().length < 10) {
            showToast(
                "⚠️ Title must be at least 3 characters and description must be at least 10 characters.",
                "error"
            );
            return;
        }

        /* 🌟 CUSTOM STUDY → backend'e dokunmadan template sayfasına git */
        if (studyType === "CUSTOM") {
            navigate("/create/custom-template", {
                state: { title, description, studyType }
            });
            return;
        }

        /* 🌟 NORMAL STUDY CREATE */
        setLoading(true);

        try {
            const token = localStorage.getItem("token");

            const payload = {
                title,
                description,
                studyType,
                artifactCountPerTask: DEFAULT_COUNTS[studyType],
            };

            const response = await fetch("http://localhost:8080/api/studies/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Create failed");

            showToast("✅ Study created successfully!");
            setTimeout(() => navigate("/researcher"), 1200);

        } catch (err) {
            console.error(err);
            showToast("❌ Failed to create study.", "error");
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- STUDY TYPES ---------------- */
    const studyTypes = [
        {
            value: "BUG_CATEGORIZATION",
            label: "Bug Categorization",
            base: "#60a5fa",
            desc: "Participants categorize software bugs into predefined categories.",
        },
        {
            value: "CODE_CLONE",
            label: "Code Clone Detection",
            base: "#a78bfa",
            desc: "Participants identify similar or duplicated source code segments.",
        },
        {
            value: "SNAPSHOT_TESTING",
            label: "Snapshot Testing",
            base: "#34d399",
            desc: "Participants compare screenshots and detect unexpected changes.",
        },
        {
            value: "SOLID_DETECTION",
            label: "SOLID Principle Detection",
            base: "#facc15",
            desc: "Participants detect SOLID principle violations.",
        },
        {
            value: "CUSTOM",
            label: "Custom Study",
            base: "#f87171",
            desc: "Fully customizable study created by the researcher.",
        },
    ];

    /* ---------------- TOOLTIP POSITION ---------------- */
    const handleMouseMove = (e) => {
        let direction = e.clientX > window.innerWidth * 0.6 ? "right" : "left";
        setTooltipPos({ x: e.clientX, y: e.clientY, direction });
    };

    return (
        <div style={styles.container} onMouseMove={handleMouseMove}>

            {/* PARTICLES */}
            <div style={styles.particles}>
                {particles.map((p) => (
                    <div
                        key={p.id}
                        style={{
                            ...styles.particle,
                            left: `${p.left}%`,
                            top: `${p.top}vh`,
                            animationDelay: `${p.delay}s`,
                            animationDuration: `${p.duration}s`,
                        }}
                    />
                ))}
            </div>

            {/* TOASTS */}
            <div style={styles.toastContainer}>
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        style={{
                            ...styles.toast,
                            ...(t.type === "success"
                                ? styles.toastSuccess
                                : styles.toastError),
                        }}
                    >
                        {t.text}
                    </div>
                ))}
            </div>

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>Create New Study</h2>
                <button
                    className="back-btn"
                    style={styles.backButton}
                    onClick={() => navigate("/researcher")}
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* CARD */}
            <div style={styles.card}>
                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* TITLE */}
                    <label style={styles.label}>Study Title *</label>
                    <input
                        type="text"
                        placeholder="Enter study title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={styles.input}
                        disabled={loading}
                    />

                    {/* DESCRIPTION */}
                    <label style={styles.label}>Study Description *</label>
                    <textarea
                        placeholder="Enter study description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={styles.textarea}
                        disabled={loading}
                    />

                    {/* STUDY TYPES */}
                    <label style={styles.label}>Study Type *</label>
                    <div style={styles.typeGrid}>
                        {studyTypes.map((st) => {
                            const isSelected = studyType === st.value;

                            return (
                                <div
                                    key={st.value}
                                    onClick={() => setStudyType(st.value)}
                                    onMouseEnter={() => setHoveredType(st.value)}
                                    onMouseLeave={() => setHoveredType(null)}
                                    style={{
                                        ...styles.typeCard,
                                        border: isSelected
                                            ? `2px solid ${st.base}`
                                            : "1px solid rgba(255,255,255,0.12)",
                                        boxShadow: isSelected
                                            ? `0 0 14px ${st.base}55`
                                            : "0 0 8px rgba(255,255,255,0.05)",
                                        transform:
                                            hoveredType === st.value
                                                ? "scale(1.03) translateY(-3px)"
                                                : "scale(1)",
                                    }}
                                >
                                    {st.label}
                                </div>
                            );
                        })}
                    </div>

                    {/* CREATE BUTTON */}
                    <button
                        type="submit"
                        className="create-btn"
                        style={styles.createBtn}
                        disabled={loading}
                    >
                        {loading
                            ? "Creating..."
                            : studyType === "CUSTOM"
                                ? "Define Template"
                                : "Create Study"}
                    </button>
                </form>
            </div>

            {/* TOOLTIP */}
            {hoveredType && (
                <div
                    style={{
                        ...styles.tooltip,
                        top: tooltipPos.y + 12,
                        left:
                            tooltipPos.direction === "right"
                                ? tooltipPos.x + 24
                                : tooltipPos.x - 260,
                    }}
                >
                    {studyTypes.find((t) => t.value === hoveredType)?.desc}

                    <div
                        style={{
                            position: "absolute",
                            top: "14px",
                            [tooltipPos.direction === "right" ? "left" : "right"]: "-9px",
                            width: 0,
                            height: 0,
                            borderTop: "8px solid transparent",
                            borderBottom: "8px solid transparent",
                            borderLeft:
                                tooltipPos.direction === "right"
                                    ? "8px solid rgba(255,165,0,0.7)"
                                    : "none",
                            borderRight:
                                tooltipPos.direction === "left"
                                    ? "8px solid rgba(255,165,0,0.7)"
                                    : "none",
                        }}
                    />
                </div>
            )}

            {/* KEYFRAME */}
            <style>{`
                @keyframes floatParticle {
                    0% { transform: translateY(0); opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-120vh); opacity: 0; }
                }
            `}</style>

        </div>
    );
}

/* ---------------- STYLES ---------------- */
const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
        paddingBottom: "40px",
    },

    particles: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
    },

    particle: {
        position: "absolute",
        width: "4px",
        height: "4px",
        background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
        borderRadius: "50%",
        animation: "floatParticle linear infinite",
        opacity: 0.45,
    },

    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        zIndex: 5,
    },

    navTitle: {
        fontSize: "1.5rem",
        fontWeight: 700,
        color: "#60a5fa",
    },

    backButton: {
        padding: "8px 20px",
        borderRadius: "10px",
        background: "rgba(239,68,68,0.1)",
        border: "2px solid rgba(239,68,68,0.5)",
        color: "#f87171",
        cursor: "pointer",
        fontWeight: 600,
        transition: "all 0.22s ease-out",
    },

    card: {
        width: "90%",
        maxWidth: "760px",
        margin: "40px auto 0 auto",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "18px",
        padding: "40px",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
        animation: "glowPulse 4s ease infinite",
        position: "relative",
        zIndex: 2,
    },

    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },

    label: {
        fontWeight: 600,
        fontSize: "1rem",
        color: "#93c5fd",
    },

    input: {
        padding: "12px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "white",
        fontSize: "1.05rem",
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
    },

    textarea: {
        padding: "12px",
        minHeight: "120px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "white",
        fontSize: "1.05rem",
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
    },

    typeGrid: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },

    typeCard: {
        width: "100%",
        padding: "14px",
        textAlign: "center",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.04)",
        fontWeight: 600,
        cursor: "pointer",
        transition: "0.25s",
        userSelect: "none",
    },

    tooltip: {
        position: "fixed",
        padding: "12px 16px",
        borderRadius: "12px",
        fontSize: "0.9rem",
        maxWidth: "240px",
        pointerEvents: "none",
        animation: "fadeTooltip 0.25s ease",
        zIndex: 9999,
        background: "rgba(255, 140, 0, 0.20)",
        border: "1px solid rgba(255,165,0,0.55)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 0 14px rgba(255,165,0,0.45)",
        color: "white",
    },

    createBtn: {
        padding: "14px",
        borderRadius: "12px",
        background: "linear-gradient(135deg, #14b8a6, #06b6d4)",
        border: "none",
        color: "white",
        fontWeight: 700,
        fontSize: "1.05rem",
        boxShadow: "0 0 12px rgba(6,182,212,0.4)",
        cursor: "pointer",
        marginTop: "15px",
        transition: "all 0.22s ease-out",
    },

    toastContainer: {
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        zIndex: 3000,
        alignItems: "center",
    },

    toast: {
        padding: "14px 22px",
        borderRadius: "10px",
        color: "white",
        fontWeight: 600,
        fontSize: "0.95rem",
        backdropFilter: "blur(10px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        animation: "fadeToast 0.35s ease",
        minWidth: "260px",
        textAlign: "center",
        border: "1px solid rgba(255,255,255,0.2)",
    },

    toastSuccess: {
        background: "rgba(34,197,94,0.25)",
        borderColor: "rgba(34,197,94,0.55)",
    },

    toastError: {
        background: "rgba(239,68,68,0.25)",
        borderColor: "rgba(239,68,68,0.55)",
    },
};

export default CreateStudyPage;
