import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    getMyInvitations,
    acceptInvitation,
    rejectInvitation,
} from "./InvitationService";

const NotificationWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [userId, setUserId] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [toast, setToast] = useState(null);
    const [invitations, setInvitations] = useState([]);
    const navigate = useNavigate();

    // Poll interval
    useEffect(() => {
        const checkUser = () => {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const user = JSON.parse(storedUser);
                setUserId(user.id);
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        checkUser();
        window.addEventListener('storage', checkUser);
        return () => window.removeEventListener('storage', checkUser);
    }, []);

    const fetchNotifications = async () => {
        if (!userId) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/notifications/user/${userId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                // Assuming backend maps isRead -> read
                setUnreadCount(data.filter(n => !n.read).length);
            }
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [userId]);

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:8080/api/notifications/${id}/read`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => {
                const wasUnread = notifications.find(n => n.id === id && !n.read);
                return wasUnread ? Math.max(0, prev - 1) : prev;
            });
        } catch (err) {
            console.error("Error marking read:", err);
        }
    };
    const loadInvitations = async () => {
        const res = await getMyInvitations();
        setInvitations(res);
    };
    const markAsAnswered = async (id) => {
        try {
            markAsRead(id);
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:8080/api/notifications/${id}/answer`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            // Mark as both answered and read
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, answered: true, read: true } : n));
            setUnreadCount(prev => {
                const wasUnread = notifications.find(n => n.id === id && !n.read);
                return wasUnread ? Math.max(0, prev - 1) : prev;
            });
        } catch (err) {
            console.error("Error marking answered:", err);
        }
    };
    /* ================= TOAST ================= */
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2800);
    };
    const handleAcceptInvite = async (e, n) => {
        e.stopPropagation();
        const token = localStorage.getItem("token");
        const studyId = n.studyId;
        if (n.type === 'INVITATION_TO_STUDY_PARTICIPANT') {
            try {

                const res = await fetch(`http://localhost:8080/api/participant/join/${studyId}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                const res2 = await fetch(`http://localhost:8080/api/invitations/${studyId}/accept`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const joined = await res.json();
                    await markAsAnswered(n.id);
                    setIsOpen(false);

                    if (joined.quiz && joined.quiz.id) {
                        navigate(`/take-quiz/${studyId}`);
                    } else {
                        navigate(`/study/${studyId}`);
                    }
                } else {
                    alert("Failed to join study.");
                }
            } catch (err) {
                console.error(err);
            }
        } else if (n.type === 'INVITATION_TO_STUDY_REVIEWER') {
            try {
                const res = await fetch(`http://localhost:8080/api/reviewers/${userId}/join-study/${studyId}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                const res2 = await fetch(`http://localhost:8080/api/invitations/${studyId}/accept`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log(res2);
                if (res.ok) {
                    await markAsAnswered(n.id);
                    alert("You have joined the study as a reviewer.");
                    navigate('/reviewer');
                } else {
                    alert("Failed to join study.");
                }
            } catch (err) {
                console.error(err);
            }
        } else if (n.type === 'INVITATION_TO_STUDY_RESEARCHER') {
            const invitation = await fetch(`http://localhost:8080/api/studies/${n.studyId}/researchers/get-invitation/${n.userId}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!invitation.ok) throw new Error("Failed to fetch invitation.");
            const invitationData = await invitation.json();
            await acceptInvitation(invitationData.id);
            showToast("Invitation accepted! 🎉", "success");
            await markAsAnswered(n.id);
            setTimeout(() => {
                navigate("/my-studies");
            }, 1000);
        }
    };

    const handleDeclineInvite = async (e, n) => {
        e.stopPropagation();
        const token = localStorage.getItem("token");
        const studyId = n.studyId;
        if (n.type === 'INVITATION_TO_STUDY_PARTICIPANT') {
            await markAsAnswered(n.id);
            const res2 = await fetch(`http://localhost:8080/api/invitations/${studyId}/reject`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } else if (n.type === 'INVITATION_TO_STUDY_REVIEWER') {
            await markAsAnswered(n.id);
            const res2 = await fetch(`http://localhost:8080/api/invitations/${studyId}/reject`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } else if (n.type === 'INVITATION_TO_STUDY_RESEARCHER') {
            const invitation = await fetch(`http://localhost:8080/api/studies/${n.studyId}/researchers/get-invitation/${n.userId}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!invitation.ok) throw new Error("Failed to fetch invitation.");
            const invitationData = await invitation.json();
            await rejectInvitation(invitationData.id);
            await markAsAnswered(n.id);
            showToast("Invitation rejected!", "error");

            loadInvitations();
        }
    };

    const handleNotificationClick = (n) => {
        // 1. Mark as read
        if (!n.read) {
            markAsRead(n.id);
        }

        // 2. Navigation Logic based on NotificationTypes Enum
        const studyId = n.studyId;
        console.log(studyId);
        switch (n.type) {
            case 'ACCEPTED_TO_STUDY_PARTICIPANT':
                if (studyId) navigate(`/study/${studyId}/tasks`);
                break;
            case 'WAITING_FOR_QUIZ_APPROVAL_RESEARCHER':
                if (studyId) navigate(`/quiz-management/${studyId}`);
                break;
            case 'STUDY_COMPLETED_BY_ALL_PARTICIPANTS_RESEARCHER':
                navigate(`/my-studies`);
                break;
            case 'USER_INFO_CHANGED_BY_ADMIN_FORALL':
                navigate(`/profile`);
                break;
            // Display-only notifications (non-navigable)
            case 'STUDY_REPORTED_ACCEPTED_RESEARCHER':
            case 'STUDY_BLOCKED_RESEARCHER':
            case 'INVITATION_TO_STUDY_PARTICIPANT': // Handled by buttons
            case 'INVITATION_TO_STUDY_REVIEWER': // Handled by buttons
            case 'INVITATION_TO_STUDY_RESEARCHER': // Handled by buttons
            default:
                break;
        }
        console.log(n.type);
    };

    // Helper to determine cursor style
    const isClickable = (type) => {
        const clickableTypes = [
            'ACCEPTED_TO_STUDY_PARTICIPANT',
            'WAITING_FOR_QUIZ_APPROVAL_RESEARCHER',
            'STUDY_COMPLETED_BY_ALL_PARTICIPANTS_RESEARCHER',
            'USER_INFO_CHANGED_BY_ADMIN_FORALL'
        ];
        return clickableTypes.includes(type);
    };

    const isInvitation = (type) => {
        return type === 'INVITATION_TO_STUDY_PARTICIPANT' || type === 'INVITATION_TO_STUDY_REVIEWER' || type === 'INVITATION_TO_STUDY_RESEARCHER';
    };

    if (!isVisible) return null;

    return (
        <div style={styles.wrapper}>
            <button onClick={() => setIsOpen(!isOpen)} style={styles.bellButton}>
                <Bell size={24} color="#fff" />
                {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
            </button>

            {isOpen && (
                <div style={styles.panel}>
                    <div style={styles.header}>
                        <h4 style={styles.title}>Notifications</h4>
                        <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>
                            <X size={18} />
                        </button>
                    </div>

                    <div style={styles.list}>
                        {notifications.length === 0 ? (
                            <div style={styles.empty}>No notifications</div>
                        ) : (
                            notifications.map(n => {
                                const clickable = isClickable(n.type);
                                const invitation = isInvitation(n.type);
                                // Check if answered (assuming backend field maps to 'answered')
                                const answered = n.answered;

                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        style={{
                                            ...styles.item,
                                            opacity: n.read ? 0.6 : 1,
                                            borderLeft: n.read ? '3px solid transparent' : '3px solid #3b82f6',
                                            cursor: clickable ? 'pointer' : 'default'
                                        }}
                                    >
                                        <div style={styles.itemContent}>
                                            <p style={styles.message}>{n.message}</p>
                                            <span style={styles.time}>
                                                {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>

                                            {/* Action Buttons for Invitations */}
                                            {invitation && !answered && (
                                                <div style={styles.actionRow}>
                                                    <button
                                                        style={{
                                                            ...styles.acceptBtn,
                                                            opacity: answered ? 0.5 : 1,
                                                            cursor: answered ? 'not-allowed' : 'pointer'
                                                        }}
                                                        onClick={(e) => handleAcceptInvite(e, n)}
                                                        disabled={answered}
                                                    >
                                                        <CheckCircle size={14} /> Accept
                                                    </button>
                                                    <button
                                                        style={{
                                                            ...styles.declineBtn,
                                                            opacity: answered ? 0.5 : 1,
                                                            cursor: answered ? 'not-allowed' : 'pointer'
                                                        }}
                                                        onClick={(e) => handleDeclineInvite(e, n)}
                                                        disabled={answered}
                                                    >
                                                        <XCircle size={14} /> Decline
                                                    </button>
                                                </div>
                                            )}
                                            {invitation && answered && (
                                                <div style={styles.answeredText}>
                                                    Response Recorded
                                                </div>
                                            )}
                                        </div>

                                        {/* Simple Mark Read checkmark for non-invites or read items */}
                                        {!n.read && !invitation && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                                style={styles.markReadBtn}
                                                title="Mark as read"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    wrapper: { position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, fontFamily: "'Inter', sans-serif" },
    bellButton: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#3b82f6', border: 'none', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'transform 0.2s' },
    badge: { position: 'absolute', top: '0', right: '0', backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', width: '22px', height: '22px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1a1a2e' },
    panel: { position: 'absolute', bottom: '80px', right: '0', width: '340px', maxHeight: '450px', backgroundColor: '#1e293b', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    header: { padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
    title: { margin: 0, color: '#fff', fontSize: '16px' },
    closeBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
    list: { overflowY: 'auto', maxHeight: '390px' },
    item: { padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', color: '#fff', transition: 'background 0.2s' },
    itemContent: { flex: 1 },
    message: { margin: '0 0 5px 0', fontSize: '14px', lineHeight: '1.4', color: '#e2e8f0' },
    time: { fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px' },
    markReadBtn: { background: 'rgba(59, 130, 246, 0.2)', border: 'none', color: '#60a5fa', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
    empty: { padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' },

    // New Styles for Actions
    actionRow: { display: 'flex', gap: '10px', marginTop: '8px' },
    acceptBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '6px 12px',
        borderRadius: '6px',
        border: 'none',
        background: '#22c55e',
        color: 'white',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        opacity: 1,
        transition: 'opacity 0.2s'
    },
    declineBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid #ef4444',
        background: 'transparent',
        color: '#ef4444',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        opacity: 1,
        transition: 'opacity 0.2s'
    },
    toast: {
        position: "fixed",
        bottom: "30px",
        right: "30px",
        padding: "15px 22px",
        borderRadius: "10px",
        color: "white",
        fontWeight: "600",
        zIndex: 9999,
        boxShadow: "0 0 15px rgba(0,0,0,0.3)",
        animation: "fadeIn 0.3s ease",
    },
    answeredText: { fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', marginTop: '5px' }
};

export default NotificationWidget;