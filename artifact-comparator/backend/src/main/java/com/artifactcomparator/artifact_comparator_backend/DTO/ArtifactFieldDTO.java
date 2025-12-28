package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ArtifactFieldDTO {
    private Long artifactId;
    private String filename;
    private String fieldCode;
}
