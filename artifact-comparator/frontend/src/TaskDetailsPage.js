import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "prismjs/themes/prism-okaidia.css";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import { diffLines } from "diff";

import "./App.css";
import ParticipantNavbar from "./components/ParticipantNavbar";
import { Pencil, Trash2 } from "lucide-react";

function TaskDetailPage() {
    const { taskId } = useParams();
    const { studyId } = useParams();
    const [selectedArtifacts, setSelectedArtifacts] = useState([]);
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const username = storedUser?.username || "Participant";

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [textContents, setTextContents] = useState({});
    const [hover, setHover] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [activeAction, setActiveAction] = useState(null);
    const [activeArtifact, setActiveArtifact] = useState(null);
    const [compareHover, setCompareHover] = useState(null);

    const fieldCodes = ["A", "A1", "A2", "B", "B1", "B2", "C", "D"];

    const [commentsByField, setCommentsByField] = useState({});
    const [newCommentText, setNewCommentText] = useState("");
    const [imageUrls, setImageUrls] = useState({});
    const [pdfUrls, setPdfUrls] = useState({});

    const gridRef = useRef(null);

    // 🔥 REPORT STATE
    const [reportContext, setReportContext] = useState(null);
    // { targetType: "ARTIFACT" | "PARTICIPANT", artifact, reportedUsername? }
    const [reportReason, setReportReason] = useState("");
    const [reportDescription, setReportDescription] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportSuccess, setReportSuccess] = useState("");

    const navigate = useNavigate();

    //reply comment
    const [replyTarget, setReplyTarget] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [openReplies, setOpenReplies] = useState({});
    const [openCommentForArtifact, setOpenCommentForArtifact] = useState(null);

    //edit or delete comment
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editText, setEditText] = useState("");

    //new evaluation format
    const [answers, setAnswers] = useState({});

    //particles
    const [particles, setParticles] = useState([]);

    const [activeImageCriterion, setActiveImageCriterion] = useState(null);
    const [drawingRect, setDrawingRect] = useState({});
    const imageRefs = useRef({});
    const [imageHighlights, setImageHighlights] = useState({});

    const [taskIndex, setTaskIndex] = useState(null);
    const [totalTasks, setTotalTasks] = useState(null);

    const codeEditCriterion = task?.evaluationCriteria?.find(
        c => c.type === "CODE_EDIT"
    ) || null;

    const isCodeEditTask = Boolean(codeEditCriterion);
    const [codePreviewOpen, setCodePreviewOpen] = useState(false);
    const commentRefs = useRef({});

    const highlightRef = useRef(null);
    const [caret, setCaret] = useState({
        line: 0,
        column: 0
    });
    const textareaRef = useRef(null);
    const updateCaret = () => {
        const el = textareaRef.current;
        if (!el) return;

        const pos = el.selectionStart;
        const text = el.value.slice(0, pos);

        const lines = text.split("\n");
        const line = lines.length - 1;
        const column = lines[lines.length - 1].length;

        setCaret({ line, column });
    };


    const handleSubmit = async () => {
        if (!task) return;

        const token = localStorage.getItem("token");

        const orderedAnswers = task.evaluationCriteria
            .slice()
            .sort((a, b) => a.priorityOrder - b.priorityOrder)
            .map(c => answers[c.id] ?? "");

        const payload = {
            taskId: task.id,
            answers: orderedAnswers
        };

        try {
            const res = await fetch("http://localhost:8080/api/participant/submit-response", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Submit failed");

            alert("Submit successful!");

            // 🔁 NEXT TASK LOGIC
            const tasksRes = await fetch(
                `http://localhost:8080/api/studies/${studyId}/evaluation-tasks`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );


            if (tasksRes.ok) {
                const tasks = await tasksRes.json();

                const currentIndex = tasks.findIndex(t => t.id === task.id);
                const nextTask = tasks[currentIndex + 1];

                setTimeout(() => {
                    if (nextTask) {
                        navigate(`/study/${studyId}/tasks/${nextTask.id}`);
                    } else {
                        navigate(`/study/${studyId}/tasks`);
                    }
                }, 300);
            }


        } catch (err) {
            console.error(err);
            alert("Submit error");
        }
    };

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

    const goToNextTask = async () => {
        const token = localStorage.getItem("token");

        const res = await fetch(
            `http://localhost:8080/api/studies/${studyId}/evaluation-tasks`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) return;

        const tasks = await res.json();
        const idx = tasks.findIndex(t => t.id === Number(taskId));

        if (idx !== -1 && idx < tasks.length - 1) {
            navigate(`/study/${studyId}/tasks/${tasks[idx + 1].id}`);
        }
    };

    const goToPrevTask = async () => {
        const token = localStorage.getItem("token");

        const res = await fetch(
            `http://localhost:8080/api/studies/${studyId}/evaluation-tasks`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) return;

        const tasks = await res.json();
        const idx = tasks.findIndex(t => t.id === Number(taskId));

        if (idx > 0) {
            navigate(`/study/${studyId}/tasks/${tasks[idx - 1].id}`);
        }
    };

    const getFileColor = (filename) => {
        const ext = filename.split(".").pop().toLowerCase();

        switch (ext) {
            case "java":
                return { bg: "rgba(244,114,182,0.15)", color: "#f472b6" };
            case "cpp":
                return { bg: "rgba(96,165,250,0.15)", color: "#60a5fa" };
            case "py":
                return { bg: "rgba(250,204,21,0.15)", color: "#fde047" };
            case "js":
                return { bg: "rgba(34,197,94,0.15)", color: "#4ade80" };
            case "ts":
                return { bg: "rgba(96,165,250,0.15)", color: "#3b82f6" };
            case "pdf":
                return { bg: "rgba(239,68,68,0.15)", color: "#f87171" };
            case "txt":
                return { bg: "rgba(156,163,175,0.15)", color: "#9ca3af" };
            default:
                return { bg: "rgba(156,163,175,0.15)", color: "#9ca3af" };
        }
    };

    // --------------------------
    // SCROLL TO CARD FUNC
    // --------------------------
    const scrollToIndex = (i) => {
        if (!gridRef.current) return;

        const grid = gridRef.current;
        const card = grid.children[i];

        const cardWidth = card.offsetWidth;
        const gridWidth = grid.offsetWidth;

        const target = card.offsetLeft - gridWidth / 2 + cardWidth / 2;

        grid.scrollTo({
            left: target,
            behavior: "smooth",
        });
    };

    const toggleSelect = (id) => {
        setSelectedArtifacts((prev) => {
            if (prev.includes(id)) {
                return prev.filter((x) => x !== id);
            }
            if (prev.length >= 3) return prev;
            return [...prev, id];
        });
    };

    // COMMENT SECTION
    const submitComment = (fieldCode) => {
        const text = newCommentText[fieldCode];
        if (!text || !text.trim()) return;

        const token = localStorage.getItem("token");

        fetch("http://localhost:8080/api/comments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                taskId: Number(taskId),
                fieldCode: fieldCode,
                content: text,
                parentCommentId: null,
            }),
        })
            .then((res) => res.json())
            .then((saved) => {
                setCommentsByField((prev) => ({
                    ...prev,
                    [fieldCode]: [...(prev[fieldCode] || []), saved],
                }));

                // sadece o field’ın textarea’sını temizle
                setNewCommentText((p) => ({ ...p, [fieldCode]: "" }));
            })
            .catch((err) => console.error(err));
    };

    const likeComment = (commentId, fieldCode) => {
        const token = localStorage.getItem("token");

        fetch(`http://localhost:8080/api/comments/${commentId}/like`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((updated) => {
                setCommentsByField((prev) => ({
                    ...prev,
                    [fieldCode]: (prev[fieldCode] || []).map((c) =>
                        c.id === commentId ? updated : c
                    ),
                }));
            })
            .catch((err) => console.error("Like error:", err));
    };

    const deleteComment = async (commentId, fieldCode) => {
        const token = localStorage.getItem("token");

        const res = await fetch(`http://localhost:8080/api/comments/${commentId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) {
            alert("Delete failed.");
            return;
        }

        // UI'dan kaldır
        setCommentsByField(prev => ({
            ...prev,
            [fieldCode]: prev[fieldCode].map(c =>
                c.id === commentId ? { ...c, deleted: true, content: "deleted" } : c
            )
        }));
    };

    const editComment = async (commentId, fieldCode, newContent) => {
        const token = localStorage.getItem("token");

        const res = await fetch(`http://localhost:8080/api/comments/${commentId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ content: newContent })
        });

        if (!res.ok) {
            alert("Edit failed.");
            return;
        }

        setCommentsByField(prev => ({
            ...prev,
            [fieldCode]: prev[fieldCode].map(c =>
                c.id === commentId ? { ...c, content: newContent } : c
            )
        }));
    };

    const submitReply = (fieldCode, parentId) => {
        if (!replyText.trim()) return;

        const token = localStorage.getItem("token");

        fetch("http://localhost:8080/api/comments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                taskId: Number(taskId),
                fieldCode: fieldCode,
                content: replyText,
                parentCommentId: parentId,
            }),
        })
            .then((res) => res.json())
            .then(() => {
                // 🔥 SAYFAYI YENİLEMİŞ GİBİ: sadece bu field’ın commentlerini çek
                fetch(
                    `http://localhost:8080/api/comments/task/${taskId}/field/${fieldCode}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                    .then(res => res.json())
                    .then(data => {
                        setCommentsByField(prev => ({
                            ...prev,
                            [fieldCode]: data
                        }));
                    });

                setReplyTarget(null);
                setReplyText("");
            })
            .catch((err) => console.error(err));
    };

    const renderCommentThread = (c, fieldCode, depth = 0) => {
        const isMine = c.username === username;
        const isReply = !!c.parentCommentId;

        return (
            <div key={c.id} style={{ marginLeft: depth * 22 }}>
                {/* COMMENT BUBBLE */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: isReply
                            ? "flex-start" // reply HER ZAMAN solda
                            : (isMine ? "flex-end" : "flex-start"),
                        marginBottom: "12px",
                    }}
                >
                    <div
                        style={{
                            maxWidth: "62%",                 // 🔽 biraz dar
                            padding: "8px 12px",              // 🔽 küçült
                            paddingTop: isMine ? "28px" : "6px",  // <--- YENİ EKLEDİĞİMİZ
                            position: "relative",
                            borderRadius: "10px",
                            background: isMine
                                ? "linear-gradient(135deg, rgba(14,165,233,0.7), rgba(2,132,199,0.7))"
                                : "rgba(255,255,255,0.08)",
                            border: isMine
                                ? "1px solid rgba(14,165,233,0.4)"
                                : "1px solid rgba(255,255,255,0.12)",
                            color: "white",
                            backdropFilter: "blur(6px)",
                            boxShadow: isMine
                                ? "0 4px 12px rgba(14,165,233,0.25)"
                                : "0 4px 12px rgba(0,0,0,0.25)",
                            fontSize: "0.95rem",
                            lineHeight: "1.45",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            transition: "0.25s",
                        }}
                    >
                        {/* Username + Like + Report */}
                        {!isMine && (
                            <div
                                style={{
                                    fontWeight: "600",
                                    marginBottom: "4px",
                                    opacity: 0.85,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                {c.username}

                                <button
                                    onClick={() => likeComment(c.id, fieldCode)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: c.userLiked ? "#f87171" : "#aaa",
                                        cursor: "pointer",
                                    }}
                                >
                                    {c.userLiked ? "❤️" : "🤍"} {c.likeCount}
                                </button>

                                {/* Report button */}
                                <button
                                    onClick={() => {
                                        setActiveAction("report");
                                        setReportContext({
                                            targetType: "PARTICIPANT",
                                            artifact: null,
                                            reportedUsername: c.username,
                                            commentId: c.id,   // ✅ BURASI DOĞRU YER
                                        });
                                    }}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#facc15",
                                        cursor: "pointer",
                                    }}
                                >
                                    ⚠️
                                </button>
                            </div>
                        )}
                        {/* EDIT + DELETE BUTTONS FOR OWNER */}
                        {isMine && !c.deleted && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "6px",
                                    right: "8px",
                                    display: "flex",
                                    gap: "10px",
                                    opacity: 0.8,
                                }}
                            >
                                <Pencil
                                    size={18}
                                    color="#60a5fa"
                                    style={{ cursor: "pointer", transition: "0.2s" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#93c5fd")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "#60a5fa")}
                                    onClick={() => {
                                        setEditingCommentId(c.id);
                                        setEditText(c.content);
                                    }}
                                />

                                <Trash2
                                    size={18}
                                    color="#f87171"
                                    style={{ cursor: "pointer", transition: "0.2s" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fca5a5")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "#f87171")}
                                    onClick={() => deleteComment(c.id, fieldCode)}
                                />
                            </div>
                        )}
                        {/* Content */}
                        {/* CONTENT OR EDIT MODE */}
                        {editingCommentId === c.id ? (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    maxWidth: "320px",    // ⭐ textarea genişliği = buton hizası
                                    gap: "8px",
                                }}
                            >
        <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            style={{
                width: "100%",
                maxWidth: "320px",   // ⭐ bubble ne kadar geniş olursa olsun aşmaz
                minHeight: "60px",
                maxHeight: "150px",
                overflowY: "auto",
                overflowX: "hidden",
                whiteSpace: "normal",
                wordBreak: "break-word",
                padding: "8px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
            }}
        />

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        onClick={() => {
                                            editComment(c.id, fieldCode, editText);
                                            setEditingCommentId(null);
                                        }}
                                        style={{
                                            background: "rgba(56,189,248,0.35)",
                                            padding: "6px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(56,189,248,0.6)",
                                            color: "#a5f3fc",
                                        }}
                                    >
                                        Save
                                    </button>

                                    <button
                                        onClick={() => setEditingCommentId(null)}
                                        style={{
                                            background: "rgba(255,255,255,0.1)",
                                            padding: "6px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(255,255,255,0.2)",
                                            color: "white",
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ whiteSpace: "pre-wrap" }}>
                                {c.deleted ? "[deleted]" : c.content}
                            </div>
                        )}

                        {/* Footer */}
                        <div
                            style={{
                                fontSize: "0.7rem",
                                opacity: 0.6,
                                marginTop: "6px",
                                textAlign: isMine ? "right" : "left",
                            }}
                        >
                            {new Date(c.createdAt).toLocaleString()}
                        </div>
                        {/* SEE REPLIES */}
                        {c.replies && c.replies.length > 0 && (
                            <button
                                onClick={() =>
                                    setOpenReplies(prev => ({
                                        ...prev,
                                        [c.id]: !prev[c.id]
                                    }))
                                }
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#60a5fa",
                                    cursor: "pointer",
                                    fontSize: "0.8rem",
                                    marginTop: "4px"
                                }}
                            >
                                {openReplies[c.id] ? "Hide replies ▲" : `See replies (${c.replies.length}) ▼`}
                            </button>
                        )}
                        {/* REPLY BUTTON */}
                        {!isMine && (
                            <button
                                style={{
                                    marginTop: "4px",
                                    background: "none",
                                    border: "none",
                                    color: "#60a5fa",
                                    cursor: "pointer",
                                    fontSize: "0.8rem",
                                }}
                                onClick={() =>
                                    setReplyTarget(c.id === replyTarget ? null : c.id)
                                }
                            >
                                Reply
                            </button>
                        )}

                        {/* REPLY BOX */}
                        {replyTarget === c.id && (
                            <div style={{ marginTop: "6px" }}>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0px",
                                    borderRadius: "6px",
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    color: "white",
                                }}
                                placeholder="Write a reply..."
                            />

                                <button
                                    onClick={() =>
                                        submitReply(fieldCode, c.id)
                                    }
                                    style={{
                                        marginTop: "6px",
                                        background: "rgba(56,189,248,0.35)",
                                        padding: "6px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid rgba(56,189,248,0.6)",
                                        color: "#a5f3fc",
                                    }}
                                >
                                    Send Reply
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* CHILD COMMENTS */}
                {openReplies[c.id] && c.replies &&
                    c.replies.map(child =>
                        renderCommentThread(child, fieldCode, depth + 1)
                    )}
            </div>
        );
    };

    const submitReport = async () => {
        if (!reportReason.trim() || !reportDescription.trim()) {
            setReportError("Please provide both a reason and a description.");
            setReportSuccess("");
            return;
        }

        if (!reportContext) return;

        setReportSubmitting(true);
        setReportError("");
        setReportSuccess("");

        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:8080/api/reports", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    taskId: Number(taskId),
                    type: reportContext.targetType, // "ARTIFACT" | "PARTICIPANT"
                    artifactId:
                        reportContext.targetType === "ARTIFACT"
                            ? reportContext.artifact?.id
                            : reportContext.artifact?.id || null,
                    reportedUsername:
                        reportContext.targetType === "PARTICIPANT"
                            ? reportContext.reportedUsername
                            : null,

                    commentId:
                        reportContext.targetType === "PARTICIPANT"
                            ? reportContext.commentId   // 🔥 ARTIK GİDİYOR
                            : null,

                    reason: reportReason,
                    description: reportDescription,
                }),
            });

            if (!res.ok) {
                throw new Error("Report failed");
            }

            await res.json(); // istersen ignore

            setReportSuccess("Report submitted. Thank you.");
            setReportError("");

            // İstersen bir süre sonra modal’ı kapat
            setTimeout(() => {
                setActiveAction(null);
                setReportContext(null);
                setReportReason("");
                setReportDescription("");
                setReportSuccess("");
            }, 800);
        } catch (e) {
            console.error(e);
            setReportError("An error occurred while submitting the report.");
            setReportSuccess("");
        } finally {
            setReportSubmitting(false);
        }
    };

    useEffect(() => {
        if (!task) return;

        // 🔥 Tek artifact varsa otomatik seç
        if (task.artifacts.length === 1) {
            setSelectedArtifacts([task.artifacts[0].id]);
        }
    }, [task]);

    useEffect(() => {
        if (codePreviewOpen) {
            Prism.highlightAll();
        }
    }, [codePreviewOpen, answers]);

    const escapeHtml = (s = "") =>
        s
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    const highlightCode = (code, lang) => {
        try {
            const grammar =
                Prism.languages?.[lang] ||
                Prism.languages?.markup ||
                Prism.languages?.javascript;

            // Prism çıktı HTML'dir, güvenli olsun diye önce normalize edip highlight yapıyoruz.
            return Prism.highlight(code ?? "", grammar, lang || "markup");
        } catch (e) {
            // Prism fail olursa plain text göster
            return escapeHtml(code ?? "");
        }
    };

    const renderCodeEditCompare = (f, crit) => {
        const original = textContents[f.id] || "";

        const parsed = answers[crit.id]
            ? JSON.parse(answers[crit.id])
            : null;

        const edited = parsed?.editedCode ?? original;
        const lang = detectLanguage(f.filename);

        const editCodeStyle = {
            width: "100%",
            height: "100%",
            minHeight: "320px",
            background: "transparent",
            color: "rgba(255,255,255,0.01)", // 🔥 KRİTİK
            zIndex: 2,

            caretColor: "#e5e7eb",
            fontFamily: "JetBrains Mono, Fira Code, monospace",
            fontSize: "0.85rem",
            lineHeight: "1.65",
            padding: "16px",
            borderRadius: "14px",
            boxSizing: "border-box",    // 🔥 KRİTİK

            border: "none",
            outline: "none",
            resize: "vertical",
            boxShadow: `
        inset 0 0 0 1px rgba(255,255,255,0.04),
        inset 0 -40px 60px rgba(2,6,23,0.6)
    `,
            paddingBottom: "48px", // 🔥 HARD BUFFER
        };

        // 🔥 Preview açıldığında Prism çalıştır
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* TOGGLE */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "rgba(255,255,255,0.04)",
                    padding: "6px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    marginBottom: "10px",
                    justifyContent: "flex-end",
                }}>
                    <button
                        style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            background: codePreviewOpen
                                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                                : "rgba(0,0,0,0.35)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            transition: "all 0.2s ease",
                        }}
                        onClick={() => setCodePreviewOpen(p => !p)}
                    >
                        {codePreviewOpen ? "✏️ Edit" : "👁 Preview"}
                    </button>
                    <button
                        style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            background: "rgba(239,68,68,0.25)",
                            border: "1px solid rgba(239,68,68,0.6)",
                            color: "#fecaca",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            transition: "all 0.2s ease",
                        }}
                        onClick={() => {
                            setAnswers(prev => ({
                                ...prev,
                                [crit.id]: JSON.stringify({
                                    version: 1,
                                    artifactId: f.id,
                                    editedCode: original   // 🔥 RESET
                                })
                            }));
                        }}
                    >
                        🗑 Reset changes
                    </button>

                </div>

                {/* EDIT MODE */}
                {!codePreviewOpen && (
                    <div style={styles.editorWrapper}>
        <pre
            ref={highlightRef}
            className={`language-${detectLanguage(f.filename)}`}
            style={styles.highlightLayer}
            dangerouslySetInnerHTML={{
                __html: highlightCode(
                    edited,
                    detectLanguage(f.filename)
                )
            }}
        />
                    <textarea
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                        autoComplete="off"
                        data-gramm="false"
                        data-gramm_editor="false"
                        data-enable-grammarly="false"
                        ref={textareaRef}
                        value={edited}
                        onChange={(e) => {
                            setAnswers(prev => ({
                                ...prev,
                                [crit.id]: JSON.stringify({
                                    version: 1,
                                    artifactId: f.id,
                                    editedCode: e.target.value
                                })
                            }));
                            // 🔥 EKLE
                        }}
                        onScroll={(e) => {

                            if (highlightRef.current) {
                                highlightRef.current.scrollTop = e.target.scrollTop;
                                highlightRef.current.scrollLeft = e.target.scrollLeft;
                            }
                        }}
                        placeholder="Edit the code here..."
                        style={editCodeStyle}
                    />
                    </div>
                )}

                {/* PREVIEW MODE */}
                {codePreviewOpen && (
                    <div
                        style={{
                            ...styles.compareText,
                            height: "350px",
                            overflowY: "auto",
                            padding: "10px",

                            // 🔥 KRİTİK OVERRIDE
                            display: "block",              // flex mirasını öldür
                            textAlign: "left",             // center mirasını öldür
                            alignItems: "stretch",
                            justifyContent: "flex-start",
                        }}
                    >
                        <DiffPreview
                            original={original}
                            edited={edited}
                            lang={lang}
                        />
                    </div>
                )}
            </div>
        );
    };


    //RATING EVALUATION
    function ModernRating({ value, onChange }) {
        const [hoverValue, setHoverValue] = React.useState(null);

        // 🔥 YENİ: önceki value’yu tut
        const prevValueRef = React.useRef(value);

        React.useEffect(() => {
            prevValueRef.current = value;
        }, [value]);

        return (
            <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
                {[1,2,3,4,5].map((n) => {

                    // ⭐ SADECE seçilen yıldızlar sarı olacak
                    const isFilled = n <= value;

                    // ⭐ Hover sadece büyütür, glow verir
                    const isHovered = hoverValue === n;

                    const shouldAnimate =
                        n === value && prevValueRef.current !== value;

                    return (
                        <div
                            key={n}
                            onMouseEnter={() => setHoverValue(n)}
                            onMouseLeave={() => setHoverValue(null)}
                            onClick={() => onChange(n)}
                        >
                            <AnimatedFillStar
                                id={n}
                                filled={isFilled}        // ⭐ sadece seçili yıldızlar dolu
                                hovered={isHovered}      // ⭐ hover efekti
                                animate={shouldAnimate} // ⭐ animasyon sadece seçilen yıldızda
                            />
                        </div>
                    );
                })}
            </div>
        );
    }

    function AnimatedFillStar({ filled, hovered, animate, id }) {
        const size = 32;
        const clipId = `clip-${id}`;

        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                style={{
                    cursor: "pointer",
                    justifyContent: "center",
                    alignItems: "center",
                    transition: "transform .25s ease",
                    transform: hovered ? "scale(1.22)" : "scale(1)",
                    filter: filled
                        ? "drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))"
                        : "none",
                }}
            >
                {/* Only animate if this star is selected */}
                <clipPath id={clipId}>
                    <rect
                        x="0"
                        y="0"
                        width={filled ? 24 : 0}
                        height="24"
                    >
                        {animate && (
                            <animate
                                attributeName="width"
                                from="0"
                                to="24"
                                dur="0.35s"
                                fill="freeze"
                            />
                        )}
                    </rect>
                </clipPath>

                {/* Outline */}
                <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
                    fill="none"
                    stroke="#FFF7C6"
                    strokeWidth="1.6"
                />

                {/* Yellow fill */}
                <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
                    clipPath={`url(#${clipId})`}
                    fill="#FFD700"
                />
            </svg>
        );
    }

    const commonEditorWrapper = {
        ...styles.editorWrapper,
        height: "180px",
        minHeight: "150px",
    };

    const commonTextStyle = {
        width: "100%",
        height: "100%",
        background: "transparent",
        color: "#e5e7eb",
        caretColor: "#e5e7eb",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "0.9rem",
        lineHeight: "1.6",
        padding: "16px",
        border: "none",
        outline: "none",
        resize: "none",
        boxSizing: "border-box",
        boxShadow: `
        inset 0 0 0 1px rgba(255,255,255,0.04),
        inset 0 -40px 60px rgba(2,6,23,0.6)
    `,
    };

    function renderCriterionInput(crit) {
        const value = answers[crit.id] || "";

        switch (crit.type) {

            /* ------------------ RATING ------------------ */
            case "RATING":
                return (
                    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                        <ModernRating
                            value={Number(value) || 0}
                            onChange={(v) =>
                                setAnswers({ ...answers, [crit.id]: v })
                            }
                        />
                    </div>
                );
            /* ------------------ MULTIPLE CHOICE ------------------ */
            case "MULTIPLE_CHOICE":
                return (
                    <div style={styles.choiceGrid}>
                        {crit.options.map((opt, i) => {
                            const selected = crit.multipleSelection
                                ? (value ? value.split(",") : []).includes(opt)
                                : value === opt;

                            return (
                                <div
                                    key={i}
                                    style={{
                                        ...styles.choiceCard,
                                        ...(selected ? styles.choiceCardSelected : {}),
                                    }}
                                    onClick={() => {
                                        if (!crit.multipleSelection) {
                                            setAnswers({ ...answers, [crit.id]: opt });
                                        } else {
                                            let setVal = new Set(value ? value.split(",") : []);
                                            if (setVal.has(opt)) setVal.delete(opt);
                                            else setVal.add(opt);
                                            setAnswers({
                                                ...answers,
                                                [crit.id]: Array.from(setVal).join(","),
                                            });
                                        }
                                    }}
                                >
                                    <span style={styles.choiceText}>{opt}</span>
                                </div>
                            );
                        })}
                    </div>
                );
            /* ------------------ OPEN ENDED TEXT ------------------ */


            case "OPEN_ENDED":
                return (
                    <div style={commonEditorWrapper}>
            <textarea
                value={value}
                onChange={e =>
                    setAnswers({ ...answers, [crit.id]: e.target.value })
                }

                /* 🔥 BACKEND SINIRLARI */
                minLength={crit.minLength ?? undefined}
                maxLength={crit.maxLength ?? undefined}

                placeholder={
                    crit.minLength || crit.maxLength
                        ? `${crit.minLength ?? 0}–${crit.maxLength ?? "∞"} characters`
                        : "Type your answer…"
                }

                style={commonTextStyle}
            />

                        {/* 🔹 küçük counter (opsiyonel ama çok iyi durur) */}
                        {crit.maxLength && (
                            <div style={{ textAlign: "right", fontSize: "0.75rem", opacity: 0.6 }}>
                                {value?.length || 0} / {crit.maxLength}
                            </div>
                        )}
                    </div>
                );
            /* ------------------ NUMERIC ------------------ */
            case "NUMERIC": {
                const min = crit.minValue;
                const max = crit.maxValue;
                const integerOnly = crit.integerOnly;

                const handleChange = (e) => {
                    let v = e.target.value;

                    // boş bırakmaya izin ver (silme için)
                    if (v === "") {
                        setAnswers({ ...answers, [crit.id]: "" });
                        return;
                    }

                    // number'a çevir
                    let num = Number(v);
                    if (Number.isNaN(num)) return;

                    // integer zorunluysa
                    if (integerOnly) {
                        num = Math.trunc(num);
                    }

                    // clamp
                    if (min != null && num < min) num = min;
                    if (max != null && num > max) num = max;

                    setAnswers({ ...answers, [crit.id]: num });
                };

                return (
                    <div style={commonEditorWrapper}>
                        <input
                            type="number"
                            value={value ?? ""}
                            onChange={handleChange}

                            /* sadece UX için */
                            min={min}
                            max={max}
                            step={integerOnly ? 1 : "any"}

                            style={{
                                ...commonTextStyle,
                                textAlign: "center",
                                fontSize: "1.6rem",
                                fontWeight: 800,
                            }}
                        />

                        {(min != null || max != null) && (
                            <div style={{
                                textAlign: "center",
                                fontSize: "0.75rem",
                                opacity: 0.6,
                                marginTop: "6px"
                            }}>
                                Allowed range: {min ?? "-∞"} – {max ?? "∞"}
                            </div>
                        )}
                    </div>
                );
            }
            /* ------------------ CODE EDIT ------------------ */
            case "CODE_EDIT":
                return (
                    <textarea
                        style={{ width: "100%", minHeight: 120, fontFamily: "monospace" }}
                        value={value}
                        onChange={e =>
                            setAnswers({ ...answers, [crit.id]: e.target.value })
                        }
                    />
                );

            /* ------------------ IMAGE HIGHLIGHT ------------------ */
            case "IMAGE_HIGHLIGHT":
                return (
                    <div style={{ fontSize: "0.85rem", opacity: 0.75, textAlign: "center" }}>
                        Select a region on the image above
                    </div>

                );

            default:
                return <div>Unsupported criterion type</div>;
        }
    }

    function DiffPreview({ original, edited, lang, style }) {
        // line bazlı diff
        const parts = diffLines(
            normalize(original),
            normalize(edited)
        );

        // Prism language fallback
        const grammar =
            Prism.languages?.[lang] ||
            Prism.languages?.markup ||
            Prism.languages?.javascript;

        let lineNoOld = 1;
        let lineNoNew = 1;

        const rows = [];

        for (let idx = 0; idx < parts.length; idx++) {
            const p = parts[idx];
            const next = parts[idx + 1];

            const isReplace =
                p.removed &&
                next?.added &&
                p.value.split("\n").length === next.value.split("\n").length;

            // 🔥 REPLACE DURUMU: SADECE YENİ (ADDED) SATIRLARI ÇİZ
            if (isReplace) {
                const lines = next.value.split("\n");

                lines.forEach((line, i) => {
                    if (line === "" && i === lines.length - 1) return;

                    const highlighted = Prism.highlight(
                        line,
                        grammar,
                        lang || "markup"
                    );

                    const DIFF_ROW_STYLE = {
                        display: "grid",
                        gridTemplateColumns: "52px 52px 1fr",
                        gap: "10px",
                        padding: "6px 10px",
                        borderRadius: "10px",
                        fontFamily: "monospace",
                        fontSize: "0.9rem",
                        lineHeight: "1.45",
                    };

                    rows.push(
                        <div
                            key={`replace-${idx}-${i}`}
                            style={{
                                ...DIFF_ROW_STYLE,
                                background: "rgba(34,197,94,0.18)",   // 🟢 CHANGED
                                border: "1px solid rgba(34,197,94,0.35)",
                            }}
                        >
                            <div style={{ opacity: 0.45, textAlign: "right", paddingRight: "20px" }}>
                                {lineNoOld++}
                            </div>
                            <div style={{ opacity: 0.45, textAlign: "right", paddingRight: "20px" }}>
                                {lineNoNew++}
                            </div>
                            <div
                                style={{ whiteSpace: "pre" }}
                                dangerouslySetInnerHTML={{ __html: highlighted }}
                            />
                        </div>
                    );
                });

                idx++;          // 🔥 added bloğunu da tüket
                continue;       // 🔥 bu iteration burada biter
            }

            // 🔹 NORMAL DURUMLAR (added / removed / unchanged)
            const lines = p.value.split("\n");

            lines.forEach((line, i) => {
                if (line === "" && i === lines.length - 1) return;

                let bg = "transparent";
                let border = "1px solid rgba(255,255,255,0.08)";

                if (p.added) {
                    bg = "rgba(34,197,94,0.20)";
                    border = "1px solid rgba(34,197,94,0.35)";
                } else if (p.removed) {
                    // ❌ tamamen silinen satır — istersek hiç render etmeyebiliriz
                    bg = "rgba(239,68,68,0.18)";
                    border = "1px solid rgba(239,68,68,0.35)";
                }

                const oldNum = p.added ? "" : lineNoOld++;
                const newNum = p.removed ? "" : lineNoNew++;

                const highlighted = Prism.highlight(
                    line,
                    grammar,
                    lang || "markup"
                );

                rows.push(
                    <div
                        key={`${idx}-${i}`}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "52px 52px 1fr",
                            gap: "10px",
                            padding: "6px 10px",
                            borderRadius: "10px",
                            background: bg,
                            border,
                            fontFamily: "monospace",
                            fontSize: "0.9rem",
                        }}
                    >
                        <div style={{ opacity: 0.45, textAlign: "right",paddingRight: "20px",}}>
                            {oldNum}
                        </div>
                        <div style={{ opacity: 0.45, textAlign: "right", paddingRight: "20px",  }}>
                            {newNum}
                        </div>
                        <div
                            style={{ whiteSpace: "pre" }}
                            dangerouslySetInnerHTML={{ __html: highlighted }}
                        />
                    </div>
                );
            });
        }


        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    padding: "10px",
                    borderRadius: "12px",
                }}
            >
                {/* 🔹 LEGEND: OLD / NEW */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "52px 52px 1fr",
                        gap: "10px",
                        marginBottom: "8px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        opacity: 0.75,
                    }}
                >
                    <div style={{ textAlign: "right", color: "#94a3b8", paddingRight: "4px" }}>
                        OLD
                    </div>
                    <div style={{ textAlign: "right", color: "#22c55e", paddingLeft: "4px" }}>
                        NEW
                    </div>
                    <div />
                </div>
                {rows}
            </div>
        );
    }

    function normalize(s) {
        if (!s) return "";
        return s.replace(/\r\n/g, "\n").replace(/\n$/, "");
    }

    useEffect(() => {
        if (!task) return;

        const token = localStorage.getItem("token");

        fetch(`http://localhost:8080/api/participant/task-response/${task.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                const orderedCriteria = task.evaluationCriteria
                    .slice()
                    .sort((a, b) => a.priorityOrder - b.priorityOrder);

                const restoredAnswers = {};

                orderedCriteria.forEach((crit, idx) => {
                    restoredAnswers[crit.id] = data.answers?.[idx] ?? "";
                });

                setAnswers(restoredAnswers);
            });
    }, [task]);

    //highligh parse
    useEffect(() => {
        if (!task) return;

        task.evaluationCriteria
            .filter(c => c.type === "IMAGE_HIGHLIGHT")
            .forEach(crit => {
                const raw = answers[crit.id];
                if (!raw) return;

                try {
                    const parsed = JSON.parse(raw);

                    if (parsed.version !== 2) return;

                    const field = parsed.field; // "A" | "B" | "C" | ...
                    const artifactIndex = task.responseFields.indexOf(field);
                    if (artifactIndex === -1) return;

                    const artifactId = task.artifacts[artifactIndex].id;

                    setImageHighlights(prev => ({
                        ...prev,
                        [artifactId]: {
                            ...(prev[artifactId] || {}),
                            [crit.id]: parsed.shapes
                        }
                    }));
                } catch {
                    // JSON bozuksa sessiz geç
                }
            });
    }, [answers, task]);



    useEffect(() => {
        const fetchTaskOrder = async () => {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `http://localhost:8080/api/studies/${studyId}/evaluation-tasks`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (!res.ok) return;

            const tasks = await res.json();

            const index = tasks.findIndex(t => t.id === Number(taskId));

            if (index !== -1) {
                setTaskIndex(index + 1);      // 1-based
                setTotalTasks(tasks.length);
            }
        };

        fetchTaskOrder();
    }, [taskId, studyId]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setDrawingRect({}); // 🔥 anlık çizimi iptal et
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

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

    useEffect(() => {
        Prism.highlightAll();
    }, [textContents]);

    useEffect(() => Prism.highlightAll(), [selectedArtifacts]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        fetch(`http://localhost:8080/api/tasks/details/${taskId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setTask(data);
                setLoading(false);

                data.artifacts.forEach((f) => {



                    // === TEXT FILE ===
                    if (isTextFile(f.filename)) {
                        fetch(`http://localhost:8080/file/${f.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        })
                            .then((res) => res.text())
                            .then((txt) =>
                                setTextContents((prev) => ({
                                    ...prev,
                                    [f.id]: txt,
                                }))
                            );
                    }

                    // === IMAGE FILE ===
                    if (isImage(f.filename)) {
                        fetch(`http://localhost:8080/file/${f.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        })
                            .then((res) => res.blob())
                            .then((blob) => {
                                const url = URL.createObjectURL(blob);

                                setImageUrls((prev) => ({
                                    ...prev,
                                    [f.id]: url,
                                }));
                            });
                    }
                    if (isPdf(f.filename)) {
                        fetch(`http://localhost:8080/file/${f.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        })
                            .then((res) => res.blob())
                            .then((blob) => {
                                const url = URL.createObjectURL(blob);

                                setPdfUrls((prev) => ({
                                    ...prev,
                                    [f.id]: url,
                                }));
                            });
                    }

                });

            })
            .catch((err) => console.error("Task fetch error:", err));
    }, [taskId]);

    useEffect(() => {
        if (selectedCard) {
            setTimeout(() => Prism.highlightAll(), 50);
        }
    }, [selectedCard]);

    useEffect(() => {
        if (!taskId) return;

        const token = localStorage.getItem("token");

        fieldCodes.forEach((field) => {
            fetch(
                `http://localhost:8080/api/comments/task/${taskId}/field/${field}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
                .then((res) => res.json())
                .then((data) => {
                    setCommentsByField((prev) => ({
                        ...prev,
                        [field]: data,
                    }));
                })
                .catch((err) =>
                    console.error("Comments fetch error:", err)
                );
        });
    }, [taskId]);

    if (loading) return <div style={styles.loading}>Loading...</div>;
    if (!task) return <div style={styles.loading}>Task not found</div>;

    const artifacts = task.artifacts;

    return (
        <div style={styles.container}>
            <ParticipantNavbar
                username={username}
                onBack={() => navigate(`/study/${studyId}/tasks`)}
            />

            {/* =========================
   TASK HEADER
========================= */}
            {/* TITLE */}
            <h1
                style={{
                    ...styles.taskTitle,
                    textAlign: "center",
                    marginBottom: "12px",
                }}
            >
                {task.questionText}
            </h1>

            {/* DESCRIPTION */}
            {task.description && (
                <p
                    style={{
                        ...styles.taskDescription,
                        textAlign: "center",
                        margin: "0 auto 10px",
                        maxWidth: "760px",
                    }}
                >
                    {task.description}
                </p>
            )}

            {/* META LINE — TITLE & DESCRIPTION ALTINDA */}
            <div
                style={{
                    ...styles.taskMeta,
                    justifyContent: "center",
                    marginBottom: "24px",
                }}
            >
    <span style={styles.taskIndexBadge}>
        Task {taskIndex} / {totalTasks}
    </span>
            </div>


            {/* ======================================
                GRID — yatay scroll + snap
               ====================================== */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    gap: "12px",
                    overflow: "visible",
                }}
            >
                {/* LEFT ARROW */}
                <button
                    type="button"
                    onClick={goToPrevTask}
                    style={{
                        position: "absolute",
                        left: "12px",

                        transform: "translateY(-50%)",
                        ...styles.gridArrow,
                    }}
                >
                    ← Previous Task
                </button>
            <div id="artifact-grid" ref={gridRef} style={{
                ...styles.grid,
                maxWidth: "85vw",   // 👈 oklar için yer açıyor
                margin: "0 12px",
            }}>
                {artifacts.map((f) => {
                    const fileUrl = `http://localhost:8080${f.filepath}`;

                    return (

                        <div
                            key={f.id}
                            style={{
                                ...styles.card,
                                ...(hover === f.id ? styles.cardHover : {}),
                                ...(selectedArtifacts.includes(f.id)
                                    ? {
                                        border: "1px solid #60a5fa",
                                        boxShadow:
                                            "0 0 20px rgba(96,165,250,0.45)",
                                    }
                                    : {}),
                            }}
                            onMouseEnter={() => setHover(f.id)}
                            onMouseLeave={() => setHover(null)}
                            onClick={() => toggleSelect(f.id)}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                <div
                                    style={{
                                        background:
                                        getFileColor(f.filename).bg,
                                        color: getFileColor(f.filename).color,
                                        padding: "6px 10px",
                                        borderRadius: "10px",
                                        fontSize: "1.2rem",
                                    }}
                                >
                                    {getFileIcon(f.filename)}
                                </div>

                                <h3 style={styles.filename}>
                                    {f.filename}
                                </h3>
                            </div>

                            {isTextFile(f.filename) && (
                                <pre style={styles.snippetBox}>
                                    {textContents[f.id]
                                        ?.split("\n")
                                        .slice(0, 4)
                                        .join("\n") || "Loading..."}
                                </pre>
                            )}

                            {isImage(f.filename) && (
                                <img
                                    src={imageUrls[f.id]}
                                    alt={f.filename}
                                    style={styles.compareImage}
                                />
                            )}

                            {!isTextFile(f.filename) &&
                                !isImage(f.filename) && (
                                    <p style={styles.fileNotice}>
                                        Click to open details →
                                    </p>
                                )}

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginTop: 10,
                                }}
                            >
                                <div
                                    style={{
                                        ...styles.selectBadge,
                                        ...(selectedArtifacts.includes(f.id)
                                            ? styles.selectBadgeActive
                                            : styles.selectBadgeInactive),
                                    }}
                                >
                                    {selectedArtifacts.includes(f.id)
                                        ? "Selected"
                                        : "Select"}
                                </div>
                                <button
                                    style={styles.viewBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCard(f);
                                    }}
                                >
                                    View
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
                {/* RIGHT ARROW */}
                <button
                    type="button"
                    onClick={goToNextTask}
                    style={{
                        position: "absolute",
                        right: "12px",
                        transform: "translateY(-50%)",
                        ...styles.gridArrow,
                    }}
                >
                    Next Task →
                </button>
            </div>


            {/* ======================================
                COMPARISON AREA
               ====================================== */}
            {selectedArtifacts.length > 0 && (
                <div style={styles.comparisonArea}>
                    {selectedArtifacts.map((id) => {
                        const f = artifacts.find((x) => x.id === id);
                        const index = artifacts.findIndex(x => x.id === id);   // ⭐ YENİ
                        const code = task.responseFields[index];
                        if (!f) return null;

                        return (
                            <div
                                key={id}
                                style={{
                                    ...styles.compareCard,
                                    width:
                                        selectedArtifacts.length === 1
                                            ? "85vw"
                                            : selectedArtifacts.length === 2
                                                ? "40vw"
                                                : "30vw",
                                }}
                                onMouseEnter={() => setCompareHover(id)}
                                onMouseLeave={() => setCompareHover(null)}
                            >
                                {/* FLOATING ACTION BAR — SAĞ ÜST */}
                                <div
                                    style={{
                                        ...styles.floatingBar,
                                        opacity:
                                            compareHover === f.id ? 1 : 0,
                                    }}
                                    onMouseEnter={() => setHover(f.id)}
                                    onMouseLeave={() => setHover(null)}
                                >
                                    {activeImageCriterion && activeArtifact?.id === f.id && (
                                        <button
                                            style={{
                                                ...styles.floatBtn,
                                                background: "rgba(239,68,68,0.35)",
                                                border: "1px solid rgba(239,68,68,0.6)",
                                                boxShadow: "0 0 10px rgba(239,68,68,0.6)",
                                            }}
                                            onClick={() => {
                                                // 1️⃣ UI STATE TEMİZLE
                                                setImageHighlights(prev => {
                                                    const copy = { ...prev };
                                                    if (copy[f.id]) {
                                                        delete copy[f.id][activeImageCriterion];
                                                    }
                                                    return copy;
                                                });

                                                // 2️⃣ ANSWERS TEMİZLE
                                                setAnswers(prev => {
                                                    const copy = { ...prev };
                                                    delete copy[activeImageCriterion];
                                                    return copy;
                                                });
                                            }}
                                            title="Clear highlights"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                    <button
                                        style={{
                                            ...styles.floatBtn,

                                            background:
                                                openCommentForArtifact === f.id
                                                    ? "rgba(56,189,248,0.35)"
                                                    : "rgba(0,0,0,0.45)",

                                            border:
                                                openCommentForArtifact === f.id
                                                    ? "1px solid rgba(56,189,248,0.8)"
                                                    : "1px solid rgba(255,255,255,0.25)",

                                            boxShadow:
                                                openCommentForArtifact === f.id
                                                    ? "0 0 12px rgba(56,189,248,0.8)"
                                                    : "none",

                                            transform:
                                                openCommentForArtifact === f.id
                                                    ? "scale(1.08)"
                                                    : "scale(1)",
                                        }}
                                        onClick={() => {
                                            setOpenCommentForArtifact(prev => {
                                                const next = prev === f.id ? null : f.id;

                                                // 🔥 SADECE AÇILIRKEN SCROLL
                                                if (next === f.id) {
                                                    setTimeout(() => {
                                                        commentRefs.current[f.id]?.scrollIntoView({
                                                            behavior: "smooth",
                                                            block: "start",
                                                        });
                                                    }, 80); // render bitsin diye
                                                }

                                                return next;
                                            });
                                        }}
                                        title="Comments"
                                    >
                                        💬
                                    </button>
                                    <button
                                        style={{
                                            ...styles.floatBtn,
                                            background:
                                                activeImageCriterion && activeArtifact?.id === f.id
                                                    ? "rgba(56,189,248,0.35)"
                                                    : "rgba(0,0,0,0.45)",
                                            border:
                                                activeImageCriterion && activeArtifact?.id === f.id
                                                    ? "1px solid rgba(56,189,248,0.8)"
                                                    : "1px solid rgba(255,255,255,0.25)",
                                            boxShadow:
                                                activeImageCriterion && activeArtifact?.id === f.id
                                                    ? "0 0 12px rgba(56,189,248,0.8)"
                                                    : "none",
                                        }}
                                        onClick={() => {
                                            const imageCritId =
                                                task.evaluationCriteria.find(c => c.type === "IMAGE_HIGHLIGHT")?.id;

                                            // 🔁 TOGGLE LOGIC
                                            if (
                                                activeArtifact?.id === f.id &&
                                                activeImageCriterion === imageCritId
                                            ) {
                                                // KAPAT
                                                setActiveImageCriterion(null);
                                                setActiveArtifact(null);
                                            } else {
                                                // AÇ
                                                setActiveArtifact(f);
                                                setActiveImageCriterion(imageCritId);
                                            }
                                        }}
                                        title="Highlight the image"
                                    >
                                        ✨
                                    </button>
                                    <button
                                        style={styles.floatBtn}
                                        onClick={() => {
                                            setActiveArtifact(f);
                                            setReportContext({
                                                targetType: "ARTIFACT",
                                                artifact: f,
                                                reportedUsername: null,
                                                commentId: null, // ✅ BURADA NULL
                                            });
                                            setReportReason("");
                                            setReportDescription("");
                                            setReportError("");
                                            setReportSuccess("");
                                            setActiveAction("report");
                                        }}
                                        title="Report"
                                    >
                                        ⚠️
                                    </button>
                                </div>

                                {/* HEADER */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                    }}
                                >
                                    <div
                                        style={{
                                            background:
                                            getFileColor(f.filename).bg,
                                            color: getFileColor(f.filename)
                                                .color,
                                            padding: "6px 10px",
                                            borderRadius: "10px",
                                            fontSize: "1.2rem",
                                        }}
                                    >
                                        {getFileIcon(f.filename)}
                                    </div>

                                    <h3 style={styles.compareTitle}>
                                        {f.filename}
                                    </h3>
                                </div>

                                {/* CONTENT */}

                                {/* TEXT FILE */}
                                {isTextFile(f.filename) && (
                                    isCodeEditTask
                                        ? renderCodeEditCompare(f, codeEditCriterion)
                                        : (
                                            <pre
                                                style={{
                                                    ...styles.compareText,
                                                    flexShrink: 0,
                                                    height: "350px",
                                                    overflowY: "auto",
                                                }}
                                            >
                <code className={`language-${detectLanguage(f.filename)}`}>
                    {textContents[f.id] || "Loading..."}
                </code>
            </pre>
                                        )
                                )}

                                {/* IMAGE FILE */}
                                {isImage(f.filename) && (
                                    <div
                                        style={{ position: "relative", width: "100%", height: "420px", overflow: "hidden",            // 🔥 ÇOK ÖNEMLİ
                                            cursor: activeImageCriterion ? "crosshair" : "default",  }}
                                        onMouseDown={(e) => {
                                            if (!activeImageCriterion) return;

                                            // 🔥 EĞER ZATEN ÇİZİM VARSA, DOKUNMA
                                            if (drawingRect[f.id]) {
                                                return;
                                            }

                                            const img = imageRefs.current[f.id];
                                            if (!img) return;

                                            const rect = img.getBoundingClientRect();
                                            const x = e.clientX - rect.left;
                                            const y = e.clientY - rect.top;

                                            setDrawingRect(prev => ({
                                                ...prev,
                                                [f.id]: {
                                                    x0: x,
                                                    y0: y,
                                                    x1: x,
                                                    y1: y,
                                                }
                                            }));
                                        }}


                                        onMouseMove={(e) => {
                                            if (!drawingRect[f.id]) return;

                                            const img = imageRefs.current[f.id];
                                            if (!img) return;

                                            const rect = img.getBoundingClientRect();

                                            const x = e.clientX - rect.left;
                                            const y = e.clientY - rect.top;

                                            setDrawingRect(prev => ({
                                                ...prev,
                                                [f.id]: {
                                                    ...prev[f.id],
                                                    x1: x,
                                                    y1: y,
                                                }
                                            }));
                                        }}


                                        onMouseUp={() => {
                                            if (!drawingRect[f.id]) return;

                                            const img = imageRefs.current[f.id];
                                            if (!img) return;

                                            const rect = img.getBoundingClientRect();
                                            const r = drawingRect[f.id];

                                            const x = Math.min(r.x0, r.x1);
                                            const y = Math.min(r.y0, r.y1);
                                            const w = Math.abs(r.x1 - r.x0);
                                            const h = Math.abs(r.y1 - r.y0);

                                            if (w < 5 || h < 5) {
                                                setDrawingRect(prev => {
                                                    const copy = { ...prev };
                                                    delete copy[f.id];
                                                    return copy;
                                                });
                                                return;
                                            }

                                            const round = (v) => Number(v.toFixed(3));

                                            const norm = {
                                                shape: "RECT",
                                                x: round(x / rect.width),
                                                y: round(y / rect.height),
                                                w: round(w / rect.width),
                                                h: round(h / rect.height),
                                            };

                                            // ✅ 1) UI STATE — ARRAY PUSH
                                            setImageHighlights(prev => ({
                                                ...prev,
                                                [f.id]: {
                                                    ...(prev[f.id] || {}),
                                                    [activeImageCriterion]: [
                                                        ...(prev[f.id]?.[activeImageCriterion] || []),
                                                        norm
                                                    ]
                                                }
                                            }));

                                            // ✅ 2) BACKEND ANSWER — ARRAY
                                            const existing =
                                                imageHighlights[f.id]?.[activeImageCriterion] || [];

                                            setAnswers(prev => ({
                                                ...prev,
                                                [activeImageCriterion]: JSON.stringify({
                                                    version: 2,
                                                    field: task.responseFields[artifacts.indexOf(f)],
                                                    shapes: [...existing, norm]
                                                })
                                            }));

                                            // cleanup
                                            setDrawingRect(prev => {
                                                const copy = { ...prev };
                                                delete copy[f.id];
                                                return copy;
                                            });
                                        }}


                                    >
                                        {activeImageCriterion && activeArtifact?.id === f.id &&  (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: "12px",
                                                    left: "12px",
                                                    padding: "6px 10px",
                                                    borderRadius: "8px",
                                                    background: "rgba(0,0,0,0.65)",
                                                    border: "1px solid rgba(56,189,248,0.7)",
                                                    color: "#67e8f9",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                    zIndex: 10,          // 🔥 img’in üstünde
                                                    pointerEvents: "none",
                                                }}
                                            >
                                                ✨ Draw highlight region
                                            </div>
                                        )}
                                        <img
                                            ref={(el) => (imageRefs.current[f.id] = el)}
                                            src={imageUrls[f.id]}
                                            alt={f.filename}
                                            draggable={false}
                                            style={{
                                                ...styles.compareImage,
                                                position: "relative",
                                                zIndex: 1,
                                                width: "100%",
                                                height: "420px",
                                                cursor: activeImageCriterion ? "crosshair" : "default",
                                            }}
                                        />
                                        {Array.isArray(imageHighlights[f.id]?.[activeImageCriterion])
                                            ? imageHighlights[f.id][activeImageCriterion].map((r, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        position: "absolute",
                                                        left: `${r.x * 100}%`,
                                                        top: `${r.y * 100}%`,
                                                        width: `${r.w * 100}%`,
                                                        height: `${r.h * 100}%`,
                                                        border: "2px solid #22d3ee",
                                                        background: "rgba(34,211,238,0.25)",
                                                        pointerEvents: "none",
                                                        zIndex: 5,
                                                    }}
                                                />
                                            ))
                                            : null}

                                        {/* 🟡 GEÇİCİ (DRAWING) RECT */}
                                        {drawingRect[f.id] && (() => {
                                            const r = drawingRect[f.id];
                                            return (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        left: Math.min(r.x0, r.x1),
                                                        top: Math.min(r.y0, r.y1),
                                                        width: Math.abs(r.x1 - r.x0),
                                                        height: Math.abs(r.y1 - r.y0),
                                                        border: "2px solid #60a5fa",
                                                        background: "rgba(96,165,250,0.25)",
                                                        pointerEvents: "none",
                                                        zIndex: 6,              // ✅
                                                    }}
                                                />
                                            );
                                        })()}

                                    </div>
                                )}


                                {/* PDF FILE */}
                                {isPdf(f.filename) && (
                                    <embed
                                        src={pdfUrls[f.id]}
                                        type="application/pdf"
                                        style={{
                                            width: "100%",
                                            height: "400px",
                                            borderRadius: "10px",
                                        }}
                                    />
                                )}

                                {/* OTHER FILE TYPES */}
                                {!isTextFile(f.filename) &&
                                    !isImage(f.filename) &&
                                    !isPdf(f.filename) && (
                                        <a
                                            href={`http://localhost:8080/file/${f.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={styles.openLink}
                                        >
                                            ➜ Open file in new tab
                                        </a>
                                    )}
                                {/* ======================================================
                                {/* === COMMENT SECTION (artifact-specific) === */}
                                {openCommentForArtifact === f.id && (() => {
                                    const code = task.responseFields[artifacts.indexOf(f)];

                                    return (
                                        <div ref={(el) => (commentRefs.current[f.id] = el)}
                                             style={{ marginTop: "25px", width: "100%" }}>
                                            <h4 style={{ textAlign: "left", marginBottom: "8px" }}>
                                                Comments for field "{code}"
                                            </h4>
                                            {/* COMMENT LIST */}
                                            {(commentsByField[code] || []).map((c) =>
                                                renderCommentThread(c, code)
                                            )}
                                            {/* INPUT */}
                                            <textarea
                                                value={newCommentText[code] || ""}
                                                onChange={(e) =>
                                                    setNewCommentText((prev) => ({
                                                        ...prev,
                                                        [code]: e.target.value,
                                                    }))
                                                }
                                                placeholder={`Write a comment for field ${code}...`}
                                                style={{
                                                    width: "100%",
                                                    padding: "10px",
                                                    borderRadius: "8px",
                                                    background: "rgba(255,255,255,0.08)",
                                                    border: "1px solid rgba(255,255,255,0.2)",
                                                    color: "white",
                                                    marginTop: "10px",
                                                }}
                                            />

                                            <button
                                                onClick={() => submitComment(code)}
                                                style={{
                                                    marginTop: "8px",
                                                    background: "rgba(56,189,248,0.35)",
                                                    padding: "10px 16px",
                                                    borderRadius: "8px",
                                                    color: "#a5f3fc",
                                                    border: "1px solid rgba(56,189,248,0.6)",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Send
                                            </button>
                                        </div>
                                    );
                                })()}

                            </div>
                        );
                    })}
                </div>
            )}
            {/* ======== GLOBAL EVALUATION (Single Render) ======== */}
            {!isCodeEditTask && (
            <div style={styles.criteriaContainer}>
                <div style={styles.criteriaContainer}>
                    {task.evaluationCriteria
                        .filter(c => c.type !== "IMAGE_HIGHLIGHT")
                        ?.sort((a, b) => a.priorityOrder - b.priorityOrder)
                        ?.map((crit, idx) => (
                            <div
                                key={crit.id}
                                style={{
                                    ...styles.criterionCard,
                                    outline:
                                        crit.id === activeImageCriterion
                                            ? "2px solid #60a5fa"
                                            : "none",
                                }}
                                onClick={() => {
                                    if (crit.type === "IMAGE_HIGHLIGHT") {
                                        setActiveImageCriterion(crit.id);
                                    }
                                }}
                            >
                                <h2 style={styles.criteriaTitle}>Evaluation Criteria</h2>
                                {/* HEADER BADGES */}
                                <div style={styles.criterionHeader}>
                                    <span style={styles.orderBadge}>#{idx + 1}</span>
                                    <span style={styles.typeBadge}>{crit.type}</span>
                                </div>

                                {/* QUESTION */}
                                <div style={styles.criterionQuestion}>{crit.question}</div>

                                {/* DESCRIPTION */}
                                {crit.description && (
                                    <div style={styles.criterionDescription}>
                                        {crit.description}
                                    </div>
                                )}

                                {/* OPTIONS LIST */}
                                {crit.type === "MULTIPLE_CHOICE" && crit.options && (
                                    <div style={{ marginTop: 12 }}>
                                        <div style={styles.optionsLabel}>Options:</div>
                                    </div>
                                )}

                                {/* USER INPUT FIELD */}
                                <div style={{ marginTop: 16 }}>
                                    {renderCriterionInput(crit)}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
            )}

            {/* SUBMIT BUTTON */}
            <div style={{ marginTop: 35, textAlign: "center" }}>
                <button
                    type="button"   // 🔥 EN ÖNEMLİ SATIR
                    style={styles.submitButton}
                    onClick={handleSubmit}
                >
                    Submit Evaluation
                </button>
            </div>


            {/* FULLSCREEN MODAL (View butonundan açılan) */}
            {selectedCard && (
                <div
                    style={styles.modalOverlay}
                    onClick={() => setSelectedCard(null)}
                >
                    <div
                        style={styles.modalCard}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>
                                {selectedCard.filename}
                            </h2>
                            <button
                                style={styles.closeBtn}
                                onClick={() => setSelectedCard(null)}
                            >
                                ✕
                            </button>
                        </div>

                        {isTextFile(selectedCard.filename) && (
                            <pre style={styles.modalTextBox}>
                                <code
                                    className={`language-${detectLanguage(
                                        selectedCard.filename
                                    )}`}
                                >
                                    {textContents[selectedCard.id]}
                                </code>
                            </pre>
                        )}

                        {isImage(selectedCard.filename) && (
                            <img
                                src={imageUrls[selectedCard.id]}
                                alt={selectedCard.filename}
                                style={styles.modalImage}
                            />
                        )}

                        {isPdf(selectedCard.filename) && (
                            <embed
                                src={pdfUrls[selectedCard.id]}
                                type="application/pdf"
                                style={{
                                    width: "100%",
                                    height: "80vh",
                                    borderRadius: "10px",
                                }}
                            />
                        )}

                        {!isTextFile(selectedCard.filename) &&
                            !isImage(selectedCard.filename) && (
                                <a
                                    href={`http://localhost:8080/file/${selectedCard.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={styles.openLink}
                                >
                                    ➜ Open file in new tab
                                </a>
                            )}
                    </div>
                </div>
            )}

            {/* REPORT MODAL (⚠️) */}
            {activeAction === "report" && reportContext && (
                <div
                    style={styles.modalOverlay}
                    onClick={() => {
                        setActiveAction(null);
                        setReportContext(null);
                        setReportReason("");
                        setReportDescription("");
                        setReportError("");
                        setReportSuccess("");
                    }}
                >
                    <div
                        style={styles.modalCard}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>
                                {reportContext.targetType === "ARTIFACT"
                                    ? `Report Artifact: ${reportContext.artifact?.filename}`
                                    : `Report Participant: ${reportContext.reportedUsername}`}
                            </h2>
                            <button
                                style={styles.closeBtn}
                                onClick={() => {
                                    setActiveAction(null);
                                    setReportContext(null);
                                    setReportReason("");
                                    setReportDescription("");
                                    setReportError("");
                                    setReportSuccess("");
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Reason */}
                        <div style={{ marginBottom: "14px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "6px",
                                    fontSize: "0.9rem",
                                    opacity: 0.9,
                                }}
                            >
                                Reason *
                            </label>
                            <select
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(255,255,255,0.25)",
                                    background: "rgba(0,0,0,0.35)",
                                    color: "white",
                                }}
                            >
                                <option value="">Select a reason</option>
                                <option value="INAPPROPRIATE_CONTENT">
                                    Inappropriate / offensive content
                                </option>
                                <option value="HARASSMENT">
                                    Harassment or abuse
                                </option>
                                <option value="SPAM">
                                    Spam or irrelevant content
                                </option>
                                <option value="OTHER">
                                    Other
                                </option>
                            </select>
                        </div>

                        {/* Description */}
                        <div style={{ marginBottom: "14px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "6px",
                                    fontSize: "0.9rem",
                                    opacity: 0.9,
                                }}
                            >
                                Description (please explain briefly) *
                            </label>
                            <textarea
                                value={reportDescription}
                                onChange={(e) =>
                                    setReportDescription(e.target.value)
                                }
                                rows={4}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(255,255,255,0.25)",
                                    background: "rgba(0,0,0,0.35)",
                                    color: "white",
                                    resize: "vertical",
                                }}
                            />
                        </div>

                        {/* Error / Success */}
                        {reportError && (
                            <div
                                style={{
                                    marginBottom: "10px",
                                    color: "#fecaca",
                                    fontSize: "0.85rem",
                                }}
                            >
                                {reportError}
                            </div>
                        )}
                        {reportSuccess && (
                            <div
                                style={{
                                    marginBottom: "10px",
                                    color: "#bbf7d0",
                                    fontSize: "0.85rem",
                                }}
                            >
                                {reportSuccess}
                            </div>
                        )}

                        {/* Buttons */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "10px",
                                marginTop: "10px",
                            }}
                        >
                            <button
                                style={styles.secondaryBtn}
                                onClick={() => {
                                    setActiveAction(null);
                                    setReportContext(null);
                                    setReportReason("");
                                    setReportDescription("");
                                    setReportError("");
                                    setReportSuccess("");
                                }}
                                disabled={reportSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                style={styles.primaryBtn}
                                onClick={submitReport}
                                disabled={reportSubmitting}
                            >
                                {reportSubmitting ? "Sending..." : "Submit report"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ---- PARTICLES ---- */}
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
                            opacity: p.opacity,
                        }}
                    />
                ))}
            </div>

            <style>{`
            @keyframes floatParticle {
                0% { transform: translateY(0); opacity: 0.4; }
                50% { opacity: 1; }
                100% { transform: translateY(-120vh); opacity: 0; }
            }
            `}</style>
        </div>
    );
}

export default TaskDetailPage;

/* ---------------------------------------------------------
   ---------- HELPER FUNCTIONS
   --------------------------------------------------------- */

function isTextFile(name) {
    return name.match(
        /\.(txt|py|cpp|c|cs|java|js|ts|json|xml|html|css|md|yml|yaml|patch)$/i
    );
}

function isImage(name) {
    return name.match(/\.(png|jpg|jpeg|gif)$/i);
}

function isPdf(name) {
    return name.toLowerCase().endsWith(".pdf");
}

function detectLanguage(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    const map = {
        txt: "markup",
        py: "python",
        cpp: "cpp",
        c: "c",
        cs: "csharp",
        java: "java",
        js: "javascript",
        ts: "typescript",
        json: "json",
        xml: "xml",
        html: "html",
        css: "css",
        md: "markdown",
        yml: "yaml",
        yaml: "yaml",
    };
    return map[ext] || "markup";
}
/* ---------------------------------------------------------
   --------------------   STYLES ----------------------------
   --------------------------------------------------------- */

const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)", // benchmark ile aynı
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
        textAlign: "center",

        /* 🔥 Navbar'ın altında kalmaması için asıl önemli kısım: */
        paddingTop: "100px",     // ← bunu kaybedince yazılar barın altına girdi
        paddingBottom: "60px",

        position: "relative",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        // overflow: "hidden" YOK  ❌
        // zIndex: 1 zorunlu değil, istersen bırakabilirsin
    },

    loading: {
        color: "#fff",
        paddingTop: "40px",
        textAlign: "center",
        fontSize: "1.2rem",
    },

    backBtn: {
        position: "absolute",
        top: "40px",
        left: "40px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "rgba(255,255,255,0.8)",
        padding: "8px 14px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        cursor: "pointer",
        backdropFilter: "blur(10px)",
    },

    title: {
        fontSize: "2rem",
        fontWeight: "800",
        marginBottom: "10px",
        background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },

    subtitle: {
        fontSize: "1rem",
        color: "rgba(255,255,255,0.6)",
        maxWidth: "700px",
        margin: "0 auto 24px",
    },

    tabBar: {
        display: "flex",
        gap: "12px",
        justifyContent: "center",
        flexWrap: "wrap",
        marginBottom: "25px",
    },

    tabBtn: {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.2)",
        padding: "8px 14px",
        borderRadius: "8px",
        cursor: "pointer",
        color: "#fff",
        fontSize: "0.9rem",
        transition: "all .2s",
    },

    grid: {
        display: "flex",
        gap: "40px",
        padding: "24px 16px",
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        scrollBehavior: "smooth",
        justifyContent: "center",
    },

    card: {
        width: "320px",
        height: "320px",
        flexShrink: 0,
        scrollSnapAlign: "center",
        overflow: "hidden",

        background: "rgba(255,255,255,0.08)",
        borderRadius: "24px",
        padding: "20px",

        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",


        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",

        boxShadow:
            "0 8px 25px rgba(0,0,0,0.35), inset 0 0 12px rgba(255,255,255,0.08)",

        transition:
            "transform 0.3s cubic-bezier(.25,.8,.25,1), box-shadow 0.3s",
        willChange: "transform",
    },
    cardHover: {
        transform: "translateZ(0) scale(1.03)",
        boxShadow:
            "0 12px 35px rgba(0,0,0,0.55), 0 0 20px rgba(80,150,255,0.45)",
    },
    filename: {
        fontSize: "1.1rem",
        fontWeight: "600",
        marginBottom: "12px",
    },
    textBox: {
        background: "rgba(255,255,255,0.1)",
        padding: "15px",
        borderRadius: "12px",
        minHeight: "300px",
        maxHeight: "600px",
        overflow: "auto",
        fontFamily: "monospace",
        color: "#fff",
        fontSize: "0.95rem",
    },
    imagePreview: {
        width: "100%",
        maxHeight: "600px",
        objectFit: "contain",
        borderRadius: "12px",
    },
    openLink: {
        color: "#38bdf8",
        textDecoration: "underline",
        fontSize: "1rem",
    },
    tab: {
        padding: "10px 18px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.06)",
        color: "white",
        cursor: "pointer",
        backdropFilter: "blur(12px)",
        transition: "0.25s",
        border: "1px solid rgba(255,255,255,0.12)",
    },

    tabActive: {
        background: "rgba(80,150,255,0.35)",
        border: "1px solid rgba(80,150,255,0.6)",
        color: "#fff",
        boxShadow: "0 0 15px rgba(80,150,255,0.45)",
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        animation: "fadeIn 0.25s ease-out",
    },

    modalCard: {
        background: "rgba(255,255,255,0.08)",
        borderRadius: "20px",
        padding: "30px",
        width: "85vw",
        height: "85vh",
        maxWidth: "900px",
        maxHeight: "80vh",
        overflowY: "auto",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 0 45px rgba(0,0,0,0.4)",
        transform: "scale(1)",
        animation: "zoomIn 0.25s ease-out",
        textAlign: "left",
    },
    modalTitle: {
        fontSize: "1.5rem",
        marginBottom: "20px",
        fontWeight: "700",
    },

    modalTextBox: {
        background: "rgba(255,255,255,0.1)",
        padding: "20px",
        borderRadius: "15px",
        whiteSpace: "pre-wrap",
        fontFamily: "monospace",
        color: "#fff",
        maxHeight: "60vh",
        overflowY: "auto",
    },

    modalImage: {
        width: "100%",
        borderRadius: "12px",
        objectFit: "contain",
    },
    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px",
    },

    closeBtn: {
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "white",
        padding: "6px 12px",
        borderRadius: "8px",
        cursor: "pointer",
    },

    snippetBox: {
        background: "rgba(255,255,255,0.08)",
        padding: "12px",
        borderRadius: "10px",
        fontSize: "0.85rem",
        maxHeight: "90px",
        overflow: "hidden",
        fontFamily: "monospace",
        whiteSpace: "pre-wrap",
    },

    thumbnail: {
        width: "100%",
        height: "150px",
        objectFit: "cover",
        borderRadius: "10px",
    },
    comparisonArea: {
        marginTop: "0px",
        display: "flex",
        gap: "20px",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "10px 20px 40px",
    },

    compareCard: {
        width: "30vw",
        // ✔ SABİT YÜKSEKLİK
        overflow: "visible",    // ✔ DIŞARI TAŞMA YOK

        display: "flex",       // ✔ İçerik dikey hizada
        flexDirection: "column",
        justifyContent: "flex-start",

        background: "rgba(255,255,255,0.08)",
        borderRadius: "20px",
        padding: "18px 24px",
        border: "1px solid rgba(255,255,255,0.15)",
        position: "relative",
    },



    compareTitle: {
        fontWeight: 600,
        marginBottom: 10,
    },

    compareText: {
        whiteSpace: "pre-wrap",
        fontFamily: "monospace",
        fontSize: "0.9rem",
        color: "#fff",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "12px",
        padding: "14px",
        backdropFilter: "blur(8px)",


    },

    compareImage: {
        width: "100%",
        height: "100%",        // 🔥 EKLE
        objectFit: "contain",
        borderRadius: "10px",
    },

    viewBtn: {
        background: "rgba(139,92,246,0.25)",
        border: "2px solid rgba(139,92,246,0.5)",
        color: "#d8b4fe",
        padding: "10px 20px",
        borderRadius: "12px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "0.9rem",
        transition: "all 0.25s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    selectBadge: {
        padding: "6px 12px",
        borderRadius: "8px",
        fontSize: "0.75rem",
        fontWeight: "600",
        transition: "all 0.25s ease",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "70px",
        textAlign: "center",
    },
    selectBadgeInactive: {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "rgba(255,255,255,0.7)",
    },
    selectBadgeActive: {
        background: "rgba(56,189,248,0.22)",
        border: "1px solid rgba(56,189,248,0.45)",
        color: "#a5f3fc",
        boxShadow: "0 0 10px rgba(56,189,248,0.35)",
    },
    floatingBar: {
        position: "absolute",
        top: "10px",
        right: "10px",
        display: "flex",
        gap: "8px",
        transition: "opacity 0.25s ease",
        zIndex: 20,
    },

    floatBtn: {
        background: "rgba(0,0,0,0.45)",
        border: "1px solid rgba(255,255,255,0.25)",
        color: "#fff",
        padding: "6px 8px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "1rem",
        backdropFilter: "blur(6px)",
    },
    primaryBtn: {
        background: "rgba(56,189,248,0.35)",
        border: "1px solid rgba(56,189,248,0.7)",
        color: "#e0f2fe",
        padding: "10px 18px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: 600,
    },
    secondaryBtn: {
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "rgba(255,255,255,0.9)",
        padding: "10px 16px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: 500,
    },

    /* MATCHING ManageEvaluationTasksPage THEME */
    criteriaContainer: {
        display: "flex",
        flexWrap: "wrap",     // ⭐ Yan yana + taşarsa alta
        gap: "20px",          // ⭐ Kartlar arası boşluk
        justifyContent: "center",  // ⭐ Ortala
        width: "100%",
    },

    criteriaTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#60a5fa",
        marginBottom: "20px",
        textAlign: "center",
    },

    criterionCard: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "15px",
        padding: "22px 24px",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(6px)",
        transition: "0.28s ease",
        boxShadow: "0 0 12px rgba(0,0,0,0.25)",
        marginBottom: "20px",
    },

    criterionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
    },

    orderBadge: {
        background: "rgba(96,165,250,0.25)",
        border: "1px solid rgba(96,165,250,0.4)",
        padding: "5px 12px",
        borderRadius: "10px",
        color: "#93c5fd",
        fontWeight: "600",
    },

    typeBadge: {
        background: "rgba(168,85,247,0.25)",
        border: "1px solid rgba(168,85,247,0.4)",
        padding: "5px 12px",
        borderRadius: "10px",
        color: "#d8b4fe",
        fontWeight: "600",
    },

    criterionQuestion: {
        fontSize: "1.15rem",
        fontWeight: "600",
        color: "#fff",
        marginBottom: "10px",
    },

    criterionDescription: {
        fontSize: "0.95rem",
        color: "rgba(255,255,255,0.8)",
        marginBottom: "14px",
    },

    optionsLabel: {
        color: "#a5b4fc",
        fontWeight: "600",
        marginBottom: "6px",
    },

    optionList: {
        marginLeft: "20px",
        color: "#cbd5e1",
    },

    optionItem: {
        marginBottom: "4px",
    },

    submitButton: {
        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
        border: "2px solid rgba(255,255,255,0.12)",
        padding: "12px 32px",
        borderRadius: "14px",
        fontSize: "1rem",
        fontWeight: "700",
        color: "#fff",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: "0 0 18px rgba(139,92,246,0.45)",
        backdropFilter: "blur(6px)",
    },
    choiceWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginTop: "12px",
    },

    choiceBtn: {
        padding: "14px 18px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "12px",
        color: "#fff",
        cursor: "pointer",
        fontSize: "1rem",
        fontWeight: 500,
        transition: "0.25s ease",
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },

    choiceBtnHover: {
        background: "rgba(56,189,248,0.15)",
        border: "1px solid rgba(56,189,248,0.45)",
        boxShadow: "0 0 10px rgba(56,189,248,0.4)",
        transform: "translateX(4px)",
    },

    choiceBtnSelected: {
        background: "rgba(56,189,248,0.35)",
        border: "1px solid rgba(56,189,248,0.8)",
        boxShadow: "0 0 15px rgba(56,189,248,0.8)",
        color: "#e0faff",
    },
    choiceGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "16px",
        marginTop: "10px",
    },

    choiceCard: {
        padding: "16px 18px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "14px",
        cursor: "pointer",
        transition: "0.25s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "15px",
    },

    choiceCardSelected: {
        background: "rgba(56,189,248,0.30)",
        border: "1px solid rgba(56,189,248,0.65)",
        boxShadow: "0 0 18px rgba(56,189,248,0.55)",
        transform: "scale(1.03)",
    },

    choiceCardHover: {
        background: "rgba(56,189,248,0.12)",
        border: "1px solid rgba(56,189,248,0.35)",
        boxShadow: "0 0 12px rgba(56,189,248,0.25)",
    },

    choiceText: {
        color: "white",
        fontSize: "1rem",
        fontWeight: 500,
        lineHeight: 1.3,
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
    },
    gridArrow: {
        fontSize: "1.8rem",

        background: "rgba(255,255,255,0.04)",   // 🔥 baştan var
        border: "1px solid rgba(255,255,255,0.12)", // 🔥 baştan var
        color: "#94a3b8",
        cursor: "pointer",
        padding: "8px",
        transition: "all 0.2s ease",
    },
    gridArrowHover: {
        color: "#c4b5fd",
        transform: "scale(1.15)",
    },
    taskHeader: {
        maxWidth: "900px",
        margin: "0 auto 0px",
        padding: "28px 32px",
        textAlign: "center",

        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "20px",

        backdropFilter: "blur(10px)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
    },

    taskMeta: {
        display: "flex",
        gap: "12px",
        marginBottom: "14px",
        alignItems: "center",
    },

    taskIndexBadge: {
        padding: "6px 14px",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: 600,
        color: "#a5f3fc",
        background: "rgba(56,189,248,0.18)",
        border: "1px solid rgba(56,189,248,0.45)",
    },

    taskTypeBadge: {
        padding: "6px 14px",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "#c4b5fd",
        background: "rgba(139,92,246,0.18)",
        border: "1px solid rgba(139,92,246,0.45)",
    },

    taskTitle: {
        fontSize: "2rem",
        fontWeight: 800,
        lineHeight: 1.25,
        marginBottom: "14px",

        background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },

    taskDescription: {
        fontSize: "1rem",
        lineHeight: 1.55,
        color: "rgba(255,255,255,0.75)",
        maxWidth: "760px",
    },

    editorWrapper: {
        position: "relative",
        width: "100%",
        height: "350px",
        minHeight: "320px",
        borderRadius: "14px",
        overflow: "hidden",
        background: "#020617",
    },

    highlightLayer: {
        position: "absolute",
        inset: 0,
        margin: 0,
        padding: "16px",
        zIndex: 1,
        background: "transparent",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "0.85rem",
        lineHeight: "1.65",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflow: "hidden",
        boxSizing: "border-box",
        pointerEvents: "none",
        paddingBottom: "48px", // 🔥 HARD BUFFER
    },

    textareaLayer: {
        position: "relative",
        width: "100%",
        minHeight: "320px",
        paddingBottom: "16px",
        background: "transparent",
        color: "transparent",      // 👈 yazı gizli
        caretColor: "#e5e7eb",      // 👈 imleç görünsün
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "0.85rem",
        lineHeight: "1.65",
        border: "none",
        outline: "none",
        resize: "vertical",
    },
};