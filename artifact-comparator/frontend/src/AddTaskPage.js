// AddTaskPage.js

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ⭐ PRISMJS RENKLENDİRME (artifact preview + code-edit criterion için hazır)
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";

/* ----------------------------------------------------
   PARTICLES
----------------------------------------------------- */
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

/* ----------------------------------------------------
   ANA BİLEŞEN
----------------------------------------------------- */
function AddTaskPage() {
    const { studyId } = useParams();
    const navigate = useNavigate();

    const getOrdinal = (n) => {
        const words = ["first", "second", "third", "fourth", "fifth", "sixth"];
        return words[n] || `${n + 1}th`;
    };

    const getSelectionMessage = () => {
        const step = selectedArtifacts.length;
        const total = artifactCount;

        if (step === total) return "All artifacts selected!";
        return `You are selecting the ${getOrdinal(step)} artifact...`;
    };

    /* ===================== PREVIEW STATE ===================== */
    const [previewArtifact, setPreviewArtifact] = useState(null);
    const [previewURL, setPreviewURL] = useState("");
    const [previewText, setPreviewText] = useState("");
    const [previewLanguage, setPreviewLanguage] = useState("markup");
    const [previewLoading, setPreviewLoading] = useState(false);

    // ⭐ NEW: Folder navigation state
    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [breadcrumb, setBreadcrumb] = useState([{ id: null, name: 'Root' }]);

    /* ===================== STUDY & TASK STATE ===================== */
    const [studyType, setStudyType] = useState(null);
    const [artifacts, setArtifacts] = useState([]);
    const [questionText, setQuestionText] = useState("");
    const [description, setDescription] = useState("");
    const [artifactCount, setArtifactCount] = useState(1);
    const [selectedArtifacts, setSelectedArtifacts] = useState([]);
    const [loading, setLoading] = useState(true);

    // ⭐ Criteria & Correct Answers
    const [criteria, setCriteria] = useState([]);
    const [answers, setAnswers] = useState({}); // { [criterionId]: any }

    /* SEARCH + FILTER */
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const [toast, setToast] = useState(null);

    const showSuccess = (message) => {
        setToast({ type: "success", message });
        setTimeout(() => setToast(null), 2000);
    };

    const showError = (message) => {
        setToast({ type: "error", message });
        setTimeout(() => setToast(null), 2500);
    };

    /* Tooltip logic (question/desc/artifactCount lock açıklaması) */
    const [hoveredLockedField, setHoveredLockedField] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, direction: "right" });

    const handleMouseMove = (e) => {
        const direction = e.clientX > window.innerWidth * 0.6 ? "right" : "left";
        setTooltipPos({ x: e.clientX, y: e.clientY, direction });
    };

    const getStudyTypeLabel = (value) => {
        switch (value) {
            case "BUG_CATEGORIZATION":
                return "Bug Categorization";
            case "CODE_CLONE":
                return "Code Clone";
            case "SNAPSHOT_TESTING":
                return "Snapshot Testing";
            case "SOLID_DETECTION":
                return "SOLID Detection";
            case "CUSTOM":
                return "Custom";
            default:
                return value;
        }
    };

    const isPreset = studyType && studyType !== "CUSTOM";
    const prettyType = getStudyTypeLabel(studyType);

    const getTooltipText = () => {
        if (!isPreset || !hoveredLockedField) return "";
        if (hoveredLockedField === "question") {
            return `This field is auto-generated by Study Type: ${prettyType}. You cannot edit it.`;
        }
        if (hoveredLockedField === "description") {
            return `This field is auto-generated by Study Type: ${prettyType}. You cannot edit it.`;
        }
        if (hoveredLockedField === "artifactCount") {
            return `Artifact count is fixed for ${prettyType} studies.`;
        }
        return "";
    };

    /* Prism */
    useEffect(() => {
        if (previewText) Prism.highlightAll();
    }, [previewText]);

    /* ============================================================
       FETCH STUDY DETAILS (studyType, criteria, artifactCount)
    ============================================================ */
    useEffect(() => {
        const fetchStudy = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(
                    `http://localhost:8080/api/studies/${studyId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!res.ok) throw new Error("Failed to fetch study");

                const study = await res.json();

                setStudyType(study.studyType || null);
                setCriteria(study.evaluationCriteria || []);

                // 🔢 Artifact count: ARTIK STUDY'DEN GELİYOR
                setArtifactCount(study.artifactCountPerTask ?? 1);

                // 🔤 Otomatik soru & açıklama (istersen hala kilitli)
                if (study.studyType === "BUG_CATEGORIZATION") {
                    setQuestionText("Categorize the given bug report.");
                    setDescription("Select the correct issue type based on the JSON bug report.");
                } else if (study.studyType === "CODE_CLONE") {
                    setQuestionText("Identify the clone type between the two code blocks.");
                    setDescription("Choose from Type-1, Type-2, Type-3 or Type-4 clone categories.");
                } else if (study.studyType === "SNAPSHOT_TESTING") {
                    setQuestionText("Identify the UI change(s) between the snapshots.");
                    setDescription(
                        "Inspect reference, failure, and diff images, then select the applicable visual change categories."
                    );
                } else if (study.studyType === "SOLID_DETECTION") {
                    setQuestionText("Identify the violated SOLID principle(s).");
                    setDescription(
                        "Mark all violated SOLID principles and rate the difficulty of the given code block as Easy, Medium or Hard."
                    );
                } else {
                    // CUSTOM veya başka: researcher yazsın
                    setQuestionText("");
                    setDescription("");
                }

                // Criterion answer state'i boş başlasın
                const initialAnswers = {};
                (study.evaluationCriteria || []).forEach((c) => {
                    initialAnswers[c.id] = null;
                });
                setAnswers(initialAnswers);
            } catch (err) {
                console.error("Study fetch error:", err);
                showError("❌ Error loading study details");
            }
        };

        fetchStudy();
    }, [studyId]);

    /* ============================================================
       FETCH ARTIFACTS AND FOLDERS
    ============================================================ */
    useEffect(() => {
        fetchArtifactsAndFolders();
    }, [currentFolderId]);

    const fetchArtifactsAndFolders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            // Fetch folders at current level
            const foldersRes = await fetch(
                currentFolderId
                    ? `http://localhost:8080/api/artifact-folders/subfolders/${currentFolderId}`
                    : `http://localhost:8080/api/artifact-folders/root`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (foldersRes.ok) {
                const foldersData = await foldersRes.json();
                setFolders(foldersData);
            }

            // Fetch artifacts at current level
            const artifactsUrl = currentFolderId
                ? `http://localhost:8080/api/artifacts/folder/${currentFolderId}`
                : `http://localhost:8080/api/artifacts/my-artifacts`;

            const artifactsRes = await fetch(artifactsUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!artifactsRes.ok) throw new Error("Failed loading artifacts");

            const artifactsData = await artifactsRes.json();
            setArtifacts(artifactsData);

        } catch (err) {
            console.error("Fetch error:", err);
            showError("❌ Error loading artifacts");
        } finally {
            setLoading(false);
        }
    };

    // ⭐ NEW: Navigate into folder
    const handleFolderClick = async (folder) => {
        setCurrentFolderId(folder.id);
        setBreadcrumb([...breadcrumb, { id: folder.id, name: folder.name }]);
    };

    // ⭐ NEW: Navigate via breadcrumb
    const handleBreadcrumbClick = (index) => {
        const newBreadcrumb = breadcrumb.slice(0, index + 1);
        const targetFolder = newBreadcrumb[newBreadcrumb.length - 1];
        setBreadcrumb(newBreadcrumb);
        setCurrentFolderId(targetFolder.id);
    };

    /* ============================================================
       FILE HELPERS
    ============================================================ */
    const getFileIcon = (filename) => {
        const ext = filename.split(".").pop().toLowerCase();
        switch (ext) {
            case "java":
                return "☕";
            case "cpp":
                return "⚙️";
            case "py":
                return "🐍";
            case "js":
                return "📜";
            case "ts":
                return "🟦";
            case "pdf":
                return "📕";
            case "txt":
                return "📄";
            default:
                return "📄";
        }
    };

    const getFileColor = (filename) => {
        const ext = filename.split(".").pop().toLowerCase();
        switch (ext) {
            case "java":
                return {
                    bg: "rgba(244,114,182,0.18)",
                    color: "#f472b6",
                    border: "rgba(244,114,182,0.4)",
                };
            case "cpp":
                return {
                    bg: "rgba(96,165,250,0.18)",
                    color: "#60a5fa",
                    border: "rgba(96,165,250,0.4)",
                };
            case "py":
                return {
                    bg: "rgba(250,204,21,0.18)",
                    color: "#fde047",
                    border: "rgba(250,204,21,0.4)",
                };
            case "js":
                return {
                    bg: "rgba(34,197,94,0.18)",
                    color: "#4ade80",
                    border: "rgba(34,197,94,0.4)",
                };
            default:
                return {
                    bg: "rgba(156,163,175,0.18)",
                    color: "#9ca3af",
                    border: "rgba(156,163,175,0.4)",
                };
        }
    };

    /* ============================================================
       ARTIFACT SELECTION
    ============================================================ */
    const toggleArtifactSelection = (id) => {
        if (selectedArtifacts.includes(id)) {
            setSelectedArtifacts((prev) => prev.filter((x) => x !== id));
            return;
        }

        if (selectedArtifacts.length >= artifactCount) {
            return showError(`⚠️ You can only select ${artifactCount} artifacts`);
        }

        const newSel = [...selectedArtifacts, id];
        setSelectedArtifacts(newSel);
    };

    /* ============================================================
       PREVIEW HANDLER
    ============================================================ */
    const handlePreview = async (artifact) => {
        try {
            const token = localStorage.getItem("token");
            const url = `http://localhost:8080/researcher/artifact/${artifact.id}`;

            setPreviewArtifact(artifact);
            setPreviewLoading(true);
            setPreviewText("");
            setPreviewURL("");

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
                setPreviewText(await blob.text());
            }
        } catch (err) {
            console.error(err);
            setPreviewText("Preview not supported.");
        } finally {
            setPreviewLoading(false);
        }
    };

    /* ============================================================
       CRITERION ANSWER HELPERS
    ============================================================ */
    const setAnswer = (criterionId, value) => {
        setAnswers((prev) => ({
            ...prev,
            [criterionId]: value,
        }));
    };

    const prettyCriterionType = (type) => {
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
                return type;
        }
    };

    /* ============================================================
       CRITERION INPUT RENDERER
    ============================================================ */
    const renderCriterionControl = (criterion) => {
        const id = criterion.id;
        const type = criterion.type;
        const currentValue = answers[id];

        if (type === "MULTIPLE_CHOICE") {
            const options = criterion.options || [];
            const multiple = !!criterion.multipleSelection;
            const selectedArray = Array.isArray(currentValue)
                ? currentValue
                : currentValue
                    ? [currentValue]
                    : [];

            const toggleOption = (opt) => {
                setAnswers((prev) => {
                    const prevArr = Array.isArray(prev[id])
                        ? prev[id]
                        : prev[id]
                            ? [prev[id]]
                            : [];

                    // Eğer multipleSelection = true → normal toggle
                    if (multiple) {
                        if (prevArr.includes(opt)) {
                            return { ...prev, [id]: prevArr.filter((o) => o !== opt) };
                        }
                        return { ...prev, [id]: [...prevArr, opt] };
                    }

                    // Eğer multipleSelection = false → toggle tekli
                    if (prevArr.includes(opt)) {
                        return { ...prev, [id]: [] };
                    }

                    return { ...prev, [id]: [opt] };
                });
            };

            return (
                <div style={styles.answerRow}>
                    {options.map((opt, index) => {
                        const isActive = selectedArray.includes(opt);
                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => toggleOption(opt)}
                                style={{
                                    ...styles.answerChip,
                                    ...(isActive ? styles.answerChipActive : {}),
                                }}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>
            );
        }

        if (type === "RATING") {
            const start = criterion.startValue ?? 1;
            const end = criterion.endValue ?? 5;
            const range =
                start <= end
                    ? Array.from({ length: end - start + 1 }, (_, i) => start + i)
                    : [start];

            return (
                <div style={styles.answerRow}>
                    {range.map((v) => {
                        const isActive = Number(currentValue) === v;

                        return (
                            <button
                                key={v}
                                type="button"
                                onClick={() =>
                                    setAnswer(id, isActive ? null : v)
                                }
                                style={{
                                    ...styles.answerChip,
                                    ...(isActive ? styles.answerChipActive : {}),
                                }}
                            >
                                {v}
                            </button>
                        );
                    })}
                </div>
            );
        }

        if (type === "OPEN_ENDED") {
            return (
                <textarea
                    style={styles.criterionTextarea}
                    placeholder="Write the expected ideal answer..."
                    value={currentValue || ""}
                    onChange={(e) => setAnswer(id, e.target.value)}
                />
            );
        }

        if (type === "NUMERIC") {
            const integerOnly = !!criterion.integerOnly;
            const min = criterion.minValue ?? "";
            const max = criterion.maxValue ?? "";

            return (
                <div>
                    <input
                        type="number"
                        style={styles.criterionNumberInput}
                        placeholder={
                            integerOnly
                                ? "Enter integer..."
                                : "Enter number..."
                        }
                        value={currentValue ?? ""}
                        onChange={(e) =>
                            setAnswer(id, e.target.value === "" ? null : e.target.value)
                        }
                    />
                    <div style={styles.numericHint}>
                        {min !== "" && (
                            <span>Min: {min} </span>
                        )}
                        {max !== "" && (
                            <span> | Max: {max}</span>
                        )}
                        {integerOnly && (
                            <span> | Integer only</span>
                        )}
                    </div>
                </div>
            );
        }

        if (type === "CODE_EDIT") {
            return (
                <textarea
                    style={styles.codeTextarea}
                    placeholder="Paste the reference solution or code snippet representing the correct edit..."
                    value={currentValue || ""}
                    onChange={(e) => setAnswer(id, e.target.value)}
                />
            );
        }

        if (type === "IMAGE_HIGHLIGHT") {
            const numAnn = criterion.numberOfAnnotations;
            return (
                <textarea
                    style={styles.criterionTextarea}
                    placeholder={
                        numAnn
                            ? `JSON / description for ${numAnn} highlight(s), e.g. [ { x: 10, y: 20, radius: 15 }, ... ]`
                            : "JSON / description of highlight regions..."
                    }
                    value={currentValue || ""}
                    onChange={(e) => setAnswer(id, e.target.value)}
                />
            );
        }

        // fallback
        return (
            <input
                type="text"
                style={styles.criterionNumberInput}
                placeholder="Enter expected answer..."
                value={currentValue || ""}
                onChange={(e) => setAnswer(id, e.target.value)}
            />
        );
    };

    /* ============================================================
       ANSWER VALIDATION (nullable destekli)
    ============================================================ */
    const validateAnswers = () => {
        for (const c of criteria) {
            const id = c.id;
            const type = c.type;
            const val = answers[id];

            if (type === "MULTIPLE_CHOICE") {
                const arr = Array.isArray(val)
                    ? val
                    : val
                        ? [val]
                        : [];
                // ❗ Boş seçimlere izin veriyoruz → skip
                if (!arr.length) continue;
                // seçili ise ekstra bir doğrulama yok
            } else if (type === "RATING") {
                if (val === null || val === undefined || val === "") {
                    // ❗ Boş bırakılabilir → skip
                    continue;
                }
                const num = Number(val);
                if (Number.isNaN(num)) {
                    showError(`⚠️ Rating must be a number for: "${c.question}"`);
                    return false;
                }
            } else if (type === "OPEN_ENDED" || type === "CODE_EDIT" || type === "IMAGE_HIGHLIGHT") {
                if (!val || String(val).trim() === "") {
                    // ❗ Boş bırakılabilir → skip
                    continue;
                }
                // Non-empty her şey kabul
            } else if (type === "NUMERIC") {
                if (val === null || val === undefined || val === "") {
                    // ❗ Boş bırakılabilir → skip
                    continue;
                }
                const num = Number(val);
                if (Number.isNaN(num)) {
                    showError(`⚠️ Numeric answer must be a number for: "${c.question}"`);
                    return false;
                }

                const { minValue, maxValue, integerOnly } = c;
                if (integerOnly && !Number.isInteger(num)) {
                    showError(`⚠️ Answer must be an integer for: "${c.question}"`);
                    return false;
                }
                if (minValue != null && num < minValue) {
                    showError(`⚠️ Answer must be ≥ ${minValue} for: "${c.question}"`);
                    return false;
                }
                if (maxValue != null && num > maxValue) {
                    showError(`⚠️ Answer must be ≤ ${maxValue} for: "${c.question}"`);
                    return false;
                }
            }
        }
        return true;
    };

    /* ============================================================
       CREATE TASK (includes correctAnswers)
    ============================================================ */
    const handleCreateTask = async () => {
        if (!questionText.trim()) return showError("⚠️ Enter task question");
        if (!description.trim()) return showError("⚠️ Enter description");

        if (selectedArtifacts.length !== artifactCount)
            return showError(`⚠️ Select exactly ${artifactCount} artifacts`);

        // ⭐ Criteria-based correct answer validation (nullable destekli)
        if (!validateAnswers()) return;

        // ⭐ Build correctAnswers payload (nullable)
        const correctAnswers = criteria.map((c) => {
            const id = c.id;
            const type = c.type;
            const val = answers[id];

            let answerValue = null;

            if (type === "MULTIPLE_CHOICE") {
                const arr = Array.isArray(val)
                    ? val
                    : val
                        ? [val]
                        : [];
                answerValue = arr.length ? arr.join(",") : null;
            } else if (type === "RATING" || type === "NUMERIC") {
                if (val !== undefined && val !== null && val !== "") {
                    answerValue = String(val);
                }
            } else {
                if (val != null && String(val).trim() !== "") {
                    answerValue = String(val);
                }
            }

            return {
                criterionId: id,
                answerValue,
            };
        });

        const token = localStorage.getItem("token");

        const payload = {
            questionText,
            description,
            artifactCount,
            artifactIds: selectedArtifacts,
            correctAnswers,
        };

        try {
            const res = await fetch(
                `http://localhost:8080/api/tasks/create/${studyId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) throw new Error();

            showSuccess("✅ Task created!");
            setTimeout(() => navigate(`/manage-tasks/${studyId}`), 1500);
        } catch (err) {
            console.error(err);
            showError("❌ Failed to create task");
        }
    };

    /* ============================================================
       ALLOWED EXTENSIONS PER STUDY TYPE
    ============================================================ */
    const allowedExtensionsByType = {
        BUG_CATEGORIZATION: ["json"],
        SOLID_DETECTION: ["json"],
        CODE_CLONE: [
            "java",
            "py",
            "cpp",
            "c",
            "h",
            "js",
            "ts",
            "txt",
            "md",
            "rb",
            "go",
            "rs",
            "patch",
        ],
        SNAPSHOT_TESTING: ["png", "jpg", "jpeg"],
        CUSTOM: null,
    };

    const allowedExts = studyType ? allowedExtensionsByType[studyType] : null;

    const getUniqueExtensions = () => {
        const extensions = new Set();
        artifacts.forEach((art) => {
            const ext = art.filename.split(".").pop().toLowerCase();
            extensions.add(ext);
        });
        return Array.from(extensions).sort();
    };

    const uniqueExtensions = getUniqueExtensions();

    const filteredArtifacts = artifacts.filter((art) => {
        const lower = art.filename.toLowerCase();
        const ext = lower.split(".").pop();

        if (allowedExts && !allowedExts.includes(ext)) return false;
        const matchesSearch = lower.includes(search.toLowerCase());
        const matchesFilter = filter === "all" || filter === ext;

        return matchesSearch && matchesFilter;
    });

    /* ============================================================
       RENDER
    ============================================================ */
    if (loading) {
        return (
            <p style={{ padding: 40, color: "white" }}>Loading artifacts...</p>
        );
    }

    return (
        <div style={styles.container} onMouseMove={handleMouseMove}>
            <FloatingParticles />

            {/* TOAST */}
            {toast && (
                <div
                    style={{
                        ...styles.toast,
                        ...(toast.type === "success"
                            ? styles.toastSuccess
                            : styles.toastError),
                    }}
                >
                    {toast.message}
                </div>
            )}

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>Create New Task</h2>

                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        style={styles.uploadButton}
                        onClick={() => navigate("/upload-artifact")}
                    >
                        Upload New Artifact
                    </button>
                    <button
                        className="back-btn"
                        style={styles.backButton}
                        onClick={() => navigate(`/manage-tasks/${studyId}`)}
                    >
                        ← Back
                    </button>
                </div>
            </div>

            <div style={styles.content}>
                {/* ============ QUESTION ============ */}
                <div style={styles.field}>
                    <label style={styles.label}>Task Question</label>
                    <div style={{ position: "relative" }}>
                        {isPreset && (
                            <div
                                onMouseEnter={() => setHoveredLockedField("question")}
                                onMouseLeave={() => setHoveredLockedField(null)}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    cursor: "not-allowed",
                                    zIndex: 5,
                                    background: "transparent",
                                }}
                            />
                        )}
                        <input
                            type="text"
                            placeholder="Enter the evaluation question..."
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            disabled={isPreset}
                            style={{
                                ...styles.input,
                                opacity: isPreset ? 0.6 : 1,
                            }}
                        />
                    </div>
                </div>

                {/* ============ DESCRIPTION ============ */}
                <div style={styles.field}>
                    <label style={styles.label}>Task Description</label>
                    <div style={{ position: "relative" }}>
                        {isPreset && (
                            <div
                                onMouseEnter={() => setHoveredLockedField("description")}
                                onMouseLeave={() => setHoveredLockedField(null)}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    cursor: "not-allowed",
                                    zIndex: 5,
                                    background: "transparent",
                                }}
                            />
                        )}
                        <textarea
                            placeholder="Describe what the participant should evaluate..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isPreset}
                            style={{
                                ...styles.textarea,
                                opacity: isPreset ? 0.6 : 1,
                            }}
                        />
                    </div>
                </div>

                {/* ============ ARTIFACT COUNT (READ-ONLY, STUDYDEN) ============ */}
                <div style={styles.field}>
                    <label style={styles.label}>Number of Artifacts</label>
                    <div style={{ position: "relative" }}>
                        {isPreset && (
                            <div
                                onMouseEnter={() => setHoveredLockedField("artifactCount")}
                                onMouseLeave={() => setHoveredLockedField(null)}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    cursor: "not-allowed",
                                    zIndex: 5,
                                    background: "transparent",
                                }}
                            />
                        )}
                        <div
                            style={{
                                ...styles.artifactCountDisplay,
                                opacity: isPreset ? 0.6 : 1,
                            }}
                        >
                            {artifactCount} artifacts
                        </div>
                    </div>
                </div>

                {/* ============ ARTIFACTS SECTION ============ */}
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Select Artifacts</h2>
                        <span style={styles.selectionCounter}>
                            {selectedArtifacts.length} / {artifactCount} selected
                        </span>
                    </div>

                    <div
                        style={{
                            marginTop: "-8px",
                            marginBottom: "20px",
                            fontSize: "0.95rem",
                            fontWeight: "600",
                            color: "rgba(96,165,250,0.85)",
                        }}
                    >
                        {getSelectionMessage()}
                    </div>

                    {/* ⭐ BREADCRUMB NAVIGATION */}
                    <div style={styles.breadcrumb}>
                        {breadcrumb.map((crumb, index) => (
                            <React.Fragment key={crumb.id || 'root'}>
                                <span
                                    onClick={() => handleBreadcrumbClick(index)}
                                    style={{
                                        ...styles.breadcrumbItem,
                                        ...(index === breadcrumb.length - 1 ? styles.breadcrumbActive : {}),
                                    }}
                                >
                                    {crumb.name}
                                </span>
                                {index < breadcrumb.length - 1 && (
                                    <span style={styles.breadcrumbSeparator}>›</span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* ============ SEARCH + FILTER ============ */}
                    <div style={styles.searchRow}>
                        <input
                            type="text"
                            placeholder="🔍 Search artifacts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="all">
                                All Types
                                {allowedExts
                                    ? ` (${artifacts.filter((a) =>
                                        allowedExts.includes(
                                            a.filename
                                                .split(".")
                                                .pop()
                                                .toLowerCase()
                                        )
                                    ).length} / ${artifacts.length})`
                                    : ` (${artifacts.length})`}
                            </option>
                            {(allowedExts
                                    ? uniqueExtensions.filter((ext) => allowedExts.includes(ext))
                                    : uniqueExtensions
                            ).map((ext) => {
                                const count = artifacts.filter(
                                    (art) =>
                                        art.filename
                                            .split(".")
                                            .pop()
                                            .toLowerCase() === ext
                                ).length;
                                return (
                                    <option key={ext} value={ext}>
                                        {ext.toUpperCase()} ({count})
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* ⭐ FOLDERS + ARTIFACTS GRID */}
                    <div style={styles.artifactGrid}>
                        {/* Show folders first */}
                        {folders.map((folder) => (
                            <div
                                key={`folder-${folder.id}`}
                                onClick={() => handleFolderClick(folder)}
                                className="folder-card"
                                style={styles.folderCard}
                            >
                                <div style={styles.folderIcon}>📁</div>
                                <div style={styles.folderInfo}>
                                    <h4 style={styles.folderName}>{folder.name}</h4>
                                    <span style={styles.folderCount}>
                                        {folder.artifactCount || 0} files
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Then show artifacts */}
                        {filteredArtifacts.map((art) => {
                            const isSelected = selectedArtifacts.includes(art.id);
                            const colors = getFileColor(art.filename);
                            return (
                                <div
                                    key={art.id}
                                    onClick={() => toggleArtifactSelection(art.id)}
                                    style={{
                                        ...styles.artifactCard,
                                        background: isSelected
                                            ? "rgba(96,165,250,0.35)"
                                            : "rgba(255,255,255,0.05)",
                                        border: `2px solid ${isSelected ? "rgba(96,165,250,0.8)" : "rgba(255,255,255,0.1)"}`,
                                        transform: isSelected ? "scale(1.03)" : "scale(1)",
                                        boxShadow: isSelected ? "0 0 15px rgba(96,165,250,0.8)" : "none",
                                    }}
                                >
                                    {/* EYE BUTTON */}
                                    <div
                                        className="eye-hover"
                                        style={styles.eyeButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePreview(art);
                                        }}
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
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    </div>

                                    <div style={styles.artifactIcon}>
                                        {getFileIcon(art.filename)}
                                    </div>

                                    <div style={styles.artifactInfo}>
                                        <h4 style={styles.artifactFilename}>
                                            {art.filename}
                                        </h4>
                                        <div style={styles.artifactMeta}>
                                            <span
                                                style={{
                                                    ...styles.artifactType,
                                                    color: colors.color,
                                                    background: colors.bg,
                                                    border: `1px solid ${colors.border}`,
                                                }}
                                            >
                                                {art.category || "File"}
                                            </span>
                                            <span style={styles.tagBadge}>
                                                {art.tags || "No Tags"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ============ CORRECT ANSWER SECTION (CRITERIA-BASED) ============ */}
                {criteria.length > 0 && (
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>
                            📝 Correct Answers Per Criterion
                        </h2>
                        <p
                            style={{
                                fontSize: "0.9rem",
                                color: "rgba(209,213,219,0.9)",
                                marginBottom: "12px",
                            }}
                        >
                            For each evaluation criterion, provide the{" "}
                            <strong>expected correct answer</strong>. Participant responses will
                            be compared against these values.
                            <br />
                            <span style={{ opacity: 0.8 }}>
                You may leave any of them empty.
              </span>
                        </p>

                        {criteria
                            .sort((a, b) => (a.priorityOrder ?? 0) - (b.priorityOrder ?? 0))
                            .map((c) => (
                                <div key={c.id} style={styles.answerBox}>
                                    <div style={styles.criterionHeader}>
                                        <div>
                                            <h3 style={styles.answerTitle}>{c.question}</h3>
                                            {c.description && (
                                                <p style={styles.answerHint}>{c.description}</p>
                                            )}
                                        </div>
                                        <span style={styles.criterionTypeBadge}>
                      {prettyCriterionType(c.type)}
                    </span>
                                    </div>
                                    {renderCriterionControl(c)}
                                </div>
                            ))}
                    </div>
                )}

                {/* ============ CREATE TASK BUTTON ============ */}
                <button style={styles.createBtn} onClick={handleCreateTask}>
                    ✅ Create Task
                </button>
            </div>

            {/* ============ MODAL ============ */}
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
                        ) : previewURL ? (
                            previewArtifact.filename.endsWith(".pdf") ? (
                                <embed
                                    src={previewURL}
                                    type="application/pdf"
                                    style={styles.previewPDF}
                                />
                            ) : previewArtifact.filename.match(/\.(png|jpg|jpeg)$/i) ? (
                                <img
                                    src={previewURL}
                                    alt="preview"
                                    style={styles.previewImage}
                                />
                            ) : null
                        ) : (
                            previewText && (
                                <pre style={styles.previewPre}>
                  <code className={`language-${previewLanguage}`}>
                    {previewText}
                  </code>
                </pre>
                            )
                        )}

                        <button
                            className="close-btn"
                            style={styles.closeButton}
                            onClick={() => setPreviewArtifact(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* FLOATING TOOLTIP */}
            {hoveredLockedField && isPreset && (
                <div
                    style={{
                        ...styles.tooltip,
                        top: tooltipPos.y + 12,
                        left:
                            tooltipPos.direction === "right"
                                ? tooltipPos.x + 24
                                : tooltipPos.x - 260,
                    }}
                >
                    {getTooltipText()}

                    {/* ARROW */}
                    <div
                        style={{
                            position: "absolute",
                            top: "14px",
                            [tooltipPos.direction === "right" ? "left" : "right"]: "-9px",
                            width: 0,
                            height: 0,
                            borderTop: "8px solid transparent",
                            borderBottom: "8px solid transparent",
                            borderLeft:
                                tooltipPos.direction === "right"
                                    ? "8px solid rgba(255, 165, 0, 0.7)"
                                    : "none",
                            borderRight:
                                tooltipPos.direction === "left"
                                    ? "8px solid rgba(255, 165, 0, 0.7)"
                                    : "none",
                        }}
                    />
                </div>
            )}

            {/* KEYFRAMES */}
            <style>
                {`
          @keyframes floatParticle {
            0% {
              transform: translateY(0);
              opacity: .4;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translateY(-120vh);
              opacity: 0;
            }
          }
          @keyframes toastFade {
            0% {
              opacity: 0;
              transform: translateX(-50%) translateY(-6px);
            }
            100% {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
          @keyframes fadeTooltip {
            0% {
              opacity: 0;
              transform: translateY(-4px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
            </style>
        </div>
    );
}

/* ============================================================
   STYLES
============================================================ */
const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
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
        fontWeight: 600,
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
        fontWeight: 700,
        color: "#93c5fd",
    },
    backButton: {
        background: "rgba(239,68,68,0.1)",
        border: "2px solid rgba(239,68,68,0.5)",
        borderRadius: "10px",
        padding: "8px 18px",
        color: "#f87171",
        cursor: "pointer",
        fontWeight: 600,
        transition: "0.35s",
    },
    uploadButton: {
        background: "rgba(56,189,248,0.18)",
        border: "1px solid rgba(56,189,248,0.5)",
        padding: "10px 18px",
        borderRadius: "10px",
        color: "#38bdf8",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 0 10px rgba(56,189,248,0.4)",
        transition: "0.35s",
    },

    content: {
        padding: "40px 60px",
        maxWidth: "1200px",
        margin: "0 auto",
        position: "relative",
        zIndex: 5,
    },

    field: {
        marginBottom: "25px",
    },
    label: {
        display: "block",
        fontSize: "1rem",
        marginBottom: "8px",
        color: "#93c5fd",
        fontWeight: 600,
    },
    input: {
        width: "100%",
        padding: "14px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.08)",
        color: "#fff",
        fontSize: "1.05rem",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        lineHeight: 1.5,
    },
    textarea: {
        width: "100%",
        padding: "14px",
        height: "120px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.08)",
        color: "#fff",
        fontSize: "1.05rem",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        lineHeight: 1.5,
    },
    artifactCountDisplay: {
        width: "100%",
        padding: "14px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.04)",
        color: "#e5e7eb",
        fontSize: "1.05rem",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
    },

    section: {
        marginTop: "40px",
        marginBottom: "40px",
    },
    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
    },
    sectionTitle: {
        fontSize: "1.4rem",
        fontWeight: 700,
        color: "#38bdf8",
        margin: 0,
    },
    selectionCounter: {
        fontSize: "1rem",
        fontWeight: 600,
        color: "#60a5fa",
        background: "rgba(96,165,250,0.15)",
        padding: "6px 16px",
        borderRadius: "20px",
        border: "1px solid rgba(96,165,250,0.3)",
    },

    // ⭐ BREADCRUMB
    breadcrumb: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)',
        fontSize: '0.95rem',
        flexWrap: 'wrap',
    },
    breadcrumbItem: {
        color: '#60a5fa',
        cursor: 'pointer',
        transition: '0.2s',
        fontWeight: 500,
    },
    breadcrumbActive: {
        color: '#93c5fd',
        fontWeight: 700,
        cursor: 'default',
    },
    breadcrumbSeparator: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: '1.2rem',
        userSelect: 'none',
    },

    searchRow: {
        display: "flex",
        gap: "20px",
        marginBottom: "25px",
    },
    searchInput: {
        flex: 1,
        padding: "14px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "#fff",
        fontSize: "1rem",
        fontFamily: "'Inter', sans-serif",
    },
    filterSelect: {
        width: "260px",
        padding: "14px 40px 14px 14px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.08)",
        color: "#fff",
        fontSize: "0.95rem",
        fontFamily: "'Inter', sans-serif",
        appearance: "none",
        backgroundImage:
            "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.7)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        backgroundSize: "20px",
        cursor: "pointer",
    },

    artifactGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "20px",
    },

    // ⭐ FOLDER CARD
    folderCard: {
        padding: '20px',
        borderRadius: '15px',
        background: 'rgba(251,191,36,0.12)',
        border: '2px solid rgba(251,191,36,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        cursor: 'pointer',
        transition: '0.25s ease',
        minWidth: 0,
    },
    folderIcon: {
        fontSize: '2.4rem',
    },
    folderInfo: {
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
    },
    folderName: {
        fontSize: '1.05rem',
        fontWeight: 600,
        marginBottom: '4px',
        color: '#fbbf24',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    folderCount: {
        fontSize: '0.85rem',
        color: 'rgba(251,191,36,0.7)',
    },

    artifactCard: {
        padding: "20px",
        borderRadius: "15px",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        cursor: "pointer",
        transition: "0.25s ease",
        minWidth: 0,
        position: "relative",
        paddingRight: "60px",
    },
    eyeButton: {
        position: "absolute",
        right: "15px",
        top: "50%",
        transform: "translateY(-50%)",
        padding: "8px",
        background: "rgba(96,165,250,0.12)",
        borderRadius: "10px",
        border: "1px solid rgba(96,165,250,0.45)",
        cursor: "pointer",
        transition: "0.25s ease",
    },
    artifactIcon: {
        fontSize: "2.4rem",
    },
    artifactInfo: {
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
    },
    artifactFilename: {
        fontSize: "1.05rem",
        fontWeight: 600,
        marginBottom: "8px",
        color: "white",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: "180px",
    },
    artifactMeta: {
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap",
    },
    artifactType: {
        padding: "3px 8px",
        borderRadius: "8px",
        fontSize: "0.75rem",
        fontWeight: 700,
    },
    tagBadge: {
        background: "rgba(251,146,60,0.22)",
        border: "1px solid rgba(251,146,60,0.55)",
        padding: "4px 10px",
        borderRadius: "10px",
        fontSize: "0.78rem",
        color: "#fdba74",
        fontWeight: 600,
    },

    createBtn: {
        marginTop: "35px",
        padding: "16px",
        width: "100%",
        borderRadius: "12px",
        border: "none",
        cursor: "pointer",
        fontSize: "1.2rem",
        fontWeight: 700,
        background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
        color: "white",
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

    tooltip: {
        position: "fixed",
        padding: "12px 16px",
        borderRadius: "12px",
        fontSize: "0.9rem",
        maxWidth: "240px",
        pointerEvents: "none",
        animation: "fadeTooltip 0.25s ease",
        zIndex: 9999,
        background: "rgba(255, 140, 0, 0.20)",
        border: "1px solid rgba(255, 165, 0, 0.55)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 0 14px rgba(255, 165, 0, 0.45)",
        color: "white",
    },

    /* Correct Answer UI */
    answerBox: {
        padding: "14px 16px",
        borderRadius: "12px",
        border: "1px solid rgba(148,163,184,0.5)",
        background: "rgba(15,23,42,0.7)",
        marginBottom: "16px",
    },
    answerTitle: {
        fontSize: "1rem",
        fontWeight: 600,
        color: "#e5e7eb",
        marginBottom: "4px",
    },
    answerHint: {
        fontSize: "0.83rem",
        color: "rgba(148,163,184,0.95)",
        marginBottom: "4px",
    },
    answerRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "8px",
    },
    answerChip: {
        padding: "6px 12px",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        border: "1px solid rgba(148,163,184,0.7)",
        background: "rgba(15,23,42,0.7)",
        color: "rgba(209,213,219,0.9)",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    answerChipActive: {
        background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.9), rgba(56,189,248,0.8))",
        border: "1px solid rgba(96,165,250,0.95)",
        boxShadow: "0 0 12px rgba(59,130,246,0.7)",
        color: "#eff6ff",
    },
    criterionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
        marginBottom: "4px",
    },
    criterionTypeBadge: {
        alignSelf: "flex-start",
        padding: "4px 10px",
        borderRadius: "999px",
        border: "1px solid rgba(96,165,250,0.6)",
        background: "rgba(15,23,42,0.85)",
        color: "#bfdbfe",
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
    },
    criterionTextarea: {
        width: "100%",
        padding: "10px",
        borderRadius: "10px",
        border: "1px solid rgba(148,163,184,0.6)",
        background: "rgba(15,23,42,0.9)",
        color: "#e5e7eb",
        fontSize: "0.95rem",
        fontFamily: "'Inter', sans-serif",
        minHeight: "80px",
        marginTop: "6px",
    },
    criterionNumberInput: {
        padding: "8px 10px",
        borderRadius: "8px",
        border: "1px solid rgba(148,163,184,0.6)",
        background: "rgba(15,23,42,0.9)",
        color: "#e5e7eb",
        fontSize: "0.9rem",
        width: "160px",
        marginTop: "6px",
    },
    numericHint: {
        fontSize: "0.75rem",
        color: "rgba(148,163,184,0.9)",
        marginTop: "4px",
    },
    codeTextarea: {
        width: "100%",
        padding: "10px",
        borderRadius: "10px",
        border: "1px solid rgba(96,165,250,0.6)",
        background: "rgba(15,23,42,0.95)",
        color: "#e5e7eb",
        fontSize: "0.9rem",
        fontFamily:
            "Monaco, Menlo, Consolas, 'Courier New', monospace",
        minHeight: "120px",
        marginTop: "6px",
    },
};

/* ============================================================
   HOVER EFFECTS (global)
============================================================ */
const addHoverEffects = () => {
    try {
        const sheet = document.styleSheets[0];

        // Global button hover
        sheet.insertRule(`button:hover { transform: scale(1.035); }`, sheet.cssRules.length);

        // Eye hover
        sheet.insertRule(
            `.eye-hover:hover { 
        transform: translateY(-50%) scale(1.2) rotate(4deg) !important;
        box-shadow: 0 0 12px rgba(96,165,250,0.7);
        background: rgba(96,165,250,0.25) !important;
      }`,
            sheet.cssRules.length
        );

        // Back button hover (kırmızı)
        sheet.insertRule(
            `.back-btn:hover { 
        transform: scale(1.06);
        border-color: rgba(239,68,68,0.85) !important;
        box-shadow: 0 0 18px rgba(239,68,68,0.55);
        background: rgba(239,68,68,0.20) !important;
      }`,
            sheet.cssRules.length
        );

        // Close Button Hover (kırmızı)
        sheet.insertRule(
            `.close-btn:hover { 
        transform: scale(1.06);
        background: rgba(239,68,68,0.25) !important;
        border-color: rgba(239,68,68,0.85) !important;
        box-shadow: 0 0 18px rgba(239,68,68,0.55);
      }`,
            sheet.cssRules.length
        );

        // Folder card hover
        sheet.insertRule(
            `.folder-card:hover { 
        transform: scale(1.03);
        border-color: rgba(251,191,36,0.7) !important;
        background: rgba(251,191,36,0.18) !important;
        box-shadow: 0 0 16px rgba(251,191,36,0.5);
      }`,
            sheet.cssRules.length
        );
    } catch (err) {
        console.error("hover rule error:", err);
    }
};
addHoverEffects();

export default AddTaskPage;
