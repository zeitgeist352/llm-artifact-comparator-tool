// BulkUploadPage.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

/* ============================================================
   PARTICLES
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
   TOAST
============================================================ */
function Toast({ message, type }) {
    return (
        <div
            style={{
                position: "fixed",
                top: "25px",
                left: "50%",
                transform: "translateX(-50%)",
                padding: "14px 22px",
                borderRadius: "10px",
                background:
                    type === "success"
                        ? "rgba(34,197,94,0.25)"
                        : "rgba(220,38,38,0.25)",
                color: type === "success" ? "#86efac" : "#fca5a5",
                border:
                    type === "success"
                        ? "1px solid rgba(34,197,94,0.55)"
                        : "1px solid rgba(220,38,38,0.55)",
                backdropFilter: "blur(6px)",
                boxShadow: "0 0 14px rgba(0,0,0,0.35)",
                zIndex: 9999,
            }}
        >
            {message}
        </div>
    );
}

/* ============================================================
   MAIN PAGE
============================================================ */
export default function BulkUploadPage() {
    const { studyId } = useParams();
    const navigate = useNavigate();

    const [zipFile, setZipFile] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [studyInfo, setStudyInfo] = useState(null);
    const [csvPreview, setCsvPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Help modal
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    // NEW: CSV Preview modal
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    /* ============================================================
       FETCH STUDY INFO
    ============================================================= */
    useEffect(() => {
        const fetchStudy = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/studies/${studyId}`);
                const data = await res.json();
                setStudyInfo(data);

                generateCsvFormat(data);
            } catch (e) {
                console.error(e);
            }
        };

        fetchStudy();
    }, [studyId]);

    /* ============================================================
       GENERATE CSV FORMAT PREVIEW
    ============================================================= */
    function generateCsvFormat(study) {
        if (!study) return;

        const artifactCount = study.artifactCountPerTask;
        const criteria = [...study.evaluationCriteria].sort(
            (a, b) => a.priorityOrder - b.priorityOrder
        );

        let columns = [];

        for (let i = 1; i <= artifactCount; i++) {
            columns.push(`artifact_${i}_filename`);
        }

        columns.push("question");
        columns.push("description");

        criteria.forEach((c) => {
            columns.push(`criterion_${c.priorityOrder}_${c.type}_answer`);
        });

        const exampleRow = columns.map((col) => {
            if (col.includes("artifact_")) {
                return `${col}_example`;        // artifact file names → tırnaksız
            }
            return `"${col}_example"`;          // tüm diğer kolonlar → tırnaklı
        });

        setCsvPreview({
            headers: columns,
            row: exampleRow
        });
    }

    /* ============================================================
       SUBMIT HANDLER
    ============================================================= */
    const handleUpload = async () => {
        if (!zipFile || !csvFile) {
            showToast("Please select both ZIP and CSV files.", "error");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("zipFile", zipFile);
            formData.append("csvFile", csvFile);

            const res = await fetch(`http://localhost:8080/api/bulk/upload/${studyId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                showToast(
                    `✅ ${data.tasksCreated} tasks created in folder "${data.folderName}"!`,
                    "success"
                );
                setTimeout(() => navigate(`/manage-tasks/${studyId}`), 1800);
            } else {
                showToast(data.error || "Bulk upload failed.", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Upload failed: " + e.message, "error");
        }
        setLoading(false);
    };



    /* ============================================================
       HELP MODAL
    ============================================================= */
    const sortedCriteria = studyInfo?.evaluationCriteria
        ? [...studyInfo.evaluationCriteria].sort(
            (a, b) => a.priorityOrder - b.priorityOrder
        )
        : [];

    const getCriterionTypeLabel = (type) => {
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

    const getCriterionTypeIcon = (type) => {
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

    const renderCriterionHelpRow = (crit) => {
        const colName = `criterion_${crit.priorityOrder}_${crit.type}_answer`;

        let exampleValue = "";
        let explanation = "";

        switch (crit.type) {
            case "MULTIPLE_CHOICE":
                exampleValue =
                    crit.multipleSelection && crit.options?.length >= 2
                        ? `"${crit.options[0]},${crit.options[1]}"`
                        : `"${crit.options?.[0] || "A"}"`;
                explanation = crit.multipleSelection
                    ? "Multiple selection: \"A,B\" format."
                    : "Single selection: A.";
                break;

            case "RATING":
                exampleValue = `"${crit.startValue ?? 1}"`;
                explanation = `Rating ${crit.startValue}–${crit.endValue}`;
                break;

            case "OPEN_ENDED":
                exampleValue = "\"Example explanation\"";
                break;

            case "NUMERIC":
                exampleValue = crit.integerOnly ? `"42"` : `"3.14"`;
                break;

            case "CODE_EDIT":
                exampleValue = "\"Ideal code explanation\"";
                break;

            case "IMAGE_HIGHLIGHT":
                exampleValue =
                    "\"[{\\\"x\\\":0.32,\\\"y\\\":0.12}]\"";
                break;
        }

        return (
            <div key={crit.id} style={styles.helpRow}>
                <div style={styles.helpRowHeader}>
                    <span style={styles.helpPill}>
                        {getCriterionTypeIcon(crit.type)} {getCriterionTypeLabel(crit.type)}
                    </span>

                    <span style={styles.helpColumnName}>
                        Column: <code>{colName}</code>
                    </span>
                </div>

                {crit.question && (
                    <div style={styles.helpQuestion}>Q: {crit.question}</div>
                )}

                <div style={styles.helpExampleRow}>
                    <span style={styles.helpExampleLabel}>Example value:</span>
                    <code style={styles.helpExampleCode}>{exampleValue}</code>
                </div>

                <div style={styles.helpExplanation}>{explanation}</div>
            </div>
        );
    };

    /* ============================================================
       RENDER
    ============================================================= */
    return (
        <div style={styles.container}>
            <FloatingParticles />

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>Bulk Upload — Study #{studyId}</h2>

                <div style={styles.navRight}>
                    <button
                        style={styles.helpButton}
                        onClick={() => setIsHelpOpen(true)}
                    >
                        💡 CSV Help
                    </button>

                    <button
                        style={styles.backButton}
                        onClick={() => navigate(`/manage-tasks/${studyId}`)}
                    >
                        ← Back
                    </button>
                </div>
            </div>

            <div style={styles.centerWrapper}>
                {/* ---------------- CSV FORMAT GUIDE ---------------- */}
                {csvPreview && (
                    <div style={styles.infoCard}>
                        <div style={styles.infoHeaderRow}>
                            <h3 style={styles.infoTitle}>CSV Format Guide</h3>

                            <button
                                style={styles.previewButton}
                                onClick={() => setIsPreviewOpen(true)}
                            >
                                Preview Full Table
                            </button>
                        </div>


                        <p style={styles.infoText}>
                            • This study requires <b>{studyInfo?.artifactCountPerTask}</b> artifact(s).<br />
                            • There are <b>{studyInfo?.evaluationCriteria.length}</b> criteria.<br />
                            • Each row = one evaluation task.
                        </p>

                        {/* SMALL TABLE */}
                        <div style={styles.csvSmallWrapper}>

                            <table style={styles.csvTable}>
                                <thead>
                                <tr>
                                    {csvPreview.headers.map((h, i) => (
                                        <th key={i} style={styles.th}>{h}</th>
                                    ))}
                                </tr>
                                </thead>

                                <tbody>
                                <tr>
                                    {csvPreview.row.map((v, i) => (
                                        <td key={i} style={styles.td}>{v}</td>
                                    ))}
                                </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>
                )}

                {/* ---------------- UPLOAD CARD ---------------- */}
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Upload ZIP + CSV</h2>
                    <p style={styles.cardDesc}>
                        ZIP contains artifacts.<br />
                        CSV defines tasks + mapping + correct answers.
                    </p>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>ZIP File</label>
                        <input
                            type="file"
                            accept=".zip"
                            onChange={(e) => setZipFile(e.target.files[0])}
                            style={styles.fileInput}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>CSV File</label>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setCsvFile(e.target.files[0])}
                            style={styles.fileInput}
                        />
                    </div>

                    <button
                        style={styles.uploadButton}
                        disabled={loading}
                        onClick={handleUpload}
                    >
                        {loading ? "Uploading..." : "Start Upload"}
                    </button>
                </div>
            </div>

            {toast && <Toast message={toast.msg} type={toast.type} />}

            {/* ============================================================
                HELP MODAL
            ============================================================ */}
            {isHelpOpen && (
                <>
                    <div
                        style={styles.modalOverlay}
                        onClick={() => setIsHelpOpen(false)}
                    />
                    <div style={styles.modalWrapper}>
                        <div style={styles.modal}>
                            <div style={styles.modalHeader}>
                                <div>
                                    <h2 style={styles.modalTitle}>CSV Help & Examples</h2>
                                    <p style={styles.modalSubtitle}>
                                        This guide is generated from your study’s criteria.
                                    </p>
                                </div>
                                <button
                                    style={styles.modalCloseButton}
                                    onClick={() => setIsHelpOpen(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={styles.modalBody}>
                                {/* Base structure */}
                                <div style={styles.helpSection}>
                                    <h3 style={styles.helpSectionTitle}>1. Base columns</h3>
                                    <p style={styles.helpText}>Each row requires:</p>

                                    <ul style={styles.helpList}>
                                        <li>
                                            artifact_1_filename → artifact_{studyInfo?.artifactCountPerTask}_filename
                                        </li>
                                        <li>question</li>
                                        <li>description</li>
                                    </ul>
                                </div>

                                {/* Criteria */}
                                <div style={styles.helpSection}>
                                    <h3 style={styles.helpSectionTitle}>2. Criteria answer columns</h3>
                                    <p style={styles.helpText}>
                                        Each criterion produces a column:
                                        <br />
                                        <code>criterion_{"{priority}"}_{"{TYPE}"}_answer</code>
                                    </p>

                                    {sortedCriteria.map((crit) => renderCriterionHelpRow(crit))}
                                </div>

                                {/* CSV quoting rule */}
                                <div style={styles.helpSection}>
                                    <h3 style={styles.helpSectionTitle}>3. Quotes & commas</h3>
                                    <ul style={styles.helpList}>
                                        <li>If answer contains comma → MUST be quoted: "A,B"</li>
                                        <li>ALL answers must be quoted → "A", "3", "2"</li>
                                        <li>Empty answer → ""</li>
                                    </ul>
                                </div>
                            </div>

                            <div style={styles.modalFooter}>
                                <button
                                    style={styles.modalCloseFooterButton}
                                    onClick={() => setIsHelpOpen(false)}
                                >
                                    Got it
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ============================================================
                PREVIEW TABLE MODAL (NEW)
            ============================================================ */}
            {isPreviewOpen && (
                <>
                    <div
                        style={styles.modalOverlay}
                        onClick={() => setIsPreviewOpen(false)}
                    />

                    <div style={styles.modalWrapper}>
                        <div style={styles.previewModal}>
                            <div style={styles.previewHeader}>
                                <h2 style={styles.previewTitle}>CSV Table Preview</h2>

                                <button
                                    style={styles.modalCloseButton}
                                    onClick={() => setIsPreviewOpen(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={styles.previewBody}>
                                <table style={styles.previewTable}>
                                    <thead>
                                    <tr>
                                        {csvPreview?.headers.map((h, i) => (
                                            <th key={i} style={styles.previewTh}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {[1, 2, 3].map((n) => (
                                        <tr key={n}>
                                            {csvPreview?.headers.map((col, i) => {
                                                const isFile = col.includes("artifact_");

                                                const value = isFile
                                                    ? `${col}_example_${n}`         // filenames — tırnaksız
                                                    : `"${col}_example_${n}"`;      // diğer tüm kolonlar — tırnaklı

                                                return (
                                                    <td key={i} style={styles.previewTd}>
                                                        {value}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                    </tbody>


                                </table>
                            </div>

                            <div style={styles.previewFooter}>
                                <button
                                    style={styles.modalCloseFooterButton}
                                    onClick={() => setIsPreviewOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ANIMATIONS */}
            <style>
                {`
                @keyframes floatParticle {
                    0% { transform: translateY(0); opacity: .4; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-120vh); opacity: 0; }
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

/* ============================================================
   STYLES
============================================================ */
const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "white",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
        position: "relative",
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

    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        zIndex: 10,
    },

    navTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#60a5fa",
    },

    navRight: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },

    helpButton: {
        background: "rgba(234,179,8,0.14)",
        border: "2px solid rgba(234,179,8,0.65)",
        color: "#facc15",
        padding: "8px 16px",
        borderRadius: "999px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "0.9rem",
        boxShadow: "0 0 10px rgba(234,179,8,0.4)",
        transition: "0.25s ease",
    },

    backButton: {
        background: "rgba(220,38,38,0.15)",
        border: "2px solid rgba(220,38,38,0.55)",
        color: "#fca5a5",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        boxShadow: "0 0 12px rgba(220,38,38,0.35)",
        transition: "0.25s ease",
    },

    centerWrapper: {
        width: "90%",
        maxWidth: "750px",
        margin: "0 auto",
        paddingTop: "40px",
        zIndex: 2,
    },

    infoCard: {
        background: "rgba(255,255,255,0.06)",
        padding: "22px",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.12)",
        marginBottom: "35px",
        backdropFilter: "blur(8px)",
    },

    infoTitle: {
        fontSize: "1.4rem",
        color: "#93c5fd",
        marginBottom: "10px",
        fontWeight: 700,
    },

    previewButton: {
        background: "rgba(96,165,250,0.14)",
        border: "2px solid rgba(96,165,250,0.55)",
        color: "#93c5fd",
        padding: "6px 14px",
        borderRadius: "999px",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "0.85rem",
        marginBottom: 12,
        transition: "0.25s ease",
        boxShadow: "0 0 10px rgba(96,165,250,0.35)",
    },

    infoText: {
        fontSize: "0.95rem",
        color: "rgba(255,255,255,0.8)",
        marginBottom: "12px",
    },

    csvSmallWrapper: {
        width: "100%",
        overflowX: "auto",
        marginTop: 10,
        borderRadius: 8,
    },

    csvTable: {
        width: "100%",
        borderCollapse: "collapse",
        background: "rgba(255,255,255,0.04)",
        borderRadius: "8px",
        fontSize: "0.7rem",          // 🔥 Küçültüldü
        minWidth: "650px",           // 🔥 Daha dar bir tablo
    },

    th: {
        padding: "6px 8px",          // 🔥 Daha az padding
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(59,130,246,0.18)",
        color: "#cbd5fe",
        textAlign: "left",
        fontSize: "0.7rem",          // 🔥 Küçük
        whiteSpace: "nowrap",
    },

    td: {
        padding: "6px 8px",          // 🔥 Daha az padding
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#e2e8f0",
        fontSize: "0.7rem",          // 🔥 Küçük
        whiteSpace: "nowrap",
    },


    card: {
        background: "rgba(255,255,255,0.06)",
        padding: "30px",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 0 20px rgba(0,0,0,0.35)",
    },

    cardTitle: {
        fontSize: "1.6rem",
        marginBottom: "10px",
        fontWeight: 700,
        color: "#93c5fd",
    },

    cardDesc: {
        fontSize: "0.95rem",
        color: "rgba(255,255,255,0.75)",
        marginBottom: "25px",
    },

    inputGroup: { marginBottom: "20px" },

    label: {
        display: "block",
        marginBottom: "6px",
        color: "#a5b4fc",
        fontSize: "0.95rem",
        fontWeight: 600,
    },

    fileInput: {
        width: "100%",
        padding: "12px",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(255,255,255,0.05)",
        color: "white",
        cursor: "pointer",
    },

    uploadButton: {
        width: "100%",
        padding: "12px 20px",
        background: "linear-gradient(135deg, #059669, #10b981)",
        color: "white",
        border: "none",
        borderRadius: "12px",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "1rem",
        marginTop: "15px",
        transition: "0.25s ease",
        boxShadow: "0 0 12px rgba(16,185,129,0.35)",
    },

    /* ============================
       MODAL BASE STYLES
    ============================ */
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
        maxWidth: 780,
        maxHeight: "90vh",
        background:
            "linear-gradient(135deg, rgba(15,23,42,0.97), rgba(30,64,175,0.9))",
        borderRadius: 20,
        border: "1px solid rgba(96,165,250,0.6)",
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

    modalFooter: {
        padding: "10px 18px 12px 18px",
        borderTop: "1px solid rgba(37,99,235,0.6)",
        display: "flex",
        justifyContent: "flex-end",
        background: "rgba(15,23,42,0.98)",
    },

    modalCloseFooterButton: {
        background: "linear-gradient(135deg, #22c55e, #16a34a)",
        border: "none",
        fontSize: "0.9rem",
        padding: "7px 18px",
        borderRadius: 999,
        cursor: "pointer",
        color: "#fff",
        fontWeight: 700,
        boxShadow: "0 0 16px rgba(16,185,129,0.6)",
    },

    /* ============================
       PREVIEW MODAL STYLES (NEW)
    ============================ */
    previewModal: {
        width: "95%",
        maxWidth: "1200px",
        maxHeight: "90vh",
        background:
            "linear-gradient(135deg, rgba(15,23,42,0.97), rgba(30,64,175,0.9))",
        borderRadius: 20,
        border: "1px solid rgba(96,165,250,0.6)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        animation: "modalPop 0.22s ease-out",
        pointerEvents: "auto",
    },

    infoHeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },

    previewHeader: {
        padding: "14px 18px",
        borderBottom: "1px solid rgba(96,165,250,0.45)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },

    previewTitle: {
        margin: 0,
        color: "#e2e8f0",
        fontSize: "1.15rem",
        fontWeight: 700,
    },

    previewBody: {
        flex: 1,
        overflowX: "auto",
        overflowY: "auto",
        padding: 12,
    },

    previewFooter: {
        padding: "10px 18px",
        borderTop: "1px solid rgba(96,165,250,0.45)",
        display: "flex",
        justifyContent: "flex-end",
    },

    previewTable: {
        borderCollapse: "collapse",
        width: "100%",
        minWidth: "900px",
        background: "rgba(255,255,255,0.05)",
    },

    previewTh: {
        padding: 10,
        border: "1px solid rgba(255,255,255,0.25)",
        background: "rgba(59,130,246,0.25)",
        color: "#e0e7ff",
        fontSize: "0.85rem",
        whiteSpace: "nowrap",
    },

    previewTd: {
        padding: 10,
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#e5e7eb",
        fontSize: "0.85rem",
        whiteSpace: "nowrap",
    },

    /* HELP CONTENT */
    helpSection: {
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(59,130,246,0.5)",
        background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.25), transparent 55%), rgba(15,23,42,0.96)",
    },

    helpSectionTitle: {
        margin: "0 0 8px 0",
        fontSize: "0.95rem",
        fontWeight: 700,
        color: "#bfdbfe",
    },

    helpText: {
        margin: 0,
        marginBottom: 6,
        fontSize: "0.85rem",
        color: "#e5e7eb",
    },

    helpList: {
        margin: "4px 0 0 18px",
        padding: 0,
        color: "#cbd5e1",
        fontSize: "0.85rem",
    },

    helpRow: {
        borderRadius: 10,
        padding: "10px 10px 9px 10px",
        background: "rgba(15,23,42,0.95)",
        border: "1px solid rgba(148,163,184,0.6)",
        marginTop: 8,
        display: "flex",
        flexDirection: "column",
        gap: 4,
    },

    helpRowHeader: {
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
    },


    helpPill: {
        padding: "3px 10px",
        borderRadius: 999,
        background: "rgba(59,130,246,0.25)",
        border: "1px solid rgba(59,130,246,0.8)",
        fontSize: "0.8rem",
        color: "#e0f2fe",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
    },

    helpColumnName: {
        fontSize: "0.8rem",
        color: "#cbd5e1",
    },

    helpQuestion: {
        fontSize: "0.8rem",
        color: "#e5e7eb",
    },

    helpExampleRow: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: "0.8rem",
        marginTop: 2,
    },

    helpExampleLabel: {
        color: "#a5b4fc",
    },

    helpExampleCode: {
        background: "rgba(15,23,42,0.9)",
        padding: "2px 6px",
        borderRadius: 6,
        border: "1px solid rgba(148,163,184,0.8)",
        fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        fontSize: "0.8rem",
        color: "#e5e7eb",
    },

    helpExplanation: {
        fontSize: "0.78rem",
        color: "#9ca3af",
    },
};
