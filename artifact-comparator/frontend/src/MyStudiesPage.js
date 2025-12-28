// MyStudiesPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function MyStudiesPage() {
    const navigate = useNavigate();
    const [myStudies, setMyStudies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    /* --------------- FILTER STATES ---------------- */
    const [visibilityFilter, setVisibilityFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");

    const currentUser = JSON.parse(localStorage.getItem("user"));
    const currentUserId = currentUser?.id;
    const [hoverBack, setHoverBack] = useState(false);

    /* --------------- FILTERS OPEN ---------------- */
    const [filtersOpen, setFiltersOpen] = useState(false);

    /* --------------- PARTICLES ---------------- */
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

    /* --------------- TOAST ---------------- */
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3200);
    };

    /* --------------- FETCH STUDIES ---------------- */
    useEffect(() => {
        const fetchMyStudies = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch("http://localhost:8080/api/studies/my-studies", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) throw new Error("Failed to fetch studies.");
                const data = await response.json();
                setMyStudies(data);
            } catch (error) {
                console.error("❌ Error fetching studies:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyStudies();
    }, []);

    /* ---------------- MANAGE TASKS CHECK ---------------- */
    const handleManageTasks = async (studyId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/studies/${studyId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                triggerToast("❌ Study could not be loaded.");
                return;
            }

            const study = await res.json();
            const hasCriteria = (study.evaluationCriteria?.length || 0) > 0;

            if (!hasCriteria) {
                triggerToast("⚠ No evaluation criteria found — Redirecting...");
                setTimeout(() => navigate(`/manage-criteria/${studyId}`), 2000);
                return;
            }

            navigate(`/manage-tasks/${studyId}`);
        } catch (err) {
            console.error("Error checking criteria:", err);
            triggerToast("⚠ Unable to check evaluation criteria.");
        }
    };

    /* --------------- CARD BORDER COLOR BY STATUS ---------------- */
    const getStyleByStatus = (status) => {
        switch (status?.toUpperCase()) {
            case "DRAFT":
                return { border: "#facc15" };
            case "ACTIVE":
                return { border: "#22c55e" };
            case "COMPLETED":
                return { border: "#3b82f6" };
            case "ARCHIVED":
                return { border: "#d1d5db" };
            default:
                return { border: "#a5b4fc" };
        }
    };

    /* ---------------- FULL FILTERING ---------------- */
    const filteredStudies = myStudies.filter((s) => {
        const matchesSearch =
            s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesVisibility =
            visibilityFilter === "ALL" || s.visibility === visibilityFilter;

        const matchesStatus =
            statusFilter === "ALL" || s.status.toUpperCase() === statusFilter;

        const matchesType =
            typeFilter === "ALL" || s.studyType === typeFilter;

        return matchesSearch && matchesVisibility && matchesStatus && matchesType;
    });

    return (
        <div style={styles.container}>
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

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>My Studies</h2>

                <button
                    style={{
                        ...styles.backButton,
                        ...(hoverBack ? styles.backButtonHover : {}),
                    }}
                    onMouseEnter={() => setHoverBack(true)}
                    onMouseLeave={() => setHoverBack(false)}
                    onClick={() => navigate("/researcher")}
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* TOAST */}
            {showToast && <div style={styles.toast}>{toastMessage}</div>}

            {/* CENTERED WRAPPER */}
            <div style={styles.centerWrapper}>
                {/* SEARCH */}
                <div style={styles.searchContainer}>
                    <span style={styles.searchIcon}>🔍</span>
                    <input
                        placeholder="Search studies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>

                {/* FILTERS */}
                <div style={styles.filterWrapper}>
                    <button
                        style={styles.filterToggle}
                        onClick={() => setFiltersOpen(!filtersOpen)}
                    >
                        {filtersOpen ? "▲ Hide Filters" : "▼ Show Filters"}
                    </button>

                    {/* PANEL */}
                    <div
                        style={{
                            ...styles.filterPanel,
                            maxHeight: filtersOpen ? "700px" : "0px",
                            padding: filtersOpen ? "20px" : "0px 20px",
                            opacity: filtersOpen ? 1 : 0,
                        }}
                    >
                        {/* ⭐ FIRST ROW → VISIBILITY + STATUS SIDE BY SIDE */}
                        <div style={styles.filterRow}>
                            {/* VISIBILITY */}
                            <div style={{ ...styles.filterGroup, flex: 0.8 }}>
                                <h4 style={styles.filterTitle}>Visibility</h4>
                                <div style={styles.filterButtons}>
                                    {["ALL", "PUBLIC", "PRIVATE"].map((v) => (
                                        <button
                                            key={v}
                                            style={{
                                                ...styles.filterButton,
                                                ...(visibilityFilter === v ? styles.filterButtonActive : {}),
                                            }}
                                            onClick={() => setVisibilityFilter(v)}
                                        >
                                            {v.charAt(0) + v.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* STATUS */}
                            <div style={{ ...styles.filterGroup, flex: 1.7 }}>
                                <h4 style={styles.filterTitle}>Status</h4>
                                <div style={styles.filterButtons}>
                                    {["ALL", "DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"].map((s) => (
                                        <button
                                            key={s}
                                            style={{
                                                ...styles.filterButton,
                                                ...(statusFilter === s ? styles.filterButtonActive : {}),
                                            }}
                                            onClick={() => setStatusFilter(s)}
                                        >
                                            {s.charAt(0) + s.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ⭐ SECOND ROW → STUDY TYPE BELOW */}
                        <div style={styles.filterGroup}>
                            <h4 style={styles.filterTitle}>Study Type</h4>
                            <div style={styles.filterButtons}>
                                {[
                                    "ALL",
                                    "BUG_CATEGORIZATION",
                                    "CODE_CLONE",
                                    "SNAPSHOT_TESTING",
                                    "SOLID_DETECTION",
                                    "CUSTOM",
                                ].map((t) => {
                                    const label =
                                        t === "ALL"
                                            ? "All"
                                            : t
                                                .replace(/_/g, " ")
                                                .toLowerCase()
                                                .replace(/\b\w/g, (c) => c.toUpperCase());

                                    return (
                                        <button
                                            key={t}
                                            style={{
                                                ...styles.filterButton,
                                                ...(typeFilter === t ? styles.filterButtonActive : {}),
                                            }}
                                            onClick={() => setTypeFilter(t)}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div style={styles.studyList}>
                    {loading ? (
                        <p style={styles.loading}>Loading your studies...</p>
                    ) : filteredStudies.length === 0 ? (
                        <p style={styles.empty}>No studies match your filters.</p>
                    ) : (
                        filteredStudies.map((study) => {
                            const theme = getStyleByStatus(study.status);

                            // ⭐ OWNER CHECK — Same logic as ManageStudyPage
                            const isOwner = currentUserId && study.researcher &&
                                (Number(study.researcher.id) === Number(currentUserId));

                            return (
                                <div
                                    key={study.id}
                                    style={{
                                        ...styles.studyCard,
                                        border: `1px solid ${theme.border}AA`,
                                        boxShadow: `0 0 4px ${theme.border}50`,
                                    }}
                                >
                                    <div style={styles.studyHeader}>
                                        <h2 style={styles.studyTitle}>{study.title}</h2>

                                        {/* BADGES GROUP */}
                                        <div style={styles.badgeGroup}>
                                            {/* ⭐ Study Type Badge */}
                                            <span style={styles.unifiedBadge}>
                                                {study.studyType
                                                    .replace(/_/g, " ")
                                                    .toLowerCase()
                                                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                                            </span>

                                            {/* ⭐ Visibility Badge */}
                                            <span style={styles.unifiedBadge}>
                                                {study.visibility
                                                    .toLowerCase()
                                                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                                            </span>
                                        </div>

                                        {/* ⭐ Main Researcher Badge */}
                                        <span style={styles.unifiedBadge}>
                                            {isOwner ? "Main researcher" : "Co-researcher"}
                                        </span>
                                    </div>

                                    <p style={styles.studyDescription}>{study.description}</p>

                                    {/* FOOTER BUTTONS — Conditional rendering based on isOwner */}
                                    <div style={styles.studyFooter}>
                                        {/* ⭐ Only show Tasks & Criteria buttons if user is owner */}
                                        {isOwner && (
                                            <>
                                                <button
                                                    style={styles.tasksButton}
                                                    onClick={() => handleManageTasks(study.id)}
                                                >
                                                    Manage Tasks
                                                </button>

                                                <button
                                                    style={styles.criteriaButton}
                                                    onClick={() => navigate(`/manage-criteria/${study.id}`)}
                                                >
                                                    Evaluation Criteria Details
                                                </button>
                                            </>
                                        )}

                                        {/* ⭐ Always show Manage Study button for everyone */}
                                        <button
                                            style={styles.manageButton}
                                            onClick={() => navigate(`/manage-study/${study.id}`)}
                                        >
                                            Manage Study
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* KEYFRAMES */}
            <style>
                {`
                    @keyframes floatParticle {
                        0% { transform: translateY(0); opacity: 0.4; }
                        50% { opacity: 1; }
                        100% { transform: translateY(-120vh); opacity: 0; }
                    }

                    @keyframes toastFadeInOut {
                        0% { opacity: 0; transform: translate(-50%, -10px); }
                        10% { opacity: 1; transform: translate(-50%, 0px); }
                        90% { opacity: 1; transform: translate(-50%, 0px); }
                        100% { opacity: 0; transform: translate(-50%, -10px); }
                    }
                `}
            </style>
        </div>
    );
}

/* -------------------- STYLES -------------------- */

const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
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
        zIndex: 10,
    },

    navTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#60a5fa",
    },

    backButton: {
        background: "rgba(220,38,38,0.15)",
        border: "2px solid rgba(220,38,38,0.55)",
        color: "#ef4444",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        transition: "0.35s",
        boxShadow: "0 0 10px rgba(220,38,38,0.35)",
    },
    backButtonHover: {
        background: "rgba(220,38,38,0.25)",
        boxShadow: "0 0 16px rgba(220,38,38,0.5)",
    },

    toast: {
        position: "fixed",
        top: "90px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(14,165,233,0.22)",
        border: "1.5px solid rgba(14,165,233,0.5)",
        borderRadius: "12px",
        padding: "12px 20px",
        color: "#7dd3fc",
        fontWeight: "600",
        fontSize: "0.95rem",
        backdropFilter: "blur(6px)",
        boxShadow: "0 0 12px rgba(14,165,233,0.45)",
        zIndex: 9999,
        animation: "toastFadeInOut 3.2s ease forwards",
    },

    centerWrapper: {
        width: "90%",
        maxWidth: "850px",
        margin: "0 auto",
        paddingTop: "20px",
        position: "relative",
        zIndex: 2,
    },

    /* SEARCH */
    searchContainer: {
        width: "100%",
        maxWidth: "850px",
        margin: "0 auto 18px auto",
        position: "relative",
    },

    searchIcon: {
        position: "absolute",
        left: "26px",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "1.2rem",
        opacity: 0.6,
    },

    searchInput: {
        width: "100%",
        padding: "12px 18px 12px 50px",
        borderRadius: "15px",
        border: "1.5px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.05)",
        color: "#fff",
        fontSize: "1.05rem",
        outline: "none",
        boxSizing: "border-box",
    },

    /* FILTERS */
    filterWrapper: {
        width: "100%",
        marginBottom: "25px",
    },

    filterToggle: {
        width: "100%",
        padding: "12px 18px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#93c5fd",
        fontSize: "1rem",
        cursor: "pointer",
        transition: "0.3s",
    },

    filterPanel: {
        overflow: "hidden",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.12)",
        marginTop: "10px",
        transition: "all 0.35s ease",
    },

    filterRow: {
        display: "flex",
        gap: "20px",
        width: "100%",
        marginBottom: "18px",
    },

    filterGroup: {
        marginBottom: "18px",
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
        textTransform: "capitalize",
    },

    filterButtonActive: {
        background: "rgba(96,165,250,0.18)",
        border: "1px solid rgba(96,165,250,0.5)",
        color: "#93c5fd",
        boxShadow: "0 0 8px rgba(96,165,250,0.35)",
    },

    /* STUDY LIST */
    studyList: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "25px",
    },

    studyCard: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "15px",
        padding: "25px 30px",
        transition: "0.3s",
    },

    studyHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
        gap: "10px",
        flexWrap: "wrap",
    },

    badgeGroup: {
        display: "flex",
        gap: "10px",
    },

    studyTitle: {
        fontSize: "1.3rem",
        fontWeight: "700",
        color: "#fff",
        margin: 0,
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    /* ⭐ UNIFIED BADGE STYLE */
    unifiedBadge: {
        padding: "4px 14px",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: "600",
        background: "rgba(99,102,241,0.20)",
        border: "1px solid rgba(99,102,241,0.45)",
        color: "#a5b4fc",
        textTransform: "capitalize",
        minWidth: "110px",
        textAlign: "center",
    },

    /* DESCRIPTION */
    studyDescription: {
        color: "rgba(255,255,255,0.9)",
        fontSize: "1rem",
        marginBottom: "20px",
    },

    studyFooter: {
        display: "flex",
        gap: "12px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        paddingTop: "12px",
        flexWrap: "wrap",
    },

    tasksButton: {
        flex: 1,
        background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "10px 18px",
        fontWeight: "600",
        fontSize: "0.95rem",
        cursor: "pointer",
        transition: "0.3s",
    },

    criteriaButton: {
        flex: 1,
        background: "linear-gradient(135deg, #10b981, #22c55e)",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "10px 18px",
        fontWeight: "600",
        fontSize: "0.95rem",
        cursor: "pointer",
        transition: "0.3s",
    },

    manageButton: {
        flex: 1,
        background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "10px 18px",
        fontWeight: "600",
        fontSize: "0.95rem",
        cursor: "pointer",
        transition: "0.3s",
    },

    loading: { color: "#a5b4fc", textAlign: "center" },
    empty: { color: "rgba(255,255,255,0.6)", textAlign: "center" },
};

export default MyStudiesPage;
