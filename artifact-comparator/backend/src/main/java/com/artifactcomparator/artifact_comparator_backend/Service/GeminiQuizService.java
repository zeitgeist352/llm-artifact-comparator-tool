package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.Entity.MultipleChoiceQuestion;
import com.artifactcomparator.artifact_comparator_backend.Entity.OpenEndedQuestion;
import com.artifactcomparator.artifact_comparator_backend.Entity.Question;
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
public class GeminiQuizService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.timeout:30000}")
    private int timeout;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public GeminiQuizService(WebClient geminiWebClient) {
        this.webClient = geminiWebClient;
        this.objectMapper = new ObjectMapper();
    }

    public List<Question> generateQuestions(String topic, int numberOfQuestions,
                                            String difficulty, String questionType) {
        log.info("Generating {} {} questions about: {}, difficulty: {}",
                numberOfQuestions, questionType, topic, difficulty);

        String prompt = buildPrompt(topic, numberOfQuestions, difficulty, questionType);
        String responseText = callGeminiApi(prompt);

        return parseQuestionsFromResponse(responseText, questionType);
    }

    private String buildPrompt(String topic, int numQuestions, String difficulty, String questionType) {
        if ("MULTIPLE_CHOICE".equals(questionType)) {
            return String.format("""
                You are a quiz generator expert. Create %d %s difficulty multiple-choice questions about "%s".
                
                IMPORTANT REQUIREMENTS:
                1. Use VARIED question types: "What is", "Which", "How does", "Why", "When", "Who", "Where"
                2. The correct answer should be RANDOMLY positioned (A, B, C, or D) - NOT always in position A
                3. Make wrong options plausible but clearly incorrect
                4. Each question must test different aspects of the topic
                
                Return ONLY valid JSON in this EXACT format (no additional text):
                {
                  "questions": [
                    {
                      "questionText": "How does Spring Boot handle dependency injection?",
                      "options": ["Through @Autowired annotation", "Using XML configuration only", "Manual object creation", "Reflection API"],
                      "correctAnswer": "Through @Autowired annotation",
                      "points": 2
                    },
                    {
                      "questionText": "Which annotation marks a class as a REST controller?",
                      "options": ["@Component", "@Service", "@RestController", "@Bean"],
                      "correctAnswer": "@RestController",
                      "points": 1
                    }
                  ]
                }
                
                RULES:
                - Each question must have exactly 4 options
                - correctAnswer MUST be one of the 4 options (exact match)
                - Points: 1 for easy, 2 for medium, 3-5 for hard questions
                - Vary the position of correct answers
                - Use different question formats (not just "What is")
                - NO markdown formatting, NO code blocks, just raw JSON
                """, numQuestions, difficulty, topic);

        } else if ("OPEN_ENDED".equals(questionType)) {
            return String.format("""
                You are a quiz generator expert. Create %d %s difficulty open-ended questions about "%s".
                
                IMPORTANT REQUIREMENTS:
                1. Use VARIED question types: "Explain", "Describe", "Compare", "Analyze", "Discuss"
                2. Questions should require detailed, thoughtful answers
                3. Each question should test different concepts
                
                Return ONLY valid JSON:
                {
                  "questions": [
                    {
                      "questionText": "Explain how dependency injection improves code maintainability in Spring Boot applications.",
                      "points": 5
                    },
                    {
                      "questionText": "Compare @Component and @Service annotations and describe when to use each.",
                      "points": 5
                    }
                  ]
                }
                
                RULES:
                - Use varied question starters (Explain, Describe, Compare, Analyze)
                - Points: 3-5 for easy, 5-8 for medium, 8-10 for hard
                - NO markdown, NO code blocks, just raw JSON
                """, numQuestions, difficulty, topic);

        } else {
            // MIXED type
            return String.format("""
                You are a quiz generator expert. Create %d %s difficulty questions about "%s".
                Mix multiple-choice and open-ended questions (approximately equal split).
                
                IMPORTANT REQUIREMENTS:
                1. Vary question types: "What", "Which", "How", "Why", "Explain", "Compare"
                2. For multiple-choice: randomize correct answer positions (A, B, C, or D)
                3. For open-ended: use varied question starters
                
                Return ONLY valid JSON:
                {
                  "questions": [
                    {
                      "type": "MULTIPLE_CHOICE",
                      "questionText": "Which design pattern does Spring's dependency injection implement?",
                      "options": ["Factory Pattern", "Singleton Pattern", "Dependency Injection Pattern", "Observer Pattern"],
                      "correctAnswer": "Dependency Injection Pattern",
                      "points": 2
                    },
                    {
                      "type": "OPEN_ENDED",
                      "questionText": "Explain the benefits of using Spring Boot over traditional Spring Framework.",
                      "points": 5
                    }
                  ]
                }
                
                RULES:
                - Each question must have a "type" field
                - Multiple-choice must have 4 options
                - correctAnswer must match one option exactly
                - Randomize correct answer positions
                - NO markdown, NO code blocks
                """, numQuestions, difficulty, topic);
        }
    }

    private String callGeminiApi(String prompt) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))
        ));

        // IMPROVED: Better generation config
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.8);      // Increased for more variety
        generationConfig.put("maxOutputTokens", 3000); // Increased for longer responses
        generationConfig.put("topP", 0.95);
        generationConfig.put("topK", 40);
        requestBody.put("generationConfig", generationConfig);

        try {
            log.info("Calling Gemini API...");

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
            throw new RuntimeException("Failed to generate questions: " + e.getMessage());
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

        String cleaned = text.trim()
                .replace("```json", "")
                .replace("`" + "`" + "`", "")  // Alternative way
                .trim();

        log.debug("Cleaned response: {}", cleaned);
        return cleaned;
    }


    private List<Question> parseQuestionsFromResponse(String jsonText, String questionType) {
        List<Question> questions = new ArrayList<>();

        try {
            JsonNode root = objectMapper.readTree(jsonText);
            JsonNode questionsArray = root.path("questions");

            if (questionsArray.isMissingNode() || questionsArray.isEmpty()) {
                throw new RuntimeException("No questions found in Gemini response");
            }

            for (JsonNode questionNode : questionsArray) {
                String type = questionNode.has("type") ?
                        questionNode.get("type").asText() : questionType;

                if ("MULTIPLE_CHOICE".equals(type)) {
                    questions.add(parseMultipleChoiceQuestion(questionNode));
                } else if ("OPEN_ENDED".equals(type)) {
                    questions.add(parseOpenEndedQuestion(questionNode));
                }
            }

            log.info("Successfully parsed {} questions", questions.size());

            // Log for debugging
            questions.forEach(q -> {
                if (q instanceof MultipleChoiceQuestion mcq) {
                    log.debug("MCQ: {}, Options: {}, Correct: {}",
                            mcq.getQuestionText(), mcq.getOptions(), mcq.getCorrectAnswer());
                }
            });

            return questions;

        } catch (Exception e) {
            log.error("Error parsing questions from JSON: {}", e.getMessage());
            log.error("JSON text was: {}", jsonText);
            throw new RuntimeException("Failed to parse generated questions: " + e.getMessage());
        }
    }

    private MultipleChoiceQuestion parseMultipleChoiceQuestion(JsonNode node) {
        MultipleChoiceQuestion question = new MultipleChoiceQuestion();

        question.setQuestionText(node.get("questionText").asText());
        question.setPoints(node.get("points").asInt());
        question.setCorrectAnswer(node.get("correctAnswer").asText());

        // Parse options
        List<String> options = new ArrayList<>();
        node.get("options").forEach(option -> options.add(option.asText()));
        question.setOptions(options);

        // VALIDATION: Ensure correct answer is in options
        if (!options.contains(question.getCorrectAnswer())) {
            log.warn("Correct answer '{}' not found in options: {}. Using first option.",
                    question.getCorrectAnswer(), options);
            question.setCorrectAnswer(options.get(0));
        }

        return question;
    }

    private OpenEndedQuestion parseOpenEndedQuestion(JsonNode node) {
        OpenEndedQuestion question = new OpenEndedQuestion();
        question.setQuestionText(node.get("questionText").asText());
        question.setPoints(node.get("points").asInt());
        return question;
    }
}
