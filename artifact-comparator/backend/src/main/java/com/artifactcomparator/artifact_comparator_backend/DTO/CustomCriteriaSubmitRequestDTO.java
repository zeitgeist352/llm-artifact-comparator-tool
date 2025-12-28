package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.*;

import java.util.Map;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class CustomCriteriaSubmitRequestDTO {

    private Long taskId;

    // responses["A"]["4"] = "5"
    private Map<String, Map<String, String>> responses;
}
