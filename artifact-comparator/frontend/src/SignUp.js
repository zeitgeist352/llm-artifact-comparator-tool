import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [lastname, setLastname] = useState("");
    const [role, setRole] = useState("participant");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.overflowX = "hidden";
        document.body.style.overflowY = "auto";
        document.documentElement.style.height = "100%";
        document.body.style.minHeight = "100vh";

        // Add keyframe animations
        const styleSheet = document.createElement("style");
        styleSheet.textContent = `
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }
            @keyframes pulse {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 0.8; }
            }
            input:focus {
                border-color: rgba(59, 130, 246, 0.8) !important;
                box-shadow: 0 0 20px rgba(59, 130, 246, 0.4) !important;
                background: rgba(255, 255, 255, 0.08) !important;
            }
            input::placeholder {
                color: rgba(255, 255, 255, 0.4);
            }
            button:hover {
                transform: translateY(-2px) !important;
                box-shadow: 0 15px 40px rgba(14, 165, 233, 0.5), 0 0 30px rgba(6, 182, 212, 0.4) !important;
            }
            .link-hover:hover {
                color: #93c5fd !important;
                text-shadow: 0 0 15px rgba(147, 197, 253, 0.8) !important;
            }
        `;
        document.head.appendChild(styleSheet);

        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    const handleSignup = async (e) => {
        e.preventDefault();

        const registerData = { username, name, lastname, email, password, role };

        try {
            const res = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registerData),
            });

            if (res.ok) {
                setMessage({ text: "Registration successful ✅ Redirecting to login page...", type: "success" });
                setTimeout(() => navigate("/"), 1500);
            } else {
                const errorText = await res.text();
                setMessage({ text: `Registration failed ❌ (${errorText})`, type: "error" });
            }
        } catch (err) {
            console.error(err);
            setMessage({ text: "Could not connect to the server ❌", type: "error" });
        }
    };

    return (
        <div style={styles.container}>
            {/* Animated background elements */}
            <div style={styles.bgCircle1}></div>
            <div style={styles.bgCircle2}></div>
            <div style={styles.bgCircle3}></div>

            <div style={styles.card}>
                <div style={styles.headerGlow}></div>
                <h2 style={styles.title}>Create Account</h2>
                <p style={styles.subtitle}>Join us and start your journey</p>

                <form onSubmit={handleSignup} style={styles.form}>
                    <div style={styles.grid}>
                        <div style={styles.column}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>First Name</label>
                                <div style={styles.inputWrapper}>
                                    <input
                                        type="text"
                                        placeholder="Enter your first name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Last Name</label>
                                <div style={styles.inputWrapper}>
                                    <input
                                        type="text"
                                        placeholder="Enter your last name"
                                        value={lastname}
                                        onChange={(e) => setLastname(e.target.value)}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Role</label>
                                <div style={styles.roleContainer}>
                                    {["reviewer", "researcher", "participant"].map((r) => (
                                        <label
                                            key={r}
                                            style={{
                                                ...styles.roleLabel,
                                                ...(role === r ? styles.roleLabelChecked : {}),
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                value={r}
                                                checked={role === r}
                                                onChange={(e) => setRole(e.target.value)}
                                                style={styles.radio}
                                            />
                                            <div style={role === r ? styles.roleIndicatorActive : styles.roleIndicator}></div>
                                            <span
                                                style={{
                                                    ...styles.roleText,
                                                    ...(role === r ? styles.roleTextChecked : {}),
                                                }}
                                            >
                                                {r.charAt(0).toUpperCase() + r.slice(1)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={styles.column}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Username</label>
                                <div style={styles.inputWrapper}>
                                    <input
                                        type="text"
                                        placeholder="Enter a username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Email</label>
                                <div style={styles.inputWrapper}>
                                    <input
                                        type="email"
                                        placeholder="sample@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Password</label>
                                <div style={styles.inputWrapper}>
                                    <input
                                        type="password"
                                        placeholder="Enter a strong password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" style={styles.button}>
                        <span style={styles.buttonText}>Register</span>
                    </button>
                </form>

                {message && (
                    <div style={{
                        ...styles.message,
                        backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: message.type === "success" ? "#10b981" : "#ef4444",
                        border: `2px solid ${message.type === "success" ? "#10b981" : "#ef4444"}`,
                        backdropFilter: "blur(10px)"
                    }}>
                        {message.text}
                    </div>
                )}

                <div style={styles.footer}>
                    <span style={styles.footerText}>Already have an account?</span>
                    <span className="link-hover" style={styles.link} onClick={() => navigate("/")}>Login</span>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        position: "relative",
        minHeight: "100vh",
        width: "100vw",
        margin: 0,
        padding: "40px 20px",
        overflowX: "hidden",
        overflowY: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    bgCircle1: {
        position: "absolute",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, transparent 70%)",
        top: "-150px",
        right: "-150px",
        filter: "blur(80px)",
        animation: "float 8s ease-in-out infinite",
    },
    bgCircle2: {
        position: "absolute",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, transparent 70%)",
        bottom: "-100px",
        left: "-100px",
        filter: "blur(80px)",
        animation: "float 10s ease-in-out infinite reverse",
    },
    bgCircle3: {
        position: "absolute",
        width: "350px",
        height: "350px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, transparent 70%)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        filter: "blur(90px)",
        animation: "pulse 6s ease-in-out infinite",
    },
    card: {
        position: "relative",
        background: "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        padding: "50px 55px",
        borderRadius: "28px",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
        width: "100%",
        maxWidth: "900px",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        textAlign: "center",
        zIndex: 10,
        margin: "20px auto",
    },
    headerGlow: {
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "60%",
        height: "100px",
        background: "radial-gradient(ellipse, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
        filter: "blur(40px)",
        zIndex: -1,
    },
    title: {
        margin: "0 0 8px 0",
        fontSize: "2.6rem",
        fontWeight: "800",
        background: "linear-gradient(135deg, #ffffff 0%, #60a5fa 50%, #0ea5e9 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        letterSpacing: "-1px",
        textShadow: "0 0 40px rgba(59, 130, 246, 0.5)",
    },
    subtitle: {
        margin: "0 0 35px 0",
        fontSize: "1rem",
        color: "rgba(255, 255, 255, 0.7)",
        fontWeight: "400",
    },
    form: { display: "flex", flexDirection: "column" },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "28px" },
    column: { display: "flex", flexDirection: "column", gap: "22px" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "10px" },
    label: {
        fontSize: "0.95rem",
        fontWeight: "600",
        color: "rgba(255, 255, 255, 0.95)",
        textAlign: "left",
        letterSpacing: "0.3px"
    },
    inputWrapper: {
        position: "relative",
    },
    input: {
        width: "100%",
        padding: "14px 18px",
        borderRadius: "14px",
        border: "2px solid rgba(255, 255, 255, 0.2)",
        fontSize: "0.98rem",
        transition: "all 0.3s ease",
        outline: "none",
        background: "rgba(255, 255, 255, 0.05)",
        color: "#ffffff",
        fontWeight: "500",
        boxSizing: "border-box",
    },
    roleContainer: { display: "flex", flexDirection: "column", gap: "10px" },
    roleLabel: {
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        padding: "16px 18px",
        borderRadius: "14px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        background: "rgba(255, 255, 255, 0.05)",
        border: "2px solid rgba(255, 255, 255, 0.2)",
        position: "relative",
        overflow: "hidden",
    },
    roleLabelChecked: {
        background: "linear-gradient(135deg, rgba(14, 165, 233, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)",
        borderColor: "rgba(59, 130, 246, 0.8)",
        boxShadow: "0 0 25px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        transform: "translateY(-2px)",
    },
    radio: { display: "none" },
    roleIndicator: {
        width: "18px",
        height: "18px",
        borderRadius: "50%",
        border: "2px solid rgba(255, 255, 255, 0.4)",
        marginRight: "12px",
        transition: "all 0.3s ease",
        flexShrink: 0,
    },
    roleIndicatorActive: {
        width: "18px",
        height: "18px",
        borderRadius: "50%",
        border: "2px solid #3b82f6",
        marginRight: "12px",
        background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
        boxShadow: "0 0 15px rgba(59, 130, 246, 0.8)",
        flexShrink: 0,
    },
    roleText: {
        fontSize: "0.98rem",
        color: "rgba(255, 255, 255, 0.7)",
        fontWeight: "500",
    },
    roleTextChecked: {
        color: "#ffffff",
        fontWeight: "700",
        textShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
    },
    button: {
        position: "relative",
        marginTop: "15px",
        padding: "16px",
        borderRadius: "14px",
        border: "none",
        background: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #06b6d4 100%)",
        color: "white",
        fontSize: "1.1rem",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 10px 30px rgba(14, 165, 233, 0.4), 0 0 20px rgba(6, 182, 212, 0.3)",
        letterSpacing: "0.5px",
        overflow: "hidden",
    },
    buttonText: {
        position: "relative",
        zIndex: 2,
    },
    message: {
        marginTop: "22px",
        padding: "16px 20px",
        borderRadius: "14px",
        fontSize: "0.95rem",
        textAlign: "center",
        fontWeight: "600",
        letterSpacing: "0.3px",
    },
    footer: {
        marginTop: "30px",
        textAlign: "center",
        paddingTop: "25px",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    },
    footerText: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: "0.95rem",
        marginRight: "8px",
        fontWeight: "400",
    },
    link: {
        color: "#60a5fa",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "0.95rem",
        textDecoration: "none",
        textShadow: "0 0 10px rgba(96, 165, 250, 0.5)",
        transition: "all 0.3s ease",
    },
};

export default Signup;