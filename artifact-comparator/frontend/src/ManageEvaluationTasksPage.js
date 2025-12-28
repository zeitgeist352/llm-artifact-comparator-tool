// ManageEvaluationTasksPage.js
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ----------------------------------------------------
   PARTICLES (MyStudiesPage ile birebir aynı)
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
   MAIN PAGE COMPONENT
----------------------------------------------------- */
function ManageEvaluationTasksPage() {
    const { studyId } = useParams();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [study, setStudy] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [modeFilter, setModeFilter] = useState("All");
    const [sortOption, setSortOption] = useState("TaskID");  // Change from "Alphabetical"

    const [reportCounts, setReportCounts] = useState({});
    const [filtersOpen, setFiltersOpen] = useState(false);

    const getTaskMode = (count) => {
        if (count === 1) return "Single";
        if (count === 2) return "Side-by-Side";
        if (count === 3) return "3-Way";
        return `${count}-Way`;
    };

    /* FETCH ALL */
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const token = localStorage.getItem("token");

                const [studyRes, tasksRes, partsRes] = await Promise.all([
                    fetch(`http://localhost:8080/api/studies/${studyId}`),
                    fetch(`http://localhost:8080/api/tasks/study/${studyId}`),
                    fetch(`http://localhost:8080/api/studies/${studyId}/participants`),
                ]);

                const studyData = await studyRes.json();
                const tasksData = await tasksRes.json();
                const partsData = await partsRes.json();

                setStudy(studyData);
                setTasks(tasksData);
                setParticipants(partsData);

                const reportMap = {};
                for (const t of tasksData) {
                    const r = await fetch(
                        `http://localhost:8080/api/reports/task/${t.id}/count`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    reportMap[t.id] = await r.json();
                }
                setReportCounts(reportMap);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [studyId]);

    /* COMPLETION */
    const calcCompletion = (task) => {
        if (participants.length === 0) return 0;
        return Math.round(
            ((task.completedParticipants?.length || 0) / participants.length) * 100
        );
    };

    /* SORT + FILTER */
    /* SORT + FILTER */
    const filteredTasks = useMemo(() => {
        let list = [...tasks];

        if (search.trim() !== "") {
            list = list.filter((t) =>
                t.questionText.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (modeFilter !== "All") {
            list = list.filter((t) => getTaskMode(t.artifactCount) === modeFilter);
        }

        list.sort((a, b) => {
            if (sortOption === "Alphabetical") {
                return a.questionText.localeCompare(b.questionText);
            }
            if (sortOption === "TaskID") {
                return a.id - b.id;  // Numeric comparison
            }
            if (sortOption === "CompletionHigh") {
                return calcCompletion(b) - calcCompletion(a);
            }
            if (sortOption === "CompletionLow") {
                return calcCompletion(a) - calcCompletion(b);
            }
            if (sortOption === "ArtifactHigh") {
                return b.artifactCount - a.artifactCount;
            }
            return 0;
        });

        return list;
    }, [tasks, search, modeFilter, sortOption]);


    /* RENDER */
    return (
        <div style={styles.container}>
            <FloatingParticles />

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>
                    Evaluation Tasks — {study?.title || ""}
                </h2>


                <div style={{ display: "flex", gap: "12px" }}>
                    {/* MONITOR STUDY PROGRESS */}
                    <button
                        style={styles.monitorButton}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.boxShadow = "0 0 18px rgba(59,130,246,0.6)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 0 12px rgba(59,130,246,0.35)";
                        }}
                        onClick={() => navigate(`/monitor-study/${studyId}`)} // 🔥 Sonradan routing'i buradan değiştirebilirsin
                    >
                        Monitor Study Progress
                    </button>


                    {/* BULK UPLOAD — always visible for all study types */}
                    <button
                        style={styles.bulkButton}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.boxShadow = "0 0 18px rgba(34,197,94,0.6)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 0 12px rgba(34,197,94,0.35)";
                        }}
                        onClick={() => navigate(`/bulk-upload/${studyId}`)}
                    >
                        Bulk Upload
                    </button>

                    {/* ADD TASK */}
                    <button
                        style={styles.addButton}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        onClick={() => navigate(`/add-task/${studyId}`)}
                    >
                        ＋ Add Task
                    </button>

                    {/* BACK */}
                    <button
                        style={styles.backButton}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.boxShadow = "0 0 18px rgba(220,38,38,0.7)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 0 12px rgba(220,38,38,0.4)";
                        }}
                        onClick={() => navigate("/my-studies")}
                    >
                        ← Back
                    </button>

                </div>

            </div>

            <div style={styles.centerWrapper}>
                {/* SEARCH */}
                <div style={styles.searchContainer}>
                    <span style={styles.searchIcon}>🔍</span>
                    <input
                        placeholder="Search tasks..."
                        style={styles.searchInput}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* FILTERS — MyStudiesPage tarzı kutucuklu panel */}
                <div style={styles.filterWrapper}>
                    <button
                        style={styles.filterToggle}
                        onClick={() => setFiltersOpen((prev) => !prev)}
                    >
                        {filtersOpen ? "▲ Hide Filters" : "▼ Show Filters"}
                    </button>

                    <div
                        style={{
                            ...styles.filterPanel,
                            maxHeight: filtersOpen ? "300px" : "0px",
                            padding: filtersOpen ? "18px 20px 20px 20px" : "0 20px",
                            opacity: filtersOpen ? 1 : 0,
                        }}
                    >
                        {/* MODE + SORT satırı */}
                        <div style={styles.filterGroupsRow}>
                            {/* MODE FILTER */}
                            <div style={{ ...styles.filterGroup, flex: 1 }}>
                                <h4 style={styles.filterTitle}>Task Mode</h4>
                                <div style={styles.filterButtons}>
                                    {[
                                        { value: "All", label: "All modes" },
                                        { value: "Single", label: "Single" },
                                        { value: "Side-by-Side", label: "Side-by-Side" },
                                        { value: "3-Way", label: "3-Way" },
                                        { value: "4-Way", label: "4-Way+" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            style={{
                                                ...styles.filterButton,
                                                ...(modeFilter === opt.value
                                                    ? styles.filterButtonActive
                                                    : {}),
                                            }}
                                            onClick={() => setModeFilter(opt.value)}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* SORT FILTER */}
                            <div style={{ ...styles.filterGroup, flex: 1 }}>
                                <h4 style={styles.filterTitle}>Sort by</h4>
                                <div style={styles.filterButtons}>
                                    {[
                                        { value: "TaskID", label: "Task ID ↑" },  // Add this line
                                        { value: "Alphabetical", label: "A → Z" },
                                        { value: "CompletionHigh", label: "Completion ↓" },
                                        { value: "CompletionLow", label: "Completion ↑" },
                                        { value: "ArtifactHigh", label: "Artifact count" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            style={{
                                                ...styles.filterButton,
                                                ...(sortOption === opt.value
                                                    ? styles.filterButtonActive
                                                    : {}),
                                            }}
                                            onClick={() => setSortOption(opt.value)}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div style={styles.content}>
                    {loading ? (
                        <p style={styles.loading}>Loading...</p>
                    ) : filteredTasks.length === 0 ? (
                        <p style={styles.empty}>No tasks match your filters.</p>
                    ) : (
                        <div style={styles.taskGrid}>
                            {filteredTasks.map((task) => {
                                const completion = calcCompletion(task);
                                const artifactCount = task.artifacts?.length || 0;
                                const reports = reportCounts[task.id] || 0;

                                return (
                                    <div
                                        key={task.id}
                                        style={styles.taskCard}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform =
                                                "translateY(-4px)";
                                            e.currentTarget.style.boxShadow =
                                                "0 10px 25px rgba(0,0,0,0.25)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform =
                                                "translateY(0)";
                                            e.currentTarget.style.boxShadow =
                                                "0 0 10px rgba(0,0,0,0.15)";
                                        }}
                                    >
                                        {/* TITLE */}
                                        <h3 style={styles.taskTitle}>
                                            #{task.id} - {task.questionText}
                                        </h3>

                                        {/* DESCRIPTION */}
                                        <p style={styles.taskDesc}>
                                            Evaluates {artifactCount} artifact(s) across{" "}
                                            {study?.evaluationCriteria?.length || 0}{" "}
                                            criteria.
                                        </p>

                                        {/* PROGRESS BAR */}
                                        <div style={styles.progressContainer}>
                                            <div style={styles.progressBackground}>
                                                <div
                                                    style={{
                                                        ...styles.progressFill,
                                                        width: `${completion}%`,
                                                    }}
                                                />
                                            </div>
                                            <span style={styles.progressLabel}>
                                                {completion}% completed
                                            </span>
                                        </div>

                                        {/* FOOTER (TOP) */}
                                        <div style={styles.footerTopRow}>
                                            <p style={styles.meta}>
                                                📁 {artifactCount} artifacts
                                            </p>
                                            <p style={styles.meta}>
                                                👥 {task.completedParticipants?.length || 0}/
                                                {participants.length}
                                            </p>

                                            <button
                                                style={styles.manageButton}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.transform = "scale(1.05)")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.transform = "scale(1)")
                                                }
                                                onClick={() =>
                                                    navigate(`/manage-task/${task.id}`)
                                                }
                                            >
                                                ⚙ Manage Task
                                            </button>
                                        </div>

                                        {/* FOOTER (BOTTOM) */}
                                        <div style={styles.footerBottomRow}>
                                            <p
                                                style={{
                                                    ...styles.reportBadge,
                                                    color:
                                                        reports > 0
                                                            ? "#fca5a5"
                                                            : "#94a3b8",
                                                }}
                                            >
                                                ⚠ {reports} reports
                                            </p>

                                            <button
                                                style={styles.footerButtonRed}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.transform = "scale(1.05)")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.transform = "scale(1)")
                                                }
                                                onClick={() =>
                                                    navigate(
                                                        `/task/${task.id}/reports`
                                                    )
                                                }
                                            >
                                                🔍 View Reports
                                            </button>

                                            <button
                                                style={styles.footerButtonBlue}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.transform = "scale(1.05)")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.transform = "scale(1)")
                                                }
                                                onClick={() =>
                                                    navigate(
                                                        `/task/${task.id}/comments`
                                                    )
                                                }
                                            >
                                                💬 Manage Comments
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
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
   STYLES — MyStudiesPage teması
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
        background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
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
        color: "#60a5fa",
    },

    addButton: {
        background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
        color: "white",
        border: "none",
        borderRadius: "10px",
        padding: "10px 20px",
        cursor: "pointer",
        fontWeight: "700",
        boxShadow: "0 0 12px rgba(79,70,229,0.4)",
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
        boxShadow: "0 0 12px rgba(220,38,38,0.35)",
        transition: "0.2s ease",
    },

    /* WRAPPER */
    centerWrapper: {
        width: "90%",
        maxWidth: "1050px",
        margin: "0 auto",
        paddingTop: "20px",
        zIndex: 2,
    },

    /* SEARCH */
    searchContainer: {
        position: "relative",
        marginBottom: "12px",
        width: "93.85%",
    },

    searchIcon: {
        position: "absolute",
        top: "50%",
        left: "18px",
        transform: "translateY(-50%)",
        opacity: 0.6,
    },


    searchInput: {
        width: "100%",
        height: "40px",
        padding: "8px 16px 8px 46px",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.05)",
        color: "white",
        fontSize: "1rem",
        transition: "0.3s",
    },


    /* FILTERS */
    filterWrapper: {
        width: "100%",
        marginBottom: "25px",
    },

    filterToggle: {
        width: "100%",
        height: "50px",
        padding: "12px 18px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#93c5fd",
        fontSize: "1rem",
        cursor: "pointer",
        transition: "0.3s",
        textAlign: "left",
    },

    filterPanel: {
        overflow: "hidden",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.12)",
        marginTop: "10px",
        transition: "all 0.3s ease",
    },

    filterGroupsRow: {
        display: "flex",
        gap: "22px",
        width: "100%",
        flexWrap: "wrap",
    },

    filterGroup: {
        marginBottom: "16px",
    },

    filterTitle: {
        marginBottom: "10px",
        fontSize: "0.95rem",
        color: "#a5b4fc",
        fontWeight: "600",
    },

    filterButtons: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
    },

    filterButton: {
        padding: "6px 14px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#cbd5e1",
        fontSize: "0.9rem",
        cursor: "pointer",
        transition: "0.25s",
        textTransform: "none",
        whiteSpace: "nowrap",
    },

    filterButtonActive: {
        background: "rgba(96,165,250,0.18)",
        border: "1px solid rgba(96,165,250,0.5)",
        color: "#93c5fd",
        boxShadow: "0 0 8px rgba(96,165,250,0.35)",
    },

    /* CONTENT */
    content: {
        marginTop: "20px",
    },

    taskGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "25px",
    },

    /* CARD */
    taskCard: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "15px",
        padding: "24px 26px",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(6px)",
        transition: "0.28s ease",
        boxShadow: "0 0 12px rgba(0,0,0,0.25)",
    },

    taskTitle: {
        fontSize: "1.2rem",
        fontWeight: "700",
        marginBottom: "8px",
        color: "white",
    },

    taskDesc: {
        fontSize: "0.95rem",
        color: "rgba(255,255,255,0.85)",
        marginBottom: "14px",
    },

    /* PROGRESS */
    progressContainer: {
        marginBottom: "16px",
    },

    progressBackground: {
        width: "100%",
        height: "10px",
        background: "rgba(255,255,255,0.10)",
        borderRadius: "10px",
    },

    progressFill: {
        height: "100%",
        background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
        borderRadius: "10px",
        transition: "width 0.3s ease",
    },

    progressLabel: {
        marginTop: "6px",
        fontSize: "0.85rem",
        color: "#cbd5e1",
    },

    /* FOOTERS */
    footerTopRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "8px",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        marginBottom: "10px",
        columnGap: "12px",
    },

    footerBottomRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        alignItems: "center",
        columnGap: "12px",
        marginTop: "4px",
    },

    meta: {
        fontSize: "0.9rem",
        color: "rgba(255,255,255,0.85)",
    },

    reportBadge: {
        fontSize: "0.9rem",
    },

    /* BUTTONS */
    manageButton: {
        background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
        color: "white",
        border: "none",
        borderRadius: "10px",
        padding: "10px 22px",
        cursor: "pointer",
        fontWeight: "700",
        transition: "0.25s",
        boxShadow: "0 0 12px rgba(79,70,229,0.4)",
        whiteSpace: "nowrap",
        textAlign: "center",
        flexShrink: 0,
    },

    footerButtonRed: {
        background: "rgba(239,68,68,0.18)",
        border: "1px solid rgba(239,68,68,0.45)",
        color: "#fca5a5",
        padding: "8px 14px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        whiteSpace: "nowrap",
        textAlign: "center",
        transition: "0.25s ease",
    },

    footerButtonBlue: {
        background: "rgba(147,197,253,0.18)",
        border: "1px solid rgba(147,197,253,0.45)",
        color: "#bfdbfe",
        padding: "8px 14px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        whiteSpace: "nowrap",
        textAlign: "center",
        transition: "0.25s ease",
    },

    bulkButton: {
        background: "linear-gradient(135deg, #059669, #10b981)", // Yeşil gradient
        color: "white",
        border: "none",
        borderRadius: "10px",
        padding: "10px 20px",
        cursor: "pointer",
        fontWeight: "700",
        boxShadow: "0 0 12px rgba(16,185,129,0.4)", // Yeşil glow
        transition: "0.25s ease",
        whiteSpace: "nowrap",
    },
    monitorButton: {
        background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", // Mavi gradient
        color: "white",
        border: "none",
        borderRadius: "10px",
        padding: "10px 20px",
        cursor: "pointer",
        fontWeight: "700",
        boxShadow: "0 0 12px rgba(59,130,246,0.35)",
        transition: "0.25s ease",
        whiteSpace: "nowrap",
    },

    loading: { color: "#a5b4fc", textAlign: "center" },
    empty: { color: "rgba(255,255,255,0.6)", textAlign: "center" },
};

export default ManageEvaluationTasksPage;
