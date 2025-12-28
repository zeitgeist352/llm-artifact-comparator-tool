package com.artifactcomparator.artifact_comparator_backend.Security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import java.util.Date;

public class JwtUtil {

    // ✅ En az 256 bit uzunluğunda güvenli key
    private static final String SECRET_KEY = "bG9uZ2FuZHNlY3VyZXJhbmRvbXNlY3JldGtleWZvcmhleXN0YW5kYXJk";
    private static final long EXPIRATION_TIME = 1000 * 60 * 60; // 1 saat

    // ✅ Token oluştur
    public static String generateToken(Long userId, String username, String role) {
        SecretKey key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());

        return Jwts.builder()
                .setSubject(username)
                .claim("userId", userId)
                .claim("role", role)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // ✅ Token'dan userId al
    public static Long extractUserId(String token) {
        Claims claims = getClaims(token);
        Object idObj = claims.get("userId");
        if (idObj == null) return null;
        return ((Number) idObj).longValue();
    }

    // ✅ Token'dan username al
    public static String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    // ✅ Token geçerli mi?
    public static boolean isTokenValid(String token) {
        try {
            Claims claims = getClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    // ✅ Token'ı çöz
    private static Claims getClaims(String token) {
        SecretKey key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());

        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
