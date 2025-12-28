import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute
 * - Giriş yapmamış kullanıcıyı / sayfasına yönlendirir
 * - allowedRole parametresiyle role kontrolü sağlar
 */
function ProtectedRoute({ children, allowedRole }) {
    const user = JSON.parse(localStorage.getItem("user"));

    // Kullanıcı giriş yapmamışsa → login ekranına at
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // allowedRole verilmişse ve uymuyorsa → login ekranına at
    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to="/" replace />;
    }

    // Her şey uygunsa sayfayı göster
    return children;
}

export default ProtectedRoute;
