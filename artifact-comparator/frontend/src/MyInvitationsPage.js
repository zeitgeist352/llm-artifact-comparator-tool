import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getMyInvitations,
    acceptInvitation,
    rejectInvitation,
} from "./InvitationService";

function MyInvitationsPage() {
    const [invitations, setInvitations] = useState([]);
    const [toast, setToast] = useState(null);
    const [particles, setParticles] = useState([]);
    const navigate = useNavigate();

    /* ================= PAGE SETUP ================= */
    useEffect(() => {
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.backgroundColor = "black";

        const generated = [...Array(55)].map(() => ({
            id: crypto.randomUUID(),
            left: Math.random() * 100,
            top: Math.random() * 100,
            delay: -(Math.random() * 15).toFixed(2),
            duration: 16 + Math.random() * 10,
        }));
        setParticles(generated);
    }, []);

    /* ================= FETCH INVITATIONS ================= */
    useEffect(() => {
        loadInvitations();
    }, []);

    const loadInvitations = async () => {
        const res = await getMyInvitations();
        setInvitations(res);
    };

    /* ================= TOAST ================= */
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2800);
    };

    /* ================= HANDLERS ================= */
    const handleAccept = async (id) => {
        await acceptInvitation(id);
        showToast("Invitation accepted! 🎉", "success");

        setTimeout(() => {
            navigate("/my-studies");
        }, 1000);
    };

    const handleReject = async (id) => {
        await rejectInvitation(id);
        showToast("Invitation rejected!", "error");
        loadInvitations();
    };

    return (
        <div style={styles.container}>
            {/* ⭐ PARTICLES BACKGROUND */}
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

            {/* ⭐ NAVBAR */}
            <div style={styles.navbar}>
                <h2 style={styles.title}>My Invitations</h2>
                <div style={styles.right}>
                    <button
                        style={styles.backButton}
                        onClick={() => navigate("/researcher")}
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>

            {/* ⭐ MAIN CONTENT */}
            <div style={styles.mainContent}>
                {invitations.length === 0 ? (
                    <p style={styles.noData}>No invitations found.</p>
                ) : (
                    <div style={styles.grid}>
                        {invitations.map((inv) => (
                            <div key={inv.id} style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <span style={styles.invEmoji}>📨</span>

                                    <h3 style={styles.studyTitle}>
                                        {inv.studyTitle}
                                    </h3>

                                    <span
                                        style={{
                                            ...styles.statusBadge,
                                            backgroundColor:
                                                inv.status === "PENDING"
                                                    ? "rgba(234,179,8,0.3)"
                                                    : inv.status === "ACCEPTED"
                                                        ? "rgba(34,197,94,0.3)"
                                                        : "rgba(239,68,68,0.3)",
                                            borderColor:
                                                inv.status === "PENDING"
                                                    ? "rgba(234,179,8,0.5)"
                                                    : inv.status === "ACCEPTED"
                                                        ? "rgba(34,197,94,0.5)"
                                                        : "rgba(239,68,68,0.5)",
                                            color:
                                                inv.status === "PENDING"
                                                    ? "#facc15"
                                                    : inv.status === "ACCEPTED"
                                                        ? "#4ade80"
                                                        : "#ef4444",
                                        }}
                                    >
                                        {inv.status}
                                    </span>
                                </div>

                                <p style={styles.invitedAt}>
                                    ⏱️ Invited at: {inv.invitedAt}
                                </p>

                                {/* Buttons only for pending */}
                                {inv.status === "PENDING" && (
                                    <div style={styles.actionRow}>
                                        <button
                                            style={styles.acceptButton}
                                            onClick={() => handleAccept(inv.id)}
                                        >
                                            ✔ Accept
                                        </button>

                                        <button
                                            style={styles.rejectButton}
                                            onClick={() => handleReject(inv.id)}
                                        >
                                            ✘ Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ⭐ TOAST */}
            {toast && (
                <div
                    style={{
                        ...styles.toast,
                        backgroundColor:
                            toast.type === "success"
                                ? "#22c55e"
                                : "#ef4444",
                    }}
                >
                    {toast.message}
                </div>
            )}

            {/* ⭐ PARTICLE CSS */}
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

/* ================================================================== */
/* 🎨 STYLES (MyArtifactsPage ile birebir uyumlu premium tasarım) */
/* ================================================================== */
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
        position: "relative",
        zIndex: 10,
    },
    title: {
        fontSize: "1.5rem",
        fontWeight: 700,
        color: "#60a5fa",
    },
    right: { display: "flex", gap: "15px" },

    backButton: {
        background: "rgba(239,68,68,0.3)",
        border: "2px solid rgba(239,68,68,0.4)",
        color: "#fca5a5",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontSize: "0.95rem",
        fontWeight: "600",
        transition: "all 0.3s ease",
        boxShadow: "0 0 8px rgba(239,68,68,0.35)",
    },

    /* CONTENT */
    mainContent: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px",
        position: "relative",
        zIndex: 1,
    },

    noData: {
        textAlign: "center",
        color: "rgba(255,255,255,0.6)",
        fontStyle: "italic",
    },

    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "25px",
    },

    card: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "15px",
        padding: "25px",
        border: "2px solid rgba(96,165,250,0.4)",
        boxShadow: "0 0 8px rgba(96,165,250,0.5)",
    },

    cardHeader: {
        display: "grid",
        gridTemplateColumns: "50px 1fr auto",
        alignItems: "center",
        gap: "12px",
        marginBottom: "10px",
    },

    invEmoji: {
        fontSize: "1.9rem",
    },

    studyTitle: {
        fontSize: "1.2rem",
        fontWeight: "600",
        color: "white",
        margin: 0,
    },

    invitedAt: {
        fontSize: "0.9rem",
        color: "#a5b4fc",
        marginTop: "10px",
    },

    statusBadge: {
        padding: "6px 12px",
        borderRadius: "8px",
        border: "2px solid",
        fontWeight: 600,
        fontSize: "0.8rem",
        textTransform: "uppercase",
    },

    actionRow: {
        display: "flex",
        gap: "12px",
        marginTop: "18px",
    },

    acceptButton: {
        flex: 1,
        background: "rgba(34,197,94,0.2)",
        border: "2px solid rgba(34,197,94,0.5)",
        color: "#4ade80",
        padding: "12px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
    },

    rejectButton: {
        flex: 1,
        background: "rgba(239,68,68,0.2)",
        border: "2px solid rgba(239,68,68,0.5)",
        color: "#fca5a5",
        padding: "12px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
    },

    toast: {
        position: "fixed",
        bottom: "30px",
        right: "30px",
        padding: "15px 22px",
        borderRadius: "10px",
        color: "white",
        fontWeight: "600",
        zIndex: 9999,
        boxShadow: "0 0 15px rgba(0,0,0,0.3)",
        animation: "fadeIn 0.3s ease",
    },
};

export default MyInvitationsPage;