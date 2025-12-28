import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function QuizManagementPage() {
    const { studyId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'submittedAt', direction: 'desc' });

    const fetchQuiz = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/studies/${studyId}`);
            const study = await response.json();
            setQuiz(study.quiz);
        } catch (error) {
            console.error('Error fetching quiz:', error);
        } finally {
            setLoading(false);
        }
    }, [studyId]);

    const fetchResults = useCallback(async () => {
        if (!quiz) return;
        try {
            const response = await fetch(`http://localhost:8080/api/quiz-attempt/study/${studyId}/results`);
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Error fetching results:', error);
        }
    }, [studyId, quiz]);

    useEffect(() => {
        fetchQuiz();
    }, [fetchQuiz]);

    useEffect(() => {
        if (quiz) {
            fetchResults();
        }
    }, [quiz, fetchResults]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedResults = React.useMemo(() => {
        let sortableResults = [...results];
        if (sortConfig.key) {
            sortableResults.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.key === 'submittedAt') {
                    aValue = new Date(a.submittedAt);
                    bValue = new Date(b.submittedAt);
                } else if (sortConfig.key === 'points') {
                    aValue = a.totalPointsEarned;
                    bValue = b.totalPointsEarned;
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableResults;
    }, [results, sortConfig]);

    const handleAccept = async (attemptId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/quiz-attempt/${attemptId}/accept`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Failed to accept quiz attempt");
            }

            await fetchResults();
            alert("Participant accepted!");
        } catch (error) {
            console.error("Error accepting participant:", error);
            alert("Failed to accept");
        }
    };

    const handleReject = async (attemptId) => {
        if (!window.confirm("Are you sure you want to reject this participant?")) return;

        try {
            const response = await fetch(`http://localhost:8080/api/quiz-attempt/${attemptId}/reject`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Failed to reject participant");
            }

            await fetchResults();
            alert("Participant rejected!");

        } catch (error) {
            console.error("Error rejecting participant:", error);
            alert("Failed to reject");
        }
    };

    const handleAcceptAll = async () => {
        const pending = results.filter(r => r.status === "PENDING");

        if (pending.length === 0) {
            alert("No pending participants to accept.");
            return;
        }

        if (!window.confirm(`Accept all ${pending.length} pending participants?`)) return;

        for (const result of pending) {
            await handleAccept(result.id);
        }

        await fetchResults();
    };

    const handleRejectAll = async () => {
        const pending = results.filter(r => r.status === "PENDING");

        if (pending.length === 0) {
            alert("No pending participants to reject.");
            return;
        }

        if (!window.confirm(`Reject all ${pending.length} pending participants?`)) return;

        for (const result of pending) {
            await handleReject(result.id);
        }

        await fetchResults();
    };

    const handleDeleteQuiz = async () => {
        if (!window.confirm('Are you sure you want to delete this quiz?')) return;

        try {
            await fetch(`http://localhost:8080/api/quiz/${quiz.id}`, {
                method: 'DELETE'
            });
            setQuiz(null);
            alert('Quiz deleted successfully!');
        } catch (error) {
            console.error('Error deleting quiz:', error);
            alert('Failed to delete quiz');
        }
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) {
            return <span style={styles.sortIcon}>⇅</span>;
        }
        return sortConfig.direction === 'asc' ?
            <span style={styles.sortIconActive}>↑</span> :
            <span style={styles.sortIconActive}>↓</span>;
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingCard}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Quiz Management</h1>
                    <button style={styles.backBtn} onClick={() => navigate(`/manage-study/${studyId}`)}>
                        ← Back to Study
                    </button>
                </div>

                <div style={styles.noQuizCard}>
                    <div style={styles.noQuizIcon}>
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <h2 style={styles.noQuizTitle}>No Quiz Created</h2>
                    <p style={styles.noQuizText}>Create a quiz to assess participant knowledge</p>

                    <button
                        style={styles.createQuizBtn}
                        onClick={() => navigate(`/create-quiz/${studyId}`)}
                    >
                        + Create Quiz
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Active Quiz</h1>
                <div style={styles.buttonGroup}>
                    <button
                        style={styles.statisticsBtn}
                        onClick={() => navigate(`/quiz-statistics/${quiz.id}?studyId=${studyId}`)}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '10px'}}>
                            <line x1="12" y1="20" x2="12" y2="10"/>
                            <line x1="18" y1="20" x2="18" y2="4"/>
                            <line x1="6" y1="20" x2="6" y2="16"/>
                        </svg>
                        Statistics
                    </button>
                    <button style={styles.backBtn} onClick={() => navigate(`/manage-study/${studyId}`)}>
                        ← Back to Study
                    </button>
                </div>
            </div>

            <div style={styles.grid}>
                {/* Quiz Info Card */}
                <div style={styles.glassCard}>
                    <h2 style={styles.quizTitle}>{quiz.title}</h2>
                    <p style={styles.quizDesc}>{quiz.description}</p>

                    <div style={styles.stats}>
                        <div style={styles.statItem}>
                            <span style={styles.statLabel}>Topic:</span>
                            <span style={styles.statValue}>{quiz.topic}</span>
                        </div>
                        <div style={styles.statItem}>
                            <span style={styles.statLabel}>Difficulty:</span>
                            <span style={{...styles.difficultyBadge, ...styles[`difficulty${quiz.difficulty}`]}}>
                                {quiz.difficulty}
                            </span>
                        </div>
                        <div style={styles.statItem}>
                            <span style={styles.statLabel}>Questions:</span>
                            <span style={styles.statValue}>{quiz.questions?.length || 0}</span>
                        </div>
                        <div style={styles.statItem}>
                            <span style={styles.statLabel}>Total Points:</span>
                            <span style={styles.statValue}>
                                {quiz.questions?.reduce((sum, q) => sum + q.points, 0) || 0}
                            </span>
                        </div>
                    </div>

                    <div style={styles.breakdown}>
                        <h3 style={styles.breakdownTitle}>Question Types</h3>
                        <div style={styles.breakdownItem}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v4l3 3"/>
                            </svg>
                            <span style={{flex: 1, color: 'rgba(255,255,255,0.8)'}}>Multiple Choice</span>
                            <span style={styles.count}>
                                {quiz.questions?.filter(q => q.type === 'MULTIPLE_CHOICE').length || 0}
                            </span>
                        </div>
                        <div style={styles.breakdownItem}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            <span style={{flex: 1, color: 'rgba(255,255,255,0.8)'}}>Open Ended</span>
                            <span style={styles.count}>
                                {quiz.questions?.filter(q => q.type === 'OPEN_ENDED').length || 0}
                            </span>
                        </div>
                    </div>

                    <div style={styles.actionBtns}>
                        <button
                            style={styles.btnEdit}
                            onClick={() => navigate(`/edit-quiz/${studyId}/${quiz.id}`)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit Quiz
                        </button>
                        {/* Conditionally render delete button only when there are NO results */}
                        {results.length === 0 && (
                            <button style={styles.btnDelete} onClick={handleDeleteQuiz}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* Participants Card */}
                <div style={styles.glassCard}>
                    <h2 style={styles.participantsHeader}>
                        Participants
                    </h2>

                    {results.length === 0 ? (
                        <div style={styles.noParticipants}>
                            <div style={styles.emptyIcon}>
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/>
                                </svg>
                            </div>
                            <p style={styles.emptyText}>No participants have taken the quiz yet</p>
                        </div>
                    ) : (
                        <>
                            <div style={styles.tableWrapper}>
                                <table style={styles.table}>
                                    <thead>
                                    <tr style={styles.tableHeader}>
                                        <th style={styles.th}>Username</th>
                                        <th style={styles.th}>Name</th>
                                        <th style={styles.th}>Last Name</th>
                                        <th
                                            style={{...styles.th, ...styles.sortableHeader}}
                                            onClick={() => handleSort('points')}
                                        >
                                            Quiz Points <SortIcon column="points" />
                                        </th>
                                        <th
                                            style={{...styles.th, ...styles.sortableHeader}}
                                            onClick={() => handleSort('submittedAt')}
                                        >
                                            Submission Date <SortIcon column="submittedAt" />
                                        </th>
                                        <th style={styles.th}>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {sortedResults.map((result) => (
                                        <tr key={result.id} style={styles.tableRow}>
                                            <td style={styles.td}>{result.participantUsername || 'N/A'}</td>
                                            <td style={styles.td}>{result.participantName?.split(' ')[0] || 'N/A'}</td>
                                            <td style={styles.td}>{result.participantName?.split(' ')[1] || 'N/A'}</td>
                                            <td style={styles.td}>
                                                <span style={styles.pointsBadge}>
                                                    {result.totalPointsEarned}/{result.maxPossiblePoints}
                                                </span>
                                            </td>
                                            <td style={styles.td}>{new Date(result.submittedAt).toLocaleDateString()}</td>
                                            <td style={styles.td}>
                                                {result.status === "ACCEPTED" ? (
                                                    <span style={styles.acceptedBadge}>Accepted ✓</span>
                                                ) : result.status === "REJECTED" ? (
                                                    <span style={styles.rejectedBadge}>Rejected ✕</span>
                                                ) : (
                                                    <div style={styles.actionCell}>
                                                        <button
                                                            style={styles.btnAccept}
                                                            onClick={() => handleAccept(result.id)}
                                                            title="Accept"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            style={styles.btnReject}
                                                            onClick={() => handleReject(result.id)}
                                                            title="Reject"
                                                        >
                                                            ✕
                                                        </button>
                                                        <button
                                                            style={styles.btnView}
                                                            onClick={() => navigate(`/quiz-result/${result.id}`)}
                                                            title="View Details"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                                <circle cx="12" cy="12" r="3"/>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            <div style={styles.tableFooter}>
                                <p style={styles.footerText}>Total participants: {results.length}</p>
                                <div style={styles.bulkActions}>
                                    <button style={styles.btnAcceptAll} onClick={handleAcceptAll}>
                                        Accept All
                                    </button>
                                    <button style={styles.btnRejectAll} onClick={handleRejectAll}>
                                        Reject All
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)',
        padding: '2rem',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    header: {
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    buttonGroup: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
    },
    backBtn: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#fff',
        padding: '0.75rem 1.5rem',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        fontFamily: 'inherit',
    },
    statisticsBtn: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        color: '#fff',
        padding: '0.875rem 1.75rem',
        borderRadius: '14px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 600,
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35), 0 2px 8px rgba(0, 0, 0, 0.1)',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: '0.02em',
    },
    title: {
        color: '#fff',
        fontSize: '2rem',
        margin: 0,
        fontWeight: '700',
        letterSpacing: '-0.02em',
    },
    loadingCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '4rem 2rem',
        textAlign: 'center',
        maxWidth: '400px',
        margin: '0 auto',
    },
    spinner: {
        width: '50px',
        height: '50px',
        border: '4px solid rgba(255, 255, 255, 0.1)',
        borderTopColor: '#4a9eff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto',
    },
    loadingText: {
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: '1rem',
        fontWeight: '500',
    },
    noQuizCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '4rem 2rem',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto',
    },
    noQuizIcon: {
        color: 'rgba(255, 255, 255, 0.3)',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'center',
    },
    noQuizTitle: {
        color: '#fff',
        fontSize: '1.8rem',
        marginBottom: '0.5rem',
        fontWeight: '700',
        letterSpacing: '-0.02em',
    },
    noQuizText: {
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '2rem',
        fontWeight: '400',
    },
    createQuizBtn: {
        background: 'linear-gradient(135deg, #4a9eff, #3a7bd5)',
        color: '#fff',
        border: 'none',
        padding: '1rem 2.5rem',
        fontSize: '1.1rem',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '600',
        fontFamily: 'inherit',
        transition: 'transform 0.2s',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '2rem',
    },
    glassCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    },
    quizTitle: {
        color: '#fff',
        fontSize: '1.8rem',
        margin: '0 0 0.5rem 0',
        fontWeight: '700',
        letterSpacing: '-0.02em',
    },
    quizDesc: {
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 1.6,
        marginBottom: '1.5rem',
        fontWeight: '400',
    },
    stats: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginBottom: '1.5rem',
    },
    statItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.9rem',
        fontWeight: '500',
    },
    statValue: {
        color: '#fff',
        fontWeight: '600',
    },
    difficultyBadge: {
        padding: '0.25rem 0.75rem',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    difficultyeasy: {
        background: 'rgba(76, 175, 80, 0.2)',
        color: '#4caf50',
    },
    difficultymedium: {
        background: 'rgba(255, 152, 0, 0.2)',
        color: '#ff9800',
    },
    difficultyhard: {
        background: 'rgba(244, 67, 54, 0.2)',
        color: '#f44336',
    },
    breakdown: {
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
    },
    breakdownTitle: {
        color: '#fff',
        fontSize: '1.1rem',
        marginBottom: '1rem',
        fontWeight: '600',
    },
    breakdownItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        marginBottom: '0.5rem',
        color: 'rgba(255, 255, 255, 0.8)',
    },
    count: {
        background: 'rgba(74, 158, 255, 0.2)',
        color: '#4a9eff',
        padding: '0.25rem 0.75rem',
        borderRadius: '6px',
        fontWeight: '600',
        fontSize: '0.9rem',
    },
    actionBtns: {
        display: 'flex',
        gap: '1rem',
    },
    btnEdit: {
        flex: 1,
        padding: '0.875rem',
        border: 'none',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #4a9eff, #3a7bd5)',
        color: '#fff',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s',
    },
    btnDelete: {
        flex: 1,
        padding: '0.875rem',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        background: 'rgba(244, 67, 54, 0.1)',
        color: '#f44336',
        border: '1px solid rgba(244, 67, 54, 0.3)',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
    },
    participantsHeader: {
        color: '#fff',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: '700',
        letterSpacing: '-0.02em',
    },
    noParticipants: {
        textAlign: 'center',
        padding: '3rem',
    },
    emptyIcon: {
        color: 'rgba(255, 255, 255, 0.2)',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'center',
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '400',
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    tableHeader: {
        background: 'rgba(255, 255, 255, 0.05)',
    },
    th: {
        padding: '1rem',
        textAlign: 'left',
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
        fontSize: '0.9rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        letterSpacing: '0.02em',
    },
    sortableHeader: {
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'color 0.2s',
    },
    sortIcon: {
        marginLeft: '0.5rem',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '0.8rem',
    },
    sortIconActive: {
        marginLeft: '0.5rem',
        color: '#4a9eff',
        fontSize: '0.8rem',
    },
    tableRow: {
        transition: 'background 0.2s',
    },
    td: {
        padding: '1rem',
        color: '#fff',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        fontWeight: '400',
    },
    pointsBadge: {
        background: 'rgba(74, 158, 255, 0.2)',
        color: '#4a9eff',
        padding: '0.4rem 0.8rem',
        borderRadius: '6px',
        fontWeight: '600',
        display: 'inline-block',
        fontSize: '0.9rem',
    },
    actionCell: {
        display: 'flex',
        gap: '0.5rem',
    },
    btnAccept: {
        padding: '0.5rem',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        minWidth: '35px',
        background: 'rgba(76, 175, 80, 0.2)',
        color: '#4caf50',
        fontWeight: '600',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
    },
    btnReject: {
        padding: '0.5rem',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        minWidth: '35px',
        background: 'rgba(244, 67, 54, 0.2)',
        color: '#f44336',
        fontWeight: '600',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
    },
    btnView: {
        padding: '0.5rem',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        minWidth: '35px',
        background: 'rgba(74, 158, 255, 0.2)',
        color: '#4a9eff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
    },
    tableFooter: {
        marginTop: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '500',
    },
    bulkActions: {
        display: 'flex',
        gap: '0.75rem',
    },
    btnAcceptAll: {
        padding: '0.75rem 1.5rem',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        background: 'rgba(76, 175, 80, 0.2)',
        color: '#4caf50',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
    },
    btnRejectAll: {
        padding: '0.75rem 1.5rem',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        background: 'rgba(244, 67, 54, 0.2)',
        color: '#f44336',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
    },
    acceptedBadge: {
        background: "rgba(76, 175, 80, 0.2)",
        color: "#4caf50",
        padding: "0.5rem 1rem",
        borderRadius: "6px",
        fontWeight: "600",
        display: 'inline-block',
    },
    rejectedBadge: {
        background: "rgba(244, 67, 54, 0.2)",
        color: "#f44336",
        padding: "0.5rem 1rem",
        borderRadius: "6px",
        fontWeight: "600",
        display: 'inline-block',
    }
};

export default QuizManagementPage;
