package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.Data;

import java.util.List;

@Data
public class ComplexityMetric {

    private String methodName;

    private Integer complexity;

    private Integer startLine;

    private Integer endLine;

    private List<String> decisionPoints; // List of decision points found

    private String calculation; // Explanation of how complexity was calculated

    private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL (auto-calculated)

    /**
     * Get color code for UI display based on risk level
     */
    public String getRiskLevelColor() {
        return switch (riskLevel) {
            case "LOW" -> "#22c55e";       // green-500
            case "MEDIUM" -> "#eab308";    // yellow-500
            case "HIGH" -> "#f97316";      // orange-500
            case "CRITICAL" -> "#ef4444";  // red-500
            default -> "#6b7280";          // gray-500
        };
    }

    /**
     * Get human-readable description of risk level
     */
    public String getRiskDescription() {
        return switch (riskLevel) {
            case "LOW" -> "Simple and maintainable";
            case "MEDIUM" -> "Moderate complexity";
            case "HIGH" -> "Complex, consider refactoring";
            case "CRITICAL" -> "Very complex, refactoring recommended";
            default -> "Unknown";
        };
    }
}
