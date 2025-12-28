import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

function JoinStudyPage() {
    const { studyId } = useParams();
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState("idle");   // validating yerine bekleme
    const [message, setMessage] = useState("");

    const [showConfirmModal, setShowConfirmModal] = useState(true); // YES/NO popup
    const [processing, setProcessing] = useState(false);

    const token = params.get("token");

    // Yes → eski confirmJoin çalışır
    const handleJoin = async () => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid invitation link.");
            setShowConfirmModal(false);
            return;
        }

        setProcessing(true);
        setShowConfirmModal(false);
        setStatus("validating");

        try {
            const res = await fetch(
                `http://localhost:8080/api/participant/${studyId}/participants/confirm?token=${token}`,
                { method: "POST" }
            );

            if (!res.ok) throw new Error(await res.text());

            const joinedStudy = await res.json();

            setStatus("success");
            setMessage("Successfully joined. Redirecting...");

            setTimeout(() => {
                if (joinedStudy.quiz) {
                    navigate(`/take-quiz/${studyId}`);
                    return;
                }
                navigate(`/study/${studyId}`);
            }, 1200);

        } catch (err) {
            setStatus("error");
            setMessage("Invitation link expired or invalid.");
        } finally {
            setProcessing(false);
        }
    };

    // No → Katılmadan çık
    const handleCancel = () => {
        setShowConfirmModal(false);
        navigate("/participant");
    };

    return (
        <div style={styles.container}>

            {/* YES/NO Confirm Modal */}
            {showConfirmModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h2 style={styles.modalTitle}>Join this study?</h2>
                        <p style={styles.modalText}>
                            You have been invited to join this study. Do you want to continue?
                        </p>

                        <div style={styles.modalButtons}>
                            <button style={styles.noBtn} onClick={handleCancel}>
                                No
                            </button>
                            <button
                                style={styles.yesBtn}
                                onClick={handleJoin}
                                disabled={processing}
                            >
                                {processing ? "Joining..." : "Yes, Join"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ORIGINAL MESSAGES BELOW */}
            {status === "validating" && (
                <h2 style={styles.info}>⏳ Validating...</h2>
            )}

            {status === "success" && (
                <h2 style={styles.success}>🎉 {message}</h2>
            )}

            {status === "error" && (
                <h2 style={styles.error}>❌ {message}</h2>
            )}
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "black",
        color: "white",
        fontFamily: "Inter, sans-serif",
    },

    /* MODAL */
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(6px)",
    },
    modal: {
        background: "rgba(25,25,25,0.95)",
        padding: "28px",
        width: "380px",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.15)",
        textAlign: "center",
    },
    modalTitle: {
        fontSize: "1.5rem",
        marginBottom: "10px",
        fontWeight: 700,
        color: "#93c5fd",
    },
    modalText: {
        opacity: 0.8,
        marginBottom: "18px",
    },
    modalButtons: {
        display: "flex",
        gap: "14px",
        justifyContent: "center",
    },
    yesBtn: {
        flex: 1,
        padding: "10px",
        borderRadius: "8px",
        background: "#22c55e",
        border: "none",
        color: "white",
        fontWeight: 700,
        cursor: "pointer",
    },
    noBtn: {
        flex: 1,
        padding: "10px",
        borderRadius: "8px",
        background: "#ef4444",
        border: "none",
        color: "white",
        fontWeight: 700,
        cursor: "pointer",
    },

    /* ORIGINAL STYLES */
    info: { fontSize: "1.6rem", opacity: 0.7 },
    success: { fontSize: "1.6rem", color: "#4ade80" },
    error: { fontSize: "1.6rem", color: "#ef4444" },
};

export default JoinStudyPage;
