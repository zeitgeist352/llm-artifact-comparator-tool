import React, { useEffect, useState } from "react";
import {useNavigate} from "react-router-dom";
import {User, Info} from "lucide-react";

function ReviewerIndexPage() {
    const [username, setUsername] = useState("");
    const [userId, setUserId] = useState(null);
    const [joinedStudies, setJoinedStudies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // NEW: pending invitations state

    const [pendingInvitations, setPendingInvitations] = useState([]);

    const [reportingStudyId, setReportingStudyId] = useState(null);
    const [reportReason, setReportReason] = useState("");

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Good morning";
        if (hour >= 12 && hour < 17) return "Good afternoon";
        if (hour >= 17 && hour < 22) return "Good evening";
        return "Good night";
    };
    const handleReportClick = (e, studyId) => {
        e.stopPropagation(); // Prevents navigating to the study page
        setReportingStudyId(studyId);
        setReportReason("");
    };
    const handleSubmitReport = async () => {
        if (!reportReason.trim()) {
            alert("Please enter a reason.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `http://localhost:8080/api/studies/${reportingStudyId}/report`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ reason: reportReason })
                }
            );

            if (res.ok) {
                alert("Study reported successfully.");
                setReportingStudyId(null);
                setReportReason("");
                fetchJoinedStudies(); // Refresh list to update status
            } else {
                alert("Failed to report study.");
            }
        } catch (err) {
            console.error("Error reporting study:", err);
        }
    };
    const joinStudyAndAction = async (studyId, actionCallback) => {
        if (!userId) return;
        try {
            const token = localStorage.getItem("token");
            const joinRes = await fetch(
                `http://localhost:8080/api/reviewers/${userId}/join-study/${studyId}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (joinRes.ok || joinRes.status === 400) {
                if (actionCallback) await actionCallback();
            }
        } catch (err) {
            console.error("Error joining study:", err);
        }
    };



    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        if (storedUser && storedUser.username) {
            setUsername(storedUser.username);
            setUserId(storedUser.id);
        } else {
            navigate("/");
        }
    }, [navigate]);

    // Fetch joined studies
    const fetchJoinedStudies = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `http://localhost:8080/api/reviewers/${userId}/joined-studies`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setJoinedStudies(data);
            }
        } catch (err) {
            console.error("Failed to fetch joined studies:", err);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        if (!userId) return;
        fetchJoinedStudies();
    }, [userId]);

    // NEW: fetch invitations for role REVIEWER, then filter to PENDING
    useEffect(() => {
        const fetchInvitations = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                const res = await fetch(
                    "http://localhost:8080/api/invitations/my-invitations?role=REVIEWER",
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (res.ok) {
                    const data = await res.json();
                    const pendingOnly = (data || []).filter(
                        (inv) => inv.status === "PENDING"
                    );
                    setPendingInvitations(pendingOnly);
                } else {
                    console.error("Failed to fetch invitations");
                }
            } catch (e) {
                console.error("Error fetching invitations:", e);
            }
        };
        fetchInvitations();
    }, []);

    const handleInfo = () => {
        navigate("/info");
    };


    // NEW: accept / reject invitation by studyId
    const handleAcceptInvitation = async (studyId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const res1 = await fetch(`http://localhost:8080/api/reviewers/${userId}/join-study/${studyId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const res = await fetch(
                `http://localhost:8080/api/invitations/${studyId}/accept`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (res.ok) {
                alert("Invitation accepted.");
                setPendingInvitations((prev) =>
                    prev.filter((inv) => inv.study.id !== studyId)
                );
                await fetchJoinedStudies();
            } else {
                alert("Failed to accept invitation.");
            }
        } catch (e) {
            console.error("Error accepting invitation:", e);
        }
    };

    const handleRejectInvitation = async (studyId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await fetch(
                `http://localhost:8080/api/invitations/${studyId}/reject`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (res.ok) {
                alert("Invitation rejected.");
                setPendingInvitations((prev) =>
                    prev.filter((inv) => inv.study.id !== studyId)
                );
            } else {
                alert("Failed to reject invitation.");
            }
        } catch (e) {
            console.error("Error rejecting invitation:", e);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const handleProfile = () => {
        navigate("/profile");
    };

    const handleStudyClick = (studyId) => {
        navigate(`/monitor-study/${studyId}`)
    };

    useEffect(() => {
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.overflowY = "auto";
        document.body.style.overflowX = "hidden";
        const styleSheet = document.createElement("style");
        styleSheet.textContent = `
      @keyframes float { 
        0%, 100% { transform: translateY(0px); } 
        50% { transform: translateY(-20px); } 
      }
      @keyframes floatParticle {
        0% { transform: translateY(0); opacity: 0.4; }
        50% { opacity: 1; }
        100% { transform: translateY(-120vh); opacity: 0; }
      }
      @keyframes pulse { 
        0%, 100% { opacity: 0.5; } 
        50% { opacity: 0.8; } 
      }
      .nav-button:hover, .logout-button:hover, .reject-button:hover, 
      .action-button:hover, .approve-button:hover, .report-button:hover {
        transform: translateY(-2px) !important;
      }
      .study-card:hover {
        transform: translateY(-4px) !important;
        box-shadow: 0 8px 24px rgba(96, 165, 250, 0.3) !important;
        border-color: rgba(96, 165, 250, 0.5) !important;
      }
      .logout-button:hover {
        transform: scale(1.06) !important;
        box-shadow: 0 0 18px rgba(239,68,68,0.7) !important;
        border-color: rgba(239,68,68,0.85) !important;
      }
    `;
        document.head.appendChild(styleSheet);
        return () => document.head.removeChild(styleSheet);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case "published":
                return { bg: "rgba(34, 197, 94, 0.2)", color: "#22c55e" };
            case "in-progress":
                return { bg: "rgba(96, 165, 250, 0.2)", color: "#60a5fa" };
            case "draft":
                return { bg: "rgba(156, 163, 175, 0.2)", color: "#9ca3af" };
            default:
                return { bg: "rgba(251, 146, 60, 0.2)", color: "#fb923c" };
        }
    };

    return (
        <div style={styles.container}>
            {/* Particles */}
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

            <div style={styles.navbar}>
                <div style={styles.navLeft}>
                    <span style={styles.welcomeText}>Reviewer Dashboard</span>
                </div>
                <div style={styles.navRight}>
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
                    <button style={styles.profileBtn} onClick={handleProfile}>
                        <User size={16} />
                        My Profile
                    </button>
                    <button
                        className="logout-button"
                        style={styles.logoutButton}
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div style={styles.mainContent}>
                <div style={styles.contentCard}>
                    <div style={styles.headerSection}>
                        <h1 style={styles.heroTitle}>
                            {getGreeting()}, {username}!
                        </h1>
                        <p style={styles.heroSubtitle}>
                            Review and manage your invitations and studies.
                        </p>
                    </div>

                    <div style={styles.centerContent}>
                        {/* REPLACED BLOCK: Pending Invitations */}
                        <div style={styles.sectionBlock}>
                            <h3 style={styles.sectionTitle}>Pending Invitations</h3>
                            {pendingInvitations.length === 0 ? (
                                <div style={styles.emptyState}>
                                    <p style={styles.emptyText}>
                                        You have no pending invitations.
                                    </p>
                                </div>
                            ) : (
                                <div style={styles.listContainer}>
                                    {pendingInvitations.map((inv) => (
                                        <div key={inv.id} style={styles.approvalItem}>
                                            <div style={styles.studyHeader}>
                                                <div style={styles.studyMainInfo}>
                          <span style={styles.studyName}>
                            {inv.study?.title || "Untitled study"}
                          </span>
                                                    <div style={styles.studyMeta}>
                            <span style={styles.metaText}>
                              Role: {inv.role}
                            </span>
                                                        <span style={styles.metaText}>•</span>
                                                        <span style={styles.metaText}>
                              Invited:{" "}
                                                            {inv.invitedAt
                                                                ? new Date(inv.invitedAt).toLocaleString()
                                                                : "N/A"}
                            </span>
                                                    </div>
                                                </div>
                                                <span
                                                    style={{
                                                        ...styles.statusBadge,
                                                        background: "rgba(251, 146, 60, 0.2)",
                                                        color: "#fb923c",
                                                    }}
                                                >
                          {inv.status}
                        </span>
                                            </div>
                                            <div style={styles.actionButtons}>
                                                <button
                                                    className="approve-button"
                                                    style={styles.approveButton}
                                                    onClick={() => handleAcceptInvitation(inv.study.id)}
                                                >
                                                    Accept Invitation
                                                </button>
                                                <button
                                                    className="reject-button"
                                                    style={styles.rejectButton}
                                                    onClick={() => handleRejectInvitation(inv.study.id)}
                                                >
                                                    Reject Invitation
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* My Studies Block */}
                        <div style={styles.sectionBlock}>
                            <h3 style={styles.sectionTitle}>My Studies</h3>
                            {isLoading ? (
                                <div style={styles.loadingContainer}>
                                    <div style={styles.spinner}></div>
                                    <p style={styles.loadingText}>Loading studies...</p>
                                </div>
                            ) : joinedStudies.length === 0 ? (
                                <div style={styles.emptyState}>
                                    <p style={styles.emptyText}>
                                        You haven't joined any studies yet.
                                    </p>
                                </div>
                            ) : (
                                <div style={styles.studiesGrid}>
                                    {joinedStudies.map((study) => {
                                        const statusColors = getStatusColor(study.status);
                                        return (
                                            <div
                                                key={study.id}
                                                className="study-card"
                                                style={styles.studyCard}
                                                onClick={() => handleStudyClick(study.id)}
                                            >
                                                <div style={styles.cardHeader}>
                                                    <h4 style={styles.cardTitle}>{study.title}</h4>
                                                    <span
                                                        style={{
                                                            ...styles.statusBadge,
                                                            background: statusColors.bg,
                                                            color: statusColors.color,
                                                        }}
                                                    >
                            {study.status}
                          </span>
                                                </div>
                                                <div style={styles.cardBody}>
                                                    <div style={styles.cardStat}>
                                                        <span style={styles.statLabel}>Participants</span>
                                                        <span style={styles.statValue}>
                              {study.participants ? study.participants.length : 0}
                            </span>
                                                    </div>
                                                    <div style={styles.cardStat}>
                                                        <span style={styles.statLabel}>Last Updated</span>
                                                        <span style={styles.statValue}>
                              {study.updatedAt
                                  ? new Date(study.updatedAt).toLocaleDateString()
                                  : "N/A"}
                            </span>
                                                    </div>
                                                </div>
                                                <div style={styles.cardFooter}>
                                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                        <span style={styles.clickHint}>Click for details →</span>
                                                        <button
                                                            className="report-button"
                                                            style={styles.reportButton}
                                                            onClick={(e) => handleReportClick(e, study.id)}
                                                        >
                                                            Report Study
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <footer style={styles.footer}>
                <p style={styles.footerText}>
                    © {new Date().getFullYear()} Artifact Comparator — Reviewer Panel
                </p>
            </footer>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
            {reportingStudyId && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Report Study</h3>
                        <p style={{color: 'rgba(255,255,255,0.7)', marginBottom: '10px'}}>
                            Please provide a reason for reporting this study:
                        </p>
                        <textarea
                            style={styles.textArea}
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Enter reason here..."
                        />
                        <div style={styles.modalActions}>
                            <button
                                style={styles.cancelButton}
                                onClick={() => setReportingStudyId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                style={styles.submitReportButton}
                                onClick={handleSubmitReport}
                            >
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        position: "relative",
        minHeight: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        fontFamily: "Inter, sans-serif",
        boxSizing: "border-box",
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
        position: "relative",
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    },
    navLeft: {
        display: "flex",
        alignItems: "center",
    },
    welcomeText: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#60a5fa",
        letterSpacing: "0.5px",
    },
    navRight: {
        display: "flex",
        gap: "15px",
        alignItems: "center",
    },
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
    userText: {
        fontSize: "1.2rem",
        color: "#ffffff",
        fontWeight: "600",
    },
    profileBtn: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "rgba(96, 165, 250, 0.1)",
        border: "2px solid rgba(96, 165, 250, 0.5)",
        color: "#60a5fa",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "0.9rem",
        transition: "all 0.3s ease",
    },
    logoutButton: {
        padding: "8px 20px",
        borderRadius: "10px",
        border: "2px solid rgba(239, 68, 68, 0.5)",
        background: "rgba(239, 68, 68, 0.1)",
        color: "#f87171",
        fontSize: "0.9rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.25s ease-out",
        backdropFilter: "blur(10px)",
    },
    mainContent: {
        position: "relative",
        flex: 1,
        display: "flex",
        justifyContent: "center",
        padding: "40px 20px",
        zIndex: 10,
    },
    contentCard: {
        position: "relative",
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(20px)",
        padding: "50px",
        borderRadius: "28px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        width: "100%",
        maxWidth: "1400px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxSizing: "border-box",
    },
    headerSection: {
        textAlign: "center",
        marginBottom: "40px",
    },
    heroTitle: {
        fontSize: "2.5rem",
        fontWeight: "700",
        marginBottom: "15px",
        background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    heroSubtitle: {
        fontSize: "1.1rem",
        color: "rgba(255,255,255,0.7)",
        maxWidth: "600px",
        margin: "0 auto",
    },
    centerContent: {
        padding: "20px 0",
        display: "flex",
        flexDirection: "column",
        gap: "40px",
    },
    sectionBlock: {
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "20px",
        padding: "30px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
    },
    sectionTitle: {
        fontSize: "1.8rem",
        fontWeight: "700",
        color: "#93c5fd",
        marginTop: 0,
        marginBottom: "25px",
        textAlign: "left",
    },
    listContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    approvalItem: {
        padding: "20px",
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },
    studyHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "15px",
    },
    studyMainInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        flex: 1,
        textAlign: "left",
    },
    studyName: {
        fontSize: "1.1rem",
        color: "#fff",
        fontWeight: "600",
    },
    studyMeta: {
        display: "flex",
        gap: "10px",
        alignItems: "center",
    },
    metaText: {
        fontSize: "0.85rem",
        color: "rgba(255, 255, 255, 0.8)",
    },
    statusBadge: {
        padding: "4px 14px",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        whiteSpace: "nowrap",
        minWidth: "70px",
        textAlign: "center",
    },
    actionButtons: {
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        justifyContent: "flex-start",
    },
    approveButton: {
        padding: "10px 20px",
        borderRadius: "10px",
        border: "2px solid rgba(34, 197, 94, 0.5)",
        background: "rgba(34, 197, 94, 0.1)",
        color: "#22c55e",
        fontSize: "0.9rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease",
        backdropFilter: "blur(10px)",
    },
    rejectButton: {
        padding: "10px 20px",
        borderRadius: "10px",
        border: "2px solid rgba(239, 68, 68, 0.5)",
        background: "rgba(239, 68, 68, 0.1)",
        color: "#ef4444",
        fontSize: "0.9rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease",
        backdropFilter: "blur(10px)",
    },
    studiesGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
        gap: "25px",
    },
    studyCard: {
        padding: "25px",
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "15px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "10px",
        paddingBottom: "15px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    },
    cardTitle: {
        fontSize: "1.1rem",
        color: "#fff",
        fontWeight: "600",
        margin: 0,
        textAlign: "left",
        flex: 1,
    },
    cardBody: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    cardStat: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    statLabel: {
        fontSize: "0.85rem",
        color: "rgba(255, 255, 255, 0.6)",
    },
    statValue: {
        fontSize: "0.9rem",
        color: "#60a5fa",
        fontWeight: "600",
    },
    cardFooter: {
        paddingTop: "10px",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    },
    clickHint: {
        fontSize: "0.8rem",
        color: "rgba(96, 165, 250, 0.7)",
        fontStyle: "italic",
    },
    emptyState: {
        textAlign: "center",
        padding: "40px 20px",
        color: "rgba(255,255,255,0.6)",
    },
    emptyText: {
        fontSize: "1rem",
        color: "rgba(255, 255, 255, 0.7)",
    },
    loadingContainer: {
        textAlign: "center",
        padding: "40px 20px",
    },
    spinner: {
        width: "50px",
        height: "50px",
        border: "4px solid rgba(255,255,255,0.1)",
        borderTop: "4px solid #0ea5e9",
        borderRadius: "50%",
        margin: "0 auto 20px",
        animation: "spin 1s linear infinite",
    },
    loadingText: {
        color: "rgba(255,255,255,0.6)",
        fontSize: "1rem",
    },
    footer: {
        position: "relative",
        zIndex: 100,
        padding: "30px 20px",
        textAlign: "center",
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        marginTop: "80px",
    },
    footerText: {
        margin: 0,
        fontSize: "0.9rem",
        color: "rgba(255, 255, 255, 0.45)",
        fontWeight: "400",
    },
    reportButton: {
        padding: "6px 12px",
        borderRadius: "6px",
        border: "1px solid rgba(239, 68, 68, 0.5)",
        background: "rgba(239, 68, 68, 0.1)",
        color: "#f87171",
        fontSize: "0.75rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s ease",
        zIndex: 20, // Ensure it sits above the card click area if needed
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(5px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    modalContent: {
        background: "#1e293b",
        padding: "30px",
        borderRadius: "16px",
        width: "400px",
        maxWidth: "90%",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
    },
    modalTitle: {
        color: "#fff",
        fontSize: "1.5rem",
        marginBottom: "15px",
        marginTop: 0,
    },
    textArea: {
        width: "100%",
        height: "100px",
        background: "rgba(0, 0, 0, 0.2)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        color: "#fff",
        padding: "10px",
        marginBottom: "20px",
        resize: "vertical",
        fontFamily: "inherit",
        boxSizing: 'border-box', // Fixes padding width issues
    },
    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
    },
    cancelButton: {
        padding: "8px 16px",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        background: "transparent",
        color: "#fff",
        cursor: "pointer",
    },
    submitReportButton: {
        padding: "8px 16px",
        borderRadius: "8px",
        border: "none",
        background: "#ef4444",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "600",
    }
};

export default ReviewerIndexPage;