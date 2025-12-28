import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ProfilePage() {
    const [user, setUser] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [particles, setParticles] = useState([]);
    const navigate = useNavigate();

    // ---------------- TOAST ----------------
    const showToast = (text, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, text, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3200);
    };

    // ---------------- PARTICLES ----------------
    useEffect(() => {
        const generated = [...Array(55)].map(() => ({
            id: crypto.randomUUID(),
            left: Math.random() * 100,
            top: Math.random() * 100,
            delay: -(Math.random() * 15).toFixed(2),
            duration: 16 + Math.random() * 10,
        }));
        setParticles(generated);
    }, []);

    // ---------------- LOAD USER ----------------
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");
        if (!storedUser || !token) {
            navigate("/");
            return;
        }
        setUser({
            ...storedUser,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
    }, [navigate]);

    // ---------------- HANDLERS ----------------
    const handleProfileSave = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/profile/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...user,
                    currentPassword: undefined,
                    newPassword: undefined,
                    confirmPassword: undefined,
                }),
            });
            if (res.ok) {
                const cleanUser = {
                    email: user.email,
                    name: user.name,
                    lastname: user.lastname,
                    username: user.username,
                    role: user.role,
                };
                localStorage.setItem("user", JSON.stringify(cleanUser));
                showToast("Profile updated successfully ✅", "success");
            } else {
                showToast("Profile update failed ❌", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Server error ❌", "error");
        }
    };

    const handlePasswordChange = async () => {
        if (user.newPassword !== user.confirmPassword) {
            showToast("Passwords do not match ❌", "error");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/profile/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: user.currentPassword,
                    newPassword: user.newPassword,
                }),
            });
            if (res.ok) {
                setUser({
                    ...user,
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
                showToast("Password updated successfully ✅", "success");
            } else {
                showToast("Password update failed ❌", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Server error ❌", "error");
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            "⚠️ Are you sure you want to delete your account? This action cannot be undone!"
        );
        if (!confirmed) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/profile/delete-account", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                showToast("Account deleted successfully ✅", "success");
                setTimeout(() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/");
                }, 1500);
            } else {
                showToast("Account deletion failed ❌", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Server error ❌", "error");
        }
    };

    if (!user) {
        return (
            <div style={styles.container}>
                <p style={{ color: "#fff", textAlign: "center", paddingTop: "40px" }}>
                    Loading profile...
                </p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* PARTICLES */}
            <div style={styles.particles}>
                {particles.map((p) => (
                    <div
                        key={p.id}
                        style={{
                            ...styles.particle,
                            left: `${p.left}%`,
                            top: `${p.top}vh`,
                            animationDelay: `${p.delay}s`,
                            animationDuration: `${p.duration}s`,
                        }}
                    />
                ))}
            </div>

            {/* NAVBAR */}
            <div style={styles.navbar}>
                <h2 style={styles.navTitle}>Profile</h2>
                <button
                    style={styles.backButton}
                    onClick={() => {
                        const stored = JSON.parse(localStorage.getItem("user"));
                        if (stored?.role === "RESEARCHER") navigate("/researcher");
                        else if (stored?.role === "PARTICIPANT") navigate("/participant");
                        else if (stored?.role === "REVIEWER") navigate("/reviewer");
                        else if (stored?.role === "ADMIN") navigate("/admin");
                        else navigate("/");
                    }}
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* TOASTS */}
            {toasts.map((t) => (
                <Toast key={t.id} text={t.text} type={t.type} />
            ))}

            {/* CENTER WRAPPER */}
            <div style={styles.centerWrapper}>
                <div style={styles.profileCard}>
                    {/* PROFILE INFO */}
                    <h2 style={styles.title}>Profile Information</h2>
                    <p style={styles.subtitle}>Update your personal details</p>

                    <div style={styles.section}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email</label>
                            <input
                                type="email"
                                value={user.email}
                                readOnly
                                style={{
                                    ...styles.input,
                                    opacity: 0.6,
                                    cursor: "not-allowed",
                                }}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Name</label>
                            <input
                                type="text"
                                value={user.name}
                                onChange={(e) =>
                                    setUser({ ...user, name: e.target.value })
                                }
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Last Name</label>
                            <input
                                type="text"
                                value={user.lastname}
                                onChange={(e) =>
                                    setUser({ ...user, lastname: e.target.value })
                                }
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Username</label>
                            <input
                                type="text"
                                value={user.username}
                                onChange={(e) =>
                                    setUser({ ...user, username: e.target.value })
                                }
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Role</label>
                            <input
                                type="text"
                                value={user.role}
                                readOnly
                                style={{
                                    ...styles.input,
                                    opacity: 0.6,
                                    cursor: "not-allowed",
                                }}
                            />
                        </div>

                        <button
                            onClick={handleProfileSave}
                            style={styles.buttonPrimary}
                        >
                            Save Changes
                        </button>
                    </div>

                    <div style={styles.divider} />

                    {/* PASSWORD CHANGE */}
                    <h2 style={styles.title}>Change Password</h2>
                    <p style={styles.subtitle}>Update your account password</p>

                    <div style={styles.section}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Current Password</label>
                            <input
                                type="password"
                                placeholder="Enter current password"
                                value={user.currentPassword || ""}
                                onChange={(e) =>
                                    setUser({ ...user, currentPassword: e.target.value })
                                }
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>New Password</label>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                value={user.newPassword || ""}
                                onChange={(e) =>
                                    setUser({ ...user, newPassword: e.target.value })
                                }
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Confirm New Password</label>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={user.confirmPassword || ""}
                                onChange={(e) =>
                                    setUser({
                                        ...user,
                                        confirmPassword: e.target.value,
                                    })
                                }
                                style={styles.input}
                            />
                        </div>

                        <button
                            onClick={handlePasswordChange}
                            style={styles.buttonSecondary}
                        >
                            Update Password
                        </button>
                    </div>

                    <div style={styles.divider} />

                    {/* DANGER ZONE */}
                    <div style={styles.dangerZone}>
                        <h2 style={styles.titleDanger}>Danger Zone</h2>
                        <p style={styles.subtitleDanger}>
                            Once you delete your account, there is no going back.
                        </p>
                        <button
                            onClick={handleDeleteAccount}
                            style={styles.buttonDanger}
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>

            {/* KEYFRAMES */}
            <style>
                {`
                    @keyframes floatParticle {
                        0% { transform: translateY(0); opacity: 0.4; }
                        50% { opacity: 1; }
                        100% { transform: translateY(-120vh); opacity: 0; }
                    }

                    @keyframes toastFadeInOut {
                        0% { opacity: 0; transform: translate(-50%, -10px); }
                        10% { opacity: 1; transform: translate(-50%, 0px); }
                        90% { opacity: 1; transform: translate(-50%, 0px); }
                        100% { opacity: 0; transform: translate(-50%, -10px); }
                    }
                `}
            </style>
        </div>
    );
}

function Toast({ text, type }) {
    return (
        <div
            style={{
                ...styles.toast,
                background:
                    type === "success"
                        ? "rgba(16,185,129,0.22)"
                        : "rgba(239,68,68,0.22)",
                borderColor: type === "success" ? "#22c55e" : "#f97373",
                color: type === "success" ? "#bbf7d0" : "#fee2e2",
            }}
        >
            {text}
        </div>
    );
}

/* -------------------- STYLES -------------------- */

const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #16213e)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
    },

    particles: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
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
        opacity: 0.45,
    },

    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "relative",
        zIndex: 10,
    },

    navTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#60a5fa",
    },

    backButton: {
        background: "rgba(239,68,68,0.1)",
        border: "2px solid rgba(239,68,68,0.5)",
        color: "#f87171",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        transition: "0.35s",
    },

    centerWrapper: {
        width: "90%",
        maxWidth: "850px",
        margin: "0 auto",
        paddingTop: "25px",
        paddingBottom: "40px",
        position: "relative",
        zIndex: 2,
    },

    profileCard: {
        background: "rgba(255,255,255,0.05)",
        borderRadius: "18px",
        padding: "28px 30px",
        border: "1px solid rgba(148,163,184,0.35)",
        boxShadow: "0 0 18px rgba(37,99,235,0.45)",
        backdropFilter: "blur(18px)",
    },

    title: {
        fontSize: "1.6rem",
        fontWeight: "700",
        background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "4px",
    },

    subtitle: {
        color: "rgba(255,255,255,0.7)",
        marginBottom: "16px",
        fontSize: "0.95rem",
    },

    section: {
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },

    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },

    label: {
        color: "#a5b4fc",
        fontWeight: "500",
        fontSize: "0.9rem",
    },

    input: {
        padding: "11px 12px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(15,23,42,0.6)",
        color: "white",
        fontSize: "0.98rem",
        outline: "none",
    },

    buttonPrimary: {
        marginTop: "10px",
        background: "linear-gradient(135deg, #10b981, #22c55e)",
        color: "white",
        border: "none",
        borderRadius: "10px",
        padding: "10px 16px",
        fontWeight: "600",
        fontSize: "0.95rem",
        cursor: "pointer",
        transition: "0.3s",
        boxShadow: "0 0 10px rgba(16,185,129,0.4)",
    },

    buttonSecondary: {
        marginTop: "10px",
        background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
        color: "white",
        border: "none",
        borderRadius: "10px",
        padding: "10px 16px",
        fontWeight: "600",
        fontSize: "0.95rem",
        cursor: "pointer",
        transition: "0.3s",
        boxShadow: "0 0 10px rgba(14,165,233,0.4)",
    },

    buttonDanger: {
        marginTop: "8px",
        background: "linear-gradient(135deg, #ef4444, #f97373)",
        color: "white",
        border: "none",
        borderRadius: "10px",
        padding: "10px 16px",
        fontWeight: "600",
        fontSize: "0.95rem",
        cursor: "pointer",
        transition: "0.3s",
        boxShadow: "0 0 10px rgba(248,113,113,0.5)",
        width: "100%",
    },

    divider: {
        height: "1px",
        background: "rgba(148,163,184,0.5)",
        margin: "26px 0",
    },

    dangerZone: {
        borderRadius: "14px",
        padding: "18px 18px 14px",
        border: "1px solid rgba(239,68,68,0.4)",
        background: "rgba(127,29,29,0.35)",
    },

    titleDanger: {
        color: "#fecaca",
        fontWeight: "700",
        fontSize: "1.25rem",
        marginBottom: "4px",
    },

    subtitleDanger: {
        color: "rgba(255,241,242,0.85)",
        marginBottom: "10px",
        fontSize: "0.9rem",
    },

    toast: {
        position: "fixed",
        top: "90px",
        left: "50%",
        transform: "translateX(-50%)",
        borderRadius: "12px",
        padding: "12px 20px",
        border: "1.5px solid",
        fontWeight: "600",
        fontSize: "0.95rem",
        backdropFilter: "blur(6px)",
        boxShadow: "0 0 12px rgba(15,23,42,0.7)",
        zIndex: 9999,
        animation: "toastFadeInOut 3.2s ease forwards",
        letterSpacing: "0.3px",
    },
};

export default ProfilePage;
