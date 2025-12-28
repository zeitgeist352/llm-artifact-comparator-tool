package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.GradingResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@Slf4j
public class GeminiGradingService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String apiKey;

    public GeminiGradingService(WebClient webClient) {
        this.webClient = webClient;
        this.objectMapper = new ObjectMapper();
    }

    public GradingResult gradeOpenEndedAnswer(String questionText, String studentAnswer, Integer maxPoints) {
        log.info("Grading open-ended answer with Gemini (max points: {})", maxPoints);

        String prompt = buildGradingPrompt(questionText, studentAnswer, maxPoints);

        try {
            String response = callGeminiApi(prompt);
            GradingResult result = parseGradingResponse(response, maxPoints);

            log.info("Gemini grading completed: {}/{} points", result.getScore(), maxPoints);
            return result;

        } catch (Exception e) {
            log.error("Gemini grading failed: {}", e.getMessage());
            throw new RuntimeException("AI grading failed: " + e.getMessage(), e);
        }
    }

    /**
     * Build the grading prompt for Gemini
     */
    private String buildGradingPrompt(String question, String answer, Integer maxPoints) {
        return String.format("""
            You are an expert grader evaluating student responses.
            
            Question: %s
            Student Answer: %s
            Maximum Points: %d
            
            Evaluate the student's answer and respond ONLY with valid JSON in this exact format:
            {
              "score": <number between 0 and %d>,
              "feedback": "<constructive feedback explaining the score in 2-3 sentences>"
            }
            
            Grading criteria:
            - Award full points (%d) if the answer is comprehensive, accurate, and demonstrates clear understanding
            - Award partial credit for partially correct or incomplete answers (proportional to correctness)
            - Award 0 points for incorrect, irrelevant, or off-topic answers
            - Be fair and consistent
            - Consider the depth of understanding, not just keywords
            Respond ONLY with the JSON object, no additional text.
            """, question, answer, maxPoints, maxPoints, maxPoints);
    }

    private String callGeminiApi(String prompt) throws Exception {
        String requestBody = String.format("""
            {
              "contents": [{
                "parts": [{
                  "text": "%s"
                }]
              }]
            }
            """, prompt.replace("\"", "\\\"").replace("\n", "\\n"));

        String response = webClient.post()
                .uri(uriBuilder -> uriBuilder.queryParam("key", apiKey).build())
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        if (response == null) {
            throw new RuntimeException("No response from Gemini API");
        }

        return response;
    }

    private GradingResult parseGradingResponse(String response, Integer maxPoints) throws Exception {
        JsonNode root = objectMapper.readTree(response);

        // Extract text from response structure
        String text = root.path("candidates")
                .get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text")
                .asText();

        // Remove markdown code blocks if present
        //text = text.replace("``````", "").trim();
        text = text.replace("```json", "");
        text = text.replace("```", "").trim();


        // Parse JSON result
        JsonNode gradingJson = objectMapper.readTree(text);

        double score = gradingJson.get("score").asDouble();
        String feedback = gradingJson.get("feedback").asText();

        // Validate score is within range
        if (score < 0 || score > maxPoints) {
            log.warn("Gemini returned score {} which is out of range 0-{}, capping it", score, maxPoints);
            score = Math.max(0, Math.min(score, maxPoints));
        }

        GradingResult result = new GradingResult();
        result.setScore(score);
        result.setFeedback(feedback);

        return result;
    }
}
