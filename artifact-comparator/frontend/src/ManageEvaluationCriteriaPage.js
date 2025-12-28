// ManageEvaluationCriteriaPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function ManageEvaluationCriteriaPage() {
    const { studyId } = useParams();
    const navigate = useNavigate();

    const [criteria, setCriteria] = useState([]);
    const [study, setStudy] = useState(null);
    const [loading, setLoading] = useState(false);

    /* -------- PARTICLES (MyStudies ile aynı) -------- */
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

    /* -------- TOAST (MyStudies stilinde, ama çoklu) -------- */
    const [toasts, setToasts] = useState([]);
    const showToast = (message, type = "info") => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3200);
    };

    /* -------- MODAL STATE -------- */
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 🎯 Yeni criterion state (abstract + type-specific)
    const [newCriterion, setNewCriterion] = useState({
        question: "",
        description: "",
        priorityOrder: 1,
        type: "", // MULTIPLE_CHOICE, RATING, OPEN_ENDED, NUMERIC, CODE_EDIT, IMAGE_HIGHLIGHT

        // MULTIPLE CHOICE
        numberOfOptions: 2,
        options: ["", ""],
        multipleSelection: false,

        // RATING
        startValue: "",
        endValue: "",

        // OPEN ENDED
        minLength: "",
        maxLength: "",

        // NUMERIC
        integerOnly: true,
        minValue: "",
        maxValue: "",

        // IMAGE HIGHLIGHT
        numberOfAnnotations: 1,
    });

    /* -------- STUDY + CRITERIA FETCH -------- */
    useEffect(() => {
        const loadAll = async () => {
            try {
                setLoading(true);

                // Study
                const sRes = await fetch(`http://localhost:8080/api/studies/${studyId}`);
                if (!sRes.ok) throw new Error("Failed to fetch study");
                const studyData = await sRes.json();
                setStudy(studyData);

                // Criteria
                const cRes = await fetch(`http://localhost:8080/api/criteria/study/${studyId}`);
                if (!cRes.ok) throw new Error("Failed to fetch criteria");
                const criteriaData = await cRes.json();
                setCriteria(criteriaData);
            } catch (err) {
                console.error("Error fetching data:", err);
                showToast("Failed to load study or criteria", "error");
            } finally {
                setLoading(false);
            }
        };

        loadAll();
    }, [studyId]);

    /* -------- MODAL OPEN / CLOSE -------- */
    const openModal = () => {
        setNewCriterion({
            question: "",
            description: "",
            priorityOrder: (criteria?.length || 0) + 1,
            type: "",

            numberOfOptions: 2,
            options: ["", ""],
            multipleSelection: false,

            startValue: "",
            endValue: "",

            minLength: "",
            maxLength: "",

            integerOnly: true,
            minValue: "",
            maxValue: "",

            numberOfAnnotations: 1,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    /* -------- UI HELPERS -------- */
    const getTypeLabel = (type) => {
        switch (type) {
            case "MULTIPLE_CHOICE":
                return "Multiple Choice";
            case "RATING":
                return "Rating";
            case "OPEN_ENDED":
                return "Open-Ended";
            case "NUMERIC":
                return "Numeric";
            case "CODE_EDIT":
                return "Code Edit";
            case "IMAGE_HIGHLIGHT":
                return "Image Highlight";
            default:
                return type || "Unknown";
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case "MULTIPLE_CHOICE":
                return "✅";
            case "RATING":
                return "⭐";
            case "OPEN_ENDED":
                return "✏️";
            case "NUMERIC":
                return "🔢";
            case "CODE_EDIT":
                return "💻";
            case "IMAGE_HIGHLIGHT":
                return "🖼️";
            default:
                return "📋";
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case "MULTIPLE_CHOICE":
                return {
                    bg: "rgba(59,130,246,0.15)",
                    color: "#60a5fa",
                    border: "rgba(59,130,246,0.5)",
                };
            case "RATING":
                return {
                    bg: "rgba(250,204,21,0.15)",
                    color: "#fde047",
                    border: "rgba(250,204,21,0.5)",
                };
            case "OPEN_ENDED":
                return {
                    bg: "rgba(56,189,248,0.15)",
                    color: "#38bdf8",
                    border: "rgba(56,189,248,0.5)",
                };
            case "NUMERIC":
                return {
                    bg: "rgba(34,197,94,0.15)",
                    color: "#4ade80",
                    border: "rgba(34,197,94,0.5)",
                };
            case "CODE_EDIT":
                return {
                    bg: "rgba(168,85,247,0.15)",
                    color: "#c084fc",
                    border: "rgba(168,85,247,0.5)",
                };
            case "IMAGE_HIGHLIGHT":
                return {
                    bg: "rgba(248,113,113,0.15)",
                    color: "#fca5a5",
                    border: "rgba(248,113,113,0.5)",
                };
            default:
                return {
                    bg: "rgba(148,163,184,0.2)",
                    color: "#e5e7eb",
                    border: "rgba(148,163,184,0.5)",
                };
        }
    };

    /* -------- MULTIPLE CHOICE HANDLERS -------- */
    const handleNumberOfOptionsChange = (value) => {
        let n = parseInt(value, 10);
        if (isNaN(n) || n < 1) n = 1;
        if (n > 10) n = 10;

        const newOptions = [...newCriterion.options];
        if (n > newOptions.length) {
            while (newOptions.length < n) newOptions.push("");
        } else {
            newOptions.length = n;
        }

        setNewCriterion((prev) => ({
            ...prev,
            numberOfOptions: n,
            options: newOptions,
        }));
    };

    const updateOptionValue = (index, value) => {
        const newOptions = [...newCriterion.options];
        newOptions[index] = value;
        setNewCriterion((prev) => ({
            ...prev,
            options: newOptions,
        }));
    };

    /* -------- VALIDATE + BUILD PAYLOAD -------- */
    const validateAndBuildPayload = () => {
        const {
            question,
            description,
            priorityOrder,
            type,
            numberOfOptions,
            options,
            multipleSelection,
            startValue,
            endValue,
            minLength,
            maxLength,
            integerOnly,
            minValue,
            maxValue,
            numberOfAnnotations,
        } = newCriterion;

        if (!question.trim()) {
            showToast("Question is required.", "error");
            return null;
        }

        if (!type) {
            showToast("Please select a criterion type.", "error");
            return null;
        }

        const priority = parseInt(priorityOrder, 10);
        if (isNaN(priority) || priority < 1) {
            showToast("Priority order must be a positive number.", "error");
            return null;
        }

        const payload = {
            type,
            question: question.trim(),
            description: description?.trim() || null,
            priorityOrder: priority,

            numberOfOptions: null,
            options: null,
            multipleSelection: null,

            startValue: null,
            endValue: null,

            minLength: null,
            maxLength: null,

            integerOnly: null,
            minValue: null,
            maxValue: null,

            numberOfAnnotations: null,
        };

        switch (type) {
            case "MULTIPLE_CHOICE": {
                const num = parseInt(numberOfOptions, 10);
                if (isNaN(num) || num < 1) {
                    showToast("Number of options must be at least 1.", "error");
                    return null;
                }

                const cleanedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
                if (cleanedOptions.length !== num) {
                    showToast("Please fill all option fields.", "error");
                    return null;
                }

                payload.numberOfOptions = num;
                payload.options = cleanedOptions;
                payload.multipleSelection = !!multipleSelection;
                break;
            }

            case "RATING": {
                const s = parseInt(startValue, 10);
                const e = parseInt(endValue, 10);

                if (isNaN(s) || isNaN(e) || e <= s) {
                    showToast("Rating values must be valid and end > start", "error");
                    return null;
                }

                payload.startValue = s;
                payload.endValue = e;
                break;
            }

            case "OPEN_ENDED": {
                const minL = minLength ? parseInt(minLength, 10) : null;
                const maxL = maxLength ? parseInt(maxLength, 10) : null;
                if (maxL != null && minL != null && maxL < minL) {
                    showToast("Max length cannot be < min length.", "error");
                    return null;
                }
                payload.minLength = minL;
                payload.maxLength = maxL;
                break;
            }

            case "NUMERIC": {
                const minV = minValue ? parseFloat(minValue) : null;
                const maxV = maxValue ? parseFloat(maxValue) : null;

                if (maxV != null && minV != null && maxV < minV) {
                    showToast("Max numeric value cannot be < min value.", "error");
                    return null;
                }

                payload.integerOnly = !!integerOnly;
                payload.minValue = minV;
                payload.maxValue = maxV;
                break;
            }

            case "IMAGE_HIGHLIGHT": {
                const n = parseInt(numberOfAnnotations, 10);
                if (isNaN(n) || n < 1) {
                    showToast("Number of annotations must be >= 1", "error");
                    return null;
                }
                payload.numberOfAnnotations = n;
                break;
            }

            case "CODE_EDIT":
                // ekstra ayar yok
                break;

            default:
                showToast("Unknown type.", "error");
                return null;
        }

        return payload;
    };

    /* -------- CREATE CRITERION -------- */
    const handleCreateCriterion = async () => {
        const payload = validateAndBuildPayload();
        if (!payload) return;

        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8080/api/criteria/create/${studyId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to create criterion");

            const created = await res.json();
            setCriteria((prev) => [...prev, created]);
            showToast("Criterion created successfully!", "success");
            closeModal();
        } catch (err) {
            console.error(err);
            showToast("Create failed", "error");
        } finally {
            setLoading(false);
        }
    };

    /* -------- DELETE CRITERION -------- */
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this criterion?")) return;

        try {
            const res = await fetch(`http://localhost:8080/api/criteria/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Delete failed");

            setCriteria((prev) => prev.filter((c) => c.id !== id));
            showToast("Criterion deleted", "success");
        } catch (err) {
            console.error(err);
            showToast("Delete failed", "error");
        }
    };

    /* -------- STUDY TYPE LABEL -------- */
    const niceStudyType =
        study?.studyType
            ?.replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase()) || "";

    /* ==================== RENDER ==================== */

    return (
        <div style={styles.container}>
            {/* PARTICLES */}
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

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <h2 style={styles.navTitle}>Evaluation Criteria</h2>
                    {study && (
                        <span style={styles.navSubtitle}>
                            Study: <strong>{study.title}</strong>{" "}
                            <span style={styles.studyTypeBadge}>{niceStudyType}</span>
                        </span>
                    )}
                </div>

                <button
                    style={styles.backButton}
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>
            </div>

            {/* TOASTS (MyStudies estetiğinde, stack) */}
            {toasts.map((t, idx) => (
                <div
                    key={t.id}
                    style={{
                        ...styles.toast,
                        top: `${90 + idx * 60}px`,
                        border:
                            t.type === "success"
                                ? "1.5px solid rgba(34,197,94,0.6)"
                                : t.type === "error"
                                    ? "1.5px solid rgba(239,68,68,0.7)"
                                    : "1.5px solid rgba(14,165,233,0.5)",
                        color:
                            t.type === "success"
                                ? "#bbf7d0"
                                : t.type === "error"
                                    ? "#fecaca"
                                    : "#7dd3fc",
                    }}
                >
                    {t.message}
                </div>
            ))}

            {/* CENTER WRAPPER */}
            <div style={styles.centerWrapper}>
                {/* TOP CARD HEADER */}
                <div style={styles.topCard}>
                    <div>
                        <h2 style={styles.sectionTitle}>📋 Existing Criteria</h2>
                        <p style={styles.sectionSubtitle}>
                            Define how participants will be evaluated in this study.
                        </p>
                    </div>

                    {/*
                    <button style={styles.newCriterionButton} onClick={openModal}>
                        ➕ New Criterion
                    </button>
                    */}

                </div>

                {/* CRITERIA LIST CARD */}
                <div style={styles.criteriaCard}>
                    {loading ? (
                        <div style={styles.loadingContainer}>
                            <div style={styles.loader} />
                            <p style={styles.loadingText}>Loading criteria...</p>
                        </div>
                    ) : criteria.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>📭</div>
                            <p>No criteria yet. Click “New Criterion” to create one.</p>
                        </div>
                    ) : (
                        <div style={styles.criteriaGrid}>
                            {criteria.map((c) => {
                                const cType = c.type;
                                const color = getTypeColor(cType);

                                return (
                                    <div
                                        key={c.id}
                                        style={{
                                            ...styles.criterionCard,
                                            border: `1px solid ${color.border}`,
                                            boxShadow: `0 0 10px ${color.border}44`,
                                        }}
                                    >
                                        <div style={styles.criterionHeader}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 style={styles.criterionQuestion}>{c.question}</h3>
                                                <div style={styles.badgeRow}>
                                                    <span
                                                        style={{
                                                            ...styles.typeBadge,
                                                            background: color.bg,
                                                            color: color.color,
                                                            border: `1px solid ${color.border}`,
                                                        }}
                                                    >
                                                        {getTypeIcon(cType)} {getTypeLabel(cType)}
                                                    </span>

                                                    <span style={styles.priorityBadge}>
                                                        Priority {c.priorityOrder}
                                                    </span>
                                                </div>
                                            </div>

                                            {/*
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                style={styles.deleteButton}
                                            >
                                                🗑
                                            </button>
                                            */}

                                        </div>

                                        {c.description && (
                                            <p style={styles.criterionDesc}>{c.description}</p>
                                        )}

                                        <div style={styles.metaRow}>
                                            {cType === "MULTIPLE_CHOICE" && (
                                                <span style={styles.metaChip}>
                                                    Options: {c.numberOfOptions} •{" "}
                                                    {c.options?.slice(0, 3).join(", ")}
                                                    {c.options?.length > 3 && "…"} •{" "}
                                                    {c.multipleSelection ? "Multi-select" : "Single"}
                                                </span>
                                            )}

                                            {cType === "RATING" && (
                                                <span style={styles.metaChip}>
                                                    Range: {c.startValue}–{c.endValue}
                                                </span>
                                            )}

                                            {cType === "OPEN_ENDED" && (
                                                <span style={styles.metaChip}>
                                                    Length: {c.minLength ?? "any"}–{c.maxLength ?? "any"}
                                                </span>
                                            )}

                                            {cType === "NUMERIC" && (
                                                <span style={styles.metaChip}>
                                                    {c.integerOnly ? "Integer" : "Float"} •{" "}
                                                    {c.minValue ?? "any"}–{c.maxValue ?? "any"}
                                                </span>
                                            )}

                                            {cType === "IMAGE_HIGHLIGHT" && (
                                                <span style={styles.metaChip}>
                                                    Max annotations: {c.numberOfAnnotations}
                                                </span>
                                            )}

                                            {cType === "CODE_EDIT" && (
                                                <span style={styles.metaChip}>
                                                    Participant edits code directly
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL POPUP */}
            {isModalOpen && (
                <>
                    <div style={styles.modalOverlay} onClick={closeModal} />
                    <div style={styles.modalWrapper}>
                        <div style={styles.modal}>
                            <div style={styles.modalHeader}>
                                <div>
                                    <h2 style={styles.modalTitle}>New Criterion</h2>
                                    <p style={styles.modalSubtitle}>
                                        Configure abstract info and type-specific settings.
                                    </p>
                                </div>
                                <button style={styles.modalCloseButton} onClick={closeModal}>
                                    ✕
                                </button>
                            </div>

                            <div style={styles.modalBody}>
                                {/* ABSTRACT FIELDS */}
                                <div style={styles.modalSection}>
                                    <h3 style={styles.modalSectionTitle}>General Settings</h3>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Question *</label>
                                        <textarea
                                            style={styles.textarea}
                                            value={newCriterion.question}
                                            onChange={(e) =>
                                                setNewCriterion({
                                                    ...newCriterion,
                                                    question: e.target.value,
                                                })
                                            }
                                            rows={3}
                                        />
                                    </div>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Description (optional)</label>
                                        <textarea
                                            style={styles.textarea}
                                            value={newCriterion.description}
                                            onChange={(e) =>
                                                setNewCriterion({
                                                    ...newCriterion,
                                                    description: e.target.value,
                                                })
                                            }
                                            rows={2}
                                        />
                                    </div>

                                    <div style={styles.inlineRow}>
                                        <div style={{ ...styles.inputGroup, flex: 1 }}>
                                            <label style={styles.label}>Priority *</label>
                                            <input
                                                type="number"
                                                style={styles.input}
                                                value={newCriterion.priorityOrder}
                                                onChange={(e) =>
                                                    setNewCriterion({
                                                        ...newCriterion,
                                                        priorityOrder: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div style={{ ...styles.inputGroup, flex: 1 }}>
                                            <label style={styles.label}>Type *</label>
                                            <select
                                                style={styles.select}
                                                value={newCriterion.type}
                                                onChange={(e) =>
                                                    setNewCriterion({
                                                        ...newCriterion,
                                                        type: e.target.value,
                                                    })
                                                }
                                            >
                                                <option value="">Choose</option>
                                                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                                <option value="RATING">Rating</option>
                                                <option value="OPEN_ENDED">Open Ended</option>
                                                <option value="NUMERIC">Numeric</option>
                                                <option value="CODE_EDIT">Code Edit</option>
                                                <option value="IMAGE_HIGHLIGHT">Image Highlight</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* TYPE SPECIFIC */}
                                {newCriterion.type && (
                                    <div style={styles.modalSection}>
                                        <h3 style={styles.modalSectionTitle}>
                                            {getTypeIcon(newCriterion.type)}{" "}
                                            {getTypeLabel(newCriterion.type)} Settings
                                        </h3>

                                        {/* MULTIPLE CHOICE */}
                                        {newCriterion.type === "MULTIPLE_CHOICE" && (
                                            <>
                                                <div style={styles.inlineRow}>
                                                    <div style={{ ...styles.inputGroup, flex: 1 }}>
                                                        <label style={styles.label}>Options *</label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={10}
                                                            style={styles.input}
                                                            value={newCriterion.numberOfOptions}
                                                            onChange={(e) =>
                                                                handleNumberOfOptionsChange(e.target.value)
                                                            }
                                                        />
                                                    </div>

                                                    <div
                                                        style={{
                                                            ...styles.inputGroup,
                                                            flex: 1,
                                                            justifyContent: "flex-end",
                                                            marginTop: 20,
                                                        }}
                                                    >
                                                        <label style={styles.checkboxRow}>
                                                            <input
                                                                type="checkbox"
                                                                checked={newCriterion.multipleSelection}
                                                                onChange={(e) =>
                                                                    setNewCriterion({
                                                                        ...newCriterion,
                                                                        multipleSelection: e.target.checked,
                                                                    })
                                                                }
                                                                style={styles.checkbox}
                                                            />
                                                            Multiple selection
                                                        </label>
                                                    </div>
                                                </div>

                                                {newCriterion.options.map((opt, idx) => (
                                                    <div key={idx} style={styles.inputGroup}>
                                                        <label style={styles.label}>
                                                            Option {idx + 1}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            style={styles.input}
                                                            value={opt}
                                                            onChange={(e) =>
                                                                updateOptionValue(idx, e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {/* RATING */}
                                        {newCriterion.type === "RATING" && (
                                            <div style={styles.inlineRow}>
                                                <div style={{ ...styles.inputGroup, flex: 1 }}>
                                                    <label style={styles.label}>Start *</label>
                                                    <input
                                                        type="number"
                                                        style={styles.input}
                                                        value={newCriterion.startValue}
                                                        onChange={(e) =>
                                                            setNewCriterion({
                                                                ...newCriterion,
                                                                startValue: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>

                                                <div style={{ ...styles.inputGroup, flex: 1 }}>
                                                    <label style={styles.label}>End *</label>
                                                    <input
                                                        type="number"
                                                        style={styles.input}
                                                        value={newCriterion.endValue}
                                                        onChange={(e) =>
                                                            setNewCriterion({
                                                                ...newCriterion,
                                                                endValue: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* OPEN ENDED */}
                                        {newCriterion.type === "OPEN_ENDED" && (
                                            <div style={styles.inlineRow}>
                                                <div style={{ ...styles.inputGroup, flex: 1 }}>
                                                    <label style={styles.label}>Min length</label>
                                                    <input
                                                        type="number"
                                                        style={styles.input}
                                                        value={newCriterion.minLength}
                                                        onChange={(e) =>
                                                            setNewCriterion({
                                                                ...newCriterion,
                                                                minLength: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>

                                                <div style={{ ...styles.inputGroup, flex: 1 }}>
                                                    <label style={styles.label}>Max length</label>
                                                    <input
                                                        type="number"
                                                        style={styles.input}
                                                        value={newCriterion.maxLength}
                                                        onChange={(e) =>
                                                            setNewCriterion({
                                                                ...newCriterion,
                                                                maxLength: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* NUMERIC */}
                                        {newCriterion.type === "NUMERIC" && (
                                            <>
                                                <label style={styles.checkboxRow}>
                                                    <input
                                                        type="checkbox"
                                                        checked={newCriterion.integerOnly}
                                                        onChange={(e) =>
                                                            setNewCriterion({
                                                                ...newCriterion,
                                                                integerOnly: e.target.checked,
                                                            })
                                                        }
                                                        style={styles.checkbox}
                                                    />
                                                    Integer only
                                                </label>

                                                <div style={styles.inlineRow}>
                                                    <div style={{ ...styles.inputGroup, flex: 1 }}>
                                                        <label style={styles.label}>Min</label>
                                                        <input
                                                            type="number"
                                                            style={styles.input}
                                                            value={newCriterion.minValue}
                                                            onChange={(e) =>
                                                                setNewCriterion({
                                                                    ...newCriterion,
                                                                    minValue: e.target.value,
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                    <div style={{ ...styles.inputGroup, flex: 1 }}>
                                                        <label style={styles.label}>Max</label>
                                                        <input
                                                            type="number"
                                                            style={styles.input}
                                                            value={newCriterion.maxValue}
                                                            onChange={(e) =>
                                                                setNewCriterion({
                                                                    ...newCriterion,
                                                                    maxValue: e.target.value,
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* CODE EDIT */}
                                        {newCriterion.type === "CODE_EDIT" && (
                                            <p style={styles.helperText}>
                                                No extra settings. Participants will edit the code
                                                directly.
                                            </p>
                                        )}

                                        {/* IMAGE HIGHLIGHT */}
                                        {newCriterion.type === "IMAGE_HIGHLIGHT" && (
                                            <div style={styles.inputGroup}>
                                                <label style={styles.label}>Max annotations *</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    style={styles.input}
                                                    value={newCriterion.numberOfAnnotations}
                                                    onChange={(e) =>
                                                        setNewCriterion({
                                                            ...newCriterion,
                                                            numberOfAnnotations: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={styles.modalFooter}>
                                <button style={styles.modalCancelButton} onClick={closeModal}>
                                    Cancel
                                </button>
                                <button
                                    style={styles.modalCreateButton}
                                    onClick={handleCreateCriterion}
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : "Create"}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* KEYFRAMES */}
            <style>
                {`
                    @keyframes floatParticle {
                        0% { transform: translateY(0); opacity: 0.4; }
                        50% { opacity: 1; }
                        100% { transform: translateY(-120vh); opacity: 0; }
                    }

                    @keyframes toastFadeInOut {
                        0% { opacity: 0; transform: translate(-50%, -10px); }
                        10% { opacity: 1; transform: translate(-50%, 0px); }
                        90% { opacity: 1; transform: translate(-50%, 0px); }
                        100% { opacity: 0; transform: translate(-50%, -10px); }
                    }

                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    @keyframes modalPop {
                        0% { opacity: 0; transform: scale(0.9) translateY(8px); }
                        100% { opacity: 1; transform: scale(1) translateY(0); }
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
        position: "relative",
        overflow: "hidden",
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
        zIndex: 10,
        position: "relative",
    },

    navTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#60a5fa",
        margin: 0,
    },

    navSubtitle: {
        fontSize: "0.9rem",
        color: "rgba(148,163,184,0.9)",
    },

    studyTypeBadge: {
        marginLeft: 8,
        padding: "3px 10px",
        fontSize: "0.8rem",
        borderRadius: "999px",
        background: "rgba(99,102,241,0.2)",
        border: "1px solid rgba(99,102,241,0.5)",
        color: "#c7d2fe",
    },

    backButton: {
        background: "rgba(220,38,38,0.15)",
        border: "2px solid rgba(220,38,38,0.55)",
        color: "#ef4444",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        transition: "0.35s",
        boxShadow: "0 0 10px rgba(220,38,38,0.35)",
    },

    /* TOAST (MyStudies tarzı) */
    toast: {
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(15,23,42,0.9)",
        borderRadius: "12px",
        padding: "10px 20px",
        fontWeight: "600",
        fontSize: "0.95rem",
        backdropFilter: "blur(8px)",
        boxShadow: "0 0 18px rgba(15,23,42,0.7)",
        zIndex: 9999,
        animation: "toastFadeInOut 3.2s ease forwards",
    },

    centerWrapper: {
        width: "90%",
        maxWidth: "900px",
        margin: "0 auto",
        paddingTop: "24px",
        paddingBottom: "40px",
        position: "relative",
        zIndex: 2,
    },

    /* TOP CARD HEADER */
    topCard: {
        background: "rgba(255,255,255,0.06)",
        borderRadius: "16px",
        padding: "18px 22px",
        marginBottom: "16px",
        border: "1px solid rgba(255,255,255,0.12)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
    },

    sectionTitle: {
        fontSize: "1.3rem",
        margin: 0,
        color: "#e5e7eb",
        fontWeight: 700,
    },

    sectionSubtitle: {
        margin: 0,
        fontSize: "0.9rem",
        color: "#9ca3af",
    },

    newCriterionButton: {
        background: "linear-gradient(135deg, #10b981, #22c55e)",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "10px 18px",
        fontWeight: "600",
        fontSize: "0.95rem",
        cursor: "pointer",
        boxShadow: "0 0 14px rgba(16,185,129,0.45)",
        whiteSpace: "nowrap",
    },

    /* MAIN CRITERIA CARD */
    criteriaCard: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "16px",
        padding: "22px 24px",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 18px 40px rgba(15,23,42,0.7)",
    },

    criteriaGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
        gap: "18px",
    },

    criterionCard: {
        background: "rgba(15,23,42,0.9)",
        borderRadius: "14px",
        padding: "16px 16px 14px 16px",
        border: "1px solid rgba(148,163,184,0.4)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },

    criterionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "8px",
    },

    criterionQuestion: {
        margin: 0,
        fontSize: "1rem",
        fontWeight: 700,
        color: "#e5e7eb",
        wordBreak: "break-word",
    },

    badgeRow: {
        display: "flex",
        gap: "8px",
        marginTop: "6px",
        flexWrap: "wrap",
    },

    typeBadge: {
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
    },

    priorityBadge: {
        padding: "3px 8px",
        borderRadius: "999px",
        background: "rgba(148,163,184,0.25)",
        border: "1px solid rgba(148,163,184,0.5)",
        fontSize: "0.8rem",
        color: "#e5e7eb",
    },

    deleteButton: {
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.6)",
        padding: "4px 10px",
        borderRadius: 999,
        color: "#fecaca",
        cursor: "pointer",
        fontSize: "0.9rem",
    },

    criterionDesc: {
        fontSize: "0.9rem",
        color: "#9ca3af",
        margin: 0,
    },

    metaRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 6,
    },

    metaChip: {
        padding: "3px 8px",
        background: "rgba(17,24,39,0.95)",
        border: "1px solid rgba(75,85,99,0.8)",
        borderRadius: 999,
        fontSize: "0.8rem",
        color: "#cbd5e1",
    },

    /* INPUTS */
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },

    label: {
        fontSize: "0.8rem",
        fontWeight: 600,
        color: "#93c5fd",
    },

    input: {
        padding: "8px 10px",
        background: "rgba(15,23,42,0.95)",
        border: "1px solid rgba(75,85,99,0.9)",
        borderRadius: 8,
        color: "#e2e8f0",
        fontSize: "0.9rem",
        outline: "none",
    },

    textarea: {
        padding: "8px 10px",
        background: "rgba(15,23,42,0.95)",
        border: "1px solid rgba(75,85,99,0.9)",
        borderRadius: 8,
        color: "#e2e8f0",
        fontSize: "0.9rem",
        resize: "vertical",
        outline: "none",
    },

    select: {
        padding: "8px 10px",
        background: "rgba(15,23,42,0.95)",
        border: "1px solid rgba(75,85,99,0.9)",
        borderRadius: 8,
        color: "#e2e8f0",
        fontSize: "0.9rem",
        cursor: "pointer",
        outline: "none",
    },

    inlineRow: {
        display: "flex",
        gap: 10,
        marginTop: 6,
        flexWrap: "wrap",
    },

    checkboxRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "#e2e8f0",
        fontSize: "0.85rem",
    },

    checkbox: {
        width: 16,
        height: 16,
    },

    helperText: {
        color: "#94a3b8",
        fontSize: "0.85rem",
        marginTop: 4,
    },

    /* LOADING */
    loader: {
        width: 40,
        height: 40,
        border: "3px solid rgba(96,165,250,0.25)",
        borderTop: "3px solid #60a5fa",
        borderRadius: "50%",
        margin: "auto",
        animation: "spin 1s linear infinite",
    },

    loadingText: {
        marginTop: 10,
        textAlign: "center",
        fontSize: "0.9rem",
        color: "#a5b4fc",
    },

    loadingContainer: {
        padding: "40px 0",
        textAlign: "center",
    },

    /* EMPTY */
    emptyState: {
        textAlign: "center",
        padding: "50px 0",
        color: "#94a3b8",
    },

    emptyIcon: {
        fontSize: "3rem",
        marginBottom: 10,
    },

    /* MODAL */
    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.65)",
        backdropFilter: "blur(6px)",
        zIndex: 30,
    },

    modalWrapper: {
        position: "fixed",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 40,
        pointerEvents: "none",
    },

    modal: {
        width: "100%",
        maxWidth: 640,
        maxHeight: "90vh",
        background:
            "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.85))",
        borderRadius: 20,
        border: "1px solid rgba(96,165,250,0.5)",
        boxShadow:
            "0 24px 60px rgba(15,23,42,0.9), 0 0 30px rgba(56,189,248,0.35)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "auto",
        animation: "modalPop 0.22s ease-out",
    },

    modalHeader: {
        padding: "16px 20px",
        borderBottom: "1px solid rgba(37,99,235,0.6)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "8px",
    },

    modalTitle: {
        margin: 0,
        fontSize: "1.2rem",
        fontWeight: 700,
        color: "#e5e7eb",
    },

    modalSubtitle: {
        margin: 0,
        marginTop: 4,
        fontSize: "0.85rem",
        color: "#9ca3af",
    },

    modalCloseButton: {
        background: "transparent",
        border: "none",
        color: "#cbd5e1",
        fontSize: "1.2rem",
        cursor: "pointer",
    },

    modalBody: {
        padding: "14px 18px 10px 18px",
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 14,
    },

    modalSection: {
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(59,130,246,0.5)",
        background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.25), transparent 55%), rgba(15,23,42,0.95)",
    },

    modalSectionTitle: {
        margin: "0 0 8px 0",
        fontSize: "0.95rem",
        fontWeight: 700,
        color: "#bfdbfe",
    },

    modalFooter: {
        padding: "10px 18px 12px 18px",
        borderTop: "1px solid rgba(37,99,235,0.6)",
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        background: "rgba(15,23,42,0.95)",
    },

    modalCancelButton: {
        background: "transparent",
        border: "1px solid rgba(148,163,184,0.7)",
        color: "#e5e7eb",
        fontSize: "0.9rem",
        padding: "6px 14px",
        borderRadius: 999,
        cursor: "pointer",
    },

    modalCreateButton: {
        background: "linear-gradient(135deg, #10b981, #22c55e)",
        border: "none",
        fontSize: "0.9rem",
        padding: "6px 18px",
        borderRadius: 999,
        cursor: "pointer",
        color: "#fff",
        fontWeight: 700,
        boxShadow: "0 0 18px rgba(16,185,129,0.6)",
    },
};

export default ManageEvaluationCriteriaPage;
