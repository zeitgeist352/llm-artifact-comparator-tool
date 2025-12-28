import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function IndexPage() {
    const [time, setTime] = useState(new Date());
    const [username, setUsername] = useState("");
    const [userFiles, setUserFiles] = useState([]); // ✅ yeni satır

    const [fileContent, setFileContent] = useState("");

    //input as file
    // 📤 Txt file upload
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (file && file.type === "text/plain") {
            console.log("📄 File selected:", file.name);

            const formData = new FormData();
            formData.append("file", file);

            // FormData kontrolü
            for (let [key, value] of formData.entries()) {
                console.log(`🧾 FormData -> ${key}:`, value);
            }

            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:8080/uploadTxt", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`, // 🔥 JWT buradan gidiyor
                        // ❗ FormData kullanırken Content-Type belirtme, fetch otomatik ekler
                    },
                    body: formData,
                });

                console.log("🟦 Response status:", res.status);
                const textRes = await res.text();
                console.log("📜 Raw response:", textRes);

                if (!res.ok) throw new Error("Upload failed");
                console.log("✅ Upload successful");
                fetchUserFiles(); // ✅ upload sonrası dosya listesini yenile
            } catch (err) {
                console.error("❌ Upload error:", err);
                alert("Upload failed. Check console for details.");
            }
        } else {
            alert("Please upload a .txt file");
        }
    };

    const navigate = useNavigate();

    // ⏰ Saat ve tarih güncellemesi
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 🔹 Kullanıcı bilgilerini localStorage'dan çek
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser && storedUser.username) {
            setUsername(storedUser.username);
        } else {
            // Eğer login yapılmamışsa otomatik olarak login sayfasına yönlendir
            navigate("/");
        }
    }, [navigate]);

    // 🔹 Logout işlemi (localStorage temizle)
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const handleProfile = () => {
        navigate("/profile");
    };

    const handleUpdate = async (fileId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/updateFile/${fileId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error("Failed to update file");
            alert("✅ File updated successfully");
            fetchUserFiles(); // tabloyu yenile
        } catch (err) {
            console.error("❌ Update error:", err);
            alert("Update failed. Check console for details.");
        }
    };

    const fetchUserFiles = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/myFiles", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch files");
            const data = await res.json();
            console.log("📂 User files:", data);
            setUserFiles(data);
        } catch (err) {
            console.error("❌ Error fetching files:", err);
        }
    };

    const formattedTime = time.toLocaleTimeString("en-EN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    const formattedDate = time.toLocaleDateString("en-EN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    useEffect(() => {
        fetchUserFiles();
    }, [])

    useEffect(() => {
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.overflowY = "auto";
        document.body.style.overflowX = "hidden";

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
            .nav-button:hover {
                transform: translateY(-2px) !important;
                box-shadow: 0 8px 20px rgba(14, 165, 233, 0.4) !important;
            }
            .logout-button:hover {
                transform: translateY(-2px) !important;
                box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4) !important;
            }
        `;
        document.head.appendChild(styleSheet);

        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    return (
        <div style={styles.container}>
            {/* Animated background elements */}
            <div style={styles.bgCircle1}></div>
            <div style={styles.bgCircle2}></div>
            <div style={styles.bgCircle3}></div>

            {/* Top Navigation Bar */}
            <div style={styles.navbar}>
                <div style={styles.navLeft}>
                    <span style={styles.welcomeText}>Welcome, {username}!</span>
                </div>
                <div style={styles.navRight}>
                    <button
                        className="nav-button"
                        style={styles.profileButton}
                        onClick={handleProfile}
                    >
                        Profile
                    </button>
                    <button
                        className="logout-button"
                        style={styles.logoutButton}
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={styles.mainContent}>
                <div style={styles.contentCard}>
                    <div style={styles.headerGlow}></div>

                    {/* Clock Section */}
                    <div style={styles.clockSection}>
                        <h2 style={styles.time}>{formattedTime}</h2>
                        <p style={styles.date}>{formattedDate}</p>
                    </div>

                    {/* Center Content Placeholder */}
                    <div style={styles.centerContent}>
                        <div
                            style={{
                                ...styles.placeholderBox,
                                flexDirection: "column",
                                gap: "20px",
                            }}
                        >
                            <h3 style={{ color: "#60a5fa", margin: 0 }}>Upload a .txt file</h3>

                            {/* Dosya seçme input’u */}
                            <input
                                type="file"
                                accept=".txt"
                                onChange={(e) => handleFileUpload(e)}
                                style={styles.fileInput}
                            />

                            {/* Dosya içeriğini göster */}
                            {fileContent && (
                                <div style={styles.filePreview}>
                                    <h4 style={{ color: "#93c5fd" }}>File Content:</h4>
                                    <pre style={styles.fileText}>{fileContent}</pre>
                                </div>
                            )}
                            {/* 🔹 Kullanıcının yüklediği dosyalar */}
                            {userFiles.length > 0 && (
                                <div style={styles.filesList}>
                                    <h4 style={{ color: "#60a5fa" }}>Your Uploaded Files</h4>
                                    <table style={styles.table}>
                                        <thead>
                                        <tr>
                                            <th style={styles.th}>File Name</th>
                                            <th style={styles.th}>Upload Date</th>
                                            <th style={styles.th}>Path</th>
                                            <th style={styles.th}>Update File</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {userFiles.map((file, index) => (
                                            <tr key={index}>
                                                <td style={styles.td}>{file.filename}</td>
                                                <td style={styles.td}>
                                                    {new Date(file.uploadDate).toLocaleString()}
                                                </td>
                                                <td style={styles.td}>{file.filepath}</td>
                                                <td>
                                                    <button
                                                        className="update-button"
                                                        style={styles.updateButton}
                                                        onClick={() => handleUpdate(file.id)}
                                                    >
                                                        Update
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer style={styles.footer}>
                <p style={styles.footerText}>© {new Date().getFullYear()} Artifact Comparator</p>
            </footer>
        </div>
    );
}

const styles = {
    container: {
        position: "relative",
        minHeight: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        boxSizing: "border-box",
    },
    bgCircle1: {
        position: "fixed",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, transparent 70%)",
        top: "-150px",
        right: "-150px",
        filter: "blur(80px)",
        animation: "float 8s ease-in-out infinite",
        pointerEvents: "none",
    },
    bgCircle2: {
        position: "fixed",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, transparent 70%)",
        bottom: "-100px",
        left: "-100px",
        filter: "blur(80px)",
        animation: "float 10s ease-in-out infinite reverse",
        pointerEvents: "none",
    },
    bgCircle3: {
        position: "fixed",
        width: "350px",
        height: "350px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, transparent 70%)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        filter: "blur(90px)",
        animation: "pulse 6s ease-in-out infinite",
        pointerEvents: "none",
    },
    navbar: {
        position: "relative",
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    },
    navLeft: {
        display: "flex",
        alignItems: "center",
    },
    welcomeText: {
        fontSize: "1.2rem",
        fontWeight: "700",
        background: "linear-gradient(135deg, #ffffff 0%, #60a5fa 50%, #0ea5e9 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        letterSpacing: "0.5px",
    },
    navRight: {
        display: "flex",
        gap: "15px",
        alignItems: "center",
    },
    profileButton: {
        padding: "10px 24px",
        borderRadius: "12px",
        border: "2px solid rgba(59, 130, 246, 0.5)",
        background: "rgba(14, 165, 233, 0.1)",
        color: "#60a5fa",
        fontSize: "0.95rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease",
        backdropFilter: "blur(10px)",
    },
    logoutButton: {
        padding: "10px 24px",
        borderRadius: "12px",
        border: "2px solid rgba(239, 68, 68, 0.5)",
        background: "rgba(239, 68, 68, 0.1)",
        color: "#ef4444",
        fontSize: "0.95rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease",
        backdropFilter: "blur(10px)",
    },
    updateButton: {
        padding: "10px 24px",
        borderRadius: "12px",
        border: "2px solid rgba(34, 197, 94, 0.5)", // yeşil ton
        background: "rgba(34, 197, 94, 0.1)",       // açık yeşil arka plan
        color: "#22c55e",                            // metin rengi (yeşil)
        fontSize: "0.95rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease",
        backdropFilter: "blur(10px)",
    },
    mainContent: {
        position: "relative",
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px",
        zIndex: 10,
    },
    contentCard: {
        position: "relative",
        background: "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        padding: "50px",
        borderRadius: "28px",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
        width: "100%",
        maxWidth: "1000px",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        textAlign: "center",
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
    clockSection: {
        marginBottom: "40px",
        paddingBottom: "30px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    },
    time: {
        fontSize: "3rem",
        fontWeight: "800",
        margin: "0 0 10px 0",
        background: "linear-gradient(135deg, #ffffff 0%, #60a5fa 50%, #0ea5e9 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        letterSpacing: "2px",
        textShadow: "0 0 40px rgba(59, 130, 246, 0.5)",
    },
    date: {
        fontSize: "1.1rem",
        color: "rgba(255, 255, 255, 0.7)",
        margin: 0,
        fontWeight: "400",
    },
    centerContent: {
        padding: "40px 0",
    },
    placeholderBox: {
        padding: "80px 40px",
        borderRadius: "20px",
        border: "2px dashed rgba(255, 255, 255, 0.2)",
        background: "rgba(255, 255, 255, 0.03)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    placeholderText: {
        fontSize: "1.2rem",
        color: "rgba(255, 255, 255, 0.5)",
        fontWeight: "500",
        letterSpacing: "0.5px",
    },
    footer: {
        position: "relative",
        zIndex: 100,
        padding: "20px",
        textAlign: "center",
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    },

    footerText: {
        margin: 0,
        fontSize: "0.9rem",
        color: "rgba(255, 255, 255, 0.6)",
        fontWeight: "400",
    },

    fileInput: {
        background: "rgba(255,255,255,0.1)",
        border: "2px dashed rgba(255,255,255,0.3)",
        borderRadius: "12px",
        padding: "10px",
        color: "#fff",
        cursor: "pointer",
        width: "60%",
        textAlign: "center",
        transition: "all 0.3s ease",
    },

    filePreview: {
        width: "80%",
        maxHeight: "300px",
        overflowY: "auto",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "12px",
        padding: "15px",
        border: "1px solid rgba(255,255,255,0.1)",
    },

    fileText: {
        whiteSpace: "pre-wrap",
        color: "rgba(255,255,255,0.8)",
        fontFamily: "monospace",
        textAlign: "left",
        margin: 0,
    },

    filesList: {
        marginTop: "40px",
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
        padding: "20px",
        width: "90%",
        overflowX: "auto",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        color: "white",
        fontFamily: "monospace",
        fontSize: "0.9rem",
    },
    th: {
        textAlign: "left",
        borderBottom: "1px solid rgba(255,255,255,0.2)",
        padding: "8px",
        color: "#93c5fd",
    },
    td: {
        padding: "8px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
    },
};

export default IndexPage;