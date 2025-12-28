// ManageStudyPage.js

import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// 🔹 Toast animasyonu
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeToast {
    0% { opacity: 0; transform: translateY(-6px); }
    100% { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

function ManageStudyPage() {
    const { studyId } = useParams();
    const navigate = useNavigate();

    const DELETABLE_STATUSES = ["DRAFT", "COMPLETED", "ARCHIVED"];

    const currentUser = JSON.parse(localStorage.getItem("user"));
    const currentUserId = currentUser ? Number(currentUser.id) : null;

    const [study, setStudy] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedStudy, setEditedStudy] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // 🔥 DELETE CONFIRM MODAL STATE
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);


    // ---- Permissions ----
    const [isOwner, setIsOwner] = useState(false);
    const [permissions, setPermissions] = useState({
        canEditStudy: false,
        canManageParticipants: false,
        canManageArtifacts: false,
        canManageCriteria: false,
        canViewResults: false,
    });

    const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showManagePeopleMenu, setShowManagePeopleMenu] = useState(false); // 🔹 NEW
    const [managePeopleHoverTimeout, setManagePeopleHoverTimeout] = useState(null);


    // 🔹 Universal Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteUsername, setInviteUsername] = useState("");
    const [inviteRole, setInviteRole] = useState("PARTICIPANT");
    const [inviting, setInviting] = useState(false);

    // 🔹 Permission Checkboxes for Researcher Invite
    const [invitePerms, setInvitePerms] = useState({
        canUploadArtifacts: false,
        canEditStudyDetails: false,
        canInviteParticipants: false,
    });

    const [tempEndDate, setTempEndDate] = useState("");
    const [toasts, setToasts] = useState([]);

    // ⭐ PARTICLES
    const [particles, setParticles] = useState([]);

    const statusMenuRef = useRef(null);
    const visibilityMenuRef = useRef(null);
    const endDateRef = useRef(null);
    const managePeopleRef = useRef(null); // 🔹 NEW

    const showToast = (message, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    };

    /* ===================== FETCH STUDY ===================== */
    useEffect(() => {
        const fetchStudy = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(
                    `http://localhost:8080/api/studies/${studyId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (!res.ok) throw new Error("Failed to fetch study");

                const data = await res.json();
                setStudy(data);

                // Owner check
                const isOwnerCheck =
                    currentUserId &&
                    data.researcher &&
                    Number(data.researcher.id) === Number(currentUserId);

                setIsOwner(isOwnerCheck);

                // Co-researcher permissions
                let coPerms = {};

                if (!isOwnerCheck && currentUserId && data.researchers) {
                    const entry = data.researchers.find(
                        (r) =>
                            Number(r.user?.id) === Number(currentUserId) &&
                            r.status === "ACCEPTED"
                    );
                    if (entry) coPerms = entry.permissions || {};
                }

                setPermissions({
                    canEditStudy:
                        isOwnerCheck || coPerms.canEditStudyDetails || false,
                    canManageParticipants:
                        isOwnerCheck || coPerms.canInviteParticipants || false,
                    canManageArtifacts:
                        isOwnerCheck || coPerms.canUploadArtifacts || false,
                    canManageCriteria: isOwnerCheck,
                    canViewResults: isOwnerCheck,
                });

                setEditedStudy(data);

                if (data.endDate) {
                    setTempEndDate(data.endDate.substring(0, 16));
                }
            } catch (err) {
                showToast("Failed to load study details", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchStudy();
    }, [studyId, currentUserId]);

    /* ===================== CLICK-OUTSIDE ===================== */
    useEffect(() => {
        const onClickOutside = (e) => {
            if (showStatusMenu && statusMenuRef.current && !statusMenuRef.current.contains(e.target))
                setShowStatusMenu(false);
            if (showVisibilityMenu && visibilityMenuRef.current && !visibilityMenuRef.current.contains(e.target))
                setShowVisibilityMenu(false);
            if (showEndDatePicker && endDateRef.current && !endDateRef.current.contains(e.target))
                setShowEndDatePicker(false);

            // 🔹 NEW: Manage People dropdown close
            if (
                showManagePeopleMenu &&
                managePeopleRef.current &&
                !managePeopleRef.current.contains(e.target)
            )
                setShowManagePeopleMenu(false);
        };

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                setShowStatusMenu(false);
                setShowVisibilityMenu(false);
                setShowEndDatePicker(false);
                setShowInviteModal(false);
                setShowManagePeopleMenu(false);
                setShowDeleteConfirm(false);

            }
        };

        document.addEventListener("mousedown", onClickOutside);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("mousedown", onClickOutside);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [showStatusMenu, showVisibilityMenu, showEndDatePicker, showManagePeopleMenu]);

    /* ================= PARTICLES ================= */
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

    /* ===================== NAVIGATION ===================== */
    const handleBack = () => navigate("/my-studies");

    const handleManageParticipants = () => {
        navigate(`/manage-participants/${studyId}`);
        setShowManagePeopleMenu(false);
    };

    const handleManageCoResearchers = () => {
        navigate(`/manage-coresearchers/${studyId}`);
        setShowManagePeopleMenu(false);
    };

    const handleManageQuiz = () =>
        navigate(`/quiz-management/${studyId}`);

    const handleEdit = () => {
        setIsEditing(true);
        setEditedStudy({ ...study });
    };

    /* ===================== INVITE HANDLER ===================== */
    const handleUniversalInvite = async () => {
        const username = inviteUsername.trim();
        if (!username) {
            showToast("Please enter a username", "error");
            return;
        }

        try {
            setInviting(true);
            const token = localStorage.getItem("token");

            let url, body;

            if (inviteRole === "RESEARCHER") {
                // ✅ Use specific endpoint for Researchers with permissions
                url = `http://localhost:8080/api/studies/${studyId}/researchers/invite`;
                body = {
                    username: username,
                    // No 'role' needed here, endpoint implies researcher
                    canUploadArtifacts: invitePerms.canUploadArtifacts,
                    canEditStudyDetails: invitePerms.canEditStudyDetails,
                    canInviteParticipants: invitePerms.canInviteParticipants,
                };
            } else {
                // ✅ Use generic endpoint for Participants/Reviewers
                url = `http://localhost:8080/api/studies/${studyId}/invite`;
                body = {
                    username: username,
                    role: inviteRole,
                };
            }

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Invite failed");
            }

            showToast(`✅ User invited as ${inviteRole}`, "success");
            setInviteUsername("");
            setShowInviteModal(false);

            // Reset permissions
            setInvitePerms({
                canUploadArtifacts: false,
                canEditStudyDetails: false,
                canInviteParticipants: false,
            });
        } catch (err) {
            showToast(`❌ ${err.message}`, "error");
        } finally {
            setInviting(false);
        }
    };

    /* ===================== SAVE ALL ===================== */
    const handleSaveAll = async () => {
        if ((editedStudy.title || "").trim().length < 3) {
            showToast("⚠️ Title must be at least 3 characters.", "error");
            return;
        }

        if ((editedStudy.description || "").trim().length < 10) {
            showToast("⚠️ Description must be at least 10 characters.", "error");
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem("token");

            const res1 = await fetch(
                `http://localhost:8080/api/studies/${studyId}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title: editedStudy.title,
                        description: editedStudy.description,
                        status: study.status,
                        visibility: study.visibility,
                    }),
                }
            );

            if (!res1.ok) throw new Error("Failed to save changes");

            if (tempEndDate && tempEndDate !== study.endDate?.substring(0, 16)) {
                const res2 = await fetch(
                    `http://localhost:8080/api/studies/${studyId}/end-date`,
                    {
                        method: "PATCH",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            endDate: tempEndDate + ":00",
                        }),
                    }
                );
                if (!res2.ok) throw new Error("Failed end date update");
            }

            const updated = await res1.json();
            const newDate = tempEndDate ? tempEndDate + ":00" : updated.endDate;

            setStudy({ ...updated, endDate: newDate });
            setEditedStudy({ ...updated, endDate: newDate });

            setIsEditing(false);
            showToast("All changes saved!", "success");
        } catch {
            showToast("Failed to save all changes", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteStudy = async () => {
        if (!DELETABLE_STATUSES.includes(study.status)) {
            showToast(
                "❗ You can delete a study only if it is DRAFT, COMPLETED or ARCHIVED.",
                "error"
            );
            return;
        }

        try {
            setDeleteLoading(true);
            const token = localStorage.getItem("token");

            const res = await fetch(
                `http://localhost:8080/api/studies/${studyId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Delete failed");
            }

            showToast("✅ Study deleted permanently", "success");

            setTimeout(() => {
                navigate("/my-studies");
            }, 1200);
        } catch (err) {
            showToast(`❌ ${err.message}`, "error");
        } finally {
            setDeleteLoading(false);
            setShowDeleteConfirm(false);
        }
    };


    /* ===================== HELPERS ===================== */
    const handleStatusChange = (newStatus) => {
        if( newStatus === "ACTIVE" && study.quiz == null) {
            showToast("A study cannot set as ACTIVE without a quiz", "error");
        } else {
            setStudy((s) => ({ ...s, status: newStatus }));
            setShowStatusMenu(false);
        }
    };

    const handleVisibilitySelect = (newVisibility) => {
        setStudy((s) => ({ ...s, visibility: newVisibility }));
        setShowVisibilityMenu(false);
    };

    const handleEndDateEdit = () => setShowEndDatePicker(true);

    const getStatusDisplay = (status) => {
        switch ((status || "").toUpperCase()) {
            case "DRAFT": return { icon: "📝", label: "Draft" };
            case "ACTIVE": return { icon: "✅", label: "Active" };
            case "COMPLETED": return { icon: "🔒", label: "Completed" };
            case "ARCHIVED": return { icon: "📦", label: "Archived" };
            default: return { icon: "📋", label: status || "Unknown" };
        }
    };

    const getStyleByStatus = (status) => {
        switch ((status || "").toUpperCase()) {
            case "DRAFT": return { border: "#facc15", badgeBg: "rgba(250,204,21,0.15)", badgeColor: "#fde047" };
            case "ACTIVE": return { border: "#22c55e", badgeBg: "rgba(34,197,94,0.15)", badgeColor: "#4ade80" };
            case "COMPLETED": return { border: "#3b82f6", badgeBg: "rgba(59,130,246,0.15)", badgeColor: "#60a5fa" };
            case "ARCHIVED": return { border: "#d1d5db", badgeBg: "rgba(255,255,255,0.1)", badgeColor: "#f3f4f6" };
            default: return { border: "#a5b4fc", badgeBg: "rgba(165,180,252,0.15)", badgeColor: "#a5b4fc" };
        }
    };

    if (loading) return <div style={styles.loading}>Loading study...</div>;
    if (!study) return <div style={styles.error}>Study not found.</div>;

    const theme = getStyleByStatus(study.status);
    const formattedEndDate = study.endDate
        ? new Date(study.endDate).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "Not set";

    return (
        <div style={styles.container}>
            <div style={styles.particles}>
                {particles.map((p) => (
                    <div key={p.id} style={{ ...styles.particle, left: `${p.left}%`, top: `${p.top}vh`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }} />
                ))}
            </div>

            <div style={styles.toastContainer}>
                {toasts.map((toast) => (
                    <div key={toast.id} style={{ ...styles.toast, ...(toast.type === "success" ? styles.toastSuccess : toast.type === "error" ? styles.toastError : styles.toastInfo) }}>
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <h2 style={styles.navTitle}>Manage Study</h2>
                    {/* Badge sol tarafa alındı */}
                    {isOwner ? (
                        <span style={styles.roleMain}>Main Researcher</span>
                    ) : study.researchers?.some(
                        (r) => r.user?.id == currentUserId
                    ) ? (
                        <span style={styles.roleCo}>Co-Researcher</span>
                    ) : (
                        <span style={styles.roleParticipant}>Participant</span>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* UNIVERSAL INVITE BUTTON */}
                    {permissions.canManageParticipants && (
                        <button style={styles.inviteButton} onClick={() => setShowInviteModal(true)}>
                            ➕ Invite User
                        </button>
                    )}

                    {/* 🔹 NEW: COMBINED MANAGE PEOPLE DROPDOWN - HOVER BASED */}
                    {(permissions.canManageParticipants || isOwner) && (
                        <div
                            style={styles.managePeopleContainer}
                            ref={managePeopleRef}
                            onMouseEnter={() => {
                                if (managePeopleHoverTimeout) {
                                    clearTimeout(managePeopleHoverTimeout);
                                    setManagePeopleHoverTimeout(null);
                                }
                                setShowManagePeopleMenu(true);
                            }}
                            onMouseLeave={() => {
                                const timeout = setTimeout(() => {
                                    setShowManagePeopleMenu(false);
                                }, 300);  // 300ms delay before closing
                                setManagePeopleHoverTimeout(timeout);
                            }}
                        >
                            <button style={styles.managePeopleButton}>
                                <span>Manage People</span>
                            </button>

                            {showManagePeopleMenu && (
                                <div style={styles.managePeopleMenu}>
                                    {permissions.canManageParticipants && (
                                        <div
                                            style={styles.managePeopleOption}
                                            onClick={handleManageParticipants}
                                        >
                                            <span style={styles.menuOptionIcon}>👥</span>
                                            <div>
                                                <div style={styles.menuOptionTitle}>
                                                    Manage Participants
                                                </div>
                                                <div style={styles.menuOptionDesc}>
                                                    View and manage study participants
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {isOwner && (
                                        <div
                                            style={{
                                                ...styles.managePeopleOption,
                                                borderBottom: "none"
                                            }}
                                            onClick={handleManageCoResearchers}
                                        >
                                            <span style={styles.menuOptionIcon}>👤</span>
                                            <div>
                                                <div style={styles.menuOptionTitle}>
                                                    Manage Co-Researchers
                                                </div>
                                                <div style={styles.menuOptionDesc}>
                                                    View and manage co-researchers
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <button style={styles.backButton} onClick={handleBack}>
                        ← Back to My Studies
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div style={styles.content}>
                <div style={styles.twoColumnLayout}>
                    {/* STUDY DETAILS */}
                    <div style={styles.studyCard}>
                        <div style={styles.studyHeader}>
                            <h1 style={styles.studyTitle}>
                                {isEditing ? <input type="text" value={editedStudy.title} onChange={(e) => setEditedStudy({ ...editedStudy, title: e.target.value })} style={styles.titleInput} /> : study.title}
                            </h1>
                            <div style={styles.badgeGroup}>
                                <span style={{ ...styles.statusBadge, background: theme.badgeBg, color: theme.badgeColor }}>{study.status}</span>
                                <span style={styles.visibilityBadge}>{study.visibility}</span>
                            </div>
                        </div>
                        <div style={styles.descriptionSection}>
                            <label style={styles.label}>Description</label>
                            {isEditing ? <textarea value={editedStudy.description} onChange={(e) => setEditedStudy({ ...editedStudy, description: e.target.value })} style={styles.descriptionTextarea} /> : <p style={styles.studyDescription}>{study.description}</p>}
                        </div>
                        <div style={styles.infoRow}>
                            <div style={styles.infoItem}><span style={styles.infoLabel}>👥 Participants:</span><span style={styles.infoValue}>{study.participants?.length || 0}</span></div>
                            <div style={styles.infoItem}><span style={styles.infoLabel}>🕒 Created:</span><span style={styles.infoValue}>{new Date(study.createdAt).toLocaleDateString()}</span></div>
                        </div>
                        {!isEditing && permissions.canEditStudy && <button style={styles.editButton} onClick={handleEdit}>✏️ Edit Study Details</button>}
                    </div>

                    {/* QUIZ CARD */}
                    <div style={styles.quizCard}>
                        <div style={styles.quizHeader}><div style={styles.quizIcon}>📝</div><h2 style={styles.quizTitle}>Study Quiz</h2></div>
                        <h3 style={styles.quizName}>{study.quiz?.title || "No quiz assigned"}</h3>
                        <div style={styles.quizDetails}>
                            <div style={styles.quizDetailItem}><span style={styles.quizDetailLabel}>Questions:</span><span style={styles.quizDetailValue}>{study.quiz?.questionCount || 0}</span></div>
                            <div style={styles.quizDetailItem}><span style={styles.quizDetailLabel}>Last Updated:</span><span style={styles.quizDetailValue}>{study.quiz?.lastUpdated ? new Date(study.quiz.lastUpdated).toLocaleDateString() : "-"}</span></div>
                        </div>
                        {isOwner && <button style={styles.manageQuizButton} onClick={handleManageQuiz}>⚙️ Manage Quiz</button>}
                    </div>
                </div>

                {/* CONTROLS */}
                <div style={styles.threeColumnSection}>
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Status</h2>
                        <div style={styles.visibilityContainer} ref={statusMenuRef}>
                            <button style={{ ...styles.visibilityButton, ...(!isOwner ? styles.visibilityButtonDisabled : {}) }} onClick={() => isOwner && setShowStatusMenu(!showStatusMenu)}>
                                <span style={styles.visibilityButtonText}>{getStatusDisplay(study.status).icon} {getStatusDisplay(study.status).label}</span>
                                <span style={styles.dropdownArrow}>{showStatusMenu ? "▲" : "▼"}</span>
                            </button>
                            {showStatusMenu && (
                                <div style={styles.visibilityMenu}>
                                    {["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"].map(s => (
                                        <div key={s} style={{ ...styles.visibilityOption, background: study.status === s ? "rgba(255,255,255,0.06)" : "transparent" }} onClick={() => handleStatusChange(s)}>
                                            <span style={styles.visibilityIcon}>{getStatusDisplay(s).icon}</span><div><div style={styles.visibilityOptionTitle}>{getStatusDisplay(s).label}</div></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Visibility</h2>
                        <div style={styles.visibilityContainer} ref={visibilityMenuRef}>
                            <button style={{ ...styles.visibilityButton, ...(!isOwner ? styles.visibilityButtonDisabled : {}) }} onClick={() => isOwner && setShowVisibilityMenu(!showVisibilityMenu)}>
                                <span style={styles.visibilityButtonText}>{study.visibility === "PUBLIC" ? "🌍 Public" : "🔐 Private"}</span>
                                <span style={styles.dropdownArrow}>{showVisibilityMenu ? "▲" : "▼"}</span>
                            </button>
                            {showVisibilityMenu && (
                                <div style={styles.visibilityMenu}>
                                    <div style={{ ...styles.visibilityOption }} onClick={() => handleVisibilitySelect("PUBLIC")}><span style={styles.visibilityIcon}>🌍</span><div><div style={styles.visibilityOptionTitle}>Public</div></div></div>
                                    <div style={{ ...styles.visibilityOption }} onClick={() => handleVisibilitySelect("PRIVATE")}><span style={styles.visibilityIcon}>🔐</span><div><div style={styles.visibilityOptionTitle}>Private</div></div></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>End Date</h2>
                        <div style={styles.endDateContainer} ref={endDateRef}>
                            <div style={styles.endDateDisplay}><span style={styles.endDateLabel}>📅 {formattedEndDate}</span>{isOwner && <button style={styles.editEndDateButton} onClick={handleEndDateEdit}>✏️ Edit</button>}</div>
                            {showEndDatePicker && (
                                <div style={styles.datePickerContainer}>
                                    <label style={styles.datePickerLabel}>Select end date & time</label>
                                    <input type="datetime-local" value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} style={styles.dateTimeInput} />
                                    <button style={styles.closeDatePicker} onClick={() => setShowEndDatePicker(false)}>Done</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SAVE ALL */}
                <div style={styles.saveAllContainer}>
                    <button
                        style={styles.saveAllButton}
                        onClick={handleSaveAll}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save All Changes"}
                    </button>
                </div>
                {/* ===================== DELETE STUDY (UI ONLY) ===================== */}
                <div
                    style={{
                        ...styles.deleteContainer,
                        ...(DELETABLE_STATUSES.includes(study.status)
                            ? styles.deleteContainerActive
                            : styles.deleteContainerDisabled),
                    }}
                >
                    <h3 style={styles.deleteTitle}>Danger Zone</h3>
                    <p style={styles.deleteDescription}>
                        Deleting a study will remove all tasks, artifacts, participants,
                        and quiz data. This action cannot be undone.
                    </p>

                    <button
                        className="delete-study-btn"
                        style={{
                            ...styles.deleteStudyButton,
                            ...(!DELETABLE_STATUSES.includes(study.status)
                                ? styles.deleteDisabled
                                : {})                        }}
                        onClick={() => {
                            if (!DELETABLE_STATUSES.includes(study.status)) {
                                showToast(
                                    "❗ You can delete a study only if it is DRAFT, COMPLETED or ARCHIVED.",
                                    "error"
                                );
                                return;
                            }

                            setShowDeleteConfirm(true); // 🔥 modal açılır
                        }}



                    >
                        Delete This Study
                    </button>

                </div>

            </div>

            {/* UNIVERSAL INVITE MODAL */}
            {showInviteModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>Invite User</h3>
                        <p style={styles.modalDesc}>Invite a new user to join this study.</p>

                        <div style={{ marginBottom: 15 }}>
                            <label style={styles.label}>Username</label>
                            <input
                                type="text"
                                placeholder="Enter username"
                                value={inviteUsername}
                                onChange={(e) => setInviteUsername(e.target.value)}
                                style={styles.modalInput}
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={styles.label}>Role</label>
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                style={styles.modalInput}
                            >
                                <option value="PARTICIPANT">Participant</option>
                                {isOwner && <option value="RESEARCHER">Co-Researcher</option>}
                                {isOwner && <option value="REVIEWER">Reviewer</option>}
                            </select>
                        </div>

                        {/* 🔥 Conditional Checkboxes for Researcher */}
                        {inviteRole === "RESEARCHER" && (
                            <div style={styles.permissionsCheckboxes}>
                                <label style={styles.checkboxLabel}>
                                    <input type="checkbox" checked={invitePerms.canUploadArtifacts} onChange={(e) => setInvitePerms({ ...invitePerms, canUploadArtifacts: e.target.checked })} style={styles.checkbox} />
                                    📤 Upload Artifacts
                                </label>
                                <label style={styles.checkboxLabel}>
                                    <input type="checkbox" checked={invitePerms.canEditStudyDetails} onChange={(e) => setInvitePerms({ ...invitePerms, canEditStudyDetails: e.target.checked })} style={styles.checkbox} />
                                    ✏️ Edit Details
                                </label>
                                <label style={styles.checkboxLabel}>
                                    <input type="checkbox" checked={invitePerms.canInviteParticipants} onChange={(e) => setInvitePerms({ ...invitePerms, canInviteParticipants: e.target.checked })} style={styles.checkbox} />
                                    👥 Invite Participants
                                </label>
                            </div>
                        )}

                        <div style={styles.modalButtons}>
                            <button style={styles.modalCancel} onClick={() => setShowInviteModal(false)} disabled={inviting}>Cancel</button>
                            <button style={styles.modalSubmit} onClick={handleUniversalInvite} disabled={inviting}>{inviting ? "Sending..." : "Send Invite"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔥 DELETE CONFIRM MODAL */}
            {showDeleteConfirm && (
                <div
                    style={styles.modalOverlay}
                    onClick={() => !deleteLoading && setShowDeleteConfirm(false)}
                >
                    <div
                        style={{
                            ...styles.modal,
                            border: "2px solid rgba(239,68,68,0.5)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ ...styles.modalTitle, color: "#f87171" }}>
                            ⚠️ Delete Study
                        </h3>

                        <p style={styles.modalDesc}>
                            This will permanently delete this study and
                            <b> all related tasks, participants, artifacts and quiz data.</b>
                            <br /><br />
                            <b>This action cannot be undone.</b>
                        </p>

                        <div style={styles.modalButtons}>
                            <button
                                style={styles.modalCancel}
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>

                            <button
                                style={{
                                    ...styles.modalSubmit,
                                    background: "linear-gradient(135deg, #ef4444, #f87171)",
                                }}
                                onClick={handleDeleteStudy}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? "Deleting..." : "Yes, Delete Study"}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* BUTTON HOVER EFFECTS */}
            <style>
                {`
        /* SAVE BUTTON */
        button[style*="22c55e"]:hover {
          transform: scale(1.05);
          box-shadow: 0 0 16px rgba(34,197,94,0.75) !important;
        }

        /* CANCEL / RED BUTTONS */
        button[style*="239,68,68"]:hover {
          transform: scale(1.05);
          box-shadow: 0 0 16px rgba(239,68,68,0.75) !important;
        }

        /* DELETE STUDY */
        .delete-study-btn:hover {
          transform: scale(1.03);
          background: rgba(239,68,68,0.35) !important;
          border-color: rgba(239,68,68,0.85) !important;
          box-shadow: 0 0 18px rgba(239,68,68,0.55);
        }

        @keyframes floatParticle {
          0% { transform: translateY(0); opacity: 0.4; }
          50% { opacity: 1; }
          100% { transform: translateY(-120vh); opacity: 0; }
        }
    `}
            </style>

        </div>
    );
}

/* ===================== STYLES ===================== */
const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
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

    visibilityButtonDisabled: {
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.5)",
        cursor: "default",
        boxShadow: "none",
        pointerEvents: "none",
        transform: "none",
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
        background: "rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
    },

    navTitle: {
        fontSize: "1.6rem",
        fontWeight: "700",
        color: "#60a5fa",
        margin: 0,
    },

    backButton: {
        background: "rgba(239,68,68,0.1)",
        border: "2px solid rgba(239,68,68,0.5)",
        borderRadius: "10px",
        padding: "6px 14px",  // ✅ Reduced from "8px 18px"
        color: "#f87171",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "0.9rem",  // ✅ Smaller font size
        transition: "all 0.25s ease",
        boxShadow: "0 0 8px rgba(239,68,68,0.4)",
    },

    // 🔹 NEW: Manage People Dropdown Styles
    managePeopleContainer: {
        position: "relative",
    },

    managePeopleButton: {
        background: "rgba(34,197,94,0.15)",
        border: "2px solid rgba(34,197,94,0.5)",
        borderRadius: "10px",
        padding: "6px 14px",  // ✅ Reduced from "8px 16px"
        color: "#4ade80",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "0.9rem",  // ✅ Reduced from "1rem"
        transition: "all 0.3s ease",
        boxShadow: "0 0 8px rgba(34,197,94,0.4)",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },


    managePeopleIcon: {
        fontSize: "1.1rem",
    },

    managePeopleMenu: {
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        minWidth: "280px",
        background: "rgba(20,20,30,0.95)",
        border: "2px solid rgba(34,197,94,0.3)",
        borderRadius: "12px",
        overflow: "hidden",
        zIndex: 1000,
        boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
        backdropFilter: "blur(10px)",
    },

    managePeopleOption: {
        padding: "15px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
    },

    menuOptionIcon: {
        fontSize: "1.5rem",
    },

    menuOptionTitle: {
        fontSize: "1rem",
        fontWeight: "600",
        color: "#fff",
        marginBottom: "2px",
    },

    menuOptionDesc: {
        fontSize: "0.85rem",
        color: "rgba(255,255,255,0.6)",
    },

    inviteButton: {
        background: "rgba(59,130,246,0.15)",
        border: "2px solid rgba(59,130,246,0.5)",
        borderRadius: "10px",
        padding: "6px 14px",  // ✅ Reduced from "8px 18px"
        color: "#60a5fa",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "0.9rem",  // ✅ Smaller font size
        transition: "all 0.3s ease",
        boxShadow: "0 0 8px rgba(59,130,246,0.4)",
    },

    /* GENERAL CONTENT LAYOUT */
    content: {
        padding: "40px 60px",
        maxWidth: "1400px",
        margin: "0 auto",
    },

    twoColumnLayout: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "25px",
        marginBottom: "30px",
    },

    /* ROLES */
    roleMain: {
        padding: "6px 14px",
        background: "rgba(59,130,246,0.15)",
        border: "1px solid rgba(59,130,246,0.4)",
        color: "#60a5fa",
        borderRadius: "12px",
        fontSize: "0.85rem",
        fontWeight: 700,
    },

    roleCo: {
        padding: "6px 14px",
        background: "rgba(16,185,129,0.15)",
        border: "1px solid rgba(16,185,129,0.4)",
        color: "#34d399",
        borderRadius: "12px",
        fontSize: "0.85rem",
        fontWeight: 700,
    },

    roleParticipant: {
        padding: "6px 14px",
        background: "rgba(234,179,8,0.15)",
        border: "1px solid rgba(234,179,8,0.4)",
        color: "#facc15",
        borderRadius: "12px",
        fontSize: "0.85rem",
        fontWeight: 700,
    },

    /* STUDY CARD */
    studyCard: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "15px",
        padding: "25px",
        border: "1px solid rgba(255,255,255,0.15)",
    },

    studyHeader: {
        display: "flex",
        flexDirection: "column",
        marginBottom: "20px",
        gap: "12px",
    },

    // 🔹 UPDATED: Manage People Dropdown Styles


    studyTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#fff",
        margin: 0,
    },

    titleInput: {
        width: "calc(100% - 32px)",
        fontSize: "1.5rem",
        fontWeight: "700",
        background: "rgba(255,255,255,0.1)",
        border: "2px solid rgba(96,165,250,0.5)",
        borderRadius: "8px",
        padding: "8px 16px",
        color: "#fff",
        outline: "none",
        marginRight: "6px",
    },

    badgeGroup: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },

    statusBadge: {
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: "600",
        border: "1px solid rgba(255,255,255,0.15)",
    },

    visibilityBadge: {
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: "600",
        background: "rgba(59,130,246,0.12)",
        color: "#60a5fa",
        border: "1px solid rgba(255,255,255,0.08)",
    },

    /* DESCRIPTION SECTION */
    descriptionSection: {
        marginBottom: "15px",
        paddingRight: "6px",
    },

    label: {
        display: "block",
        fontSize: "0.85rem",
        color: "#93c5fd",
        marginBottom: "6px",
        fontWeight: "600",
    },

    studyDescription: {
        color: "rgba(255,255,255,0.9)",
        fontSize: "0.95rem",
        lineHeight: "1.5",
        margin: 0,
    },

    descriptionTextarea: {
        width: "calc(100% - 30px)",
        minHeight: "100px",
        background: "rgba(255,255,255,0.1)",
        border: "2px solid rgba(96,165,250,0.5)",
        borderRadius: "8px",
        padding: "12px 16px",
        color: "#fff",
        fontSize: "0.95rem",
        fontFamily: "inherit",
        resize: "vertical",
        outline: "none",
        marginRight: "6px",
    },

    /* INFO */
    infoRow: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        paddingTop: "12px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        marginBottom: "15px",
    },

    infoItem: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },

    infoLabel: {
        fontSize: "0.9rem",
        color: "rgba(255,255,255,0.7)",
    },

    infoValue: {
        fontSize: "0.9rem",
        color: "#fff",
        fontWeight: "600",
    },

    editButton: {
        background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
        color: "#f8fafc",
        border: "none",
        borderRadius: "10px",
        padding: "10px 20px",
        fontWeight: "700",
        cursor: "pointer",
        fontSize: "0.95rem",
        boxShadow: "0 0 6px rgba(96,165,250,0.35)",
        transition: "transform 0.3s ease",
        width: "100%",
    },

    /* QUIZ CARD */
    quizCard: {
        background: "rgba(168,85,247,0.08)",
        border: "2px solid rgba(168,85,247,0.3)",
        borderRadius: "15px",
        padding: "25px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 0 6px rgba(168,85,247,0.2)",
    },

    quizHeader: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "20px",
    },

    quizIcon: {
        fontSize: "2rem",
    },

    quizTitle: {
        fontSize: "1.3rem",
        fontWeight: "700",
        color: "#c084fc",
        margin: 0,
    },

    quizName: {
        fontSize: "1.1rem",
        fontWeight: "600",
        color: "#fff",
        marginBottom: "15px",
    },

    deleteContainerActive: {
        border: "1px solid rgba(239,68,68,0.55)",
        boxShadow: "0 0 12px rgba(239,68,68,0.35)",
    },

    deleteContainerDisabled: {
        border: "1px solid rgba(255,255,255,0.08)",
        opacity: 0.75,
    },

    deleteContainer: {
        marginTop: "25px",
        padding: "20px",
        background: "rgba(255,255,255,0.04)",
        borderRadius: "15px",
        border: "1px solid rgba(255,255,255,0.1)",
    },

    deleteTitle: {
        fontSize: "1.2rem",
        fontWeight: 700,
        color: "#fca5a5",
        marginBottom: 6,
    },

    deleteDescription: {
        fontSize: "0.9rem",
        color: "rgba(255,255,255,0.6)",
        marginBottom: 14,
    },

    deleteStudyButton: {
        width: "100%",
        background: "rgba(239,68,68,0.25)",
        border: "2px solid rgba(239,68,68,0.6)",
        color: "#f87171",
        fontWeight: 700,
        padding: "12px 20px",
        borderRadius: 12,
        cursor: "pointer",
        transition: "0.25s ease",
        fontSize: "1rem",
    },

    quizDetails: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginBottom: "20px",
    },

    quizDetailItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 12px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "8px",
    },

    quizDetailLabel: {
        fontSize: "0.9rem",
        color: "rgba(255,255,255,0.7)",
    },

    quizDetailValue: {
        fontSize: "0.9rem",
        color: "#fff",
        fontWeight: "600",
    },

    manageQuizButton: {
        background: "linear-gradient(135deg, #a855f7, #c084fc)",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "12px 20px",
        fontWeight: "700",
        cursor: "pointer",
        fontSize: "1rem",
        boxShadow: "0 0 8px rgba(168,85,247,0.4)",
        transition: "all 0.3s ease",
    },

    /* THREE COLUMN LAYOUT */
    threeColumnSection: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "25px",
        marginBottom: "25px",
    },

    section: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "15px",
        padding: "25px",
        border: "1px solid rgba(255,255,255,0.1)",
        flex: 1,
    },

    sectionTitle: {
        fontSize: "1.3rem",
        fontWeight: "700",
        color: "#93c5fd",
        margin: "0 0 8px 0",
    },

    sectionDescription: {
        fontSize: "0.95rem",
        color: "rgba(255,255,255,0.6)",
        marginBottom: "20px",
    },

    /* DROPDOWN SELECTS */
    visibilityContainer: {
        position: "relative",
        maxWidth: "100%",
    },

    visibilityButton: {
        width: "100%",
        padding: "14px 20px",
        background: "rgba(255,255,255,0.1)",
        border: "2px solid rgba(255,255,255,0.2)",
        borderRadius: "10px",
        color: "#fff",
        fontSize: "1rem",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        transition: "all 0.3s ease",
    },

    visibilityButtonText: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },

    dropdownArrow: {
        fontSize: "0.8rem",
        color: "rgba(255,255,255,0.6)",
    },

    visibilityMenu: {
        position: "absolute",
        top: "calc(100% + 8px)",
        left: 0,
        right: 0,
        background: "rgba(20,20,30,0.95)",
        border: "2px solid rgba(255,255,255,0.2)",
        borderRadius: "10px",
        overflow: "hidden",
        zIndex: 100,
        boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
    },

    deleteDisabled: {
        opacity: 0.4,
        cursor: "not-allowed",
        background: "rgba(239,68,68,0.15)",
        border: "2px solid rgba(239,68,68,0.3)",
        color: "rgba(248,113,113,0.5)",
    },

    visibilityOption: {
        padding: "15px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
    },

    visibilityIcon: {
        fontSize: "1.5rem",
    },

    visibilityOptionTitle: {
        fontSize: "1rem",
        fontWeight: "600",
        color: "#fff",
        marginBottom: "2px",
    },

    visibilityOptionDesc: {
        fontSize: "0.85rem",
        color: "rgba(255,255,255,0.6)",
    },

    /* END DATE PICKER */
    endDateContainer: {
        position: "relative",
    },

    endDateDisplay: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },

    endDateLabel: {
        fontSize: "1rem",
        color: "#fff",
    },

    editEndDateButton: {
        background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
        border: "none",
        borderRadius: "10px",
        padding: "10px 18px",
        color: "#fff",
        fontWeight: "700",
        fontSize: "1rem",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: "0 0 10px rgba(96,165,250,0.4)",
    },

    datePickerContainer: {
        marginTop: "12px",
        background: "rgba(255,255,255,0.08)",
        borderRadius: "10px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },

    datePickerLabel: {
        fontSize: "0.9rem",
        color: "#93c5fd",
    },

    dateTimeInput: {
        background: "rgba(255,255,255,0.1)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "8px",
        padding: "8px 10px",
        fontSize: "1rem",
    },

    closeDatePicker: {
        alignSelf: "flex-end",
        background: "linear-gradient(135deg, #22c55e, #4ade80)",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "6px 12px",
        fontWeight: "600",
        cursor: "pointer",
    },

    /* SAVE ALL */
    saveAllContainer: {
        marginTop: "30px",
        padding: "20px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "15px",
        border: "1px solid rgba(255,255,255,0.1)",
    },

    saveAllButton: {
        width: "100%",
        padding: "16px 30px",
        background: "linear-gradient(135deg, #22c55e, #4ade80)",
        color: "#fff",
        border: "none",
        borderRadius: "12px",
        fontWeight: "700",
        fontSize: "1.1rem",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 15px rgba(34,197,94,0.4)",
    },

    /* TOASTS */
    toastContainer: {
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        zIndex: 3000,
        alignItems: "center",
    },

    toast: {
        padding: "14px 22px",
        borderRadius: "10px",
        color: "white",
        fontWeight: 600,
        fontSize: "0.95rem",
        backdropFilter: "blur(10px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        animation: "fadeToast 0.35s ease",
        minWidth: "260px",
        textAlign: "center",
        border: "1px solid rgba(255,255,255,0.2)",
    },

    toastSuccess: {
        background: "rgba(34,197,94,0.25)",
        borderColor: "rgba(34,197,94,0.55)",
    },

    toastError: {
        background: "rgba(239,68,68,0.25)",
        borderColor: "rgba(239,68,68,0.55)",
    },

    toastInfo: {
        background: "rgba(59,130,246,0.25)",
        borderColor: "rgba(59,130,246,0.55)",
    },

    /* 🔹 MODAL STYLES */
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(6px)",
    },
    modal: {
        background: "linear-gradient(145deg, #1e293b, #0f172a)",
        padding: "30px",
        borderRadius: "20px",
        width: "400px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)",
        animation: "fadeToast 0.3s ease",
    },
    modalTitle: {
        fontSize: "1.4rem",
        fontWeight: "700",
        color: "#60a5fa",
        textAlign: "center",
        marginBottom: "10px",
    },
    modalDesc: {
        textAlign: "center",
        fontSize: "0.95rem",
        color: "rgba(255,255,255,0.7)",
        marginBottom: "20px",
    },
    modalInput: {
        width: "100%",
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(0,0,0,0.3)",
        color: "#fff",
        fontSize: "1rem",
        outline: "none",
        boxSizing: "border-box",
    },
    modalButtons: {
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        marginTop: "10px",
    },
    modalCancel: {
        flex: 1,
        padding: "10px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "transparent",
        color: "#cbd5e1",
        cursor: "pointer",
        fontWeight: "600",
    },
    modalSubmit: {
        flex: 1,
        padding: "10px",
        borderRadius: "10px",
        border: "none",
        background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "600",
        boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
    },
    permissionsCheckboxes: {
        display: "flex",
        flexDirection: "column",  // ✅ Makes items stack vertically
        gap: "12px",
        padding: "15px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.1)",
        marginBottom: "15px",
    },

};

export default ManageStudyPage;