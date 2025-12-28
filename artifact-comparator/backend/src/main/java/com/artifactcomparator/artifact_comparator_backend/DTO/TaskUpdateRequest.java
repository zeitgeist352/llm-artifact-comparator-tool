package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class TaskUpdateRequest {
    private String questionText;
    private String description;
}
