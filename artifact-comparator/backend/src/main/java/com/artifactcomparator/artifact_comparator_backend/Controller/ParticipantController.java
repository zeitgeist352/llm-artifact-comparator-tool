package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.ParticipantSubmitResponseDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.InvitationToken;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import com.artifactcomparator.artifact_comparator_backend.Service.JwtService;
import com.artifactcomparator.artifact_comparator_backend.Service.ParticipantInviteService;
import com.artifactcomparator.artifact_comparator_backend.Service.ParticipantTaskResponseService;
import com.artifactcomparator.artifact_comparator_backend.Service.StudyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/participant")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ParticipantController {

    @Autowired
    private ParticipantTaskResponseService participantTaskResponseService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final StudyRepository studyRepository;
    private final StudyService studyService;
    private final ParticipantInviteService participantInviteService;

    public ParticipantController(JwtService jwtService, UserRepository userRepository,
                                 StudyRepository studyRepository, StudyService studyService,  ParticipantInviteService participantInviteService) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.studyRepository = studyRepository;
        this.studyService = studyService;
        this.participantInviteService = participantInviteService;
    }

    // ✅ Katılımcı bir çalışmaya katılır
    @PostMapping("/join/{studyId}")
    public ResponseEntity<?> joinStudy(
            @PathVariable Long studyId,
            @RequestHeader("Authorization") String authHeader) {

        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");

            // 🔐 Token'dan kullanıcıyı al
            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);
            User participant = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Participant not found"));

            // 📚 Çalışmayı bul
            Study study = studyRepository.findById(studyId)
                    .orElseThrow(() -> new RuntimeException("Study not found"));

            // 🎯 Quiz bilgisi varsa, frontend’e gönder
            Map<String, Object> response = Map.of(
                    "id", study.getId(),
                    "title", study.getTitle(),
                    "description", study.getDescription(),
                    "quiz", study.getQuiz() != null
                            ? Map.of("id", study.getQuiz().getId(), "title", study.getQuiz().getTitle())
                            : null
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error joining study: " + e.getMessage());
        }
    }

    @PostMapping("/{studyId}/participants/confirm")
    public ResponseEntity<?> confirmJoin(
            @PathVariable Long studyId,
            @RequestParam String token
    ) {
        InvitationToken inv = participantInviteService.validateToken(token);

        User user = inv.getParticipant();
        Study study = inv.getStudy();

        // ✔ Quiz dön → email'den gelen direkt QUIZ'e girsin
        return ResponseEntity.ok(
                Map.of(
                        "id", study.getId(),
                        "title", study.getTitle(),
                        "quiz", study.getQuiz() != null
                                ? Map.of("id", study.getQuiz().getId())
                                : null
                )
        );
    }

    @PostMapping("/submit-response")
    public ResponseEntity<?> submitTaskResponse(
            @RequestBody ParticipantSubmitResponseDTO dto,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token");

            // 🔐 Token → userId
            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);

            User participant = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Participant not found"));

            // 💾 Kaydet
            participantTaskResponseService.saveResponse(
                    participant,
                    dto.getTaskId(),
                    dto.getAnswers()
            );

            return ResponseEntity.ok("Response submitted successfully");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error submitting response: " + e.getMessage());
        }
    }

    @GetMapping("/task-response/{taskId}")
    public ResponseEntity<?> getMyTaskResponse(
            @PathVariable Long taskId,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token");

            // 🔐 Token → userId
            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);

            User participant = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Participant not found"));

            // 🔎 Response varsa getir
            return participantTaskResponseService
                    .getResponseForParticipant(participant, taskId)
                    .map(response -> {
                        ParticipantSubmitResponseDTO dto =
                                new ParticipantSubmitResponseDTO();
                        dto.setTaskId(taskId);
                        dto.setAnswers(response.getAnswers());
                        return ResponseEntity.ok(dto);
                    })
                    .orElseGet(() -> {
                        // ❗ Daha önce cevap yoksa boş liste dön
                        ParticipantSubmitResponseDTO dto =
                                new ParticipantSubmitResponseDTO();
                        dto.setTaskId(taskId);
                        dto.setAnswers(List.of());
                        return ResponseEntity.ok(dto);
                    });

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body("Error fetching response: " + e.getMessage());
        }
    }

    @GetMapping("/study/{studyId}/completed-task-ids")
    public ResponseEntity<?> getCompletedTaskIdsForStudy(
            @PathVariable Long studyId,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token");

            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);

            User participant = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Participant not found"));

            List<Long> completedTaskIds =
                    participantTaskResponseService
                            .getCompletedTaskIdsForStudy(participant, studyId);

            return ResponseEntity.ok(completedTaskIds);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}
