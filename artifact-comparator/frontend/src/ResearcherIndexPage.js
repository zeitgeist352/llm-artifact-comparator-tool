import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";

function ResearcherIndexPage() {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const [username] = useState(storedUser?.username || "Researcher");
    const [recentStudies, setRecentStudies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.backgroundColor = "black";
    }, []);

    useEffect(() => {
        const fetchRecentStudies = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch("http://localhost:8080/api/studies/my-studies", {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error("Failed to fetch studies");
                const data = await response.json();

                const sorted = data
                    .sort((a, b) => {
                        const dateA = new Date(a.updatedAt || a.createdAt);
                        const dateB = new Date(b.updatedAt || b.createdAt);
                        return dateB - dateA;
                    })
                    .slice(0, 3);

                setRecentStudies(sorted);
            } catch (error) {
                console.error("❌ Error fetching recent studies:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentStudies();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const handleMyProfile = () => navigate("/profile");
    const handleMyStudies = () => navigate("/my-studies");
    const handleMyArtifacts = () => navigate("/my-artifacts");
    const handleInfo = () => navigate("/info");

    const getStyleByStatus = (status) => {
        switch (status?.toUpperCase()) {
            case "DRAFT":
                return { border: "#facc15", badgeBg: "rgba(250,204,21,0.2)", badgeColor: "#fde047" };
            case "ACTIVE":
                return { border: "#22c55e", badgeBg: "rgba(34,197,94,0.2)", badgeColor: "#4ade80" };
            case "COMPLETED":
                return { border: "#3b82f6", badgeBg: "rgba(59,130,246,0.2)", badgeColor: "#60a5fa" };
            case "ARCHIVED":
                return { border: "#d1d5db", badgeBg: "rgba(255,255,255,0.15)", badgeColor: "#f3f4f6" };
            default:
                return { border: "#22c55e", badgeBg: "rgba(34,197,94,0.2)", badgeColor: "#4ade80" };
        }
    };

    return (
        <div style={styles.container}>

            {/* PARTICLES */}
            <div style={styles.particles}>
                {[...Array(55)].map((_, i) => {
                    const startY = Math.random() * 100;
                    const negDelay = -(Math.random() * 15).toFixed(2);

                    return (
                        <div
                            key={i}
                            style={{
                                ...styles.particle,
                                left: `${Math.random() * 100}%`,
                                top: `${startY}vh`,
                                animationDelay: `${negDelay}s`,
                                animationDuration: `${16 + Math.random() * 10}s`,
                                opacity: 0.45,
                            }}
                        />
                    );
                })}
            </div>

            {/* Navbar */}
            <div style={styles.navbar}>
                <h2 style={styles.title}>Researcher Dashboard</h2>
                <div style={styles.right}>
                    <button
                        style={styles.infoBtn}
                        onClick={handleInfo}
                        title="Information"
                        onMouseEnter={(e) => {
                            e.target.style.transform = "scale(1.1)";
                            e.target.style.background = "rgba(96, 165, 250, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = "scale(1)";
                            e.target.style.background = "rgba(96, 165, 250, 0.1)";
                        }}
                    >
                        <Info size={18} />
                    </button>

                    <span style={styles.userText}>{username}</span>

                    <button style={styles.profileButton} onClick={handleMyArtifacts}>
                        My Artifacts
                    </button>

                    <button style={styles.profileButton} onClick={handleMyProfile}>
                        My Profile
                    </button>

                    <button
                        style={styles.profileButton}
                        onClick={() => navigate("/my-invitations")}
                    >
                        My Invitations
                    </button>

                    <button
                        className="logout-btn"
                        style={styles.logout}
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={styles.mainContent}>
                <div style={styles.welcomeSection}>
                    <h1 style={styles.welcomeTitle}>Welcome to Your Research Space</h1>
                    <p style={styles.welcomeText}>
                        Manage your studies, create new research projects, and collaborate with participants.
                    </p>
                </div>

                {/* Buttons */}
                <div style={styles.actionButtons}>
                    <button
                        style={styles.primaryButton}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                        onClick={() => navigate("/create-study")}
                    >
                        <span style={styles.buttonIcon}></span>Create New Study
                    </button>

                    <button
                        style={styles.secondaryButton}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                        onClick={handleMyStudies}
                    >
                        <span style={styles.buttonIcon}></span>My Studies
                    </button>
                </div>

                {/* Recent Studies */}
                <div style={styles.recentSection}>
                    <h2 style={styles.sectionTitle}>Your Recent Studies</h2>

                    {loading ? (
                        <p>Loading recent studies...</p>
                    ) : recentStudies.length === 0 ? (
                        <p>No recent studies found for your account.</p>
                    ) : (
                        <div style={styles.studiesGrid}>
                            {recentStudies.map((study) => {
                                const theme = getStyleByStatus(study.status);
                                return (
                                    <div
                                        key={study.id}
                                        style={{
                                            ...styles.studyCard,
                                            border: `1px solid ${theme.border}`,
                                            boxShadow: `0 0 6px ${theme.border}55`,
                                        }}
                                    >
                                        <div style={styles.studyHeader}>
                                            <h3 style={styles.studyTitle}>{study.title}</h3>

                                            <span
                                                style={{
                                                    ...styles.statusBadge,
                                                    background: theme.badgeBg,
                                                    color: theme.badgeColor,
                                                }}
                                            >
                                                {study.status}
                                            </span>

                                            <span style={styles.visibilityBadge}>
                                                {study.visibility}
                                            </span>
                                        </div>

                                        <p style={styles.studyDescription}>{study.description}</p>

                                        <div style={styles.dateRow}>
                                            <span>
                                                Updated at:{" "}
                                                {new Date(
                                                    study.updatedAt || study.createdAt
                                                ).toLocaleDateString()}
                                            </span>
                                            <span>
                                                Ends at:{" "}
                                                {new Date(study.endDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer style={styles.footer}>
                © {new Date().getFullYear()} Artifact Comparator — Researcher Panel
            </footer>

            {/* Particle Animation */}
            <style>{`
                @keyframes floatParticle {
                    0% { transform: translateY(0); opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-120vh); opacity: 0; }
                }

                /* 🔥 Red Glow Hover for Logout */
                .logout-btn:hover {
                    transform: scale(1.06);
                    box-shadow: 0 0 18px rgba(239,68,68,0.7);
                    border-color: rgba(239,68,68,0.85) !important;
                }
            `}</style>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        paddingBottom: "60px",
        overflow: "hidden",
        position: "relative",
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
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "relative",
        zIndex: 10,
    },

    title: { fontSize: "1.5rem", fontWeight: "700", color: "#60a5fa" },

    right: { display: "flex", alignItems: "center", gap: "15px" },

    infoBtn: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        background: "rgba(96, 165, 250, 0.1)",
        border: "2px solid rgba(96, 165, 250, 0.5)",
        color: "#60a5fa",
        borderRadius: "50%",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },

    userText: { fontSize: "1.2rem", color: "#ffffff", fontWeight: "600" },

    profileButton: {
        background: "rgba(96, 165, 250, 0.1)",
        border: "2px solid rgba(96, 165, 250, 0.5)",
        color: "#60a5fa",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        transition: "all 0.3s ease",
    },

    logout: {
        background: "rgba(239,68,68,0.1)",
        border: "2px solid rgba(239,68,68,0.5)",
        color: "#f87171",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        transition: "all 0.25s ease-out",
    },

    mainContent: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px",
        position: "relative",
        zIndex: 1,
    },

    welcomeSection: { textAlign: "center", marginBottom: "50px" },

    welcomeTitle: {
        fontSize: "2.5rem",
        fontWeight: "700",
        marginBottom: "15px",
        background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },

    welcomeText: {
        fontSize: "1.1rem",
        color: "rgba(255,255,255,0.7)",
        maxWidth: "600px",
        margin: "0 auto",
    },

    actionButtons: {
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        marginBottom: "60px",
        flexWrap: "wrap",
    },

    primaryButton: {
        padding: "15px 35px",
        background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
        color: "white",
        border: "none",
        borderRadius: "12px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "1.1rem",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
    },

    secondaryButton: {
        padding: "15px 35px",
        background: "rgba(255,255,255,0.1)",
        color: "white",
        border: "2px solid rgba(255,255,255,0.2)",
        borderRadius: "12px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "1.1rem",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
    },

    buttonIcon: { fontSize: "1.3rem" },

    recentSection: { marginTop: "40px" },

    sectionTitle: {
        fontSize: "1.8rem",
        fontWeight: "700",
        color: "#93c5fd",
        marginBottom: "30px",
    },

    studiesGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "25px",
    },

    studyCard: {
        background: "rgba(255,255,255,0.05)",
        padding: "25px",
        borderRadius: "15px",
        color: "#fff",
    },

    studyHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
        gap: "10px",
        flexWrap: "wrap",
    },

    studyTitle: {
        fontSize: "1.1rem",
        fontWeight: "600",
        color: "#fff",
        margin: 0,
        flex: 1,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },

    statusBadge: {
        flexShrink: 0,
        padding: "4px 14px",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: "600",
        minWidth: "70px",
        textAlign: "center",
    },

    visibilityBadge: {
        flexShrink: 0,
        padding: "4px 14px",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: "600",
        color: "#60a5fa",
        background: "rgba(96,165,250,0.15)",
    },

    studyDescription: {
        color: "rgba(255,255,255,0.9)",
        fontSize: "0.95rem",
        marginBottom: "10px",
    },

    dateRow: {
        display: "flex",
        justifyContent: "space-between",
        color: "rgba(255,255,255,0.8)",
        fontSize: "0.85rem",
        marginTop: "8px",
        flexWrap: "wrap",
        gap: "6px",
    },

    footer: {
        textAlign: "center",
        marginTop: "80px",
        color: "rgba(255,255,255,0.45)",
        fontSize: "0.9rem",
        paddingBottom: "30px",
    },

};

export default ResearcherIndexPage;
