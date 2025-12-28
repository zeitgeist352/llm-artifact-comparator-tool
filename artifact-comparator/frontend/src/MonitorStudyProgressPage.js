// MonitorStudyProgressPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

/* ============================================================
   PARTICLES
============================================================ */
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

/* ============================================================
   MAIN PAGE COMPONENT
============================================================ */
export default function MonitorStudyProgressPage() {
    const { studyId } = useParams();
    const navigate = useNavigate();

    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* ---------------------- TOASTS ---------------------- */
    const [toasts, setToasts] = useState([]);

    const showToast = (msg, type = "error") => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, msg, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    };
    const handleBackBtn = async () => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        if(storedUser.role === "RESEARCHER" )
            navigate(`/manage-tasks/${studyId}`);
        else if(storedUser.role === "REVIEWER"){
            navigate(`/reviewer`);
        }
    }
    /* ---------------------- PDF EXPORT ---------------------- */
    const handleExportPDF = async () => {
        try {
            const res = await fetch(
                `http://localhost:8080/api/monitor/${studyId}/export-pdf`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (!res.ok) {
                showToast("Failed to export PDF");
                return;
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `study-${studyId}-report.pdf`;
            a.click();

            window.URL.revokeObjectURL(url);
            showToast("PDF exported successfully!", "success");
        } catch (err) {
            console.error(err);
            showToast("Unexpected error while exporting PDF");
        }
    };


    /* ============================================================
       FETCH STUDY PROGRESS DATA
    ============================================================= */
    useEffect(() => {
        const fetchProgress = async () => {
            try {
                setLoading(true);

                const res = await fetch(
                    `http://localhost:8080/api/monitor/${studyId}/progress`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );

                if (!res.ok) throw new Error("Failed to fetch study progress");

                const data = await res.json();
                setOverview(data);
            } catch (e) {
                console.error(e);
                setError(e.message || "Unknown error");
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, [studyId]);

    /* ============================================================
       HELPERS
    ============================================================= */
    const computeTaskCompletion = (task) => {
        if (!task || !task.totalParticipants) return 0;
        return Math.round((task.completedCount / task.totalParticipants) * 100);
    };

    const computeOverallCompletion = () => {
        if (!overview || !overview.taskStats) return 0;
        const list = overview.taskStats;
        const sum = list.reduce((acc, t) => acc + computeTaskCompletion(t), 0);
        return Math.round(sum / list.length);
    };

    const computeDaysLeft = () => {
        if (!overview || !overview.endDate) return null;
        const now = new Date();
        const end = new Date(overview.endDate);
        return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    };

    const daysLeft = computeDaysLeft();
    const overallCompletion = computeOverallCompletion();

    /* ============================================================
       RENDER
    ============================================================= */
    return (
        <div style={styles.container}>
            <FloatingParticles />

            {/* TOASTS */}
            <div style={styles.toastContainer}>
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        style={{
                            ...styles.toast,
                            background:
                                t.type === "error"
                                    ? "rgba(239,68,68,0.9)"
                                    : "rgba(34,197,94,0.9)",
                        }}
                    >
                        {t.msg}
                    </div>
                ))}
            </div>

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>
                    Monitor Progress — {overview?.studyTitle || `Study #${studyId}`}
                </h2>

                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        style={{
                            ...styles.exportButton,
                            opacity:
                                overview?.status === "COMPLETED" ||
                                overview?.status === "ARCHIVED"
                                    ? 1
                                    : 0.4,
                            cursor:
                                overview?.status === "COMPLETED" ||
                                overview?.status === "ARCHIVED"
                                    ? "pointer"
                                    : "not-allowed",
                        }}
                        onMouseEnter={(e) => {
                            if (
                                overview?.status === "COMPLETED" ||
                                overview?.status === "ARCHIVED"
                            ) {
                                e.currentTarget.style.transform = "scale(1.06)";
                                e.currentTarget.style.boxShadow =
                                    "0 0 20px rgba(34,197,94,0.55)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow =
                                "0 0 14px rgba(34,197,94,0.35)";
                        }}
                        onClick={() => {
                            if (
                                overview?.status !== "COMPLETED" &&
                                overview?.status !== "ARCHIVED"
                            ) {
                                showToast("Study must be completed to export PDF");
                                return;
                            }
                            handleExportPDF();
                        }}
                    >
                        Export PDF
                    </button>

                    <button
                        style={styles.backButton}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                        }}
                        onClick={() => {handleBackBtn();}}
                    >
                        ← Back
                    </button>
                </div>
            </div>

            {/* WRAPPER */}
            <div style={styles.centerWrapper}>
                {/* OVERALL CARD */}
                <div style={styles.overallCard}>
                    <div style={styles.overallHeaderRow}>
                        <div>
                            <h3 style={styles.overallTitle}>Study Overview</h3>
                            <p style={styles.overallSubtitle}>
                                High-level completion across all evaluation tasks.
                            </p>
                        </div>

                        <div style={styles.overallStatsRight}>
                            <div style={styles.overallStatPill}>
                                {overview?.totalParticipants ?? 0} participants
                            </div>
                            <div style={styles.overallStatPill}>
                                {overview?.taskStats?.length ?? 0} tasks
                            </div>
                        </div>
                    </div>

                    {/* PROGRESS BAR */}
                    <div style={styles.overallProgressSection}>
                        <div style={styles.progressBackground}>
                            <div
                                style={{
                                    ...styles.progressFill,
                                    width: `${overallCompletion}%`,
                                }}
                            />
                        </div>

                        <div style={styles.overallProgressBottom}>
                            <span style={styles.overallProgressLabel}>
                                Overall completion: <b>{overallCompletion}%</b>
                            </span>

                            {daysLeft != null && (
                                <span style={styles.overallDeadline}>
                                    ⏱{" "}
                                    {daysLeft < 0
                                        ? "Study ended"
                                        : daysLeft === 0
                                            ? "Ends today"
                                            : `Ends in ${daysLeft} day${
                                                daysLeft === 1 ? "" : "s"
                                            }`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* TASK CARDS */}
                <div style={styles.content}>
                    {loading ? (
                        <p style={styles.loading}>Loading...</p>
                    ) : error ? (
                        <p style={styles.errorText}>{error}</p>
                    ) : !overview?.taskStats ||
                    overview.taskStats.length === 0 ? (
                        <p style={styles.empty}>No tasks found.</p>
                    ) : (
                        <div style={styles.taskGrid}>
                            {overview.taskStats.map((task) => {
                                const completion = computeTaskCompletion(task);

                                return (
                                    <div
                                        key={task.taskId}
                                        style={styles.taskCard}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform =
                                                "translateY(-4px)";
                                            e.currentTarget.style.boxShadow =
                                                "0 12px 28px rgba(0,0,0,0.35)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform =
                                                "translateY(0)";
                                            e.currentTarget.style.boxShadow =
                                                "0 0 12px rgba(0,0,0,0.20)";
                                        }}
                                    >
                                        {/* SEE DETAILS BUTTON */}
                                        <button
                                            style={styles.seeDetailsButton}
                                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
                                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                            onClick={() => navigate(`/monitor-task/${task.taskId}`)}
                                        >
                                            See Details
                                        </button>

                                        <h3 style={styles.taskTitle}>
                                            #{task.taskId} — {task.questionText}
                                        </h3>

                                        {/* SMALL PROGRESS */}
                                        <div style={styles.taskMetaRow}>
                                            <div style={styles.progressBackgroundSmall}>
                                                <div
                                                    style={{
                                                        ...styles.progressFillSmall,
                                                        width: `${completion}%`,
                                                    }}
                                                />
                                            </div>
                                            <div style={styles.taskProgressInfoRow}>
                                                <span style={styles.progressLabel}>
                                                    {completion}% completed
                                                </span>
                                                <span style={styles.participantLabel}>
                                                    {task.completedCount}/{task.totalParticipants}
                                                </span>
                                            </div>
                                        </div>

                                        {/* ==========================================
                                            CRITERION-BASED CHARTS
                                           ========================================== */}
                                        <div style={styles.criterionList}>
                                            {(task.criteriaStats || []).map((crit) => {
                                                const options = crit.options || {};

                                                const correct = options.Correct ?? crit.correct ?? 0;
                                                const wrong   = options.Wrong   ?? crit.wrong   ?? 0;
                                                const pending = options.Pending ?? crit.pending ?? 0;
                                                const unknown = options.Unknown ?? crit.unknown ?? 0;

                                                const pieData = [
                                                    { name: "Correct", value: correct },
                                                    { name: "Wrong", value: wrong },
                                                    { name: "Pending", value: pending },
                                                    { name: "Unknown", value: unknown },  // 🔥 EKLENDİ
                                                ];


                                                const barData = [
                                                    {
                                                        name: "Answers",
                                                        Correct: correct,
                                                        Wrong: wrong,
                                                        Pending: pending,
                                                        Unknown: unknown,   // 🔥 EKLENDİ
                                                    },
                                                ];


                                                return (
                                                    <div
                                                        key={crit.criterionId}
                                                        style={styles.criteriaCard}
                                                    >
                                                        <div style={styles.criteriaHeader}>
                                                            <span style={styles.criteriaName}>
                                                                {crit.label}
                                                            </span>
                                                        </div>

                                                        <div style={styles.criteriaChartsRow}>
                                                            {/* PIE CHART */}
                                                            <div style={styles.chartInner}>
                                                                <ResponsiveContainer
                                                                    width="100%"
                                                                    height={130}
                                                                >
                                                                    <PieChart>
                                                                        <Pie
                                                                            data={pieData}
                                                                            dataKey="value"
                                                                            nameKey="name"
                                                                            cx="50%"
                                                                            cy="50%"
                                                                            outerRadius={40}
                                                                            innerRadius={24}
                                                                            stroke="transparent"
                                                                        >

                                                                        <Cell fill="#60a5fa" />   // Correct → Sky Blue
                                                                        <Cell fill="#10b981" />   // Wrong → Mint Green
                                                                        <Cell fill="#e5e7eb" />   // Pending → Soft Beige-Grey
                                                                        <Cell fill="#facc15" />   // 🔥 Unknown → sarı




                                                                        </Pie>
                                                                        <Tooltip
                                                                            contentStyle={{
                                                                                background:
                                                                                    "rgba(15,23,42,0.90)",
                                                                                borderRadius: 10,
                                                                                border:
                                                                                    "1px solid rgba(255,255,255,0.15)",
                                                                                fontSize: "0.8rem",
                                                                            }}
                                                                            itemStyle={{
                                                                                color: "#e5e7eb",
                                                                                fontWeight: 500,
                                                                            }}
                                                                        />
                                                                        <Legend
                                                                            layout="horizontal"
                                                                            verticalAlign="bottom"
                                                                            align="center"
                                                                            wrapperStyle={{
                                                                                display: "flex",
                                                                                justifyContent: "center",
                                                                                gap: "14px",
                                                                                marginTop: "4px",
                                                                                fontSize: "0.78rem",
                                                                                color: "#e5e7eb",
                                                                            }}
                                                                        />

                                                                    </PieChart>
                                                                </ResponsiveContainer>
                                                            </div>

                                                            {/* BAR CHART */}
                                                            <div style={styles.chartInner}>
                                                                <ResponsiveContainer
                                                                    width="100%"
                                                                    height={130}
                                                                >
                                                                    <BarChart data={barData}>
                                                                        <XAxis
                                                                            dataKey="name"
                                                                            tick={{
                                                                                fontSize: 10,
                                                                                fill: "#9ca3af",
                                                                            }}
                                                                        />
                                                                        <YAxis
                                                                            allowDecimals={false}
                                                                            tick={{
                                                                                fontSize: 10,
                                                                                fill: "#9ca3af",
                                                                            }}
                                                                        />
                                                                        <Tooltip
                                                                            contentStyle={{
                                                                                background:
                                                                                    "rgba(15,23,42,0.90)",
                                                                                borderRadius: 10,
                                                                                border:
                                                                                    "1px solid rgba(255,255,255,0.15)",
                                                                                fontSize: "0.8rem",
                                                                            }}
                                                                            itemStyle={{
                                                                                color: "#e5e7eb",
                                                                                fontWeight: 500,
                                                                            }}
                                                                        />
                                                                        <Legend
                                                                            layout="horizontal"
                                                                            verticalAlign="bottom"
                                                                            align="center"
                                                                            wrapperStyle={{
                                                                                display: "flex",
                                                                                justifyContent: "center",
                                                                                gap: "14px",
                                                                                paddingTop: "4px",
                                                                                fontSize: "0.75rem",
                                                                                color: "#e5e7eb",
                                                                            }}
                                                                        />

                                                                        <Bar dataKey="Correct" fill="#60a5fa" />
                                                                        <Bar dataKey="Wrong"  fill="#10b981" />
                                                                        <Bar dataKey="Pending"  fill="#e5e7eb" />
                                                                        <Bar dataKey="Unknown" fill="#facc15" />   // 🔥 EKLENDİ




                                                                    </BarChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* PARTICLE CSS */}
            <style>
                {`
                @keyframes floatParticle {
                    0% { transform: translateY(0); opacity: .6; }
                    100% { transform: translateY(-120vh); opacity: 0; }
                }
                `}
            </style>
        </div>
    );
}

/* ============================================================
   STYLES
============================================================ */
const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        overflowX: "hidden",
        overflowY: "auto",
        position: "relative",
    },

    /* TOASTS */
    toastContainer: {
        position: "fixed",
        top: "30px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        zIndex: 9999,
        alignItems: "center",
    },

    toast: {
        padding: "12px 22px",
        borderRadius: "12px",
        color: "white",
        fontWeight: 600,
        fontSize: "0.95rem",
        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        maxWidth: "90vw",
        textAlign: "center",
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
        background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
        borderRadius: "50%",
        animation: "floatParticle linear infinite",
        opacity: 0.5,
    },

    /* NAVBAR */
    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 40px",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        zIndex: 10,
        position: "sticky",
        top: 0,
        backdropFilter: "blur(6px)",
    },

    navTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#60a5fa",
    },

    exportButton: {
        background: "linear-gradient(135deg, #3b82f6, #22c55e)",
        border: "1px solid rgba(255,255,255,0.25)",
        padding: "10px 22px",
        borderRadius: "12px",
        color: "white",
        fontWeight: 700,
        fontSize: "0.9rem",
        cursor: "pointer",
        boxShadow: "0 0 14px rgba(34,197,94,0.35)",
        transition: "0.25s ease",
    },

    backButton: {
        background: "rgba(220,38,38,0.15)",
        border: "2px solid rgba(220,38,38,0.55)",
        color: "#fca5a5",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        transition: "0.25s ease",
        boxShadow: "0 0 12px rgba(220,38,38,0.45)",
        marginLeft: "4px",
    },

    /* WRAPPER */
    centerWrapper: {
        width: "90%",
        maxWidth: "1250px",
        margin: "0 auto",
        paddingTop: "24px",
        paddingBottom: "32px",
        zIndex: 2,
    },

    /* OVERALL CARD */
    overallCard: {
        background: "rgba(255,255,255,0.06)",
        padding: "22px 24px 18px 24px",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(8px)",
        marginBottom: "22px",
        boxShadow: "0 0 16px rgba(0,0,0,0.35)",
        marginTop: "4px",
    },

    overallHeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
    },

    overallTitle: {
        fontSize: "1.2rem",
        fontWeight: "700",
        color: "#bfdbfe",
    },

    overallSubtitle: {
        marginTop: 4,
        fontSize: "0.9rem",
        color: "#e5e7eb",
    },

    overallStatsRight: {
        display: "flex",
        gap: "10px",
        alignItems: "center",
    },

    overallStatPill: {
        padding: "6px 12px",
        borderRadius: "999px",
        border: "1px solid rgba(148,163,184,0.7)",
        background: "rgba(15,23,42,0.85)",
        fontSize: "0.85rem",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        height: "30px",
    },

    overallProgressSection: {
        marginTop: 6,
    },

    seeDetailsButton: {
        position: "absolute",
        top: "14px",
        right: "14px",
        background: "rgba(96,165,250,0.12)",
        border: "1px solid rgba(96,165,250,0.4)",
        color: "#93c5fd",
        padding: "6px 14px",
        fontSize: "0.8rem",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: 600,
        backdropFilter: "blur(4px)",
        transition: "0.25s ease",
    },


    progressBackground: {
        width: "100%",
        height: "12px",
        background: "rgba(15,23,42,0.9)",
        borderRadius: "999px",
        overflow: "hidden",
        border: "1px solid rgba(55,65,81,0.9)",
    },

    progressFill: {
        height: "100%",
        background: "linear-gradient(135deg, #3b82f6, #22c55e)",
        borderRadius: "999px",
        transition: "width 0.3s ease",
    },

    overallProgressBottom: {
        marginTop: 6,
        display: "flex",
        justifyContent: "space-between",
        fontSize: "0.9rem",
    },

    overallProgressLabel: { color: "#e5e7eb" },

    overallDeadline: { fontSize: "0.85rem", color: "#a7f3d0" },

    /* CONTENT */
    content: {
        marginTop: "16px",
    },

    taskGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "22px",
    },

    taskCard: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "15px",
        padding: "20px",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(6px)",
        transition: "0.28s ease",
        boxShadow: "0 0 12px rgba(0,0,0,0.25)",
        position: "relative",   // 🔥 EKLENDİ
    },


    taskTitle: {
        fontSize: "1.05rem",
        fontWeight: "700",
        marginBottom: "8px",
    },

    taskMetaRow: { marginBottom: "12px" },

    progressBackgroundSmall: {
        width: "100%",
        height: "8px",
        background: "rgba(15,23,42,0.9)",
        borderRadius: "999px",
        overflow: "hidden",
        border: "1px solid rgba(55,65,81,0.9)",
    },

    progressFillSmall: {
        height: "100%",
        background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
        transition: "width 0.3s ease",
        borderRadius: "999px",
    },

    taskProgressInfoRow: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: 4,
        fontSize: "0.82rem",
    },

    progressLabel: { color: "#cbd5e1" },
    participantLabel: { color: "#e5e7eb" },

    /* CRITERIA CARDS */
    criterionList: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        marginTop: "14px",
    },

    criteriaCard: {
        background: "rgba(22,27,45,0.75)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "12px 14px",
        borderRadius: "12px",
        backdropFilter: "blur(6px)",
        boxShadow: "0 0 10px rgba(0,0,0,0.3)",
    },

    criteriaHeader: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "8px",
        alignItems: "center",
    },

    criteriaName: {
        fontSize: "0.95rem",
        fontWeight: "700",
        color: "#e2e8f0",
    },

    criteriaChartsRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
    },

    chartInner: {
        width: "100%",
        height: 130,
    },

    loading: {
        color: "#a5b4fc",
        textAlign: "center",
        marginTop: "40px",
    },

    empty: {
        color: "rgba(255,255,255,0.6)",
        textAlign: "center",
        marginTop: "40px",
    },

    errorText: {
        color: "#fecaca",
        textAlign: "center",
        marginTop: "40px",
        fontSize: "0.95rem",
    },
};
