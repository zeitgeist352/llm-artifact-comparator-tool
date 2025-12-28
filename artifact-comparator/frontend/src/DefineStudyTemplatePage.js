// DefineStudyTemplatePage.js — GLASS PREMIUM + ACCORDION + CRITERIA MODAL
// 💡 Bu sayfa artık SADECE CUSTOM STUDY oluşturmak için kullanılıyor.
// CreateStudyPage'den /create/custom-template route'u ile geliyorsun,
// title & description burada location.state ile geliyor.
// 1) Burada artifactCount + criteria UI'sini dolduruyorsun
// 2) "Create Study" → /api/studies/create + /artifact-count PATCH + kriterlerin POST'u

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function DefineStudyTemplatePage() {
    const navigate = useNavigate();
    const location = useLocation();

    // CreateStudyPage'den gelen başlık & açıklama
    const { title: initialTitle, description: initialDescription } =
    location.state || {};

    /* ---------------- STATE ---------------- */
    const [artifactCount, setArtifactCount] = useState(1);

    // Artık bu sayfada DB'den study çekmiyoruz; tamamen custom creation mode
    const [criteria, setCriteria] = useState([]);

    const [initialLoading] = useState(false); // Artık remote fetch yok, hep false

    const [savingTemplate, setSavingTemplate] = useState(false);
    const [savingCriterion, setSavingCriterion] = useState(false);

    const [toasts, setToasts] = useState([]);
    const [particles, setParticles] = useState([]);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Accordion (hangi kriter açık)
    const [openAccordionIds, setOpenAccordionIds] = useState([]);

    // Yeni criterion state (ManageEvaluationCriteriaPage ile aynı)
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

    /* ---------------- PARTICLES ---------------- */
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

    /* ---------------- TOAST ---------------- */
    const showToast = (text, type = "success") => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, text, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    };

    /*
       🔥 Artık burada herhangi bir STUDY veya CRITERIA fetch yok.
       Bu sayfaya /create/custom-template ile geliyorsun, tüm veri
       front-end state içinde tutuluyor ve en sonda toplu olarak
       backend'e gönderiliyor.
    */

    /* ---------------- SAVE TEMPLATE → CREATE CUSTOM STUDY ---------------- */
    const handleSaveTemplate = async () => {
        // Artifact count validasyonu
        if (artifactCount < 1) {
            showToast("⚠️ Artifact count must be at least 1.", "error");
            return;
        }

        // En az 1 kriter zorunlu
        if (criteria.length === 0) {
            showToast(
                "⚠️ At least one evaluation criterion is required.",
                "error"
            );
            return;
        }

        // CreateStudyPage'den gelen title/description yoksa
        if (!initialTitle || !initialDescription) {
            showToast(
                "❌ Missing study information. Please start again from the Create Study page.",
                "error"
            );
            return;
        }

        try {
            setSavingTemplate(true);
            const token = localStorage.getItem("token");

            if (!token) {
                showToast("❌ Missing authentication token.", "error");
                setSavingTemplate(false);
                return;
            }

            /* 1️⃣ CUSTOM STUDY CREATE */
            const createRes = await fetch(
                "http://localhost:8080/api/studies/create",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: initialTitle,
                        description: initialDescription,
                        studyType: "CUSTOM",
                        // Backend şu an CUSTOM için artifactCountPerTask'i ignore ediyor olabilir;
                        // bu yüzden aşağıda ayrıca PATCH çağrısı yapıyoruz.
                    }),
                }
            );

            if (!createRes.ok) {
                throw new Error("Study create failed");
            }

            const createdStudy = await createRes.json();
            const newStudyId = createdStudy.id;

            /* 2️⃣ ARTIFACT COUNT PATCH — her zaman güncelle */
            const patchRes = await fetch(
                `http://localhost:8080/api/studies/${newStudyId}/artifact-count`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        artifactCountPerTask: artifactCount,
                    }),
                }
            );

            if (!patchRes.ok) {
                throw new Error("Artifact count update failed");
            }

            /* 3️⃣ TÜM CRITERIA'LARI BACKEND'E POST ET */
            for (const c of criteria) {
                // local id'yi request'ten çıkar
                const { id, ...criterionPayload } = c;

                const critRes = await fetch(
                    `http://localhost:8080/api/criteria/create/${newStudyId}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(criterionPayload),
                    }
                );

                if (!critRes.ok) {
                    throw new Error("Criterion create failed");
                }
            }

            showToast("✅ Custom study created successfully!", "success");
            setTimeout(() => navigate("/researcher"), 1000);
        } catch (e) {
            console.error(e);
            showToast("❌ Failed to create study with template.", "error");
        } finally {
            setSavingTemplate(false);
        }
    };

    /* ---------------- MODAL OPEN/CLOSE ---------------- */
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

    /* ---------------- ACCORDION HELPERS ---------------- */
    const toggleAccordion = (id) => {
        setOpenAccordionIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    /* ---------------- UI HELPERS (ManageCriteria ile aynı) ---------------- */
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
                    bg: "rgba(59,130,246,0.12)",
                    color: "#60a5fa",
                    border: "rgba(59,130,246,0.55)",
                };
            case "RATING":
                return {
                    bg: "rgba(250,204,21,0.12)",
                    color: "#fde047",
                    border: "rgba(250,204,21,0.55)",
                };
            case "OPEN_ENDED":
                return {
                    bg: "rgba(56,189,248,0.12)",
                    color: "#38bdf8",
                    border: "rgba(56,189,248,0.55)",
                };
            case "NUMERIC":
                return {
                    bg: "rgba(34,197,94,0.12)",
                    color: "#4ade80",
                    border: "rgba(34,197,94,0.55)",
                };
            case "CODE_EDIT":
                return {
                    bg: "rgba(168,85,247,0.12)",
                    color: "#c084fc",
                    border: "rgba(168,85,247,0.55)",
                };
            case "IMAGE_HIGHLIGHT":
                return {
                    bg: "rgba(248,113,113,0.12)",
                    color: "#fca5a5",
                    border: "rgba(248,113,113,0.55)",
                };
            default:
                return {
                    bg: "rgba(148,163,184,0.2)",
                    color: "#e5e7eb",
                    border: "rgba(148,163,184,0.55)",
                };
        }
    };

    /* ---------------- MULTIPLE CHOICE HANDLERS ---------------- */
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

    /* ---------------- VALIDATE + PAYLOAD (ManageCriteria ile aynı) ---------------- */
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

                const cleanedOptions = options
                    .map((o) => o.trim())
                    .filter((o) => o.length > 0);

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
                    showToast(
                        "Rating values must be valid and end > start",
                        "error"
                    );
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
                    showToast(
                        "Max length cannot be < min length.",
                        "error"
                    );
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
                    showToast(
                        "Max numeric value cannot be < min value.",
                        "error"
                    );
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
                    showToast(
                        "Number of annotations must be >= 1",
                        "error"
                    );
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

    /* ---------------- CREATE CRITERION (ARTIK SADECE LOCAL STATE) ---------------- */
    const handleCreateCriterion = () => {
        const payload = validateAndBuildPayload();
        if (!payload) return;

        try {
            setSavingCriterion(true);

            const localId = Date.now() + Math.random();

            setCriteria((prev) => [
                ...prev,
                {
                    id: localId,
                    ...payload,
                },
            ]);

            showToast(
                "Criterion added. It will be saved when you create the study.",
                "success"
            );
            closeModal();
        } catch (err) {
            console.error(err);
            showToast("Create failed", "error");
        } finally {
            setSavingCriterion(false);
        }
    };

    /* ---------------- DELETE CRITERION (LOCAL) ---------------- */
    const handleDelete = (id) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this criterion?"
            )
        )
            return;

        setCriteria((prev) => prev.filter((c) => c.id !== id));
        showToast("Criterion deleted", "success");
    };

    /* ---------------- RENDER ---------------- */

    if (initialLoading) {
        return (
            <div style={styles.loadingScreen}>
                <div style={styles.loadingSpinner} />
                <p style={styles.loadingLabel}>Loading template...</p>
            </div>
        );
    }

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

            {/* TOASTS */}
            <div style={styles.toastContainer}>
                {toasts.map((t) => (
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
                        {t.text}
                    </div>
                ))}
            </div>

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <div>
                    <h2 style={styles.navTitle}>Define Study Template</h2>
                    {initialTitle && (
                        <p style={styles.navSubtitle}>
                            {initialTitle}{" "}
                            <span style={styles.studyTypePill}>
                                Custom Study
                            </span>
                        </p>
                    )}
                </div>

                <button
                    className="back-btn"
                    style={styles.backButton}
                    onClick={() => navigate("/researcher")}
                >
                    ← Cancel
                </button>
            </div>

            {/* MAIN CARD */}
            <div style={styles.card}>
                {/* Artifact Count */}
                <div style={styles.sectionHeaderRow}>
                    <div>
                        <h3 style={styles.sectionTitle}>
                            Artifacts Per Task
                        </h3>
                        <p style={styles.sectionSubtitle}>
                            Define how many artifacts each evaluation task will
                            contain.
                        </p>
                    </div>
                </div>

                <div style={styles.inlineRow}>
                    <div style={{ ...styles.inputGroup, flex: 1 }}>
                        <label style={styles.label}>
                            Number of Artifacts Per Task *
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={artifactCount}
                            onChange={(e) =>
                                setArtifactCount(
                                    Number(e.target.value) || 1
                                )
                            }
                            style={styles.input}
                            disabled={savingTemplate}
                        />
                    </div>
                </div>

                {/* Divider */}
                <div style={styles.divider} />

                {/* Criteria Header */}
                <div style={styles.criteriaHeaderRow}>
                    <div>
                        <h3 style={styles.sectionTitle}>
                            Evaluation Criteria
                        </h3>
                        <p style={styles.sectionSubtitle}>
                            Manage how participants’ answers will be evaluated
                            for this study.
                        </p>
                    </div>

                    <button
                        style={styles.newCriterionButton}
                        onClick={openModal}
                    >
                        ➕ New Criterion
                    </button>
                </div>

                {/* ACCORDION LIST */}
                {criteria.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>📭</div>
                        <p>
                            No criteria yet. Click “New Criterion” to create
                            one.
                        </p>
                    </div>
                ) : (
                    <div style={styles.accordionList}>
                        {criteria.map((c) => {
                            const isOpen = openAccordionIds.includes(c.id);
                            const color = getTypeColor(c.type);

                            return (
                                <div
                                    key={c.id}
                                    style={{
                                        ...styles.accordionItem,
                                        borderColor: `${color.border}`,
                                        boxShadow: isOpen
                                            ? `0 0 18px ${color.border}66`
                                            : "0 10px 26px rgba(15,23,42,0.8)",
                                    }}
                                >
                                    <button
                                        style={styles.accordionHeader}
                                        onClick={() => toggleAccordion(c.id)}
                                    >
                                        <div
                                            style={
                                                styles.accordionHeaderLeft
                                            }
                                        >
                                            <span
                                                style={{
                                                    ...styles.typeBadge,
                                                    background: color.bg,
                                                    color: color.color,
                                                    border: `1px solid ${color.border}`,
                                                }}
                                            >
                                                {getTypeIcon(c.type)}{" "}
                                                {getTypeLabel(c.type)}
                                            </span>
                                            <span
                                                style={styles.accordionTitle}
                                            >
                                                {c.question}
                                            </span>
                                        </div>

                                        <div
                                            style={
                                                styles.accordionHeaderRight
                                            }
                                        >
                                            <span
                                                style={
                                                    styles.priorityBadgeSmall
                                                }
                                            >
                                                Priority {c.priorityOrder}
                                            </span>
                                            <span
                                                style={{
                                                    ...styles.chevron,
                                                    transform: isOpen
                                                        ? "rotate(180deg)"
                                                        : "rotate(0deg)",
                                                }}
                                            >
                                                ▾
                                            </span>
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div style={styles.accordionBody}>
                                            {c.description && (
                                                <p
                                                    style={
                                                        styles.criterionDesc
                                                    }
                                                >
                                                    {c.description}
                                                </p>
                                            )}

                                            <div style={styles.metaRow}>
                                                {c.type ===
                                                    "MULTIPLE_CHOICE" && (
                                                        <span
                                                            style={
                                                                styles.metaChip
                                                            }
                                                        >
                                                        Options:{" "}
                                                            {
                                                                c.numberOfOptions
                                                            }{" "}
                                                            •{" "}
                                                            {c.options
                                                                ?.slice(0, 4)
                                                                .join(", ")}
                                                            {c.options
                                                                    ?.length > 4 &&
                                                                "…"}{" "}
                                                            •{" "}
                                                            {c.multipleSelection
                                                                ? "Multi-select"
                                                                : "Single"}
                                                    </span>
                                                    )}

                                                {c.type === "RATING" && (
                                                    <span
                                                        style={
                                                            styles.metaChip
                                                        }
                                                    >
                                                        Range:{" "}
                                                        {c.startValue}–
                                                        {c.endValue}
                                                    </span>
                                                )}

                                                {c.type ===
                                                    "OPEN_ENDED" && (
                                                        <span
                                                            style={
                                                                styles.metaChip
                                                            }
                                                        >
                                                        Length:{" "}
                                                            {c.minLength ??
                                                                "any"}
                                                            –
                                                            {c.maxLength ??
                                                                "any"}
                                                    </span>
                                                    )}

                                                {c.type === "NUMERIC" && (
                                                    <span
                                                        style={
                                                            styles.metaChip
                                                        }
                                                    >
                                                        {c.integerOnly
                                                            ? "Integer"
                                                            : "Float"}{" "}
                                                        •{" "}
                                                        {c.minValue ??
                                                            "any"}
                                                        –
                                                        {c.maxValue ??
                                                            "any"}
                                                    </span>
                                                )}

                                                {c.type ===
                                                    "IMAGE_HIGHLIGHT" && (
                                                        <span
                                                            style={
                                                                styles.metaChip
                                                            }
                                                        >
                                                        Max annotations:{" "}
                                                            {
                                                                c.numberOfAnnotations
                                                            }
                                                    </span>
                                                    )}

                                                {c.type ===
                                                    "CODE_EDIT" && (
                                                        <span
                                                            style={
                                                                styles.metaChip
                                                            }
                                                        >
                                                        Participant edits code
                                                        directly
                                                    </span>
                                                    )}
                                            </div>

                                            <div
                                                style={
                                                    styles.accordionFooter
                                                }
                                            >
                                                <button
                                                    style={
                                                        styles.deleteButton
                                                    }
                                                    onClick={() =>
                                                        handleDelete(c.id)
                                                    }
                                                >
                                                    🗑 Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 🔥 BOTTOM FULL-WIDTH CREATE BUTTON */}
            <div style={styles.bottomSaveContainer}>
                <button
                    onClick={handleSaveTemplate}
                    className="create-btn"
                    style={{
                        ...styles.createBtn,
                        width: "100%",
                        padding: "14px 22px",
                        fontSize: "1.05rem",
                    }}
                    disabled={savingTemplate}
                >
                    {savingTemplate ? "Creating..." : "Create Study"}
                </button>
            </div>

            {/* MODAL POPUP — GLASS PREMIUM */}
            {isModalOpen && (
                <>
                    <div
                        style={styles.modalOverlay}
                        onClick={closeModal}
                    />
                    <div style={styles.modalWrapper}>
                        <div style={styles.modal}>
                            <div style={styles.modalHeader}>
                                <div>
                                    <h2 style={styles.modalTitle}>
                                        New Criterion
                                    </h2>
                                    <p style={styles.modalSubtitle}>
                                        Configure general information and
                                        type-specific settings.
                                    </p>
                                </div>
                                <button
                                    style={styles.modalCloseButton}
                                    onClick={closeModal}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={styles.modalBody}>
                                {/* GENERAL SETTINGS */}
                                <div style={styles.modalSection}>
                                    <h3 style={styles.modalSectionTitle}>
                                        General Settings
                                    </h3>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>
                                            Question *
                                        </label>
                                        <textarea
                                            style={styles.textarea}
                                            value={newCriterion.question}
                                            onChange={(e) =>
                                                setNewCriterion({
                                                    ...newCriterion,
                                                    question:
                                                    e.target.value,
                                                })
                                            }
                                            rows={3}
                                        />
                                    </div>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>
                                            Description (optional)
                                        </label>
                                        <textarea
                                            style={styles.textarea}
                                            value={
                                                newCriterion.description
                                            }
                                            onChange={(e) =>
                                                setNewCriterion({
                                                    ...newCriterion,
                                                    description:
                                                    e.target.value,
                                                })
                                            }
                                            rows={2}
                                        />
                                    </div>

                                    <div style={styles.inlineRow}>
                                        <div
                                            style={{
                                                ...styles.inputGroup,
                                                flex: 1,
                                            }}
                                        >
                                            <label style={styles.label}>
                                                Priority *
                                            </label>
                                            <input
                                                type="number"
                                                style={styles.input}
                                                value={
                                                    newCriterion.priorityOrder
                                                }
                                                onChange={(e) =>
                                                    setNewCriterion({
                                                        ...newCriterion,
                                                        priorityOrder:
                                                        e.target
                                                            .value,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div
                                            style={{
                                                ...styles.inputGroup,
                                                flex: 1,
                                            }}
                                        >
                                            <label style={styles.label}>
                                                Type *
                                            </label>
                                            <select
                                                style={styles.select}
                                                value={newCriterion.type}
                                                onChange={(e) =>
                                                    setNewCriterion({
                                                        ...newCriterion,
                                                        type: e.target
                                                            .value,
                                                    })
                                                }
                                            >
                                                <option value="">
                                                    Choose
                                                </option>
                                                <option value="MULTIPLE_CHOICE">
                                                    Multiple Choice
                                                </option>
                                                <option value="RATING">
                                                    Rating
                                                </option>
                                                <option value="OPEN_ENDED">
                                                    Open Ended
                                                </option>
                                                <option value="NUMERIC">
                                                    Numeric
                                                </option>
                                                <option value="CODE_EDIT">
                                                    Code Edit
                                                </option>
                                                <option value="IMAGE_HIGHLIGHT">
                                                    Image Highlight
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* TYPE-SPECIFIC SETTINGS */}
                                {newCriterion.type && (
                                    <div style={styles.modalSection}>
                                        <h3 style={styles.modalSectionTitle}>
                                            {getTypeIcon(
                                                newCriterion.type
                                            )}{" "}
                                            {getTypeLabel(
                                                newCriterion.type
                                            )}{" "}
                                            Settings
                                        </h3>

                                        {/* MULTIPLE CHOICE */}
                                        {newCriterion.type ===
                                            "MULTIPLE_CHOICE" && (
                                                <>
                                                    <div
                                                        style={
                                                            styles.inlineRow
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                ...styles.inputGroup,
                                                                flex: 1,
                                                            }}
                                                        >
                                                            <label
                                                                style={
                                                                    styles.label
                                                                }
                                                            >
                                                                Options *
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={10}
                                                                style={
                                                                    styles.input
                                                                }
                                                                value={
                                                                    newCriterion.numberOfOptions
                                                                }
                                                                onChange={(e) =>
                                                                    handleNumberOfOptionsChange(
                                                                        e
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </div>

                                                        <div
                                                            style={{
                                                                ...styles.inputGroup,
                                                                flex: 1,
                                                                marginTop: 20,
                                                            }}
                                                        >
                                                            <label
                                                                style={
                                                                    styles.checkboxRow
                                                                }
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        newCriterion.multipleSelection
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setNewCriterion(
                                                                            {
                                                                                ...newCriterion,
                                                                                multipleSelection:
                                                                                e
                                                                                    .target
                                                                                    .checked,
                                                                            }
                                                                        )
                                                                    }
                                                                    style={
                                                                        styles.checkbox
                                                                    }
                                                                />
                                                                Multiple
                                                                selection
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {newCriterion.options.map(
                                                        (opt, idx) => (
                                                            <div
                                                                key={idx}
                                                                style={
                                                                    styles.inputGroup
                                                                }
                                                            >
                                                                <label
                                                                    style={
                                                                        styles.label
                                                                    }
                                                                >
                                                                    Option{" "}
                                                                    {idx + 1}
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    style={
                                                                        styles.input
                                                                    }
                                                                    value={
                                                                        opt
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updateOptionValue(
                                                                            idx,
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        )
                                                    )}
                                                </>
                                            )}

                                        {/* RATING */}
                                        {newCriterion.type ===
                                            "RATING" && (
                                                <div
                                                    style={
                                                        styles.inlineRow
                                                    }
                                                >
                                                    <div
                                                        style={{
                                                            ...styles.inputGroup,
                                                            flex: 1,
                                                        }}
                                                    >
                                                        <label
                                                            style={
                                                                styles.label
                                                            }
                                                        >
                                                            Start *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            style={
                                                                styles.input
                                                            }
                                                            value={
                                                                newCriterion.startValue
                                                            }
                                                            onChange={(e) =>
                                                                setNewCriterion(
                                                                    {
                                                                        ...newCriterion,
                                                                        startValue:
                                                                        e
                                                                            .target
                                                                            .value,
                                                                    }
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div
                                                        style={{
                                                            ...styles.inputGroup,
                                                            flex: 1,
                                                        }}
                                                    >
                                                        <label
                                                            style={
                                                                styles.label
                                                            }
                                                        >
                                                            End *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            style={
                                                                styles.input
                                                            }
                                                            value={
                                                                newCriterion.endValue
                                                            }
                                                            onChange={(e) =>
                                                                setNewCriterion(
                                                                    {
                                                                        ...newCriterion,
                                                                        endValue:
                                                                        e
                                                                            .target
                                                                            .value,
                                                                    }
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                        {/* OPEN ENDED */}
                                        {newCriterion.type ===
                                            "OPEN_ENDED" && (
                                                <div
                                                    style={
                                                        styles.inlineRow
                                                    }
                                                >
                                                    <div
                                                        style={{
                                                            ...styles.inputGroup,
                                                            flex: 1,
                                                        }}
                                                    >
                                                        <label
                                                            style={
                                                                styles.label
                                                            }
                                                        >
                                                            Min length
                                                        </label>
                                                        <input
                                                            type="number"
                                                            style={
                                                                styles.input
                                                            }
                                                            value={
                                                                newCriterion.minLength
                                                            }
                                                            onChange={(e) =>
                                                                setNewCriterion(
                                                                    {
                                                                        ...newCriterion,
                                                                        minLength:
                                                                        e
                                                                            .target
                                                                            .value,
                                                                    }
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div
                                                        style={{
                                                            ...styles.inputGroup,
                                                            flex: 1,
                                                        }}
                                                    >
                                                        <label
                                                            style={
                                                                styles.label
                                                            }
                                                        >
                                                            Max length
                                                        </label>
                                                        <input
                                                            type="number"
                                                            style={
                                                                styles.input
                                                            }
                                                            value={
                                                                newCriterion.maxLength
                                                            }
                                                            onChange={(e) =>
                                                                setNewCriterion(
                                                                    {
                                                                        ...newCriterion,
                                                                        maxLength:
                                                                        e
                                                                            .target
                                                                            .value,
                                                                    }
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                        {/* NUMERIC */}
                                        {newCriterion.type ===
                                            "NUMERIC" && (
                                                <>
                                                    <label
                                                        style={
                                                            styles.checkboxRow
                                                        }
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                newCriterion.integerOnly
                                                            }
                                                            onChange={(e) =>
                                                                setNewCriterion(
                                                                    {
                                                                        ...newCriterion,
                                                                        integerOnly:
                                                                        e
                                                                            .target
                                                                            .checked,
                                                                    }
                                                                )
                                                            }
                                                            style={
                                                                styles.checkbox
                                                            }
                                                        />
                                                        Integer only
                                                    </label>

                                                    <div
                                                        style={
                                                            styles.inlineRow
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                ...styles.inputGroup,
                                                                flex: 1,
                                                            }}
                                                        >
                                                            <label
                                                                style={
                                                                    styles.label
                                                                }
                                                            >
                                                                Min
                                                            </label>
                                                            <input
                                                                type="number"
                                                                style={
                                                                    styles.input
                                                                }
                                                                value={
                                                                    newCriterion.minValue
                                                                }
                                                                onChange={(e) =>
                                                                    setNewCriterion(
                                                                        {
                                                                            ...newCriterion,
                                                                            minValue:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        }
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                        <div
                                                            style={{
                                                                ...styles.inputGroup,
                                                                flex: 1,
                                                            }}
                                                        >
                                                            <label
                                                                style={
                                                                    styles.label
                                                                }
                                                            >
                                                                Max
                                                            </label>
                                                            <input
                                                                type="number"
                                                                style={
                                                                    styles.input
                                                                }
                                                                value={
                                                                    newCriterion.maxValue
                                                                }
                                                                onChange={(e) =>
                                                                    setNewCriterion(
                                                                        {
                                                                            ...newCriterion,
                                                                            maxValue:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        }
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                        {/* CODE EDIT */}
                                        {newCriterion.type ===
                                            "CODE_EDIT" && (
                                                <p style={styles.helperText}>
                                                    No extra settings.
                                                    Participants will edit the
                                                    code directly.
                                                </p>
                                            )}

                                        {/* IMAGE HIGHLIGHT */}
                                        {newCriterion.type ===
                                            "IMAGE_HIGHLIGHT" && (
                                                <div
                                                    style={
                                                        styles.inputGroup
                                                    }
                                                >
                                                    <label
                                                        style={styles.label}
                                                    >
                                                        Max annotations *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        style={
                                                            styles.input
                                                        }
                                                        value={
                                                            newCriterion.numberOfAnnotations
                                                        }
                                                        onChange={(e) =>
                                                            setNewCriterion(
                                                                {
                                                                    ...newCriterion,
                                                                    numberOfAnnotations:
                                                                    e
                                                                        .target
                                                                        .value,
                                                                }
                                                            )
                                                        }
                                                    />
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>

                            <div style={styles.modalFooter}>
                                <button
                                    style={styles.modalCancelButton}
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    style={styles.modalCreateButton}
                                    onClick={handleCreateCriterion}
                                    disabled={savingCriterion}
                                >
                                    {savingCriterion
                                        ? "Saving..."
                                        : "Create"}
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
                        0% { transform: translateY(0); opacity: 0.3; }
                        50% { opacity: 0.9; }
                        100% { transform: translateY(-120vh); opacity: 0; }
                    }

                    @keyframes fadeToast {
                        0% { opacity: 0; transform: translateY(-6px); }
                        100% { opacity: 1; transform: translateY(0); }
                    }

                    @keyframes modalPop {
                        0% { opacity: 0; transform: scale(0.92) translateY(8px); }
                        100% { opacity: 1; transform: scale(1) translateY(0); }
                    }

                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
}

/* ---------------- STYLES ---------------- */

const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
        paddingBottom: "40px",
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
        opacity: 0.55,
    },

    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        zIndex: 5,
    },

    navTitle: {
        fontSize: "1.5rem",
        fontWeight: 700,
        color: "#60a5fa",
        margin: 0,
    },

    navSubtitle: {
        fontSize: "0.9rem",
        color: "#9ca3af",
        marginTop: 4,
    },

    studyTypePill: {
        marginLeft: 8,
        padding: "3px 10px",
        fontSize: "0.8rem",
        borderRadius: "999px",
        background: "rgba(99,102,241,0.2)",
        border: "1px solid rgba(99,102,241,0.5)",
        color: "#c7d2fe",
    },

    backButton: {
        padding: "8px 20px",
        borderRadius: "10px",
        background: "rgba(239,68,68,0.1)",
        border: "2px solid rgba(239,68,68,0.5)",
        color: "#f87171",
        cursor: "pointer",
        fontWeight: 600,
        transition: "all 0.22s ease-out",
    },

    card: {
        width: "90%",
        maxWidth: "900px",
        margin: "40px auto 0 auto",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "18px",
        padding: "30px 32px",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
        position: "relative",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        boxShadow: "0 24px 60px rgba(15,23,42,0.9)",
    },

    sectionHeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },

    sectionTitle: {
        fontWeight: 700,
        fontSize: "1.1rem",
        margin: 0,
        color: "#e5e7eb",
    },

    sectionSubtitle: {
        margin: 0,
        marginTop: 4,
        fontSize: "0.9rem",
        color: "#9ca3af",
    },

    inlineRow: {
        display: "flex",
        gap: 16,
        alignItems: "flex-end",
        flexWrap: "wrap",
    },

    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },

    label: {
        fontWeight: 600,
        fontSize: "0.95rem",
        color: "#93c5fd",
    },

    input: {
        padding: "12px 14px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "white",
        fontSize: "1rem",
        fontFamily: "Inter, sans-serif",
    },

    textarea: {
        padding: "10px 12px",
        borderRadius: "10px",
        background: "rgba(15,23,42,0.9)",
        border: "1px solid rgba(75,85,99,0.85)",
        color: "white",
        fontSize: "0.95rem",
        fontFamily: "Inter, sans-serif",
        resize: "vertical",
    },

    select: {
        padding: "8px 10px",
        borderRadius: "10px",
        background: "rgba(15,23,42,0.9)",
        border: "1px solid rgba(75,85,99,0.85)",
        color: "white",
        fontSize: "0.95rem",
        fontFamily: "Inter, sans-serif",
        cursor: "pointer",
    },

    createBtn: {
        padding: "12px 18px",
        borderRadius: "12px",
        background: "linear-gradient(135deg, #14b8a6, #06b6d4)",
        border: "none",
        color: "white",
        fontWeight: 700,
        fontSize: "1.0rem",
        boxShadow: "0 0 12px rgba(6,182,212,0.4)",
        cursor: "pointer",
        transition: "all 0.22s ease-out",
        minWidth: "160px",
    },

    bottomSaveContainer: {
        width: "90%",
        maxWidth: "900px",
        margin: "20px auto 0 auto",
        position: "relative",
        zIndex: 2,
    },

    divider: {
        height: 1,
        width: "100%",
        background:
            "linear-gradient(to right, transparent, rgba(148,163,184,0.6), transparent)",
        marginTop: 10,
        marginBottom: 4,
    },

    criteriaHeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        marginTop: 4,
    },

    newCriterionButton: {
        background: "linear-gradient(135deg, #10b981, #22c55e)",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "9px 18px",
        fontWeight: "600",
        fontSize: "0.95rem",
        cursor: "pointer",
        boxShadow: "0 0 14px rgba(16,185,129,0.45)",
        whiteSpace: "nowrap",
    },

    /* ACCORDION */
    accordionList: {
        marginTop: 10,
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },

    accordionItem: {
        borderRadius: 14,
        border: "1px solid rgba(148,163,184,0.5)",
        background:
            "radial-gradient(circle at top left, rgba(148,163,184,0.16), transparent 55%), rgba(15,23,42,0.9)",
        overflow: "hidden",
        transition: "box-shadow 0.2s ease",
    },

    accordionHeader: {
        width: "100%",
        padding: "10px 16px",
        border: "none",
        background: "transparent",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
    },

    accordionHeaderLeft: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        textAlign: "left",
        minWidth: 0,
    },

    accordionHeaderRight: {
        display: "flex",
        alignItems: "center",
        gap: 8,
    },

    accordionTitle: {
        fontSize: "0.95rem",
        fontWeight: 600,
        color: "#e5e7eb",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "380px",
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

    priorityBadgeSmall: {
        padding: "3px 8px",
        borderRadius: "999px",
        background: "rgba(148,163,184,0.25)",
        border: "1px solid rgba(148,163,184,0.5)",
        fontSize: "0.8rem",
        color: "#e5e7eb",
    },

    chevron: {
        fontSize: "1rem",
        color: "#9ca3af",
        transition: "transform 0.18s ease-out",
    },

    accordionBody: {
        padding: "8px 16px 10px 16px",
        borderTop: "1px solid rgba(31,41,55,0.9)",
    },

    criterionDesc: {
        fontSize: "0.9rem",
        color: "#9ca3af",
        margin: "4px 0 8px 0",
    },

    metaRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 8,
    },

    metaChip: {
        padding: "4px 9px",
        background: "rgba(17,24,39,0.95)",
        border: "1px solid rgba(75,85,99,0.8)",
        borderRadius: 999,
        fontSize: "0.8rem",
        color: "#cbd5e1",
    },

    accordionFooter: {
        display: "flex",
        justifyContent: "flex-end",
        paddingTop: 4,
        paddingBottom: 4,
    },

    deleteButton: {
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.6)",
        padding: "5px 12px",
        borderRadius: 999,
        color: "#fecaca",
        cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: 500,
    },

    /* EMPTY */
    emptyState: {
        textAlign: "center",
        padding: "30px 0 10px 0",
        color: "#94a3b8",
    },

    emptyIcon: {
        fontSize: "2.4rem",
        marginBottom: 8,
    },

    /* TOAST */
    toastContainer: {
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        zIndex: 3000,
        alignItems: "center",
    },

    toast: {
        padding: "10px 18px",
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
        background: "rgba(15,23,42,0.92)",
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

    /* MODAL */
    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
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
            "radial-gradient(circle at top left, rgba(37,99,235,0.35), transparent 60%), rgba(15,23,42,0.98)",
        borderRadius: 20,
        border: "1px solid rgba(96,165,250,0.6)",
        boxShadow:
            "0 24px 60px rgba(15,23,42,0.95), 0 0 30px rgba(56,189,248,0.4)",
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
        gap: "10px",
    },

    modalTitle: {
        margin: 0,
        fontSize: "1.25rem",
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
        padding: "14px 18px 12px 18px",
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 14,
    },

    modalSection: {
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(59,130,246,0.6)",
        background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 55%), rgba(15,23,42,0.98)",
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
        background: "rgba(15,23,42,0.98)",
    },

    modalCancelButton: {
        background: "transparent",
        border: "1px solid rgba(148,163,184,0.7)",
        color: "#e5e7eb",
        fontSize: "0.9rem",
        padding: "6px 16px",
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

    /* LOADING SCREEN */
    loadingScreen: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#e5e7eb",
        fontFamily: "Inter, sans-serif",
    },

    loadingSpinner: {
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "4px solid rgba(96,165,250,0.25)",
        borderTop: "4px solid #60a5fa",
        animation: "spin 1s linear infinite",
        marginBottom: 12,
    },

    loadingLabel: {
        fontSize: "0.95rem",
        color: "#a5b4fc",
    },
};

export default DefineStudyTemplatePage;
