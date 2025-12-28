import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function ManageParticipantsPage() {
    const { studyId } = useParams();
    const navigate = useNavigate();

    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteUsername, setInviteUsername] = useState(""); // 🔹 Changed from Email to Username
    const [inviting, setInviting] = useState(false);

    const [toast, setToast] = useState({ show: false, text: "", type: "success" });

    // ⭐ SOFT GLOW PARTICLES
    const [particles, setParticles] = useState([]);

    const triggerToast = (text, type = "success") => {
        setToast({ show: true, text, type });
        setTimeout(() => setToast({ show: false }), 3000);
    };

    /* ---------------- FETCH PARTICIPANTS ONLY ---------------- */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");

                // Only fetch participants for the study
                const pRes = await fetch(`http://localhost:8080/api/studies/${studyId}/participants`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!pRes.ok) throw new Error("Failed to fetch participants");

                setParticipants(await pRes.json());
            } catch (err) {
                console.error("❌ Fetch error:", err);
                setError("Failed to load participants");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studyId]);

    /* ---------------- PARTICLES ---------------- */
    useEffect(() => {
        const generated = [...Array(45)].map(() => ({
            id: crypto.randomUUID(),
            size: Math.random() * 3 + 2,
            left: Math.random() * 100,
            top: Math.random() * 100,
            duration: 14 + Math.random() * 10,
            delay: Math.random() * -10,
        }));
        setParticles(generated);
    }, []);

    const handleBack = () => navigate(`/manage-study/${studyId}`);

    /* ---------------- INVITE ---------------- */
    const handleInvite = async () => {
        const username = inviteUsername.trim();

        if (!username) {
            triggerToast("❌ Please enter a username", "error");
            return;
        }

        // Check locally if already in list (optional, backend also checks)
        if (participants.some(p => p.username === username)) {
            triggerToast("⚠ Participant already added", "info");
            return;
        }

        try {
            setInviting(true);
            const token = localStorage.getItem("token");

            // ✅ NEW UNIFIED ENDPOINT
            const res = await fetch(
                `http://localhost:8080/api/studies/${studyId}/invite`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    // Send Username AND Role
                    body: JSON.stringify({ username: username, role: "PARTICIPANT" }),
                }
            );

            if (!res.ok) {
                const errorData = await res.text();
                throw new Error(errorData || "Failed to invite");
            }

            triggerToast("✅ Invitation sent successfully", "success");
            setInviteUsername("");
            setShowInviteModal(false);

            // Refresh list
            const refreshed = await fetch(
                `http://localhost:8080/api/studies/${studyId}/participants`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (refreshed.ok) setParticipants(await refreshed.json());
        } catch (err) {
            console.error(err);
            triggerToast(`❌ ${err.message}`, "error");
        } finally {
            setInviting(false);
        }
    };

    /* ---------------- REMOVE PARTICIPANT ---------------- */
    const handleRemove = async (userId) => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `http://localhost:8080/api/studies/${studyId}/participants/${userId}`,
                { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
            );

            if (!res.ok) throw new Error();

            setParticipants(prev => prev.filter(p => p.id !== userId));
            triggerToast("Participant removed", "success");
        } catch {
            triggerToast("❌ Failed to remove participant", "error");
        }
    };

    if (loading)
        return <div style={styles.loading}>Loading participants...</div>;

    if (error)
        return (
            <div style={styles.error}>
                {error}
                <br />
                <button style={styles.backButton} onClick={handleBack}>
                    ← Back
                </button>
            </div>
        );

    return (
        <div style={styles.container}>

            {/* ⭐ PARTICLES */}
            <div style={styles.particles}>
                {particles.map(p => (
                    <div
                        key={p.id}
                        style={{
                            ...styles.particle,
                            left: `${p.left}%`,
                            top: `${p.top}%`,
                            width: p.size,
                            height: p.size,
                            animationDuration: `${p.duration}s`,
                            animationDelay: `${p.delay}s`,
                        }}
                    ></div>
                ))}
            </div>

            {/* TOAST */}
            {toast.show && (
                <div
                    style={{
                        ...styles.toast,
                        ...(toast.type === "success"
                            ? styles.toastSuccess
                            : toast.type === "error"
                                ? styles.toastError
                                : styles.toastInfo),
                    }}
                >
                    {toast.text}
                </div>
            )}

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>Manage Participants</h2>

                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        style={styles.inviteButton}
                        onClick={() => setShowInviteModal(true)}
                    >
                        Invite Participant
                    </button>

                    <button style={styles.backButton} onClick={handleBack}>
                        ← Back to Study
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div style={styles.centerWrapper}>
                <div style={styles.card}>
                    <h3 style={styles.sectionTitle}>👥 Joined Participants</h3>
                    <p style={styles.sectionDesc}>
                        These participants are currently part of this study.
                    </p>

                    {participants.length === 0 ? (
                        <p style={styles.emptyMessage}>No participants yet.</p>
                    ) : (
                        <div style={styles.list}>
                            {participants.map((p) => (
                                <div key={p.id} style={styles.participantCard}>

                                    {/* LEFT SIDE: USER INFO + PROGRESS */}
                                    <div style={{ flex: 1 }}>
                                        <h4 style={styles.participantName}>
                                            {p.name || `${p.firstname} ${p.lastname}`}
                                        </h4>
                                        <p style={styles.participantEmail}>
                                            {p.username} {/* Displaying Username now */}
                                        </p>

                                        {/* ✅ PROGRESS BAR */}
                                        <div style={styles.progressWrapper}>
                                            <div
                                                style={{
                                                    ...styles.progressBar,
                                                    width: `${Math.round(p.progress || 0)}%`,
                                                }}
                                            />
                                        </div>

                                        <p style={styles.progressText}>
                                            Progress: {Math.round(p.progress || 0)}%
                                        </p>
                                    </div>

                                    {/* RIGHT SIDE: REMOVE BUTTON */}
                                    <button
                                        style={styles.removeButton}
                                        onClick={() => handleRemove(p.id)}
                                    >
                                        Remove
                                    </button>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* INVITE MODAL */}
            {showInviteModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>Invite Participant</h3>
                        <p style={styles.modalDesc}>
                            Enter the participant’s username to send an invitation.
                        </p>

                        <input
                            type="text"
                            placeholder="Enter username..."
                            value={inviteUsername}
                            onChange={(e) => setInviteUsername(e.target.value)}
                            style={styles.modalInput}
                        />

                        <div style={styles.modalButtons}>
                            <button
                                style={{ ...styles.modalCancel }}
                                className="modal-btn"
                                onClick={() => setShowInviteModal(false)}
                                disabled={inviting}
                            >
                                Cancel
                            </button>

                            <button
                                style={{
                                    ...styles.modalSubmit,
                                    ...(inviting
                                        ? { opacity: 0.6, cursor: "wait" }
                                        : {}),
                                }}
                                className="modal-btn"
                                onClick={handleInvite}
                                disabled={inviting}
                            >
                                {inviting ? "Sending..." : "Send Invite"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>
                {`
                .modal-btn:hover {
                    transform: scale(1.07) !important;
                }
                `}
            </style>
        </div>
    );
}

/* -------------------- STYLES -------------------- */
const styles = {
    container: { minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0a, #16213e)", color: "#fff", fontFamily: "Inter, sans-serif", position: "relative", overflow: "hidden" },
    particles: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" },
    particle: { position: "absolute", background: "radial-gradient(circle, rgba(99,102,241,0.8), rgba(139,92,246,0.4))", borderRadius: "50%", opacity: 0.45, animation: "floatUp linear infinite" },
    navbar: { padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(6px)", position: "relative", zIndex: 2 },
    navTitle: { fontSize: "1.5rem", fontWeight: "700", color: "#60a5fa", textShadow: "0 0 10px rgba(96,165,250,0.25)" },
    backButton: { background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.45)", borderRadius: "10px", padding: "8px 18px", color: "#fca5a5", cursor: "pointer", fontWeight: "600", transition: "0.25s", boxShadow: "0 0 6px rgba(239,68,68,0.25)" },
    inviteButton: { background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.45)", borderRadius: "10px", padding: "8px 18px", color: "#86efac", cursor: "pointer", fontWeight: "600", transition: "0.25s", boxShadow: "0 0 6px rgba(34,197,94,0.25)" },
    centerWrapper: { width: "90%", maxWidth: "850px", margin: "0 auto", paddingTop: "30px", position: "relative", zIndex: 2 },
    card: { background: "rgba(255,255,255,0.05)", borderRadius: "15px", padding: "25px 30px", border: "1px solid rgba(148,163,184,0.3)", boxShadow: "0 0 14px rgba(96,165,250,0.25)", backdropFilter: "blur(14px)" },
    sectionTitle: { fontSize: "1.3rem", fontWeight: "700", color: "#93c5fd", marginBottom: "6px" },
    sectionDesc: { color: "rgba(255,255,255,0.75)", marginBottom: "18px" },
    list: { display: "flex", flexDirection: "column", gap: "12px" },
    participantCard: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.06)", padding: "14px 18px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", transition: "0.25s" },
    participantName: { fontSize: "1.05rem", fontWeight: "600", color: "#fff", margin: 0 },
    progressWrapper: { width: "180px", height: "8px", background: "rgba(255,255,255,0.15)", borderRadius: "8px", overflow: "hidden", marginTop: "6px" },
    progressBar: { height: "100%", background: "linear-gradient(90deg, #22c55e, #4ade80)", transition: "width 0.4s ease" },
    progressText: { fontSize: "0.8rem", color: "#86efac", marginTop: "4px" },
    participantEmail: { fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", marginTop: "3px" },
    removeButton: { background: "rgba(239,68,68,0.18)", border: "2px solid rgba(239,68,68,0.45)", borderRadius: "8px", padding: "7px 14px", color: "#fca5a5", cursor: "pointer", fontWeight: "600", transition: "0.25s", boxShadow: "0 0 6px rgba(239,68,68,0.25)" },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", zIndex: 999 },
    modal: { background: "rgba(23,28,38,0.97)", padding: "30px", borderRadius: "18px", width: "380px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 25px rgba(96,165,250,0.3)", animation: "fadeIn 0.3s ease", zIndex: 1000 },
    modalTitle: { fontSize: "1.3rem", fontWeight: "700", color: "#93c5fd", textAlign: "center", marginBottom: "8px" },
    modalDesc: { textAlign: "center", color: "rgba(255,255,255,0.75)", marginBottom: "16px" },
    modalInput: { width: "100%", padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(96,165,250,0.3)", color: "#fff", outline: "none", marginBottom: "18px" },
    modalButtons: { display: "flex", justifyContent: "space-between", gap: "12px" },
    modalCancel: { flex: 1, background: "rgba(239,68,68,0.18)", border: "2px solid rgba(239,68,68,0.45)", color: "#fca5a5", padding: "10px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", transition: "transform 0.25s ease, box-shadow 0.25s ease", boxShadow: "0 0 8px rgba(239,68,68,0.35)" },
    modalSubmit: { flex: 1, background: "linear-gradient(135deg, #22c55e, #4ade80)", padding: "10px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", color: "#fff", border: "none", boxShadow: "0 0 10px rgba(34,197,94,0.4)", transition: "transform 0.25s ease, box-shadow 0.25s ease" },
    toast: { position: "fixed", top: "90px", left: "50%", transform: "translateX(-50%)", padding: "12px 20px", borderRadius: "12px", fontWeight: "600", fontSize: "0.95rem", backdropFilter: "blur(6px)", boxShadow: "0 0 12px rgba(0,0,0,0.4)", animation: "toastFadeInOut 3s ease forwards", zIndex: 2000 },
    toastSuccess: { background: "rgba(16,185,129,0.25)", color: "#bbf7d0", border: "1.5px solid #4ade80" },
    toastError: { background: "rgba(239,68,68,0.25)", color: "#fecaca", border: "1.5px solid #f87171" },
    toastInfo: { background: "rgba(59,130,246,0.25)", color: "#bfdbfe", border: "1.5px solid #60a5fa" },
    loading: { textAlign: "center", paddingTop: "100px" },
    error: { textAlign: "center", paddingTop: "100px", color: "#f87171" },
    emptyMessage: { color: "rgba(255,255,255,0.6)", textAlign: "center", fontStyle: "italic" }
};

/* Keyframes injected globally */
const style = document.createElement("style");
style.textContent = `
@keyframes floatUp { 0% { transform: translateY(0); opacity: 0.35; } 60% { opacity: 0.7; } 100% { transform: translateY(-120vh); opacity: 0; } }
@keyframes toastFadeInOut { 0% { opacity: 0; transform: translate(-50%, -10px); } 10% { opacity: 1; transform: translate(-50%, 0); } 90% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, -10px); } }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
`;
document.head.appendChild(style);

export default ManageParticipantsPage;