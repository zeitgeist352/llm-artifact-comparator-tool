// QuizResultPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function QuizResultPage() {
    const { resultId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [manualPoints, setManualPoints] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchResult();
    }, [resultId]);

    const fetchResult = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/quiz-attempt/result/${resultId}`);
            const data = await response.json();
            setResult(data);
            const initialPoints = {};
            Object.values(data.questionResults || {}).forEach(q => {
                if (q.questionType === 'OPEN_ENDED') {
                    initialPoints[q.questionId] = q.pointsEarned ?? 0;
                }
            });
            setManualPoints(initialPoints);

        } catch (error) {
            console.error('Error fetching result:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateGrade = (questionId, value, maxPoints) => {
        // Allow empty string temporarily
        if (value === '' || value === null || value === undefined) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[questionId];
                return newErrors;
            });
            return true;
        }

        const numValue = parseFloat(value);

        if (isNaN(numValue)) {
            setValidationErrors(prev => ({
                ...prev,
                [questionId]: 'Please enter a valid number'
            }));
            return false;
        }

        if (numValue < 0) {
            setValidationErrors(prev => ({
                ...prev,
                [questionId]: 'Grade cannot be negative'
            }));
            return false;
        }

        if (numValue > maxPoints) {
            setValidationErrors(prev => ({
                ...prev,
                [questionId]: `Grade cannot exceed ${maxPoints} points`
            }));
            return false;
        }

        // Clear error if valid
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[questionId];
            return newErrors;
        });
        return true;
    };

    const handleGradeChange = (questionId, value, maxPoints) => {
        // Remove leading zeros but allow single "0"
        let cleanedValue = value;
        if (value.length > 1 && value.startsWith('0') && value[1] !== '.') {
            cleanedValue = value.replace(/^0+/, '');
        }

        // If empty, set to empty string (will be treated as 0 on save)
        if (cleanedValue === '' || cleanedValue === null) {
            setManualPoints(prev => ({
                ...prev,
                [questionId]: ''
            }));
            validateGrade(questionId, '', maxPoints);
            return;
        }

        const numValue = parseFloat(cleanedValue);
        setManualPoints(prev => ({
            ...prev,
            [questionId]: cleanedValue
        }));
        validateGrade(questionId, cleanedValue, maxPoints);
    };

    const hasValidationErrors = () => {
        return Object.keys(validationErrors).length > 0;
    };

    const prepareFinalGrades = () => {
        // Convert empty strings to 0 for submission
        const finalGrades = {};
        Object.keys(manualPoints).forEach(key => {
            const value = manualPoints[key];
            finalGrades[key] = value === '' || value === null || value === undefined ? 0 : parseFloat(value);
        });
        return finalGrades;
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingCard}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Loading results...</p>
                </div>
            </div>
        );
    }

    if (!result) {
        return (
            <div style={styles.container}>
                <div style={styles.errorCard}>
                    <h2 style={styles.errorTitle}>Result Not Found</h2>
                    <button style={styles.backBtn} onClick={() => navigate(-1)}>
                        ← Go Back
                    </button>
                </div>
            </div>
        );
    }

    const questionResults = Object.values(result.questionResults || {});
    const percentage = Math.round(result.percentageScore || 0);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button
                    style={styles.backBtn}
                    onClick={() => {
                        const studyId = result?.studyId;
                        navigate('/quiz-management/' + studyId);
                    }}
                >
                    ← Back to Quiz Management
                </button>
                <h1 style={styles.title}>Quiz Result Details</h1>
            </div>

            {/* Score Summary Card */}
            <div style={styles.summaryCard}>
                <div style={styles.scoreCircle}>
                    <div style={styles.scoreRing}>
                        <svg style={styles.progressCircle} viewBox="0 0 120 120">
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="8"
                            />
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="8"
                                strokeDasharray={`${(percentage / 100) * 339.29} 339.29`}
                                strokeLinecap="round"
                                transform="rotate(-90 60 60)"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#4a9eff" />
                                    <stop offset="100%" stopColor="#3a7bd5" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div style={styles.scoreContent}>
                            <div style={styles.scoreNumber}>{percentage}%</div>
                            <div style={styles.scoreLabel}>Score</div>
                        </div>
                    </div>
                </div>

                <div style={styles.summaryGrid}>
                    <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>Participant</span>
                        <span style={styles.summaryValue}>{result.participantName}</span>
                    </div>
                    <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>Quiz</span>
                        <span style={styles.summaryValue}>{result.quizTitle}</span>
                    </div>
                    <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>Points Earned</span>
                        <span style={styles.summaryValue}>
                            <span style={styles.pointsHighlight}>{result.totalPointsEarned}</span>
                            <span style={styles.pointsSeparator}>/</span>
                            {result.maxPossiblePoints}
                        </span>
                    </div>
                    <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>Submitted</span>
                        <span style={styles.summaryValue}>
                            {new Date(result.submittedAt).toLocaleString()}
                        </span>
                    </div>
                    <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>Graded</span>
                        <span style={styles.summaryValue}>
                            {new Date(result.gradedAt).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Question Results */}
            <div style={styles.questionsSection}>
                <h2 style={styles.sectionTitle}>Detailed Answers</h2>

                {questionResults.map((qResult, index) => (
                    <div key={qResult.questionId} style={styles.questionCard}>
                        <div style={styles.questionHeader}>
                            <div style={styles.questionNumber}>Q{index + 1}</div>
                            <div style={styles.questionTypeBadge}>
                                {qResult.questionType === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Open-Ended'}
                            </div>

                            {/* Points Badge - Reorganized for Open-Ended */}
                            {qResult.questionType === 'OPEN_ENDED' ? (
                                <div style={styles.manualGradingContainer}>

                                    <div style={styles.gradingInputWrapper}>
                                        <input
                                            type="number"
                                            min="0"
                                            max={qResult.maxPoints}
                                            step="0.5"
                                            value={manualPoints[qResult.questionId] ?? ''}
                                            onChange={(e) => handleGradeChange(
                                                qResult.questionId,
                                                e.target.value,
                                                qResult.maxPoints
                                            )}
                                            className="no-spinner"
                                            placeholder="0"
                                            style={{
                                                ...styles.scoreInput,
                                                ...(validationErrors[qResult.questionId] ? styles.scoreInputError : {})
                                            }}
                                        />
                                        <span style={styles.maxPointsLabel}>/ {qResult.maxPoints} pts</span>
                                    </div>
                                    {validationErrors[qResult.questionId] && (
                                        <div style={styles.validationError}>
                                            <span style={styles.errorIcon}>⚠</span>
                                            {validationErrors[qResult.questionId]}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={styles.pointsBadge}>
                                    <span style={styles.earnedPoints}>{qResult.pointsEarned}</span>
                                    <span style={styles.maxPoints}>/{qResult.maxPoints}</span>
                                </div>
                            )}
                        </div>

                        <p style={styles.questionText}>{qResult.questionText}</p>

                        <div style={styles.answerSection}>
                            <div style={styles.answerLabel}>Participant's Answer</div>
                            <div style={
                                qResult.questionType === 'MULTIPLE_CHOICE' && qResult.pointsEarned === qResult.maxPoints
                                    ? styles.correctAnswer
                                    : qResult.questionType === 'MULTIPLE_CHOICE' && qResult.pointsEarned === 0
                                        ? styles.incorrectAnswer
                                        : styles.openAnswer
                            }>
                                {qResult.participantAnswer || 'No answer provided'}
                                {qResult.questionType === 'MULTIPLE_CHOICE' && (
                                    <span style={styles.answerIcon}>
                                        {qResult.pointsEarned === qResult.maxPoints ? '✓' : '✕'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {qResult.aiFeedback && (
                            <div style={styles.feedbackSection}>
                                <div style={styles.feedbackLabel}>
                                    <span style={styles.aiIcon}>🤖</span>
                                    AI Feedback
                                </div>
                                <div style={styles.feedbackText}>{qResult.aiFeedback}</div>
                            </div>
                        )}

                        <div style={styles.scoreBar}>
                            <div
                                style={{
                                    ...styles.scoreBarFill,
                                    width: `${(qResult.pointsEarned / qResult.maxPoints) * 100}%`,
                                    background: qResult.pointsEarned === qResult.maxPoints
                                        ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                                        : qResult.pointsEarned === 0
                                            ? 'linear-gradient(90deg, #ef4444, #f87171)'
                                            : 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div style={styles.actionsRow}>
                {hasValidationErrors() && (
                    <div style={styles.globalError}>
                        <span style={styles.errorIcon}>⚠</span>
                        Please fix all validation errors before saving
                    </div>
                )}
                <button
                    style={{
                        ...styles.saveBtn,
                        ...(hasValidationErrors() || saving ? styles.saveBtnDisabled : {})
                    }}
                    disabled={saving || hasValidationErrors()}
                    onClick={async () => {
                        if (hasValidationErrors()) return;

                        setSaving(true);
                        try {
                            const finalGrades = prepareFinalGrades();
                            await fetch(
                                `http://localhost:8080/api/quiz-attempt/${resultId}/manual-grade`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        points: finalGrades
                                    })
                                }
                            );

                            const studyId = result.studyId;
                            navigate('/quiz-management/' + studyId);
                        } catch (err) {
                            console.error("Manual grading failed", err);
                            alert("Failed to save grades");
                        } finally {
                            setSaving(false);
                        }
                    }}
                >
                    {saving ? "Saving..." : "Save & Exit"}
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    },
    header: {
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    backBtn: {
        background: 'rgba(74, 158, 255, 0.1)',
        border: '1px solid rgba(74, 158, 255, 0.2)',
        color: '#4a9eff',
        padding: '0.75rem 1.5rem',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: 500,
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 12px rgba(74, 158, 255, 0.15)',
    },
    title: {
        color: '#fff',
        fontSize: '2rem',
        margin: 0,
        fontWeight: 600,
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
    },
    errorCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '4rem 2rem',
        textAlign: 'center',
        maxWidth: '400px',
        margin: '0 auto',
    },
    errorTitle: {
        color: '#fff',
        marginBottom: '1.5rem',
        fontWeight: 600,
    },
    summaryCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(74, 158, 255, 0.15)',
        padding: '2.5rem',
        marginBottom: '2rem',
        display: 'flex',
        gap: '3rem',
        alignItems: 'center',
        boxShadow: '0 8px 32px rgba(74, 158, 255, 0.1)',
    },
    scoreCircle: {
        flexShrink: 0,
    },
    scoreRing: {
        position: 'relative',
        width: '200px',
        height: '200px',
    },
    progressCircle: {
        width: '100%',
        height: '100%',
        transform: 'rotate(0deg)',
    },
    scoreContent: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
    },
    scoreNumber: {
        fontSize: '3.5rem',
        fontWeight: 700,
        color: '#fff',
        lineHeight: 1,
        textShadow: '0 2px 20px rgba(74, 158, 255, 0.5)',
    },
    scoreLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '1rem',
        marginTop: '0.5rem',
        fontWeight: 500,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
    },
    summaryGrid: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1.5rem',
    },
    summaryItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    summaryLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '0.85rem',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    summaryValue: {
        color: '#fff',
        fontSize: '1.15rem',
        fontWeight: 600,
    },
    pointsHighlight: {
        color: '#4a9eff',
        fontSize: '1.3rem',
        fontWeight: 700,
    },
    pointsSeparator: {
        color: 'rgba(255, 255, 255, 0.3)',
        margin: '0 0.3rem',
    },
    questionsSection: {
        maxWidth: '1000px',
        margin: '0 auto',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: '1.8rem',
        marginBottom: '1.5rem',
        fontWeight: 600,
        letterSpacing: '-0.02em',
    },
    questionCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        marginBottom: '1.5rem',
        transition: 'all 0.3s ease',
    },
    questionHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
    },
    questionNumber: {
        background: 'rgba(74, 158, 255, 0.15)',
        color: '#4a9eff',
        padding: '0.5rem 1rem',
        borderRadius: '10px',
        fontWeight: 700,
        fontSize: '0.95rem',
        boxShadow: '0 2px 12px rgba(74, 158, 255, 0.2)',
    },
    questionTypeBadge: {
        background: 'rgba(255, 255, 255, 0.08)',
        color: 'rgba(255, 255, 255, 0.9)',
        padding: '0.5rem 1rem',
        borderRadius: '10px',
        fontSize: '0.9rem',
        fontWeight: 500,
    },

    // Reorganized Manual Grading Styles
    manualGradingContainer: {
        marginLeft: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.5rem',
        background: 'rgba(139, 92, 246, 0.1)',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        border: '1.5px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.15)',
    },
    gradingLabel: {
        color: '#a78bfa',
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    gradingInputWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
    },
    scoreInput: {
        width: '55px',
        padding: '0.4rem 0.5rem',
        borderRadius: '8px',
        border: '2px solid rgba(139, 92, 246, 0.4)',
        background: 'rgba(0, 0, 0, 0.4)',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: 700,
        textAlign: 'center',
        transition: 'all 0.3s ease',
        outline: 'none',
    },
    scoreInputError: {
        border: '2px solid #ef4444',
        background: 'rgba(239, 68, 68, 0.15)',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.2)',
        animation: 'shake 0.4s ease',
    },
    maxPointsLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem',
        fontWeight: 600,
    },
    validationError: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        color: '#fca5a5',
        padding: '0.4rem 0.6rem',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 500,
        maxWidth: '280px',
        textAlign: 'left',
    },
    errorIcon: {
        fontSize: '0.9rem',
    },

    pointsBadge: {
        background: 'rgba(76, 175, 80, 0.15)',
        padding: '0.5rem 1rem',
        borderRadius: '10px',
        fontWeight: 600,
        marginLeft: 'auto',
        boxShadow: '0 2px 12px rgba(76, 175, 80, 0.2)',
    },
    earnedPoints: {
        color: '#4ade80',
        fontSize: '1.1rem',
        fontWeight: 700,
    },
    maxPoints: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '0.95rem',
        fontWeight: 500,
    },
    questionText: {
        color: '#fff',
        fontSize: '1.2rem',
        marginBottom: '1.5rem',
        lineHeight: 1.6,
        fontWeight: 500,
    },
    answerSection: {
        marginBottom: '1.5rem',
    },
    answerLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.85rem',
        marginBottom: '0.75rem',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    correctAnswer: {
        padding: '1.25rem',
        background: 'rgba(76, 175, 80, 0.1)',
        border: '1.5px solid rgba(76, 175, 80, 0.3)',
        borderRadius: '12px',
        color: '#4ade80',
        fontSize: '1.05rem',
        fontWeight: 500,
        boxShadow: '0 4px 16px rgba(76, 175, 80, 0.15)',
    },
    incorrectAnswer: {
        padding: '1.25rem',
        background: 'rgba(244, 67, 54, 0.1)',
        border: '1.5px solid rgba(244, 67, 54, 0.3)',
        borderRadius: '12px',
        color: '#f87171',
        fontSize: '1.05rem',
        fontWeight: 500,
        boxShadow: '0 4px 16px rgba(244, 67, 54, 0.15)',
    },
    openAnswer: {
        padding: '1.25rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1.5px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '1.05rem',
        lineHeight: 1.6,
        fontWeight: 500,
    },
    answerIcon: {
        fontWeight: 700,
        fontSize: '1.3rem',
        marginLeft: '0.75rem',
    },
    feedbackSection: {
        background: 'rgba(74, 158, 255, 0.08)',
        border: '1px solid rgba(74, 158, 255, 0.2)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1rem',
    },
    feedbackLabel: {
        color: '#4a9eff',
        fontSize: '0.85rem',
        fontWeight: 600,
        marginBottom: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    aiIcon: {
        fontSize: '1rem',
    },
    feedbackText: {
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 1.7,
        fontSize: '1rem',
    },
    scoreBar: {
        height: '10px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
    },
    scoreBarFill: {
        height: '100%',
        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    },
    actionsRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '1rem',
        maxWidth: '1000px',
        margin: '2rem auto',
    },
    globalError: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        color: '#fca5a5',
        padding: '0.75rem 1.25rem',
        borderRadius: '12px',
        fontSize: '0.9rem',
        fontWeight: 500,
    },
    saveBtn: {
        background: 'linear-gradient(135deg, #4a9eff, #3a7bd5)',
        color: '#fff',
        border: 'none',
        borderRadius: '14px',
        padding: '0.9rem 2.4rem',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 6px 24px rgba(74,158,255,0.35)',
        transition: 'all 0.3s ease',
    },
    saveBtnDisabled: {
        background: 'rgba(100, 100, 100, 0.3)',
        cursor: 'not-allowed',
        opacity: 0.5,
        boxShadow: 'none',
    },
};

// Add animation keyframes and remove spinner arrows
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        /* Remove spinner arrows from number inputs */
        input.no-spinner::-webkit-outer-spin-button,
        input.no-spinner::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        
        input.no-spinner[type="number"] {
            -moz-appearance: textfield;
        }
    `;
    if (!document.querySelector('style[data-quiz-result]')) {
        styleSheet.setAttribute('data-quiz-result', 'true');
        document.head.appendChild(styleSheet);
    }
}

export default QuizResultPage;
