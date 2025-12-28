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
public class QuizResultResponseDTO {
    private Long id;
    private Long studyId;
    private String studyTitle;
    private Long quizId;
    private String quizTitle;
    private Long participantId;
    private String participantName;
    private String participantUsername;
    private String participantEmail;
    private String status;

    // Submission info
    private LocalDateTime submittedAt;
    private LocalDateTime gradedAt;

    // Scores
    private Double totalPointsEarned;
    private Integer maxPossiblePoints;
    private Double percentageScore;

    // Detailed results per question
    private Map<Long, QuestionResultDTO> questionResults;
}
