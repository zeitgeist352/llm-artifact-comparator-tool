// ManageCorrectAnswerPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ============================================================
   (Opsiyonel) PRISMJS — ilerde code preview istersek hazır dursun
============================================================ */
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
   Utils
----------------------------------------------------- */
const formatStudyType = (type) =>
    !type
        ? ""
        : type
            .toLowerCase()
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

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

/* ----------------------------------------------------
   MAIN COMPONENT
----------------------------------------------------- */
function ManageCorrectAnswerPage() {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const [task, setTask] = useState(null);
    const [criteria, setCriteria] = useState([]);
    const [answers, setAnswers] = useState({}); // { [criterionId]: any }
    const [loading, setLoading] = useState(true);

    const [toast, setToast] = useState(null);

    const showSuccess = (message) => {
        setToast({ type: "success", message });
        setTimeout(() => setToast(null), 2000);
    };

    const showError = (message) => {
        setToast({ type: "error", message });
        setTimeout(() => setToast(null), 2500);
    };

    /* ============================================================
       PRISM — ileride code highlight için
    ============================================================ */
    useEffect(() => {
        Prism.highlightAll();
    }, [answers]);

    /* ============================================================
       LOAD TASK + EXISTING CORRECT ANSWERS
    ============================================================ */
    useEffect(() => {
        const loadTask = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = {};
                if (token) headers["Authorization"] = `Bearer ${token}`;

                const res = await fetch(
                    `http://localhost:8080/api/tasks/details/${taskId}`,
                    { headers }
                );

                if (!res.ok) throw new Error("Failed to load task");

                const data = await res.json();
                setTask(data);

                const crit = data.evaluationCriteria || [];
                setCriteria(crit);

                const existingAnswers = data.correctAnswers || [];

                const initial = {};
                crit.forEach((c) => {
                    const entry = existingAnswers.find(
                        (e) => e.criterionId === c.id
                    );

                    if (!entry || entry.answerValue == null) {
                        initial[c.id] = null;
                        return;
                    }

                    const raw = entry.answerValue;

                    if (c.type === "MULTIPLE_CHOICE") {
                        // "opt1,opt2" → ["opt1","opt2"]
                        initial[c.id] = raw
                            ? raw.split(",").map((s) => s.trim()).filter(Boolean)
                            : [];
                    } else if (c.type === "RATING" || c.type === "NUMERIC") {
                        const num = Number(raw);
                        initial[c.id] = Number.isNaN(num) ? null : num;
                    } else {
                        // OPEN_ENDED, CODE_EDIT, IMAGE_HIGHLIGHT
                        initial[c.id] = raw;
                    }
                });

                setAnswers(initial);
            } catch (err) {
                console.error(err);
                showError("❌ Failed to load task");
            } finally {
                setLoading(false);
            }
        };

        loadTask();
    }, [taskId]);

    /* ============================================================
       ANSWER HELPERS — birebir AddTaskPage mantığı
    ============================================================ */
    const setAnswer = (criterionId, value) => {
        setAnswers((prev) => ({
            ...prev,
            [criterionId]: value,
        }));
    };

    const renderCriterionControl = (criterion) => {
        const id = criterion.id;
        const type = criterion.type;
        const currentValue = answers[id];

        // MULTIPLE CHOICE
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

                    if (multiple) {
                        // çoklu seçim
                        if (prevArr.includes(opt)) {
                            return { ...prev, [id]: prevArr.filter((o) => o !== opt) };
                        }
                        return { ...prev, [id]: [...prevArr, opt] };
                    }

                    // tekli — aynı değere basılırsa temizle
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

        // RATING
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
                                onClick={() => setAnswer(id, isActive ? null : v)}
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

        // OPEN ENDED
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

        // NUMERIC
        if (type === "NUMERIC") {
            const integerOnly = !!criterion.integerOnly;
            const min = criterion.minValue ?? "";
            const max = criterion.maxValue ?? "";

            return (
                <div>
                    <input
                        type="number"
                        style={styles.criterionNumberInput}
                        placeholder={integerOnly ? "Enter integer" : "Enter number"}
                        value={currentValue ?? ""}
                        onChange={(e) =>
                            setAnswer(
                                id,
                                e.target.value === "" ? null : e.target.value
                            )
                        }
                    />
                    <div style={styles.numericHint}>
                        {min !== "" && <span>Min: {min} </span>}
                        {max !== "" && <span> | Max: {max}</span>}
                        {integerOnly && <span> | Integer only</span>}
                    </div>
                </div>
            );
        }

        // CODE EDIT
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

        // IMAGE HIGHLIGHT
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
       ANSWER VALIDATION (nullable destekli — AddTaskPage ile aynı)
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
                // boş bırakılsa da olur → skip
                if (!arr.length) continue;
            } else if (type === "RATING") {
                if (val === null || val === undefined || val === "") {
                    // boş olabilir
                    continue;
                }
                const num = Number(val);
                if (Number.isNaN(num)) {
                    showError(`⚠️ Rating must be a number for: "${c.question}"`);
                    return false;
                }
            } else if (
                type === "OPEN_ENDED" ||
                type === "CODE_EDIT" ||
                type === "IMAGE_HIGHLIGHT"
            ) {
                if (!val || String(val).trim() === "") {
                    // boş olabilir
                    continue;
                }
            } else if (type === "NUMERIC") {
                if (val === null || val === undefined || val === "") {
                    // boş olabilir
                    continue;
                }
                const num = Number(val);
                if (Number.isNaN(num)) {
                    showError(
                        `⚠️ Numeric answer must be a number for: "${c.question}"`
                    );
                    return false;
                }

                const { minValue, maxValue, integerOnly } = c;
                if (integerOnly && !Number.isInteger(num)) {
                    showError(`⚠️ Answer must be an integer for: "${c.question}"`);
                    return false;
                }
                if (minValue != null && num < minValue) {
                    showError(
                        `⚠️ Answer must be ≥ ${minValue} for: "${c.question}"`
                    );
                    return false;
                }
                if (maxValue != null && num > maxValue) {
                    showError(
                        `⚠️ Answer must be ≤ ${maxValue} for: "${c.question}"`
                    );
                    return false;
                }
            }
        }
        return true;
    };

    /* ============================================================
       SAVE — backend'e List<CorrectAnswerEntry> gönderiyoruz
    ============================================================ */
    const handleSave = async () => {
        if (!validateAnswers()) return;

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

        try {
            const token = localStorage.getItem("token");
            const headers = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch(
                `http://localhost:8080/api/tasks/update-correct-answer/${taskId}`,
                {
                    method: "PUT",
                    headers,
                    body: JSON.stringify(correctAnswers),
                }
            );

            if (!res.ok) throw new Error();

            showSuccess("✅ Correct answers saved!");

            setTimeout(() => navigate(-1), 1000);
        } catch (err) {
            console.error(err);
            showError("❌ Failed to save");
        }
    };

    /* ============================================================
       RENDER
    ============================================================ */
    if (loading) {
        return (
            <div style={{ padding: 40, color: "white", textAlign: "center" }}>
                Loading...
            </div>
        );
    }

    if (!task) {
        return (
            <div style={{ padding: 40, color: "red", textAlign: "center" }}>
                Task not found.
            </div>
        );
    }

    const studyTypeLabel = formatStudyType(task.studyType);

    return (
        <div style={styles.container}>
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
                <h2 style={styles.navTitle}>Manage Correct Answer</h2>
                <button
                    className="back-btn"
                    style={styles.backButton}
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>
            </div>

            <div style={styles.content}>
                {/* 🔹 ÜSTTE KÜÇÜK TASK INFO CARD (READ-ONLY) */}
                <div style={styles.taskInfoCard}>
                    <div style={styles.taskInfoHeaderRow}>
                        <div>
                            <div style={styles.taskInfoLabel}>Task Question</div>
                            <div style={styles.taskInfoTitle}>
                                {task.questionText || "No question"}
                            </div>
                        </div>

                        <div style={styles.taskInfoRight}>
                            {studyTypeLabel && (
                                <div style={styles.studyTypePill}>
                                    {studyTypeLabel}
                                </div>
                            )}
                        </div>
                    </div>

                    {task.description && (
                        <p style={styles.taskInfoDescription}>
                            {task.description}
                        </p>
                    )}
                </div>

                {/* 🔹 CRITERIA & ANSWERS */}
                {criteria.length > 0 ? (
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>
                            ✅ Correct Answers (Per Criterion)
                        </h2>
                        <p
                            style={{
                                fontSize: "0.9rem",
                                color: "rgba(209,213,219,0.9)",
                                marginBottom: "12px",
                            }}
                        >
                            For each evaluation criterion, set the{" "}
                            <strong>reference correct answer</strong>. Participant
                            responses can be evaluated based on these values.{" "}
                            <br />
                            <span style={{ opacity: 0.8 }}>
                                (You may leave any of them empty.)
                            </span>
                        </p>

                        {criteria
                            .slice()
                            .sort(
                                (a, b) =>
                                    (a.priorityOrder ?? 0) - (b.priorityOrder ?? 0)
                            )
                            .map((c) => (
                                <div key={c.id} style={styles.answerBox}>
                                    <div style={styles.criterionHeader}>
                                        <div>
                                            <h3 style={styles.answerTitle}>
                                                {c.question || `Criterion #${c.id}`}
                                            </h3>
                                            {c.description && (
                                                <p style={styles.answerHint}>
                                                    {c.description}
                                                </p>
                                            )}
                                        </div>
                                        <span style={styles.criterionTypeBadge}>
                                            {prettyCriterionType(c.type)}
                                        </span>
                                    </div>

                                    {renderCriterionControl(c)}
                                </div>
                            ))}

                        <button
                            style={styles.saveButton}
                            className="save-btn"
                            onClick={handleSave}
                        >
                            💾 Save Correct Answer
                        </button>
                    </div>
                ) : (
                    <div style={{ marginTop: 40 }}>
                        <p
                            style={{
                                fontSize: "0.95rem",
                                color: "rgba(209,213,219,0.85)",
                            }}
                        >
                            This task's study has no evaluation criteria. There is no
                            correct answer to configure.
                        </p>
                    </div>
                )}
            </div>

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
   STYLES — AddTaskPage ile uyumlu
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

    /* TOAST */
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

    /* NAVBAR */
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

    /* CONTENT */
    content: {
        padding: "40px 60px",
        maxWidth: "1000px",
        margin: "0 auto",
        position: "relative",
        zIndex: 5,
    },

    /* TASK INFO CARD */
    taskInfoCard: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "12px",
        padding: "18px 20px",
        border: "1px solid rgba(255,255,255,0.12)",
        marginBottom: "24px",
    },

    taskInfoHeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
        marginBottom: "8px",
    },

    taskInfoLabel: {
        fontSize: "0.8rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "rgba(148,163,184,0.9)",
        marginBottom: "4px",
    },

    taskInfoTitle: {
        fontSize: "1.1rem",
        fontWeight: 700,
        color: "#e5e7eb",
    },

    taskInfoRight: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 4,
    },

    studyTypePill: {
        padding: "4px 12px",
        borderRadius: 999,
        border: "1px solid rgba(147,197,253,0.5)",
        background: "rgba(15,23,42,0.9)",
        color: "#bfdbfe",
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
    },

    taskInfoDescription: {
        fontSize: "0.9rem",
        color: "rgba(209,213,219,0.9)",
        marginTop: "4px",
    },

    /* SECTION */
    section: {
        marginTop: "30px",
        marginBottom: "30px",
    },

    sectionTitle: {
        fontSize: "1.4rem",
        fontWeight: "700",
        color: "#38bdf8",
        margin: 0,
        marginBottom: 8,
    },

    /* CORRECT ANSWER UI */
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
            "radial-gradient(circle at top left, rgba(34,197,94,0.9), rgba(74,222,128,0.9))",
        border: "1px solid rgba(34,197,94,0.95)",
        boxShadow: "0 0 12px rgba(34,197,94,0.7)",
        color: "#ecfdf5",
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
        fontFamily: "Inter, sans-serif",
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
        fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
        minHeight: "120px",
        marginTop: "6px",
    },

    /* SAVE BUTTON – YEŞİL */
    saveButton: {
        marginTop: 20,
        width: "100%",
        background: "linear-gradient(135deg, #22c55e, #4ade80)",
        border: "none",
        color: "white",
        fontWeight: 700,
        padding: "12px 20px",
        borderRadius: 12,
        cursor: "pointer",
        fontSize: "1rem",
        transition: "0.3s",
    },
};

/* ============================================================
   HOVER EFFECTS (global) — AddTaskPage ile uyumlu
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

        // Save button hover (yeşil)
        sheet.insertRule(
            `
            .save-btn:hover {
                transform: scale(1.03);
                box-shadow: 0 0 12px rgba(34,197,94,0.55);
            }
        `,
            sheet.cssRules.length
        );
    } catch (err) {
        console.error("hover rule error", err);
    }
};
addHoverEffects();

export default ManageCorrectAnswerPage;
