import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    ClipboardCheck,
    UserCheck,
    ArrowRight,
    BookOpen,
    FileText,
    Target,
    Settings,
    CheckCircle2,
    Eye,
    FolderOpen,
    Send,
    UserPlus,
    Mail,
    BarChart3,
    AlertCircle, Home
} from "lucide-react";

function InfoPage() {
    const navigate = useNavigate();
    const [activeRole, setActiveRole] = useState('participant');

    const roleData = {
        participant: {
            name: 'Participant',
            icon: UserCheck,
            color: '#34d399',
            description: 'Join research studies, complete qualification quizzes, and evaluate artifacts at your own pace.',
            steps: [
                { icon: BookOpen, title: 'Browse Studies', desc: 'Explore available research studies', color: '#60a5fa' },
                { icon: FileText, title: 'Take Quiz', desc: 'Complete entry qualification quiz', color: '#a78bfa' },
                { icon: CheckCircle2, title: 'Get Approved', desc: 'Wait for researcher acceptance', color: '#f59e0b' },
                { icon: Target, title: 'Evaluate Artifacts', desc: 'Complete evaluation tasks', color: '#34d399' }
            ]
        },
        researcher: {
            name: 'Researcher',
            icon: Users,
            color: '#60a5fa',
            description: 'Create studies, upload artifacts, design evaluation tasks and quizzes, then manage participant assessments.',
            steps: [
                { icon: FolderOpen, title: 'Create Study', desc: 'Set up research study and upload artifacts', color: '#60a5fa' },
                { icon: Settings, title: 'Design Tasks', desc: 'Create evaluation tasks and criteria', color: '#a78bfa' },
                { icon: FileText, title: 'Build Quiz', desc: 'Create participant qualification quiz', color: '#f59e0b' },
                { icon: UserPlus, title: 'Review Applicants', desc: 'Accept or reject participants based on quiz results', color: '#ec4899' },
                { icon: Eye, title: 'Monitor Results', desc: 'Observe participant evaluations', color: '#34d399' },
                { icon: Send, title: 'Publish Study', desc: 'Make study available to reviewers', color: '#8b5cf6' }
            ]
        },
        reviewer: {
            name: 'Reviewer',
            icon: ClipboardCheck,
            color: '#a78bfa',
            description: 'Join studies via researcher invitations, analyze evaluation tasks and results, report issues to administrators.',
            steps: [
                { icon: Mail, title: 'Receive Invitation', desc: 'Get invited to studies by researchers', color: '#60a5fa' },
                { icon: CheckCircle2, title: 'Accept Invitation', desc: 'Join the study as reviewer', color: '#a78bfa' },
                { icon: BarChart3, title: 'Analyze Results', desc: 'Review evaluation tasks and participant data', color: '#f59e0b' },
                { icon: AlertCircle, title: 'Report Issues', desc: 'Flag problems to administrators if needed', color: '#ef4444' }
            ]
        }
    };

    const currentRole = roleData[activeRole];
    const IconComponent = currentRole.icon;

    return (
        <div style={styles.container}>
            {/* Animated background */}
            <div style={styles.particles}>
                {[...Array(25)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            ...styles.particle,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}vh`,
                            animationDelay: `${-(Math.random() * 15)}s`,
                            animationDuration: `${18 + Math.random() * 8}s`,
                        }}
                    />
                ))}
            </div>

            {/* Top Navigation */}
            <nav style={styles.topNav}>
                <button
                    style={styles.backButton}
                    onClick={() => {
                        const user = JSON.parse(localStorage.getItem("user"));
                        if (user && user.role) {
                            const role = user.role.toLowerCase();
                            if (role === 'participant') {
                                navigate('/participant');
                            } else if (role === 'researcher') {
                                navigate('/researcher');
                            } else if (role === 'reviewer') {
                                navigate('/reviewer');
                            } else {
                                navigate('/');
                            }
                        } else {
                            navigate('/');
                        }
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(96,165,250,0.2)';
                        e.target.style.transform = 'translateX(-3px)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.05)';
                        e.target.style.transform = 'translateX(0)';
                    }}
                >
                    <Home size={18} />
                    <span>Back to Main Menu</span>
                </button>
            </nav>
            {/* Hero Section */}
            <section style={styles.hero}>
                <h1 style={styles.heroTitle}>Artifact Comparator</h1>
                <p style={styles.heroSubtitle}>
                    Collaborative research platform connecting researchers, reviewers, and participants
                </p>
            </section>

            {/* Role Tabs */}
            <section style={styles.tabsSection}>
                <div style={styles.tabs}>
                    <button
                        style={{
                            ...styles.tab,
                            ...(activeRole === 'participant' ? styles.activeTab : {}),
                            borderBottom: activeRole === 'participant' ? '3px solid #34d399' : 'none'
                        }}
                        onClick={() => setActiveRole('participant')}
                    >
                        <UserCheck size={18} />
                        <span>Participant</span>
                    </button>
                    <button
                        style={{
                            ...styles.tab,
                            ...(activeRole === 'researcher' ? styles.activeTab : {}),
                            borderBottom: activeRole === 'researcher' ? '3px solid #60a5fa' : 'none'
                        }}
                        onClick={() => setActiveRole('researcher')}
                    >
                        <Users size={18} />
                        <span>Researcher</span>
                    </button>
                    <button
                        style={{
                            ...styles.tab,
                            ...(activeRole === 'reviewer' ? styles.activeTab : {}),
                            borderBottom: activeRole === 'reviewer' ? '3px solid #a78bfa' : 'none'
                        }}
                        onClick={() => setActiveRole('reviewer')}
                    >
                        <ClipboardCheck size={18} />
                        <span>Reviewer</span>
                    </button>
                </div>
            </section>

            {/* Role Content */}
            <section style={styles.contentSection}>
                <div style={styles.roleHeader}>
                    <div style={{
                        ...styles.roleIconWrapper,
                        background: `linear-gradient(135deg, ${currentRole.color}, ${currentRole.color}22)`
                    }}>
                        <IconComponent size={32} style={{ color: currentRole.color }} />
                    </div>
                    <h2 style={styles.roleTitle}>{currentRole.name}</h2>
                    <p style={styles.roleDescription}>{currentRole.description}</p>
                </div>

                {/* Workflow */}
                <div style={styles.workflowSection}>
                    <h3 style={styles.workflowTitle}>Workflow</h3>
                    <div style={styles.stepsContainer}>
                        {currentRole.steps.map((step, index) => {
                            const StepIcon = step.icon;
                            return (
                                <React.Fragment key={index}>
                                    <div style={styles.stepCard}>
                                        <div style={{
                                            ...styles.stepNumber,
                                            background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)`
                                        }}>
                                            {index + 1}
                                        </div>
                                        <StepIcon size={24} style={{ color: step.color, marginBottom: '8px' }} />
                                        <h4 style={styles.stepTitle}>{step.title}</h4>
                                        <p style={styles.stepDescription}>{step.desc}</p>
                                    </div>
                                    {index < currentRole.steps.length - 1 && (
                                        <ArrowRight size={20} style={styles.flowArrow} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Key Features */}
                <div style={styles.featuresSection}>
                    <h3 style={styles.featuresTitle}>Key Features</h3>
                    <div style={styles.featuresGrid}>
                        {activeRole === 'participant' && (
                            <>
                                <div style={styles.featureCard}>
                                    <CheckCircle2 size={18} style={{ color: '#34d399', marginBottom: '6px' }} />
                                    <h4 style={styles.featureTitle}>Flexible Schedule</h4>
                                    <p style={styles.featureText}>Complete tasks at your own pace</p>
                                </div>
                                <div style={styles.featureCard}>
                                    <CheckCircle2 size={18} style={{ color: '#34d399', marginBottom: '6px' }} />
                                    <h4 style={styles.featureTitle}>Multiple Studies</h4>
                                    <p style={styles.featureText}>Join and participate simultaneously</p>
                                </div>
                                <div style={styles.featureCard}>
                                    <CheckCircle2 size={18} style={{ color: '#34d399', marginBottom: '6px' }} />
                                    <h4 style={styles.featureTitle}>Progress Tracking</h4>
                                    <p style={styles.featureText}>Monitor completion in real-time</p>
                                </div>
                            </>
                        )}
                        {activeRole === 'researcher' && (
                            <>
                                <div style={styles.featureCard}>
                                    <CheckCircle2 size={18} style={{ color: '#60a5fa', marginBottom: '6px' }} />
                                    <h4 style={styles.featureTitle}>Study Management</h4>
                                    <p style={styles.featureText}>Complete control over research design</p>
                                </div>
                                <div style={styles.featureCard}>
                                    <CheckCircle2 size={18} style={{ color: '#60a5fa', marginBottom: '6px' }} />
                                    <h4 style={styles.featureTitle}>Custom Quizzes</h4>
                                    <p style={styles.featureText}>AI-powered grading and assessment</p>
                                </div>
                                <div style={styles.featureCard}>
                                    <CheckCircle2 size={18} style={{ color: '#60a5fa', marginBottom: '6px' }} />
                                    <h4 style={styles.featureTitle}>Data Analytics</h4>
                                    <p style={styles.featureText}>Comprehensive evaluation insights</p>
                                </div>
                            </>
                        )}
                        {activeRole === 'reviewer' && (
                            <>
                                <div style={styles.featureCard}>
                                    <CheckCircle2 size={18} style={{ color: '#a78bfa', marginBottom: '6px' }} />
                                    <h4 style={styles.featureTitle}>Invitation-Based</h4>
                                    <p style={styles.featureText}>Join studies via researcher invites</p>
                                </div>
                                <div style={styles.featureCard}>
                                    <CheckCircle2 size={18} style={{ color: '#a78bfa', marginBottom: '6px' }} />
                                    <h4 style={styles.featureTitle}>Data Analysis</h4>
                                    <p style={styles.featureText}>Review comprehensive study results</p>
                                </div>
                                <div style={styles.featureCard}>
                                    <CheckCircle2 size={18} style={{ color: '#a78bfa', marginBottom: '6px' }} />
                                    <h4 style={styles.featureTitle}>Issue Reporting</h4>
                                    <p style={styles.featureText}>Flag concerns to administrators</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={styles.footer}>
                <p>© {new Date().getFullYear()} Artifact Comparator — Empowering Research</p>
            </footer>

            <style>{`
                @keyframes floatParticle {
                    0% { transform: translateY(0); opacity: 0.2; }
                    50% { opacity: 0.6; }
                    100% { transform: translateY(-120vh); opacity: 0; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a, #16213e, #1a1a2e)',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        overflow: 'hidden',
    },
    particles: {
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
    },
    particle: {
        position: 'absolute',
        width: '2px',
        height: '2px',
        background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
        borderRadius: '50%',
        animation: 'floatParticle linear infinite',
    },
    topNav: {
        position: 'relative',
        zIndex: 10,
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'flex-start',
    },
    backButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#60a5fa',
        padding: '8px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: '600',
        transition: 'all 0.3s ease',
    },
    hero: {
        position: 'relative',
        zIndex: 1,
        padding: '20px 20px 15px',
        textAlign: 'center',
    },
    heroTitle: {
        fontSize: '2rem',
        fontWeight: '800',
        marginBottom: '8px',
        background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #34d399)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: '1.2',
    },
    heroSubtitle: {
        fontSize: '0.9rem',
        color: 'rgba(255,255,255,0.7)',
        maxWidth: '600px',
        margin: '0 auto',
        lineHeight: '1.4',
    },
    tabsSection: {
        position: 'relative',
        zIndex: 1,
        padding: '15px 20px 0',
        maxWidth: '1000px',
        margin: '0 auto',
    },
    tabs: {
        display: 'flex',
        justifyContent: 'center',
        gap: '4px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '10px',
        padding: '6px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    tab: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'transparent',
        color: 'rgba(255,255,255,0.6)',
        border: 'none',
        padding: '10px 20px',
        fontSize: '0.85rem',
        fontWeight: '600',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        flex: 1,
        maxWidth: '180px',
        justifyContent: 'center',
    },
    activeTab: {
        background: 'rgba(255,255,255,0.1)',
        color: '#fff',
    },
    contentSection: {
        position: 'relative',
        zIndex: 1,
        padding: '25px 20px',
        maxWidth: '1000px',
        margin: '0 auto',
        animation: 'fadeIn 0.5s ease-out',
    },
    roleHeader: {
        textAlign: 'center',
        marginBottom: '25px',
    },
    roleIconWrapper: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 12px',
        border: '2px solid rgba(255,255,255,0.2)',
    },
    roleTitle: {
        fontSize: '1.6rem',
        fontWeight: '700',
        color: '#fff',
        marginBottom: '8px',
    },
    roleDescription: {
        fontSize: '0.9rem',
        color: 'rgba(255,255,255,0.7)',
        maxWidth: '600px',
        margin: '0 auto',
        lineHeight: '1.5',
    },
    workflowSection: {
        marginBottom: '25px',
    },
    workflowTitle: {
        fontSize: '1.3rem',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: '20px',
        color: '#fff',
    },
    stepsContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        maxWidth: '100%',
        margin: '0 auto',
    },
    stepCard: {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '10px',
        padding: '16px 12px',
        border: '1px solid rgba(255,255,255,0.1)',
        width: '130px',
        textAlign: 'center',
        position: 'relative',
    },
    stepNumber: {
        position: 'absolute',
        top: '-10px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '800',
        fontSize: '0.75rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    },
    stepTitle: {
        fontSize: '0.8rem',
        fontWeight: '700',
        color: '#fff',
        margin: '0 0 4px 0',
    },
    stepDescription: {
        fontSize: '0.7rem',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: '1.3',
        margin: 0,
    },
    flowArrow: {
        color: 'rgba(96,165,250,0.5)',
        flexShrink: 0,
    },
    featuresSection: {
        marginTop: '25px',
    },
    featuresTitle: {
        fontSize: '1.3rem',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: '18px',
        color: '#fff',
    },
    featuresGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
    },
    featureCard: {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '10px',
        padding: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
    },
    featureTitle: {
        fontSize: '0.9rem',
        fontWeight: '700',
        color: '#fff',
        margin: '0 0 6px 0',
    },
    featureText: {
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: '1.3',
        margin: 0,
    },
    footer: {
        textAlign: 'center',
        padding: '20px 20px',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '0.75rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        zIndex: 1,
    },
};

export default InfoPage;
