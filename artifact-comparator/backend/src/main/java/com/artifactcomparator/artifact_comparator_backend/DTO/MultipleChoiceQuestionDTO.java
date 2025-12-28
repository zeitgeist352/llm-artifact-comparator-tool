package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.Data;

import java.util.List;

@Data
public class MultipleChoiceQuestionDTO {
    private String questionText;
    private List<String> options;
    private String correctAnswer;
    private Integer points;
}
