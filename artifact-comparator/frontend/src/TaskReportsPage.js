// TaskReportsPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ----------------------------------------------------
   PARTICLES (MyStudiesPage / ManageEvaluationTasksPage)
----------------------------------------------------- */
function FloatingParticles() {
    const [particles, setParticles] = useState([]);

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

    return (
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
    );
}

/* ----------------------------------------------------
   MAIN COMPONENT
----------------------------------------------------- */
function TaskReportsPage() {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const artifactReports = reports.filter(r => r.type === "ARTIFACT");
    const participantReports = reports.filter(r => r.type === "PARTICIPANT");

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(
                    `http://localhost:8080/api/reports/task/${taskId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const data = await res.json();
                setReports(data);

            } catch (err) {
                console.error("❌ Failed to load reports:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [taskId]);

    return (
        <div style={styles.container}>
            <FloatingParticles />

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>
                    🚨 Reports Panel — Task #{taskId}
                </h2>

                <button
                    style={styles.backButton}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow =
                            "0 0 18px rgba(220,38,38,0.7)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow =
                            "0 0 12px rgba(220,38,38,0.4)";
                    }}
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>
            </div>

            {/* MAIN WRAPPER */}
            <div style={styles.centerWrapper}>
                {loading ? (
                    <p style={styles.loading}>Loading reports...</p>
                ) : reports.length === 0 ? (
                    <p style={styles.noReports}>No reports found.</p>
                ) : (
                    <>
                        {/* ARTIFACT REPORTS */}
                        {artifactReports.length > 0 && (
                            <>
                                <h3 style={styles.sectionTitle}>
                                    📁 Artifact Reports ({artifactReports.length})
                                </h3>

                                <div style={styles.reportGrid}>
                                    {artifactReports.map((r) => (
                                        <div key={r.id} style={styles.reportCard}>
                                            {/* === KART İÇİ AYNEN KOPYALA === */}
                                            <div style={styles.cardHeader}>
                                                <h3 style={styles.reportTitle}>
                                                    ⚠ {r.reason}
                                                </h3>
                                                <span style={styles.typeBadge}>
                                        {r.type}
                                    </span>
                                            </div>

                                            <p style={styles.info}>
                                                📁 Artifact:{" "}
                                                <span style={styles.high}>
                                        {r.artifactName || `#${r.artifactId}`}
                                    </span>
                                            </p>

                                            {r.description && (
                                                <p style={styles.desc}>📝 {r.description}</p>
                                            )}

                                            {r.reporterUsername && (
                                                <p style={styles.info}>
                                                    🧑‍⚖️ Reported by:{" "}
                                                    <span style={styles.high}>@{r.reporterUsername}</span>
                                                </p>
                                            )}

                                            <p style={styles.time}>🕒 {r.createdAt}</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* PARTICIPANT / COMMENT REPORTS */}
                        {participantReports.length > 0 && (
                            <>
                                <h3 style={styles.sectionTitle}>
                                    💬 Comment / Participant Reports ({participantReports.length})
                                </h3>

                                <div style={styles.reportGrid}>
                                    {participantReports.map((r) => (
                                        <div key={r.id} style={styles.reportCard}>
                                            {/* === KART İÇİ AYNEN KOPYALA === */}
                                            <div style={styles.cardHeader}>
                                                <h3 style={styles.reportTitle}>
                                                    ⚠ {r.reason}
                                                </h3>
                                                <span style={styles.typeBadge}>
                                        {r.type}
                                    </span>
                                            </div>

                                            <p style={styles.info}>
                                                👤 Reported User:{" "}
                                                <span style={styles.high}>@{r.reportedUsername}</span>
                                            </p>

                                            {r.description && (
                                                <p style={styles.desc}>📝 {r.description}</p>
                                            )}

                                            {r.commentSnapshot && (
                                                <div style={styles.commentBox}>
                                                    <p style={styles.commentLabel}>💬 Reported Comment</p>
                                                    <p style={styles.commentContent}>
                                                        {r.commentSnapshot}
                                                    </p>
                                                </div>
                                            )}

                                            {r.reporterUsername && (
                                                <p style={styles.info}>
                                                    🧑‍⚖️ Reported by:{" "}
                                                    <span style={styles.high}>@{r.reporterUsername}</span>
                                                </p>
                                            )}

                                            <p style={styles.time}>🕒 {r.createdAt}</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* KEYFRAMES */}
            <style>
                {`
                @keyframes floatParticle {
                    0% { transform: translateY(0); opacity: .4; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-120vh); opacity: 0; }
                }
                `}
            </style>
        </div>
    );
}

/* ----------------------------------------------------
   STYLES (same theme as Tasks & Comments pages)
----------------------------------------------------- */
const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
        position: "relative",
    },

    /* PARTICLES */
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
        background: "linear-gradient(135deg, #ef4444, #7c3aed)",
        borderRadius: "50%",
        animation: "floatParticle linear infinite",
        opacity: 0.45,
    },

    /* NAVBAR */
    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        zIndex: 10,
    },

    navTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#f87171",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        textShadow: "0 0 12px rgba(239,68,68,0.6)",
    },

    backButton: {
        background: "rgba(220,38,38,0.15)",
        border: "2px solid rgba(220,38,38,0.55)",
        color: "#fca5a5",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        boxShadow: "0 0 12px rgba(220,38,38,0.35)",
        transition: "0.2s ease",
    },

    /* WRAPPER */
    centerWrapper: {
        width: "90%",
        maxWidth: "1100px",
        margin: "0 auto",
        paddingTop: "25px",
        paddingBottom: "40px",
        position: "relative",
        zIndex: 2,
    },

    loading: {
        textAlign: "center",
        color: "#a5b4fc",
        marginTop: "40px",
    },

    noReports: {
        marginTop: "20px",
        textAlign: "center",
        color: "#a5b4fc",
        fontSize: "1.1rem",
    },

    /* GRID */
    reportGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "22px",
        marginTop: "10px",
    },

    /* CARD */
    reportCard: {
        background: "rgba(15,23,42,0.95)",
        borderRadius: "16px",
        padding: "18px 20px",
        border: "1px solid rgba(239,68,68,0.35)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 18px 35px rgba(15,23,42,0.85)",
        transition: "0.25s ease",
    },

    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
    },

    reportTitle: {
        fontSize: "1.15rem",
        fontWeight: 700,
        color: "#fca5a5",
        textShadow: "0 0 8px rgba(239,68,68,0.45)",
    },

    typeBadge: {
        fontSize: "0.8rem",
        color: "#fecaca",
        padding: "4px 10px",
        borderRadius: "999px",
        border: "1px solid rgba(239,68,68,0.45)",
        background: "rgba(239,68,68,0.18)",
        fontWeight: 600,
        textTransform: "uppercase",
    },

    info: {
        margin: "6px 0",
        color: "#e5e7eb",
    },

    high: {
        color: "#f87171",
        fontWeight: 700,
    },

    desc: {
        marginTop: "10px",
        background: "rgba(255,255,255,0.07)",
        padding: "10px",
        borderRadius: "8px",
        color: "#93c5fd",
        border: "1px solid rgba(147,197,253,0.35)",
    },

    time: {
        marginTop: "12px",
        fontSize: "0.85rem",
        color: "#94a3b8",
    },
    commentBox: {
        marginTop: "10px",
        padding: "10px 12px",
        borderRadius: "10px",
        background: "rgba(239,68,68,0.08)",
        border: "1px dashed rgba(239,68,68,0.4)",
    },

    commentLabel: {
        fontSize: "0.8rem",
        color: "#fca5a5",
        fontWeight: 600,
        marginBottom: "6px",
    },

    commentContent: {
        fontSize: "0.9rem",
        color: "#e5e7eb",
        whiteSpace: "pre-wrap",
        lineHeight: 1.4,
    },
    sectionTitle: {
        marginTop: "30px",
        marginBottom: "12px",
        fontSize: "1.2rem",
        fontWeight: 700,
        color: "#fca5a5",
    },
};

export default TaskReportsPage;
