package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttemptResponseDTO {
    private Long quizResultId;
    private Long studyId;
    private String studyTitle;
    private Long quizId;
    private String quizTitle;
    private String quizDescription;
    private Integer maxPossiblePoints;
    private LocalDateTime startedAt;

    // Quiz questions for participant to answer
    private Map<Long, QuestionDTO> questions;  // questionId -> question details

}
