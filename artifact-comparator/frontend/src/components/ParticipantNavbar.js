import React from "react";
import { User, LogOut, Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ParticipantNavbar({ username, showBack = true, onBack })  {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const handleProfile = () => navigate("/profile");

    return (
        <div style={styles.navbar}>
            <div style={styles.left}>
                {showBack && (
                    <button
                        style={styles.backBtn}
                        onClick={() => {
                            if (onBack) onBack();
                            else navigate(-1);   // 🔒 fallback
                        }}
                    >    <ArrowLeft size={18} />
                    </button>
                )}

                <Sparkles size={26} style={{ color: "#06b6d4" }} />
                <h3 style={styles.title}>Participant Hub</h3>
            </div>

            <div style={styles.right}>
                <div style={styles.userBadge}>
                    <User size={18} style={{ marginRight: 8 }} />
                    {username}
                </div>

                <button style={styles.profileBtn} onClick={handleProfile}>
                    Profile
                </button>

                <button style={styles.logoutBtn} onClick={handleLogout}>
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </div>
    );
}

const styles = {
    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 9999,
        boxSizing: "border-box",
    },

    left: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
    },

    backBtn: {
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.25)",
        color: "white",
        padding: "6px 10px",
        borderRadius: "8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
    },

    title: {
        margin: 0,
        fontSize: "1.3rem",
        fontWeight: "700",
        background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },

    right: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },

    userBadge: {
        padding: "8px 14px",
        background: "rgba(147,197,253,0.15)",
        border: "1px solid rgba(147,197,253,0.3)",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        fontSize: "0.9rem",
        color: "#93c5fd",
    },

    profileBtn: {
        background: "rgba(139,92,246,0.15)",
        border: "1px solid rgba(139,92,246,0.4)",
        color: "#a78bfa",
        padding: "8px 18px",
        borderRadius: "10px",
        cursor: "pointer",
    },

    logoutBtn: {
        background: "rgba(239,68,68,0.15)",
        border: "1px solid rgba(239,68,68,0.4)",
        color: "#f87171",
        padding: "8px 18px",
        borderRadius: "10px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
};

export default ParticipantNavbar;
