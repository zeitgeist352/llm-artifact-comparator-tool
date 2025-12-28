import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ⭐ Güvenli Prism importları
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";

function MyArtifactsPage() {
    const emojiMap = {
        js: "🟨", ts: "🔵", java: "☕", py: "🐍", c: "🟦",
        cpp: "💠", json: "📄", md: "📝", txt: "📃", css: "🎨",
        html: "🌐", yaml: "📦", yml: "📦", pdf: "📕",
        png: "🖼️", jpg: "🖼️", jpeg: "🖼️", unknown: "📁",
    };

    const handleSelectAll = () => {
        if (selectedArtifacts.size === filtered.length) {
            // If all are selected, deselect all
            setSelectedArtifacts(new Set());
        } else {
            // Select all filtered artifacts
            const allIds = new Set(filtered.map(a => a.id));
            setSelectedArtifacts(allIds);
        }
    };

    const [artifacts, setArtifacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [currentFolderId, setCurrentFolderId] = useState(null); // null = root
    const [expandedFolders, setExpandedFolders] = useState(new Set());



    // ⭐ FOLDER MANAGEMENT STATES
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [folders, setFolders] = useState([]);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [selectedArtifacts, setSelectedArtifacts] = useState(new Set());
    const [moveTargetFolder, setMoveTargetFolder] = useState(null);

    // ⭐ PARTICLES
    const [particles, setParticles] = useState([]);

    const [previewArtifact, setPreviewArtifact] = useState(null);
    const [previewURL, setPreviewURL] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewText, setPreviewText] = useState("");
    const [previewLanguage, setPreviewLanguage] = useState("markup");

    // ⭐ TOAST
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);

    const navigate = useNavigate();

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3200);
    };

    /* ================= TOGGLE FOLDER EXPAND/COLLAPSE ================= */
    const toggleFolder = (folderId) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };


    /* ================= RENDER FOLDER TREE ================= */
    /* ================= RENDER COLLAPSIBLE FOLDER TREE ================= */
    const renderFolderTree = (parentId = null, level = 0) => {
        // Get folders with this parent
        const foldersAtLevel = folders.filter(f => {
            if (parentId === null) {
                return !f.parentFolder; // Root level
            }
            return f.parentFolder && f.parentFolder.id === parentId;
        });

        return foldersAtLevel.map(folder => {
            // Check if this folder has children
            const hasChildren = folders.some(f =>
                f.parentFolder && f.parentFolder.id === folder.id
            );
            const isExpanded = expandedFolders.has(folder.id);
            const isSelected = moveTargetFolder === folder.id;

            return (
                <React.Fragment key={folder.id}>
                    {/* ⭐ FOLDER ITEM WITH EXPAND/COLLAPSE */}
                    <div
                        style={{
                            ...styles.folderTreeItem,
                            paddingLeft: `${20 + (level * 25)}px`,
                            ...(isSelected ? styles.folderTreeItemSelected : {}),
                        }}
                    >
                        {/* ⭐ EXPAND/COLLAPSE ARROW */}
                        <span
                            style={{
                                ...styles.expandArrow,
                                visibility: hasChildren ? 'visible' : 'hidden',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (hasChildren) {
                                    toggleFolder(folder.id);
                                }
                            }}
                        >
                        {isExpanded ? '▼' : '▶'}
                    </span>

                        {/* ⭐ FOLDER NAME (clickable to select) */}
                        <div
                            style={styles.folderTreeName}
                            onClick={() => setMoveTargetFolder(folder.id)}
                        >
                            {level > 0 && (
                                <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: '6px' }}>
                                └─
                            </span>
                            )}
                            <span style={{ marginRight: '8px' }}>📁</span>
                            {folder.name}
                        </div>
                    </div>

                    {/* ⭐ SHOW CHILDREN ONLY IF EXPANDED */}
                    {hasChildren && isExpanded && renderFolderTree(folder.id, level + 1)}
                </React.Fragment>
            );
        });
    };



    /* ================= PRISM ================= */
    useEffect(() => {
        if (previewText) Prism.highlightAll();
    }, [previewText]);

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

    /* ================= PAGE SETUP ================= */
    useEffect(() => {
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.backgroundColor = "black";
    }, []);

    /* ================= FETCH FOLDERS ================= */
    useEffect(() => {
        const fetchFolders = async () => {
            console.log("🔵 FETCHING FOLDERS..."); // ⭐ ADD THIS
            try {
                const token = localStorage.getItem("token");
                const response = await fetch("http://localhost:8080/api/artifact-folders/my-folders", {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                console.log("📡 Folders response status:", response.status); // ⭐ ADD THIS

                if (!response.ok) throw new Error("Failed to fetch folders");
                const data = await response.json();

                console.log("📦 Folders data received:", data); // ⭐ ADD THIS
                console.log("📦 Number of folders:", data.length); // ⭐ ADD THIS

                setFolders(data);
            } catch (error) {
                console.error("❌ Error fetching folders:", error);
            }
        };

        fetchFolders();
    }, []);


    /* ================= FETCH ARTIFACTS ================= */
    useEffect(() => {
        // ⭐ Clear selection when changing folders
        setSelectedArtifacts(new Set());
        const fetchArtifacts = async () => {
            setLoading(true); // ⭐ Show loading when switching folders
            try {
                const token = localStorage.getItem("token");

                const url = currentFolderId
                    ? `http://localhost:8080/api/artifacts/folder/${currentFolderId}`
                    : "http://localhost:8080/api/artifacts/my-artifacts";

                const response = await fetch(url, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error("Failed to fetch artifacts");
                const data = await response.json();
                setArtifacts(data);
            } catch (error) {
                console.error("❌ Error fetching artifacts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchArtifacts();
    }, [currentFolderId]);


    /* ================= CREATE FOLDER ================= */
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            triggerToast("⚠ Folder name cannot be empty");
            return;
        }

        try {
            const token = localStorage.getItem("token");

            // ⭐ LOG WHAT WE'RE SENDING
            console.log("🟡 Creating folder with:", {
                name: newFolderName,
                parentFolderId: currentFolderId, // Should be the ID if inside a folder
            });

            const response = await fetch("http://localhost:8080/api/artifact-folders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: newFolderName,
                    parentFolderId: currentFolderId, // This passes the current folder as parent
                }),
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                data = { error: responseText };
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || "Failed to create folder");
            }

            console.log("✅ Folder created:", data);

            // ⭐ REFRESH THE FOLDERS LIST
            const foldersResponse = await fetch("http://localhost:8080/api/artifact-folders/my-folders", {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (foldersResponse.ok) {
                const updatedFolders = await foldersResponse.json();
                console.log("📦 Refreshed folders:", updatedFolders);
                setFolders(updatedFolders);
            }

            setNewFolderName("");
            setShowCreateFolderModal(false);
            triggerToast("✅ Folder created successfully");
        } catch (error) {
            console.error("❌ Error creating folder:", error);
            triggerToast("❌ " + error.message);
        }
    };




    /* ================= MOVE ARTIFACTS TO FOLDER ================= */
    const handleMoveArtifacts = async () => {
        if (selectedArtifacts.size === 0) {
            triggerToast("⚠ Please select artifacts to move");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const artifactIds = Array.from(selectedArtifacts);

            const response = await fetch("http://localhost:8080/api/artifacts/move", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    artifactIds: artifactIds,
                    folderId: moveTargetFolder,
                }),
            });

            if (!response.ok) throw new Error("Failed to move artifacts");

            // ⭐ REFRESH ARTIFACTS LIST AFTER MOVING
            const url = currentFolderId
                ? `http://localhost:8080/api/artifacts/folder/${currentFolderId}`
                : "http://localhost:8080/api/artifacts/my-artifacts";

            const refreshResponse = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (refreshResponse.ok) {
                const updatedArtifacts = await refreshResponse.json();
                setArtifacts(updatedArtifacts);
            }

            setSelectedArtifacts(new Set());
            setShowMoveModal(false);
            setMoveTargetFolder(null);
            triggerToast(`✅ Moved ${artifactIds.length} artifact(s) successfully`);
        } catch (error) {
            console.error("❌ Error moving artifacts:", error);
            triggerToast("❌ Failed to move artifacts");
        }
    };

    /* ================= TOGGLE ARTIFACT SELECTION ================= */
    const toggleArtifactSelection = (artifactId) => {
        const newSelected = new Set(selectedArtifacts);
        if (newSelected.has(artifactId)) {
            newSelected.delete(artifactId);
        } else {
            newSelected.add(artifactId);
        }
        setSelectedArtifacts(newSelected);
    };



    /* ================= EXT HELPERS ================= */
    const extractExtension = (filename) =>
        filename.includes(".") ? filename.split(".").pop().toLowerCase() : "unknown";

    const filtered = artifacts.filter((a) => {
        const ext = extractExtension(a.filename);
        const matchesSearch =
            a.filename.toLowerCase().includes(search.toLowerCase()) ||
            (a.tags || "").toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === "all" || filter === ext;
        return matchesSearch && matchesFilter;
    });

    const fileTypes = ["all", ...new Set(artifacts.map((a) => extractExtension(a.filename)))];

    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

    // Get current folder breadcrumb
    // currentFolderId: number | null

    // currentFolderId: number | null

    const getCurrentFolder = () => {
        if (currentFolderId == null) return null;
        return folders.find((f) => f.id === currentFolderId) || null;
    };

    const getCurrentSubfolders = () => {
        console.log("🔍 Filtering folders for currentFolderId:", currentFolderId);
        console.log("🔍 All folders:", folders);

        if (currentFolderId == null) {
            // Root: parentFolder should be null/undefined
            const rootFolders = folders.filter((f) => {
                const isRoot = !f.parentFolder;
                console.log(`  Folder "${f.name}": isRoot=${isRoot}, parentFolder=`, f.parentFolder);
                return isRoot;
            });
            console.log("🔍 Root folders found:", rootFolders);
            return rootFolders;
        }

        // Subfolders: parentFolder.id should match currentFolderId
        const subFolders = folders.filter((f) => {
            const isChild = f.parentFolder && f.parentFolder.id === currentFolderId;
            console.log(`  Folder "${f.name}": isChild=${isChild}, parentFolder=`, f.parentFolder);
            return isChild;
        });
        console.log("🔍 Subfolders found:", subFolders);
        return subFolders;
    };





    // ⭐ NEW: Build breadcrumb trail
    const getBreadcrumbTrail = () => {
        if (!currentFolderId) return [];
        const trail = [];
        let folder = getCurrentFolder();
        while (folder) {
            trail.unshift(folder);
            folder = folder.parentFolder || null; // because backend sends nested parentFolder
        }
        return trail;
    };


    /* ================= RENDER FOLDER TREE ================= */



    /* ================= PREVIEW HANDLER ================= */
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

            if (!response.ok) throw new Error("Failed to preview file");

            const blob = await response.blob();
            const blobURL = URL.createObjectURL(blob);
            const filename = artifact.filename.toLowerCase();

            if (filename.match(/\.(pdf|png|jpg|jpeg)$/i)) {
                setPreviewURL(blobURL);
            } else if (
                filename.match(/\.(txt|json|java|py|js|md|html|css|ts|c|cpp|yaml|yml)$/i)
            ) {
                const ext = filename.split(".").pop();
                const langMap = {
                    java: "clike", js: "javascript", ts: "javascript",
                    c: "clike", cpp: "clike", json: "javascript",
                    md: "markup", html: "markup", css: "markup",
                    yaml: "markup", yml: "markup", txt: "markup", py: "markup",
                };

                setPreviewLanguage(langMap[ext] || "markup");
                const text = await blob.text();
                setPreviewText(text);
            } else {
                setPreviewText("Preview not supported for this file type.");
            }
        } catch (error) {
            console.error("Preview error:", error);
            setPreviewText("Error loading preview.");
        } finally {
            setPreviewLoading(false);
        }
    };

    /* ================= RENDER ================= */
    return (
        <div style={styles.container}>
            {/* PARTICLE BACKGROUND */}
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

            {/* TOAST */}
            {showToast && <div style={styles.toast}>{toastMessage}</div>}

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <h2 style={styles.title}>My Artifacts</h2>
                <div style={styles.right}>
                    <button
                        style={styles.profileButton}
                        onClick={() => navigate("/researcher")}
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
                <div style={styles.mainContent}>
                    {/* ⭐ BREADCRUMB NAVIGATION */}
                    <div style={styles.breadcrumb}>
                        <button
                            style={{
                                ...styles.breadcrumbItem,
                                ...(currentFolderId === null ? styles.breadcrumbCurrent : {}),
                            }}
                            onClick={() => setCurrentFolderId(null)}
                        >
                            🏠 Root
                        </button>

                        {getBreadcrumbTrail().map((folder, index) => (
                            <React.Fragment key={folder.id}>
                                <span style={styles.breadcrumbSeparator}>/</span>
                                <button
                                    style={{
                                        ...styles.breadcrumbItem,
                                        ...(folder.id === currentFolderId ? styles.breadcrumbCurrent : {}),
                                    }}
                                    onClick={() => setCurrentFolderId(folder.id)}
                                >
                                    📁 {folder.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* ACTION BUTTONS */}
                    <div style={{ textAlign: "center", marginBottom: "30px" }}>
                        <button
                            style={styles.uploadButton}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.06)";
                                e.currentTarget.style.background = "rgba(34,197,94,0.18)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.background = "rgba(34,197,94,0.1)";
                            }}
                            onClick={() => navigate("/upload-artifact")}
                        >
                            Upload, Delete and Tag Artifacts
                        </button>

                        <button
                            style={styles.createFolderButton}
                            onClick={() => setShowCreateFolderModal(true)}
                        >
                            📁 Create Folder
                        </button>

                        {/* ⭐ SELECT ALL BUTTON */}
                        {filtered.length > 0 && (
                            <button
                                style={styles.selectAllButton}
                                onClick={handleSelectAll}
                            >
                                {selectedArtifacts.size === filtered.length
                                    ? "☑️ Deselect All"
                                    : "☐ Select All"}
                            </button>
                        )}

                        {selectedArtifacts.size > 0 && (
                            <button
                                style={styles.moveButton}
                                onClick={() => setShowMoveModal(true)}
                            >
                                📂 Move Selected ({selectedArtifacts.size})
                            </button>
                        )}
                    </div>

                {/* SEARCH AND FILTER */}
                <div style={styles.filterRow}>
                    <input
                        placeholder="Search by filename or tag..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={styles.searchBar}
                    />

                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={styles.filterDropdown}
                    >
                        {fileTypes.map((ext, index) => (
                            <option key={index} value={ext}>
                                {ext === "all" ? "All File Types" : capitalize(ext)}
                            </option>
                        ))}
                    </select>
                </div>

                    {/* ⭐ FOLDERS SECTION */}
                    {/* ⭐ FOLDERS SECTION - CLEANER VERSION */}
                    {getCurrentSubfolders().length > 0 && (
                        <div style={styles.foldersSection}>
                            <h3 style={styles.sectionTitle}>📁 Folders</h3>
                            <div style={styles.folderGrid}>
                                {getCurrentSubfolders().map((folder) => (
                                    <div
                                        key={folder.id}
                                        className="folder-card"
                                        style={styles.folderCard}
                                        onClick={() => {
                                            console.log("📂 Entering folder:", folder.id, folder.name);
                                            setCurrentFolderId(folder.id);
                                        }}
                                    >
                                        <span style={styles.folderIcon}>📁</span>
                                        <span style={styles.folderName}>{folder.name}</span>
                                        <span style={styles.folderArrow}>→</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}



                    {/* ARTIFACTS SECTION */}
                    {loading ? (
                        <p style={styles.loading}>Loading artifacts...</p>
                    ) : filtered.length === 0 ? (
                        <p style={styles.noData}>No artifacts found.</p>
                    ) : (
                        <>
                            <h3 style={styles.sectionTitle}>📄 Artifacts</h3>
                            <div style={styles.grid}>
                                {filtered.map((artifact) => {
                                    const ext = extractExtension(artifact.filename);
                                    const isSelected = selectedArtifacts.has(artifact.id);

                                    return (
                                        <div
                                            key={artifact.id}
                                            style={{
                                                ...styles.card,
                                                ...(isSelected ? styles.cardSelected : {}),
                                            }}
                                            onClick={() => toggleArtifactSelection(artifact.id)}
                                        >
                                            {/* ⭐ REMOVED SELECTION INDICATOR */}

                                            <div style={styles.cardHeader}>
                            <span style={styles.emojiBadge}>
                                {emojiMap[ext] || "📁"}
                            </span>

                                                <h3 style={styles.filename}>{artifact.filename}</h3>

                                                <button
                                                    style={styles.previewButton}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePreview(artifact);
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
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                </button>
                                            </div>

                                            <div style={styles.badgeRow}>
                            <span style={styles.categoryBadge}>
                                {artifact.category || "No Category"}
                            </span>

                                                <span style={styles.tagBadge}>
                                {artifact.tags || "No Tag"}
                            </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}


                </div>

            {/* ======================= CREATE FOLDER MODAL ======================= */}
            {showCreateFolderModal && (
                <div style={styles.modalOverlay} onClick={() => setShowCreateFolderModal(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h2 style={styles.previewTitle}>Create New Folder</h2>
                        <input
                            type="text"
                            placeholder="Enter folder name..."
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            style={styles.modalInput}
                            onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
                        />
                        <div style={styles.modalButtons}>
                            <button
                                style={styles.closeButton}
                                onClick={() => setShowCreateFolderModal(false)}
                            >
                                Cancel
                            </button>
                            <button style={styles.confirmButton} onClick={handleCreateFolder}>
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================= MOVE ARTIFACTS MODAL ======================= */}
            {/* ======================= MOVE ARTIFACTS MODAL ======================= */}
            {showMoveModal && (
                <div style={styles.modalOverlay} onClick={() => setShowMoveModal(false)}>
                    <div
                        style={{
                            ...styles.modalContent,
                            maxWidth: "600px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={styles.previewTitle}>
                            Move {selectedArtifacts.size} Artifact(s)
                        </h2>
                        <p style={{ color: "#93c5fd", marginBottom: "20px", fontSize: "0.95rem" }}>
                            Select destination folder:
                        </p>

                        <div style={styles.folderTreeContainer}>
                            {/* ⭐ ROOT OPTION */}
                            <div
                                style={{
                                    ...styles.folderTreeItem,
                                    ...(moveTargetFolder === null ? styles.folderTreeItemSelected : {}),
                                }}
                            >
                                <span style={{ ...styles.expandArrow, visibility: 'hidden' }}></span>
                                <div
                                    style={styles.folderTreeName}
                                    onClick={() => setMoveTargetFolder(null)}
                                >
                                    <span style={{ marginRight: '8px' }}>🏠</span>
                                    Root Folder
                                </div>
                            </div>

                            {/* ⭐ RENDER FOLDER TREE */}
                            {renderFolderTree()}
                        </div>

                        <div style={styles.modalButtons}>
                            <button
                                style={styles.closeButton}
                                onClick={() => {
                                    setShowMoveModal(false);
                                    setMoveTargetFolder(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                style={styles.confirmButton}
                                onClick={handleMoveArtifacts}
                            >
                                Move
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {/* ======================= PREVIEW MODAL ======================= */}
            {previewArtifact && (
                <div style={styles.modalOverlay} onClick={() => setPreviewArtifact(null)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h2 style={styles.previewTitle}>{previewArtifact.filename}</h2>

                        {previewLoading ? (
                            <p style={{ color: "#93c5fd" }}>Loading preview...</p>
                        ) : (
                            <>
                                {previewURL && previewArtifact.filename.endsWith(".pdf") && (
                                    <embed
                                        src={previewURL}
                                        type="application/pdf"
                                        style={{
                                            width: "100%",
                                            height: "70vh",
                                            borderRadius: "12px",
                                            background: "white",
                                        }}
                                    />
                                )}

                                {previewURL &&
                                    previewArtifact.filename.match(/\.(png|jpg|jpeg)$/i) && (
                                        <img
                                            src={previewURL}
                                            alt="preview"
                                            style={{
                                                maxWidth: "100%",
                                                maxHeight: "70vh",
                                                borderRadius: "12px",
                                            }}
                                        />
                                    )}

                                {previewText && (
                                    <pre
                                        style={{
                                            background: "#0f172a",
                                            color: "#e2e8f0",
                                            padding: "20px",
                                            borderRadius: "12px",
                                            maxHeight: "70vh",
                                            overflowY: "auto",
                                            textAlign: "left",
                                        }}
                                    >
                                        <code className={`language-${previewLanguage}`}>
                                            {previewText}
                                        </code>
                                    </pre>
                                )}
                            </>
                        )}

                        <button
                            style={styles.closeButton}
                            onClick={() => setPreviewArtifact(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes floatParticle {
                    0% { transform: translateY(0); opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-120vh); opacity: 0; }
                }
                
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
    .folder-card:hover {
        transform: scale(1.05);
        box-shadow: 0 0 16px rgba(251,146,60,0.6) !important;
        background: rgba(251,146,60,0.15) !important;
    }

    .folder-card:active {
        transform: scale(0.98);
    }
    
    .folder-option:hover {
        background: rgba(255,255,255,0.08) !important;
        border-color: rgba(96,165,250,0.4) !important;
    }

                @keyframes toastFadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -10px); }
                    10% { opacity: 1; transform: translate(-50%, 0px); }
                    90% { opacity: 1; transform: translate(-50%, 0px); }
                    100% { opacity: 0; transform: translate(-50%, -10px); }
                }
                
                 /* ⭐ ADD FOLDER TREE HOVER */
    div[class*="folderTreeItem"]:hover:not([style*="rgba(168,85,247"]) {
        background: rgba(255,255,255,0.1) !important;
        border-color: rgba(96,165,250,0.5) !important;
    }
                
                
            `}</style>
        </div>
    );
}

/* -------------------------------------------------- */
/* 🎨 STYLES */
/* -------------------------------------------------- */
const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        paddingBottom: "60px",
        overflow: "hidden",
        position: "relative",
    },

    expandArrow: {
        cursor: "pointer",
        fontSize: "0.7rem",
        color: "#93c5fd",
        width: "16px",
        height: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.2s",
        flexShrink: 0,
    },

    folderTreeName: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        color: "#fff",
        fontSize: "0.95rem",
        fontWeight: "500",
        cursor: "pointer",
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

    folderTreeContainer: {
        maxHeight: "400px",
        overflowY: "auto",
        marginBottom: "20px",
        background: "rgba(0,0,0,0.2)",
        borderRadius: "10px",
        padding: "10px",
        border: "1px solid rgba(255,255,255,0.1)",
    },

    folderTreeItem: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 12px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        marginBottom: "6px",
        cursor: "pointer",
        transition: "all 0.2s",
        userSelect: "none",
    },
    folderTreeItemSelected: {
        background: "rgba(168,85,247,0.25)",
        border: "2px solid rgba(168,85,247,0.7)",
        boxShadow: "0 0 12px rgba(168,85,247,0.4)",
    },

    toast: {
        position: "fixed",
        top: "90px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(14,165,233,0.22)",
        border: "1.5px solid rgba(14,165,233,0.5)",
        borderRadius: "12px",
        padding: "12px 20px",
        color: "#7dd3fc",
        fontWeight: "600",
        fontSize: "0.95rem",
        backdropFilter: "blur(6px)",
        boxShadow: "0 0 12px rgba(14,165,233,0.45)",
        zIndex: 9999,
        animation: "toastFadeInOut 3.2s ease forwards",
    },

    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "relative",
        zIndex: 10,
    },

    title: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#60a5fa",
    },

    right: {
        display: "flex",
        alignItems: "center",
        gap: "15px",
    },

    profileButton: {
        background: "rgba(239,68,68,0.3)",
        border: "2px solid rgba(239,68,68,0.4)",
        color: "#fca5a5",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontSize: "0.95rem",
        fontWeight: "600",
        transition: "all 0.3s ease",
        boxShadow: "0 0 8px rgba(239,68,68,0.35)",
    },

    mainContent: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px",
        position: "relative",
        zIndex: 1,
    },

    /* ⭐ BREADCRUMB */
    breadcrumb: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "25px",
        padding: "12px 18px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.1)",
        flexWrap: "wrap", // ⭐ Allow wrapping for long paths
    },

    breadcrumbItem: {
        background: "transparent",
        border: "none",
        color: "#60a5fa",
        cursor: "pointer",
        fontSize: "1rem",
        fontWeight: "600",
        transition: "0.2s",
        padding: "4px 8px",
        borderRadius: "6px",
    },

    breadcrumbSeparator: {
        color: "rgba(255,255,255,0.4)",
        userSelect: "none",
    },

    breadcrumbCurrent: {
        color: "#fff",
        background: "rgba(96,165,250,0.2)",
        cursor: "default",
    },


    folderCard: {
        background: "rgba(251,146,60,0.1)",
        borderRadius: "12px",
        padding: "20px",
        border: "2px solid rgba(251,146,60,0.4)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow: "0 0 8px rgba(251,146,60,0.3)",
        userSelect: "none", // ⭐ Prevent text selection when clicking
    },
/*
    selectionIndicator: {
        position: "absolute",
        top: "15px",
        right: "15px",
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        border: "2px solid rgba(168,85,247,0.4)",
        background: "rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1rem",
        fontWeight: "bold",
        color: "transparent",
        transition: "all 0.3s ease",
    },

    selectionIndicatorActive: {
        background: "rgba(168,85,247,0.3)",
        border: "2px solid rgba(168,85,247,0.8)",
        color: "#c084fc",
        boxShadow: "0 0 12px rgba(168,85,247,0.5)",
    },
*/


    uploadButton: {
        padding: "15px 35px",
        background: "rgba(34,197,94,0.1)",
        border: "2px solid rgba(34,197,94,0.6)",
        color: "#4ade80",
        borderRadius: "12px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "1.1rem",
        transition: "all 0.3s ease",
        boxShadow: "0 0 12px rgba(34,197,94,0.35)",
        marginRight: "15px",
    },

    createFolderButton: {
        padding: "15px 35px",
        background: "rgba(251,146,60,0.1)",
        border: "2px solid rgba(251,146,60,0.6)",
        color: "#fb923c",
        borderRadius: "12px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "1.1rem",
        transition: "all 0.3s ease",
        boxShadow: "0 0 12px rgba(251,146,60,0.35)",
        marginRight: "15px",
    },

    moveButton: {
        padding: "15px 35px",
        background: "rgba(168,85,247,0.1)",
        border: "2px solid rgba(168,85,247,0.6)",
        color: "#a855f7",
        borderRadius: "12px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "1.1rem",
        transition: "all 0.3s ease",
        boxShadow: "0 0 12px rgba(168,85,247,0.35)",
    },

    filterRow: {
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        marginBottom: "35px",
        flexWrap: "wrap",
    },

    searchBar: {
        width: "300px",
        padding: "12px 18px",
        borderRadius: "12px",
        border: "2px solid rgba(96,165,250,0.35)",
        background: "rgba(96,165,250,0.05)",
        color: "#fff",
        fontSize: "1rem",
        outline: "none",
        transition: "all 0.3s ease",
    },

    filterDropdown: {
        width: "200px",
        padding: "12px 18px",
        paddingRight: "48px",
        borderRadius: "12px",
        border: "2px solid rgba(96,165,250,0.35)",
        background: "rgba(96,165,250,0.05)",
        color: "#93c5fd",
        fontSize: "1rem",
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
        backgroundImage:
            "url('data:image/svg+xml;utf8,<svg fill=\"%23a5b4fc\" height=\"20\" viewBox=\"0 0 24 24\" width=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
        backgroundSize: "20px",
        transition: "all 0.3s ease",
    },

    selectAllButton: {
        padding: "15px 35px",
        background: "rgba(139,92,246,0.1)",
        border: "2px solid rgba(139,92,246,0.6)",
        color: "#a78bfa",
        borderRadius: "12px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "1.1rem",
        transition: "all 0.3s ease",
        boxShadow: "0 0 12px rgba(139,92,246,0.35)",
        marginRight: "15px",
    },

    sectionTitle: {
        fontSize: "1.3rem",
        fontWeight: "700",
        color: "#93c5fd",
        marginBottom: "20px",
    },

    /* ⭐ FOLDERS */
    foldersSection: {
        marginBottom: "40px",
    },

    folderGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "30px",
    },


    folderIcon: {
        fontSize: "2rem",
    },

    folderName: {
        fontSize: "1.1rem",
        fontWeight: "600",
        color: "#fff",
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    folderArrow: {
        fontSize: "1.5rem",
        color: "rgba(251,146,60,0.6)",
        transition: "transform 0.3s ease",
    },

    loading: { textAlign: "center", color: "#94a3b8" },

    noData: {
        textAlign: "center",
        color: "rgba(255,255,255,0.6)",
        fontStyle: "italic",
        marginTop: "20px",
    },

    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "25px",
    },

    card: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "15px",
        padding: "25px",
        border: "2px solid rgba(96,165,250,0.4)",
        boxShadow: "0 0 8px rgba(96,165,250,0.5)",
        position: "relative",
    },

    cardSelected: {
        border: "2px solid rgba(168,85,247,0.8)",
        boxShadow: "0 0 16px rgba(168,85,247,0.6)",
        background: "rgba(168,85,247,0.1)",
    },

    checkbox: {
        position: "absolute",
        top: "15px",
        left: "15px",
        width: "20px",
        height: "20px",
        cursor: "pointer",
        accentColor: "#a855f7",
    },

    cardHeader: {
        display: "grid",
        gridTemplateColumns: "40px 1fr 40px",
        alignItems: "center",
        gap: "12px",
        marginBottom: "10px",
        // ⭐ REMOVE marginLeft since no checkbox
    },

    emojiBadge: {
        fontSize: "1.35rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    filename: {
        fontSize: "1.1rem",
        fontWeight: "600",
        margin: 0,
        color: "#fff",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    badgeRow: {
        display: "flex",
        gap: "10px",
        marginTop: "10px",
        flexWrap: "wrap",
        // ⭐ REMOVE marginLeft
    },

    categoryBadge: {
        background: "rgba(96,165,250,0.22)",
        border: "1px solid rgba(96,165,250,0.55)",
        padding: "4px 10px",
        borderRadius: "10px",
        fontSize: "0.80rem",
        color: "#bfdbfe",
        fontWeight: 600,
    },

    tagBadge: {
        background: "rgba(251,146,60,0.22)",
        border: "1px solid rgba(251,146,60,0.55)",
        padding: "4px 10px",
        borderRadius: "10px",
        fontSize: "0.80rem",
        color: "#fed7aa",
        fontWeight: 600,
    },

    previewButton: {
        background: "rgba(96,165,250,0.15)",
        border: "2px solid rgba(96,165,250,0.4)",
        color: "#60a5fa",
        borderRadius: "8px",
        cursor: "pointer",
        padding: "4px 8px",
        transition: "0.2s",
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
        maxWidth: "600px",
        background: "rgba(17,24,39,0.95)",
        padding: "30px",
        borderRadius: "12px",
        border: "2px solid rgba(96,165,250,0.4)",
        boxShadow: "0 0 20px rgba(96,165,250,0.6)",
        textAlign: "center",
    },

    previewTitle: {
        color: "#60a5fa",
        marginBottom: "20px",
    },

    modalInput: {
        width: "100%",
        padding: "12px 18px",
        borderRadius: "10px",
        border: "2px solid rgba(96,165,250,0.4)",
        background: "rgba(96,165,250,0.05)",
        color: "#fff",
        fontSize: "1rem",
        outline: "none",
        marginBottom: "20px",
        boxSizing: "border-box",
    },

    modalButtons: {
        display: "flex",
        gap: "15px",
        justifyContent: "center",
    },

    closeButton: {
        padding: "10px 25px",
        background: "rgba(239,68,68,0.3)",
        border: "2px solid rgba(239,68,68,0.5)",
        color: "#fca5a5",
        borderRadius: "8px",
        fontSize: "1rem",
        cursor: "pointer",
        fontWeight: "600",
        transition: "0.3s",
    },

    confirmButton: {
        padding: "10px 25px",
        background: "rgba(34,197,94,0.3)",
        border: "2px solid rgba(34,197,94,0.5)",
        color: "#4ade80",
        borderRadius: "8px",
        fontSize: "1rem",
        cursor: "pointer",
        fontWeight: "600",
        transition: "0.3s",
    },

    /* ⭐ FOLDER LIST IN MOVE MODAL */
    folderList: {
        maxHeight: "300px",
        overflowY: "auto",
        marginBottom: "20px",
        textAlign: "left",
    },

    folderOption: {
        padding: "12px 18px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        marginBottom: "10px",
        cursor: "pointer",
        transition: "0.2s",
        color: "#fff",
        fontSize: "0.95rem",
    },

    folderOptionSelected: {
        background: "rgba(168,85,247,0.2)",
        border: "2px solid rgba(168,85,247,0.6)",
        color: "#c084fc",
    },
};

export default MyArtifactsPage;
