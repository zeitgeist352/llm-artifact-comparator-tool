import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClipboardList, Sparkles, ArrowLeft } from "lucide-react";

function EvaluationTasksPage() {
    const navigate = useNavigate();
    const { studyId } = useParams();
    const [completedTaskIds, setCompletedTaskIds] = useState(new Set());

    const [tasks, setTasks] = useState([]);

    // Generate particles once on mount
    const [particles] = useState(() =>
        [...Array(55)].map(() => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}vh`,
            animationDelay: `${-(Math.random() * 15).toFixed(2)}s`,
            animationDuration: `${16 + Math.random() * 10}s`,
        }))
    );

    // Role checking logic
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const role = user.role;

        if (role !== "PARTICIPANT") {
            navigate("/");
        }
    }, [navigate]);

    useEffect(() => {
        const fetchTasks = async () => {
            const token = localStorage.getItem("token");

            const res = await fetch(`http://localhost:8080/api/studies/${studyId}/evaluation-tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        };

        fetchTasks();
    }, [studyId]);

    useEffect(() => {
        const fetchCompleted = async () => {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `http://localhost:8080/api/participant/study/${studyId}/completed-task-ids`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                const ids = await res.json();
                setCompletedTaskIds(new Set(ids));
            }
        };
        fetchCompleted();
    }, [studyId]);

    const completedCount = completedTaskIds.size;
    const totalCount = tasks.length;
    const progressPercent =
        totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    return (
        <div style={styles.container}>
            {/* Animated background particles */}
            <div style={styles.particles}>
                {particles.map((particle, i) => (
                    <div
                        key={i}
                        style={{
                            ...styles.particle,
                            ...particle,
                            opacity: 0.45,
                        }}
                    />
                ))}
            </div>

            {/* Navbar */}
            <div style={styles.navbar}>
                <div style={styles.logoSection}>
                </div>
                <div style={styles.right}>
                    <button
                        style={styles.backButton}
                        onClick={() => navigate("/participant/")}
                        onMouseEnter={(e) => {
                            e.target.style.transform = "scale(1.06)";
                            e.target.style.boxShadow = "0 0 18px rgba(239, 68, 68, 0.7)";
                            e.target.style.borderColor = "rgba(239, 68, 68, 0.85)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = "scale(1)";
                            e.target.style.boxShadow = "none";
                            e.target.style.borderColor = "rgba(239, 68, 68, 0.5)";
                        }}
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </button>
                </div>
            </div>

            <div style={styles.header}>
                <div style={styles.iconTitle}>
                    <ClipboardList size={28} style={{ color: "#06b6d4" }} />
                    <h2 style={styles.headerTitle}>Evaluate Artifacts</h2>
                </div>
                <p style={styles.subtitle}>Select an artifact below to start your evaluation.</p>
                <p style={styles.progressText}>
                    {completedCount} / {totalCount} tasks completed ({progressPercent}%)
                </p>
            </div>

            <div style={styles.contentWrapper}>
                <div style={styles.grid}>
                    {tasks.map((a, index) => {
                        const isCompleted = completedTaskIds.has(a.id);

                        return (
                            <div
                                key={a.id}
                                style={{
                                    ...styles.card,
                                    ...(isCompleted && styles.completedCard),
                                    animationDelay: `${index * 0.1}s`
                                }}
                            >
                                <div style={styles.cardGlow}></div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <h3 style={styles.cardQuestion}>
                                        {a.questionText}
                                    </h3>

                                    {isCompleted && (
                                        <span style={styles.completedBadge}>✔ Completed</span>
                                    )}
                                </div>

                                {a.description && (
                                    <p style={styles.cardDesc}>{a.description}</p>
                                )}

                                <button
                                    style={{
                                        ...styles.btn,
                                        ...(isCompleted && styles.completedBtn)
                                    }}
                                    onClick={() => {
                                            navigate(`/study/${studyId}/tasks/${a.id}`);
                                    }}
                                >
                                    <Sparkles size={16} style={{ marginRight: "6px" }} />
                                    {isCompleted ? "Evaluation Submitted" : "Evaluate →"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>


            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes floatParticle {
                    0% { transform: translateY(0); opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-120vh); opacity: 0; }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes glow {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        maxHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
    },
    particles: {
        position: "fixed",
        inset: 0,
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
    },
    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "relative",
        zIndex: 10,
        flexShrink: 0,
    },
    logoSection: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    logoIcon: {
        color: "#0ea5e9",
        animation: "float 3s ease-in-out infinite",
    },
    title: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#60a5fa",
        margin: 0,
    },
    right: {
        display: "flex",
        alignItems: "center",
        gap: "15px",
    },
    backButton: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "rgba(239,68,68,0.1)",
        border: "2px solid rgba(239,68,68,0.5)",
        color: "#f87171",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "0.9rem",
        transition: "all 0.25s ease-out",
    },
    header: {
        textAlign: "center",
        padding: "40px 20px 30px",
        position: "relative",
        zIndex: 1,
        flexShrink: 0,
    },
    iconTitle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
    },
    headerTitle: {
        fontSize: "2rem",
        fontWeight: "800",
        background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    subtitle: {
        color: "rgba(255,255,255,0.6)",
        fontSize: "1rem",
        marginTop: "8px",
    },
    contentWrapper: {
        flex: 1,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "0 20px 40px 20px",
        position: "relative",
        zIndex: 1,
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "24px",
        width: "100%",
        maxWidth: "1200px",
    },
    card: {
        position: "relative",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "18px",
        padding: "24px",
        border: "1px solid rgba(6,182,212,0.3)",
        backdropFilter: "blur(12px)",
        transition: "all 0.3s ease",
        animation: "slideIn 0.6s ease forwards",
        cursor: "default",
        overflow: "hidden",
        opacity: 0,
        height: "fit-content",
    },
    cardGlow: {
        position: "absolute",
        top: "-50%",
        left: "-50%",
        width: "200%",
        height: "200%",
        background: "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)",
        animation: "glow 3s ease-in-out infinite",
        pointerEvents: "none",
    },
    cardTitle: {
        fontSize: "1.2rem",
        fontWeight: "700",
        marginBottom: "8px",
    },
    cardDesc: {
        color: "rgba(255,255,255,0.7)",
        fontSize: "0.95rem",
        marginBottom: "20px",
    },
    btn: {
        background: "rgba(6,182,212,0.2)",
        border: "2px solid rgba(6,182,212,0.4)",
        color: "#06b6d4",
        fontWeight: "700",
        padding: "10px 20px",
        borderRadius: "12px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        transition: "all 0.3s ease",
    },
    progressText: {
        fontSize: "0.8rem",
        color: "rgba(255,255,255,0.55)",
        marginBottom: "14px",
    },
    cardQuestion: {
        fontSize: "1.15rem",
        fontWeight: "700",
        color: "#ffffff",
        lineHeight: "1.4",
        marginBottom: "6px",
    },
};

export default EvaluationTasksPage;
