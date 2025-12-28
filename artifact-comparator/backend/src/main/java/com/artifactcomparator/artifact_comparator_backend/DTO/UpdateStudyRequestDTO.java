package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating an existing study.
 * Used by PATCH /api/studies/{id}
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStudyRequestDTO {
    private String title;
    private String description;
    private String status;
    private String visibility;
}
