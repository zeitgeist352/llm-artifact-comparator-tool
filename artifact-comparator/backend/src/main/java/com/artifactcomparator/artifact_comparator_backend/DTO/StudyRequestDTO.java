package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudyRequestDTO {
    private String title;
    private String description;
    private String studyType;

    // 🔥 TEKRAR EKLENİYOR
    private Integer artifactCountPerTask;  // nullable olabilir
}
