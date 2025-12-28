package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReportResponseDTO {

    private Long id;
    private String type;              // ARTIFACT / PARTICIPANT
    private Long taskId;

    // ARTIFACT
    private Long artifactId;
    private String artifactName;      // 🔥 UI için

    // PARTICIPANT
    private String reportedUsername;

    private String reporterUsername;  // 🔥 kim raporladı

    private String reason;
    private String description;
    private LocalDateTime createdAt;

    private Long commentId;
    private String commentSnapshot;
}
