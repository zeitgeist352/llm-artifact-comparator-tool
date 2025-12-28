import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [toasts, setToasts] = useState([]);
    const [disabled, setDisabled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.overflowY = "auto";
        document.body.style.overflowX = "hidden";
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
            @keyframes fadein {
                from { opacity: 0; transform: translateY(-10px);}
                to { opacity: 1; transform: translateY(0);}
            }
            @keyframes fadeout {
                from { opacity: 1; transform: translateY(0);}
                to { opacity: 0; transform: translateY(-10px);}
            }
            input:focus {
                border-color: rgba(59, 130, 246, 0.8) !important;
                box-shadow: 0 0 20px rgba(59, 130, 246, 0.4) !important;
                background: rgba(255, 255, 255, 0.08) !important;
            }
            input::placeholder {
                color: rgba(255, 255, 255, 0.4);
            }
            button:hover:not(:disabled) {
                transform: translateY(-2px) !important;
                box-shadow: 0 15px 40px rgba(14, 165, 233, 0.5), 0 0 30px rgba(6, 182, 212, 0.4) !important;
            }
            button:active:not(:disabled) {
                transform: translateY(0) !important;
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

    const showToast = (text, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, text, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    };

    const handleReset = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            showToast("❌ Passwords do not match", "error");
            return;
        }

        try {
            setDisabled(true);
            showToast("Updating password...", "info");

            const res = await fetch("http://localhost:8080/api/password/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            if (res.ok) {
                showToast("✅ Password successfully updated! Redirecting...", "success");
                setTimeout(() => navigate("/"), 2500);
            } else {
                const text = await res.text();
                showToast(
                    text.includes("Password must be")
                        ? `⚠️ ${text} Please choose a stronger password.`
                        : "❌ Password reset failed.",
                    "error"
                );
            }
        } catch (err) {
            console.error(err);
            showToast("❌ Could not connect to the server.", "error");
        } finally {
            setDisabled(false);
        }
    };

    if (!token) {
        return (
            <div style={styles.container}>
                <div style={styles.bgCircle1}></div>
                <div style={styles.bgCircle2}></div>
                <div style={styles.bgCircle3}></div>

                <div style={styles.card}>
                    <div style={styles.headerGlow}></div>
                    <h2 style={styles.title}>Invalid or Expired Link</h2>
                    <p style={{ color: "#ef4444", fontSize: "1rem", marginTop: "15px" }}>
                        The password reset link is invalid or has expired.
                    </p>
                    <div style={styles.footer}>
                        <span className="link-hover" style={styles.link} onClick={() => navigate("/")}>
                            ⬅️ Return to Login
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.bgCircle1}></div>
            <div style={styles.bgCircle2}></div>
            <div style={styles.bgCircle3}></div>

            <div style={styles.toastContainer}>
                {toasts.map((t) => (
                    <Toast key={t.id} text={t.text} type={t.type} />
                ))}
            </div>

            <div style={styles.card}>
                <div style={styles.headerGlow}></div>
                <h2 style={styles.title}>Reset Your Password</h2>
                <p style={styles.subtitle}>Enter your new password below</p>

                <form onSubmit={handleReset} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>New Password</label>
                        <div style={styles.inputWrapper}>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={styles.input}
                                required
                            />
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Confirm Password</label>
                        <div style={styles.inputWrapper}>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={styles.input}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            ...styles.button,
                            background: disabled
                                ? "linear-gradient(135deg, #6b7280, #9ca3af)"
                                : "linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #06b6d4 100%)",
                            cursor: disabled ? "not-allowed" : "pointer",
                            opacity: disabled ? 0.6 : 1,
                        }}
                        disabled={disabled}
                    >
                        <span style={styles.buttonText}>
                            {disabled ? "Saving..." : "Reset Password"}
                        </span>
                    </button>
                </form>

                <div style={styles.footer}>
                    <span className="link-hover" style={styles.link} onClick={() => navigate("/")}>
                        ⬅️ Return to Login
                    </span>
                </div>
            </div>
        </div>
    );
}

function Toast({ text, type }) {
    return (
        <div
            style={{
                marginBottom: "10px",
                padding: "16px 20px",
                borderRadius: "14px",
                backgroundColor:
                    type === "success"
                        ? "rgba(16, 185, 129, 0.15)"
                        : type === "error"
                            ? "rgba(239, 68, 68, 0.15)"
                            : "rgba(251, 191, 36, 0.15)",
                color:
                    type === "success"
                        ? "#10b981"
                        : type === "error"
                            ? "#ef4444"
                            : "#fbbf24",
                fontWeight: "600",
                fontSize: "0.95rem",
                backdropFilter: "blur(10px)",
                border: `2px solid ${
                    type === "success"
                        ? "#10b981"
                        : type === "error"
                            ? "#ef4444"
                            : "#fbbf24"
                }`,
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
                animation: "fadein 0.3s, fadeout 0.3s 2.7s",
                letterSpacing: "0.3px",
            }}
        >
            {text}
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
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "22px",
        marginBottom: "20px",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        textAlign: "left",
    },
    label: {
        fontSize: "0.95rem",
        fontWeight: "600",
        color: "rgba(255, 255, 255, 0.95)",
        letterSpacing: "0.3px",
    },
    inputWrapper: {
        position: "relative",
        width: "100%",
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
    button: {
        position: "relative",
        marginTop: "15px",
        padding: "16px",
        borderRadius: "14px",
        border: "none",
        color: "white",
        fontSize: "1.1rem",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 10px 30px rgba(14, 165, 233, 0.4), 0 0 20px rgba(6, 182, 212, 0.3)",
        letterSpacing: "0.5px",
        overflow: "hidden",
        width: "100%",
    },
    buttonText: {
        position: "relative",
        zIndex: 2,
    },
    footer: {
        marginTop: "30px",
        textAlign: "center",
        paddingTop: "25px",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    },
    link: {
        color: "#60a5fa",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "0.9rem",
        textDecoration: "none",
        textShadow: "0 0 10px rgba(96, 165, 250, 0.5)",
        transition: "all 0.3s ease",
    },
    toastContainer: {
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
    },
};

export default ResetPassword;