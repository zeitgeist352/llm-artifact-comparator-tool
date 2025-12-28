// TakeQuizPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function TakeQuizPage() {
    const { studyId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [quiz, setQuiz] = useState(null);
    const [quizResultId, setQuizResultId] = useState(null);
    const [answers, setAnswers] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const user = JSON.parse(localStorage.getItem('user'));
    const participantId = user?.id;

    const fetchQuizAndStart = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');

            console.log('🎯 Starting quiz for study:', studyId, 'participant:', participantId);

            // Start quiz - backend will check if already submitted
            const response = await fetch(
                `http://localhost:8080/api/quiz-attempt/start/${studyId}?participantId=${participantId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                // Get error message (could be JSON or text)
                let errorText;
                const contentType = response.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) {
                    const errorJson = await response.json();
                    errorText = errorJson.error || errorJson.message || 'Unknown error';
                } else {
                    errorText = await response.text();
                }

                console.error('❌ Error response:', errorText);

                // Handle "already submitted" error
                if (errorText.includes('already submitted')) {
                    console.log('⚠️ Already submitted, fetching existing result...');

                    try {
                        const resultResponse = await fetch(
                            `http://localhost:8080/api/quiz-attempt/study/${studyId}/participant/${participantId}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );

                        if (resultResponse.ok) {
                            const result = await resultResponse.json();
                            console.log('✅ Found existing result, redirecting to:', result.id);
                            navigate(`/quiz-result/${result.id}`);
                            return;
                        }
                    } catch (err) {
                        console.error('Failed to fetch existing result:', err);
                    }
                }

                throw new Error(errorText || `Failed to start quiz (Status: ${response.status})`);
            }

            const data = await response.json();
            console.log('✅ Quiz started successfully:', data);

            setQuiz(data);
            setQuizResultId(data.quizResultId);

            // Initialize answers
            const initialAnswers = {};
            Object.keys(data.questions).forEach(qId => {
                initialAnswers[qId] = '';
            });
            setAnswers(initialAnswers);

        } catch (err) {
            console.error('❌ Error starting quiz:', err);
            setError(err.message || 'Failed to load quiz');
        } finally {
            setLoading(false);
        }
    }, [studyId, participantId, navigate]);

    useEffect(() => {
        fetchQuizAndStart();
    }, [fetchQuizAndStart]);

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = async () => {
        // Validate all questions answered
        const unanswered = Object.entries(answers).filter(([_, answer]) => !answer || answer.trim() === '');

        if (unanswered.length > 0) {
            if (!window.confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) {
                return;
            }
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            console.log('📤 Submitting quiz with answers:', answers);

            const response = await fetch(
                `http://localhost:8080/api/quiz-attempt/${quizResultId}/submit`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ answers })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to submit quiz');
            }

            const result = await response.json();
            console.log('✅ Quiz submitted successfully, result ID:', result.id);

            setSubmitted(true);

            // Navigate to results after 2 seconds
            setTimeout(() => {
                navigate(`/quiz-result/${result.id}`);
            }, 2000);

        } catch (err) {
            console.error('❌ Error submitting quiz:', err);
            alert('Failed to submit quiz: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingCard}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Loading quiz...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.errorCard}>
                    <div style={styles.errorIcon}>⚠️</div>
                    <h2 style={styles.errorTitle}>Error</h2>
                    <p style={styles.errorMessage}>{error}</p>
                    <div style={styles.errorActions}>
                        <button style={styles.backBtn} onClick={() => navigate(-1)}>
                            ← Go Back
                        </button>
                        <button
                            style={styles.retryBtn}
                            onClick={() => window.location.reload()}
                        >
                            🔄 Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div style={styles.container}>
                <div style={styles.successCard}>
                    <div style={styles.successIcon}>✅</div>
                    <h2 style={styles.successTitle}>Quiz Submitted Successfully!</h2>
                    <p style={styles.successText}>Your answers are being graded...</p>
                    <div style={styles.spinner}></div>
                    <p style={styles.redirectText}>Redirecting to results...</p>
                </div>
            </div>
        );
    }

    const questions = Object.values(quiz?.questions || {});
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>{quiz?.quizTitle}</h1>
                    <p style={styles.subtitle}>{quiz?.studyTitle}</p>
                </div>
                <div style={styles.headerRight}>
                    <div style={styles.totalPoints}>
                        Total Points: {quiz?.maxPossiblePoints}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                    <div style={{...styles.progressFill, width: `${progress}%`}} />
                </div>
                <div style={styles.progressText}>
                    Question {currentQuestionIndex + 1} of {questions.length}
                </div>
            </div>

            {/* Question Card */}
            <div style={styles.questionCard}>
                <div style={styles.questionHeader}>
                    <div style={styles.questionNumber}>Question {currentQuestionIndex + 1}</div>
                    <div style={styles.pointsBadge}>{currentQuestion?.points} pts</div>
                </div>

                <h2 style={styles.questionText}>{currentQuestion?.questionText}</h2>

                {/* Answer Input */}
                {currentQuestion?.type === 'MULTIPLE_CHOICE' ? (
                    <div style={styles.optionsContainer}>
                        {currentQuestion?.options?.map((option, idx) => (
                            <div
                                key={idx}
                                style={{
                                    ...styles.optionCard,
                                    ...(answers[currentQuestion.id] === option ? styles.optionSelected : {})
                                }}
                                onClick={() => handleAnswerChange(currentQuestion.id, option)}
                            >
                                <div style={styles.optionRadio}>
                                    {answers[currentQuestion.id] === option && (
                                        <div style={styles.optionRadioChecked} />
                                    )}
                                </div>
                                <span style={styles.optionText}>{option}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <textarea
                        style={styles.textarea}
                        placeholder="Type your answer here..."
                        value={answers[currentQuestion?.id] || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        rows={8}
                    />
                )}

                {/* Navigation Buttons */}
                <div style={styles.navigationButtons}>
                    <button
                        style={{
                            ...styles.prevBtn,
                            opacity: currentQuestionIndex === 0 ? 0.5 : 1,
                            cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                    >
                        ← Previous
                    </button>

                    {currentQuestionIndex < questions.length - 1 ? (
                        <button
                            style={styles.nextBtn}
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            style={{
                                ...styles.submitBtn,
                                opacity: submitting ? 0.7 : 1
                            }}
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <div style={styles.spinnerSmall}></div>
                                    Submitting...
                                </>
                            ) : (
                                '✓ Submit Quiz'
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Question Navigator */}
            <div style={styles.questionNavigator}>
                <h3 style={styles.navigatorTitle}>Questions</h3>
                <div style={styles.questionDots}>
                    {questions.map((q, idx) => (
                        <div
                            key={idx}
                            style={{
                                ...styles.questionDot,
                                ...(idx === currentQuestionIndex ? styles.questionDotActive : {}),
                                ...(answers[q.id] && answers[q.id].trim() !== '' ? styles.questionDotAnswered : {})
                            }}
                            onClick={() => setCurrentQuestionIndex(idx)}
                            title={`Question ${idx + 1}${answers[q.id] ? ' (Answered)' : ''}`}
                        >
                            {idx + 1}
                        </div>
                    ))}
                </div>
                <div style={styles.legend}>
                    <div style={styles.legendItem}>
                        <div style={{...styles.legendDot, ...styles.questionDotAnswered}}></div>
                        <span>Answered</span>
                    </div>
                    <div style={styles.legendItem}>
                        <div style={styles.legendDot}></div>
                        <span>Unanswered</span>
                    </div>
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
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        padding: '1.5rem',
        borderRadius: '15px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    title: {
        color: '#fff',
        fontSize: '2rem',
        margin: '0 0 0.5rem 0',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '1rem',
        margin: 0,
    },
    headerRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    totalPoints: {
        background: 'rgba(74, 158, 255, 0.2)',
        color: '#4a9eff',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        fontWeight: '600',
    },
    progressContainer: {
        marginBottom: '2rem',
    },
    progressBar: {
        width: '100%',
        height: '8px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '0.5rem',
    },
    progressFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #4a9eff, #60a5fa)',
        borderRadius: '10px',
        transition: 'width 0.3s ease',
    },
    progressText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem',
        textAlign: 'center',
    },
    questionCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        marginBottom: '2rem',
    },
    questionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem',
    },
    questionNumber: {
        background: 'rgba(74, 158, 255, 0.2)',
        color: '#4a9eff',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        fontWeight: '600',
    },
    questionType: {
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#fff',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        fontSize: '0.9rem',
    },
    pointsBadge: {
        background: 'rgba(76, 175, 80, 0.2)',
        color: '#4caf50',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        fontWeight: '600',
        marginLeft: 'auto',
    },
    questionText: {
        color: '#fff',
        fontSize: '1.3rem',
        lineHeight: 1.6,
        marginBottom: '2rem',
    },
    optionsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '2rem',
    },
    optionCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem 1.5rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    optionSelected: {
        background: 'rgba(74, 158, 255, 0.15)',
        border: '2px solid rgba(74, 158, 255, 0.5)',
    },
    optionRadio: {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    optionRadioChecked: {
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        background: '#4a9eff',
    },
    optionText: {
        color: '#fff',
        fontSize: '1.1rem',
    },
    textarea: {
        width: '100%',
        minHeight: '200px',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '1rem',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        resize: 'vertical',
        outline: 'none',
        marginBottom: '2rem',
    },
    navigationButtons: {
        display: 'flex',
        gap: '1rem',
    },
    prevBtn: {
        flex: 1,
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    nextBtn: {
        flex: 1,
        padding: '1rem',
        background: 'linear-gradient(135deg, #4a9eff, #60a5fa)',
        border: 'none',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
    },
    submitBtn: {
        flex: 1,
        padding: '1rem',
        background: 'linear-gradient(135deg, #22c55e, #4ade80)',
        border: 'none',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
    },
    questionNavigator: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '15px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.5rem',
    },
    navigatorTitle: {
        color: '#fff',
        fontSize: '1.1rem',
        marginBottom: '1rem',
    },
    questionDots: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem',
    },
    questionDot: {
        width: '45px',
        height: '45px',
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    questionDotActive: {
        background: 'rgba(74, 158, 255, 0.3)',
        border: '2px solid #4a9eff',
        color: '#4a9eff',
    },
    questionDotAnswered: {
        background: 'rgba(76, 175, 80, 0.2)',
        border: '2px solid #4caf50',
        color: '#4caf50',
    },
    legend: {
        display: 'flex',
        gap: '1.5rem',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem',
    },
    legendDot: {
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
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
    spinnerSmall: {
        width: '20px',
        height: '20px',
        border: '3px solid rgba(255, 255, 255, 0.3)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    loadingText: {
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: '1rem',
    },
    errorCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(244, 67, 54, 0.3)',
        padding: '4rem 2rem',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '0 auto',
    },
    errorIcon: {
        fontSize: '5rem',
        marginBottom: '1rem',
    },
    errorTitle: {
        color: '#f44336',
        marginBottom: '1rem',
        fontSize: '1.5rem',
    },
    errorMessage: {
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: '2rem',
        fontSize: '1.1rem',
    },
    errorActions: {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
    },
    backBtn: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        color: '#fff',
        padding: '0.75rem 2rem',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
    },
    retryBtn: {
        background: 'linear-gradient(135deg, #4a9eff, #60a5fa)',
        border: 'none',
        color: '#fff',
        padding: '0.75rem 2rem',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
    },
    successCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(76, 175, 80, 0.3)',
        padding: '4rem 2rem',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '0 auto',
    },
    successIcon: {
        fontSize: '5rem',
        marginBottom: '1rem',
    },
    successTitle: {
        color: '#4caf50',
        marginBottom: '1rem',
    },
    successText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '1.1rem',
        marginBottom: '2rem',
    },
    redirectText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.9rem',
        marginTop: '1rem',
    },
};

export default TakeQuizPage;
