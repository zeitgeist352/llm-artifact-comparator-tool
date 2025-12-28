import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const styleSheet = document.createElement("style");
styleSheet.textContent = `
@keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes fadeUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;
document.head.appendChild(styleSheet);

function ManageResearchersPage() {
    const { studyId } = useParams();
    const navigate = useNavigate();

    const [researchers, setResearchers] = useState([]);
    // ❌ Removed allUsers state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteUsername, setInviteUsername] = useState("");
    const [inviting, setInviting] = useState(false);
    const [toasts, setToasts] = useState([]);

    // 🔹 Permission checkboxes for invitation
    const [newResearcherPerms, setNewResearcherPerms] = useState({
        canUploadArtifacts: false,
        canEditStudyDetails: false,
        canInviteParticipants: false,
    });

    // 🔹 Modal for editing permissions
    const [editingResearcherId, setEditingResearcherId] = useState(null);
    const [editingPerms, setEditingPerms] = useState({});
    const [showEditModal, setShowEditModal] = useState(false);
    const [updatingPerms, setUpdatingPerms] = useState(false);

    const showToast = (msg, type = "success") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    // ✅ Load researchers ONLY
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const rRes = await fetch(`http://localhost:8080/api/studies/${studyId}/researchers`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!rRes.ok) throw new Error("Failed to fetch researchers");

                setResearchers(await rRes.json());
            } catch (err) {
                console.error("❌ Fetch error:", err);
                setError("Failed to load researchers");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studyId]);

    const handleBack = () => navigate(`/manage-study/${studyId}`);

    // ✅ Invite new co-researcher with permissions
    const handleInvite = async () => {
        const username = inviteUsername.trim();

        if (username.length < 3) {
            showToast("❌ Username too short", "error");
            return;
        }

        // ❌ Removed check against allUsers

        if (researchers.some(r => r.username?.toLowerCase() === username.toLowerCase())) {
            showToast("⚠️ Researcher already invited", "info");
            return;
        }

        // 4️⃣ Proceed with invitation
        try {
            setInviting(true);
            const token = localStorage.getItem("token");

            // ✅ NEW UNIFIED ENDPOINT
            const res = await fetch(
                `http://localhost:8080/api/studies/${studyId}/researchers/invite`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: username,
                        // Pass permissions
                        canUploadArtifacts: newResearcherPerms.canUploadArtifacts,
                        canEditStudyDetails: newResearcherPerms.canEditStudyDetails,
                        canInviteParticipants: newResearcherPerms.canInviteParticipants,
                    }),
                }
            );

            if (!res.ok) {
                const errorData = await res.text();
                throw new Error(errorData || "Failed to invite");
            }

            showToast("✅ Researcher invited successfully", "success");
            setInviteUsername("");
            setNewResearcherPerms({
                canUploadArtifacts: false,
                canEditStudyDetails: false,
                canInviteParticipants: false,
            });
            setShowInviteModal(false);

            // Refresh researcher list
            const refreshed = await fetch(`http://localhost:8080/api/studies/${studyId}/researchers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (refreshed.ok) setResearchers(await refreshed.json());
        } catch (err) {
            console.error("Invite error:", err);
            showToast(`❌ ${err.message}`, "error");
        } finally {
            setInviting(false);
        }
    };

    // ✅ Open edit permissions modal
    const handleOpenEditModal = (researcher) => {
        setEditingResearcherId(researcher.id);
        setEditingPerms({ ...researcher.permissions });
        setShowEditModal(true);
    };

    // ✅ Save updated permissions
    const handleSavePermissions = async () => {
        try {
            setUpdatingPerms(true);
            const token = localStorage.getItem("token");
            const res = await fetch(
                `http://localhost:8080/api/studies/${studyId}/researchers/${editingResearcherId}/permissions`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        canUploadArtifacts: editingPerms.canUploadArtifacts,
                        canEditStudyDetails: editingPerms.canEditStudyDetails,
                        canInviteParticipants: editingPerms.canInviteParticipants,
                    }),
                }
            );
            if (!res.ok) throw new Error();
            showToast("✅ Permissions updated successfully", "success");
            setShowEditModal(false);

            // Refresh researcher list
            const refreshed = await fetch(`http://localhost:8080/api/studies/${studyId}/researchers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (refreshed.ok) setResearchers(await refreshed.json());
        } catch {
            showToast("❌ Failed to update permissions", "error");
        } finally {
            setUpdatingPerms(false);
        }
    };

    // ✅ Remove a co-researcher
    const handleRemove = async (researcherId) => {
        if (!window.confirm("Are you sure you want to remove this researcher?")) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `http://localhost:8080/api/studies/${studyId}/researchers/${researcherId}`,
                { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error();
            setResearchers(prev => prev.filter(r => r.id !== researcherId));
            showToast("✅ Researcher removed successfully", "success");
        } catch {
            showToast("❌ Failed to remove researcher", "error");
        }
    };

    // 🔹 Get status badge styling
    const getStatusBadge = (status) => {
        switch (status?.toUpperCase()) {
            case "ACCEPTED":
                return { bg: "rgba(34,197,94,0.15)", color: "#4ade80", label: "✅ Accepted" };
            case "PENDING":
                return { bg: "rgba(250,204,21,0.15)", color: "#fde047", label: "⏳ Pending" };
            case "REJECTED":
                return { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "❌ Rejected" };
            default:
                return { bg: "rgba(155,155,155,0.15)", color: "#a0a0a0", label: status };
        }
    };

    if (loading)
        return <div style={styles.loading}>Loading researchers...</div>;
    if (error)
        return (
            <div style={styles.error}>
                {error} <br />
                <button style={styles.backButton} onClick={handleBack}>← Back</button>
            </div>
        );

    return (
        <div style={styles.container}>
            {/* Toast notifications */}
            <div style={styles.toastContainer}>
                {toasts.map(t => (
                    <div
                        key={t.id}
                        style={{
                            ...styles.toast,
                            ...(t.type === "success"
                                ? styles.toastSuccess
                                : t.type === "error"
                                    ? styles.toastError
                                    : styles.toastInfo),
                        }}
                    >
                        {t.msg}
                    </div>
                ))}
            </div>

            {/* Navbar */}
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>👤 Manage Co-Researchers</h2>
                <div style={{ display: "flex", gap: 10 }}>
                    <button style={styles.inviteButton} onClick={() => setShowInviteModal(true)}>
                        Invite Co-Researcher
                    </button>
                    <button style={styles.backButton} onClick={handleBack}>
                        ← Back to Study
                    </button>
                </div>
            </div>

            {/* Researchers list */}
            <div style={styles.content}>
                <div style={styles.card}>
                    <h3 style={styles.sectionTitle}>👥 Co-Researchers</h3>
                    <p style={styles.sectionDesc}>Manage permissions and invitations for co-researchers.</p>

                    {researchers.length === 0 ? (
                        <p style={styles.emptyMessage}>No co-researchers yet. Click "Invite Co-Researcher" to get started.</p>
                    ) : (
                        <div style={styles.researchersList}>
                            {researchers.map((r, i) => {
                                const statusBadge = getStatusBadge(r.status);
                                return (
                                    <div
                                        key={r.id}
                                        style={{
                                            ...styles.researcherCard,
                                            animation: `fadeUp 0.4s ease ${i * 0.05}s forwards`,
                                            opacity: 0,
                                        }}
                                    >
                                        <div style={styles.researcherHeader}>
                                            <div style={styles.researcherInfo}>
                                                <span style={styles.researcherName}>{r.name} {r.lastname}</span>
                                                <span style={styles.researcherUsername}>{r.username}</span>
                                            </div>
                                            <div
                                                style={{
                                                    ...styles.statusBadge,
                                                    background: statusBadge.bg,
                                                    color: statusBadge.color,
                                                }}
                                            >
                                                {statusBadge.label}
                                            </div>
                                        </div>

                                        {/* Permissions Display */}
                                        <div style={styles.permissionsGrid}>
                                            <div style={styles.permissionItem}>
                                                <span style={styles.permissionIcon}>
                                                    {r.permissions?.canUploadArtifacts ? "✅" : "❌"}
                                                </span>
                                                <span style={styles.permissionLabel}>Upload Artifacts</span>
                                            </div>
                                            <div style={styles.permissionItem}>
                                                <span style={styles.permissionIcon}>
                                                    {r.permissions?.canEditStudyDetails ? "✅" : "❌"}
                                                </span>
                                                <span style={styles.permissionLabel}>Edit Study Details</span>
                                            </div>
                                            <div style={styles.permissionItem}>
                                                <span style={styles.permissionIcon}>
                                                    {r.permissions?.canInviteParticipants ? "✅" : "❌"}
                                                </span>
                                                <span style={styles.permissionLabel}>Manage Participants</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={styles.actionButtons}>
                                            <button
                                                style={styles.editButton}
                                                onClick={() => handleOpenEditModal(r)}
                                            >
                                                Edit Permissions
                                            </button>
                                            <button
                                                style={styles.removeButton}
                                                onClick={() => handleRemove(r.id)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ✅ Invite Modal */}
            {showInviteModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>Invite Co-Researcher</h3>
                        <p style={styles.modalDesc}>Enter Username and select permissions:</p>

                        <input
                            type="text"
                            placeholder="Enter username"
                            value={inviteUsername}
                            onChange={(e) => setInviteUsername(e.target.value)}
                            style={styles.modalInput}
                        />

                        <div style={styles.permissionsCheckboxes}>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={newResearcherPerms.canUploadArtifacts}
                                    onChange={(e) =>
                                        setNewResearcherPerms({
                                            ...newResearcherPerms,
                                            canUploadArtifacts: e.target.checked,
                                        })
                                    }
                                    style={styles.checkbox}
                                />
                                Can Upload Artifacts
                            </label>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={newResearcherPerms.canEditStudyDetails}
                                    onChange={(e) =>
                                        setNewResearcherPerms({
                                            ...newResearcherPerms,
                                            canEditStudyDetails: e.target.checked,
                                        })
                                    }
                                    style={styles.checkbox}
                                />
                                Can Edit Study Details
                            </label>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={newResearcherPerms.canInviteParticipants}
                                    onChange={(e) =>
                                        setNewResearcherPerms({
                                            ...newResearcherPerms,
                                            canInviteParticipants: e.target.checked,
                                        })
                                    }
                                    style={styles.checkbox}
                                />
                                Can Manage Participants
                            </label>
                        </div>

                        <div style={styles.modalButtons}>
                            <button
                                style={styles.modalCancel}
                                onClick={() => setShowInviteModal(false)}
                                disabled={inviting}
                            >
                                ✕ Cancel
                            </button>
                            <button
                                style={{
                                    ...styles.modalSubmit,
                                    ...(inviting ? { opacity: 0.7, cursor: "wait" } : {}),
                                }}
                                onClick={handleInvite}
                                disabled={inviting}
                            >
                                {inviting ? "Sending..." : "📩 Invite"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ Edit Permissions Modal */}
            {showEditModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>Edit Permissions</h3>
                        <p style={styles.modalDesc}>Update permissions for this researcher:</p>

                        <div style={styles.permissionsCheckboxes}>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={editingPerms.canUploadArtifacts}
                                    onChange={(e) =>
                                        setEditingPerms({
                                            ...editingPerms,
                                            canUploadArtifacts: e.target.checked,
                                        })
                                    }
                                    style={styles.checkbox}
                                />
                                Can Upload Artifacts
                            </label>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={editingPerms.canEditStudyDetails}
                                    onChange={(e) =>
                                        setEditingPerms({
                                            ...editingPerms,
                                            canEditStudyDetails: e.target.checked,
                                        })
                                    }
                                    style={styles.checkbox}
                                />
                                Can Edit Study Details
                            </label>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={editingPerms.canInviteParticipants}
                                    onChange={(e) =>
                                        setEditingPerms({
                                            ...editingPerms,
                                            canInviteParticipants: e.target.checked,
                                        })
                                    }
                                    style={styles.checkbox}
                                />
                                Can Manage Participants
                            </label>
                        </div>

                        <div style={styles.modalButtons}>
                            <button
                                style={styles.modalCancel}
                                onClick={() => setShowEditModal(false)}
                                disabled={updatingPerms}
                            >
                                ✕ Cancel
                            </button>
                            <button
                                style={{
                                    ...styles.modalSubmit,
                                    ...(updatingPerms ? { opacity: 0.7, cursor: "wait" } : {}),
                                }}
                                onClick={handleSavePermissions}
                                disabled={updatingPerms}
                            >
                                {updatingPerms ? "Updating..." : "💾 Save"}
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
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
    },
    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
    },
    navTitle: { fontSize: "1.6rem", fontWeight: "700", color: "#60a5fa", margin: 0 },
    inviteButton: {
        background: "rgba(34,197,94,0.15)",
        border: "2px solid rgba(34,197,94,0.5)",
        borderRadius: "10px",
        padding: "8px 18px",
        color: "#4ade80",
        cursor: "pointer",
        fontWeight: "600",
        transition: "all 0.3s ease",
    },
    backButton: {
        background: "rgba(239,68,68,0.1)",
        border: "2px solid rgba(239,68,68,0.5)",
        borderRadius: "10px",
        padding: "8px 18px",
        color: "#f87171",
        cursor: "pointer",
        fontWeight: "600",
        transition: "all 0.3s ease",
    },
    content: { padding: "40px 60px", maxWidth: "1200px", margin: "0 auto" },
    card: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "15px",
        padding: "25px",
        border: "1px solid rgba(255,255,255,0.1)",
    },
    sectionTitle: { fontSize: "1.3rem", fontWeight: "700", color: "#93c5fd", margin: "0 0 8px 0" },
    sectionDesc: { fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", marginBottom: "20px" },
    researchersList: { display: "flex", flexDirection: "column", gap: "15px" },
    researcherCard: {
        background: "rgba(255,255,255,0.06)",
        borderRadius: "12px",
        padding: "18px",
        border: "1px solid rgba(255,255,255,0.08)",
        transition: "all 0.3s ease",
    },
    researcherHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "15px",
        gap: "12px",
    },
    researcherInfo: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
    researcherName: { fontWeight: "600", fontSize: "1rem", color: "#fff" },
    researcherUsername: { fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" },
    statusBadge: {
        padding: "6px 14px",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: "600",
        whiteSpace: "nowrap",
    },
    permissionsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        marginBottom: "15px",
        padding: "12px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "8px",
    },
    permissionItem: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "0.9rem",
    },
    permissionIcon: { fontSize: "1.2rem" },
    permissionLabel: { color: "rgba(255,255,255,0.8)" },
    actionButtons: {
        display: "flex",
        gap: "10px",
    },
    editButton: {
        flex: 1,
        background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
        border: "none",
        borderRadius: "8px",
        color: "#fff",
        fontWeight: "600",
        padding: "8px 12px",
        cursor: "pointer",
        fontSize: "0.9rem",
    },
    removeButton: {
        flex: 1,
        background: "rgba(239,68,68,0.15)",
        border: "2px solid rgba(239,68,68,0.5)",
        borderRadius: "8px",
        color: "#f87171",
        fontWeight: "600",
        padding: "8px 12px",
        cursor: "pointer",
        fontSize: "0.9rem",
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
    },
    modal: {
        background: "linear-gradient(165deg, rgba(23,28,38,0.98), rgba(15,18,26,0.96))",
        borderRadius: "18px",
        padding: "32px",
        width: "450px",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 0 25px rgba(96,165,250,0.25)",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        animation: "fadeIn 0.3s ease",
    },
    modalTitle: { fontSize: "1.4rem", fontWeight: "700", color: "#93c5fd", textAlign: "center" },
    modalDesc: { fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", textAlign: "center" },
    modalInput: {
        width: "100%",
        padding: "12px 14px",
        borderRadius: "10px",
        border: "2px solid rgba(96,165,250,0.3)",
        background: "rgba(255,255,255,0.08)",
        color: "#fff",
        fontSize: "1rem",
        outline: "none",
    },
    permissionsCheckboxes: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "15px",
        background: "rgba(255,255,255,0.04)",
        borderRadius: "10px",
    },
    checkboxLabel: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        fontSize: "0.95rem",
        color: "rgba(255,255,255,0.9)",
        userSelect: "none",
    },
    checkbox: {
        cursor: "pointer",
        width: "18px",
        height: "18px",
        accentColor: "#60a5fa",
    },
    modalButtons: { display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "10px" },
    modalCancel: {
        flex: 1,
        background: "rgba(239,68,68,0.15)",
        border: "2px solid rgba(239,68,68,0.5)",
        borderRadius: "10px",
        color: "#f87171",
        padding: "10px",
        fontWeight: "700",
        cursor: "pointer",
    },
    modalSubmit: {
        flex: 1,
        background: "linear-gradient(135deg, #22c55e, #4ade80)",
        border: "none",
        borderRadius: "10px",
        color: "#fff",
        padding: "10px",
        fontWeight: "700",
        boxShadow: "0 4px 10px rgba(34,197,94,0.4)",
        cursor: "pointer",
    },
    toastContainer: {
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    toast: {
        padding: "12px 18px",
        borderRadius: "10px",
        fontWeight: "600",
        fontSize: "0.9rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
        backdropFilter: "blur(10px)",
        animation: "slideIn 0.3s ease-out",
    },
    toastSuccess: { background: "rgba(34,197,94,0.9)", color: "#fff" },
    toastError: { background: "rgba(239,68,68,0.9)", color: "#fff" },
    toastInfo: { background: "rgba(59,130,246,0.9)", color: "#fff" },
    loading: { color: "#fff", textAlign: "center", marginTop: "100px" },
    error: { color: "#f87171", textAlign: "center", marginTop: "100px" },
    emptyMessage: { textAlign: "center", color: "rgba(255,255,255,0.5)", fontStyle: "italic", padding: "40px 20px" },
};

export default ManageResearchersPage;