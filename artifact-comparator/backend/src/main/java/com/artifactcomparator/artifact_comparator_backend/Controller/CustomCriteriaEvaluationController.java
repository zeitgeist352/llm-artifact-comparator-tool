package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.CustomCriteriaSubmitRequestDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import com.artifactcomparator.artifact_comparator_backend.Service.CustomCriteriaEvaluationService;
import com.artifactcomparator.artifact_comparator_backend.Service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/custom-evaluations")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class CustomCriteriaEvaluationController {

    private final CustomCriteriaEvaluationService service;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public CustomCriteriaEvaluationController(
            CustomCriteriaEvaluationService service,
            JwtService jwtService,
            UserRepository userRepository
    ) {
        this.service = service;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitCustomCriteria(
            @RequestBody CustomCriteriaSubmitRequestDTO request,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body("Missing or invalid token ❌");

            String token = authHeader.substring(7);
            Long userId = jwtService.validateAndExtractUserId(token);

            User participant = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            service.processSubmitRequest(request, participant);

            return ResponseEntity.ok("Custom criteria submitted successfully");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body("Error submitting custom criteria: " + e.getMessage());
        }
    }
}
