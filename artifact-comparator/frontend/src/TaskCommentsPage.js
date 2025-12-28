// TaskCommentsPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMemo } from "react";



/* ----------------------------------------------------
   PARTICLES (MyStudiesPage / ManageEvaluationTasksPage ile aynı)
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

function buildDeletedTree(logs) {
    const map = {};
    const roots = [];

    // 1) tüm node'ları oluştur
    logs.forEach(log => {
        map[log.originalCommentId] = {
            ...log,
            id: log.originalCommentId,
            replies: []
        };
    });

    // 2) her node için parent ilişkisini yeniden kur
    logs.forEach(log => {
        const node = map[log.originalCommentId];
        const parentId = log.parentCommentId;

        if (parentId && map[parentId]) {
            // 🔥 parent da silinmiş → gerçek hiyerarşi
            map[parentId].replies.push(node);
        } else {
            // 🔥 parent aktif veya yok → root
            roots.push(node);
        }
    });

    return roots;
}


function renderDeletedThread(
    node,
    level,
    openDeletedReplies,
    setOpenDeletedReplies
) {
    const isOpen = openDeletedReplies[node.id] || false;
    const hasReplies = node.replies && node.replies.length > 0;

    return (
        <div
            key={node.id}
            style={{
                marginLeft: level * 20,
                borderLeft: level > 0 ? "2px solid rgba(239,68,68,0.35)" : "none",
                paddingLeft: "10px",
                marginBottom: "12px",
            }}
        >
            <div style={styles.deletedCard}>
                <div style={styles.deletedHeaderRow}>
                    <span>👤 @{node.ownerUsername}</span>
                    <span>{node.deletedAt}</span>
                </div>

                <p style={styles.deletedContent}>🔒 {node.originalContent}</p>
                <p style={styles.reason}>Reason: {node.deleteReason}</p>

                <div style={styles.deletedMetaRow}>
                    <span>Deleted by @{node.deletedByUsername}</span>
                </div>

                {hasReplies && (
                    <button
                        style={styles.repliesBtn}
                        onClick={() =>
                            setOpenDeletedReplies(prev => ({
                                ...prev,
                                [node.id]: !isOpen,
                            }))
                        }
                    >
                        {isOpen
                            ? "Hide replies"
                            : `See replies (${node.replies.length})`}
                    </button>
                )}
            </div>

            {isOpen && hasReplies && (
                <div style={styles.deletedReplyList}>
                    {node.replies.map(r =>
                        renderDeletedThread(
                            r,
                            level + 1,
                            openDeletedReplies,
                            setOpenDeletedReplies
                        )
                    )}
                </div>
            )}
        </div>
    );
}


function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function buildThread(comments) {
    const map = {};
    const roots = [];

    // parentlar her zaman önce gelsin
    comments.sort((a, b) => a.id - b.id);

    comments.forEach(c => {
        map[c.id] = { ...c, replies: [] };
    });

    comments.forEach(c => {
        if (c.parentCommentId != null && map[c.parentCommentId]) {
            map[c.parentCommentId].replies.push(map[c.id]);
        }
    });

    comments.forEach(c => {
        if (c.parentCommentId == null) {
            roots.push(map[c.id]);
        }
    });

    return roots;
}


function findActiveCommentById(tree, id) {
    for (const node of tree) {
        if (node.id === id) return node;
        if (node.replies && node.replies.length > 0) {
            const found = findActiveCommentById(node.replies, id);
            if (found) return found;
        }
    }
    return null;
}

function findDeletedCommentContent(id, deletedLogsOriginal) {
    const log = deletedLogsOriginal.find(l => l.originalCommentId === id);
    return log ? log.originalContent : null;
}


function findAnyCommentContent(id, comments, deletedLogsOriginal, action) {
    // 1) Eğer bu bir DELETE_COMMENT log'uysa,
    //    önce DeletedCommentLog içindeki ORIGINAL content'e bak
    if (action === "DELETE_COMMENT") {
        const deleted = findDeletedCommentContent(id, deletedLogsOriginal);
        if (deleted) return deleted;   // 🔥 "deleted" yerine gerçek içerik

        // fallback: yine de active tree'de bulmayı dene
        const active = findActiveCommentById(comments, id);
        return active ? active.content : null;
    }

    // 2) Diğer aksiyonlar (PIN, UNPIN, LIKE...) için önce aktif'te ara
    const activeFound = findActiveCommentById(comments, id);
    if (activeFound) return activeFound.content;

    const deleted = findDeletedCommentContent(id, deletedLogsOriginal);
    if (deleted) return deleted;

    return null;
}

function TaskCommentsPage() {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const [comments, setComments] = useState([]);
    const [deletedLogs, setDeletedLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterUsername, setFilterUsername] = useState("");
    const [activeTab, setActiveTab] = useState("comments");
    const [researcherLogs, setResearcherLogs] = useState([]);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [artifactList, setArtifactList] = useState([]);
    const [selectedArtifact, setSelectedArtifact] = useState("");
    const [openReplies, setOpenReplies] = useState({});
    const [openDeletedReplies, setOpenDeletedReplies] = useState({});
    const [deletedLogsOriginal, setDeletedLogsOriginal] = useState([]);

    const toggleDeletedReplies = (id) => {
        setOpenDeletedReplies(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };



    // ------------------------
    // LOAD COMMENTS
    // ------------------------
    const loadComments = async () => {
        try {
            const token = localStorage.getItem("token");

            const [activeRes, deletedRes] = await Promise.all([
                fetch(`http://localhost:8080/api/comments/task/${taskId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`http://localhost:8080/api/comments/task/${taskId}/deleted`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const activeData = await activeRes.json();
            const deletedData = await deletedRes.json();

            setComments(buildThread(activeData));
            setDeletedLogs(buildDeletedTree(deletedData));
            setDeletedLogsOriginal(deletedData);


        } catch (e) {
            console.error("❌ Failed to load comments:", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleReplies = (commentId) => {
        setOpenReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };



    // ------------------------
    // LOAD RESEARCHER LOGS
    // ------------------------
    const loadResearcherLogs = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `http://localhost:8080/api/comments/task/${taskId}/researcher-logs`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            let data = await res.json();

            // 🔥 Tarihe göre SIRALA (en yeni en üstte)
            data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setResearcherLogs(data);

        } catch (err) {
            console.error("❌ Failed to load researcher logs:", err);
        }
    };

    const loadArtifactList = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `http://localhost:8080/api/tasks/${taskId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = await res.json();

            // artifacts array DTO içinden geliyor
            setArtifactList(data.artifactFields || []);

        } catch (err) {
            console.error("❌ Failed to load artifact list:", err);
        }
    };

    // ------------------------
    // DELETE COMMENT
    // ------------------------
    const deleteComment = async (id) => {
        if (!window.confirm("Delete this comment and all its replies?")) return;

        try {
            const token = localStorage.getItem("token");

            // 1) Bu yoruma bağlı tüm alt reply id'lerini bul
            const idsToDelete = [id, ...collectDescendantIds(comments, id)];

            // 2) Backend'de hepsini tek tek sil
            await Promise.all(
                idsToDelete.map(cid =>
                    fetch(`http://localhost:8080/api/comments/${cid}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` }
                    })
                )
            );

            // 3) Eskisi gibi: comments + deletedLogs'ı yeniden yükle
            await loadComments();
            await loadResearcherLogs();

        } catch (e) {
            console.error("❌ Delete failed:", e);
        }
    };


    function collectDescendantIds(tree, parentId) {
        const result = [];

        function traverse(nodes) {
            nodes.forEach(node => {
                if (node.parentCommentId === parentId) {
                    result.push(node.id);
                    if (node.replies && node.replies.length > 0) {
                        traverse(node.replies);
                    }
                } else if (node.replies && node.replies.length > 0) {
                    traverse(node.replies);
                }
            });
        }

        traverse(tree);
        return result;
    }

    const artifactNameByField = useMemo(() => {
        const map = {};
        artifactList.forEach(a => {
            map[a.fieldCode] = a.filename;
        });
        return map;
    }, [artifactList]);

    // ------------------------
    // GROUP BY ARTIFACT FIELD CODE
    // ------------------------
    const grouped = useMemo(() => {
        const g = {};
        comments.forEach((c) => {
            if (!c.deleted && c.parentCommentId === null) {
                if (!g[c.fieldCode]) g[c.fieldCode] = [];
                g[c.fieldCode].push(c);
            }
        });
        return g;
    }, [comments]);

    // ------------------------
    // PIN / UNPIN
    // ------------------------
    const togglePin = async (id) => {
        try {
            const token = localStorage.getItem("token");

            await fetch(
                `http://localhost:8080/api/comments/${id}/pin`,
                {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // 🔥 PİN DEĞİŞİNCE TÜM COMMENTLERİ YENİDEN ÇEK
            await loadComments();
            await loadResearcherLogs();

        } catch (e) {
            console.error("❌ Pin toggle failed:", e);
        }
    };
    const renderThread = (comment) => {
        const hasReplies = comment.replies && comment.replies.length > 0;
        const isOpen = openReplies[comment.id] || false;

        return (
            <div key={comment.id} style={styles.message}>
                {/* HEADER */}
                <div style={styles.headerRow}>
                    <span style={styles.username}>@{comment.username}</span>
                    <span style={styles.time}>{comment.createdAt}</span>
                </div>

                {/* MAIN BUBBLE */}
                <div style={comment.pinned ? styles.pinnedBubble : styles.bubble}>
                    {comment.content}
                </div>

                {/* ==== REPLIES BUTTON ==== */}
                {hasReplies && (
                    <button
                        style={styles.repliesBtn}
                        onClick={() =>
                            setOpenReplies(prev => ({
                                ...prev,
                                [comment.id]: !isOpen
                            }))
                        }
                    >
                        {isOpen
                            ? "Hide replies"
                            : `See replies (${comment.replies.length})`}
                    </button>
                )}

                {/* ==== REPLY LIST ==== */}
                {isOpen && hasReplies && (
                    <div style={styles.replyList}>
                        {comment.replies.map(r =>
                            renderThread(r)  // 🔥 artık her reply kendi alt replylerini de getirir
                        )}
                    </div>
                )}

                {/* ACTION BUTTONS */}
                <div style={styles.actionsRow}>
                    <button style={styles.pinBtn} onClick={() => togglePin(comment.id)}>
                        📌 {comment.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button style={styles.deleteBtn} onClick={() => deleteComment(comment.id)}>
                        🗑 Delete
                    </button>
                </div>
            </div>
        );
    };
    // ------------------------
    // FILTER BY PARTICIPANT USERNAME
    // ------------------------
    const liveFilterParticipant = debounce(async (value) => {
        if (!value.trim()) {
            loadComments();
            return;
        }

        try {
            const token = localStorage.getItem("token");

            // 1) Active comments → backend
            const res = await fetch(
                `http://localhost:8080/api/comments/task/${taskId}/participant/${value}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const activeData = await res.json();

            // 2) Deleted comments → frontend filter (ORIGINAL üzerinden!)
            const filteredDeleted = deletedLogsOriginal.filter(log =>
                log.ownerUsername.toLowerCase().includes(value.toLowerCase()) ||
                log.deletedByUsername.toLowerCase().includes(value.toLowerCase())
            );

            setComments(activeData);
            setDeletedLogs(buildDeletedTree(filteredDeleted));
            setDeletedLogsOriginal(deletedLogsOriginal);


        } catch (err) {
            console.error("❌ Live participant filter failed:", err);
        }
    }, 300);


    const liveFilterArtifact = async (fieldCode) => {
        if (!fieldCode) {
            loadComments();
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `http://localhost:8080/api/comments/task/${taskId}/artifact/${fieldCode}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = await res.json();
            setComments(data);

        } catch (err) {
            console.error("❌ Live artifact filter failed:", err);
        }
    };

    useEffect(() => {
        loadComments();
        loadResearcherLogs();
        loadArtifactList();   // ← BURASI YENİ
    }, [taskId]);

    const deletedTree = buildDeletedTree(deletedLogs);

    return (
        <div style={styles.container}>
            <FloatingParticles />

            {/* NAVBAR — ManageEvaluationTasksPage teması */}
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>
                    <span>💬</span>
                    <span>Task Comments — #{taskId}</span>
                </h2>

                <button
                    style={styles.backButton}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow =
                            "0 0 18px rgba(220,38,38,0.7)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow =
                            "0 0 12px rgba(220,38,38,0.4)";
                    }}
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>
            </div>

            <div style={styles.centerWrapper}>
                {loading ? (
                    <p style={styles.loading}>Loading comments...</p>
                ) : (
                    <>
                        {/* TAB BAR */}
                        <div style={styles.tabBar}>
                            <button
                                style={
                                    activeTab === "comments"
                                        ? styles.activeTabButton
                                        : styles.tabButton
                                }
                                onClick={() => setActiveTab("comments")}
                            >
                                💬 Comments
                            </button>
                            <button
                                style={
                                    activeTab === "logs"
                                        ? styles.activeTabButton
                                        : styles.tabButton
                                }
                                onClick={() => setActiveTab("logs")}
                            >
                                📄 Researcher Action Logs
                            </button>
                        </div>

                        {activeTab === "comments" && (
                            <>
                                {/* FILTER WRAPPER (katlanır panel) */}
                                <div style={styles.filterWrapper}>
                                    <button
                                        style={styles.filterToggle}
                                        onClick={() =>
                                            setFiltersOpen((prev) => !prev)
                                        }
                                    >
                                        {filtersOpen
                                            ? "▲ Filter by participant"
                                            : "▼ Filter by participant"}
                                    </button>

                                    <div
                                        style={{
                                            ...styles.filterPanel,
                                            maxHeight: filtersOpen
                                                ? "200px"
                                                : "0px",
                                            padding: filtersOpen
                                                ? "16px 18px 18px 18px"
                                                : "0 18px",
                                            opacity: filtersOpen ? 1 : 0,
                                        }}
                                    >
                                        <div style={styles.filterContentRow}>
                                            {/* USERNAME INPUT */}
                                            <div style={styles.searchContainer}>
                                                <span style={styles.searchIcon}>
                                                    👤
                                                </span>
                                                <input
                                                    type="text"
                                                    placeholder="Participant username..."
                                                    value={filterUsername}
                                                    onChange={(e) => {
                                                        setFilterUsername(e.target.value);
                                                        liveFilterParticipant(e.target.value);
                                                    }}
                                                    style={styles.searchInput}
                                                />

                                            </div>
                                            {/* ARTIFACT DROPDOWN */}
                                            <div style={{ flex: 1, minWidth: "220px" }}>
                                                <select
                                                    value={selectedArtifact}
                                                    onChange={(e) => {
                                                        const fieldCode = e.target.value;
                                                        setSelectedArtifact(fieldCode);
                                                        liveFilterArtifact(fieldCode); // fieldCode ile filtrele
                                                    }}
                                                    style={{
                                                        width: "100%",
                                                        height: "40px",
                                                        padding: "8px 12px",
                                                        borderRadius: "12px",
                                                        border: "1px solid rgba(255,255,255,0.12)",
                                                        background: "rgba(15,23,42,0.8)",
                                                        color: "#e5e7eb",
                                                        fontSize: "0.95rem",
                                                    }}
                                                >
                                                    <option value="">All Artifacts</option>

                                                    {artifactList.map(a => (
                                                        <option key={a.fieldCode} value={a.fieldCode}>
                                                            {a.fieldCode} — {a.filename}
                                                        </option>
                                                    ))}
                                                </select>

                                            </div>
                                            <div style={styles.filterButtonsRow}>
                                                <button
                                                    onClick={loadComments}
                                                    style={
                                                        styles.filterButtonSecondary
                                                    }
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        </div>
                                        <p style={styles.smallHint}>
                                            Filter uses server-side query, so it
                                            will only return comments from that
                                            participant on this task.
                                        </p>
                                    </div>
                                </div>

                                {/* COMMENTS CONTENT */}
                                {Object.keys(grouped).length === 0 ? (
                                    <p style={styles.noComments}>
                                        No comments found.
                                    </p>
                                ) : (
                                    <div style={styles.groupsGrid}>
                                        {Object.keys(grouped).map((field) => (
                                            <div
                                                key={field}
                                                style={styles.groupBox}
                                            >
                                                <div
                                                    style={
                                                        styles.groupHeaderRow
                                                    }
                                                >
                                                    <h3 style={styles.groupTitle}>
                                                        Artifact: {artifactNameByField[field] || field}
                                                    </h3>
                                                    <span
                                                        style={
                                                            styles.groupBadge
                                                        }
                                                    >
                                                        {grouped[field].length}{" "}
                                                        message
                                                        {grouped[field].length >
                                                        1
                                                            ? "s"
                                                            : ""}
                                                    </span>
                                                </div>

                                                <div style={styles.chatBox}>
                                                    {grouped[field]
                                                        .sort((a, b) => (b.pinned === true) - (a.pinned === true))
                                                        .map(c => renderThread(c))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* DELETED COMMENTS */}
                                {/* DELETED COMMENTS */}
                                {deletedLogs.length > 0 && (
                                    <>
                                        <h3 style={styles.deletedTitle}>
                                            Deleted Comments (Audit Log)
                                        </h3>

                                        <div style={styles.deletedGrid}>
                                            {deletedLogs.map(root =>
                                                renderDeletedThread(
                                                    root,
                                                    0,
                                                    openDeletedReplies,
                                                    setOpenDeletedReplies
                                                )
                                            )}
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {activeTab === "logs" && (
                            <div style={styles.logsWrapper}>
                                <div style={styles.logCard}>
                                    <h3 style={styles.logTitle}>
                                        Researcher Action Logs
                                    </h3>

                                    <div style={styles.logContainer}>
                                        {researcherLogs.length === 0 ? (
                                            <p style={styles.noComments}>
                                                No logs recorded for this task
                                                yet.
                                            </p>
                                        ) : (
                                            researcherLogs.map(
                                                (log, index) => (
                                                    <div
                                                        key={index}
                                                        style={styles.logRow}
                                                    >
                                                        <div
                                                            style={
                                                                styles.timeCol
                                                            }
                                                        >
                                                            {new Date(
                                                                log.createdAt
                                                            ).toLocaleString()}
                                                        </div>

                                                        <div
                                                            style={
                                                                styles.actionCol
                                                            }
                                                        >
                                                            <span
                                                                style={
                                                                    styles.actionType
                                                                }
                                                            >
                                                                {log.action}
                                                            </span>

                                                            {log.targetUsername && (
                                                                <span
                                                                    style={
                                                                        styles.targetUser
                                                                    }
                                                                >
                                                                    →
                                                                    @
                                                                    {
                                                                        log.targetUsername
                                                                    }
                                                                </span>
                                                            )}

                                                            {log.commentId && (() => {
                                                                const content = findAnyCommentContent(
                                                                    log.commentId,
                                                                    comments,
                                                                    deletedLogsOriginal,
                                                                    log.action           // 🔥 YENİ: aksiyonu da gönderiyoruz
                                                                );

                                                                return (
                                                                    <span style={styles.commentText}>
            {content
                ? `“${content.length > 80 ? content.substring(0,80) + '…' : content}”`
                : "(comment not found)"
            }
        </span>
                                                                );
                                                            })()}

                                                        </div>

                                                        <div
                                                            style={
                                                                styles.userCol
                                                            }
                                                        >
                                                            @
                                                            {
                                                                log.researcherUsername
                                                            }
                                                        </div>
                                                    </div>
                                                )
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
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
                `}
            </style>
        </div>
    );
}

/* -------------------- STYLES ---------------------- */
const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
        position: "relative",
    },

    /* PARTICLES */
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
        display: "flex",
        alignItems: "center",
        gap: "10px",
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
        transition: "0.2s ease",
    },

    /* WRAPPER */
    centerWrapper: {
        width: "90%",
        maxWidth: "1000px",
        margin: "0 auto",
        paddingTop: "22px",
        paddingBottom: "40px",
        position: "relative",
        zIndex: 2,
    },

    loading: {
        color: "#a5b4fc",
        textAlign: "center",
        marginTop: "40px",
    },

    /* TAB BAR */
    tabBar: {
        display: "inline-flex",
        borderRadius: "999px",
        padding: "4px",
        background: "rgba(15,23,42,0.85)",
        border: "1px solid rgba(148,163,184,0.45)",
        marginBottom: "18px",
    },

    tabButton: {
        padding: "6px 18px",
        borderRadius: "999px",
        background: "transparent",
        border: "none",
        color: "#cbd5e1",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: "0.95rem",
        transition: "0.25s",
    },

    activeTabButton: {
        padding: "6px 18px",
        borderRadius: "999px",
        background: "rgba(96,165,250,0.22)",
        border: "none",
        color: "#e5e7eb",
        fontWeight: 700,
        cursor: "pointer",
        fontSize: "0.95rem",
        boxShadow: "0 0 10px rgba(96,165,250,0.4)",
        transition: "0.25s",
    },

    /* FILTERS */
    filterWrapper: {
        width: "100%",
        marginBottom: "20px",
        marginTop: "4px",
    },

    filterToggle: {
        width: "100%",
        height: "48px",
        padding: "12px 18px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#93c5fd",
        fontSize: "0.98rem",
        cursor: "pointer",
        transition: "0.3s",
        textAlign: "left",
    },

    filterPanel: {
        overflow: "hidden",
        background: "rgba(15,23,42,0.95)",
        borderRadius: "14px",
        border: "1px solid rgba(148,163,184,0.35)",
        marginTop: "10px",
        transition: "all 0.3s ease",
        boxShadow: "0 18px 35px rgba(15,23,42,0.9)",
    },

    filterContentRow: {
        display: "flex",
        gap: "16px",
        alignItems: "center",
        flexWrap: "wrap",
    },

    searchContainer: {
        position: "relative",
        flex: 1,
        minWidth: "220px",
    },

    searchIcon: {
        position: "absolute",
        top: "50%",
        left: "14px",
        transform: "translateY(-50%)",
        opacity: 0.6,
        fontSize: "0.9rem",
    },

    searchInput: {
        width: "100%",
        height: "40px",
        padding: "8px 16px 8px 38px",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(15,23,42,0.8)",
        color: "#e5e7eb",
        fontSize: "0.95rem",
        outline: "none",
        transition: "0.25s",
    },

    filterButtonsRow: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
    },

    filterButtonPrimary: {
        padding: "9px 16px",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #3b82f6, #38bdf8)",
        border: "none",
        color: "white",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "0.9rem",
        boxShadow: "0 0 12px rgba(56,189,248,0.45)",
        whiteSpace: "nowrap",
        transition: "0.25s",
    },

    filterButtonSecondary: {
        padding: "9px 16px",
        borderRadius: "10px",
        background: "rgba(129,140,248,0.22)",
        border: "1px solid rgba(129,140,248,0.6)",
        color: "#e0e7ff",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "0.9rem",
        whiteSpace: "nowrap",
        transition: "0.25s",
    },

    smallHint: {
        fontSize: "0.78rem",
        color: "#64748b",
        marginTop: "8px",
    },

    /* GROUPED COMMENT CARDS */
    groupsGrid: {
        display: "flex",
        flexDirection: "column",
        gap: "22px",
        marginTop: "6px",
    },

    groupBox: {
        background: "rgba(15,23,42,0.9)",
        borderRadius: "16px",
        padding: "18px 20px",
        border: "1px solid rgba(148,163,184,0.35)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 18px 35px rgba(15,23,42,0.85)",
    },

    groupHeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
        gap: "10px",
    },

    groupTitle: {
        fontSize: "1.05rem",
        fontWeight: 700,
        color: "#7dd3fc",
    },

    groupBadge: {
        fontSize: "0.8rem",
        color: "#cbd5e1",
        padding: "4px 10px",
        borderRadius: "999px",
        background: "rgba(148,163,184,0.15)",
        border: "1px solid rgba(148,163,184,0.4)",
        whiteSpace: "nowrap",
    },

    chatBox: {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },

    message: {
        padding: "10px 12px 12px 12px",
        borderRadius: "12px",
        background: "rgba(15,23,42,0.98)",
        border: "1px solid rgba(30,64,175,0.55)",
    },

    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "6px",
    },

    username: {
        fontWeight: 600,
        color: "#93c5fd",
        fontSize: "0.9rem",
    },

    time: {
        fontSize: "0.78rem",
        color: "#64748b",
    },

    bubble: {
        marginTop: "2px",
        background:
            "linear-gradient(135deg, rgba(30,64,175,0.95), rgba(56,189,248,0.85))",
        padding: "10px 12px",
        borderRadius: "10px",
        color: "white",
        fontSize: "0.93rem",
        boxShadow: "0 10px 18px rgba(15,23,42,0.9)",

        maxWidth: "100%",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        whiteSpace: "pre-wrap",
    },

    pinnedBubble: {
        marginTop: "2px",
        background:
            "linear-gradient(135deg, rgba(250,204,21,0.95), rgba(251,191,36,0.9))",
        padding: "10px 12px",
        borderRadius: "10px",
        color: "#111827",
        fontSize: "0.93rem",
        boxShadow: "0 10px 18px rgba(180,83,9,0.9)",
        border: "1px solid rgba(250,204,21,0.9)",

        maxWidth: "100%",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        whiteSpace: "pre-wrap",
    },

    actionsRow: {
        marginTop: "8px",
        display: "flex",
        justifyContent: "flex-end",
        gap: "8px",
    },

    pinBtn: {
        background: "rgba(250,204,21,0.19)",
        border: "1px solid rgba(250,204,21,0.7)",
        padding: "6px 10px",
        borderRadius: "9px",
        cursor: "pointer",
        color: "#facc15",
        fontWeight: "600",
        fontSize: "0.85rem",
        whiteSpace: "nowrap",
    },

    deleteBtn: {
        background: "rgba(239,68,68,0.18)",
        border: "1px solid rgba(239,68,68,0.6)",
        padding: "6px 10px",
        borderRadius: "9px",
        cursor: "pointer",
        color: "#fecaca",
        fontWeight: "600",
        fontSize: "0.85rem",
        whiteSpace: "nowrap",
    },

    noComments: {
        color: "#a5b4fc",
        fontSize: "0.98rem",
        marginTop: "24px",
        textAlign: "center",
    },
    /* -------------------- DELETED COMMENTS -------------------- */

    deletedTitle: {
        fontSize: "1.2rem",
        fontWeight: "700",
        marginTop: "32px",
        marginBottom: "14px",
        color: "#f87171",
        textAlign: "left",
    },

    deletedGrid: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },

    deletedCard: {
        background: "rgba(127,29,29,0.22)",
        borderRadius: "14px",
        padding: "16px 20px",
        border: "1px solid rgba(239,68,68,0.45)",
        boxShadow: "0 15px 30px rgba(0,0,0,0.35)",
        backdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },

    deletedHeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "0.9rem",
        color: "#fecaca",
    },

    deletedContent: {
        marginTop: "6px",
        background: "rgba(255,0,0,0.12)",
        padding: "12px",
        borderRadius: "8px",
        color: "#fca5a5",
        fontStyle: "italic",
    },

    reason: {
        color: "#f87171",
        fontSize: "0.85rem",
    },

    deletedMetaRow: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "0.8rem",
        color: "#fca5a5",
    },

    /* -------------------- LOGS -------------------- */

    logsWrapper: {
        marginTop: "20px",
        display: "flex",
        justifyContent: "center",
        width: "100%",
    },

    logCard: {
        width: "100%",
        background: "rgba(15,23,42,0.9)",
        borderRadius: "16px",
        padding: "20px 24px",
        border: "1px solid rgba(148,163,184,0.35)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 18px 35px rgba(15,23,42,0.85)",
    },

    logTitle: {
        marginBottom: "18px",
        fontSize: "1.25rem",
        fontWeight: 700,
        color: "#38bdf8",
    },

    logContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },

    logRow: {
        display: "grid",
        gridTemplateColumns: "1fr 2fr 1fr",
        alignItems: "center",
        background: "rgba(30, 41, 59, 0.6)",
        border: "1px solid rgba(148,163,184,0.3)",
        padding: "12px 16px",
        borderRadius: "10px",
        color: "#e2e8f0",
    },

    timeCol: {
        fontSize: "0.88rem",
        color: "#94a3b8",
    },

    actionCol: {
        display: "flex",
        gap: "10px",
        fontSize: "0.95rem",
        fontWeight: 600,
        flexWrap: "wrap",
    },

    actionType: {
        background: "rgba(56,189,248,0.2)",
        border: "1px solid rgba(56,189,248,0.4)",
        padding: "4px 8px",
        borderRadius: "8px",
        color: "#38bdf8",
        fontWeight: 700,
    },

    targetUser: {
        color: "#fcd34d",
        fontWeight: 600,
    },

    commentId: {
        color: "#93c5fd",
    },

    userCol: {
        textAlign: "right",
        color: "#7dd3fc",
        fontWeight: 700,
    },
    repliesBtn: {
        marginTop: "6px",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.2)",
        padding: "4px 10px",
        borderRadius: "8px",
        color: "#93c5fd",
        fontSize: "0.8rem",
        cursor: "pointer",
        transition: "0.25s",
    },

    replyList: {
        marginTop: "10px",
        marginLeft: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        borderLeft: "2px solid rgba(148,163,184,0.25)",
        paddingLeft: "14px",
    },

    replyMessage: {
        background: "rgba(30,41,59,0.8)",
        borderRadius: "10px",
        padding: "8px 10px",
        border: "1px solid rgba(56,189,248,0.25)"
    },

    replyBubble: {
        marginTop: "4px",
        padding: "8px 10px",
        borderRadius: "8px",
        background: "rgba(56,189,248,0.2)",
        color: "#e0f2fe",
        fontSize: "0.9rem",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        whiteSpace: "pre-wrap",
    },
    deletedReplyList: {
        marginTop: "10px",
        marginLeft: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        borderLeft: "2px solid rgba(239,68,68,0.35)",
        paddingLeft: "14px",
    },
};

export default TaskCommentsPage;
