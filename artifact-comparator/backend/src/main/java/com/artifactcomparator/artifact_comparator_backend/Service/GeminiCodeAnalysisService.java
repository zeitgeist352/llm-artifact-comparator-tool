package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.CodeAnalysisRequest;
import com.artifactcomparator.artifact_comparator_backend.DTO.CodeAnalysisResponse;
import com.artifactcomparator.artifact_comparator_backend.DTO.ComplexityMetric;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiCodeAnalysisService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.timeout:30000}")
    private int timeout;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public GeminiCodeAnalysisService(WebClient geminiWebClient) {
        this.webClient = geminiWebClient;
        this.objectMapper = new ObjectMapper();
    }

    public CodeAnalysisResponse analyzeCyclomaticComplexity(CodeAnalysisRequest request) {
        log.info("Starting cyclomatic complexity analysis for code of length: {}",
                request.getCode().length());

        String prompt = buildCyclomaticComplexityPrompt(request.getCode());

        String responseText = callGeminiApi(prompt);

        return parseAnalysisResponse(responseText);
    }

    public String generateControlFlowDiagram(String code) {
        log.info("Generating control flow diagram");

        String prompt = buildControlFlowDiagramPrompt(code);
        String response = callGeminiApi(prompt);

        return cleanMermaidCode(response);
    }

    private String buildCyclomaticComplexityPrompt(String code) {
        return """
        You are an expert code analyzer. Calculate the cyclomatic complexity of the following code.
        
        CODE TO ANALYZE:
```""" + code + """
        
```
        
        INSTRUCTIONS:
        Calculate cyclomatic complexity using the formula: M = E - N + 2P where:
        - E = number of edges in the control flow graph
        - N = number of nodes in the control flow graph
        - P = number of connected components (typically 1 for a single program)
        
        Alternative formula: M = D + 1 where D is the number of decision points:
        - if, else if, for, while, do-while, case statements
        - logical operators (&&, ||) in conditions
        - ternary operators (? :)
        - catch blocks
        
        Return ONLY the following JSON format (no markdown, no code blocks, no explanations):
        {
          "overallComplexity": 15,
          "totalLines": 120,
          "numberOfMethods": 5,
          "averageComplexity": 3.0,
          "methods": [
            {
              "methodName": "processData",
              "complexity": 8,
              "startLine": 10,
              "endLine": 45,
              "decisionPoints": ["if (x > 0)", "for loop", "while (y < 10)", "try-catch", "switch case"],
              "calculation": "1 base + 7 decision points = 8"
            }
          ],
          "complexMethods": [
            {
              "methodName": "calculateResult",
              "complexity": 12,
              "decisionPoints": ["if", "else if", "for", "while", "&&", "||", "switch", "case", "case", "case", "catch", "ternary"]
            }
          ],
          "calculation": "Total decision points across all methods + number of methods"
        }
        
        Provide only factual measurements. Do not include recommendations, risk levels, summaries, or subjective analysis.
        """;
    }

    /**
     * Batch analysis for multiple code files
     */
    public List<CodeAnalysisResponse> analyzeBatch(List<CodeAnalysisRequest> requests) {
        log.info("Starting batch analysis for {} files", requests.size());

        List<CodeAnalysisResponse> responses = new ArrayList<>();

        for (CodeAnalysisRequest request : requests) {
            try {
                CodeAnalysisResponse response = analyzeCyclomaticComplexity(request);
                response.setFileName(request.getFileName());
                responses.add(response);
            } catch (Exception e) {
                log.error("Failed to analyze file: {}", request.getFileName(), e);
                CodeAnalysisResponse errorResponse = new CodeAnalysisResponse();
                errorResponse.setFileName(request.getFileName());
                errorResponse.setSummary("Analysis failed: " + e.getMessage());
                responses.add(errorResponse);
            }
        }

        return responses;
    }

    private String callGeminiApi(String prompt) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))
        ));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.2);  // Lower for consistent factual analysis
        generationConfig.put("maxOutputTokens", 4000);
        generationConfig.put("topP", 0.95);
        generationConfig.put("topK", 40);
        requestBody.put("generationConfig", generationConfig);

        try {
            log.info("Calling Gemini API for code analysis...");

            String response = webClient.post()
                    .uri(uriBuilder -> uriBuilder.queryParam("key", apiKey).build())
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(timeout))
                    .block();

            log.info("Received response from Gemini");
            return extractTextFromResponse(response);

        } catch (Exception e) {
            log.error("Error calling Gemini API: {}", e.getMessage());
            throw new RuntimeException("Failed to communicate with Gemini API: " + e.getMessage());
        }
    }

    private String extractTextFromResponse(String response) throws Exception {
        JsonNode root = objectMapper.readTree(response);
        String text = root.path("candidates")
                .get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text")
                .asText();

        // Clean markdown formatting
        String cleaned = text.trim()
                .replace("```json", "")
                .replace("```", "")
                .trim();

        log.debug("Cleaned response: {}", cleaned);
        return cleaned;
    }

    private String buildControlFlowDiagramPrompt(String code) {
        return """
            Analyze the following code and create a control flow diagram in Mermaid syntax.
            
            CODE:
            ```
            """ + code + """
            ```
            Generate a Mermaid flowchart that shows:
            - Method calls and their relationships
            - Decision points (if/else, switch)
            - Loops (for, while)
            - Complex branching paths
            
            Return ONLY the Mermaid syntax (starting with 'graph TD' or 'flowchart TD'), no additional text.
            """;
    }

    // ==================== RESPONSE PARSING ====================

    private CodeAnalysisResponse parseAnalysisResponse(String jsonText) {
        try {
            JsonNode root = objectMapper.readTree(jsonText);

            CodeAnalysisResponse response = new CodeAnalysisResponse();

            // Parse basic metrics
            response.setOverallComplexity(root.path("overallComplexity").asInt());
            response.setTotalLines(root.path("totalLines").asInt());
            response.setNumberOfMethods(root.path("numberOfMethods").asInt());
            response.setAverageComplexity(root.path("averageComplexity").asDouble());
            response.setCalculation(root.path("calculation").asText(null));

            // Parse methods with decision points
            response.setMethods(parseMethodsArray(root.path("methods")));

            // Parse complex methods
            response.setComplexMethods(parseComplexMethodsArray(root.path("complexMethods")));

            log.info("Successfully parsed code analysis response");
            return response;

        } catch (Exception e) {
            log.error("Error parsing analysis response: {}", e.getMessage());
            log.error("JSON text was: {}", jsonText);
            throw new RuntimeException("Failed to parse code analysis: " + e.getMessage());
        }
    }

    private List<ComplexityMetric> parseMethodsArray(JsonNode methodsArray) {
        List<ComplexityMetric> methods = new ArrayList<>();

        for (JsonNode methodNode : methodsArray) {
            ComplexityMetric metric = new ComplexityMetric();
            metric.setMethodName(methodNode.path("methodName").asText());
            metric.setComplexity(methodNode.path("complexity").asInt());
            metric.setStartLine(methodNode.path("startLine").asInt());
            metric.setEndLine(methodNode.path("endLine").asInt());
            metric.setCalculation(methodNode.path("calculation").asText(null));

            // Parse decision points array
            List<String> decisionPoints = new ArrayList<>();
            JsonNode dpArray = methodNode.path("decisionPoints");
            for (JsonNode dp : dpArray) {
                decisionPoints.add(dp.asText());
            }
            metric.setDecisionPoints(decisionPoints);

            // Auto-calculate risk level based on complexity
            metric.setRiskLevel(calculateRiskLevel(metric.getComplexity()));

            methods.add(metric);
        }

        return methods;
    }

    private List<Map<String, Object>> parseComplexMethodsArray(JsonNode complexArray) {
        List<Map<String, Object>> complexMethods = new ArrayList<>();

        for (JsonNode complexNode : complexArray) {
            Map<String, Object> complexMethod = new HashMap<>();
            complexMethod.put("methodName", complexNode.path("methodName").asText());
            complexMethod.put("complexity", complexNode.path("complexity").asInt());

            // Parse decision points
            List<String> decisionPoints = new ArrayList<>();
            JsonNode dpArray = complexNode.path("decisionPoints");
            for (JsonNode dp : dpArray) {
                decisionPoints.add(dp.asText());
            }
            complexMethod.put("decisionPoints", decisionPoints);

            complexMethods.add(complexMethod);
        }

        return complexMethods;
    }

    // ==================== HELPER METHODS ====================

    private String calculateRiskLevel(int complexity) {
        if (complexity <= 5) {
            return "LOW";
        } else if (complexity <= 10) {
            return "MEDIUM";
        } else if (complexity <= 20) {
            return "HIGH";
        } else {
            return "CRITICAL";
        }
    }

    private String cleanMermaidCode(String response) {
        return response.trim()
                .replace("```mermaid", "")
                .replace("```", "")
                .trim();
    }

}
