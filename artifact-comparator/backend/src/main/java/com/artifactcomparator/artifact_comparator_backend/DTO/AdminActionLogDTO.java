package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AdminActionLogDTO {
    private String adminUsername;
    private String actionType;
    private String description;
    private LocalDateTime timestamp;
}
