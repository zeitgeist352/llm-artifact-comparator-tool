import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditQuizPage() {
    const { studyId, quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [showAddQuestion, setShowAddQuestion] = useState(false);
    const [questionType, setQuestionType] = useState('MULTIPLE_CHOICE');

    const [newQuestion, setNewQuestion] = useState({
        questionText: '',
        points: 1,
        options: ['', '', '', ''],
        correctAnswer: ''
    });

    const fetchQuiz = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/quiz/${quizId}`);
            const data = await response.json();
            setQuiz(data);
        } catch (error) {
            console.error('Error fetching quiz:', error);
        } finally {
            setLoading(false);
        }
    }, [quizId]);

    useEffect(() => {
        fetchQuiz();
    }, [fetchQuiz]);

    const handleAddQuestion = async () => {
        try {
            const endpoint = questionType === 'MULTIPLE_CHOICE'
                ? `http://localhost:8080/api/quiz/${quizId}/question/multiple-choice`
                : `http://localhost:8080/api/quiz/${quizId}/question/open-ended`;

            const body = questionType === 'MULTIPLE_CHOICE'
                ? newQuestion
                : { questionText: newQuestion.questionText, points: newQuestion.points };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const updatedQuiz = await response.json();
            setQuiz(updatedQuiz);
            setShowAddQuestion(false);
            setNewQuestion({ questionText: '', points: 1, options: ['', '', '', ''], correctAnswer: '' });
        } catch (error) {
            console.error('Error adding question:', error);
            alert('Failed to add question');
        }
    };

    const handleUpdateQuestion = async (questionId) => {
        try {
            const question = quiz.questions.find(q => q.id === questionId);
            const endpoint = question.type === 'MULTIPLE_CHOICE'
                ? `http://localhost:8080/api/quiz/${quizId}/question/multiple-choice/${questionId}`
                : `http://localhost:8080/api/quiz/${quizId}/question/open-ended/${questionId}`;

            await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingQuestion)
            });

            await fetchQuiz();
            setEditingQuestion(null);
        } catch (error) {
            console.error('Error updating question:', error);
            alert('Failed to update question');
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;

        try {
            await fetch(`http://localhost:8080/api/quiz/${quizId}/question/${questionId}`, {
                method: 'DELETE'
            });
            await fetchQuiz();
        } catch (error) {
            console.error('Error deleting question:', error);
            alert('Failed to delete question');
        }
    };

    const adjustPoints = (currentPoints, delta, setter) => {
        const newPoints = Math.max(1, currentPoints + delta);
        setter(newPoints);
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

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate(`/quiz-management/${studyId}`)}>
                    ← Back to Quiz
                </button>
                <h1 style={styles.title}>Edit Quiz: {quiz?.title}</h1>
            </div>

            <div style={styles.mainContent}>
                {/* Quiz Info */}
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Quiz Information</h2>
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Topic:</span>
                            <span style={styles.infoValue}>{quiz?.topic}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Difficulty:</span>
                            <span style={styles.infoValue}>{quiz?.difficulty}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Total Questions:</span>
                            <span style={styles.infoValue}>{quiz?.questions?.length || 0}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Total Points:</span>
                            <span style={styles.infoValue}>
                                {quiz?.questions?.reduce((sum, q) => sum + q.points, 0) || 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Questions Section */}
                <div style={styles.card}>
                    <div style={styles.questionHeader}>
                        <h2 style={styles.cardTitle}>Questions</h2>
                        <button style={styles.addBtn} onClick={() => setShowAddQuestion(!showAddQuestion)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add Question
                        </button>
                    </div>

                    {/* Add Question Form */}
                    {showAddQuestion && (
                        <div style={styles.formCard}>
                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Question Type</label>
                                    <select
                                        style={styles.select}
                                        value={questionType}
                                        onChange={(e) => setQuestionType(e.target.value)}
                                    >
                                        <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                        <option value="OPEN_ENDED">Open-Ended</option>
                                    </select>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Points</label>
                                    <div style={styles.pointsStepper}>
                                        <button
                                            style={styles.stepperBtn}
                                            onClick={() => adjustPoints(newQuestion.points, -1, (val) => setNewQuestion({...newQuestion, points: val}))}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <line x1="5" y1="12" x2="19" y2="12"/>
                                            </svg>
                                        </button>
                                        <span style={styles.pointsDisplay}>{newQuestion.points}</span>
                                        <button
                                            style={styles.stepperBtn}
                                            onClick={() => adjustPoints(newQuestion.points, 1, (val) => setNewQuestion({...newQuestion, points: val}))}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <line x1="12" y1="5" x2="12" y2="19"/>
                                                <line x1="5" y1="12" x2="19" y2="12"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Question Text</label>
                                <textarea
                                    placeholder="Enter your question here..."
                                    value={newQuestion.questionText}
                                    onChange={(e) => setNewQuestion({...newQuestion, questionText: e.target.value})}
                                    style={styles.textarea}
                                    rows="3"
                                />
                            </div>

                            {questionType === 'MULTIPLE_CHOICE' && (
                                <>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Answer Options (click to select correct answer)</label>
                                        <div style={styles.optionsGrid}>
                                            {newQuestion.options.map((opt, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        ...styles.optionInputCard,
                                                        ...(opt && opt === newQuestion.correctAnswer ? styles.selectedOptionCard : {})
                                                    }}
                                                    onClick={() => opt && setNewQuestion({...newQuestion, correctAnswer: opt})}
                                                >
                                                    <div style={styles.optionHeader}>
                                                        <span style={styles.optionNumber}>{String.fromCharCode(65 + idx)}</span>
                                                        {opt && opt === newQuestion.correctAnswer && (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="3">
                                                                <polyline points="20 6 9 17 4 12"/>
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder={`Option ${idx + 1}`}
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOpts = [...newQuestion.options];
                                                            newOpts[idx] = e.target.value;
                                                            setNewQuestion({...newQuestion, options: newOpts});
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={styles.optionInput}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div style={styles.formActions}>
                                <button style={styles.btnCancel} onClick={() => {
                                    setShowAddQuestion(false);
                                    setNewQuestion({ questionText: '', points: 1, options: ['', '', '', ''], correctAnswer: '' });
                                }}>
                                    Cancel
                                </button>
                                <button style={styles.btnSave} onClick={handleAddQuestion}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                    Add Question
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Questions List */}
                    {quiz?.questions?.map((question, index) => (
                        <div key={question.id} style={styles.questionCard}>
                            <div style={styles.questionMeta}>
                                <div style={styles.questionNumber}>Q{index + 1}</div>
                                <div style={styles.pointsBadge}>{question.points} pts</div>
                            </div>

                            {editingQuestion?.id === question.id ? (
                                <div style={styles.editSection}>
                                    <div style={styles.formRow}>
                                        <div style={{...styles.formGroup, flex: 1}}>
                                            <label style={styles.label}>Question Text</label>
                                            <textarea
                                                value={editingQuestion.questionText}
                                                onChange={(e) => setEditingQuestion({
                                                    ...editingQuestion,
                                                    questionText: e.target.value
                                                })}
                                                style={styles.textarea}
                                                rows="3"
                                            />
                                        </div>
                                    </div>

                                    {question.type === 'MULTIPLE_CHOICE' && (
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Answer Options (click to select correct answer)</label>
                                            <div style={styles.optionsGrid}>
                                                {editingQuestion.options?.map((opt, idx) => (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            ...styles.optionInputCard,
                                                            ...(opt && opt === editingQuestion.correctAnswer ? styles.selectedOptionCard : {})
                                                        }}
                                                        onClick={() => opt && setEditingQuestion({...editingQuestion, correctAnswer: opt})}
                                                    >
                                                        <div style={styles.optionHeader}>
                                                            <span style={styles.optionNumber}>{String.fromCharCode(65 + idx)}</span>
                                                            {opt && opt === editingQuestion.correctAnswer && (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="3">
                                                                    <polyline points="20 6 9 17 4 12"/>
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newOpts = [...editingQuestion.options];
                                                                newOpts[idx] = e.target.value;
                                                                setEditingQuestion({...editingQuestion, options: newOpts});
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={styles.optionInput}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div style={styles.formActions}>
                                        <button style={styles.btnCancel} onClick={() => setEditingQuestion(null)}>
                                            Cancel
                                        </button>
                                        <button style={styles.btnSave} onClick={() => handleUpdateQuestion(question.id)}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p style={styles.questionText}>{question.questionText}</p>

                                    {question.type === 'MULTIPLE_CHOICE' && (
                                        <div style={styles.optionsList}>
                                            {question.options?.map((opt, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        ...styles.optionItem,
                                                        ...(opt === question.correctAnswer ? styles.correctOption : {})
                                                    }}
                                                >
                                                    <span style={styles.optionNumber}>{String.fromCharCode(65 + idx)}</span>
                                                    <span style={styles.optionText}>{opt}</span>
                                                    {opt === question.correctAnswer && (
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={styles.checkIcon}>
                                                            <polyline points="20 6 9 17 4 12"/>
                                                        </svg>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div style={styles.questionActions}>
                                        <button
                                            style={styles.btnEditSmall}
                                            onClick={() => setEditingQuestion(question)}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                            Edit
                                        </button>
                                        <button
                                            style={styles.btnDeleteSmall}
                                            onClick={() => handleDeleteQuestion(question.id)}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6"/>
                                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
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
        gap: '1rem',
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
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
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
    mainContent: {
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    card: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    },
    cardTitle: {
        color: '#fff',
        fontSize: '1.5rem',
        marginBottom: '1.5rem',
        fontWeight: '700',
        letterSpacing: '-0.02em',
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
    },
    infoItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
    },
    infoLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '500',
    },
    infoValue: {
        color: '#fff',
        fontWeight: '600',
    },
    questionHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
    },
    addBtn: {
        background: 'linear-gradient(135deg, #4a9eff, #3a7bd5)',
        color: '#fff',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        transition: 'transform 0.2s',
    },
    formCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '1.5rem',
        borderRadius: '16px',
        marginBottom: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    formRow: {
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },
    label: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '0.9rem',
        fontWeight: '600',
        letterSpacing: '0.02em',
    },
    pointsStepper: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '0.5rem',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: 'fit-content',
    },
    stepperBtn: {
        background: 'rgba(74, 158, 255, 0.2)',
        border: 'none',
        color: '#4a9eff',
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
    },
    pointsDisplay: {
        color: '#fff',
        fontSize: '1.1rem',
        fontWeight: '700',
        minWidth: '32px',
        textAlign: 'center',
    },
    questionCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '1.5rem',
        borderRadius: '16px',
        marginBottom: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        transition: 'all 0.3s ease',
    },
    questionMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem',
    },
    questionNumber: {
        background: 'rgba(74, 158, 255, 0.2)',
        color: '#4a9eff',
        padding: '0.4rem 0.9rem',
        borderRadius: '8px',
        fontWeight: '700',
        fontSize: '0.9rem',
        letterSpacing: '0.02em',
    },
    pointsBadge: {
        background: 'rgba(76, 175, 80, 0.2)',
        color: '#4caf50',
        padding: '0.4rem 0.9rem',
        borderRadius: '8px',
        fontWeight: '700',
        fontSize: '0.85rem',
    },
    questionText: {
        color: '#fff',
        fontSize: '1.1rem',
        marginBottom: '1.25rem',
        lineHeight: 1.6,
        fontWeight: '400',
    },
    optionsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginBottom: '1.25rem',
    },
    optionItem: {
        padding: '0.875rem 1rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '10px',
        color: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        transition: 'all 0.2s',
    },
    optionNumber: {
        background: 'rgba(255, 255, 255, 0.1)',
        color: 'rgba(255, 255, 255, 0.9)',
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '0.85rem',
        flexShrink: 0,
    },
    optionText: {
        flex: 1,
        fontWeight: '400',
    },
    correctOption: {
        background: 'rgba(76, 175, 80, 0.15)',
        border: '1px solid rgba(76, 175, 80, 0.4)',
        color: '#4caf50',
    },
    checkIcon: {
        color: '#4caf50',
        flexShrink: 0,
    },
    questionActions: {
        display: 'flex',
        gap: '0.75rem',
    },
    btnEditSmall: {
        padding: '0.625rem 1.25rem',
        background: 'rgba(74, 158, 255, 0.2)',
        color: '#4a9eff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '600',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s',
    },
    btnDeleteSmall: {
        padding: '0.625rem 1.25rem',
        background: 'rgba(244, 67, 54, 0.2)',
        color: '#f44336',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '600',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s',
    },
    editSection: {
        display: 'flex',
        flexDirection: 'column',
    },
    textarea: {
        width: '100%',
        padding: '0.875rem 1rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '0.95rem',
        outline: 'none',
        fontFamily: 'inherit',
        fontWeight: '400',
        resize: 'vertical',
        minHeight: '80px',
        lineHeight: '1.6',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
    },
    select: {
        width: '100%',
        padding: '0.875rem 1rem',
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '0.95rem',
        outline: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: '500',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 1rem center',
        paddingRight: '3rem',
        boxSizing: 'border-box',
    },
    optionsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
    },
    optionInputCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    selectedOptionCard: {
        background: 'rgba(76, 175, 80, 0.15)',
        border: '2px solid rgba(76, 175, 80, 0.6)',
    },
    optionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
    },
    optionInput: {
        width: '100%',
        padding: '0.5rem',
        background: 'rgba(255, 255, 255, 0.03)',
        border: 'none',
        borderRadius: '6px',
        color: '#fff',
        fontSize: '0.9rem',
        outline: 'none',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
    },
    formActions: {
        display: 'flex',
        gap: '1rem',
        marginTop: '1.5rem',
    },
    btnCancel: {
        flex: 1,
        padding: '0.875rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
    },
    btnSave: {
        flex: 1,
        padding: '0.875rem',
        background: 'linear-gradient(135deg, #4a9eff, #3a7bd5)',
        border: 'none',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
    },
};

export default EditQuizPage;
