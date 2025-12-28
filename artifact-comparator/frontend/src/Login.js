import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.overflow = "auto";
        document.documentElement.style.height = "100%";
        document.body.style.minHeight = "100vh";

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
            .eye-icon:hover {
                opacity: 1 !important;
                transform: translateY(-50%) scale(1.1) !important;
            }
        `;
        document.head.appendChild(styleSheet);

        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (res.ok) {
                const data = await res.json();
                console.log("Backend response:", data);

                // 🔹 Garantili yazma
                await Promise.resolve().then(() => {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));
                });

                setMessage({ text: "Login successful ✅", type: "success" });

                const role = data.user.role?.toUpperCase();
                console.log("User role:", role);

                // 🔹 Garantili yönlendirme
                setTimeout(() => {
                    if (role === "PARTICIPANT") {
                        window.location.href = "/participant";
                    } else if (role === "RESEARCHER") {
                        window.location.href = "/researcher";
                    } else if (role === "ADMIN") {
                        window.location.href = "/admin";
                    } else if (role === "REVIEWER") {
                        window.location.href = "/reviewer";
                    } else {
                        window.location.href = "/index";
                    }
                }, 500);
            } else {
                setMessage({ text: "Invalid username or password ❌", type: "error" });
            }
        } catch (err) {
            console.error(err);
            setMessage({ text: "Could not connect to the server ❌", type: "error" });
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.bgCircle1}></div>
            <div style={styles.bgCircle2}></div>
            <div style={styles.bgCircle3}></div>

            <div style={styles.card}>
                <div style={styles.headerGlow}></div>
                <h2 style={styles.title}>Welcome Back</h2>
                <p style={styles.subtitle}>Login to continue your journey</p>

                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Username</label>
                        <div style={styles.inputWrapper}>
                            <input
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={styles.input}
                                required
                            />
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <div style={styles.passwordContainer}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={styles.input}
                                required
                            />
                            {password.length > 0 && (
                                <span
                                    className="eye-icon"
                                    style={styles.eye}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? "👁️" : "🙈"}
                                </span>
                            )}
                        </div>
                    </div>

                    <button type="submit" style={styles.button}>
                        <span style={styles.buttonText}>Login</span>
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
                    <span className="link-hover" style={styles.link} onClick={() => navigate("/forgot")}>Forgot Password?</span>
                    <div style={styles.registerSection}>
                        <span style={styles.footerText}>New user? </span>
                        <span className="link-hover" style={styles.link} onClick={() => navigate("/api/auth/register")}>Register</span>
                    </div>
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
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        boxSizing: "border-box",
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
        maxWidth: "500px",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        textAlign: "center",
        zIndex: 10,
        margin: "20px auto",
        boxSizing: "border-box",
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
        fontSize: "2.4rem",
        fontWeight: "800",
        background: "linear-gradient(135deg, #ffffff 0%, #60a5fa 50%, #0ea5e9 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: "-1px",
        textShadow: "0 0 40px rgba(59, 130, 246, 0.5)",
    },
    subtitle: {
        margin: "0 0 35px 0",
        fontSize: "1rem",
        color: "rgba(255,255,255,0.7)",
    },
    form: { display: "flex", flexDirection: "column", gap: "22px", marginBottom: "20px" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" },
    label: { fontSize: "0.95rem", fontWeight: "600", color: "rgba(255,255,255,0.95)" },
    inputWrapper: { position: "relative", width: "100%" },
    passwordContainer: { position: "relative", width: "100%" },
    input: {
        width: "100%",
        padding: "14px 18px",
        borderRadius: "14px",
        border: "2px solid rgba(255,255,255,0.2)",
        fontSize: "0.98rem",
        transition: "all 0.3s ease",
        outline: "none",
        background: "rgba(255,255,255,0.05)",
        color: "#ffffff",
        fontWeight: "500",
        boxSizing: "border-box",
    },
    eye: {
        position: "absolute",
        right: "18px",
        top: "50%",
        transform: "translateY(-50%)",
        cursor: "pointer",
        fontSize: "1.3rem",
        opacity: 0.7,
        transition: "all 0.2s ease",
    },
    button: {
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
        boxShadow: "0 10px 30px rgba(14, 165, 233, 0.4)",
        width: "100%",
    },
    buttonText: { position: "relative", zIndex: 2 },
    message: {
        marginTop: "22px",
        padding: "16px 20px",
        borderRadius: "14px",
        fontSize: "0.95rem",
        textAlign: "center",
        fontWeight: "600",
    },
    footer: {
        marginTop: "30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "25px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
    },
    registerSection: { display: "flex", alignItems: "center", gap: "4px" },
    footerText: { color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" },
    link: {
        color: "#60a5fa",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "0.9rem",
        textDecoration: "none",
        textShadow: "0 0 10px rgba(96,165,250,0.5)",
    },
};

export default Login;
