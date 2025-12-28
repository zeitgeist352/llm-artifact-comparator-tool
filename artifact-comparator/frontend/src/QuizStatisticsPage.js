import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

function QuizStatisticsPage() {
    const { quizId } = useParams();
    const [searchParams] = useSearchParams();
    const studyId = searchParams.get('studyId');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [participantResults, setParticipantResults] = useState([]);
    const [error, setError] = useState(null);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/quiz-management/${quizId}/quiz-statistics`);
            if (!response.ok) throw new Error('Failed to fetch statistics');
            const data = await response.json();
            setStatistics(data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuiz = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/quiz/${quizId}`);
            if (!response.ok) throw new Error('Failed to fetch quiz');
            const data = await response.json();
            setQuiz(data);
        } catch (error) {
            console.error('Error fetching quiz:', error);
        }
    };

    const fetchParticipantResults = async () => {
        if (!studyId) return;
        try {
            const response = await fetch(`http://localhost:8080/api/quiz-attempt/study/${studyId}/results`);
            if (!response.ok) throw new Error('Failed to fetch participant results');
            const data = await response.json();
            setParticipantResults(data);
        } catch (error) {
            console.error('Error fetching participant results:', error);
        }
    };

    useEffect(() => {
        fetchStatistics();
        fetchQuiz();
        if (studyId) {
            fetchParticipantResults();
        }
    }, [quizId, studyId]);

    const prepareGradeDistribution = () => {
        if (!participantResults || participantResults.length === 0) {
            return [
                { range: '0-10', count: 0 },
                { range: '10-20', count: 0 },
                { range: '20-30', count: 0 },
                { range: '30-40', count: 0 },
                { range: '40-50', count: 0 },
                { range: '50-60', count: 0 },
                { range: '60-70', count: 0 },
                { range: '70-80', count: 0 },
                { range: '80-90', count: 0 },
                { range: '90-100', count: 0 },
            ];
        }

        const distribution = {
            '0-10': 0, '10-20': 0, '20-30': 0, '30-40': 0, '40-50': 0,
            '50-60': 0, '60-70': 0, '70-80': 0, '80-90': 0, '90-100': 0,
        };

        participantResults.forEach(result => {
            const percentage = result.percentageScore || 0;
            if (percentage >= 0 && percentage < 10) distribution['0-10']++;
            else if (percentage >= 10 && percentage < 20) distribution['10-20']++;
            else if (percentage >= 20 && percentage < 30) distribution['20-30']++;
            else if (percentage >= 30 && percentage < 40) distribution['30-40']++;
            else if (percentage >= 40 && percentage < 50) distribution['40-50']++;
            else if (percentage >= 50 && percentage < 60) distribution['50-60']++;
            else if (percentage >= 60 && percentage < 70) distribution['60-70']++;
            else if (percentage >= 70 && percentage < 80) distribution['70-80']++;
            else if (percentage >= 80 && percentage < 90) distribution['80-90']++;
            else if (percentage >= 90 && percentage <= 100) distribution['90-100']++;
        });

        return Object.keys(distribution).map(range => ({
            range,
            count: distribution[range]
        }));
    };

    const gradeDistributionData = prepareGradeDistribution();

    const prepareQuestionData = () => {
        if (!statistics?.perQuestionAveragePoints || !quiz?.questions) return [];

        return quiz.questions.map((question, index) => {
            const avgPoints = statistics.perQuestionAveragePoints[question.id] || 0;

            return {
                name: `Q${index + 1}`,
                questionText: question.questionText?.substring(0, 30) + '...' || `Question ${index + 1}`,
                averagePoints: Number(avgPoints) || 0,
                maxPoints: question.points || 0,
                percentage: question.points > 0 ? ((avgPoints / question.points) * 100).toFixed(1) : '0.0'
            };
        });
    };

    const questionData = prepareQuestionData();

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={styles.tooltip}>
                    <p style={styles.tooltipTitle}>{payload[0].payload.questionText}</p>
                    <p style={styles.tooltipScore}>
                        Average: <strong>{payload[0].value.toFixed(2)}</strong> / {payload[0].payload.maxPoints} points
                    </p>
                    <p style={styles.tooltipPercentage}>
                        {payload[0].payload.percentage}% correct
                    </p>
                </div>
            );
        }
        return null;
    };

    const GradeDistributionTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={styles.tooltip}>
                    <p style={styles.tooltipTitle}>Grade Range: {payload[0].payload.range}%</p>
                    <p style={styles.tooltipScore}>
                        Participants: <strong>{payload[0].value}</strong>
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingCard}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Loading statistics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <button style={styles.backBtn} onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h1 style={styles.title}>Quiz Statistics</h1>
                </div>
                <div style={styles.errorCard}>
                    <div style={styles.errorIcon}>⚠️</div>
                    <h2 style={styles.errorTitle}>Error Loading Statistics</h2>
                    <p style={styles.errorText}>{error}</p>
                    <button style={styles.retryBtn} onClick={fetchStatistics}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!statistics) {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <button style={styles.backBtn} onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h1 style={styles.title}>Quiz Statistics</h1>
                </div>
                <div style={styles.noDataCard}>
                    <div style={styles.noDataIcon}>📊</div>
                    <h2 style={styles.noDataTitle}>No Statistics Available</h2>
                    <p style={styles.noDataText}>No participants have completed this quiz yet</p>
                </div>
            </div>
        );
    }

    const averagePercentage = statistics.generalAveragePercentage || 0;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <h1 style={styles.title}>Quiz Statistics</h1>
            </div>

            {/* Overview Cards */}
            <div style={styles.overviewGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                    </div>
                    <div>
                        <p style={styles.statLabel}>Average Score</p>
                        <p style={styles.statValue}>{averagePercentage.toFixed(1)}%</p>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                    </div>
                    <div>
                        <p style={styles.statLabel}>Total Questions</p>
                        <p style={styles.statValue}>{quiz?.questions?.length || 0}</p>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                            <path d="M16 3.13a4 4 0 010 7.75"/>
                        </svg>
                    </div>
                    <div>
                        <p style={styles.statLabel}>Total Participants</p>
                        <p style={styles.statValue}>{participantResults.length}</p>
                    </div>
                </div>
            </div>

            {/* TWO COLUMN CHART LAYOUT */}
            <div style={styles.chartsGrid}>
                {/* Left Column: Grade Distribution */}
                <div style={styles.chartCard}>
                    <div style={styles.chartHeader}>
                        <h2 style={styles.chartTitle}>Grade Distribution</h2>
                    </div>
                    <div style={styles.chartDescription}>
                        Participants by score range
                    </div>

                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={gradeDistributionData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#667eea"/>
                                    <stop offset="100%" stopColor="#764ba2"/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="range"
                                stroke="rgba(255,255,255,0.5)"
                                style={{ fontSize: '0.75rem' }}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.5)"
                                style={{ fontSize: '0.75rem' }}
                                allowDecimals={false}
                            />
                            <Tooltip content={<GradeDistributionTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="url(#lineGradient)"
                                strokeWidth={2.5}
                                dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: '#764ba2' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Right Column: Question Analysis */}
                <div style={styles.chartCard}>
                    <div style={styles.chartHeader}>
                        <h2 style={styles.chartTitle}>Question Analysis</h2>
                    </div>
                    <div style={styles.chartDescription}>
                        Average points per question
                    </div>

                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={questionData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="name"
                                stroke="rgba(255,255,255,0.5)"
                                style={{ fontSize: '0.75rem' }}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.5)"
                                style={{ fontSize: '0.75rem' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="averagePoints"
                                fill="#4a9eff"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={50}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Question Details Table */}
            <div style={styles.tableCard}>
                <h3 style={styles.tableTitle}>Detailed Question Statistics</h3>
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                        <tr style={styles.tableHeader}>
                            <th style={styles.th}>#</th>
                            <th style={styles.th}>Question</th>
                            <th style={styles.th}>Avg Points</th>
                            <th style={styles.th}>Max Points</th>
                            <th style={styles.th}>Success Rate</th>
                        </tr>
                        </thead>
                        <tbody>
                        {questionData.map((q, index) => (
                            <tr key={index} style={styles.tableRow}>
                                <td style={styles.td}>{index + 1}</td>
                                <td style={styles.td}>{q.questionText}</td>
                                <td style={styles.td}>
                                    <span style={styles.pointsBadge}>
                                        {q.averagePoints.toFixed(2)}
                                    </span>
                                </td>
                                <td style={styles.td}>{q.maxPoints}</td>
                                <td style={styles.td}>
                                    <div style={styles.progressBar}>
                                        <div
                                            style={{
                                                ...styles.progressFill,
                                                width: `${q.percentage}%`,
                                                background: q.percentage >= 70 ? '#4caf50' :
                                                    q.percentage >= 50 ? '#ff9800' : '#f44336'
                                            }}
                                        />
                                        <span style={styles.progressText}>{q.percentage}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)',
        padding: '1.5rem',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    header: {
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    backBtn: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#fff',
        padding: '0.625rem 1.25rem',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        fontFamily: 'inherit',
    },
    title: {
        color: '#fff',
        fontSize: '1.75rem',
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
    errorCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(244, 67, 54, 0.3)',
        padding: '3rem 2rem',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '0 auto',
    },
    errorIcon: {
        fontSize: '3rem',
        marginBottom: '1rem',
    },
    errorTitle: {
        color: '#fff',
        fontSize: '1.5rem',
        marginBottom: '0.5rem',
    },
    errorText: {
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: '2rem',
    },
    retryBtn: {
        background: 'linear-gradient(135deg, #4a9eff, #3a7bd5)',
        color: '#fff',
        border: 'none',
        padding: '0.75rem 1.75rem',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: '600',
        fontFamily: 'inherit',
    },
    noDataCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '3rem 2rem',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '0 auto',
    },
    noDataIcon: {
        fontSize: '3rem',
        marginBottom: '1rem',
    },
    noDataTitle: {
        color: '#fff',
        fontSize: '1.5rem',
        marginBottom: '0.5rem',
    },
    noDataText: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    overviewGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
    },
    statCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    },
    statIcon: {
        width: '48px',
        height: '48px',
        borderRadius: '10px',
        background: 'rgba(74, 158, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#4a9eff',
        flexShrink: 0,
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.8rem',
        marginBottom: '0.25rem',
        fontWeight: '500',
    },
    statValue: {
        color: '#fff',
        fontSize: '1.5rem',
        fontWeight: '700',
        margin: 0,
        letterSpacing: '-0.02em',
    },
    // NEW: Two-column grid for charts
    chartsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem',
    },
    chartCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    },
    chartHeader: {
        marginBottom: '0.5rem',
    },
    chartTitle: {
        color: '#fff',
        fontSize: '1.1rem',
        margin: 0,
        fontWeight: '600',
        letterSpacing: '-0.01em',
    },
    chartDescription: {
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: '1rem',
        fontSize: '0.8rem',
    },
    tooltip: {
        background: 'rgba(10, 14, 39, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: '0.75rem',
        color: '#fff',
    },
    tooltipTitle: {
        margin: '0 0 0.4rem 0',
        fontWeight: '600',
        color: '#fff',
        fontSize: '0.85rem',
    },
    tooltipScore: {
        margin: '0.2rem 0',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '0.8rem',
    },
    tooltipPercentage: {
        margin: '0.2rem 0',
        color: '#4a9eff',
        fontWeight: '600',
        fontSize: '0.8rem',
    },
    tableCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    },
    tableTitle: {
        color: '#fff',
        fontSize: '1.1rem',
        marginBottom: '1rem',
        fontWeight: '600',
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
        padding: '0.875rem',
        textAlign: 'left',
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
        fontSize: '0.85rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    tableRow: {
        transition: 'background 0.2s',
    },
    td: {
        padding: '0.875rem',
        color: '#fff',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '0.85rem',
    },
    pointsBadge: {
        background: 'rgba(74, 158, 255, 0.2)',
        color: '#4a9eff',
        padding: '0.35rem 0.7rem',
        borderRadius: '6px',
        fontWeight: '600',
        display: 'inline-block',
        fontSize: '0.8rem',
    },
    progressBar: {
        position: 'relative',
        width: '100%',
        height: '28px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '6px',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        transition: 'width 0.3s ease',
        borderRadius: '6px',
    },
    progressText: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#fff',
        fontWeight: '600',
        fontSize: '0.75rem',
    },
};

export default QuizStatisticsPage;
