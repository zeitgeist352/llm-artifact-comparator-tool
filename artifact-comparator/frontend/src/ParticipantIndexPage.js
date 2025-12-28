import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Sparkles, TrendingUp, Clock, Info } from "lucide-react";

function ParticipantIndexPage() {
    const [username, setUsername] = useState("");
    const [availableStudies, setAvailableStudies] = useState([]);
    const [joinedStudies, setJoinedStudies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [participationStatuses, setParticipationStatuses] = useState({});

    // Function to get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return "Good morning";
        } else if (hour >= 12 && hour < 17) {
            return "Good afternoon";
        } else if (hour >= 17 && hour < 22) {
            return "Good evening";
        } else {
            return "Good night";
        }
    };

    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:8080/api/quiz-attempt/my-study-statuses", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setParticipationStatuses(data);
                }
            } catch (err) {
                console.error("Failed to fetch statuses:", err);
            }
        };

        fetchStatuses();
    }, []);


    // Giriş yapan kullanıcı bilgisi
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser && storedUser.username) {
            setUsername(storedUser.username);
        } else {
            navigate("/");
        }
    }, [navigate]);

    // Çalışmaları backend'den çek (katılınabilir ve katıldığı)
    useEffect(() => {
        const fetchStudies = async () => {
            try {
                const token = localStorage.getItem("token");
                const [availRes, joinedRes] = await Promise.all([
                    fetch("http://localhost:8080/api/studies/available", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch("http://localhost:8080/api/studies/joined-with-progress", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                if (availRes.ok) setAvailableStudies(await availRes.json());
                if (joinedRes.ok) setJoinedStudies(await joinedRes.json());
            } catch (err) {
                console.error("Failed to fetch studies:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStudies();
    }, []);

    const filteredAvailable = availableStudies.filter(s => {
        const status = participationStatuses[s.id];

        // Accepted olan çalışmaları yeniden join göstermeyelim
        if (status === "ACCEPTED") return false;

        // Rejected olanlar tekrar başvuramasın
        if (status === "REJECTED") return false;

        return true; // pending veya hiç başvurmamış
    });

    const filteredJoined = joinedStudies.filter(s => {
        return participationStatuses[s.id] === "ACCEPTED";
    });

    // Çalışmaya katıl
    const handleJoinStudy = async (id) => {
        if (!window.confirm("Bu çalışmaya katılmak istiyor musun?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/participant/join/${id}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const joined = await res.json();
                alert("✅ Çalışmaya başarıyla katıldın!");

                setJoinedStudies([...joinedStudies, joined]);
                setAvailableStudies(availableStudies.filter((s) => s.id !== id));

                // Eğer çalışmanın quiz'i varsa direkt quiz'e yönlendir
                if (joined.quiz && joined.quiz.id) {
                    // join çağrısına gönderdiğin 'id' zaten studyId
                    navigate(`/take-quiz/${id}`);
                } else {
                    navigate(`/study/${id}/tasks`);
                }
            } else alert("❌ Katılma işlemi başarısız.");
        } catch (err) {
            console.error(err);
        }
    };


    // Çalışmayı aç ve taskleri gör.
    const handleOpenStudy = (id) => navigate(`/study/${id}/tasks`);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const handleProfile = () => {
        navigate("/profile");
    };

    const handleInfo = () => {
        navigate("/info");
    };

    return (
        <div style={styles.container}>
            {/* Animated background particles */}
            <div style={styles.particles}>
                {[...Array(55)].map((_, i) => {
                    const startY = Math.random() * 100;
                    const negDelay = -(Math.random() * 15).toFixed(2);

                    return (
                        <div
                            key={i}
                            style={{
                                ...styles.particle,
                                left: `${Math.random() * 100}%`,
                                top: `${startY}vh`,
                                animationDelay: `${negDelay}s`,
                                animationDuration: `${16 + Math.random() * 10}s`,
                                opacity: 0.45,
                            }}
                        />
                    );
                })}
            </div>

            {/* Navbar */}
            <div style={styles.navbar}>
                <div style={styles.logoSection}>
                    <Sparkles size={28} style={styles.logoIcon} />
                    <h2 style={styles.title}>Participant Hub</h2>
                </div>
                <div style={styles.right}>
                    <button
                        style={styles.infoBtn}
                        onClick={handleInfo}
                        title="Information"
                        onMouseEnter={(e) => {
                            e.target.style.transform = "scale(1.1)";
                            e.target.style.background = "rgba(96, 165, 250, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = "scale(1)";
                            e.target.style.background = "rgba(96, 165, 250, 0.1)";
                        }}
                    >
                        <Info size={18} />
                    </button>
                    <span style={styles.userText}>
                        {username}
                    </span>
                    <button style={styles.profileBtn} onClick={handleProfile}>
                        <User size={16} />
                        My Profile
                    </button>
                    <button className="logout-btn" style={styles.logout} onClick={handleLogout}>
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>

            {/* Hero Section */}
            <div style={styles.hero}>
                <h1 style={styles.heroTitle}>{getGreeting()}, {username}!</h1>
                <p style={styles.heroSubtitle}>
                    Manage your studies, participate in research, and track your progress.
                </p>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsContainer}>
                <div style={styles.statCard}>
                    <TrendingUp size={24} style={{ color: "#0ea5e9" }} />
                    <div style={styles.statNumber}>{filteredAvailable.length}</div>
                    <div style={styles.statLabel}>Available Studies</div>
                </div>
                <div style={styles.statCard}>
                    <Clock size={24} style={{ color: "#a78bfa" }} />
                    <div style={styles.statNumber}>{joinedStudies.length}</div>
                    <div style={styles.statLabel}>Active Studies</div>
                </div>
            </div>

            {/* Katılınabilir Çalışmalar */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                    <Sparkles size={20} style={{ marginRight: "10px" }} />
                    Available Studies to Join
                </h3>
                {isLoading ? (
                    <div style={styles.loadingContainer}>
                        <div style={styles.spinner}></div>
                        <p style={styles.loadingText}>Loading studies...</p>
                    </div>
                ) : availableStudies.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>🔬</div>
                        <p style={styles.emptyText}>There are currently no studies you can participate in.</p>
                        <p style={styles.emptySubtext}>When new studies are added they will appear here!</p>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {filteredAvailable.map((s, index) => (
                            <div
                                key={s.id}
                                style={{
                                    ...styles.card,
                                    animationDelay: `${index * 0.1}s`,
                                }}
                            >
                                <div style={styles.cardGlow}></div>
                                <div style={styles.cardHeader}>
                                    <h4 style={styles.cardTitle}>{s.title}</h4>
                                    <div style={styles.badge}>New</div>
                                </div>
                                <p style={styles.cardDescription}>{s.description}</p>
                                <button
                                    style={styles.joinBtn}
                                    onClick={() => handleJoinStudy(s.id)}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = "translateY(-2px)";
                                        e.target.style.boxShadow = "0 8px 20px rgba(14,165,233,0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = "translateY(0)";
                                        e.target.style.boxShadow = "none";
                                    }}
                                >
                                    <Sparkles size={16} style={{ marginRight: "8px" }} />
                                    {participationStatuses[s.id] === "PENDING"
                                        ? "Waiting for Approval"
                                        : "Join Study"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Katıldığı Çalışmalar */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                    <TrendingUp size={20} style={{ marginRight: "10px" }} />
                    Your Active Studies
                </h3>
                {isLoading ? (
                    <div style={styles.loadingContainer}>
                        <div style={styles.spinner}></div>
                        <p style={styles.loadingText}>Loading your studies...</p>
                    </div>
                ) : joinedStudies.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>📊</div>
                        <p style={styles.emptyText}>Has not participated in any studies yet</p>
                        <p style={styles.emptySubtext}>Start by participating in the above studies!</p>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {filteredJoined.map((s, index) => (
                            <div
                                key={s.id}
                                style={{
                                    ...styles.card,
                                    ...styles.activeCard,
                                    animationDelay: `${index * 0.1}s`,
                                }}
                            >
                                <div style={styles.cardGlow}></div>
                                <div style={styles.cardHeader}>
                                    <h4 style={styles.cardTitle}>{s.title}</h4>
                                    <div style={styles.activeBadge}>Active</div>
                                </div>
                                <p style={styles.cardDescription}>{s.description}</p>
                                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px", overflow: "hidden", marginBottom: "12px" }}>
                                    <div
                                        style={{
                                            width: `${Math.round(s.progress)}%`,
                                            height: "8px",
                                            background: "#a78bfa",
                                            transition: "width 0.3s ease",
                                        }}
                                    />
                                </div>
                                <p style={{ color: "#a78bfa", fontSize: "0.85rem", marginBottom: "8px" }}>
                                    Progress: {Math.round(s.progress)}%
                                </p>
                                <button
                                    style={styles.viewBtn}
                                    onClick={() => handleOpenStudy(s.id)}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = "translateY(-2px)";
                                        e.target.style.boxShadow = "0 8px 20px rgba(167,139,250,0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = "translateY(0)";
                                        e.target.style.boxShadow = "none";
                                    }}
                                >
                                    Continue Study →
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer style={styles.footer}>
                <p>© {new Date().getFullYear()} Artifact Comparator — Empowering Research</p>
            </footer>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes floatParticle {
                    0% { transform: translateY(0); opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-120vh); opacity: 0; }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes glow {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .logout-btn:hover {
                    transform: scale(1.06);
                    box-shadow: 0 0 18px rgba(239,68,68,0.7);
                    border-color: rgba(239,68,68,0.85) !important;
                }
            `}</style>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        paddingBottom: "60px",
        position: "relative",
        overflow: "hidden",
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
    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "relative",
        zIndex: 10,
    },
    logoSection: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    logoIcon: {
        color: "#0ea5e9",
        animation: "float 3s ease-in-out infinite",
    },
    title: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#60a5fa",
        margin: 0,
    },
    right: {
        display: "flex",
        alignItems: "center",
        gap: "15px",
    },
    infoBtn: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        background: "rgba(96, 165, 250, 0.1)",
        border: "2px solid rgba(96, 165, 250, 0.5)",
        color: "#60a5fa",
        borderRadius: "50%",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },
    userText: {
        fontSize: "1.2rem",
        color: "#ffffff",
        fontWeight: "600",
    },
    profileBtn: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "rgba(96, 165, 250, 0.1)",
        border: "2px solid rgba(96, 165, 250, 0.5)",
        color: "#60a5fa",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "0.9rem",
        transition: "all 0.3s ease",
    },
    logout: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "rgba(239,68,68,0.1)",
        border: "2px solid rgba(239,68,68,0.5)",
        color: "#f87171",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "0.9rem",
        transition: "all 0.25s ease-out",
    },
    hero: {
        textAlign: "center",
        padding: "60px 20px 40px",
        position: "relative",
        zIndex: 1,
    },
    heroTitle: {
        fontSize: "2.5rem",
        fontWeight: "700",
        marginBottom: "15px",
        background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: "slideIn 0.6s ease-out",
    },
    heroSubtitle: {
        fontSize: "1.1rem",
        color: "rgba(255,255,255,0.7)",
        maxWidth: "600px",
        margin: "0 auto",
        animation: "slideIn 0.8s ease-out",
    },
    statsContainer: {
        display: "flex",
        gap: "20px",
        maxWidth: "900px",
        margin: "0 auto 40px",
        padding: "0 20px",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
    },
    statCard: {
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
        borderRadius: "20px",
        padding: "24px 40px",
        border: "1px solid rgba(255,255,255,0.1)",
        textAlign: "center",
        flex: 1,
        maxWidth: "200px",
        animation: "slideIn 1s ease-out",
    },
    statNumber: {
        fontSize: "2.5rem",
        fontWeight: "800",
        color: "#fff",
        margin: "12px 0 4px",
    },
    statLabel: {
        fontSize: "0.9rem",
        color: "rgba(255,255,255,0.6)",
        fontWeight: "500",
    },
    section: {
        maxWidth: "1200px",
        margin: "60px auto",
        padding: "0 20px",
        position: "relative",
        zIndex: 1,
    },
    sectionTitle: {
        display: "flex",
        alignItems: "center",
        fontSize: "1.8rem",
        fontWeight: "700",
        marginBottom: "30px",
        color: "#93c5fd",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "25px",
    },
    card: {
        position: "relative",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
        borderRadius: "15px",
        padding: "25px",
        border: "1px solid rgba(14,165,233,0.3)",
        boxShadow: "0 0 6px rgba(14,165,233,0.33)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        animation: "slideIn 0.6s ease-out forwards",
        opacity: 0,
        cursor: "default",
        overflow: "hidden",
    },
    activeCard: {
        border: "1px solid rgba(167,139,250,0.3)",
        boxShadow: "0 0 6px rgba(167,139,250,0.33)",
    },
    cardGlow: {
        position: "absolute",
        top: "-50%",
        left: "-50%",
        width: "200%",
        height: "200%",
        background: "radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)",
        animation: "glow 3s ease-in-out infinite",
        pointerEvents: "none",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "12px",
        gap: "10px",
        flexWrap: "wrap",
    },
    cardTitle: {
        fontSize: "1.1rem",
        fontWeight: "600",
        color: "#fff",
        margin: 0,
        flex: 1,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    badge: {
        flexShrink: 0,
        background: "rgba(14,165,233,0.2)",
        color: "#0ea5e9",
        padding: "4px 14px",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: "600",
        border: "1px solid rgba(14,165,233,0.3)",
        minWidth: "70px",
        textAlign: "center",
    },
    activeBadge: {
        flexShrink: 0,
        background: "rgba(167,139,250,0.2)",
        color: "#a78bfa",
        padding: "4px 14px",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: "600",
        border: "1px solid rgba(167,139,250,0.3)",
        minWidth: "70px",
        textAlign: "center",
    },
    cardDescription: {
        color: "rgba(255,255,255,0.9)",
        fontSize: "0.95rem",
        lineHeight: "1.6",
        marginBottom: "20px",
    },
    joinBtn: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        background: "rgba(14,165,233,0.2)",
        color: "#0ea5e9",
        border: "2px solid rgba(14,165,233,0.4)",
        borderRadius: "12px",
        padding: "12px 20px",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "0.95rem",
        transition: "all 0.3s ease",
    },
    viewBtn: {
        width: "100%",
        background: "rgba(167,139,250,0.2)",
        color: "#a78bfa",
        border: "2px solid rgba(167,139,250,0.4)",
        borderRadius: "12px",
        padding: "12px 20px",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "0.95rem",
        transition: "all 0.3s ease",
    },
    emptyState: {
        textAlign: "center",
        padding: "60px 20px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "20px",
        border: "1px dashed rgba(255,255,255,0.2)",
    },
    emptyIcon: {
        fontSize: "4rem",
        marginBottom: "20px",
        animation: "float 3s ease-in-out infinite",
    },
    emptyText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: "1.1rem",
        marginBottom: "8px",
    },
    emptySubtext: {
        color: "rgba(255,255,255,0.5)",
        fontSize: "0.9rem",
    },
    loadingContainer: {
        textAlign: "center",
        padding: "60px 20px",
    },
    spinner: {
        width: "50px",
        height: "50px",
        border: "4px solid rgba(255,255,255,0.1)",
        borderTop: "4px solid #0ea5e9",
        borderRadius: "50%",
        margin: "0 auto 20px",
        animation: "spin 1s linear infinite",
    },
    loadingText: {
        color: "rgba(255,255,255,0.6)",
        fontSize: "1rem",
    },
    footer: {
        textAlign: "center",
        marginTop: "80px",
        padding: "30px 20px",
        color: "rgba(255,255,255,0.45)",
        fontSize: "0.9rem",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
        zIndex: 1,
    },
};

export default ParticipantIndexPage;
