package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ResearcherActionLogDTO {
    private String researcherUsername;
    private String action;
    private String targetUsername; // comment owner
    private Long commentId;
    private LocalDateTime createdAt;
}