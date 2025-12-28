package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.CreateReportRequestDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.ReportResponseDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.ArtifactUpload;
import com.artifactcomparator.artifact_comparator_backend.Entity.Report;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.ArtifactUploadRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.ReportRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import com.artifactcomparator.artifact_comparator_backend.Security.JwtUtil;
import com.artifactcomparator.artifact_comparator_backend.Service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ArtifactUploadRepository  artifactUploadRepository;

    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody CreateReportRequestDTO req,
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return ResponseEntity.status(401).body("Missing or invalid token ❌");

        String token = authHeader.substring(7);

        Long userId = JwtUtil.extractUserId(token);  // ← STATIC KULLAN
        if (userId == null)
            return ResponseEntity.status(401).body("Invalid token ❌");

        User reporter = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Report saved = reportService.createReport(req, reporter.getUsername());

        return ResponseEntity.ok(saved);
    }

    public List<Report> getReportsForArtifact(Long artifactId) {
        return reportRepository.findByArtifactId(artifactId);
    }

    public List<Report> getReportsForParticipant(String username) {
        return reportRepository.findByReportedUsername(username);
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<ReportResponseDTO>> getReportsByTask(
            @PathVariable Long taskId) {

        List<Report> reports = reportRepository.findByTaskId(taskId);

        List<ReportResponseDTO> dtoList = reports.stream().map(r -> {

            String artifactName = null;
            if (r.getArtifactId() != null) {
                artifactName = artifactUploadRepository
                        .findById(r.getArtifactId())
                        .map(ArtifactUpload::getFilename)
                        .orElse(null);
            }

            return ReportResponseDTO.builder()
                    .id(r.getId())
                    .type(r.getType().name())
                    .taskId(r.getTaskId())
                    .artifactId(r.getArtifactId())
                    .artifactName(artifactName)
                    .reportedUsername(r.getReportedUsername())
                    .commentId(r.getCommentId())
                    .commentSnapshot(r.getCommentSnapshot())
                    .reporterUsername(
                            r.getReporter() != null
                                    ? r.getReporter().getUsername()
                                    : null
                    )
                    .reason(r.getReason())
                    .description(r.getDescription())
                    .createdAt(r.getCreatedAt())
                    .build();
        }).toList();

        return ResponseEntity.ok(dtoList);
    }


    @GetMapping("/task/{taskId}/count")
    public ResponseEntity<?> countReportsForTask(@PathVariable Long taskId) {
        long count = reportRepository.countByTaskId(taskId);
        return ResponseEntity.ok(count);
    }
}
