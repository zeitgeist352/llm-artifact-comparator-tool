const API_URL = "http://localhost:8080/api/researchers";

export async function getMyInvitations() {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/my-invitations`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        }
    });

    return res.json();
}

export async function acceptInvitation(id) {
    const token = localStorage.getItem("token");

    return fetch(`${API_URL}/${id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
    });
}

export async function rejectInvitation(id) {
    const token = localStorage.getItem("token");

    return fetch(`${API_URL}/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
    });
}