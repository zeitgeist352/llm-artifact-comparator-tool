package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.Service.JwtService;
import com.artifactcomparator.artifact_comparator_backend.Service.ResearcherService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/researchers")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ResearcherInvitationController {

    private final JwtService jwtService;
    private final ResearcherService researcherService;

    public ResearcherInvitationController(JwtService jwtService, ResearcherService researcherService) {
        this.jwtService = jwtService;
        this.researcherService = researcherService;
    }

    @GetMapping("/my-invitations")
    public ResponseEntity<?> getMyInvitations(
            @RequestHeader("Authorization") String authHeader
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return ResponseEntity.status(401).body("Missing or invalid token ❌");

        String token = authHeader.substring(7);
        Long userId = jwtService.validateAndExtractUserId(token);

        return ResponseEntity.ok(researcherService.getInvitationsForUser(userId));
    }

    @PostMapping("/{researcherId}/accept")
    public ResponseEntity<?> acceptInvitation(
            @PathVariable Long researcherId,
            @RequestHeader("Authorization") String authHeader
    ) {
        String token = authHeader.substring(7);
        Long userId = jwtService.validateAndExtractUserId(token);

        researcherService.acceptInvitation(researcherId, userId);
        return ResponseEntity.ok("Invitation accepted");
    }

    @PostMapping("/{researcherId}/reject")
    public ResponseEntity<?> rejectInvitation(
            @PathVariable Long researcherId,
            @RequestHeader("Authorization") String authHeader
    ) {
        String token = authHeader.substring(7);
        Long userId = jwtService.validateAndExtractUserId(token);

        researcherService.rejectInvitation(researcherId, userId);
        return ResponseEntity.ok("Invitation rejected");
    }
}