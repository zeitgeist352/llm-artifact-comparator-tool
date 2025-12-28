// CreateQuizPage.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Modern Simple Icon Components
const SparklesIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
    </svg>
);

const PencilIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const AlertCircleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9 12l2 2 4-4" />
    </svg>
);

// Background Orb Component
const BackgroundOrbs = () => (
    <div style={styles.orbsContainer}>
        <div style={{...styles.orb, ...styles.orb1}} />
        <div style={{...styles.orb, ...styles.orb2}} />
        <div style={{...styles.orb, ...styles.orb3}} />
        <div style={{...styles.orb, ...styles.orb4}} />
    </div>
);

function CreateQuizPage() {
    const { studyId } = useParams();
    const navigate = useNavigate();
    const [mode, setMode] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        topic: '',
        difficulty: 'medium',
        numberOfQuestions: 5,
        questionType: 'MIXED'
    });

    // Validation state for number of questions
    const [questionValidation, setQuestionValidation] = useState({
        status: 'valid', // 'valid', 'warning', 'error'
        message: ''
    });

    const validateQuestionCount = (value) => {
        const strValue = String(value).trim();

        // Empty or not a number
        if (strValue === '' || isNaN(strValue)) {
            setQuestionValidation({
                status: 'error',
                message: 'Please enter a valid number'
            });
            return false;
        }

        const numValue = parseInt(strValue);

        // Out of range
        if (numValue < 1) {
            setQuestionValidation({
                status: 'warning',
                message: 'Minimum 1 question required'
            });
            return false;
        }

        if (numValue > 20) {
            setQuestionValidation({
                status: 'warning',
                message: 'Maximum 20 questions allowed'
            });
            return false;
        }

        // Valid
        setQuestionValidation({
            status: 'valid',
            message: `${numValue} question${numValue > 1 ? 's' : ''} will be generated`
        });
        return true;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'numberOfQuestions') {
            setFormData({
                ...formData,
                [name]: value
            });
            validateQuestionCount(value);
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleCreateManual = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8080/api/quiz/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    topic: formData.topic,
                    difficulty: formData.difficulty
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create quiz');
            }

            const quiz = await response.json();
            console.log('Quiz created:', quiz);

            const assignResponse = await fetch(`http://localhost:8080/api/studies/${studyId}/assign-quiz/${quiz.id}`, {
                method: 'POST'
            });

            if (!assignResponse.ok) {
                throw new Error('Failed to assign quiz to study');
            }

            console.log('Quiz assigned to study successfully');
            alert('Empty quiz created successfully!');
            navigate(`/edit-quiz/${studyId}/${quiz.id}`);
        } catch (error) {
            console.error('Error creating quiz:', error);
            alert('Failed to create quiz: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAI = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8080/api/quiz/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    numberOfQuestions: parseInt(formData.numberOfQuestions)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate quiz');
            }

            const quiz = await response.json();
            console.log('Quiz generated:', quiz);

            const assignResponse = await fetch(`http://localhost:8080/api/studies/${studyId}/assign-quiz/${quiz.id}`, {
                method: 'POST'
            });

            if (!assignResponse.ok) {
                throw new Error('Failed to assign quiz to study');
            }

            console.log('Quiz assigned to study successfully');
            alert('Quiz generated successfully with AI!');
            navigate(`/edit-quiz/${studyId}/${quiz.id}`);
        } catch (error) {
            console.error('Error generating quiz:', error);
            alert('Failed to generate quiz: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Check if form is valid
    const isAIFormValid = formData.title && formData.topic && questionValidation.status === 'valid';
    const isManualFormValid = formData.title && formData.topic;

    if (!mode) {
        return (
            <div style={styles.container}>
                <BackgroundOrbs />
                <div style={styles.content}>
                    <div style={styles.header}>
                        <button style={styles.backBtn} onClick={() => navigate(`/quiz-management/${studyId}`)}>
                            <ArrowLeftIcon />
                            <span>Back</span>
                        </button>
                        <h1 style={styles.title}>Create New Quiz</h1>
                    </div>

                    <div style={styles.modeSelection}>
                        <div className="mode-card-ai" style={styles.modeCard} onClick={() => setMode('ai')}>
                            <div style={styles.iconWrapper}>
                                <SparklesIcon />
                            </div>
                            <h2 style={styles.modeTitle}>AI Generate</h2>
                            <p style={styles.modeDesc}>Automatically create quiz questions based on your topic and preferences</p>
                            <ul style={styles.featureList}>
                                <li style={styles.featureItem}>
                                    <CheckIcon />
                                    <span>Instant generation</span>
                                </li>
                                <li style={styles.featureItem}>
                                    <CheckIcon />
                                    <span>Multiple question types</span>
                                </li>
                                <li style={styles.featureItem}>
                                    <CheckIcon />
                                    <span>Customizable difficulty</span>
                                </li>
                            </ul>
                            <button style={styles.selectBtn}>
                                <SparklesIcon />
                                <span>Select AI Generation</span>
                            </button>
                        </div>

                        <div className="mode-card-manual" style={styles.modeCard} onClick={() => setMode('manual')}>
                            <div style={styles.iconWrapper}>
                                <PencilIcon />
                            </div>
                            <h2 style={styles.modeTitle}>Manual Create</h2>
                            <p style={styles.modeDesc}>Create quiz structure manually and add questions one by one</p>
                            <ul style={styles.featureList}>
                                <li style={styles.featureItem}>
                                    <CheckIcon />
                                    <span>Full customization</span>
                                </li>
                                <li style={styles.featureItem}>
                                    <CheckIcon />
                                    <span>Add questions later</span>
                                </li>
                                <li style={styles.featureItem}>
                                    <CheckIcon />
                                    <span>Complete control</span>
                                </li>
                            </ul>
                            <button style={styles.selectBtn}>
                                <PencilIcon />
                                <span>Select Manual Creation</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <BackgroundOrbs />
            <div style={styles.content}>
                <div style={styles.header}>
                    <button style={styles.backBtn} onClick={() => setMode(null)}>
                        <ArrowLeftIcon />
                        <span>Change Mode</span>
                    </button>
                    <h1 style={styles.title}>
                        {mode === 'ai' ? (
                            <span style={styles.titleWithIcon}>
                                <SparklesIcon />
                                AI Quiz Generation
                            </span>
                        ) : (
                            <span style={styles.titleWithIcon}>
                                <PencilIcon />
                                Manual Quiz Creation
                            </span>
                        )}
                    </h1>
                </div>

                <div style={styles.formCard}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Quiz Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Spring Boot Knowledge Quiz"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Brief description of the quiz..."
                            rows="3"
                            style={styles.textarea}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Topic *</label>
                        <input
                            type="text"
                            name="topic"
                            value={formData.topic}
                            onChange={handleInputChange}
                            placeholder="e.g., Spring Boot, Java, React"
                            style={styles.input}
                        />
                    </div>

                    {mode === 'ai' && (
                        <>
                            {/* Number of Questions with Real-time Validation */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Number of Questions (1-20) *</label>
                                <input
                                    type="text"
                                    name="numberOfQuestions"
                                    value={formData.numberOfQuestions}
                                    onChange={handleInputChange}
                                    placeholder="Enter number between 1-20"
                                    style={{
                                        ...styles.inputNumber,
                                        borderColor: questionValidation.status === 'error'
                                            ? 'rgba(239, 68, 68, 0.5)'
                                            : questionValidation.status === 'warning'
                                                ? 'rgba(245, 158, 11, 0.5)'
                                                : 'rgba(34, 197, 94, 0.5)'
                                    }}
                                    className={`no-arrows validation-${questionValidation.status}`}
                                />
                                <div style={{
                                    ...styles.validationMessage,
                                    color: questionValidation.status === 'error'
                                        ? '#ef4444'
                                        : questionValidation.status === 'warning'
                                            ? '#f59e0b'
                                            : '#22c55e'
                                }}>
                                    {questionValidation.status === 'error' && <AlertCircleIcon />}
                                    {questionValidation.status === 'warning' && <AlertCircleIcon />}
                                    {questionValidation.status === 'valid' && <CheckCircleIcon />}
                                    <span>{questionValidation.message}</span>
                                </div>
                            </div>

                            {/* Difficulty Radio Buttons */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Difficulty *</label>
                                <div style={styles.radioGroup}>
                                    <label style={styles.radioCard} className={formData.difficulty === 'easy' ? 'radio-selected' : ''}>
                                        <input
                                            type="radio"
                                            name="difficulty"
                                            value="easy"
                                            checked={formData.difficulty === 'easy'}
                                            onChange={handleInputChange}
                                            style={styles.radioInput}
                                        />
                                        <div style={styles.radioContent}>
                                            <div style={styles.radioCheck}>
                                                {formData.difficulty === 'easy' && <CheckIcon />}
                                            </div>
                                            <span style={styles.radioLabel}>Easy</span>
                                        </div>
                                    </label>

                                    <label style={styles.radioCard} className={formData.difficulty === 'medium' ? 'radio-selected' : ''}>
                                        <input
                                            type="radio"
                                            name="difficulty"
                                            value="medium"
                                            checked={formData.difficulty === 'medium'}
                                            onChange={handleInputChange}
                                            style={styles.radioInput}
                                        />
                                        <div style={styles.radioContent}>
                                            <div style={styles.radioCheck}>
                                                {formData.difficulty === 'medium' && <CheckIcon />}
                                            </div>
                                            <span style={styles.radioLabel}>Medium</span>
                                        </div>
                                    </label>

                                    <label style={styles.radioCard} className={formData.difficulty === 'hard' ? 'radio-selected' : ''}>
                                        <input
                                            type="radio"
                                            name="difficulty"
                                            value="hard"
                                            checked={formData.difficulty === 'hard'}
                                            onChange={handleInputChange}
                                            style={styles.radioInput}
                                        />
                                        <div style={styles.radioContent}>
                                            <div style={styles.radioCheck}>
                                                {formData.difficulty === 'hard' && <CheckIcon />}
                                            </div>
                                            <span style={styles.radioLabel}>Hard</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Question Type Radio Buttons */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Question Type *</label>
                                <div style={styles.radioGroup}>
                                    <label style={styles.radioCard} className={formData.questionType === 'MULTIPLE_CHOICE' ? 'radio-selected' : ''}>
                                        <input
                                            type="radio"
                                            name="questionType"
                                            value="MULTIPLE_CHOICE"
                                            checked={formData.questionType === 'MULTIPLE_CHOICE'}
                                            onChange={handleInputChange}
                                            style={styles.radioInput}
                                        />
                                        <div style={styles.radioContent}>
                                            <div style={styles.radioCheck}>
                                                {formData.questionType === 'MULTIPLE_CHOICE' && <CheckIcon />}
                                            </div>
                                            <span style={styles.radioLabel}>Multiple Choice</span>
                                        </div>
                                    </label>

                                    <label style={styles.radioCard} className={formData.questionType === 'OPEN_ENDED' ? 'radio-selected' : ''}>
                                        <input
                                            type="radio"
                                            name="questionType"
                                            value="OPEN_ENDED"
                                            checked={formData.questionType === 'OPEN_ENDED'}
                                            onChange={handleInputChange}
                                            style={styles.radioInput}
                                        />
                                        <div style={styles.radioContent}>
                                            <div style={styles.radioCheck}>
                                                {formData.questionType === 'OPEN_ENDED' && <CheckIcon />}
                                            </div>
                                            <span style={styles.radioLabel}>Open-Ended</span>
                                        </div>
                                    </label>

                                    <label style={styles.radioCard} className={formData.questionType === 'MIXED' ? 'radio-selected' : ''}>
                                        <input
                                            type="radio"
                                            name="questionType"
                                            value="MIXED"
                                            checked={formData.questionType === 'MIXED'}
                                            onChange={handleInputChange}
                                            style={styles.radioInput}
                                        />
                                        <div style={styles.radioContent}>
                                            <div style={styles.radioCheck}>
                                                {formData.questionType === 'MIXED' && <CheckIcon />}
                                            </div>
                                            <span style={styles.radioLabel}>Mixed</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </>
                    )}

                    {mode === 'manual' && (
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Difficulty *</label>
                            <div style={styles.radioGroup}>
                                <label style={styles.radioCard} className={formData.difficulty === 'easy' ? 'radio-selected' : ''}>
                                    <input
                                        type="radio"
                                        name="difficulty"
                                        value="easy"
                                        checked={formData.difficulty === 'easy'}
                                        onChange={handleInputChange}
                                        style={styles.radioInput}
                                    />
                                    <div style={styles.radioContent}>
                                        <div style={styles.radioCheck}>
                                            {formData.difficulty === 'easy' && <CheckIcon />}
                                        </div>
                                        <span style={styles.radioLabel}>Easy</span>
                                    </div>
                                </label>

                                <label style={styles.radioCard} className={formData.difficulty === 'medium' ? 'radio-selected' : ''}>
                                    <input
                                        type="radio"
                                        name="difficulty"
                                        value="medium"
                                        checked={formData.difficulty === 'medium'}
                                        onChange={handleInputChange}
                                        style={styles.radioInput}
                                    />
                                    <div style={styles.radioContent}>
                                        <div style={styles.radioCheck}>
                                            {formData.difficulty === 'medium' && <CheckIcon />}
                                        </div>
                                        <span style={styles.radioLabel}>Medium</span>
                                    </div>
                                </label>

                                <label style={styles.radioCard} className={formData.difficulty === 'hard' ? 'radio-selected' : ''}>
                                    <input
                                        type="radio"
                                        name="difficulty"
                                        value="hard"
                                        checked={formData.difficulty === 'hard'}
                                        onChange={handleInputChange}
                                        style={styles.radioInput}
                                    />
                                    <div style={styles.radioContent}>
                                        <div style={styles.radioCheck}>
                                            {formData.difficulty === 'hard' && <CheckIcon />}
                                        </div>
                                        <span style={styles.radioLabel}>Hard</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    <div style={styles.formActions}>
                        <button
                            className="btn-cancel-glow"
                            style={styles.btnCancel}
                            onClick={() => navigate(`/quiz-management/${studyId}`)}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-create-glow"
                            style={{
                                ...styles.btnCreate,
                                opacity: (loading || (mode === 'ai' ? !isAIFormValid : !isManualFormValid)) ? 0.5 : 1,
                                cursor: (loading || (mode === 'ai' ? !isAIFormValid : !isManualFormValid)) ? 'not-allowed' : 'pointer'
                            }}
                            onClick={mode === 'ai' ? handleGenerateAI : handleCreateManual}
                            disabled={loading || (mode === 'ai' ? !isAIFormValid : !isManualFormValid)}
                        >
                            {loading ? (
                                <span style={styles.btnContent}>
                                    <div style={styles.spinner} />
                                    {mode === 'ai' ? 'Generating...' : 'Creating...'}
                                </span>
                            ) : (
                                <span style={styles.btnContent}>
                                    {mode === 'ai' ? <SparklesIcon /> : <PencilIcon />}
                                    {mode === 'ai' ? 'Generate Quiz' : 'Create Empty Quiz'}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1628 0%, #0d1b2a 25%, #1b263b 50%, #0d1b2a 75%, #0a1628 100%)',
        padding: '2.5rem',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        position: 'relative',
        overflow: 'hidden',
    },
    content: {
        position: 'relative',
        zIndex: 10,
    },
    // Animated Background Orbs
    orbsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 1,
        pointerEvents: 'none',
    },
    orb: {
        position: 'absolute',
        borderRadius: '50%',
        filter: 'blur(80px)',
        opacity: 0.4,
        mixBlendMode: 'screen',
    },
    orb1: {
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(74, 158, 255, 0.6), transparent)',
        top: '-10%',
        left: '10%',
        animation: 'float1 30s ease-in-out infinite',
    },
    orb2: {
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(58, 123, 213, 0.5), transparent)',
        top: '40%',
        right: '5%',
        animation: 'float2 25s ease-in-out infinite',
    },
    orb3: {
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(106, 90, 205, 0.4), transparent)',
        bottom: '10%',
        left: '20%',
        animation: 'float3 35s ease-in-out infinite',
    },
    orb4: {
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(72, 139, 224, 0.45), transparent)',
        top: '60%',
        left: '50%',
        animation: 'float4 28s ease-in-out infinite',
    },
    header: {
        marginBottom: '3rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
    },
    backBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: 'rgba(255, 255, 255, 0.9)',
        padding: '0.875rem 1.5rem',
        borderRadius: '14px',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: '500',
        backdropFilter: 'blur(16px)',
        transition: 'all 0.2s ease',
    },
    title: {
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: '2rem',
        margin: 0,
        fontWeight: '600',
        letterSpacing: '-0.02em',
    },
    titleWithIcon: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    modeSelection: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    modeCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '3rem 2.5rem',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
    },
    iconWrapper: {
        width: '72px',
        height: '72px',
        borderRadius: '18px',
        background: 'linear-gradient(135deg, rgba(74, 158, 255, 0.15), rgba(58, 123, 213, 0.15))',
        border: '1px solid rgba(74, 158, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 2rem',
        color: '#4a9eff',
        transition: 'all 0.4s ease',
    },
    modeTitle: {
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: '1.75rem',
        marginBottom: '1rem',
        fontWeight: '600',
        letterSpacing: '-0.01em',
        textAlign: 'center',
        transition: 'all 0.3s ease',
    },
    modeDesc: {
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: 1.7,
        marginBottom: '2rem',
        fontSize: '0.95rem',
        textAlign: 'center',
    },
    featureList: {
        listStyle: 'none',
        padding: 0,
        marginBottom: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.95rem',
    },
    selectBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        background: 'linear-gradient(135deg, #4a9eff, #3a7bd5)',
        color: '#fff',
        border: 'none',
        padding: '1.125rem 2rem',
        borderRadius: '14px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        width: '100%',
        transition: 'all 0.3s ease',
        boxShadow: '0 8px 24px rgba(74, 158, 255, 0.25)',
    },
    formCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '2.5rem',
        maxWidth: '900px',
        margin: '0 auto',
    },
    formGroup: {
        marginBottom: '1.75rem',
        flex: 1,
    },
    label: {
        display: 'block',
        color: 'rgba(255, 255, 255, 0.85)',
        marginBottom: '0.625rem',
        fontSize: '0.925rem',
        fontWeight: '500',
        letterSpacing: '-0.01em',
    },
    input: {
        width: '100%',
        padding: '1rem 1.125rem',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
    },
    inputNumber: {
        width: '100%',
        padding: '1rem 1.125rem',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1.5px solid',
        borderRadius: '12px',
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
    },
    validationMessage: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '0.625rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        transition: 'all 0.3s ease',
    },
    textarea: {
        width: '100%',
        padding: '1rem 1.125rem',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '0.95rem',
        outline: 'none',
        resize: 'vertical',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
    },
    // Modern Radio Button Styles
    radioGroup: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
    },
    radioCard: {
        position: 'relative',
        cursor: 'pointer',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1.5px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInput: {
        position: 'absolute',
        opacity: 0,
        cursor: 'pointer',
    },
    radioContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    radioCheck: {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        color: '#fff',
    },
    radioLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '0.925rem',
        fontWeight: '500',
        transition: 'all 0.3s ease',
    },
    formActions: {
        display: 'flex',
        gap: '1.25rem',
        marginTop: '2.5rem',
    },
    btnCancel: {
        flex: 1,
        padding: '1.125rem',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '14px',
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    btnCreate: {
        flex: 1,
        padding: '1.125rem',
        background: 'linear-gradient(135deg, #4a9eff, #3a7bd5)',
        border: 'none',
        borderRadius: '14px',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 8px 24px rgba(74, 158, 255, 0.2)',
    },
    btnContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
    },
    spinner: {
        width: '16px',
        height: '16px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderTop: '2px solid #fff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
};

// Add CSS animations and hover effects
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    @keyframes float1 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(30px, -30px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
    }
    
    @keyframes float2 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(-40px, 30px) scale(1.15); }
        66% { transform: translate(25px, -25px) scale(0.95); }
    }
    
    @keyframes float3 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(35px, 35px) scale(0.9); }
        66% { transform: translate(-30px, -20px) scale(1.1); }
    }
    
    @keyframes float4 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(-25px, -35px) scale(1.05); }
        66% { transform: translate(30px, 25px) scale(0.95); }
    }
    
    /* Hide number input arrows */
    input[type=text].no-arrows::-webkit-outer-spin-button,
    input[type=text].no-arrows::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    
    /* Validation States for Number Input */
    .validation-error {
        background: rgba(239, 68, 68, 0.08) !important;
        box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.3), 0 0 20px rgba(239, 68, 68, 0.15);
    }
    
    .validation-warning {
        background: rgba(245, 158, 11, 0.08) !important;
        box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.3), 0 0 20px rgba(245, 158, 11, 0.15);
    }
    
    .validation-valid {
        background: rgba(34, 197, 94, 0.08) !important;
        box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.3), 0 0 20px rgba(34, 197, 94, 0.15);
    }
    
    input:focus, textarea:focus {
        border-color: rgba(74, 158, 255, 0.4) !important;
        background: rgba(255, 255, 255, 0.06) !important;
    }
    
    button:hover:not(:disabled) {
        transform: translateY(-1px);
    }
    
    button:active:not(:disabled) {
        transform: translateY(0);
    }
    
    /* AI Generation Card Hover with Blue Glow */
    .mode-card-ai:hover {
        transform: translateY(-8px) scale(1.02);
        border-color: rgba(74, 158, 255, 0.5);
        background: rgba(255, 255, 255, 0.05);
        box-shadow: 
            0 0 40px rgba(74, 158, 255, 0.4),
            0 0 80px rgba(74, 158, 255, 0.2),
            0 0 120px rgba(74, 158, 255, 0.1),
            0 20px 60px rgba(0, 0, 0, 0.4);
    }
    
    .mode-card-ai:hover h2 {
        color: #4a9eff;
        text-shadow: 0 0 20px rgba(74, 158, 255, 0.5);
    }
    
    .mode-card-ai:hover .iconWrapper {
        background: linear-gradient(135deg, rgba(74, 158, 255, 0.3), rgba(58, 123, 213, 0.3));
        border-color: rgba(74, 158, 255, 0.6);
        box-shadow: 
            0 0 30px rgba(74, 158, 255, 0.6),
            inset 0 0 20px rgba(74, 158, 255, 0.2);
    }
    
    /* Manual Creation Card Hover with Purple-Blue Glow */
    .mode-card-manual:hover {
        transform: translateY(-8px) scale(1.02);
        border-color: rgba(138, 113, 255, 0.5);
        background: rgba(255, 255, 255, 0.05);
        box-shadow: 
            0 0 40px rgba(138, 113, 255, 0.4),
            0 0 80px rgba(138, 113, 255, 0.2),
            0 0 120px rgba(138, 113, 255, 0.1),
            0 20px 60px rgba(0, 0, 0, 0.4);
    }
    
    .mode-card-manual:hover h2 {
        color: #8a71ff;
        text-shadow: 0 0 20px rgba(138, 113, 255, 0.5);
    }
    
    .mode-card-manual:hover .iconWrapper {
        background: linear-gradient(135deg, rgba(138, 113, 255, 0.3), rgba(106, 90, 205, 0.3));
        border-color: rgba(138, 113, 255, 0.6);
        box-shadow: 
            0 0 30px rgba(138, 113, 255, 0.6),
            inset 0 0 20px rgba(138, 113, 255, 0.2);
    }
    
    /* Radio Button Selected State */
    .radio-selected {
        background: rgba(74, 158, 255, 0.12) !important;
        border-color: rgba(74, 158, 255, 0.5) !important;
        box-shadow: 
            0 0 20px rgba(74, 158, 255, 0.3),
            inset 0 0 20px rgba(74, 158, 255, 0.1);
    }
    
    .radio-selected .radioCheck {
        background: linear-gradient(135deg, #4a9eff, #3a7bd5);
        border-color: #4a9eff;
        box-shadow: 0 0 15px rgba(74, 158, 255, 0.5);
    }
    
    .radio-selected .radioLabel {
        color: rgba(255, 255, 255, 0.95);
        font-weight: 600;
    }
    
    /* Radio Button Hover */
    label[style*="radioCard"]:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(74, 158, 255, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(74, 158, 255, 0.15);
    }
    
    /* Action Buttons Glow Effects */
    .btn-create-glow:hover:not(:disabled) {
        box-shadow: 
            0 0 30px rgba(74, 158, 255, 0.5),
            0 0 60px rgba(74, 158, 255, 0.3),
            0 8px 32px rgba(74, 158, 255, 0.4);
        transform: translateY(-2px);
    }
    
    .btn-create-glow:active:not(:disabled) {
        box-shadow: 
            0 0 20px rgba(74, 158, 255, 0.4),
            0 0 40px rgba(74, 158, 255, 0.2),
            0 4px 16px rgba(74, 158, 255, 0.3);
        transform: translateY(0);
    }
    
    .btn-cancel-glow:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 
            0 0 20px rgba(255, 255, 255, 0.1),
            0 4px 20px rgba(0, 0, 0, 0.3);
        transform: translateY(-1px);
    }
`;
document.head.appendChild(styleSheet);

export default CreateQuizPage;
