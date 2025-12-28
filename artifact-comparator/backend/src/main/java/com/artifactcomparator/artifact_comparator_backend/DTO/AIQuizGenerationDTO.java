package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.Data;

@Data
public class AIQuizGenerationDTO{
    private String title;
    private String description;
    private String topic;
    private String difficulty;
    private Integer numberOfQuestions;
    private String questionType; // "MULTIPLE_CHOICE", "OPEN_ENDED", or "MIXED"
}

