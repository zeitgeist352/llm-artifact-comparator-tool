package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.AIQuizGenerationDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.MultipleChoiceQuestionDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.OpenEndedQuestionDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.QuizCreateDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.QuizUpdateDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.Question;
import com.artifactcomparator.artifact_comparator_backend.Entity.Quiz;
import com.artifactcomparator.artifact_comparator_backend.Service.QuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class QuizController {

    private final QuizService quizService;

    @PostMapping("/create")
    public ResponseEntity<Quiz> createEmptyQuiz(@RequestBody QuizCreateDTO dto) {
        try {
            Quiz quiz = quizService.createEmptyQuiz(
                    dto.getTitle(),
                    dto.getDescription(),
                    dto.getTopic(),
                    dto.getDifficulty()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(quiz);
        } catch (Exception e) {
            log.error("Error creating quiz: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/generate")
    public ResponseEntity<Quiz> generateQuizWithAI(@RequestBody AIQuizGenerationDTO dto) {
        try {
            Quiz quiz = quizService.generateQuizWithAI(
                    dto.getTitle(),
                    dto.getDescription(),
                    dto.getTopic(),
                    dto.getDifficulty(),
                    dto.getNumberOfQuestions(),
                    dto.getQuestionType()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(quiz);
        } catch (Exception e) {
            log.error("Error generating AI quiz: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Quiz> getQuizById(@PathVariable Long id) {
        try {
            Quiz quiz = quizService.getQuizById(id);
            return ResponseEntity.ok(quiz);
        } catch (RuntimeException e) {
            log.error("Quiz not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Quiz> updateQuiz(@PathVariable Long id,
                                           @RequestBody QuizUpdateDTO dto) {
        try {
            Quiz updatedQuiz = quizService.updateQuiz(
                    id,
                    dto.getTitle(),
                    dto.getDescription(),
                    dto.getDifficulty()
            );
            return ResponseEntity.ok(updatedQuiz);
        } catch (RuntimeException e) {
            log.error("Error updating quiz: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long id) {
        try {
            quizService.deleteQuiz(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting quiz: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping("/{quizId}/question/multiple-choice")
    public ResponseEntity<Quiz> addMultipleChoiceQuestion(
            @PathVariable Long quizId,
            @RequestBody MultipleChoiceQuestionDTO dto) {
        try {
            Quiz quiz = quizService.addMultipleChoiceQuestion(
                    quizId,
                    dto.getQuestionText(),
                    dto.getOptions(),
                    dto.getCorrectAnswer(),
                    dto.getPoints()
            );
            return ResponseEntity.ok(quiz);
        } catch (RuntimeException e) {
            log.error("Error adding multiple choice question: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Add open-ended question to quiz
     * POST /api/quiz/{quizId}/question/open-ended
     */
    @PostMapping("/{quizId}/question/open-ended")
    public ResponseEntity<Quiz> addOpenEndedQuestion(
            @PathVariable Long quizId,
            @RequestBody OpenEndedQuestionDTO dto) {
        try {
            Quiz quiz = quizService.addOpenEndedQuestion(
                    quizId,
                    dto.getQuestionText(),
                    dto.getPoints()
            );
            return ResponseEntity.ok(quiz);
        } catch (RuntimeException e) {
            log.error("Error adding open-ended question: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Update multiple choice question
     * PUT /api/quiz/{quizId}/question/multiple-choice/{questionId}
     */
    @PutMapping("/{quizId}/question/multiple-choice/{questionId}")
    public ResponseEntity<Quiz> updateMultipleChoiceQuestion(
            @PathVariable Long quizId,
            @PathVariable Long questionId,
            @RequestBody MultipleChoiceQuestionDTO dto) {
        try {
            Quiz quiz = quizService.updateMultipleChoiceQuestion(
                    quizId,
                    questionId,
                    dto.getQuestionText(),
                    dto.getOptions(),
                    dto.getCorrectAnswer(),
                    dto.getPoints()
            );
            return ResponseEntity.ok(quiz);
        } catch (RuntimeException e) {
            log.error("Error updating multiple choice question: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Update open-ended question
     * PUT /api/quiz/{quizId}/question/open-ended/{questionId}
     */
    @PutMapping("/{quizId}/question/open-ended/{questionId}")
    public ResponseEntity<Quiz> updateOpenEndedQuestion(
            @PathVariable Long quizId,
            @PathVariable Long questionId,
            @RequestBody OpenEndedQuestionDTO dto) {
        try {
            Quiz quiz = quizService.updateOpenEndedQuestion(
                    quizId,
                    questionId,
                    dto.getQuestionText(),
                    dto.getPoints()
            );
            return ResponseEntity.ok(quiz);
        } catch (RuntimeException e) {
            log.error("Error updating open-ended question: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Delete question from quiz
     * DELETE /api/quiz/{quizId}/question/{questionId}
     */
    @DeleteMapping("/{quizId}/question/{questionId}")
    public ResponseEntity<Quiz> deleteQuestion(
            @PathVariable Long quizId,
            @PathVariable Long questionId) {
        try {
            Quiz quiz = quizService.deleteQuestion(quizId, questionId);
            return ResponseEntity.ok(quiz);
        } catch (RuntimeException e) {
            log.error("Error deleting question: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get all questions from a quiz
     * GET /api/quiz/{quizId}/questions
     */
    @GetMapping("/{quizId}/questions")
    public ResponseEntity<List<Question>> getAllQuestions(@PathVariable Long quizId) {
        try {
            List<Question> questions = quizService.getAllQuestionsFromQuiz(quizId);
            return ResponseEntity.ok(questions);
        } catch (RuntimeException e) {
            log.error("Error fetching questions: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get specific question from quiz
     * GET /api/quiz/{quizId}/question/{questionId}
     */
    @GetMapping("/{quizId}/question/{questionId}")
    public ResponseEntity<Question> getQuestion(
            @PathVariable Long quizId,
            @PathVariable Long questionId) {
        try {
            Question question = quizService.getQuestionById(quizId, questionId);
            return ResponseEntity.ok(question);
        } catch (RuntimeException e) {
            log.error("Error fetching question: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

}
