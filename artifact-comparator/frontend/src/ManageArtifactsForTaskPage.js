// ManageArtifactsForTaskPage.js
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/* -----------------------------------------------------------
   ⭐ PRISMJS – RENKLİ KOD ÖNİZLEME
----------------------------------------------------------- */
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";

/* ============================================================
   PARTICLES (ManageSingleTask / AddTaskPage ile aynı)
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

/* -----------------------------------------------------------
   FILE ICON
----------------------------------------------------------- */
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

/* -----------------------------------------------------------
   TAG HELPER – AddTaskPage ile aynı mantık
   (art.tags içinde ORIGINAL / CLONE / REFERENCE / FAILURE / DIFF arıyor)
----------------------------------------------------------- */
const getTagKeyFromArtifact = (artifact) => {
    if (!artifact || !artifact.tags) return null;
    const tagsUpper = String(artifact.tags).toUpperCase();

    if (tagsUpper.includes("ORIGINAL")) return "ORIGINAL";
    if (tagsUpper.includes("CLONE")) return "CLONE";
    if (tagsUpper.includes("REFERENCE")) return "REFERENCE";
    if (tagsUpper.includes("FAILURE")) return "FAILURE";
    if (tagsUpper.includes("DIFF")) return "DIFF";

    return null;
};

/* -----------------------------------------------------------
   PAGE
----------------------------------------------------------- */
function ManageArtifactsForTaskPage() {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const [allArtifacts, setAllArtifacts] = useState([]);
    const [selectedArtifacts, setSelectedArtifacts] = useState([]);
    const [artifactLimit, setArtifactLimit] = useState(null);

    // 🔹 KLASÖR STATE (AddTaskPage ile uyumlu)
    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [breadcrumb, setBreadcrumb] = useState([{ id: null, name: "Root" }]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const [toast, setToast] = useState(null);

    // 🔹 Study Type (AddTaskPage'deki mantık için)
    const [studyType, setStudyType] = useState(null);

    const showToast = (text, type = "success") => {
        setToast({ message: text, type });
        setTimeout(() => setToast(null), 2000);
    };

    /* AddTaskPage ile aynı label helper (sadece mesajlarda kullanıyoruz) */
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

    /* -----------------------------------------------------------
       ⭐ PREVIEW STATE
    ----------------------------------------------------------- */
    const [previewArtifact, setPreviewArtifact] = useState(null);
    const [previewURL, setPreviewURL] = useState("");
    const [previewText, setPreviewText] = useState("");
    const [previewLanguage, setPreviewLanguage] = useState("markup");
    const [previewLoading, setPreviewLoading] = useState(false);

    /* -----------------------------------------------------------
       ⭐ PRISM HIGHLIGHT
    ----------------------------------------------------------- */
    useEffect(() => {
        if (previewText) Prism.highlightAll();
    }, [previewText]);

    /* -----------------------------------------------------------
       ⭐ PREVIEW HANDLER
    ----------------------------------------------------------- */
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
       KLASÖR + ARTEFACT FETCH (Root / Folder)
       (AddTaskPage ile uyumlu mantık)
    ============================================================ */
    async function fetchFolderContent(folderId) {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            // 🔹 Folders: root vs subfolders
            try {
                const folderUrl =
                    folderId === null
                        ? "http://localhost:8080/api/artifact-folders/root"
                        : `http://localhost:8080/api/artifact-folders/subfolders/${folderId}`;

                const folderRes = await fetch(folderUrl, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (folderRes.ok) {
                    const folderData = await folderRes.json();
                    setFolders(folderData);
                } else {
                    setFolders([]);
                }
            } catch {
                setFolders([]);
            }

            // 🔹 Artifacts: root vs folder
            const artifactUrl =
                folderId === null
                    ? "http://localhost:8080/api/artifacts/my-artifacts"
                    : `http://localhost:8080/api/artifacts/folder/${folderId}`;

            try {
                const artifactsRes = await fetch(artifactUrl, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (artifactsRes.ok) {
                    const artifacts = await artifactsRes.json();
                    setAllArtifacts(artifacts);
                } else {
                    setAllArtifacts([]);
                }
            } catch {
                setAllArtifacts([]);
            }
        } catch {
            showToast("Failed to load artifacts", "error");
        } finally {
            setLoading(false);
        }
    }

    /* -----------------------------------------------------------
       LOAD (Task + Root klasörü + artefactlar)
    ----------------------------------------------------------- */
    useEffect(() => {
        const load = async () => {
            try {
                // 🔹 Root klasör + my-artifacts
                await fetchFolderContent(null);

                // 🔹 Task detayları
                const res2 = await fetch(
                    `http://localhost:8080/api/tasks/details/${taskId}`
                );
                const task = await res2.json();

                setSelectedArtifacts(task.artifacts.map((a) => a.id));
                setArtifactLimit(task.artifactCount);

                // 🔹 StudyType'ı task'tan tahmin et (backend'e göre 2-3 ihtimali deniyoruz)
                let sType = null;
                if (task.studyType) {
                    sType = task.studyType;
                } else if (task.study && task.study.studyType) {
                    sType = task.study.studyType;
                } else if (task.study_type) {
                    sType = task.study_type;
                }
                if (sType) setStudyType(sType);

                // 🔹 Breadcrumb & currentFolder reset
                setCurrentFolderId(null);
                setBreadcrumb([{ id: null, name: "Root" }]);
            } catch {
                showToast("Failed to load data", "error");
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskId]);

    /* ============================================================
       FOLDER NAVIGATION HANDLERS
    ============================================================ */
    const handleFolderClick = (folder) => {
        setCurrentFolderId(folder.id);
        setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
        fetchFolderContent(folder.id);
    };

    const handleBreadcrumbClick = (index) => {
        const target = breadcrumb[index];
        setBreadcrumb(breadcrumb.slice(0, index + 1));
        setCurrentFolderId(target.id);
        fetchFolderContent(target.id);
    };

    /* ============================================================
       DYNAMIC FILE TYPES (AddTaskPage tarzı)
    ============================================================ */
    const getUniqueExtensions = () => {
        const extensions = new Set();
        allArtifacts.forEach((art) => {
            const ext = art.filename.split(".").pop().toLowerCase();
            extensions.add(ext);
        });
        return Array.from(extensions).sort();
    };

    const uniqueExtensions = getUniqueExtensions();

    /* ============================================================
       STUDY TYPE BASED EXTENSION FILTER (AddTaskPage ile aynı mantık)
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

        CUSTOM: null, // tüm dosyalara izin
    };

    const allowedExts =
        studyType && allowedExtensionsByType[studyType]
            ? allowedExtensionsByType[studyType]
            : null;

    /* -----------------------------------------------------------
       SELECT HANDLER
    ----------------------------------------------------------- */
    const toggleArtifact = (id) => {
        let list = [...selectedArtifacts];

        if (list.includes(id)) {
            list = list.filter((x) => x !== id);
        } else {
            if (artifactLimit != null && list.length >= artifactLimit) {
                showToast(
                    `You must select exactly ${artifactLimit} artifacts`,
                    "error"
                );
                return;
            }
            list.push(id); // ⭐ sıralı ekleme
        }

        setSelectedArtifacts(list);
    };

    /* -----------------------------------------------------------
       SAVE HANDLER – AddTaskPage’deki mantığa göre TAG + COUNT validation
    ----------------------------------------------------------- */
    const handleSave = async () => {
        setSaving(true);
        try {
            const idsArray = selectedArtifacts;

            // 1) Sayı kontrolü (artifactCount ile)
            if (artifactLimit != null && idsArray.length !== artifactLimit) {
                showToast(
                    `You must select exactly ${artifactLimit} artifacts`,
                    "error"
                );
                setSaving(false);
                return;
            }

            // 3) Hepsi OK → backend'e gönder
            const res = await fetch(
                `http://localhost:8080/api/tasks/update-artifacts/${taskId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        artifactIds: idsArray,
                    }),
                }
            );

            if (!res.ok) {
                showToast(await res.text(), "error");
            } else {
                showToast("Artifacts updated!", "success");
                setTimeout(() => navigate(-1), 900);
            }
        } catch {
            showToast("Server error!", "error");
        } finally {
            setSaving(false);
        }
    };

    /* ============================================================
       FILTERED ARTIFACTS (Study Type + Search + Dropdown)
    ============================================================ */
    const filteredArtifacts = allArtifacts.filter((art) => {
        const lower = art.filename.toLowerCase();
        const ext = lower.split(".").pop();

        // 1) Study type’a göre extension kısıtlaması
        if (allowedExts && !allowedExts.includes(ext)) {
            return false;
        }

        // 2) Search match
        const matchesSearch = lower.includes(search.toLowerCase());

        // 3) Dropdown filter
        const matchesFilter = filter === "all" || filter === ext;

        return matchesSearch && matchesFilter;
    });

    const selectedList = selectedArtifacts
        .map((id) => allArtifacts.find((a) => a.id === id))
        .filter(Boolean);

    return (
        <div style={styles.container}>
            <FloatingParticles />

            {/* TOAST – ManageSingleTask tarzı, üst orta */}
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

            {/* NAVBAR – ManageSingleTask tarzı */}
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>
                    Manage Artifacts for Task #{taskId}
                </h2>

                <div style={{ display: "flex", gap: 12 }}>
                    <button
                        className="manage-btn"
                        style={styles.uploadButton}
                        onClick={() => navigate("/upload-artifact")}
                    >
                        ⬆️ Upload New Artifact
                    </button>

                    <button
                        className="manage-btn"
                        style={styles.saveInNavbar}
                        disabled={saving}
                        onClick={handleSave}
                    >
                        {saving ? "Saving…" : "💾 Save Changes"}
                    </button>

                    <button
                        className="back-btn"
                        style={styles.backButton}
                        onClick={() => navigate(-1)}
                    >
                        ← Back
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div style={styles.content}>
                <div style={styles.mainCard}>
                    {/* SELECTED PREVIEW */}
                    <div style={styles.sectionBlock}>
                        <h3 style={styles.sectionTitle}>
                            Selected Artifacts ({selectedList.length}
                            {artifactLimit != null ? `/${artifactLimit}` : ""})
                        </h3>
                        <p style={styles.sectionDescription}>
                            These artifacts are currently linked to this task.
                        </p>

                        <div style={styles.previewOuter}>
                            <div style={styles.previewFlex}>
                                {selectedList.length ? (
                                    selectedList.map((art) => (
                                        <div
                                            key={art.id}
                                            style={styles.previewCard}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "1.8rem",
                                                    marginBottom: "8px",
                                                }}
                                            >
                                                {getFileIcon(art.filename)}
                                            </div>

                                            <div
                                                style={styles.previewFilename}
                                            >
                                                {art.filename}
                                            </div>

                                            <button
                                                style={styles.removeBtn}
                                                onClick={() =>
                                                    toggleArtifact(art.id)
                                                }
                                            >
                                                ✖
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p style={styles.noCriteria}>
                                        No artifacts selected yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SEARCH + FILTER */}
                    <div style={styles.sectionBlock}>
                        <div style={styles.sectionHeaderRow}>
                            <div>
                                <h3 style={styles.sectionTitle}>
                                    All Available Artifacts
                                </h3>
                                <p style={styles.sectionDescription}>
                                    Search, filter, and tap to link artifacts to
                                    this task.
                                </p>
                            </div>
                        </div>

                        {/* 🔹 BREADCRUMB + FOLDER GRID (AddTaskPage ile aynı fikir) */}
                        <div style={styles.folderSection}>
                            <div style={styles.breadcrumbRow}>
                                {breadcrumb.map((item, index) => (
                                    <React.Fragment
                                        key={item.id ?? `root-${index}`}
                                    >
                                        <span
                                            style={
                                                index ===
                                                breadcrumb.length - 1
                                                    ? styles.breadcrumbActive
                                                    : styles.breadcrumbItem
                                            }
                                            onClick={() =>
                                                index !==
                                                breadcrumb.length - 1 &&
                                                handleBreadcrumbClick(index)
                                            }
                                        >
                                            {item.name}
                                        </span>
                                        {index <
                                            breadcrumb.length - 1 && (
                                                <span
                                                    style={
                                                        styles.breadcrumbSeparator
                                                    }
                                                >
                                                /
                                            </span>
                                            )}
                                    </React.Fragment>
                                ))}
                            </div>

                            {folders && folders.length > 0 && (
                                <div style={styles.folderGrid}>
                                    {folders.map((folder) => (
                                        <div
                                            key={folder.id}
                                            style={styles.folderCard}
                                            onClick={() =>
                                                handleFolderClick(folder)
                                            }
                                        >
                                            <span style={styles.folderIcon}>
                                                📁
                                            </span>
                                            <span style={styles.folderName}>
                                                {folder.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={styles.filterRow}>
                            <input
                                type="text"
                                placeholder="🔍 Search artifacts…"
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
                                    All Types (
                                    {allowedExts
                                        ? allArtifacts.filter((a) =>
                                            allowedExts.includes(
                                                a.filename
                                                    .split(".")
                                                    .pop()
                                                    .toLowerCase()
                                            )
                                        ).length
                                        : allArtifacts.length}
                                    )
                                </option>
                                {(allowedExts
                                        ? uniqueExtensions.filter((ext) =>
                                            allowedExts.includes(ext)
                                        )
                                        : uniqueExtensions
                                ).map((ext) => {
                                    const count = allArtifacts.filter(
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

                        {/* ARTIFACT LIST */}
                        {loading ? (
                            <p style={styles.loading}>Loading…</p>
                        ) : (
                            <div style={styles.list}>
                                {filteredArtifacts.map((art) => {
                                    const isSelected =
                                        selectedArtifacts.includes(art.id);

                                    return (
                                        <div
                                            key={art.id}
                                            style={{
                                                ...styles.card,
                                                border: isSelected
                                                    ? "2px solid #38bdf8"
                                                    : "1px solid rgba(255,255,255,0.12)",
                                                background: isSelected
                                                    ? "rgba(56,189,248,0.10)"
                                                    : "rgba(255,255,255,0.05)",
                                            }}
                                            onClick={() =>
                                                toggleArtifact(art.id)
                                            }
                                        >
                                            <div style={styles.cardHeader}>
                                                {/* ICON */}
                                                <div
                                                    style={{
                                                        fontSize: "1.8rem",
                                                        marginRight: "12px",
                                                    }}
                                                >
                                                    {getFileIcon(art.filename)}
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <h3
                                                        style={styles.filename}
                                                    >
                                                        {art.filename}
                                                    </h3>
                                                </div>

                                                {/* BADGES + GÖZ */}
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                    }}
                                                >
                                                    <span
                                                        style={styles.typeBadge}
                                                    >
                                                        {art.category ||
                                                            "No Category"}
                                                    </span>

                                                    <span
                                                        style={styles.tagBadge}
                                                    >
                                                        {art.tags
                                                            ? art.tags
                                                            : "No Tag"}
                                                    </span>

                                                    {/* GÖZ ICON (Preview) */}
                                                    <div
                                                        className="eye-hover"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePreview(art);
                                                        }}
                                                        style={
                                                            styles.eyeButton
                                                        }
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
                                                            <circle
                                                                cx="12"
                                                                cy="12"
                                                                r="3"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {isSelected ? (
                                                <p style={styles.selectedTag}>
                                                    ✔ Selected
                                                </p>
                                            ) : (
                                                <p
                                                    style={styles.unselectedTag}
                                                >
                                                    Tap to add
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* -----------------------------------------------------------
               ⭐ PREVIEW MODAL (ManageSingleTask ile aynı tema)
            ----------------------------------------------------------- */}
            {previewArtifact && (
                <div
                    style={styles.modalOverlay}
                    onClick={() => setPreviewArtifact(null)}
                >
                    <div
                        style={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={styles.previewTitle}>
                            {previewArtifact.filename}
                        </h2>

                        {previewLoading ? (
                            <p style={{ color: "#93c5fd" }}>
                                Loading preview...
                            </p>
                        ) : (
                            <>
                                {/* PDF */}
                                {previewURL &&
                                    previewArtifact.filename.endsWith(
                                        ".pdf"
                                    ) && (
                                        <embed
                                            src={previewURL}
                                            type="application/pdf"
                                            style={styles.previewPDF}
                                        />
                                    )}

                                {/* Image */}
                                {previewURL &&
                                    previewArtifact.filename.match(
                                        /\.(png|jpg|jpeg)$/i
                                    ) && (
                                        <img
                                            src={previewURL}
                                            alt="preview"
                                            style={styles.previewImage}
                                        />
                                    )}

                                {/* Code / Text */}
                                {previewText && (
                                    <pre style={styles.previewPre}>
                                        <code
                                            className={`language-${previewLanguage}`}
                                        >
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

/* -----------------------------------------------------------
   STYLES – ManageSingleTaskPage temasıyla uyumlu
----------------------------------------------------------- */
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

    tagBadge: {
        background: "rgba(251,146,60,0.22)", // turuncu soft
        border: "1px solid rgba(251,146,60,0.55)",
        padding: "4px 10px",
        borderRadius: "10px",
        fontSize: "0.78rem",
        color: "#fdba74",
        fontWeight: 600,
        flexShrink: 0,
    },

    /* TOAST – üst orta */
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

    sectionBlock: {
        marginTop: "18px",
        marginBottom: "18px",
        paddingTop: "14px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
    },

    sectionHeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "12px",
    },

    saveInNavbar: {
        background: "linear-gradient(135deg, #16a34a, #4ade80)",
        border: "none",
        borderRadius: "10px",
        padding: "8px 18px",
        fontWeight: "700",
        color: "#fff",
        cursor: "pointer",
        boxShadow: "0 0 8px rgba(34,197,94,0.35)",
        transition: "0.25s",
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

    /* SELECTED PREVIEW */
    previewOuter: {
        display: "flex",
        justifyContent: "center",
        width: "100%",
    },

    previewFlex: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "18px",
        maxWidth: "760px",
        width: "100%",
    },

    previewCard: {
        width: "120px",
        height: "120px",
        borderRadius: "16px",
        background: "rgba(56,189,248,0.08)",
        border: "2px solid rgba(56,189,248,0.45)",
        boxShadow: "0 0 18px rgba(56,189,248,0.35)",
        padding: "10px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "#dbeafe",
    },

    previewFilename: {
        maxWidth: "100%",
        wordBreak: "break-word",
    },

    removeBtn: {
        position: "absolute",
        top: "8px",
        right: "8px",
        background: "rgba(239,68,68,0.4)",
        color: "#fecaca",
        border: "1px solid rgba(239,68,68,0.7)",
        borderRadius: "8px",
        padding: "2px 6px",
        cursor: "pointer",
    },

    /* FOLDER SECTION */
    folderSection: {
        marginBottom: "16px",
    },
    breadcrumbRow: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "0.85rem",
        marginBottom: "10px",
        flexWrap: "wrap",
    },
    breadcrumbItem: {
        cursor: "pointer",
        color: "#60a5fa",
        opacity: 0.9,
    },
    breadcrumbActive: {
        fontWeight: 700,
        color: "#e5e7eb",
    },
    breadcrumbSeparator: {
        color: "rgba(148,163,184,0.8)",
    },
    folderGrid: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginBottom: "8px",
    },
    folderCard: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        borderRadius: "10px",
        background: "rgba(251,191,36,0.10)",
        border: "1px solid rgba(251,191,36,0.45)",
        cursor: "pointer",
        fontSize: "0.9rem",
        transition: "0.25s",
    },
    folderIcon: {
        fontSize: "1.1rem",
    },
    folderName: {
        whiteSpace: "nowrap",
    },

    /* FILTER ROW */
    filterRow: {
        maxWidth: "900px",
        margin: "0 auto 25px auto",
        display: "flex",
        gap: "18px",
    },

    searchInput: {
        flex: 1,
        padding: "14px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "#fff",
    },

    filterSelect: {
        width: "200px",
        padding: "14px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "#fff",
    },

    /* LIST */
    list: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        maxWidth: "900px",
        margin: "0 auto",
    },

    card: {
        padding: "18px",
        borderRadius: "14px",
        cursor: "pointer",
        transition: "0.25s",
    },

    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "6px",
    },

    filename: {
        fontSize: "1.05rem",
        fontWeight: 600,
        color: "#e2e8f0",
        margin: 0,
    },

    typeBadge: {
        background: "rgba(56,189,248,0.25)",
        border: "1px solid rgba(56,189,248,0.5)",
        padding: "4px 10px",
        borderRadius: "10px",
        fontSize: "0.80rem",
        color: "#bae6fd",
        fontWeight: 600,
    },

    extensionBadge: {
        background: "rgba(192,132,252,0.22)",
        border: "1px solid rgba(192,132,252,0.55)",
        padding: "4px 10px",
        borderRadius: "10px",
        fontSize: "0.78rem",
        color: "#e9d5ff",
        fontWeight: 600,
        marginLeft: "10px",
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

    selectedTag: { color: "#38bdf8", fontWeight: 600 },
    unselectedTag: { color: "#94a3b8" },

    loading: {
        textAlign: "center",
        color: "#94a3b8",
    },

    noCriteria: {
        opacity: 0.7,
        fontStyle: "italic",
    },

    /* FLOATING SAVE BUTTON */
    floatingSave: {
        position: "fixed",
        bottom: "28px",
        right: "28px",
        background: "linear-gradient(135deg, #16a34a, #4ade80)",
        border: "none",
        padding: "16px 28px",
        borderRadius: "14px",
        color: "white",
        fontWeight: 700,
        fontSize: "1rem",
        cursor: "pointer",
        boxShadow: "0 0 18px rgba(34,197,94,0.55)",
        transition: "0.25s",
        zIndex: 200,
    },

    /* UPLOAD BUTTON (manage-btn hover ile aynı mavi tonlar) */
    uploadButton: {
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
        whiteSpace: "nowrap",
    },

    /* MODAL (preview) */
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
   HOVER EFFECTS (ManageSingleTask / AddTaskPage ile aynı)
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

        // Manage button hover (mavi) – Upload için de kullanılıyor
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

export default ManageArtifactsForTaskPage;
