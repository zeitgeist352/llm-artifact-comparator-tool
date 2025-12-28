package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.Data;

@Data
public class QuizUpdateDTO {
    private String title;
    private String description;
    private String difficulty;
}
