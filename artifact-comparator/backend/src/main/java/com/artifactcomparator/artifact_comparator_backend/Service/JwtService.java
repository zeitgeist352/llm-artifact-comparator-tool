package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Security.JwtUtil;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    public Long validateAndExtractUserId(String token) {
        if (!JwtUtil.isTokenValid(token)) {
            throw new RuntimeException("Invalid or expired token ❌");
        }
        return JwtUtil.extractUserId(token);

    }
}
