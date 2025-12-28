package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.Data;
import java.util.List;

@Data
public class ParticipantSubmitResponseDTO {
    private Long taskId;
    private List<String> answers;
}
