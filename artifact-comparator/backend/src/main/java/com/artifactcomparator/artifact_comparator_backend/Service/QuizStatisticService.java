package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.Entity.QuizResult;
import org.springframework.stereotype.Service;

import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static java.util.Arrays.stream;

@Service
public class QuizStatisticService {
    private final QuizResultService quizResultService;

    public QuizStatisticService(QuizResultService quizResultService) {
        this.quizResultService = quizResultService;
    }

    public Double getQuizAveragePercentage(Long quizId) {
        List<QuizResult> results = quizResultService.getAllResultsForQuiz(quizId)
                .stream()
                .filter(r -> r.getSubmittedAt() != null && r.getPercentageScore() != null)
                .toList();

        if (results.isEmpty()) {
            return 0.0;
        }

        return results.stream()
                .collect(Collectors.averagingDouble(QuizResult::getPercentageScore));
    }

    public Map<Long, Double> getQuizPerQuestionAverage(Long quizId) {
        List<QuizResult> results = quizResultService.getAllResultsForQuiz(quizId)
                .stream()
                .filter(r -> r.getSubmittedAt() != null)
                .toList();

        return computePerQuestionAverage(results);
    }

    private Map<Long, Double> computePerQuestionAverage(List<QuizResult> results) {
        if (results.isEmpty()) {
            return Map.of();
        }

        Map<Long, DoubleSummaryStatistics> statsByQuestion = results.stream()
                .flatMap(r -> r.getPointsEarned().entrySet().stream())
                .filter(e -> e.getValue() != null)
                .collect(Collectors.groupingBy(
                        Map.Entry::getKey,
                        Collectors.summarizingDouble(Map.Entry::getValue)
                ));

        return statsByQuestion.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().getAverage()
                ));
    }


}
