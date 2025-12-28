package com.artifactcomparator.artifact_comparator_backend.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CodeAnalysisRequest {
    @NotBlank(message = "Code cannot be empty")
    @Size(max = 50000, message = "Code size exceeds maximum limit")
    private String code;

    private String fileName; // Optional, for batch processing

    private boolean includeVisualization = false; // Request control flow diagram

}
