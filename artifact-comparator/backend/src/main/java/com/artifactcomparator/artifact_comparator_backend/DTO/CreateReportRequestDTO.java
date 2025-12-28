package com.artifactcomparator.artifact_comparator_backend.DTO;

import com.artifactcomparator.artifact_comparator_backend.Enums.ReportType;
import lombok.Data;

@Data
public class CreateReportRequestDTO {
    private Long taskId;
    private ReportType type;         // ARTIFACT | PARTICIPANT
    private Long artifactId;         // nullable
    private String reportedUsername; // nullable
    private String reason;
    private String description;
    private Long commentId;
}