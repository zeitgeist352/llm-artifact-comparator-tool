import { useEffect, useState } from "react";
import {useNavigate} from "react-router-dom";

function AdminIndexPage() {
    const [time, setTime] = useState(new Date());
    const [username] = useState("AdminUser");
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [roleModalUser, setRoleModalUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [studies, setStudies] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [filteredStudies, setFilteredStudies] = useState(studies);
    const [actions, setActions] = useState([]);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [isReturning, setIsReturning] = useState(false);

    const [filter, setFilter] = useState({
        searchValue: "",
        role: "",
    });
    const [appliedFilter, setAppliedFilter] = useState({
        searchValue: "",
        role: "",
    });

    const [studyFilter, setStudyFilter] = useState({
        title: "",
        status: "",
        publishStatus: "REPORTED",
    });

    const [particles] = useState(() =>
        [...Array(55)].map((_, i) => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}vh`,
            animationDelay: `${-(Math.random() * 15).toFixed(2)}s`,
            animationDuration: `${16 + Math.random() * 10}s`,
        }))
    );

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem("token");
                const params = new URLSearchParams();

                if (appliedFilter.searchValue && appliedFilter.searchValue.trim()) {
                    params.append("searchValue", appliedFilter.searchValue.trim());
                }
                if (appliedFilter.role && appliedFilter.role.trim()) {
                    params.append("role", appliedFilter.role.trim());
                }

                const queryString = params.toString();
                const fullUrl = `http://localhost:8080/api/admin/user-panel${queryString ? `?${queryString}` : ''}`;

                const response = await fetch(fullUrl, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch users: ${response.status}`);
                }

                const data = await response.json();
                setUsers(data);
                setFilteredUsers(data);
            } catch (err) {
                setError(err.message);
                console.error("Error fetching users:", err);
            } finally {
                setLoading(false);
            }
        };

        if (activeView === 'users') {
            fetchUsers();
        }
    }, [appliedFilter, activeView]);

    useEffect(() => {
        const fetchStudies = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem("token");

                const params = new URLSearchParams();
                if (studyFilter.title && studyFilter.title.trim()) {
                    params.append("title", studyFilter.title.trim());
                }
                if (studyFilter.status && studyFilter.status.trim()) {
                    params.append("status", studyFilter.status.trim());
                }
                if (studyFilter.publishStatus && studyFilter.publishStatus.trim()) {
                    params.append("publishStatus", studyFilter.publishStatus.trim());
                }

                const queryString = params.toString();
                const fullUrl = `http://localhost:8080/api/admin/study-panel${queryString ? `?${queryString}` : ''}`;

                const response = await fetch(fullUrl, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch studies: ${response.status}`);
                }

                const data = await response.json();
                setStudies(data);
                setFilteredStudies(data);
            } catch (err) {
                setError(err.message);
                console.error("Error fetching studies:", err);
            } finally {
                setLoading(false);
            }
        };

        if (activeView === 'studies') {
            fetchStudies();
        }
    }, [activeView, studyFilter]);

    const handleSearch = () => {
        setAppliedFilter({...filter});
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const token = localStorage.getItem("token");

                const [userRes, studyRes] = await Promise.all([
                    fetch("http://localhost:8080/api/admin/user-panel", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }),
                    fetch("http://localhost:8080/api/admin/study-panel", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }),
                ]);

                if (!userRes.ok || !studyRes.ok) throw new Error("Failed to fetch counts");

                const usersData = await userRes.json();
                const studiesData = await studyRes.json();

                setUsers(usersData);
                setStudies(studiesData);
            } catch (err) {
                console.error("Error fetching dashboard counts:", err);
            }
        };

        fetchCounts();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const handleProfile = () => {
        navigate("/profile");
    };

    const handleActionLog = async () => {
        setActiveView("actions");
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8080/api/admin/action-log", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch action logs");
            }

            const data = await response.json();
            const sorted = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setActions(sorted);
        } catch (err) {
            console.error("Error fetching action logs:", err);
            alert("❌ Could not load action logs.");
        }
    };

    const handleSaveRole = async (user, newRole) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `http://localhost:8080/api/admin/change-role/${user.username}?newRole=${newRole}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.ok) {
                alert(`✅ Role updated to ${newRole}`);
                setUsers(prev =>
                    prev.map(u =>
                        u.username === user.username ? { ...u, role: newRole } : u
                    )
                );
                setFilteredUsers(prev =>
                    prev.map(u =>
                        u.username === user.username ? { ...u, role: newRole } : u
                    )
                );
                setRoleModalUser(null);
            } else {
                alert("❌ Failed to change role");
            }
        } catch (err) {
            console.error(err);
            alert("❌ Server error while changing role");
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

    const handleViewDetails = async (id) => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`http://localhost:8080/api/admin/study/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const res1 = await fetch(`http://localhost:8080/api/admin/${id}/reason`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch study details");
            const data = await res.json();
            const data1 = await res1.text();
            console.log(data1);
            const ans = data1 != null ? "\n Report reason\n" + data1 : "";
            alert(
                `📘 ${data.title}\nStatus: ${data.status}\nResearcher: ${data.researcher}\nParticipants: ${data.participantCount}\n${ans}`
            );
        } catch (err) {
            console.error(err);
            alert("Failed to load details.");
        }
    };

    const handleBlockStudy = async (id) => {
        const reason = prompt("Please enter a reason for blocking:");
        if (!reason) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`http://localhost:8080/api/admin/study/${id}/block`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason }),
            });
            if (!res.ok) throw new Error("Failed to block study");
            alert("✅ Study blocked successfully");
        } catch (err) {
            console.error(err);
            alert("❌ Error blocking study");
        }
    };

    const handleUnblockStudy = async (id) => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`http://localhost:8080/api/admin/study/${id}/unblock`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to unblock study");
            alert("✅ Study unblocked successfully");
        } catch (err) {
            console.error(err);
            alert("❌ Error unblocking study");
        }
    };

    return (
        <div style={styles.container}>
            {/* PARTICLES - Updated */}
            <div style={styles.particles}>
                {particles.map((particle, i) => (
                    <div
                        key={i}
                        style={{
                            ...styles.particle,
                            ...particle,
                            opacity: 0.45,
                        }}
                    />
                ))}
            </div>

            <div style={styles.navbar}>
                <h2 style={styles.title}>Admin Dashboard</h2>
                <div style={styles.navRight}>
                    <span style={styles.userText}>{username}</span>
                    <button
                        className="nav-button"
                        style={styles.actionButton}
                        onClick={handleActionLog}
                    >
                        Action Log
                    </button>
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

            {activeView === null ? (
                <div
                    style={styles.splitContainer}
                    className={isReturning ? "fade-in-split" : ""}
                >
                    <div
                        className={`split-section ${isReturning === 'users' ? 'highlight-users' : ''}`}
                        style={styles.splitSection}
                        onClick={() => {
                            setIsReturning(false);
                            setActiveView('users');
                        }}
                    >
                        <div style={styles.sectionContent}>
                            <div style={styles.iconContainer}>
                                <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h2 style={styles.sectionTitle}>User Management</h2>
                            <p style={styles.sectionDescription}>Manage users, roles, and permissions</p>
                            <div style={styles.statsBox}>
                                <span style={styles.statsNumber}>
                                    {users.length}
                                </span>
                                <span style={styles.statsLabel}>Total Users</span>
                            </div>
                        </div>
                    </div>



                    <div
                        className={`split-section ${isReturning === 'studies' ? 'highlight-studies' : ''}`}
                        style={styles.splitSection}
                        onClick={() => {
                            setIsReturning(false);
                            setActiveView('studies');
                        }}
                    >
                        <div style={styles.sectionContent}>
                            <div style={styles.iconContainer}>
                                <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <h2 style={styles.sectionTitle}>Study Management</h2>
                            <p style={styles.sectionDescription}>Create and manage research studies</p>
                            <div style={styles.statsBox}>
                                <span style={styles.statsNumber}>
                                    {studies.length}
                                </span>
                                <span style={styles.statsLabel}>Active Studies</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={styles.mainContent}>
                    <div
                        className="back-arrow"
                        style={styles.backArrow}
                        onClick={() => {
                            setIsReturning(activeView);
                            setActiveView(null);
                        }}
                    >
                        <svg style={styles.arrowIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </div>

                    {activeView === 'users' ? (
                        <UserManagementView
                            users={users}
                            filteredUsers={filteredUsers}
                            filter={filter}
                            setSelectedUser={setSelectedUser}
                            setFilter={setFilter}
                            formattedTime={formattedTime}
                            formattedDate={formattedDate}
                            loading={loading}
                            error={error}
                            handleSearch={handleSearch}
                            handleKeyPress={handleKeyPress}
                            setShowAddUserModal={setShowAddUserModal}
                        />
                    ) : activeView === 'studies' ?(
                        <StudyManagementView
                            studies={studies}
                            filteredStudies={filteredStudies}
                            studyFilter={studyFilter}
                            setStudyFilter={setStudyFilter}
                            formattedTime={formattedTime}
                            formattedDate={formattedDate}
                            handleViewDetails={handleViewDetails}
                            handleBlockStudy={handleBlockStudy}
                            handleUnblockStudy={handleUnblockStudy}
                        />
                    ) : (
                        <ActionLogView
                            actions={actions}
                            formattedTime={formattedTime}
                            formattedDate={formattedDate}
                        />
                    )}
                </div>
            )}

            <footer style={styles.footer}>
                © {new Date().getFullYear()} Artifact Comparator — Admin Panel
            </footer>

            <AddUserModal
                visible={showAddUserModal}
                onClose={() => setShowAddUserModal(false)}
                onUserAdded={() => {
                    setShowAddUserModal(false);
                    setAppliedFilter({ ...filter });
                }}
            />
            <UserDetailsModal
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
                onRoleChange={(user) => setRoleModalUser(user)}
                onDelete={async (user) => {
                    const confirmed = window.confirm(
                        `⚠️ Are you sure you want to delete ${user.username}'s account?`
                    );
                    if (!confirmed) return;

                    try {
                        const token = localStorage.getItem("token");
                        const res = await fetch(`http://localhost:8080/api/admin/delete-user/${user.username}`, {
                            method: "DELETE",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        });

                        if (res.ok) {
                            alert("✅ User deleted successfully!");
                            setUsers(prev => prev.filter(u => u.id !== user.id));
                            setFilteredUsers(prev => prev.filter(u => u.id !== user.id));
                            setSelectedUser(null);
                        } else {
                            alert("❌ Failed to delete user.");
                        }
                    } catch (err) {
                        console.error(err);
                        alert("❌ Server error while deleting user.");
                    }
                }}
            />
            <ChangeRoleModal
                user={roleModalUser}
                onClose={() => setRoleModalUser(null)}
                onSave={handleSaveRole}
            />

            <style>{`
                @keyframes floatParticle {
                    0% { transform: translateY(0) translateX(0); opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-120vh) translateX(0); opacity: 0; }
                }

                @keyframes fadeInSplit {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }

                @keyframes highlightPulse {
                    0%, 100% { 
                        box-shadow: 0 0 20px rgba(96, 165, 250, 0.3);
                        border-color: rgba(96, 165, 250, 0.3);
                    }
                    50% { 
                        box-shadow: 0 0 40px rgba(96, 165, 250, 0.6);
                        border-color: rgba(96, 165, 250, 0.6);
                    }
                }

                .fade-in-split {
                    animation: fadeInSplit 0.6s ease-out;
                }

                .highlight-users {
                    animation: highlightPulse 1s ease-in-out;
                }

                .highlight-studies {
                    animation: highlightPulse 1s ease-in-out;
                }

                .nav-button:hover {
                    box-shadow: 0 0 25px rgba(96, 165, 250, 0.9);
                }

                .logout-button:hover {
                    box-shadow: 0 0 25px rgba(239, 68, 68, 0.9);
                    border-color: rgba(239, 68, 68, 0.85) !important;
                }

                .split-section {
                    transition: all 0.4s ease;
                }

                .split-section:hover {
                    box-shadow: 0 0 30px rgba(96, 165, 250, 0.3);
                }

                .split-section:hover svg {
                    filter: drop-shadow(0 0 40px rgba(96, 165, 250, 0.8));
                }

                .back-arrow:hover {
                    transform: translateY(-50%);
                    box-shadow: 0 0 30px rgba(96, 165, 250, 0.9);
                }

                input:focus, select:focus {
                    border-color: rgba(96, 165, 250, 0.8) !important;
                    box-shadow: 0 0 12px rgba(96, 165, 250, 0.4) !important;
                    outline: none;
                }

                .table-row:hover {
                    background: rgba(96, 165, 250, 0.08) !important;
                }
            `}</style>
        </div>
    );
}

function UserManagementView({
                                users,
                                filteredUsers,
                                filter,
                                setFilter,
                                formattedTime,
                                formattedDate,
                                loading,
                                error,
                                setSelectedUser,
                                handleSearch,
                                handleKeyPress,
                                setShowAddUserModal,
                            }) {
    return (
        <div style={styles.contentCard}>


            <div style={styles.adminPanel}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                    <h2 style={styles.panelTitle}>User Management Panel</h2>
                    <button
                        onClick={() => setShowAddUserModal(true)}
                        style={styles.addButton}
                    >
                        ➕ Add User
                    </button>
                </div>

                <div style={styles.filterSection}>
                    <input
                        type="text"
                        placeholder="Search by name, username, or lastname..."
                        value={filter.searchValue}
                        onChange={(e) => setFilter({...filter, searchValue: e.target.value})}
                        onKeyPress={handleKeyPress}
                        style={styles.filterInput}
                        disabled={loading}
                    />
                    <select
                        value={filter.role}
                        onChange={(e) => setFilter({...filter, role: e.target.value})}
                        style={styles.filterSelect}
                        disabled={loading}
                    >
                        <option value="">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="RESEARCHER">Researcher</option>
                        <option value="REVIEWER">Reviewer</option>
                        <option value="PARTICIPANT">Participant</option>
                    </select>
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        style={styles.searchButton}
                    >
                        Search
                    </button>
                </div>

                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.tableHeader}>Username</th>
                            <th style={styles.tableHeader}>Name</th>
                            <th style={styles.tableHeader}>Email</th>
                            <th style={styles.tableHeader}>Role</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user, index) => (
                                <tr key={index} className="table-row" style={styles.tableRow} onClick={() => setSelectedUser(user)}>
                                    <td style={styles.tableCell}>{user.username}</td>
                                    <td style={styles.tableCell}>
                                        {user.name} {user.lastname}
                                    </td>
                                    <td style={styles.tableCell}>{user.email}</td>
                                    <td style={styles.tableCell}>
                                        <span style={{
                                            ...styles.roleBadge,
                                            background: getRoleBadgeColor(user.role),
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={styles.noData}>
                                    No users found
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div style={styles.userCount}>
                    Total Users: {users.length}
                </div>
            </div>
        </div>
    );
}

function StudyManagementView({
                                 studies,
                                 filteredStudies,
                                 studyFilter,
                                 setStudyFilter,
                                 formattedTime,
                                 formattedDate,
                                 handleViewDetails,
                                 handleUnblockStudy,
                                 handleBlockStudy
                             }) {
    return (
        <div style={styles.contentCard}>

            <div style={styles.adminPanel}>
                <h2 style={styles.panelTitle}>Study Management Panel</h2>

                <div style={styles.filterSection}>
                    <input
                        type="text"
                        placeholder="Search by title..."
                        value={studyFilter.title}
                        onChange={(e) => setStudyFilter({...studyFilter, title: e.target.value})}
                        style={styles.filterInput}
                    />
                    <select
                        value={studyFilter.status}
                        onChange={(e) => setStudyFilter({...studyFilter, status: e.target.value})}
                        style={styles.filterSelect}
                    >
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="DRAFT">Draft</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                    <select
                        value={studyFilter.publishStatus}
                        onChange={(e) => setStudyFilter({...studyFilter, publishStatus: e.target.value})}
                        style={styles.filterSelect}
                    >
                        <option value="">All Publish Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="REPORTED">Reported</option>
                    </select>
                </div>

                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.tableHeader}>Study Title</th>
                            <th style={styles.tableHeader}>Status</th>
                            <th style={styles.tableHeader}>Publish Status</th>
                            <th style={styles.tableHeader}>Participants</th>
                            <th style={styles.tableHeader}>Researcher</th>
                            <th style={styles.tableHeader}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredStudies.length > 0 ? (
                            filteredStudies.map((study, index) => (
                                <tr key={index} className="table-row" style={styles.tableRow}>
                                    <td style={styles.tableCell}>{study.title}</td>
                                    <td style={styles.tableCell}>
                                        <span style={{
                                            ...styles.roleBadge,
                                            background: getStudyStatusColor(study.status),
                                        }}>
                                            {study.status}
                                        </span>
                                    </td>
                                    <td style={styles.tableCell}>
                                        <span style={{
                                            ...styles.roleBadge,
                                            background: getPublishStatusColor(study.publishStatus),
                                        }}>
                                            {study.publishStatus}
                                        </span>
                                    </td>
                                    <td style={styles.tableCell}>{study.participantCount}</td>
                                    <td style={styles.tableCell}>{study.researcher}</td>
                                    <td style={styles.tableCell}>
                                        <button
                                            style={styles.viewButton}
                                            onClick={() => handleViewDetails(study.id)}
                                        >
                                            View
                                        </button>

                                        {study.status !== "BLOCKED" ? (
                                            <button
                                                style={styles.blockButton}
                                                onClick={() => handleBlockStudy(study.id)}
                                            >
                                                Block
                                            </button>
                                        ) : (
                                            <button
                                                style={styles.unblockButton}
                                                onClick={() => handleUnblockStudy(study.id)}
                                            >
                                                Unblock
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={styles.noData}>
                                    No studies found
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div style={styles.userCount}>
                    Total Studies: {filteredStudies.length} / {studies.length}
                </div>
            </div>
        </div>
    );
}

function ActionLogView({ actions, formattedTime, formattedDate }) {
    return (
        <div style={styles.contentCard}>

            <div style={styles.adminPanel}>
                <h2 style={styles.panelTitle}>Admin Action Log</h2>

                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.tableHeader}>Admin</th>
                            <th style={styles.tableHeader}>Action</th>
                            <th style={styles.tableHeader}>Description</th>
                            <th style={styles.tableHeader}>Time</th>
                        </tr>
                        </thead>
                        <tbody>
                        {actions.length > 0 ? (
                            actions.map((a, i) => (
                                <tr key={i} className="table-row" style={styles.tableRow}>
                                    <td style={styles.tableCell}>{a.adminUsername}</td>
                                    <td style={styles.tableCell}>{a.actionType}</td>
                                    <td style={styles.tableCell}>{a.description}</td>
                                    <td style={styles.tableCell}>
                                        {new Date(a.timestamp).toLocaleString("en-GB", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={styles.noData}>
                                    No actions recorded
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div style={styles.userCount}>
                    Total Actions: {actions.length}
                </div>
            </div>
        </div>
    );
}

function getRoleBadgeColor(role) {
    switch(role) {
        case "ADMIN":
            return "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)";
        case "RESEARCHER":
            return "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)";
        case "REVIEWER":
            return "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)";
        case "PARTICIPANT":
            return "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)";
        default:
            return "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)";
    }
}

function getPublishStatusColor(publishStatus) {
    const normalized = publishStatus?.toUpperCase();
    switch (normalized) {
        case "PENDING":
            return "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)";
        case "ACCEPTED":
            return "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)";
        case "REJECTED":
            return "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)";
        case "REPORTED":
            return "linear-gradient(135deg, #9333ea 0%, #a855f7 100%)";
        default:
            return "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)";
    }
}

function getStudyStatusColor(status) {
    const normalized = status?.toUpperCase();
    switch (normalized) {
        case "ACTIVE":
            return "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)";
        case "DRAFT":
            return "linear-gradient(135deg, #eab308 0%, #facc15 100%)";
        case "COMPLETED":
            return "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)";
        case "ARCHIVED":
            return "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)";
        default:
            return "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)";
    }
}

function UserDetailsModal({ user, onClose, onRoleChange, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: user?.name || "",
        lastname: user?.lastname || "",
        email: user?.email || "",
    });

    if (!user) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
                {editing ? (
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const token = localStorage.getItem("token");
                            try {
                                const res = await fetch(
                                    `http://localhost:8080/api/admin/update-user/${user.username}`,
                                    {
                                        method: "PATCH",
                                        headers: {
                                            "Authorization": `Bearer ${token}`,
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify(editData),
                                    }
                                );
                                if (res.ok) {
                                    alert("✅ User information updated!");
                                    setEditing(false);
                                } else {
                                    const errText = await res.text();
                                    alert(`❌ Update error: ${errText}`);
                                }
                            } catch (err) {
                                alert("❌ Server error");
                                console.error(err);
                            }
                        }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            marginTop: "10px",
                        }}
                    >
                        <input
                            style={styles.filterInput}
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            placeholder="Name"
                        />
                        <input
                            style={styles.filterInput}
                            value={editData.lastname}
                            onChange={(e) => setEditData({ ...editData, lastname: e.target.value })}
                            placeholder="Lastname"
                        />
                        <input
                            style={styles.filterInput}
                            value={editData.email}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                            placeholder="Email"
                        />

                        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                            <button
                                type="submit"
                                style={styles.saveButton}
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                style={styles.closeButton}
                                onClick={() => setEditing(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <p style={styles.modalText}><strong>Username:</strong> {user.username}</p>
                        <p style={styles.modalText}><strong>Email:</strong> {user.email}</p>
                        <p style={styles.modalText}><strong>Role:</strong> {user.role}</p>

                        <h3 style={styles.modalSubtitle}>Studies</h3>
                        <ul style={styles.modalList}>
                            {user.studies?.length > 0 ? (
                                user.studies.map((study, i) => (
                                    <li key={i}>{study.title} ({study.status})</li>
                                ))
                            ) : (
                                <li>No studies yet..</li>
                            )}
                        </ul>

                        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                            <button
                                style={styles.editButton}
                                onClick={() => setEditing(true)}
                            >
                                ✏️ Edit
                            </button>
                            <button
                                style={styles.changeRoleButton}
                                onClick={() => onRoleChange(user)}
                            >
                                🔁 Change Role
                            </button>
                            <button
                                style={styles.deleteButton}
                                onClick={() => onDelete(user)}
                            >
                                🗑 Delete
                            </button>
                            <button
                                style={styles.closeButton}
                                onClick={onClose}
                            >
                                ✖ Close
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function ChangeRoleModal({ user, onClose, onSave }) {
    const [selectedRole, setSelectedRole] = useState(user?.role || "PARTICIPANT");

    if (!user) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.roleModalCard}>
                <h2 style={styles.modalTitle}>Change Role for {user.username}</h2>
                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={styles.roleSelect}
                >
                    <option value="ADMIN">Admin</option>
                    <option value="RESEARCHER">Researcher</option>
                    <option value="REVIEWER">Reviewer</option>
                    <option value="PARTICIPANT">Participant</option>
                </select>

                <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px" }}>
                    <button
                        style={styles.saveButton}
                        onClick={() => onSave(user, selectedRole)}
                    >
                        💾 Save
                    </button>
                    <button
                        style={styles.closeButton}
                        onClick={onClose}
                    >
                        ✖ Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddUserModal({ visible, onClose, onUserAdded }) {
    const [form, setForm] = useState({
        username: "",
        name: "",
        lastname: "",
        email: "",
        password: "",
        role: "PARTICIPANT",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    if (!visible) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/admin/create-user", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setMessage({ text: "✅ User created successfully", type: "success" });
                setTimeout(() => {
                    onUserAdded();
                }, 1000);
            } else {
                const errText = await res.text();
                setMessage({ text: `❌ ${errText || "Failed to create user"}`, type: "error" });
            }
        } catch (err) {
            setMessage({ text: "❌ Server error", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.addUserCard}>
                <h2 style={styles.modalTitle}>Add New User</h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <input
                        style={styles.filterInput}
                        placeholder="Username"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required
                    />
                    <input
                        style={styles.filterInput}
                        placeholder="Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                    />
                    <input
                        style={styles.filterInput}
                        placeholder="Lastname"
                        value={form.lastname}
                        onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                        required
                    />
                    <input
                        style={styles.filterInput}
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                    />
                    <input
                        style={styles.filterInput}
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                    />
                    <select
                        style={styles.roleSelect}
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                        <option value="ADMIN">Admin</option>
                        <option value="RESEARCHER">Researcher</option>
                        <option value="REVIEWER">Reviewer</option>
                        <option value="PARTICIPANT">Participant</option>
                    </select>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.saveButton,
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading ? "Creating..." : "Create User"}
                    </button>
                    <button type="button" style={styles.closeButton} onClick={onClose}>
                        Cancel
                    </button>
                </form>

                {message && (
                    <div
                        style={{
                            marginTop: "15px",
                            color: message.type === "success" ? "#10b981" : "#ef4444",
                            fontWeight: "600",
                        }}
                    >
                        {message.text}
                    </div>
                )}
            </div>
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
        overflow: "hidden",
        position: "relative",
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
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "relative",
        zIndex: 10,
    },

    title: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#60a5fa",
    },

    navRight: {
        display: "flex",
        alignItems: "center",
        gap: "15px",
    },

    userText: {
        fontSize: "1.2rem",
        color: "#ffffff",
        fontWeight: "600",
    },

    actionButton: {
        background: "rgba(16, 185, 129, 0.1)",
        border: "2px solid rgba(16, 185, 129, 0.5)",
        color: "#10b981",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        transition: "all 0.3s ease",
    },

    profileButton: {
        background: "rgba(96, 165, 250, 0.1)",
        border: "2px solid rgba(96, 165, 250, 0.5)",
        color: "#60a5fa",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        transition: "all 0.3s ease",
    },

    logoutButton: {
        background: "rgba(239,68,68,0.1)",
        border: "2px solid rgba(239,68,68,0.5)",
        color: "#f87171",
        padding: "8px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        transition: "all 0.25s ease-out",
    },

    splitContainer: {
        position: "relative",
        flex: 1,
        display: "flex",
        width: "100%",
        minHeight: "calc(100vh - 200px)",
        zIndex: 10,
        padding: "40px 20px",
    },

    splitSection: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        position: "relative",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "20px",
        margin: "0 10px",
        border: "1px solid rgba(255,255,255,0.1)",
    },

    sectionContent: {
        textAlign: "center",
        padding: "40px",
    },

    iconContainer: {
        marginBottom: "30px",
        display: "inline-block",
    },

    icon: {
        width: "80px",
        height: "80px",
        color: "#60a5fa",
        filter: "drop-shadow(0 0 20px rgba(96, 165, 250, 0.5))",
        transition: "filter 0.3s ease",
    },

    sectionTitle: {
        fontSize: "2.5rem",
        fontWeight: "700",
        margin: "0 0 15px 0",
        background: "linear-gradient(135deg, #ffffff 0%, #60a5fa 50%, #0ea5e9 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        letterSpacing: "1px",
    },

    sectionDescription: {
        fontSize: "1.1rem",
        color: "rgba(255, 255, 255, 0.7)",
        marginBottom: "30px",
        fontWeight: "400",
    },

    statsBox: {
        display: "inline-flex",
        flexDirection: "column",
        padding: "20px 40px",
        borderRadius: "16px",
        background: "rgba(96, 165, 250, 0.1)",
        border: "1px solid rgba(96, 165, 250, 0.3)",
    },

    statsNumber: {
        fontSize: "3rem",
        fontWeight: "800",
        color: "#60a5fa",
        lineHeight: "1",
    },

    statsLabel: {
        fontSize: "0.9rem",
        color: "rgba(255, 255, 255, 0.6)",
        marginTop: "8px",
        textTransform: "uppercase",
        letterSpacing: "1px",
    },



    mainContent: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 80px 40px 20px",
        position: "relative",
        zIndex: 10,
    },

    backArrow: {
        position: "fixed",
        left: "20px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        background: "rgba(96, 165, 250, 0.2)",
        border: "2px solid rgba(96, 165, 250, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 1000,
        transition: "all 0.3s ease",
    },

    arrowIcon: {
        width: "28px",
        height: "28px",
        color: "#60a5fa",
    },

    contentCard: {
        background: "rgba(255, 255, 255, 0.05)",
        padding: "40px",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        width: "100%",
    },


    time: {
        fontSize: "2.5rem",
        fontWeight: "700",
        margin: "0 0 10px 0",
        background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: "2px",
    },

    date: {
        fontSize: "1.1rem",
        color: "rgba(255, 255, 255, 0.7)",
        margin: 0,
        fontWeight: "400",
    },

    adminPanel: {
        padding: "20px 0",
    },

    panelTitle: {
        fontSize: "1.8rem",
        fontWeight: "700",
        color: "#93c5fd",
        margin: 0,
    },

    addButton: {
        background: "linear-gradient(135deg, #10b981, #22c55e)",
        border: "none",
        padding: "10px 18px",
        borderRadius: "10px",
        color: "#fff",
        fontWeight: "600",
        cursor: "pointer",
        fontSize: "0.95rem",
        transition: "all 0.3s ease",
    },

    filterSection: {
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr",
        gap: "15px",
        marginBottom: "30px",
    },

    filterInput: {
        padding: "12px 16px",
        borderRadius: "12px",
        border: "2px solid rgba(255, 255, 255, 0.2)",
        fontSize: "0.95rem",
        outline: "none",
        background: "rgba(255, 255, 255, 0.05)",
        color: "#ffffff",
        fontWeight: "500",
        transition: "all 0.3s ease",
    },

    filterSelect: {
        padding: "12px 16px",
        borderRadius: "12px",
        border: "2px solid rgba(255, 255, 255, 0.2)",
        fontSize: "0.95rem",
        outline: "none",
        background: "rgba(255, 255, 255, 0.05)",
        color: "#ffffff",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },

    searchButton: {
        padding: "12px 20px",
        borderRadius: "12px",
        border: "none",
        background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
        color: "white",
        fontSize: "0.95rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },

    tableContainer: {
        overflowX: "auto",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        background: "rgba(255, 255, 255, 0.02)",
        marginBottom: "20px",
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
    },

    tableHeaderRow: {
        background: "rgba(96, 165, 250, 0.1)",
        borderBottom: "2px solid rgba(96, 165, 250, 0.3)",
    },

    tableHeader: {
        padding: "16px",
        textAlign: "left",
        fontSize: "0.95rem",
        fontWeight: "700",
        color: "#60a5fa",
        letterSpacing: "0.5px",
    },

    tableRow: {
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        cursor: "pointer",
        transition: "background 0.2s ease",
    },

    tableCell: {
        padding: "16px",
        fontSize: "0.9rem",
        color: "rgba(255, 255, 255, 0.85)",
        fontWeight: "500",
        textAlign: "left",
    },

    roleBadge: {
        padding: "6px 12px",
        borderRadius: "8px",
        fontSize: "0.8rem",
        fontWeight: "700",
        color: "#ffffff",
        display: "inline-block",
        letterSpacing: "0.3px",
    },

    noData: {
        padding: "40px",
        textAlign: "center",
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: "1rem",
        fontStyle: "italic",
    },

    userCount: {
        textAlign: "right",
        fontSize: "0.9rem",
        color: "rgba(255, 255, 255, 0.7)",
        fontWeight: "600",
    },

    footer: {
        textAlign: "center",
        marginTop: "80px",
        color: "rgba(255,255,255,0.45)",
        fontSize: "0.9rem",
        paddingBottom: "30px",
    },

    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
    },

    modalCard: {
        background: "rgba(26, 26, 46, 0.95)",
        borderRadius: "20px",
        padding: "30px",
        width: "400px",
        maxWidth: "90%",
        textAlign: "center",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        border: "1px solid rgba(96, 165, 250, 0.3)",
        color: "#fff",
    },

    modalTitle: {
        fontSize: "1.6rem",
        fontWeight: "700",
        marginBottom: "20px",
        color: "#93c5fd",
    },

    modalText: {
        marginBottom: "12px",
        fontSize: "0.95rem",
        textAlign: "left",
    },

    modalSubtitle: {
        fontSize: "1.1rem",
        fontWeight: "600",
        marginTop: "20px",
        marginBottom: "10px",
        color: "#93c5fd",
    },

    modalList: {
        listStyle: "none",
        padding: 0,
        marginBottom: "20px",
        textAlign: "left",
    },

    saveButton: {
        background: "linear-gradient(135deg, #10b981, #22c55e)",
        border: "none",
        padding: "10px 18px",
        borderRadius: "10px",
        color: "#fff",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },

    editButton: {
        background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
        border: "none",
        padding: "10px 18px",
        borderRadius: "10px",
        color: "#fff",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },

    changeRoleButton: {
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        border: "none",
        padding: "10px 18px",
        borderRadius: "10px",
        color: "#fff",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },

    deleteButton: {
        background: "linear-gradient(135deg, #ef4444, #f87171)",
        border: "none",
        padding: "10px 18px",
        borderRadius: "10px",
        color: "#fff",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },

    closeButton: {
        background: "rgba(107, 114, 128, 0.3)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        padding: "10px 18px",
        borderRadius: "10px",
        color: "#fff",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },

    roleModalCard: {
        background: "rgba(26, 26, 46, 0.95)",
        borderRadius: "20px",
        padding: "30px",
        width: "350px",
        maxWidth: "90%",
        textAlign: "center",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        border: "1px solid rgba(96, 165, 250, 0.3)",
        color: "#fff",
    },

    roleSelect: {
        width: "100%",
        padding: "12px",
        borderRadius: "10px",
        border: "2px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.05)",
        color: "#fff",
        fontSize: "1rem",
        cursor: "pointer",
        outline: "none",
        transition: "all 0.3s ease",
    },

    addUserCard: {
        background: "rgba(26, 26, 46, 0.95)",
        borderRadius: "20px",
        padding: "30px",
        width: "400px",
        maxWidth: "90%",
        textAlign: "center",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        border: "1px solid rgba(96, 165, 250, 0.3)",
        color: "#fff",
    },

    viewButton: {
        padding: "8px 14px",
        marginRight: "8px",
        border: "none",
        borderRadius: "8px",
        fontWeight: "600",
        color: "#fff",
        background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        fontSize: "0.85rem",
    },

    blockButton: {
        padding: "8px 14px",
        marginRight: "8px",
        border: "none",
        borderRadius: "8px",
        fontWeight: "600",
        color: "#fff",
        background: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        fontSize: "0.85rem",
    },

    unblockButton: {
        padding: "8px 14px",
        border: "none",
        borderRadius: "8px",
        fontWeight: "600",
        color: "#fff",
        background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        fontSize: "0.85rem",
    },
};

export default AdminIndexPage;