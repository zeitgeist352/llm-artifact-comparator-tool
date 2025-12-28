package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResultDTO {
    private Long questionId;
    private String questionText;
    private String questionType;
    private String participantAnswer;
    private Double pointsEarned;
    private Integer maxPoints;
    private String aiFeedback;
}
