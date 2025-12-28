package com.artifactcomparator.artifact_comparator_backend.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SolidDatasetDTO {

    // JSON top-level:
    // {
    //   "code_examples": [ ... ]
    // }

    @JsonProperty("code_examples")
    private List<SolidExampleDTO> codeExamples;
}
