package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.Data;

import java.io.File;
import java.util.List;
import java.util.Map;

@Data
public class CodeAnalysisResponse {
    private String fileName;

    // Overall metrics
    private Integer overallComplexity;
    private Integer totalLines;
    private Integer numberOfMethods;
    private Double averageComplexity;

    // Calculation explanation
    private String calculation;

    // Method-level details
    private List<ComplexityMetric> methods;

    // Methods that exceed complexity thresholds
    private List<Map<String, Object>> complexMethods;

    // Optional summary (for error cases)
    private String summary;

    // Visualization
    private String controlFlowDiagram; // Mermaid syntax

    // Metadata
    private String timestamp;
}
