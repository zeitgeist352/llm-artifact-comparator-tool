package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SolidExampleDTO {

    // JSON içindeki alanlar:
    // "input", "output", "level", "language", "violation"

    private String input;
    private String output;
    private String level;
    private String language;
    private String violation;
}
