// MonitorEachTaskPage.js
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
} from "recharts";
import { diffLines } from "diff";

/* ============================================================
   PARTICLES (MonitorStudyProgressPage ile aynı tema)
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

function CodeDiffBlock({ correct, participant }) {
    const parts = diffLines(correct || "", participant || "");

    return (
        <pre style={styles.diffPre}>
            {parts.map((part, idx) => {
                const style = part.added
                    ? styles.diffAdded      // participant'ta olup correct'ta olmayan
                    : part.removed
                        ? styles.diffRemoved // correct'ta olup participant'ta olmayan
                        : styles.diffSame;

                return (
                    <span key={idx} style={style}>
                        {part.value}
                    </span>
                );
            })}
        </pre>
    );
}

/* ============================================================
   MAIN PAGE — MonitorEachTaskPage
============================================================ */
export default function MonitorEachTaskPage() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [toasts,    setToasts]    = useState([]);
    const [hasError,  setHasError]  = useState(false);

    const [openCodeCriteria, setOpenCodeCriteria] = useState({});
    const [openDiff, setOpenDiff] = useState({}); // 🔥 BUNU EKLE

    const showToast = (msg, type = "error") => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, msg, type }]);
        setTimeout(
            () => setToasts((prev) => prev.filter((t) => t.id !== id)),
            3500
        );
    };
    /* ============================================================
       FETCH TASK DETAILS
    ============================================================= */
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem("user") || "null");
                setLoading(true);
                setHasError(false);
                if(storedUser.role === "RESEARCHER") {
                    const res = await fetch(
                        `http://localhost:8080/api/monitor/task/${taskId}/details`,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                        }
                    );
                    if (!res.ok) {
                        throw new Error("Cannot load task data");
                    }

                    const data = await res.json();
                    setTask(data);
                }
                else if(storedUser.role === "REVIEWER"){
                    const res = await fetch(
                        `http://localhost:8080/api/monitor/task/${taskId}/details-reviewer`,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                        }
                    );
                    if (!res.ok) {
                        throw new Error("Cannot load task data");
                    }

                    const data = await res.json();
                    setTask(data);
                }


            } catch (e) {
                console.error(e);
                setHasError(true);
                showToast("Failed to load task details");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [taskId]);

    if (loading) {
        return (
            <div style={styles.container}>
                <FloatingParticles />
                <div style={styles.loading}>Loading...</div>
            </div>
        );
    }

    if (!task || hasError) {
        return (
            <div style={styles.container}>
                <FloatingParticles />
                <div style={styles.errorText}>Task not found or failed to load.</div>
            </div>
        );
    }

    /* ============================================================
       COLOR & HELPER LOGIC (MonitorStudyProgressPage paleti)
    ============================================================= */

    // backend'den distribution içinde correctAnswer bekliyoruz
    const correctByCriterionId = {};
    (task.distribution || []).forEach((d) => {
        correctByCriterionId[d.criterionId] = d.correctAnswer || "";
    });

    // Her seçenek için renk: doğru → mavi, diğerleri yeşil / bej karışık
    const getOptionColor = (optionLabel, criterionId, index) => {
        const correct = correctByCriterionId[criterionId] || "";
        if (optionLabel === correct) return "#60a5fa"; // Sky blue (Correct)
        // Alternating mint green / soft grey
        return index % 2 === 0 ? "#10b981" : "#e5e7eb";
    };

    const tooltipStyle = {
        background: "rgba(15,23,42,0.90)",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.15)",
        fontSize: "0.8rem",
        color: "#e5e7eb",
    };

    const normalizeCode = (s) => {
        if (!s) return "";
        return s
            .replace(/\/\/.*$/gm, "")
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\s+/g, "")
            .trim();
    };

    const extractEditedCode = (raw) => {
        if (!raw) return "";

        // JSON gibi durmuyorsa zaten düz koddur
        if (!raw.trim().startsWith("{")) {
            return raw;
        }

        try {
            const parsed = JSON.parse(raw);
            return parsed.editedCode || "";
        } catch (e) {
            // parse edemezsek fallback
            return raw;
        }
    };

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

            {/* NAVBAR (MonitorStudyProgressPage ile aynı çizgi) */}
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>
                    Task Details — #{task.taskId}
                </h2>

                <button
                    style={styles.backButton}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>
            </div>

            {/* WRAPPER */}
            <div style={styles.centerWrapper}>
                {/* Soru kartı */}
                <div style={styles.overallCard}>
                    <h3 style={styles.overallTitle}>Question</h3>

                    {/* Dikey ayırıcı çizgi */}
                    <div style={styles.questionDivider} />

                    <p style={styles.overallSubtitle}>{task.questionText}</p>
                </div>


                {/* CRITERION SONUÇ KARTLARI */}
                <div style={styles.content}>
                    {(task.distribution || []).map((crit, idx) => {
                        const options = crit.options || {};
                        const optionKeys = Object.keys(options);

                        const isCodeEdit =
                            crit.correctAnswer &&
                            Object.keys(crit.options || {}).includes("Correct");

                        const chartData = optionKeys.map((key, i) => ({
                            name: key === "" ? "— (blank)" : key,
                            rawName: key,
                            value: options[key],
                            fill: getOptionColor(key, crit.criterionId, i),
                        }));

                        const correctAnswerText =
                            crit.correctAnswer && crit.correctAnswer !== ""
                                ? crit.correctAnswer
                                : "—";

                        return (
                            <div key={crit.criterionId ?? idx} style={styles.criteriaCard}>
                                <div style={styles.criteriaHeaderRow}>
                                    <h3 style={styles.criteriaName}>{crit.label}</h3>
                                    {isCodeEdit && (
                                        <button
                                            style={styles.codeToggle}
                                            onClick={() =>
                                                setOpenCodeCriteria(prev => ({
                                                    ...prev,
                                                    [crit.criterionId]: !prev[crit.criterionId],
                                                }))
                                            }
                                        >
                                            {openCodeCriteria[crit.criterionId]
                                                ? "Hide Answer"
                                                : "Show Correct Answer"}
                                        </button>
                                    )}
                                    {/* NON-CODE → Correct Answer badge */}
                                    {!isCodeEdit && (
                                        <span style={styles.correctBadge}>
            Correct Answer:{" "}
                                            <b style={{ color: "#60a5fa" }}>
                {correctAnswerText}
            </b>
        </span>
                                    )}
                                </div>

                                {/* Legend (renkli noktalar) */}
                                <div style={styles.legendBox}>
                                    {chartData.map((entry, i) => (
                                        <div key={entry.rawName + i} style={styles.legendRow}>
                                            <span
                                                style={{
                                                    ...styles.legendDot,
                                                    background: entry.fill,
                                                }}
                                            />
                                            <span style={{ color: "#e5e7eb" }}>
                                                {entry.name}
                                            </span>
                                            <span
                                                style={{
                                                    color: "#9ca3af",
                                                    fontSize: "0.8rem",
                                                    marginLeft: 4,
                                                }}
                                            >
                                                ({entry.value})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {isCodeEdit && openCodeCriteria[crit.criterionId] && (
                                    <div style={styles.codeBox}>
                                        <div style={styles.codeLabel}>Correct Code</div>
                                        <pre style={styles.codePre}>
            {crit.correctAnswer}
        </pre>
                                    </div>
                                )}

                                <div style={styles.criteriaChartsRow}>
                                    {/* PIE CHART */}
                                    <div style={styles.chartInner}>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <PieChart>
                                                <Pie
                                                    data={chartData}
                                                    dataKey="value"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={28}
                                                    outerRadius={52}
                                                    stroke="transparent"
                                                >
                                                    {chartData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    cursor={{ fill: "rgba(0,0,0,0)" }}   // %100 transparan cursor rect

                                                    contentStyle={{
                                                        background: "rgba(15,23,42,0.90)",
                                                        borderRadius: 10,
                                                        border: "1px solid rgba(255,255,255,0.15)",
                                                        color: "#ffffff",
                                                    }}
                                                    itemStyle={{
                                                        color: "#ffffff",
                                                        fontWeight: 500,
                                                    }}
                                                    labelStyle={{
                                                        color: "#ffffff",
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* BAR CHART */}
                                    <div style={styles.chartInner}>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <BarChart data={chartData}>
                                                <XAxis
                                                    dataKey="name"
                                                    tick={{ fill: "#cbd5e1", fontSize: 11 }}
                                                />
                                                <YAxis
                                                    allowDecimals={false}
                                                    tick={{ fill: "#cbd5e1", fontSize: 11 }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        ...tooltipStyle,
                                                        color: "#ffffff",
                                                    }}
                                                    itemStyle={{
                                                        color: "#ffffff",
                                                        fontWeight: 500,
                                                    }}
                                                    labelStyle={{
                                                        color: "#ffffff",
                                                        fontWeight: 600,
                                                    }}
                                                    // 🔥 Burada value: yerine count: yazdırıyoruz
                                                    formatter={(value) => [`${value}`, "Count"]}
                                                />
                                                <Bar
                                                    dataKey="value"
                                                    activeBar={false}   // 🔥 Hover highlight rectangle tamamen kapalı
                                                >
                                                    {chartData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.fill} />
                                                    ))}
                                                </Bar>

                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* PARTICIPANT ANSWERS TABLOSU */}
                    <div style={styles.criteriaCard}>
                        <h3 style={styles.criteriaName}>Participant Answers</h3>

                        <div style={styles.analyticsHeader}>
                            <span style={styles.analyticsColUser}>Participant</span>
                            {task.criteria.map((c) => (
                                <span key={c.id} style={styles.analyticsCol}>{c.label}</span>
                            ))}
                        </div>

                        <div style={styles.analyticsBody}>
                            {task.participants.map((p, idx) => (
                                <div key={idx} style={styles.analyticsRow}>
                                    <div style={styles.analyticsUserCell}>
                                        <span style={styles.userIcon}>👤</span>
                                        {p.username}
                                    </div>

                                    {task.criteria.map((c, i) => {
                                        const isCodeEdit =
                                            correctByCriterionId[c.id] &&
                                            task.distribution?.find(d => d.criterionId === c.id)?.options?.Correct !== undefined;
                                        const raw = p.answers && p.answers[i] ? p.answers[i] : "";
                                        const value = raw ?? "";

                                        const correct = correctByCriterionId[c.id] ?? "";

                                        let status;

                                        // ============================================================
                                        // 1) Eğer correctAnswer boş → tüm cevaplar UNKNOWN
                                        // ============================================================
                                        if (correct === "") {
                                            status = "unknown";
                                        }
                                            // ============================================================
                                            // 2) correctAnswer VAR
                                        // ============================================================
                                        else {
                                            if (normalizeCode(value) === normalizeCode(correct)) {
                                                status = "correct";
                                            } else {
                                                status = "wrong";
                                            }
                                        }

                                        const displayValue = value === "" ? "—" : value;

                                        const badgeStyle = {
                                            ...styles.answerBadge,
                                            ...(status === "correct"
                                                ? {
                                                    backgroundColor: "rgba(34,197,94,0.25)",
                                                    border: "1px solid rgba(34,197,94,0.55)",
                                                    color: "#4ade80",
                                                }
                                                : status === "wrong"
                                                    ? {
                                                        backgroundColor: "rgba(239,68,68,0.25)",
                                                        border: "1px solid rgba(239,68,68,0.55)",
                                                        color: "#fca5a5",
                                                    }
                                                    : {
                                                        backgroundColor: "rgba(234,179,8,0.25)",
                                                        border: "1px solid rgba(234,179,8,0.5)",
                                                        color: "#facc15",
                                                    }),
                                        };



                                        return (
                                            <div key={c.id + "-" + i} style={styles.analyticsCell}>
                                                {!isCodeEdit && (
                                                    <span style={badgeStyle}>{displayValue}</span>
                                                )}

                                                {isCodeEdit && (
                                                    <div style={{ marginTop: "6px" }}>

                                                        {/* ✅ 1️⃣ Participant answer (TEK BAŞINA) */}
                                                        {value && (
                                                            <div style={styles.participantCodeBox}>
                                                                <div style={styles.codeLabel}>Participant Answer</div>
                                                                <pre style={styles.codePreLeft}>
    {extractEditedCode(value)}
</pre>
                                                            </div>
                                                        )}

                                                        {/* ✅ 2️⃣ Diff toggle */}
                                                        <button
                                                            style={styles.viewDiffBtn}
                                                            onClick={() =>
                                                                setOpenDiff(prev => ({
                                                                    ...prev,
                                                                    [`${p.username}-${c.id}`]:
                                                                        !prev[`${p.username}-${c.id}`],
                                                                }))
                                                            }
                                                        >
                                                            {openDiff[`${p.username}-${c.id}`]
                                                                ? "Hide diff"
                                                                : "View diff"}
                                                        </button>

                                                        {/* ✅ 3️⃣ Diff */}
                                                        {openDiff[`${p.username}-${c.id}`] && (
                                                            <div style={styles.diffBox}>
                                                                <div style={styles.diffHeader}>
                        <span style={styles.diffLegendItem}>
                            <span
                                style={{
                                    ...styles.diffLegendDot,
                                    background: "rgba(239,68,68,0.35)",
                                }}
                            />
                            Diff
                        </span>

                                                                </div>

                                                                <CodeDiffBlock
                                                                    correct={correctByCriterionId[c.id] ?? ""}
                                                                    participant={extractEditedCode(value)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                </div>
                            ))}
                        </div>

                    </div>
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
   STYLES — MonitorStudyProgressPage ile uyumlu tema
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

    /* QUESTION CARD */
    overallCard: {
        background: "rgba(255,255,255,0.07)",
        padding: "18px 24px",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(10px)",
        marginBottom: "26px",
        marginTop: "10px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        position: "relative",
        overflow: "hidden",

        // 🔥 yan yana
        display: "flex",
        alignItems: "center",
        gap: "16px",
    },

    overallTitle: {
        fontSize: "1.1rem",
        fontWeight: "700",
        color: "#bfdbfe",
        whiteSpace: "nowrap",
        margin: 0,
    },

    questionDivider: {
        width: "1px",
        alignSelf: "stretch",
        background: "linear-gradient(to bottom, rgba(148,163,184,0.0), rgba(148,163,184,0.8), rgba(148,163,184,0.0))",
        opacity: 0.9,
    },

    overallSubtitle: {
        margin: 0,
        fontSize: "0.98rem",
        color: "#e5e7eb",
        lineHeight: "1.5rem",
    },


    /* CONTENT */
    content: {
        display: "flex",
        flexDirection: "column",
        gap: "22px",
    },

    /* CRITERIA CARD */
    criteriaCard: {
        background: "rgba(22,27,45,0.78)",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "18px 22px",
        borderRadius: "14px",
        backdropFilter: "blur(8px)",
        boxShadow: "0 0 12px rgba(0,0,0,0.28)",
    },

    criteriaHeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
        gap: 12,
        flexWrap: "wrap",
    },

    criteriaName: {
        fontSize: "1.15rem",
        fontWeight: "700",
        color: "#e2e8f0",
    },

    correctBadge: {
        padding: "4px 10px",
        background: "rgba(96,165,250,0.15)",
        border: "1px solid rgba(96,165,250,0.4)",
        borderRadius: "8px",
        fontSize: "0.85rem",
        color: "#dbeafe",
        whiteSpace: "nowrap",
    },

    /* LEGEND */
    legendBox: {
        marginBottom: 12,
        display: "flex",
        gap: "18px",
        flexWrap: "wrap",
    },

    legendRow: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "0.85rem",
    },

    legendDot: {
        width: "12px",
        height: "12px",
        borderRadius: "50%",
    },

    /* CHARTS GRID */
    criteriaChartsRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "18px",
    },

    chartInner: {
        width: "100%",
        height: 160,
    },

    /* TABLE */
    table: {
        width: "100%",
        marginTop: "18px",
        borderCollapse: "collapse",
        background: "rgba(255,255,255,0.03)",
    },

    th: {
        padding: "10px",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        color: "#93c5fd",
        fontWeight: 600,
        fontSize: "0.9rem",
        textAlign: "left",
    },

    tr: {
        borderBottom: "1px solid rgba(255,255,255,0.08)",
    },

    tdUser: {
        padding: "10px",
        fontWeight: 600,
        color: "#bfdbfe",
        fontSize: "0.9rem",
        textAlign: "left",
    },

    td: {
        padding: "10px",
        textAlign: "center",
        color: "#e5e7eb",
        fontSize: "0.9rem",
    },

    loading: {
        color: "#a5b4fc",
        textAlign: "center",
        marginTop: "40px",
        fontSize: "1rem",
    },

    errorText: {
        color: "#fecaca",
        textAlign: "center",
        marginTop: "40px",
        fontSize: "0.95rem",
    },
    /* ============================
   ANALYTICS GRID TABLE STYLE
============================ */
    analyticsHeader: {
        display: "grid",
        gridTemplateColumns: "200px repeat(auto-fit, minmax(120px, 1fr))",
        padding: "12px 14px",
        background: "rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        fontWeight: "600",
        fontSize: "0.9rem",
        color: "#93c5fd",
    },

    analyticsColUser: {
        paddingLeft: "6px",
    },

    analyticsCol: {
        textAlign: "center",
    },

    analyticsBody: {
        display: "flex",
        flexDirection: "column",
    },

    analyticsRow: {
        display: "grid",
        gridTemplateColumns: "200px repeat(auto-fit, minmax(120px, 1fr))",
        padding: "10px 14px",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        transition: "0.2s ease",
    },

    analyticsUserCell: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontWeight: "600",
        color: "#bfdbfe",
    },

    analyticsCell: {
        textAlign: "center",
    },

    answerBadge: {
        display: "inline-block",
        padding: "6px 12px",
        borderRadius: "10px",
        fontSize: "0.85rem",
        fontWeight: "600",
        minWidth: "40px",
    },

    userIcon: {
        fontSize: "1rem",
    },
    codeToggle: {
        background: "rgba(96,165,250,0.15)",
        border: "1px solid rgba(96,165,250,0.4)",
        color: "#93c5fd",
        padding: "4px 10px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "0.8rem",
    },

    codeBox: {
        marginTop: "14px",
        background: "rgba(15,23,42,0.85)",
        borderRadius: "10px",
        padding: "12px",
        border: "1px solid rgba(255,255,255,0.12)",
    },

    codeLabel: {
        fontSize: "0.8rem",
        fontWeight: 600,
        marginBottom: "6px",
        color: "#93c5fd",
    },

    codePre: {
        fontFamily: "monospace",
        fontSize: "0.85rem",
        color: "#e5e7eb",
        whiteSpace: "pre-wrap",
        lineHeight: "1.4rem",
    },

    viewCode: {
        cursor: "pointer",
        fontSize: "0.8rem",
        color: "#60a5fa",
    },
    diffBox: {
        marginTop: "10px",
        background: "rgba(15,23,42,0.85)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "10px",
        padding: "10px",
    },

    diffHeader: {
        display: "flex",
        gap: "14px",
        flexWrap: "wrap",
        marginBottom: "8px",
        color: "#cbd5e1",
        fontSize: "0.78rem",
    },

    diffLegendItem: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },

    diffLegendDot: {
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.18)",
    },

    viewDiffBtn: {
        background: "rgba(96,165,250,0.12)",
        border: "1px solid rgba(96,165,250,0.35)",
        color: "#93c5fd",
        padding: "5px 10px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "0.8rem",
    },

    diffPre: {
        margin: 0,
        fontFamily: "monospace",
        fontSize: "0.85rem",
        color: "#e5e7eb",
        whiteSpace: "pre-wrap",
        lineHeight: "1.45rem",
        textAlign: "left",          // ✅ SOLA YASLA
        display: "block",
    },

    diffSame: {
        display: "block",
        padding: "0 6px",
    },

    diffAdded: {
        display: "block",
        padding: "0 6px",
        background: "rgba(239,68,68,0.18)",
        borderLeft: "3px solid rgba(34,197,94,0.75)",
    },

    diffRemoved: {
        display: "block",
        padding: "0 6px",
        background: "rgba(239,68,68,0.22)",
        borderLeft: "3px solid rgba(239,68,68,0.75)",
        textDecoration: "line-through",
    },
    participantCodeBox: {
        marginBottom: "8px",
        background: "rgba(15,23,42,0.75)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "10px",
        padding: "10px",
    },

    codePreLeft: {
        margin: 0,
        fontFamily: "monospace",
        fontSize: "0.85rem",
        color: "#e5e7eb",
        whiteSpace: "pre-wrap",
        lineHeight: "1.45rem",
        textAlign: "left",
    },



};
