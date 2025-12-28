package com.artifactcomparator.artifact_comparator_backend.DTO;
import lombok.Data;

@Data
public class QuizCreateDTO {
    private String title;
    private String description;
    private String topic;
    private String difficulty;
}
