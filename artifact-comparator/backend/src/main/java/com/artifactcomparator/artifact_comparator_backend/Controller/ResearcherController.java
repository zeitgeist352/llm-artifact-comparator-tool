package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.InviteResearcherRequestDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.UpdateResearcherPermissionsDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.ResearcherResponseDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.Researcher;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Service.ResearcherService;
import com.artifactcomparator.artifact_comparator_backend.Service.JwtService;

import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import com.artifactcomparator.artifact_comparator_backend.Service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/studies/{studyId}/researchers")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ResearcherController {

    private final ResearcherService researcherService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final UserService userService;

    public ResearcherController(
            ResearcherService researcherService,
            JwtService jwtService,
            UserRepository userRepository,
            UserService userService
    ) {
        this.researcherService = researcherService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    // ✅ Get all co-researchers for a study
    @GetMapping
    public ResponseEntity<?> getResearchers(
            @PathVariable Long studyId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");

            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);

            List<ResearcherResponseDTO> researchers = researcherService.getResearchersForStudy(studyId, userId);
            return ResponseEntity.ok(researchers);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error fetching researchers: " + e.getMessage());
        }
    }

    // ✅ Invite a new co-researcher
    @PostMapping("/invite")
    public ResponseEntity<?> inviteResearcher(
            @PathVariable Long studyId,
            @RequestBody InviteResearcherRequestDTO request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");

            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);

            Researcher researcher = researcherService.inviteResearcher(
                    studyId,
                    userId,
                    request.getUsername().trim().toLowerCase(),
                    request.getCanUploadArtifacts(),
                    request.getCanEditStudyDetails(),
                    request.getCanInviteParticipants()
            );
            return ResponseEntity.ok(Map.of("message", "Researcher invited successfully ✅", "researcherId", researcher.getId()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error inviting researcher: " + e.getMessage());
        }
    }

    // ✅ Update researcher permissions
    @PatchMapping("/{researcherId}/permissions")
    public ResponseEntity<?> updatePermissions(
            @PathVariable Long studyId,
            @PathVariable Long researcherId,
            @RequestBody UpdateResearcherPermissionsDTO request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");

            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);

            researcherService.updateResearcherPermissions(
                    studyId,
                    researcherId,
                    userId,
                    request
            );

            return ResponseEntity.ok(Map.of("message", "Permissions updated successfully ✅"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error updating permissions: " + e.getMessage());
        }
    }

    // ✅ Remove a co-researcher from a study
    @DeleteMapping("/{researcherId}")
    public ResponseEntity<?> removeResearcher(
            @PathVariable Long studyId,
            @PathVariable Long researcherId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");

            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);

            researcherService.removeResearcher(studyId, researcherId, userId);
            return ResponseEntity.ok(Map.of("message", "Researcher removed successfully ✅"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error removing researcher: " + e.getMessage());
        }
    }

    // ✅ Get researcher details by ID
    @GetMapping("/{researcherId}")
    public ResponseEntity<?> getResearcherDetails(
            @PathVariable Long studyId,
            @PathVariable Long researcherId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");

            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);

            ResearcherResponseDTO researcher = researcherService.getResearcherDetails(studyId, researcherId, userId);
            return ResponseEntity.ok(researcher);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error fetching researcher: " + e.getMessage());
        }
    }

    @PostMapping("/{researcherId}/accept")
    public ResponseEntity<?> acceptInvitation(@PathVariable Long researcherId) {
        researcherService.acceptInvitation(researcherId);
        return ResponseEntity.ok("Invitation accepted");
    }

    @PostMapping("/{researcherId}/reject")
    public ResponseEntity<?> rejectInvitation(@PathVariable Long researcherId) {
        researcherService.rejectInvitation(researcherId);
        return ResponseEntity.ok("Invitation rejected");
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

    @GetMapping("/get-invitation/{researcherId}")
    public ResponseEntity<?> getSpecifiedInvitation(@PathVariable Long studyId, @PathVariable Long researcherId,
            @RequestHeader("Authorization") String authHeader
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return ResponseEntity.status(401).body("Missing or invalid token ❌");

        String token = authHeader.substring(7);
        Long userId = jwtService.validateAndExtractUserId(token);

        return ResponseEntity.ok(researcherService.getInvitationSpecificForUser(researcherId, studyId));
    }
}