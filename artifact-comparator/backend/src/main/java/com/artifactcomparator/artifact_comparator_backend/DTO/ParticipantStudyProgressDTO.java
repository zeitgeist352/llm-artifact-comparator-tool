package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ParticipantStudyProgressDTO {
    private Long id;
    private String title;
    private String description;
    private double progress;
}