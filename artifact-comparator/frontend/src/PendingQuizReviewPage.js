import React from "react";
import { useNavigate } from "react-router-dom";

const pendingStyles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,#0a0e27,#1a1f3a 70%,#0f1629 100%)",
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
    },
    card: {
        background: "rgba(255,255,255,0.07)",
        border: "1.5px solid #2575ff33",
        borderRadius: "25px",
        boxShadow: "0 2px 28px #2575ff33,0 2px 48px #0080ff22",
        padding: "3rem 2.5rem",
        textAlign: "center",
        color: "#eaf4ff",
        maxWidth: 420,
    },
    glow: {
        textShadow: "0 0 18px #4a9eff77, 0 0 48px #2575ff33",
        color: "#4a9eff",
        fontWeight: 700,
        fontSize: "2.2rem",
        marginBottom: "1rem",
    },
    text: {
        fontSize: "1.1rem",
        color: "#cfe2ff",
        marginTop: "1rem"
    },
    backBtn: {
        marginTop: "2.5rem",
        background: "rgba(74,158,255,0.07)",
        border: "1px solid #4a9eff44",
        color: "#eaf4ff",
        borderRadius: "11px",
        fontSize: "1rem",
        fontWeight: 600,
        cursor: "pointer",
        padding: "0.8rem 2rem",
        transition: "0.15s box-shadow, 0.15s filter",
        boxShadow: "0 0 16px #4a9eff22",
    }
};

export default function PendingQuizReviewPage() {
    const navigate = useNavigate();

    return (
        <div style={pendingStyles.container}>
            <div style={pendingStyles.card}>
                <div style={pendingStyles.glow}>
                    Under Review
                </div>
                <div style={pendingStyles.text}>
                    Your quiz result is being evaluated by a researcher.<br />
                </div>
                <button
                    style={pendingStyles.backBtn}
                    onClick={() => navigate('/participant')}
                >
                    Go Back to Participant Dashboard
                </button>
            </div>
        </div>
    );
}
