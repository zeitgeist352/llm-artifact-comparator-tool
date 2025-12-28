package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.ParticipantProgressDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.ParticipantStudyProgressDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.UpdateStudyRequestDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.StudyRequestDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Enums.StudyStatus;
import com.artifactcomparator.artifact_comparator_backend.Enums.StudyType;
import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import com.artifactcomparator.artifact_comparator_backend.Enums.PublishStatus;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import com.artifactcomparator.artifact_comparator_backend.Service.JwtService;
import com.artifactcomparator.artifact_comparator_backend.Service.StudyService;
import org.springframework.http.HttpStatus;
import com.artifactcomparator.artifact_comparator_backend.Service.ParticipantInviteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/studies")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class StudyController {

    private final StudyService studyService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final StudyRepository studyRepository;
    private final ParticipantInviteService inviteService;

    public StudyController(
            StudyService studyService,
            JwtService jwtService,
            UserRepository userRepository,
            StudyRepository studyRepository,
            ParticipantInviteService inviteService
    ) {
        this.studyService = studyService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.studyRepository = studyRepository;
        this.inviteService = inviteService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createStudy(@RequestBody StudyRequestDTO dto,
                                         @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");

            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);

            User researcher = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Researcher not found"));

            Study study = new Study();
            study.setTitle(dto.getTitle());
            study.setDescription(dto.getDescription());
            StudyType type = StudyType.valueOf(dto.getStudyType().toUpperCase());
            study.setStudyType(type);

            if (type == StudyType.CUSTOM) {
                study.setArtifactCountPerTask(1);
            } else if (dto.getArtifactCountPerTask() != null) {
                study.setArtifactCountPerTask(dto.getArtifactCountPerTask());
            } else {
                study.setArtifactCountPerTask(1);
            }

            Study created = studyService.createStudy(study, researcher);
            return ResponseEntity.ok(created);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error creating study: " + e.getMessage());
        }
    }

    // ✅ Unified Invitation Endpoint (Participant, Reviewer, Researcher)
    @PostMapping("/{id}/invite")
    public ResponseEntity<?> inviteUserToStudy(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");

            String token = authHeader.substring(7);
            Long inviterId = jwtService.validateAndExtractUserId(token);

            String username = body.get("username");
            String roleStr = body.get("role");

            if (username == null || username.isBlank())
                return ResponseEntity.badRequest().body("Username is required.");
            if (roleStr == null || roleStr.isBlank())
                return ResponseEntity.badRequest().body("Role is required.");

            Role role;
            try {
                role = Role.valueOf(roleStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Invalid role.");
            }

            studyService.inviteUser(id, username, role, inviterId);

            return ResponseEntity.ok("Invitation sent successfully to " + username);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error sending invitation: " + e.getMessage());
        }
    }

    // ... existing methods (getMyStudies, getRecentStudies, updateStudy, approveStudy, etc.) ...

    // ✅ Get all studies
    @GetMapping("/all")
    public ResponseEntity<List<Study>> getAllStudies() {
        return ResponseEntity.ok(studyService.getAllStudies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Study> getStudyById(@PathVariable Long id) {
        return ResponseEntity.ok(studyService.getStudyById(id));
    }

    @GetMapping("/my-studies")
    public ResponseEntity<?> getMyStudies(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");
            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);
            List<Study> studies = studyService.getStudiesForUser(userId);
            return ResponseEntity.ok(studies);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error fetching studies: " + e.getMessage());
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Study>> getRecentStudies() {
        List<Study> recent = studyRepository.findTop3ByOrderByCreatedAtDesc();
        return ResponseEntity.ok(recent);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateStudy(
            @PathVariable Long id,
            @RequestBody UpdateStudyRequestDTO request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");
            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);
            User researcher = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Researcher not found"));
            Study updated = studyService.updateStudy(id, request, researcher);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error updating study: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<?> approveStudy(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");
            String token = authHeader.substring(7);
            jwtService.validateAndExtractUserId(token);
            Study updatedStudy = studyService.approveStudy(id);
            return ResponseEntity.ok(updatedStudy);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error approving study: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> rejectStudy(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");
            String reason = payload.get("reason");
            studyService.rejectStudy(id, reason);
            return ResponseEntity.ok("Study rejected successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error rejecting study: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}/report")
    public ResponseEntity<?> reportStudy(@PathVariable("id") Long studyId, @RequestBody Map<String, String> payload, @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");
            String token = authHeader.substring(7);
            jwtService.validateAndExtractUserId(token);
            String reason = payload.get("reason");
            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Reason is required");
            }
            Study updatedStudy = studyService.reportStudy(studyId, reason);
            return ResponseEntity.ok(updatedStudy);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error reporting study: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}/artifact-count")
    public ResponseEntity<?> updateArtifactCount(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body,
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");
            if (!body.containsKey("artifactCountPerTask"))
                return ResponseEntity.badRequest().body("Missing field: artifactCountPerTask");
            int count = body.get("artifactCountPerTask");
            Study updated = studyService.updateArtifactCount(id, count);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{studyId}/assign-quiz/{quizId}")
    public ResponseEntity<Study> assignQuizToStudy(@PathVariable Long studyId, @PathVariable Long quizId) {
        try {
            Study study = studyService.assignQuiz(studyId, quizId);
            return ResponseEntity.ok(study);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PatchMapping("/{id}/end-date")
    public ResponseEntity<?> updateEndDate(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");
            if (body == null || !body.containsKey("endDate")) {
                return ResponseEntity.badRequest().body("Missing 'endDate' field");
            }
            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);
            User researcher = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Researcher not found"));
            LocalDateTime newEndDate = LocalDateTime.parse(body.get("endDate"));
            Study updated = studyService.updateEndDate(id, newEndDate, researcher);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error updating end date: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/participants")
    public ResponseEntity<?> getParticipants(@PathVariable Long id) {
        try {
            List<ParticipantProgressDTO> participants = studyService.getParticipantsWithProgress(id);
            return ResponseEntity.ok(participants);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error fetching participants: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}/participants/{userId}")
    public ResponseEntity<?> removeParticipant(@PathVariable Long id, @PathVariable Long userId) {
        try {
            studyService.removeParticipantFromStudy(id, userId);
            return ResponseEntity.ok("Participant removed successfully ✅");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error removing participant: " + e.getMessage());
        }
    }

    // ❌ Deprecated: Replaced by /{id}/invite
    @PostMapping("/{id}/participants/invite")
    public ResponseEntity<?> inviteParticipant(@PathVariable Long id, @RequestBody String email) {
        try {
            if (email == null || email.isBlank())
                return ResponseEntity.badRequest().body("Email address is required.");
            String cleaned = email.replace("\"", "").trim();
            inviteService.sendInvitationEmail(cleaned, id);
            return ResponseEntity.ok("Invitation sent successfully to " + email.trim());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error sending invitation: " + e.getMessage());
        }
    }

    @GetMapping("/available")
    public ResponseEntity<List<Study>> getAvailableStudies() {
        List<Study> studies = studyService.getPublicStudies();
        return ResponseEntity.ok(studies);
    }

    @GetMapping("/joined-with-progress")
    public ResponseEntity<List<ParticipantStudyProgressDTO>> getJoinedStudiesWithProgress(
            @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return ResponseEntity.status(401).body(null);
        String token = authHeader.substring(7);
        Long userId = jwtService.validateAndExtractUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Study> joined = studyService.getJoinedStudies(user);
        List<ParticipantStudyProgressDTO> response = joined.stream()
                .map(study -> new ParticipantStudyProgressDTO(
                        study.getId(),
                        study.getTitle(),
                        study.getDescription(),
                        studyService.calculateProgress(study, user)
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/waiting-for-approval")
    public ResponseEntity<List<Study>> getPendingStudies() {
        List<Study> pendingStudies = studyRepository.findByPublishStatusAndStatus(com.artifactcomparator.artifact_comparator_backend.Enums.PublishStatus.PENDING, StudyStatus.COMPLETED);
        return ResponseEntity.ok(pendingStudies);
    }

    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<?> completeTask(
            @PathVariable Long taskId,
            @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return ResponseEntity.status(401).body(Map.of("error", "Missing or invalid token ❌"));
        String token = authHeader.substring(7);
        Long userId = jwtService.validateAndExtractUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        studyService.markTaskAsCompleted(taskId, user);
        return ResponseEntity.ok(Map.of("message", "Task completed successfully"));
    }

    @GetMapping("/{studyId}/evaluation-tasks")
    public ResponseEntity<?> getEvaluationTasks(@PathVariable Long studyId) {
        try {
            Study study = studyService.getStudyById(studyId);
            return ResponseEntity.ok(study.getEvaluationTasks());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudy(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return ResponseEntity.status(401).body("Missing or invalid token ❌");

        String token = authHeader.substring(7);
        Long userId = jwtService.validateAndExtractUserId(token);

        studyService.deleteStudyHard(id, userId);

        return ResponseEntity.ok("Study deleted permanently ✅");
    }

}