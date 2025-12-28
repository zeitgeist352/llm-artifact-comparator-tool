package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.EvaluationRequestDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import com.artifactcomparator.artifact_comparator_backend.Service.EvaluationService;
import com.artifactcomparator.artifact_comparator_backend.Service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/evaluations")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class EvaluationController {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final EvaluationService evaluationService;

    public EvaluationController(
            JwtService jwtService,
            UserRepository userRepository,
            EvaluationService evaluationService
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.evaluationService = evaluationService;
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitEvaluation(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody EvaluationRequestDTO req
    ) {
        try {
            // 🔒 Token check
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid token ❌");
            }

            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // 🔥 Evaluation kaydet
            evaluationService.submitEvaluation(req, user.getId());

            return ResponseEntity.ok(Map.of(
                    "message", "Evaluation submitted successfully"
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error submitting evaluation: " + e.getMessage());
        }
    }
}
