import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [toasts, setToasts] = useState([]);
    const [disabled, setDisabled] = useState(false);
    const [timer, setTimer] = useState(0);
    const navigate = useNavigate();

    const showToast = (text, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, text, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        if (!email) {
            showToast("Please enter your email address ❌", "error");
            return;
        }

        try {
            setDisabled(true);
            showToast("Request Sending...", "info");

            const res = await fetch("http://localhost:8080/api/password/forgot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                showToast("Password Reset Mail Sent ✅", "success");

                let countdown = 30;
                setTimer(countdown);
                const interval = setInterval(() => {
                    countdown--;
                    setTimer(countdown);
                    if (countdown <= 0) {
                        clearInterval(interval);
                        setDisabled(false);
                        setTimer(0);
                    }
                }, 1000);
            } else {
                showToast("Mail Not Sent ❌", "error");
                setDisabled(false);
            }
        } catch (err) {
            console.error(err);
            showToast("Couldn't Connect to Server ❌", "error");
            setDisabled(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.toastContainer}>
                {toasts.map((t) => (
                    <Toast key={t.id} text={t.text} type={t.type} />
                ))}
            </div>

            <div style={styles.card}>
                <h2 style={styles.title}>Forgot Password</h2>

                <form onSubmit={handleForgot} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>E-mail Address</label>
                        <input
                            type="email"
                            placeholder="Enter Your Mail Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            ...styles.button,
                            background: disabled
                                ? "linear-gradient(135deg, #a1a1a1, #c7c7c7)"
                                : "linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #06b6d4 100%)",
                            cursor: disabled ? "not-allowed" : "pointer",
                        }}
                        disabled={disabled}
                    >
                        {disabled ? `Try Again (${timer})` : "Send Mail"}
                    </button>
                </form>

                <div style={styles.footer}>
                    <span style={styles.link} onClick={() => navigate("/")}>
                        Return Login
                    </span>
                </div>
            </div>
        </div>
    );
}

function Toast({ text, type }) {
    return (
        <div style={{
            marginBottom: "10px",
            padding: "12px 20px",
            borderRadius: "14px",
            backgroundColor: type === "success" ? "rgba(16,185,129,0.2)" : type === "error" ? "rgba(239,68,68,0.2)" : "rgba(251,191,36,0.2)",
            color: type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#fbbf24",
            fontWeight: "600",
            backdropFilter: "blur(10px)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
            animation: "fadein 0.3s, fadeout 0.3s 2.7s",
        }}>
            {text}
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        overflowX: "hidden",
        overflowY: "auto",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        position: "relative",
        fontFamily: "'Inter', sans-serif",
    },
    card: {
        position: "relative",
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderRadius: "28px",
        padding: "50px 55px",
        width: "100%",
        maxWidth: "420px",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.37), inset 0 1px 0 rgba(255,255,255,0.1)",
        textAlign: "center",
        color: "#fff",
        zIndex: 10,
        margin: "20px auto",
    },
    title: {
        margin: "0 0 20px 0",
        fontSize: "2rem",
        fontWeight: "700",
        background: "linear-gradient(135deg, #ffffff 0%, #60a5fa 50%, #0ea5e9 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        textAlign: "center",
    },
    form: { display: "flex", flexDirection: "column", gap: "20px" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "8px", textAlign: "left" },
    label: { fontSize: "0.95rem", fontWeight: "600", color: "#fff" },
    input: {
        padding: "14px 18px",
        borderRadius: "14px",
        border: "2px solid rgba(255,255,255,0.2)",
        fontSize: "0.95rem",
        outline: "none",
        background: "rgba(255,255,255,0.05)",
        color: "#fff",
        transition: "all 0.3s ease",
    },
    button: {
        marginTop: "15px",
        padding: "16px",
        borderRadius: "14px",
        border: "none",
        color: "#fff",
        fontSize: "1.05rem",
        fontWeight: "600",
        cursor: "pointer",
        boxShadow: "0 10px 30px rgba(14,165,233,0.4),0 0 20px rgba(6,182,212,0.3)",
        transition: "all 0.3s ease",
    },
    footer: { marginTop: "25px", textAlign: "center" },
    link: { color: "#60a5fa", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" },
    toastContainer: { position: "fixed", top: "20px", right: "20px", zIndex: 9999 },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
@keyframes fadein {
  from { opacity: 0; transform: translateY(-10px);}
  to { opacity: 1; transform: translateY(0);}
}
@keyframes fadeout {
  from { opacity: 1; transform: translateY(0);}
  to { opacity: 0; transform: translateY(-10px);}
}
input:focus {
  border-color: #3b82f6;
  background: rgba(255,255,255,0.15);
  transform: translateY(-1px);
}
button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(14,165,233,0.5);
}
button:active { transform: translateY(0); }
`;
document.head.appendChild(styleSheet);

export default ForgotPassword;