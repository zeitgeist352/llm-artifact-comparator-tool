package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.Entity.Invitation;
import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import com.artifactcomparator.artifact_comparator_backend.Service.InvitationService;
import com.artifactcomparator.artifact_comparator_backend.Service.JwtService;
import com.artifactcomparator.artifact_comparator_backend.Repository.InvitationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class InvitationController {

    private final InvitationService invitationService;
    private final InvitationRepository invitationRepository;
    private final JwtService jwtService;

    @Autowired
    public InvitationController(InvitationService invitationService, JwtService jwtService, InvitationRepository invitationRepository) {
        this.invitationService = invitationService;
        this.invitationRepository = invitationRepository;
        this.jwtService = jwtService;
    }

    /**
     * Get pending invitations for the logged-in user.
     * Optional 'role' parameter to filter by invitation type.
     */
    @GetMapping("/my-invitations")
    public ResponseEntity<?> getInvitations(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = true) Role role) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid token ❌");
            }
            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);


            List<Invitation> invitations = invitationService.getUserInvitations(userId, role);
            return ResponseEntity.ok(invitations);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching invitations: " + e.getMessage());
        }
    }

    /**
     * Accept a specific invitation.
     */
    @PostMapping("/{studyId}/accept")
    public ResponseEntity<?> acceptInvitation(
            @PathVariable Long studyId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid token ❌");
            }
            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);
            Invitation i = invitationRepository.findByStudyIdAndUserId(studyId,userId);
            Invitation accepted = invitationService.acceptInvitation(i.getId(), userId);
            return ResponseEntity.ok(Map.of("message", "Invitation accepted successfully", "invitation", accepted));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error accepting invitation: " + e.getMessage());
        }
    }

    /**
     * Reject a specific invitation.
     */
    @PostMapping("/{studyId}/reject")
    public ResponseEntity<?> rejectInvitation(
            @PathVariable Long studyId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid token ❌");
            }
            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);

            Invitation i = invitationRepository.findByStudyIdAndUserId(studyId,userId);

            Invitation rejected = invitationService.rejectInvitation(i.getId(), userId);
            return ResponseEntity.ok(Map.of("message", "Invitation rejected", "invitation", rejected));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error rejecting invitation: " + e.getMessage());
        }
    }
}