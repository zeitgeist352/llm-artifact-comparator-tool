package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionDTO {
    private Long id;
    private String type;  // "MULTIPLE_CHOICE" or "OPEN_ENDED"
    private String questionText;
    private Integer points;
    private List<String> options;  // Only for multiple choice, null for open-ended
}
