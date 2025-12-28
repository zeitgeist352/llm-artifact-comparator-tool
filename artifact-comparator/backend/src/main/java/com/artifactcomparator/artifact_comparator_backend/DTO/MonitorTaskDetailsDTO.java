package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
public class MonitorTaskDetailsDTO {

    private Long taskId;
    private String questionText;

    private List<CriterionDTO> criteria;
    private List<CriterionDistributionDTO> distribution;
    private List<ParticipantAnswerDTO> participants;

    @Data
    @AllArgsConstructor
    public static class CriterionDTO {
        private Long id;
        private String label;
        private String correctAnswer;   // 🔥 EKLENDİ
    }

    @Data
    @AllArgsConstructor
    public static class CriterionDistributionDTO {
        private Long criterionId;
        private String label;
        private Map<String, Integer> options;

        private String correctAnswer;  // 🔥 EKLENDİ
    }

    @Data
    @AllArgsConstructor
    public static class ParticipantAnswerDTO {
        private String username;
        private List<String> answers;
    }
}
