package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.Service.QuizStatisticService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/quiz-management/{quizId}/quiz-statistics")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class QuizStatisticController {

    private final QuizStatisticService quizStatisticService;

    /**
     * General average grade (percentage) for a quiz.
     * GET /api/quiz-statistics/{quizId}/average
     */
    @GetMapping("/average")
    public Double getQuizAveragePercentage(@PathVariable Long quizId) {
        return quizStatisticService.getQuizAveragePercentage(quizId);
    }

    /**
     * Average grade per question for a quiz.
     * Map: questionId -> average points earned.
     * GET /api/quiz-statistics/{quizId}/per-question
     */
    @GetMapping("/per-question")
    public Map<Long, Double> getQuizPerQuestionAverage(@PathVariable Long quizId) {
        return quizStatisticService.getQuizPerQuestionAverage(quizId);
    }

    /**
     * Optional: combined payload useful for charts.
     * GET /api/quiz-statistics/{quizId}
     */
    @GetMapping
    public QuizStatisticsResponse getQuizStatistics(@PathVariable Long quizId) {
        Double generalAverage = quizStatisticService.getQuizAveragePercentage(quizId);
        Map<Long, Double> perQuestion = quizStatisticService.getQuizPerQuestionAverage(quizId);
        return new QuizStatisticsResponse(generalAverage, perQuestion);
    }

    public record QuizStatisticsResponse(
            Double generalAveragePercentage,
            Map<Long, Double> perQuestionAveragePoints
    ) {}
}
