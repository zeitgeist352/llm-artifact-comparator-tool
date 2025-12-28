package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudyResponseDTO {
    private Long id;
    private String title;
    private String status;
    private String publishStatus;
    private int participantCount;
    private String researcher;
}
