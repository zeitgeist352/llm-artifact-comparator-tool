import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function UploadArtifactPage() {
    const { studyId } = useParams();
    const navigate = useNavigate();

    const [userFiles, setUserFiles] = useState([]);
    const [showTagModal, setShowTagModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [category, setCategory] = useState("");
    const [categoryOption, setCategoryOption] = useState("");
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");

    // ⭐ FOLDER STATES
    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [selectedArtifacts, setSelectedArtifacts] = useState(new Set());
    const [moveTargetFolder, setMoveTargetFolder] = useState(null);
    const [expandedFolders, setExpandedFolders] = useState(new Set());

    // ⭐ TOAST
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3200);
    };

    const autoTagActive = !!categoryOption;
    const saveDisabled = category === "Code" && !categoryOption;

    /* ================= FETCH FOLDERS ================= */
    useEffect(() => {
        const fetchFolders = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch("http://localhost:8080/api/artifact-folders/my-folders", {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error("Failed to fetch folders");
                const data = await response.json();
                setFolders(data);
            } catch (error) {
                console.error("❌ Error fetching folders:", error);
            }
        };

        fetchFolders();
    }, []);

    /* ================= FETCH FILES ================= */
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/upload-artifact");
            return;
        }

        const url = currentFolderId
            ? `http://localhost:8080/api/artifacts/folder/${currentFolderId}`
            : `http://localhost:8080/api/artifacts/my-artifacts`;

        fetch(url, {
            credentials: "include",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => {
                if (res.status === 401 || res.status === 403) {
                    handleExpiredToken();
                    return [];
                }
                if (!res.ok) return [];
                return res.json();
            })
            .then((data) => {
                if (!Array.isArray(data)) data = [];
                setUserFiles(data);
            })
            .catch(() => setUserFiles([]));

        // Clear selection when changing folders
        setSelectedArtifacts(new Set());
    }, [currentFolderId]);

    const handleExpiredToken = () => {
        alert("🔒 Your session has expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    /* ================= FOLDER NAVIGATION ================= */
    const getCurrentFolder = () => {
        if (currentFolderId == null) return null;
        return folders.find((f) => f.id === currentFolderId) || null;
    };

    const getCurrentSubfolders = () => {
        if (currentFolderId == null) {
            return folders.filter((f) => !f.parentFolder);
        }
        return folders.filter(
            (f) => f.parentFolder && f.parentFolder.id === currentFolderId
        );
    };

    const getBreadcrumbTrail = () => {
        if (!currentFolderId) return [];
        const trail = [];
        let folder = getCurrentFolder();
        while (folder) {
            trail.unshift(folder);
            folder = folder.parentFolder || null;
        }
        return trail;
    };

    /* ================= CREATE FOLDER ================= */
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            triggerToast("⚠ Folder name cannot be empty");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8080/api/artifact-folders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: newFolderName,
                    parentFolderId: currentFolderId,
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

            // Refresh folders
            const foldersResponse = await fetch("http://localhost:8080/api/artifact-folders/my-folders", {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (foldersResponse.ok) {
                const updatedFolders = await foldersResponse.json();
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

    /* ================= MOVE ARTIFACTS ================= */
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

            // Refresh artifacts
            const url = currentFolderId
                ? `http://localhost:8080/api/artifacts/folder/${currentFolderId}`
                : `http://localhost:8080/api/artifacts/my-artifacts`;

            const refreshResponse = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (refreshResponse.ok) {
                const updatedArtifacts = await refreshResponse.json();
                setUserFiles(updatedArtifacts);
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

    /* ================= TOGGLE SELECTION ================= */
    const toggleArtifactSelection = (artifactId) => {
        const newSelected = new Set(selectedArtifacts);
        if (newSelected.has(artifactId)) {
            newSelected.delete(artifactId);
        } else {
            newSelected.add(artifactId);
        }
        setSelectedArtifacts(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedArtifacts.size === userFiles.length) {
            setSelectedArtifacts(new Set());
        } else {
            const allIds = new Set(userFiles.map(f => f.id));
            setSelectedArtifacts(allIds);
        }
    };

    /* ================= FOLDER TREE FOR MOVE MODAL ================= */
    const toggleFolder = (folderId) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const renderFolderTree = (parentId = null, level = 0) => {
        const foldersAtLevel = folders.filter(f => {
            if (parentId === null) {
                return !f.parentFolder;
            }
            return f.parentFolder && f.parentFolder.id === parentId;
        });

        return foldersAtLevel.map(folder => {
            const hasChildren = folders.some(f =>
                f.parentFolder && f.parentFolder.id === folder.id
            );
            const isExpanded = expandedFolders.has(folder.id);
            const isSelected = moveTargetFolder === folder.id;

            return (
                <React.Fragment key={folder.id}>
                    <div
                        style={{
                            ...styles.folderTreeItem,
                            paddingLeft: `${20 + (level * 25)}px`,
                            ...(isSelected ? styles.folderTreeItemSelected : {}),
                        }}
                    >
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

                    {hasChildren && isExpanded && renderFolderTree(folder.id, level + 1)}
                </React.Fragment>
            );
        });
    };

    /* ================= FILE UPLOAD ================= */
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("token");
            if (!token) return handleExpiredToken();

            const res = await fetch(`http://localhost:8080/uploadFile`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (res.status === 401 || res.status === 403) return handleExpiredToken();

            const data = await res.json();
            if (res.ok) {
                triggerToast(`✅ "${file.name}" uploaded successfully!`);
                const url = currentFolderId
                    ? `http://localhost:8080/api/artifacts/folder/${currentFolderId}`
                    : "http://localhost:8080/api/artifacts/my-artifacts";

                const refresh = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const newData = await refresh.json();
                setUserFiles(Array.isArray(newData) ? newData : []);
            } else {
                triggerToast("❌ " + (data.error || "Upload failed"));
            }
        } catch (err) {
            console.error(err);
            triggerToast("❌ Upload failed!");
        }
        e.target.value = "";
    };

    const handleDelete = async (fileId, fileName) => {
        if (!window.confirm(`Delete "${fileName}"?`)) return;
        try {
            const token = localStorage.getItem("token");
            if (!token) return handleExpiredToken();

            const res = await fetch(`http://localhost:8080/deleteFile/${fileId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401 || res.status === 403) return handleExpiredToken();

            const data = await res.json();
            if (res.ok) {
                triggerToast(`🗑️ ${data.message}`);
                setUserFiles((prev) => prev.filter((f) => f.id !== fileId));
            } else {
                // Likely used in a study
                if (res.status === 400) {
                    triggerToast(`⚠️ Cannot delete: "${fileName}" is used in a study`);
                } else {
                    triggerToast("❌ " + data.error);
                }
            }
        } catch {
            triggerToast(`❌ Cannot delete "${fileName}" - may be used in a study`);
        }
    };


    const detectLanguageTag = (filename) => {
        if (!filename) return null;
        const ext = filename.split(".").pop().toLowerCase();
        const map = {
            js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
            py: "python", java: "java", cpp: "cpp", c: "c", rb: "ruby",
            go: "golang", rs: "rust", html: "html", css: "css", swift: "swift", md: "markdown",
        };
        return map[ext] || null;
    };

    useEffect(() => {
        if (!category || !categoryOption || !selectedFile) return;
        let baseTags = [];
        if (category === "Code") {
            baseTags = [categoryOption.toLowerCase()];
            const lang = detectLanguageTag(selectedFile.filename);
            if (lang) baseTags.push(lang);
        } else if (category === "Design / Diagram") {
            baseTags = [categoryOption.toLowerCase()];
        } else if (category === "Documentation") {
            baseTags = [categoryOption.toLowerCase()];
        }
        setTags([...new Set(baseTags)]);
    }, [category, categoryOption, selectedFile]);

    const openTagModal = (file) => {
        setSelectedFile(file);
        setCategory(file.category || "");
        setTags(file.tags ? file.tags.split(",") : []);
        setCategoryOption("");
        setShowTagModal(true);
    };

    const closeTagModal = () => {
        setShowTagModal(false);
        setSelectedFile(null);
        setCategory("");
        setTags([]);
        setTagInput("");
        setCategoryOption("");
    };

    const handleAddTag = () => {
        if (autoTagActive) return;
        if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    const saveClassification = async () => {
        if (!selectedFile) return;
        if (category === "Code" && !categoryOption) {
            triggerToast("⚠ Please select a subtype (Clone / Original) before saving code artifacts.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) return handleExpiredToken();

            const res = await fetch(`http://localhost:8080/classifyFile/${selectedFile.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ category, tags }),
            });

            if (res.status === 401 || res.status === 403) return handleExpiredToken();

            const data = await res.json();
            if (res.ok) {
                triggerToast("✅ Classification saved!");
                setUserFiles((prev) =>
                    prev.map((f) =>
                        f.id === selectedFile.id
                            ? { ...f, category, tags: tags.join(",") }
                            : f
                    )
                );
                closeTagModal();
            } else triggerToast("❌ " + data.error);
        } catch (err) {
            console.error(err);
            triggerToast("❌ Save failed!");
        }
    };

    const getCategoryStyle = (cat) => {
        if (cat === "Design / Diagram") cat = "Design";
        const styles = {
            Design: { bg: "rgba(124,58,237,0.2)", color: "#c4b5fd", border: "rgba(124,58,237,0.5)" },
            Code: { bg: "rgba(96,165,250,0.2)", color: "#93c5fd", border: "rgba(96,165,250,0.5)" },
            Documentation: { bg: "rgba(16,185,129,0.2)", color: "#86efac", border: "rgba(16,185,129,0.5)" },
        };
        return styles[cat] || { bg: "rgba(107,114,128,0.2)", color: "#cbd5e1", border: "rgba(107,114,128,0.5)" };
    };

    /* ================= BULK DELETE ================= */
    /* ================= BULK DELETE ================= */
    /* ================= BULK DELETE WITH USAGE CHECK ================= */
    const handleBulkDelete = async () => {
        const count = selectedArtifacts.size;
        if (!window.confirm(`Delete ${count} selected artifact(s)? Artifacts used in studies will be skipped.`)) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) return handleExpiredToken();

            const artifactIds = Array.from(selectedArtifacts);

            const response = await fetch("http://localhost:8080/api/artifacts/bulk-delete", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ artifactIds }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to delete artifacts");
            }

            // ⭐ SHOW DETAILED MESSAGE
            if (data.usedCount > 0) {
                triggerToast(
                    `🗑️ Deleted ${data.deletedCount} artifact(s). ` +
                    `${data.usedCount} artifact(s) are used in studies and were skipped.`
                );

                // Optionally show which files are used
                if (data.usedArtifacts && data.usedArtifacts.length > 0) {
                    console.log("📌 Artifacts in use:", data.usedArtifacts);
                }
            } else {
                triggerToast(`🗑️ Successfully deleted ${data.deletedCount} artifact(s)`);
            }

            // Refresh the file list
            const url = currentFolderId
                ? `http://localhost:8080/api/artifacts/folder/${currentFolderId}`
                : `http://localhost:8080/api/artifacts/my-artifacts`;

            const refresh = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (refresh.ok) {
                const newData = await refresh.json();
                setUserFiles(Array.isArray(newData) ? newData : []);
            }

            setSelectedArtifacts(new Set());
        } catch (err) {
            console.error("Bulk delete error:", err);
            triggerToast("❌ " + err.message);
        }
    };



    /* ================= BULK TAG ================= */
    const [showBulkTagModal, setShowBulkTagModal] = useState(false);
    const [bulkCategory, setBulkCategory] = useState("");
    const [bulkCategoryOption, setBulkCategoryOption] = useState("");
    const [bulkTags, setBulkTags] = useState([]);
    const [bulkTagInput, setBulkTagInput] = useState("");

    const openBulkTagModal = () => {
        setBulkCategory("");
        setBulkCategoryOption("");
        setBulkTags([]);
        setBulkTagInput("");
        setShowBulkTagModal(true);
    };

    const closeBulkTagModal = () => {
        setShowBulkTagModal(false);
        setBulkCategory("");
        setBulkCategoryOption("");
        setBulkTags([]);
        setBulkTagInput("");
    };

    const handleAddBulkTag = () => {
        const autoTagActive = !!bulkCategoryOption;
        if (autoTagActive) return;
        if (bulkTagInput.trim() !== "" && !bulkTags.includes(bulkTagInput.trim())) {
            setBulkTags([...bulkTags, bulkTagInput.trim()]);
            setBulkTagInput("");
        }
    };

    const removeBulkTag = (tagToRemove) => {
        setBulkTags(bulkTags.filter((t) => t !== tagToRemove));
    };

    const saveBulkClassification = async () => {
        const count = selectedArtifacts.size;
        if (bulkCategory === "Code" && !bulkCategoryOption) {
            triggerToast("⚠ Please select a subtype (Clone / Original) before saving code artifacts.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) return handleExpiredToken();

            const classifyPromises = Array.from(selectedArtifacts).map(fileId =>
                fetch(`http://localhost:8080/classifyFile/${fileId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ category: bulkCategory, tags: bulkTags }),
                })
            );

            await Promise.all(classifyPromises);

            triggerToast(`✅ Tagged ${count} artifact(s) successfully!`);

            // Refresh the file list
            const url = currentFolderId
                ? `http://localhost:8080/api/artifacts/folder/${currentFolderId}`
                : `http://localhost:8080/api/artifacts/my-artifacts`;

            const refresh = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const newData = await refresh.json();
            setUserFiles(Array.isArray(newData) ? newData : []);
            setSelectedArtifacts(new Set());
            closeBulkTagModal();
        } catch (err) {
            console.error(err);
            triggerToast("❌ Bulk tag failed!");
        }
    };

// Auto-generate tags for bulk tagging
    useEffect(() => {
        if (!bulkCategory || !bulkCategoryOption) return;

        let baseTags = [];
        if (bulkCategory === "Code") {
            baseTags = [bulkCategoryOption.toLowerCase()];
        } else if (bulkCategory === "Design / Diagram") {
            baseTags = [bulkCategoryOption.toLowerCase()];
        } else if (bulkCategory === "Documentation") {
            baseTags = [bulkCategoryOption.toLowerCase()];
        }
        setBulkTags([...new Set(baseTags)]);
    }, [bulkCategory, bulkCategoryOption]);


    return (
        <div style={styles.container}>
            {/* TOAST */}
            {showToast && <div style={styles.toast}>{toastMessage}</div>}

            {/* HEADER */}
            <div style={styles.headerBar}>
                <h1 style={styles.title}>Upload Artifacts</h1>
                <button style={styles.backButton} onClick={() => navigate(-1)}>
                    ← Back To My Artifacts
                </button>
            </div>

            {/* ⭐ BREADCRUMB */}
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

                {getBreadcrumbTrail().map((folder) => (
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

            {/* 📤 UPLOAD SECTION - ONLY SHOW AT ROOT */}
            {currentFolderId === null && (
                <div style={styles.uploadSection}>
                    <input
                        type="file"
                        accept=".txt,.pdf,.png,.jpeg,.jpg,.json,.docx,.xlsx,.cpp,.java,.js,.py,.rb,.html,.css,.md,.csv,.swift,.ts,.go,.rs,.xml,.yml,.yaml"
                        onChange={handleFileUpload}
                        style={{ display: "none" }}
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" style={styles.uploadBox}>
                        <p style={styles.uploadText}>Click to upload</p>
                        <p style={styles.uploadSubtext}>
                            Supported formats: TXT, PDF, PNG, JPEG, CODE
                        </p>
                    </label>
                </div>
            )}

            {/* ⭐ INFO MESSAGE WHEN INSIDE FOLDER */}
            {currentFolderId !== null && (
                <div style={styles.infoMessage}>
                    <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>ℹ️</span>
                    To upload files, navigate back to Root. Files can only be uploaded at the root level.
                </div>
            )}


            {/* ⭐ ACTION BUTTONS */}
            <div style={styles.actionButtonsContainer}>
                <button
                    style={styles.createFolderButton}
                    onClick={() => setShowCreateFolderModal(true)}
                >
                    📁 Create Folder
                </button>

                {userFiles.length > 0 && (
                    <button
                        style={styles.selectAllButton}
                        onClick={handleSelectAll}
                    >
                        {selectedArtifacts.size === userFiles.length
                            ? "☑️ Deselect All"
                            : "☐ Select All"}
                    </button>
                )}

                {/* ⭐ SHOW WHEN ARTIFACTS ARE SELECTED */}
                {selectedArtifacts.size > 0 && (
                    <>
                        <button
                            style={styles.tagSelectedButton}
                            onClick={openBulkTagModal}
                        >
                            🏷 Tag Selected ({selectedArtifacts.size})
                        </button>

                        <button
                            style={styles.moveButton}
                            onClick={() => setShowMoveModal(true)}
                        >
                            📂 Move ({selectedArtifacts.size})
                        </button>

                        <button
                            style={styles.deleteSelectedButton}
                            onClick={handleBulkDelete}
                        >
                            🗑 Delete ({selectedArtifacts.size})
                        </button>
                    </>
                )}
            </div>


            {/* ⭐ FOLDERS SECTION */}
            {getCurrentSubfolders().length > 0 && (
                <div style={styles.foldersSection}>
                    <h3 style={styles.sectionTitle}>📁 Folders</h3>
                    <div style={styles.folderGrid}>
                        {getCurrentSubfolders().map((folder) => (
                            <div
                                key={folder.id}
                                className="folder-card"
                                style={styles.folderCard}
                                onClick={() => setCurrentFolderId(folder.id)}
                            >
                                <span style={styles.folderIcon}>📁</span>
                                <span style={styles.folderName}>{folder.name}</span>
                                <span style={styles.folderArrow}>→</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ⭐ BULK TAG MODAL */}
            {showBulkTagModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h2 style={styles.modalTitle}>
                            🏷️ Tag {selectedArtifacts.size} Artifact(s)
                        </h2>

                        <label style={styles.label}>Category</label>
                        <select
                            value={bulkCategory}
                            onChange={(e) => {
                                setBulkCategory(e.target.value);
                                setBulkCategoryOption("");
                                setBulkTags([]);
                            }}
                            disabled={bulkCategory === "Code" && !!bulkCategoryOption}
                            style={{
                                ...styles.select,
                                opacity: bulkCategory === "Code" && !!bulkCategoryOption ? 0.7 : 1,
                                cursor: bulkCategory === "Code" && !!bulkCategoryOption ? "not-allowed" : "pointer",
                            }}
                        >
                            <option value="">Select category...</option>
                            <option value="Design / Diagram">Design/Diagram</option>
                            <option value="Code">Code</option>
                            <option value="Documentation">Documentation</option>
                        </select>

                        {bulkCategory === "Code" && (
                            <div style={styles.optionRow}>
                                <button
                                    type="button"
                                    style={bulkCategoryOption === "Clone" ? styles.optionActive : styles.optionButton}
                                    onClick={() => setBulkCategoryOption("Clone")}
                                >
                                    Clone
                                </button>
                                <button
                                    type="button"
                                    style={bulkCategoryOption === "Original" ? styles.optionActive : styles.optionButton}
                                    onClick={() => setBulkCategoryOption("Original")}
                                >
                                    Original
                                </button>
                            </div>
                        )}

                        {bulkCategory === "Design / Diagram" && (
                            <div style={styles.optionRow}>
                                {["Wireframe", "UML", "UI Mockup"].map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        style={bulkCategoryOption === opt ? styles.optionActive : styles.optionButton}
                                        onClick={() => setBulkCategoryOption(opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {bulkCategory === "Documentation" && (
                            <div style={styles.optionRow}>
                                {["Report", "Manual", "Specification"].map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        style={bulkCategoryOption === opt ? styles.optionActive : styles.optionButton}
                                        onClick={() => setBulkCategoryOption(opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {bulkCategory === "Code" && bulkCategoryOption && (
                            <p style={styles.categoryLockedInfo}>
                                Category is locked while a code subtype is selected. Close and reopen to change it.
                            </p>
                        )}

                        <label style={styles.label}>Tags</label>
                        <div style={styles.modalTagsContainer}>
                            {bulkTags.map((t, i) => (
                                <span key={i} style={styles.modalTag}>
                        #{t}
                                    <button
                                        onClick={() => removeBulkTag(t)}
                                        style={styles.removeTagButton}
                                    >
                            ×
                        </button>
                    </span>
                            ))}
                        </div>

                        {!bulkCategoryOption && (
                            <div style={styles.tagInputContainer}>
                                <input
                                    value={bulkTagInput}
                                    onChange={(e) => setBulkTagInput(e.target.value)}
                                    placeholder="Enter tag name..."
                                    onKeyPress={(e) => e.key === "Enter" && handleAddBulkTag()}
                                    style={styles.input}
                                />
                                <button onClick={handleAddBulkTag} style={styles.addTagButton}>
                                    Add
                                </button>
                            </div>
                        )}
                        {bulkCategoryOption && (
                            <p style={styles.autoTagInfo}>
                                Tags are automatically generated from the selected type.
                            </p>
                        )}

                        <div style={styles.modalActions}>
                            <button
                                onClick={saveBulkClassification}
                                style={{
                                    ...styles.saveButton,
                                    opacity: bulkCategory === "Code" && !bulkCategoryOption ? 0.6 : 1,
                                    cursor: bulkCategory === "Code" && !bulkCategoryOption ? "not-allowed" : "pointer",
                                }}
                                disabled={bulkCategory === "Code" && !bulkCategoryOption}
                            >
                                Apply to All
                            </button>
                            <button onClick={closeBulkTagModal} style={styles.cancelButton}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* FILE LIST */}
            {userFiles.length > 0 && (
                <div style={styles.fileListContainer}>
                    <h3 style={styles.fileListTitle}>
                        📄 Your Files ({userFiles.length})
                    </h3>
                    <div style={styles.list}>
                        {userFiles.map((file) => {
                            const catStyle = getCategoryStyle(file.category);
                            const isSelected = selectedArtifacts.has(file.id);

                            return (
                                <div
                                    key={file.id}
                                    style={{
                                        ...styles.card,
                                        ...(isSelected ? styles.cardSelected : {}),
                                    }}
                                    onClick={() => toggleArtifactSelection(file.id)}
                                >
                                    <div style={styles.cardHeader}>
                                        <div>
                                            <h4 style={styles.filename}>{file.filename}</h4>
                                            <p style={styles.uploadDate}>
                                                {new Date(file.uploadDate).toLocaleString()}
                                            </p>
                                            <div style={styles.tagsContainer}>
                                                {file.category && (
                                                    <span
                                                        style={{
                                                            background: catStyle.bg,
                                                            color: catStyle.color,
                                                            border: `1px solid ${catStyle.border}`,
                                                            borderRadius: "8px",
                                                            padding: "4px 10px",
                                                            fontSize: "0.85rem",
                                                        }}
                                                    >
                                                        {file.category}
                                                    </span>
                                                )}
                                                {file.tags &&
                                                    file.tags.split(",").map((t, i) => (
                                                        <span key={i} style={styles.tag}>
                                                            #{t}
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>

                                        <div style={styles.actionButtons}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openTagModal(file);
                                                }}
                                                style={styles.tagButton}
                                            >
                                                🏷
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(file.id, file.filename);
                                                }}
                                                style={styles.deleteButton}
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* CREATE FOLDER MODAL */}
            {showCreateFolderModal && (
                <div style={styles.modalOverlay} onClick={() => setShowCreateFolderModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>Create New Folder</h2>
                        <input
                            type="text"
                            placeholder="Enter folder name..."
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            style={styles.input}
                            onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
                        />
                        <div style={styles.modalActions}>
                            <button
                                style={styles.cancelButton}
                                onClick={() => setShowCreateFolderModal(false)}
                            >
                                Cancel
                            </button>
                            <button style={styles.saveButton} onClick={handleCreateFolder}>
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MOVE MODAL */}
            {showMoveModal && (
                <div style={styles.modalOverlay} onClick={() => setShowMoveModal(false)}>
                    <div
                        style={{
                            ...styles.modal,
                            maxWidth: "600px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={styles.modalTitle}>
                            Move {selectedArtifacts.size} Artifact(s)
                        </h2>
                        <p style={{ color: "#93c5fd", marginBottom: "20px", fontSize: "0.95rem" }}>
                            Select destination folder:
                        </p>

                        <div style={styles.folderTreeContainer}>
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

                            {renderFolderTree()}
                        </div>

                        <div style={styles.modalActions}>
                            <button
                                style={styles.cancelButton}
                                onClick={() => {
                                    setShowMoveModal(false);
                                    setMoveTargetFolder(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                style={styles.saveButton}
                                onClick={handleMoveArtifacts}
                            >
                                Move
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAG MODAL */}
            {showTagModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h2 style={styles.modalTitle}>🏷️ Artifact Classification</h2>

                        <label style={styles.label}>Category</label>
                        <select
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value);
                                setCategoryOption("");
                                setTags([]);
                            }}
                            disabled={category === "Code" && !!categoryOption}
                            style={{
                                ...styles.select,
                                opacity: category === "Code" && !!categoryOption ? 0.7 : 1,
                                cursor: category === "Code" && !!categoryOption ? "not-allowed" : "pointer",
                            }}
                        >
                            <option value="">Select category...</option>
                            <option value="Design / Diagram">Design/Diagram</option>
                            <option value="Code">Code</option>
                            <option value="Documentation">Documentation</option>
                        </select>

                        {category === "Code" && (
                            <div style={styles.optionRow}>
                                <button
                                    type="button"
                                    style={categoryOption === "Clone" ? styles.optionActive : styles.optionButton}
                                    onClick={() => setCategoryOption("Clone")}
                                >
                                    Clone
                                </button>
                                <button
                                    type="button"
                                    style={categoryOption === "Original" ? styles.optionActive : styles.optionButton}
                                    onClick={() => setCategoryOption("Original")}
                                >
                                    Original
                                </button>
                            </div>
                        )}

                        {category === "Design / Diagram" && (
                            <div style={styles.optionRow}>
                                {["Wireframe", "UML", "UI Mockup"].map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        style={categoryOption === opt ? styles.optionActive : styles.optionButton}
                                        onClick={() => setCategoryOption(opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {category === "Documentation" && (
                            <div style={styles.optionRow}>
                                {["Report", "Manual", "Specification"].map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        style={categoryOption === opt ? styles.optionActive : styles.optionButton}
                                        onClick={() => setCategoryOption(opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {category === "Code" && categoryOption && (
                            <p style={styles.categoryLockedInfo}>
                                Category is locked while a code subtype is selected. Close and reopen to change it.
                            </p>
                        )}

                        <label style={styles.label}>Tags</label>
                        <div style={styles.modalTagsContainer}>
                            {tags.map((t, i) => (
                                <span key={i} style={styles.modalTag}>
                                    #{t}
                                    <button
                                        onClick={() => removeTag(t)}
                                        style={styles.removeTagButton}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>

                        {!autoTagActive && (
                            <div style={styles.tagInputContainer}>
                                <input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="Enter tag name..."
                                    onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                                    style={styles.input}
                                />
                                <button onClick={handleAddTag} style={styles.addTagButton}>
                                    Add
                                </button>
                            </div>
                        )}
                        {autoTagActive && (
                            <p style={styles.autoTagInfo}>
                                Tags are automatically generated from the selected type.
                            </p>
                        )}

                        <div style={styles.modalActions}>
                            <button
                                onClick={saveClassification}
                                style={{
                                    ...styles.saveButton,
                                    opacity: saveDisabled ? 0.6 : 1,
                                    cursor: saveDisabled ? "not-allowed" : "pointer",
                                }}
                                disabled={saveDisabled}
                            >
                                Save
                            </button>
                            <button onClick={closeTagModal} style={styles.cancelButton}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .folder-card:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 16px rgba(251,146,60,0.6) !important;
                    background: rgba(251,146,60,0.15) !important;
                }

                .folder-card:active {
                    transform: scale(0.98);
                }
            `}</style>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        color: "#f1f5f9",
        padding: "40px 20px",
        fontFamily: "Inter, sans-serif",
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

    headerBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        maxWidth: "900px",
        marginLeft: "auto",
        marginRight: "auto",
    },

    title: {
        fontSize: "2rem",
        fontWeight: "700",
        color: "#38bdf8",
        margin: 0,
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

    tagSelectedButton: {
        padding: "12px 28px",
        background: "rgba(147,51,234,0.1)",
        border: "2px solid rgba(147,51,234,0.6)",
        color: "#c084fc",
        borderRadius: "12px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "1rem",
        transition: "all 0.3s ease",
        boxShadow: "0 0 12px rgba(147,51,234,0.35)",
    },

    deleteSelectedButton: {
        padding: "12px 28px",
        background: "rgba(239,68,68,0.1)",
        border: "2px solid rgba(239,68,68,0.6)",
        color: "#f87171",
        borderRadius: "12px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "1rem",
        transition: "all 0.3s ease",
        boxShadow: "0 0 12px rgba(239,68,68,0.35)",
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
        flexWrap: "wrap",
        maxWidth: "900px",
        marginLeft: "auto",
        marginRight: "auto",
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

    uploadSection: {
        maxWidth: "800px",
        margin: "0 auto 30px",
    },

    uploadBox: {
        display: "block",
        textAlign: "center",
        padding: "60px 20px",
        border: "2px dashed rgba(56,189,248,0.4)",
        borderRadius: "12px",
        cursor: "pointer",
        background: "rgba(255,255,255,0.02)",
        transition: "all 0.3s ease",
    },

    uploadText: {
        fontSize: "1.1rem",
        fontWeight: "600",
        color: "#38bdf8",
        margin: "0 0 8px 0",
    },

    uploadSubtext: {
        fontSize: "0.9rem",
        color: "#94a3b8",
        margin: 0,
    },

    /* ⭐ ACTION BUTTONS */
    actionButtonsContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "15px",
        flexWrap: "wrap",
        marginBottom: "30px",
        maxWidth: "900px",
        marginLeft: "auto",
        marginRight: "auto",
    },

    createFolderButton: {
        padding: "12px 28px",
        background: "rgba(251,146,60,0.1)",
        border: "2px solid rgba(251,146,60,0.6)",
        color: "#fb923c",
        borderRadius: "12px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "1rem",
        transition: "all 0.3s ease",
        boxShadow: "0 0 12px rgba(251,146,60,0.35)",
    },

    selectAllButton: {
        padding: "12px 28px",
        background: "rgba(139,92,246,0.1)",
        border: "2px solid rgba(139,92,246,0.6)",
        color: "#a78bfa",
        borderRadius: "12px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "1rem",
        transition: "all 0.3s ease",
        boxShadow: "0 0 12px rgba(139,92,246,0.35)",
    },

    moveButton: {
        padding: "12px 28px",
        background: "rgba(168,85,247,0.1)",
        border: "2px solid rgba(168,85,247,0.6)",
        color: "#a855f7",
        borderRadius: "12px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "1rem",
        transition: "all 0.3s ease",
        boxShadow: "0 0 12px rgba(168,85,247,0.35)",
    },

    /* ⭐ FOLDERS SECTION */
    foldersSection: {
        maxWidth: "900px",
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: "40px",
    },

    sectionTitle: {
        fontSize: "1.3rem",
        fontWeight: "700",
        color: "#93c5fd",
        marginBottom: "20px",
    },

    folderGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "30px",
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
        userSelect: "none",
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

    fileListContainer: {
        maxWidth: "800px",
        margin: "0 auto",
    },

    fileListTitle: {
        fontSize: "1.3rem",
        fontWeight: "600",
        color: "#f8fafc",
        marginBottom: "20px",
    },

    list: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },

    card: {
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 0 8px rgba(59,130,246,0.25)",
        transition: "all 0.3s ease",
        cursor: "pointer",
    },

    cardSelected: {
        border: "2px solid rgba(168,85,247,0.8)",
        boxShadow: "0 0 16px rgba(168,85,247,0.6)",
        background: "rgba(168,85,247,0.1)",
        transform: "scale(1.02)",
    },

    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },

    filename: {
        fontSize: "1.1rem",
        fontWeight: "600",
        color: "#f8fafc",
        margin: "0 0 6px 0",
    },

    uploadDate: {
        fontSize: "0.85rem",
        color: "#94a3b8",
        margin: "0 0 10px 0",
    },

    tagsContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        marginTop: "8px",
    },

    tag: {
        background: "rgba(96,165,250,0.2)",
        color: "#93c5fd",
        borderRadius: "8px",
        padding: "4px 10px",
        fontSize: "0.85rem",
    },

    actionButtons: {
        display: "flex",
        gap: "8px",
    },

    tagButton: {
        padding: "10px 14px",
        borderRadius: "8px",
        background: "rgba(147,51,234,0.2)",
        border: "1px solid rgba(147,51,234,0.5)",
        cursor: "pointer",
        color: "#c084fc",
        fontSize: "1.1rem",
        transition: "all 0.3s ease",
    },

    deleteButton: {
        padding: "10px 14px",
        borderRadius: "8px",
        background: "rgba(239,68,68,0.2)",
        border: "1px solid rgba(239,68,68,0.5)",
        cursor: "pointer",
        color: "#f87171",
        fontSize: "1.1rem",
        transition: "all 0.3s ease",
    },

    /* ⭐ FOLDER TREE */
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

    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        backdropFilter: "blur(4px)",
    },

    modal: {
        background: "rgba(30,41,59,0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "32px",
        borderRadius: "16px",
        width: "90%",
        maxWidth: "480px",
        boxShadow: "0 0 20px rgba(59,130,246,0.3)",
    },

    modalTitle: {
        color: "#38bdf8",
        fontSize: "1.5rem",
        fontWeight: "700",
        marginBottom: "24px",
        margin: "0 0 24px 0",
    },

    label: {
        color: "#cbd5e1",
        fontSize: "0.9rem",
        fontWeight: "600",
        display: "block",
        marginBottom: "8px",
    },

    select: {
        width: "100%",
        padding: "10px 12px",
        marginBottom: "20px",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.05)",
        color: "#f1f5f9",
        border: "1px solid rgba(255,255,255,0.1)",
        fontSize: "0.95rem",
    },

    modalTagsContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "8px",
        marginBottom: "16px",
        minHeight: "40px",
    },

    modalTag: {
        background: "rgba(96,165,250,0.2)",
        color: "#93c5fd",
        padding: "6px 12px",
        borderRadius: "8px",
        fontSize: "0.9rem",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },

    removeTagButton: {
        background: "none",
        border: "none",
        color: "#93c5fd",
        cursor: "pointer",
        fontSize: "1.2rem",
        padding: 0,
        lineHeight: 1,
    },

    tagInputContainer: {
        display: "flex",
        gap: "8px",
        marginBottom: "24px",
    },

    input: {
        flex: 1,
        padding: "10px 12px",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.05)",
        color: "#f1f5f9",
        border: "1px solid rgba(255,255,255,0.1)",
        fontSize: "0.95rem",
    },

    addTagButton: {
        padding: "10px 20px",
        background: "rgba(59,130,246,0.2)",
        border: "1px solid rgba(59,130,246,0.5)",
        color: "#93c5fd",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
        transition: "all 0.3s ease",
    },

    modalActions: {
        display: "flex",
        gap: "10px",
    },

    saveButton: {
        flex: 1,
        padding: "12px",
        borderRadius: "8px",
        background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "1rem",
        transition: "all 0.3s ease",
    },

    cancelButton: {
        padding: "12px 24px",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#cbd5e1",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "1rem",
        transition: "all 0.3s ease",
    },

    optionRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginBottom: "16px",
        justifyContent: "center",
    },

    optionButton: {
        padding: "8px 14px",
        borderRadius: "999px",
        border: "1px solid rgba(148,163,184,0.6)",
        background: "rgba(15,23,42,0.9)",
        color: "#e5e7eb",
        cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: "500",
        transition: "all 0.2s ease",
    },

    optionActive: {
        padding: "8px 14px",
        borderRadius: "999px",
        border: "1px solid rgba(56,189,248,0.9)",
        background: "rgba(56,189,248,0.16)",
        color: "#e0f2fe",
        cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: "600",
        boxShadow: "0 0 0 1px rgba(56,189,248,0.3)",
    },

    autoTagInfo: {
        fontSize: "0.8rem",
        color: "#94a3b8",
        marginTop: "-8px",
        marginBottom: "16px",
        fontStyle: "italic",
    },

    infoMessage: {
        maxWidth: "800px",
        margin: "0 auto 30px",
        padding: "16px 20px",
        background: "rgba(59,130,246,0.1)",
        border: "1px solid rgba(59,130,246,0.3)",
        borderRadius: "10px",
        color: "#93c5fd",
        fontSize: "0.95rem",
        display: "flex",
        alignItems: "center",
        textAlign: "center",
        justifyContent: "center",
    },


    categoryLockedInfo: {
        fontSize: "0.75rem",
        color: "#64748b",
        marginTop: "-4px",
        marginBottom: "12px",
    },
};

export default UploadArtifactPage;
