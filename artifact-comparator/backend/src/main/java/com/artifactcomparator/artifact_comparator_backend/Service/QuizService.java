package com.artifactcomparator.artifact_comparator_backend.Service;
import com.artifactcomparator.artifact_comparator_backend.Entity.MultipleChoiceQuestion;
import com.artifactcomparator.artifact_comparator_backend.Entity.OpenEndedQuestion;
import com.artifactcomparator.artifact_comparator_backend.Entity.Question;
import com.artifactcomparator.artifact_comparator_backend.Entity.Quiz;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Repository.QuizRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final GeminiQuizService geminiQuizService;
    private final StudyRepository studyRepository;

    @Transactional
    public Quiz createQuiz(String title, String description, String topic,
                           String difficulty, List<Question> questions) {
        log.info("Creating quiz: {} with {} questions", title, questions.size());

        Quiz quiz = new Quiz();
        quiz.setTitle(title);
        quiz.setDescription(description);
        quiz.setTopic(topic);
        quiz.setDifficulty(difficulty);

        // Add all questions to quiz
        for (Question question : questions) {
            quiz.addQuestion(question);
        }

        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Quiz created with ID: {}, Total points: {}",
                savedQuiz.getId(), savedQuiz.getTotalPoints());

        return savedQuiz;
    }

    @Transactional
    public Quiz createEmptyQuiz(String title, String description, String topic, String difficulty) {
        log.info("Creating empty quiz: {}", title);

        Quiz quiz = new Quiz();
        quiz.setTitle(title);
        quiz.setDescription(description);
        quiz.setTopic(topic);
        quiz.setDifficulty(difficulty);

        return quizRepository.save(quiz);
    }

    @Transactional
    public Quiz updateQuiz(Long id, String title, String description, String difficulty) {
        log.info("Updating quiz ID: {}", id);

        Quiz quiz = getQuizById(id);

        if (title != null) quiz.setTitle(title);
        if (description != null) quiz.setDescription(description);
        if (difficulty != null) quiz.setDifficulty(difficulty);

        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Quiz ID: {} updated successfully", id);

        return savedQuiz;
    }

    @Transactional
    public Quiz addMultipleChoiceQuestion(Long quizId, String questionText,
                                          List<String> options, String correctAnswer,
                                          Integer points) {
        log.info("Adding multiple choice question to quiz ID: {}", quizId);

        Quiz quiz = getQuizById(quizId);

        MultipleChoiceQuestion question = new MultipleChoiceQuestion();
        question.setQuestionText(questionText);
        question.setOptions(options);
        question.setCorrectAnswer(correctAnswer);
        question.setPoints(points);

        quiz.addQuestion(question);

        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Question added. Quiz now has {} questions", savedQuiz.getQuestionCount());

        return savedQuiz;
    }

    @Transactional
    public Quiz addOpenEndedQuestion(Long quizId, String questionText, Integer points) {
        log.info("Adding open-ended question to quiz ID: {}", quizId);

        Quiz quiz = getQuizById(quizId);

        OpenEndedQuestion question = new OpenEndedQuestion();
        question.setQuestionText(questionText);
        question.setPoints(points);

        quiz.addQuestion(question);

        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Question added. Quiz now has {} questions", savedQuiz.getQuestionCount());

        return savedQuiz;
    }

    @Transactional
    public Quiz updateMultipleChoiceQuestion(Long quizId, Long questionId,
                                             String questionText, List<String> options,
                                             String correctAnswer, Integer points) {
        log.info("Updating multiple choice question ID: {} in quiz ID: {}", questionId, quizId);

        Quiz quiz = getQuizById(quizId);

        // Find the question
        Question question = quiz.getQuestions().stream()
                .filter(q -> q.getId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Question not found with ID: " + questionId));

        // Verify it's a multiple choice question
        if (!(question instanceof MultipleChoiceQuestion)) {
            throw new RuntimeException("Question ID: " + questionId + " is not a multiple choice question");
        }

        MultipleChoiceQuestion mcq = (MultipleChoiceQuestion) question;

        // Update fields (only if provided)
        if (questionText != null) mcq.setQuestionText(questionText);
        if (options != null && !options.isEmpty()) mcq.setOptions(options);
        if (correctAnswer != null) mcq.setCorrectAnswer(correctAnswer);
        if (points != null) mcq.setPoints(points);

        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Multiple choice question ID: {} updated successfully", questionId);

        return savedQuiz;
    }

    @Transactional
    public Quiz updateOpenEndedQuestion(Long quizId, Long questionId,
                                        String questionText, Integer points) {
        log.info("Updating open-ended question ID: {} in quiz ID: {}", questionId, quizId);

        Quiz quiz = getQuizById(quizId);

        // Find the question
        Question question = quiz.getQuestions().stream()
                .filter(q -> q.getId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Question not found with ID: " + questionId));

        // Verify it's an open-ended question
        if (!(question instanceof OpenEndedQuestion)) {
            throw new RuntimeException("Question ID: " + questionId + " is not an open-ended question");
        }

        OpenEndedQuestion oeq = (OpenEndedQuestion) question;

        // Update fields (only if provided)
        if (questionText != null) oeq.setQuestionText(questionText);
        if (points != null) oeq.setPoints(points);

        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Open-ended question ID: {} updated successfully", questionId);

        return savedQuiz;
    }

    @Transactional
    public Quiz generateQuizWithAI(String title, String description, String topic,
                                   String difficulty, int numberOfQuestions,
                                   String questionType) {
        log.info("Generating AI quiz: {} with {} {} questions",
                title, numberOfQuestions, questionType);

        // Generate questions using Gemini
        List<Question> generatedQuestions = geminiQuizService.generateQuestions(
                topic, numberOfQuestions, difficulty, questionType);

        log.info("Gemini generated {} questions", generatedQuestions.size());

        // Create quiz with generated questions
        return createQuiz(title, description, topic, difficulty, generatedQuestions);
    }

    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }

    public Quiz getQuizById(Long id) {
        return quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found with ID: " + id));
    }

    @Transactional
    public void deleteQuiz(Long quizId) {
        log.info("Deleting quiz with id: {}", quizId);

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        // Remove quiz reference from study
        Study study = quiz.getStudy();
        if (study != null) {
            study.removeQuiz();
            studyRepository.save(study);
        }

        // Delete quiz
        quizRepository.delete(quiz);
        log.info("Quiz deleted successfully");
    }

    @Transactional
    public Quiz deleteQuestion(Long quizId, Long questionId) {
        log.info("Deleting question ID: {} from quiz ID: {}", questionId, quizId);

        Quiz quiz = getQuizById(quizId);

        // Find and remove the question
        boolean removed = quiz.getQuestions().removeIf(q -> q.getId().equals(questionId));

        if (!removed) {
            throw new RuntimeException("Question not found with ID: " + questionId);
        }

        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Question deleted. Quiz now has {} questions", savedQuiz.getQuestionCount());

        return savedQuiz;
    }

    public Question getQuestionById(Long quizId, Long questionId) {
        Quiz quiz = getQuizById(quizId);

        return quiz.getQuestions().stream()
                .filter(q -> q.getId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Question not found with ID: " + questionId));
    }

    public List<Question> getAllQuestionsFromQuiz(Long quizId) {
        Quiz quiz = getQuizById(quizId);
        return quiz.getQuestions();
    }


}
