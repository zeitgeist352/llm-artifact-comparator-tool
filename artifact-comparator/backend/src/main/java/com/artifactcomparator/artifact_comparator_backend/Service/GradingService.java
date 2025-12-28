package com.artifactcomparator.artifact_comparator_backend.Service;


import com.artifactcomparator.artifact_comparator_backend.DTO.GradingResult;
import com.artifactcomparator.artifact_comparator_backend.Entity.MultipleChoiceQuestion;
import com.artifactcomparator.artifact_comparator_backend.Entity.OpenEndedQuestion;
import com.artifactcomparator.artifact_comparator_backend.Entity.Question;
import com.artifactcomparator.artifact_comparator_backend.Entity.Quiz;
import com.artifactcomparator.artifact_comparator_backend.Entity.QuizResult;
import com.artifactcomparator.artifact_comparator_backend.Repository.QuizResultRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class GradingService {

    private final QuizResultRepository quizResultRepository;
    private final GeminiGradingService geminiGradingService;



    @Transactional
    public QuizResult gradeQuizResult(Long resultId) {
        log.info("Starting grading for QuizResult id: {}", resultId);

        QuizResult result = quizResultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("QuizResult not found with id: " + resultId));

        // Validate result has been submitted
        if (result.getSubmittedAt() == null) {
            throw new RuntimeException("Cannot grade: Quiz not yet submitted");
        }

        // Validate not already graded
        if (result.getGradedAt() != null) {
            log.warn("QuizResult {} already graded at {}", resultId, result.getGradedAt());
            return result;
        }

        Quiz quiz = result.getQuiz();

        // Grade each question
        for (Question question : quiz.getQuestions()) {
            Long questionId = question.getId();
            String participantAnswer = result.getAnswers().get(questionId);

            // Skip if no answer provided
            if (participantAnswer == null || participantAnswer.trim().isEmpty()) {
                result.getPointsEarned().put(questionId, 0.0);
                log.info("Question {} not answered, assigned 0 points", questionId);
                continue;
            }

            // Grade based on question type
            if (question instanceof MultipleChoiceQuestion) {
                gradeMultipleChoice(result, (MultipleChoiceQuestion) question, participantAnswer);
            } else if (question instanceof OpenEndedQuestion) {
                gradeOpenEnded(result, (OpenEndedQuestion) question, participantAnswer);
            }
        }

        // Calculate total score
        result.calculateTotalPoints();
        result.setGradedAt(LocalDateTime.now());

        QuizResult gradedResult = quizResultRepository.save(result);
        log.info("Completed grading for QuizResult id: {}. Total score: {}/{}",
                resultId, gradedResult.getTotalPointsEarned(), gradedResult.getMaxPossiblePoints());

        return gradedResult;
    }

    private void gradeMultipleChoice(QuizResult result, MultipleChoiceQuestion question, String participantAnswer) {
        Long questionId = question.getId();

        boolean isCorrect = question.isCorrectAnswer(participantAnswer);
        double points = isCorrect ? question.getPoints() : 0.0;

        result.getPointsEarned().put(questionId, points);

        log.info("Multiple Choice Question {}: Answer '{}' is {} (Points: {}/{})",
                questionId, participantAnswer, isCorrect ? "CORRECT" : "INCORRECT",
                points, question.getPoints());
    }

    private void gradeOpenEnded(QuizResult result, OpenEndedQuestion question, String participantAnswer) {
        Long questionId = question.getId();

        try {
            log.info("Sending Open-Ended Question {} to Gemini for grading", questionId);

            // Call Gemini to grade the answer
            GradingResult gradingResult = geminiGradingService.gradeOpenEndedAnswer(
                    question.getQuestionText(),
                    participantAnswer,
                    question.getPoints()
            );

            // Store points and feedback
            result.getPointsEarned().put(questionId, gradingResult.getScore());
            result.getAiFeedback().put(questionId, gradingResult.getFeedback());

            log.info("Open-Ended Question {} graded by Gemini: {}/{} points",
                    questionId, gradingResult.getScore(), question.getPoints());

        } catch (Exception e) {
            log.error("Error grading Open-Ended Question {}: {}", questionId, e.getMessage());

            // On error, assign 0 points and store error message
            result.getPointsEarned().put(questionId, 0.0);
            result.getAiFeedback().put(questionId, "Grading failed: " + e.getMessage());
        }
    }

    @Transactional
    public QuizResult updateOpenEndedQuestionGradeManually (Long resultId, Map<Long, Double> updatedGrades) {
        QuizResult result = quizResultRepository.findById(resultId).orElseThrow(() -> new RuntimeException("QuizResult not found with id: " + resultId));



        if (updatedGrades == null || updatedGrades.isEmpty()) {
            // No grades provided → no-op
            log.info("No manual grades provided for QuizResult {}", resultId);
            return result;
        }

        Map<Long, Question> questionMap = result.getQuiz().getQuestions().stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        for (Map.Entry<Long, Double> entry : updatedGrades.entrySet()) {
            Long questionId = entry.getKey();
            Double newGrade = entry.getValue();

            Question question = questionMap.get(questionId);
            result.getPointsEarned().put(questionId, newGrade);
        }

        result.calculateTotalPoints();

        return quizResultRepository.save(result);
    }

}
