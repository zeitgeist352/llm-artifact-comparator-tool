// ManageSingleTaskPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ============================================================
   ⭐ PRISMJS – RENKLİ KOD ÖNİZLEME
============================================================ */
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";

/* ============================================================
   PARTICLES (AddTaskPage ile aynı)
============================================================ */
function FloatingParticles() {
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

    return (
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
    );
}

/* ============================================================
   STATUS BADGES
============================================================ */
const getStyleByStatus = (status) => {
    switch ((status || "").toUpperCase()) {
        case "DRAFT":
            return { border: "#facc15", badgeBg: "rgba(250,204,21,0.15)", badgeColor: "#fde047" };
        case "ACTIVE":
            return { border: "#22c55e", badgeBg: "rgba(34,197,94,0.15)", badgeColor: "#4ade80" };
        case "COMPLETED":
            return { border: "#3b82f6", badgeBg: "rgba(59,130,246,0.15)", badgeColor: "#60a5fa" };
        case "ARCHIVED":
            return { border: "#d1d5db", badgeBg: "rgba(255,255,255,0.1)", badgeColor: "#f3f4f6" };
        default:
            return { border: "#a5b4fc", badgeBg: "rgba(165,180,252,0.15)", badgeColor: "#a5b4fc" };
    }
};

/* ============================================================
   StudyType label formatter (BUG_CATEGORIZATION → Bug Categorization)
============================================================ */
const formatStudyType = (type) => {
    if (!type) return "";
    return type
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
};

/* ============================================================
   PAGE
============================================================ */
function ManageSingleTaskPage() {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");
    const [editedDesc, setEditedDesc] = useState("");

    const [titleError, setTitleError] = useState("");
    const [descError, setDescError] = useState("");

    const [toast, setToast] = useState(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2000);
    };

    /* ============================================================
       🔥 LOCKED STUDY TYPES (edit kapalı)
    ============================================================ */
    const lockedStudyTypes = ["BUG_CATEGORIZATION", "CODE_CLONE", "SNAPSHOT_TESTING", "SOLID_DETECTION"];
    const isLocked = task && lockedStudyTypes.includes(task.studyType);

    /* ============================================================
       ⭐ PREVIEW STATE
    ============================================================ */
    const [previewArtifact, setPreviewArtifact] = useState(null);
    const [previewURL, setPreviewURL] = useState("");
    const [previewText, setPreviewText] = useState("");
    const [previewLanguage, setPreviewLanguage] = useState("markup");
    const [previewLoading, setPreviewLoading] = useState(false);

    /* ============================================================
       ⭐ PRISM HIGHLIGHT
    ============================================================ */
    useEffect(() => {
        if (previewText) Prism.highlightAll();
    }, [previewText]);

    /* ============================================================
       LOAD TASK
    ============================================================ */
    useEffect(() => {
        const loadTask = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/tasks/details/${taskId}`);
                const data = await res.json();

                setTask(data);
                setEditedTitle(data.questionText || "");
                setEditedDesc(data.description || "");
            } catch (e) {
                showToast("Failed to load task.", "error");
            } finally {
                setLoading(false);
            }
        };

        loadTask();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskId]);

    /* ============================================================
       SAVE CHANGES
    ============================================================ */
    const handleSave = async () => {
        if (isLocked) return showToast("This task cannot be edited for this study type.", "error");

        let err = false;

        if (editedTitle.trim().length < 5) {
            setTitleError("Title must be at least 5 characters.");
            err = true;
        } else setTitleError("");

        if (editedDesc.trim().length < 10) {
            setDescError("Description must be at least 10 characters.");
            err = true;
        } else setDescError("");

        if (err) {
            showToast("Please fix errors before saving.", "error");
            return;
        }

        try {
            const res = await fetch(`http://localhost:8080/api/tasks/update/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionText: editedTitle,
                    description: editedDesc,
                }),
            });

            if (!res.ok) throw new Error();
            const updated = await res.json();

            setTask(updated);
            setIsEditing(false);
            showToast("Task updated!", "success");
        } catch {
            showToast("Failed to update task.", "error");
        }
    };

    const handleCancelEdit = () => {
        if (!task) return;
        setEditedTitle(task.questionText || "");
        setEditedDesc(task.description || "");
        setTitleError("");
        setDescError("");
        setIsEditing(false);
    };

    /* ============================================================
       ⭐ PREVIEW HANDLER
    ============================================================ */
    const handlePreview = async (artifact) => {
        const token = localStorage.getItem("token");
        const url = `http://localhost:8080/researcher/artifact/${artifact.id}`;

        setPreviewArtifact(artifact);
        setPreviewLoading(true);
        setPreviewText("");
        setPreviewURL("");

        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Preview failed");

            const blob = await response.blob();
            const blobURL = URL.createObjectURL(blob);
            const filename = artifact.filename.toLowerCase();

            if (filename.match(/\.(pdf|png|jpg|jpeg)$/i)) {
                setPreviewURL(blobURL);
            } else {
                const ext = filename.split(".").pop();
                const langMap = {
                    java: "clike",
                    js: "javascript",
                    ts: "javascript",
                    py: "python",
                    c: "clike",
                    cpp: "clike",
                    html: "markup",
                    css: "markup",
                    md: "markdown",
                    json: "json",
                    txt: "markup",
                };

                setPreviewLanguage(langMap[ext] || "markup");
                const text = await blob.text();
                setPreviewText(text);
            }
        } catch {
            setPreviewText("Preview not supported.");
        } finally {
            setPreviewLoading(false);
        }
    };

    /* ============================================================
       RENDER STATE
    ============================================================ */
    if (loading)
        return (
            <div style={{ color: "#fff", textAlign: "center", marginTop: 50 }}>
                Loading…
            </div>
        );
    if (!task)
        return (
            <div style={{ color: "red", textAlign: "center", marginTop: 50 }}>
                Task not found.
            </div>
        );

    const isDraft = task.studyStatus === "DRAFT";
    const theme = getStyleByStatus(task.studyStatus);

    const completed = task.completedParticipants || [];
    const all = task.allParticipants || [];
    const pending = all.filter((p) => !completed.some((c) => c.id === p.id));

    const percent = all.length === 0 ? 0 : Math.round((completed.length / all.length) * 100);

    const studyTypeLabel = task.studyType ? formatStudyType(task.studyType) : null;

    /* ============================================================
       USER CARD
    ============================================================= */
    const renderUserCard = (u, done) => {
        const first = u.username?.[0]?.toUpperCase() || "?";

        return (
            <div style={styles.userCard} key={u.id}>
                <div style={styles.userAvatar}>{first}</div>

                <div style={styles.userInfo}>
                    <div style={styles.userName}>{u.username}</div>
                    <div
                        style={{
                            ...styles.userTag,
                            color: done ? "#86efac" : "#fcd34d",
                        }}
                    >
                        {done ? "Completed" : "Pending"}
                    </div>
                </div>

                <div style={styles.userIcon}>{done ? "✔" : "⏳"}</div>
            </div>
        );
    };

    const handleDeleteTask = async () => {
        if (task.studyStatus !== "DRAFT") {
            showToast("❗ You can delete a task only in DRAFT mode.", "error");
            return;
        }

        setDeleteLoading(true);

        try {
            const res = await fetch(`http://localhost:8080/api/tasks/${task.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error();

            showToast("🗑️ Task deleted successfully.", "success");

            // kısa gecikme → toast görülsün
            setTimeout(() => {
                navigate(-1); // study / task list’e geri
            }, 800);
        } catch {
            showToast("Failed to delete task.", "error");
        } finally {
            setDeleteLoading(false);
            setShowDeleteConfirm(false);
        }
    };


    return (
        <div style={styles.container}>
            <FloatingParticles />

            {/* TOAST (AddTaskPage tarzı üst orta) */}
            {toast && (
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
                    {toast.message}
                </div>
            )}

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>Manage Task</h2>

                <button
                    className="back-btn"
                    style={styles.backButton}
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>
            </div>

            {/* CONTENT */}
            <div style={styles.content}>
                <div style={styles.mainCard}>
                    {/* HEADER */}
                    <div style={styles.headerRow}>
                        <div style={{ flex: 1 }}>
                            <label style={styles.label}>Task Question</label>

                            {/* 🔒 Eğer studyType locked ise her zaman sadece text göster */}
                            {isLocked || !isEditing ? (
                                <h1 style={styles.taskTitle}>{task.questionText}</h1>
                            ) : (
                                <>
                                    <input
                                        style={{
                                            ...styles.titleInput,
                                            borderColor: titleError
                                                ? "rgba(239,68,68,0.9)"
                                                : "rgba(96,165,250,0.5)",
                                        }}
                                        value={editedTitle}
                                        onChange={(e) => {
                                            setEditedTitle(e.target.value);
                                            if (e.target.value.length >= 5) setTitleError("");
                                        }}
                                    />
                                    {titleError && <p style={styles.errorText}>{titleError}</p>}
                                </>
                            )}
                        </div>

                        {/* 🔥 Study Type (sol) + Status (sağ) profesyonel layout */}
                        <div style={styles.badgeColumn}>
                            <div style={styles.badgeRow}>
                                {studyTypeLabel && (
                                    <div style={styles.badgeGroup}>
                                        <span style={styles.badgeLabel}>Study Type</span>
                                        <span style={styles.typePill}>{studyTypeLabel}</span>
                                    </div>
                                )}

                                <div style={styles.badgeGroup}>
                                    <span style={styles.badgeLabel}>Status</span>
                                    <span
                                        style={{
                                            ...styles.statusBadge,
                                            background: theme.badgeBg,
                                            color: theme.badgeColor,
                                            borderColor: theme.border,
                                        }}
                                    >
                                        {task.studyStatus}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div style={styles.sectionBlock}>
                        <label style={styles.label}>Description</label>

                        {isLocked || !isEditing ? (
                            <p style={styles.descriptionText}>
                                {task.description || <span style={{ opacity: 0.6 }}>No description.</span>}
                            </p>
                        ) : (
                            <>
                                <textarea
                                    rows={4}
                                    style={{
                                        ...styles.descriptionTextarea,
                                        borderColor: descError
                                            ? "rgba(239,68,68,0.9)"
                                            : "rgba(96,165,250,0.5)",
                                    }}
                                    value={editedDesc}
                                    onChange={(e) => {
                                        setEditedDesc(e.target.value);
                                        if (e.target.value.length >= 10) setDescError("");
                                    }}
                                />
                                {descError && <p style={styles.errorText}>{descError}</p>}
                            </>
                        )}
                    </div>

                    {/* INFO ROW */}
                    <div style={styles.infoRow}>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>🧩 Artifact Count:</span>
                            <span style={styles.infoValue}>{task.artifactCount || 0}</span>
                        </div>

                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>👥 Participants:</span>
                            <span style={styles.infoValue}>{all.length}</span>
                        </div>
                    </div>

                    {/* EDIT BUTTONS */}
                    {!isLocked && (
                        <>
                            {!isEditing ? (
                                <button
                                    className="edit-btn"
                                    style={{
                                        ...styles.editMainButton,
                                        opacity: isDraft ? 1 : 0.4,
                                        cursor: isDraft ? "pointer" : "not-allowed",
                                    }}
                                    onClick={() => {
                                        if (!isDraft)
                                            return showToast("This study is not in draft mode.", "error");
                                        setIsEditing(true);
                                    }}
                                >
                                    ✏️ Edit Task Details
                                </button>
                            ) : (
                                <div style={styles.editActions}>
                                    <button
                                        className="save-btn"
                                        style={styles.saveButton}
                                        onClick={handleSave}
                                    >
                                        💾 Save Changes
                                    </button>

                                    <button
                                        className="cancel-btn"
                                        style={styles.cancelButton}
                                        onClick={handleCancelEdit}
                                    >
                                        ✕ Cancel
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* ================= ARTIFACTS ================= */}
                    <div style={styles.sectionBlock}>
                        <div style={styles.sectionHeaderRow}>
                            <div>
                                <h3 style={styles.sectionTitle}>Artifacts Linked to This Task</h3>
                                <p style={styles.sectionDescription}>
                                    These artifacts will be shown to participants.
                                </p>
                            </div>

                            <button
                                className="manage-btn"
                                style={{
                                    ...styles.manageArtifactsButton,
                                    opacity: isDraft ? 1 : 0.4,
                                    cursor: isDraft ? "pointer" : "not-allowed",
                                }}
                                onClick={() => {
                                    if (!isDraft)
                                        return showToast("This study is not in draft mode.", "error");
                                    navigate(`/manage-artifacts/${task.id}`);
                                }}
                            >
                                ⚙️ Manage Artifacts
                            </button>
                        </div>

                        <div style={styles.artifactList}>
                            {task.artifacts?.length ? (
                                task.artifacts.map((a) => (
                                    <div key={a.id} style={styles.artifactCard}>
                                        <div style={styles.artifactHeader}>
                                            {/* 🔹 ARTEFACT NAME */}
                                            <p style={styles.artifactName}>{a.filename}</p>

                                            {/* 🔹 BADGES */}
                                            <div style={styles.artifactBadges}>
                                                {/* CATEGORY BADGE */}
                                                <span style={styles.typeBadge}>
                                                    {a.category ? a.category : "No Category"}
                                                </span>

                                                {/* TAG BADGE */}
                                                <span style={styles.tagBadge}>
                                                    {a.tags ? a.tags : "No Tag"}
                                                </span>
                                            </div>

                                            {/* 🔥 GÖZ BUTONU */}
                                            <div
                                                className="eye-hover"
                                                onClick={() => handlePreview(a)}
                                                style={styles.eyeButton}
                                            >
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#60a5fa"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={styles.noCriteria}>No artifacts linked to this task.</p>
                            )}
                        </div>
                    </div>

                    {/* ================= CORRECT ANSWERS (UNIFIED) ================= */}
                    <div style={styles.sectionBlock}>
                        <div style={styles.sectionHeaderRow}>
                            <div>
                                <h3 style={styles.sectionTitle}>Correct Answers</h3>
                                <p style={styles.sectionDescription}>
                                    Reference correct answers for each criterion in this task.
                                </p>
                            </div>

                            <button
                                className="manage-btn"
                                style={{
                                    ...styles.manageArtifactsButton,
                                    opacity: isDraft ? 1 : 0.4,
                                    cursor: isDraft ? "pointer" : "not-allowed",
                                }}
                                onClick={() => {
                                    if (!isDraft)
                                        return showToast("This study is not in draft mode.", "error");
                                    navigate(`/manage-correct-answer/${task.id}`);
                                }}
                            >
                                🧠 Manage Correct Answer
                            </button>
                        </div>

                        {!task.correctAnswers || task.correctAnswers.length === 0 ? (
                            <p style={styles.noCriteria}>
                                No correct answer is defined for this task.
                            </p>
                        ) : (
                            <div style={styles.correctAnswerGrid}>
                                {task.correctAnswers.map((entry, idx) => {
                                    const criterion =
                                        (task.evaluationCriteria || []).find(
                                            (c) => c.id === entry.criterionId
                                        ) || null;

                                    return (
                                        <div key={idx} style={styles.correctAnswerCard}>
                                            <div style={styles.correctAnswerHeader}>
                            <span style={styles.correctCriterionName}>
                                {criterion?.question
                                    ? criterion.question
                                    : `Criterion #${entry.criterionId}`}
                            </span>
                                                <span style={styles.correctCriterionId}>
                                #{entry.criterionId}
                            </span>
                                            </div>

                                            <div style={styles.correctCriterionMeta}>
                                                <span style={styles.metaBadgeSmall}>Type: {criterion?.type}</span>

                                                {criterion?.type === "MULTIPLE_CHOICE" && (
                                                    <span style={styles.metaBadgeSmall}>
                                    Options: {criterion.options?.join(", ")}
                                </span>
                                                )}

                                                {criterion?.type === "RATING" && (
                                                    <span style={styles.metaBadgeSmall}>
                                    Range: {criterion.minValue} – {criterion.maxValue}
                                </span>
                                                )}

                                                {criterion?.type === "NUMERIC" && (
                                                    <span style={styles.metaBadgeSmall}>
                                    Range: {criterion.min} – {criterion.max}
                                </span>
                                                )}

                                                {criterion?.type === "CODE_EDIT" && (
                                                    <span style={styles.metaBadgeSmall}>
                                    Language: {criterion.language}
                                </span>
                                                )}

                                                {criterion?.type === "IMAGE_HIGHLIGHT" && (
                                                    <span style={styles.metaBadgeSmall}>
                                    Regions: {criterion.regions?.length}
                                </span>
                                                )}
                                            </div>

                                            <div style={styles.correctAnswerValueBox}>
                                                {entry.answerValue ? (
                                                    entry.answerValue
                                                ) : (
                                                    <span style={{ opacity: 0.7 }}>No value</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ================= CRITERIA (CLEAN VERSION) ================= */}
                    <div style={styles.sectionBlock}>
                        <h3 style={styles.sectionTitle}>Criteria Used</h3>

                        {task.evaluationCriteria?.length ? (
                            <div style={styles.criteriaCardContainer}>
                                {task.evaluationCriteria.map((c, i) => (
                                    <div key={i} style={styles.criteriaCard}>

                                        {/* TITLE */}
                                        <h4 style={styles.criteriaTitle}>
                                            {c.question || `Criterion #${c.id}`}
                                        </h4>

                                        {/* DESCRIPTION */}
                                        {c.description && (
                                            <p style={styles.criteriaDescription}>{c.description}</p>
                                        )}

                                        {/* ID */}
                                        <p style={styles.criteriaIdLine}>ID: {c.id}</p>

                                        {/* META FIELDS — only if exists in backend */}
                                        <div style={styles.criteriaMeta}>
                                            {/* TYPE (always exists) */}
                                            <span style={styles.metaBadge}>Type: {c.type}</span>

                                            {/* MULTIPLE CHOICE OPTIONS */}
                                            {c.type === "MULTIPLE_CHOICE" && (
                                                <>
                                                    {c.options && (
                                                        <span style={styles.metaBadge}>
                Options: {c.options.join(", ")}
            </span>
                                                    )}

                                                    {typeof c.multipleSelection !== "undefined" && (
                                                        <span style={styles.metaBadge}>
        {c.multipleSelection ? "Multiple Selection Allowed" : "Single Selection Only"}
    </span>
                                                    )}

                                                </>
                                            )}


                                            {/* RATING (minValue / maxValue) */}
                                            {c.type === "RATING" &&
                                                typeof c.minValue !== "undefined" &&
                                                typeof c.maxValue !== "undefined" && (
                                                    <span style={styles.metaBadge}>
                                    Range: {c.minValue} – {c.maxValue}
                                </span>
                                                )}

                                            {/* NUMERIC (min / max) */}
                                            {c.type === "NUMERIC" &&
                                                typeof c.min !== "undefined" &&
                                                typeof c.max !== "undefined" && (
                                                    <span style={styles.metaBadge}>
                                    Range: {c.min} – {c.max}
                                </span>
                                                )}

                                            {/* CODE EDIT */}
                                            {c.type === "CODE_EDIT" && c.language && (
                                                <span style={styles.metaBadge}>
                                Language: {c.language}
                            </span>
                                            )}

                                            {/* IMAGE HIGHLIGHT */}
                                            {c.type === "IMAGE_HIGHLIGHT" &&
                                                c.regions && Array.isArray(c.regions) && (
                                                    <span style={styles.metaBadge}>
                                    Regions: {c.regions.length}
                                </span>
                                                )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={styles.noCriteria}>
                                This study has no criteria for this task.
                            </p>
                        )}
                    </div>

                    {/* ================= PARTICIPANTS ================= */}
                    <div style={styles.sectionBlock}>
                        <h3 style={styles.sectionTitle}>Participants</h3>

                        <div style={styles.progressContainer}>
                            <div style={styles.progressLabel}>
                                {completed.length} / {all.length} completed ({percent}%)
                            </div>

                            <div style={styles.progressBarBackground}>
                                <div
                                    style={{
                                        ...styles.progressBarFill,
                                        width: `${percent}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div style={styles.participantWrapper}>
                            <div style={styles.participantColumn}>
                                <h4 style={styles.participantColumnTitle}>✔ Completed</h4>

                                <div style={styles.participantBox}>
                                    {completed.length ? (
                                        completed.map((p) => renderUserCard(p, true))
                                    ) : (
                                        <p style={styles.noCriteria}>
                                            No completed participants.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div style={styles.participantColumn}>
                                <h4 style={styles.participantColumnTitle}>⏳ Pending</h4>

                                <div style={styles.participantBox}>
                                    {pending.length ? (
                                        pending.map((p) => renderUserCard(p, false))
                                    ) : (
                                        <p style={styles.noCriteria}>
                                            No pending participants.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ================= DELETE TASK (UI ONLY — NO API) ================= */}
                    <div style={styles.sectionBlock}>
                        <h3 style={styles.deleteTitle}>Danger Zone</h3>
                        <p style={styles.deleteDescription}>
                            Deleting a task will permanently remove it from this study.
                            This action cannot be undone.
                        </p>

                        <button
                            className="delete-btn"
                            data-active={task.studyStatus === "DRAFT"}
                            style={{
                                ...styles.deleteButton,
                                ...(task.studyStatus !== "DRAFT" ? styles.deleteDisabled : {}),
                            }}
                            onClick={() => {
                                if (task.studyStatus !== "DRAFT") {
                                    return showToast(
                                        "❗ You can delete a task only when the study is in DRAFT mode.",
                                        "error"
                                    );
                                }
                                setShowDeleteConfirm(true);
                            }}
                        >
                            🗑️ Delete This Task
                        </button>
                    </div>
                </div>
            </div>

            {/* =================== PREVIEW MODAL =================== */}
            {previewArtifact && (
                <div
                    style={styles.modalOverlay}
                    onClick={() => setPreviewArtifact(null)}
                >
                    <div
                        style={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={styles.previewTitle}>{previewArtifact.filename}</h2>

                        {previewLoading ? (
                            <p style={{ color: "#93c5fd" }}>Loading preview...</p>
                        ) : (
                            <>
                                {/* PDF */}
                                {previewURL && previewArtifact.filename.endsWith(".pdf") && (
                                    <embed
                                        src={previewURL}
                                        type="application/pdf"
                                        style={styles.previewPDF}
                                    />
                                )}

                                {/* Image */}
                                {previewURL &&
                                    previewArtifact.filename.match(/\.(png|jpg|jpeg)$/i) && (
                                        <img
                                            src={previewURL}
                                            alt="preview"
                                            style={styles.previewImage}
                                        />
                                    )}

                                {/* Code / Text */}
                                {previewText && (
                                    <pre style={styles.previewPre}>
                                        <code className={`language-${previewLanguage}`}>
                                            {previewText}
                                        </code>
                                    </pre>
                                )}
                            </>
                        )}

                        <button
                            className="close-btn"
                            onClick={() => setPreviewArtifact(null)}
                            style={styles.closeButton}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div
                    style={{
                        ...styles.modalOverlay,
                        background: "rgba(0,0,0,0.75)",
                    }}
                    onClick={() => !deleteLoading && setShowDeleteConfirm(false)}
                >
                    <div
                        style={styles.deleteModal}
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div style={styles.deleteModalHeader}>
                            <div style={styles.deleteIcon}>⚠️</div>
                            <h2 style={styles.deleteModalTitle}>Delete Task</h2>
                        </div>

                        <p style={{ marginTop: 10, opacity: 0.85 }}>
                            This action will permanently delete this task and all related data
                            (comments, responses, reports).
                        </p>

                        <div style={styles.deleteModalActions}>
                            <button
                                className="danger-cancel-btn"
                                style={styles.dangerCancelButton}
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>

                            <button
                                className="danger-delete-btn"
                                data-active="true"
                                style={styles.dangerDeleteButton}
                                onClick={handleDeleteTask}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? "Deleting..." : "Yes, Delete Task"}
                            </button>
                        </div>

                    </div>
                </div>
            )}


            {/* KEYFRAMES */}
            <style>
                {`
                    @keyframes floatParticle {
                        0% { transform: translateY(0); opacity: .4; }
                        50% { opacity: 1; }
                        100% { transform: translateY(-120vh); opacity: 0; }
                    }

                    @keyframes toastFade {
                        0% { opacity: 0; transform: translateX(-50%) translateY(-6px); }
                        100% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    }
                `}
            </style>
        </div>
    );
}

/* ============================================================
   STYLES (AddTaskPage tarzı güncellendi)
============================================================ */
const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        paddingBottom: "60px",
        position: "relative",
        overflow: "hidden",
    },

    /* PARTICLES */
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
        opacity: 0.45,
    },

    toast: {
        position: "fixed",
        top: "20px",
        left: "50%",
        background: "rgba(30,30,30,0.92)",
        padding: "14px 28px",
        borderRadius: "10px",
        color: "white",
        fontSize: "1rem",
        fontWeight: "600",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
        animation: "toastFade 0.35s ease-out",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        transform: "translateX(-50%)",
    },
    toastSuccess: {
        background: "rgba(34,197,94,0.22)",
        border: "1px solid rgba(34,197,94,0.55)",
        boxShadow: "0 0 14px rgba(34,197,94,0.45)",
        color: "#bbf7d0",
    },
    toastError: {
        background: "rgba(239,68,68,0.22)",
        border: "1px solid rgba(239,68,68,0.55)",
        boxShadow: "0 0 14px rgba(239,68,68,0.45)",
        color: "#fecaca",
    },
    toastInfo: {
        background: "rgba(59,130,246,0.22)",
        border: "1px solid rgba(59,130,246,0.55)",
        boxShadow: "0 0 14px rgba(59,130,246,0.45)",
        color: "#bfdbfe",
    },

    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(6px)",
        position: "relative",
        zIndex: 5,
    },

    navTitle: {
        fontSize: "1.6rem",
        fontWeight: "700",
        color: "#93c5fd",
    },

    backButton: {
        background: "rgba(239,68,68,0.1)",
        border: "2px solid rgba(239,68,68,0.5)",
        borderRadius: "10px",
        padding: "8px 18px",
        color: "#f87171",
        cursor: "pointer",
        fontWeight: "600",
        transition: "0.35s",
    },

    content: {
        padding: "40px 60px",
        maxWidth: "1200px",
        margin: "0 auto",
        position: "relative",
        zIndex: 5,
    },

    mainCard: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "15px",
        padding: "25px",
        border: "1px solid rgba(255,255,255,0.15)",
    },

    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px",
        marginBottom: "18px",
    },

    label: {
        display: "block",
        fontSize: "1rem",
        color: "#93c5fd",
        marginBottom: "8px",
        fontWeight: "600",
    },

    taskTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
    },

    titleInput: {
        width: "100%",
        padding: "14px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.08)",
        color: "#fff",
        fontSize: "1.4rem",
        fontFamily: "Inter, sans-serif",
        fontWeight: 700,
    },

    errorText: {
        color: "#f87171",
        fontSize: "0.85rem",
        marginTop: "4px",
    },

    badgeColumn: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
        minWidth: "220px",
    },

    badgeRow: {
        display: "flex",
        gap: 12,
        alignItems: "stretch",
    },

    badgeGroup: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        alignItems: "center",
        textAlign: "center",
    },

    badgeLabel: {
        fontSize: "0.7rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "rgba(148,163,184,0.9)",
        textAlign: "center",
        width: "100%",
    },

    typePill: {
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: "0.8rem",
        background: "rgba(15,23,42,0.9)",
        border: "1px solid rgba(148,163,184,0.8)",
        color: "#e5e7eb",
        maxWidth: "170px",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
    },

    deleteModal: {
        width: "420px",
        background: "rgba(17,24,39,0.96)",
        padding: "28px",
        borderRadius: "16px",
        border: "2px solid rgba(239,68,68,0.6)",
        boxShadow: "0 0 30px rgba(239,68,68,0.55)",
        textAlign: "center",
    },

    deleteModalHeader: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },

    deleteIcon: {
        fontSize: "2.4rem",
    },

    deleteModalTitle: {
        color: "#f87171",
        fontSize: "1.4rem",
        fontWeight: 800,
    },

    deleteModalText: {
        fontSize: "0.95rem",
        opacity: 0.9,
        lineHeight: 1.5,
    },

    deleteModalActions: {
        display: "flex",
        gap: 14,
        marginTop: 26,
    },

    dangerCancelButton: {
        flex: 1,
        background: "rgba(239,68,68,0.12)",
        border: "2px solid rgba(239,68,68,0.35)",
        color: "#fecaca",
        borderRadius: "10px",
        padding: "10px",
        fontWeight: 700,
        cursor: "pointer",
    },

    dangerDeleteButton: {
        flex: 1,
        background: "linear-gradient(135deg, #dc2626, #ef4444)",
        border: "2px solid rgba(239,68,68,0.85)",
        color: "#fff",
        borderRadius: "10px",
        padding: "10px",
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: "0 0 16px rgba(239,68,68,0.6)",
    },

    statusBadge: {
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: "0.85rem",
        border: "1px solid rgba(255,255,255,0.15)",
        minWidth: "110px",
        textAlign: "center",
    },

    sectionBlock: {
        marginTop: "18px",
        marginBottom: "18px",
        paddingTop: "14px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
    },

    descriptionText: {
        fontSize: "0.95rem",
        lineHeight: 1.55,
    },

    descriptionTextarea: {
        width: "100%",
        minHeight: "100px",
        padding: "14px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.08)",
        color: "#fff",
        fontSize: "1.05rem",
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
        lineHeight: "1.5",
    },

    infoRow: {
        display: "flex",
        gap: "20px",
        marginTop: "6px",
        marginBottom: "16px",
    },

    infoItem: {
        display: "flex",
        alignItems: "center",
        gap: 8,
    },

    infoLabel: {
        color: "rgba(255,255,255,0.7)",
    },

    infoValue: {
        fontWeight: 600,
    },

    editMainButton: {
        background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
        borderRadius: "10px",
        padding: "10px 20px",
        fontWeight: "700",
        width: "100%",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        transition: "transform 0.35s ease",
    },

    editActions: {
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
        marginBottom: "14px",
    },

    saveButton: {
        flex: 1,
        minWidth: "160px",
        background: "linear-gradient(135deg, #22c55e, #4ade80)",
        borderRadius: "10px",
        padding: "10px 20px",
        fontWeight: "700",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        transition: "transform 0.25s ease",
    },

    cancelButton: {
        flex: 1,
        minWidth: "160px",
        background: "rgba(239,68,68,0.2)",
        borderRadius: "10px",
        padding: "10px 20px",
        fontWeight: "700",
        color: "#f87171",
        border: "2px solid rgba(239,68,68,0.5)",
        cursor: "pointer",
        transition: "transform 0.25s ease",
    },

    sectionHeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "12px",
    },

    sectionTitle: {
        fontSize: "1.2rem",
        fontWeight: "700",
        color: "#93c5fd",
    },

    sectionDescription: {
        fontSize: "0.9rem",
        color: "rgba(255,255,255,0.6)",
    },

    manageArtifactsButton: {
        background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "8px 18px",
        fontWeight: "700",
        cursor: "pointer",
        fontSize: "0.9rem",
        boxShadow: "0 0 6px rgba(96,165,250,0.35)",
        transition: "0.35s",
    },

    artifactList: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14,
    },

    artifactCard: {
        padding: "14px",
        background: "rgba(59,130,246,0.06)",
        border: "1px solid rgba(147,197,253,0.35)",
        borderRadius: "12px",
    },

    artifactHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        paddingRight: "8px",
    },

    artifactName: {
        fontWeight: 600,
        fontSize: "0.85rem",
        color: "#e2e8f0",
        flex: 1,
        wordBreak: "break-word",
    },

    artifactBadges: {
        display: "flex",
        gap: 8,
        flexShrink: 0,
    },

    typeBadge: {
        background: "rgba(56,189,248,0.25)",
        border: "1px solid rgba(56,189,248,0.5)",
        padding: "4px 10px",
        borderRadius: "10px",
        fontSize: "0.78rem",
        color: "#bae6fd",
        fontWeight: 600,
        flexShrink: 0,
    },

    tagBadge: {
        background: "rgba(251,146,60,0.22)",
        border: "1px solid rgba(251,146,60,0.55)",
        padding: "4px 10px",
        borderRadius: "10px",
        fontSize: "0.76rem",
        color: "#fdba74",
        fontWeight: 600,
        flexShrink: 0,
    },

    extensionBadge: {
        background: "rgba(192,132,252,0.22)",
        border: "1px solid rgba(192,132,252,0.55)",
        padding: "4px 10px",
        borderRadius: "10px",
        fontSize: "0.76rem",
        color: "#e9d5ff",
        fontWeight: 600,
        flexShrink: 0,
    },

    answerGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "10px",
        marginTop: "10px",
    },

    correctAnswerGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "12px",
        marginTop: "10px",
    },

    correctAnswerCard: {
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid rgba(96,165,250,0.35)",
        background: "rgba(15,23,42,0.85)",
        boxShadow: "0 0 10px rgba(15,23,42,0.5)",
    },

    correctAnswerHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
        gap: 8,
    },

    correctCriterionName: {
        fontWeight: 600,
        fontSize: "0.9rem",
        color: "#bfdbfe",
    },

    correctCriterionId: {
        fontSize: "0.75rem",
        color: "rgba(148,163,184,0.9)",
    },

    correctCriterionMeta: {
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 6,
    },

    metaBadgeSmall: {
        background: "rgba(148,163,184,0.18)",
        border: "1px solid rgba(148,163,184,0.5)",
        padding: "2px 6px",
        borderRadius: "999px",
        fontSize: "0.7rem",
        color: "#e5e7eb",
    },

    correctAnswerValueBox: {
        marginTop: 4,
        padding: "8px 10px",
        borderRadius: 10,
        background: "rgba(37,99,235,0.18)",
        border: "1px solid rgba(59,130,246,0.5)",
        fontSize: "0.9rem",
        color: "#e5e7eb",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
    },

    eyeButton: {
        marginLeft: "10px",
        padding: "6px",
        borderRadius: "8px",
        cursor: "pointer",
        background: "rgba(96,165,250,0.12)",
        border: "1px solid rgba(96,165,250,0.4)",
        transition: "0.25s ease",
    },

    criteriaCardContainer: {
        display: "flex",
        flexDirection: "column",
        gap: 16,
    },

    criteriaCard: {
        background: "rgba(167,139,250,0.12)",
        border: "1px solid rgba(167,139,250,0.35)",
        padding: "18px 20px",
        borderRadius: "12px",
    },

    criteriaTitle: {
        margin: 0,
        marginBottom: 6,
        color: "#c4b5fd",
        fontWeight: 700,
    },

    criteriaDescription: {
        marginBottom: 8,
        opacity: 0.9,
    },

    criteriaIdLine: {
        fontSize: "0.8rem",
        color: "rgba(226,232,240,0.85)",
        marginBottom: 8,
    },

    criteriaMeta: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
    },

    metaBadge: {
        background: "rgba(167,139,250,0.25)",
        border: "1px solid rgba(167,139,250,0.4)",
        padding: "4px 8px",
        borderRadius: "10px",
        fontSize: "0.8rem",
        color: "#e9d5ff",
    },

    noCriteria: {
        opacity: 0.7,
        fontStyle: "italic",
    },

    participantWrapper: {
        display: "flex",
        gap: 16,
    },

    participantColumn: {
        flex: 1,
    },

    participantColumnTitle: {
        marginBottom: 6,
        fontWeight: 600,
        color: "#dbeafe",
    },

    participantBox: {
        padding: 12,
        borderRadius: "12px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
    },

    userCard: {
        display: "flex",
        alignItems: "center",
        padding: "10px 12px",
        marginBottom: 8,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
    },

    userAvatar: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "rgba(59,130,246,0.3)",
        border: "1px solid rgba(59,130,246,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    userInfo: {
        display: "flex",
        flexDirection: "column",
    },

    userName: {
        fontWeight: 600,
    },

    userTag: {
        fontSize: "0.8rem",
    },

    userIcon: {
        marginLeft: "auto",
    },

    progressContainer: {
        marginBottom: 12,
    },

    progressLabel: {
        marginBottom: 4,
    },

    progressBarBackground: {
        width: "100%",
        height: "10px",
        background: "rgba(147,197,253,0.15)",
        borderRadius: "8px",
        overflow: "hidden",
    },

    progressBarFill: {
        height: "100%",
        background: "linear-gradient(90deg, #60a5fa, #93c5fd)",
        transition: "width 0.35s ease",
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

    deleteButton: {
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

    deleteDisabled: {
        opacity: 0.4,
        cursor: "not-allowed",
        background: "rgba(239,68,68,0.15)",
        border: "2px solid rgba(239,68,68,0.3)",
        color: "rgba(248,113,113,0.5)",
    },

    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
    },

    modalContent: {
        width: "80%",
        maxWidth: "900px",
        background: "rgba(17,24,39,0.95)",
        padding: "25px",
        borderRadius: "12px",
        border: "2px solid rgba(96,165,250,0.4)",
        boxShadow: "0 0 20px rgba(96,165,250,0.6)",
        textAlign: "center",
    },

    previewTitle: {
        color: "#60a5fa",
        marginBottom: "20px",
    },

    previewPDF: {
        width: "100%",
        height: "70vh",
        borderRadius: "12px",
        background: "white",
    },

    previewImage: {
        maxWidth: "100%",
        maxHeight: "70vh",
        borderRadius: "12px",
    },

    previewPre: {
        background: "#0f172a",
        color: "#e2e8f0",
        padding: "20px",
        borderRadius: "12px",
        maxHeight: "70vh",
        overflowY: "auto",
        textAlign: "left",
    },

    closeButton: {
        marginTop: "20px",
        background: "rgba(239,68,68,0.3)",
        border: "2px solid rgba(239,68,68,0.5)",
        color: "#fca5a5",
        padding: "10px 25px",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "0.25s ease",
    },
};

/* ============================================================
   HOVER EFFECTS (AddTaskPage tarzı)
============================================================ */
const addHoverEffects = () => {
    try {
        const sheet = document.styleSheets[0];

        // Global button hover
        sheet.insertRule(
            `
        button:hover {
            transform: scale(1.035);
        }
    `,
            sheet.cssRules.length
        );

        // Danger delete hover (EN ÖNEMLİ)
        sheet.insertRule(
            `
.danger-delete-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 0 28px rgba(239,68,68,0.95);
}
`,
            sheet.cssRules.length
        );

// Danger cancel hover
        sheet.insertRule(
            `
.danger-cancel-btn:hover {
    transform: scale(1.04);
    background: rgba(239,68,68,0.22) !important;
    box-shadow: 0 0 18px rgba(239,68,68,0.55);
}
`,
            sheet.cssRules.length
        );


        // Eye hover
        sheet.insertRule(
            `
        .eye-hover:hover {
            transform: scale(1.2) rotate(4deg);
            box-shadow: 0 0 12px rgba(96,165,250,0.7);
            background: rgba(96,165,250,0.25) !important;
        }
    `,
            sheet.cssRules.length
        );

        // Back button hover (kırmızı)
        sheet.insertRule(
            `
        .back-btn:hover {
            transform: scale(1.06);
            border-color: rgba(239,68,68,0.85) !important;
            box-shadow: 0 0 18px rgba(239,68,68,0.55);
            background: rgba(239,68,68,0.20) !important;
        }
    `,
            sheet.cssRules.length
        );

        // Close Button Hover (kırmızı)
        sheet.insertRule(
            `
        .close-btn:hover {
            transform: scale(1.06);
            background: rgba(239,68,68,0.25) !important;
            border-color: rgba(239,68,68,0.85) !important;
            box-shadow: 0 0 18px rgba(239,68,68,0.55);
        }
    `,
            sheet.cssRules.length
        );

        // Edit button hover (mavi)
        sheet.insertRule(
            `
        .edit-btn:hover {
            transform: scale(1.02);
            box-shadow: 0 0 16px rgba(96,165,250,0.6);
        }
    `,
            sheet.cssRules.length
        );

        // Save button hover (yeşil)
        sheet.insertRule(
            `
        .save-btn:hover {
            transform: scale(1.015);
            box-shadow: 0 0 16px rgba(34,197,94,0.6);
        }
    `,
            sheet.cssRules.length
        );

        // Cancel button hover (kırmızı)
        sheet.insertRule(
            `
        .cancel-btn:hover {
            transform: scale(1.015);
            border-color: rgba(239,68,68,0.85) !important;
            box-shadow: 0 0 16px rgba(239,68,68,0.55);
            background: rgba(239,68,68,0.25) !important;
        }
    `,
            sheet.cssRules.length
        );

        // Delete aktif hover
        sheet.insertRule(
            `
        .delete-btn[data-active="true"]:hover {
            transform: scale(1.03);
            background: rgba(239,68,68,0.35) !important;
            border-color: rgba(239,68,68,0.85) !important;
            box-shadow: 0 0 18px rgba(239,68,68,0.55);
        }
    `,
            sheet.cssRules.length
        );

        // Manage button hover (mavi)
        sheet.insertRule(
            `
        .manage-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 0 16px rgba(96,165,250,0.6);
        }
    `,
            sheet.cssRules.length
        );
    } catch (err) {
        console.error("hover rule error", err);
    }
};
addHoverEffects();

export default ManageSingleTaskPage;