package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.CodeAnalysisRequest;
import com.artifactcomparator.artifact_comparator_backend.DTO.CodeAnalysisResponse;
import com.artifactcomparator.artifact_comparator_backend.Service.GeminiCodeAnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/code-analysis")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class CodeAnalysisController {

    private final GeminiCodeAnalysisService analysisService;

    @PostMapping("/cyclomatic")
    public ResponseEntity<CodeAnalysisResponse> analyzeCyclomaticComplexity(
            @Valid @RequestBody CodeAnalysisRequest request) {

        log.info("Received code analysis request");

        try {
            // Perform analysis
            CodeAnalysisResponse response = analysisService.analyzeCyclomaticComplexity(request);

            // Add timestamp
            response.setTimestamp(LocalDateTime.now()
                    .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            response.setFileName(request.getFileName());

            // Generate control flow diagram if requested
            if (request.isIncludeVisualization()) {
                log.info("Generating control flow diagram as requested");
                String diagram = analysisService.generateControlFlowDiagram(
                        request.getCode());
                response.setControlFlowDiagram(diagram);
            }

            log.info("Analysis completed successfully. Overall complexity: {}",
                    response.getOverallComplexity());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error analyzing code: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/diagram")
    public ResponseEntity<Map<String, String>> generateDiagram(
            @Valid @RequestBody CodeAnalysisRequest request) {

        log.info("Received diagram generation request");

        try {
            String mermaidCode = analysisService.generateControlFlowDiagram(
                    request.getCode());

            Map<String, String> response = new HashMap<>();
            response.put("mermaidCode", mermaidCode);
            response.put("timestamp", LocalDateTime.now()
                    .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            log.info("Diagram generated successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error generating diagram: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
