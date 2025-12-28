package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.ManualGradeRequestDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.QuestionDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.QuestionResultDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.QuizAttemptResponseDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.QuizResultResponseDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.QuizSubmissionDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.MultipleChoiceQuestion;
import com.artifactcomparator.artifact_comparator_backend.Entity.Question;
import com.artifactcomparator.artifact_comparator_backend.Entity.Quiz;
import com.artifactcomparator.artifact_comparator_backend.Entity.QuizResult;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Service.GradingService;
import com.artifactcomparator.artifact_comparator_backend.Service.JwtService;
import com.artifactcomparator.artifact_comparator_backend.Service.NotificationService;
import com.artifactcomparator.artifact_comparator_backend.Service.QuizResultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/quiz-attempt")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class QuizAttemptController {
    private final QuizResultService quizResultService;
    private final GradingService gradingService;
    private final JwtService jwtService;
    private final NotificationService notificationService;


    @GetMapping("/start/{studyId}")
    public ResponseEntity<?> startQuiz(
            @PathVariable Long studyId,
            @RequestParam Long participantId) {

        log.info("Participant {} starting quiz for study {}", participantId, studyId);

        try {
            QuizResult quizResult = quizResultService.createQuizResult(studyId, participantId);
            QuizAttemptResponseDTO response = buildQuizAttemptResponse(quizResult);

            log.info("Quiz attempt started with QuizResult id: {}", quizResult.getId());
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("Error starting quiz: {}", e.getMessage(), e);
            // Return error as plain text
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());  // ✅ Simple text error
        }
    }

    @PostMapping("/{quizResultId}/submit")
    public ResponseEntity<QuizResultResponseDTO> submitQuiz(
            @PathVariable Long quizResultId,
            @RequestBody QuizSubmissionDTO submissionDTO) {

        log.info("Submitting quiz attempt {}**********************************************************", quizResultId);
        System.out.println("******************************************************************************");
        try {
            // Submit answers and auto-grade
            QuizResult gradedResult = quizResultService.submitAnswers(
                    quizResultId,
                    submissionDTO.getAnswers()
            );

            // Build response with results
            QuizResultResponseDTO response = buildQuizResultResponse(gradedResult);

            log.info("Quiz submitted and graded. Score: {}/{}",
                    gradedResult.getTotalPointsEarned(),
                    gradedResult.getMaxPossiblePoints());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error submitting quiz: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/result/{quizResultId}")
    public ResponseEntity<QuizResultResponseDTO> getQuizResult(@PathVariable Long quizResultId) {
        log.info("Fetching quiz result {}", quizResultId);

        try {
            QuizResult result = quizResultService.getQuizResultById(quizResultId);
            QuizResultResponseDTO response = buildQuizResultResponse(result);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error fetching quiz result: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/study/{studyId}/participant/{participantId}")
    public ResponseEntity<QuizResultResponseDTO> getParticipantResultForStudy(
            @PathVariable Long studyId,
            @PathVariable Long participantId) {

        log.info("Fetching result for study {} and participant {}", studyId, participantId);

        try {
            QuizResult result = quizResultService.getQuizResultByStudyAndParticipant(studyId, participantId);
            QuizResultResponseDTO response = buildQuizResultResponse(result);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error fetching result: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get all results for a study (Researcher view)
     * GET /api/quiz-attempt/study/{studyId}/results
     */
    @GetMapping("/study/{studyId}/results")
    public ResponseEntity<List<QuizResultResponseDTO>> getAllResultsForStudy(@PathVariable Long studyId) {
        log.info("Fetching all results for study {}", studyId);

        try {
            List<QuizResult> results = quizResultService.getAllResultsForStudy(studyId);
            List<QuizResultResponseDTO> response = results.stream()
                    .map(this::buildQuizResultResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error fetching study results: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/study/{studyId}/check-submission")
    public ResponseEntity<Boolean> checkSubmission(
            @PathVariable Long studyId,
            @RequestParam Long participantId) {

        boolean hasSubmitted = quizResultService.hasParticipantSubmitted(studyId, participantId);
        return ResponseEntity.ok(hasSubmitted);
    }

    private QuizAttemptResponseDTO buildQuizAttemptResponse(QuizResult quizResult) {
        Quiz quiz = quizResult.getQuiz();
        Study study = quizResult.getStudy();

        Map<Long, QuestionDTO> questionDTOs = new HashMap<>();

        for (Question question : quiz.getQuestions()) {
            QuestionDTO dto = QuestionDTO.builder()
                    .id(question.getId())
                    .type(question.getQuestionType())
                    .questionText(question.getQuestionText())
                    .points(question.getPoints())
                    .options(question instanceof MultipleChoiceQuestion
                            ? ((MultipleChoiceQuestion) question).getOptions()
                            : null)
                    .build();

            questionDTOs.put(question.getId(), dto);
        }

        return QuizAttemptResponseDTO.builder()
                .quizResultId(quizResult.getId())
                .studyId(study.getId())
                .studyTitle(study.getTitle())
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .quizDescription(quiz.getDescription())
                .maxPossiblePoints(quiz.getTotalPoints())
                .startedAt(LocalDateTime.now())
                .questions(questionDTOs)
                .build();
    }

    private QuizResultResponseDTO buildQuizResultResponse(QuizResult quizResult) {
        Quiz quiz = quizResult.getQuiz();
        Study study = quizResult.getStudy();
        User participant = quizResult.getParticipant();

        Map<Long, QuestionResultDTO> questionResults = new HashMap<>();

        for (Question question : quiz.getQuestions()) {
            Long qId = question.getId();

            QuestionResultDTO resultDTO = QuestionResultDTO.builder()
                    .questionId(qId)
                    .questionText(question.getQuestionText())
                    .questionType(question.getQuestionType())
                    .participantAnswer(quizResult.getAnswers().get(qId))
                    .pointsEarned(quizResult.getPointsEarned().get(qId))
                    .maxPoints(question.getPoints())
                    .aiFeedback(quizResult.getAiFeedback().get(qId))
                    .build();

            questionResults.put(qId, resultDTO);
        }

        boolean isAccepted = study.getParticipants().contains(participant);

        return QuizResultResponseDTO.builder()
                .id(quizResult.getId())
                .studyId(study.getId())
                .studyTitle(study.getTitle())
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .participantId(participant.getId())
                .participantName(participant.getName() + " " + participant.getLastname())
                .participantUsername(participant.getUsername())
                .submittedAt(quizResult.getSubmittedAt())
                .gradedAt(quizResult.getGradedAt())
                .totalPointsEarned(quizResult.getTotalPointsEarned())
                .maxPossiblePoints(quizResult.getMaxPossiblePoints())
                .percentageScore(quizResult.getPercentageScore())
                .questionResults(questionResults)
                .status(quizResult.getStatus().name())
                .build();
    }

    @PostMapping("/{quizResultId}/accept")
    public ResponseEntity<?> acceptQuizAttempt(@PathVariable Long quizResultId) {
        try {
            quizResultService.acceptAttempt(quizResultId);

            return ResponseEntity.ok("Participant accepted into study");
        } catch (Exception e) {
            log.error("Error accepting attempt: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/{quizResultId}/reject")
    public ResponseEntity<?> rejectQuizAttempt(@PathVariable Long quizResultId) {
        try {
            quizResultService.rejectAttempt(quizResultId);
            return ResponseEntity.ok("Participant rejected from study");
        } catch (Exception e) {
            log.error("Error rejecting attempt: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/my-study-statuses")
    public ResponseEntity<?> getStatuses(@RequestHeader("Authorization") String auth) {

        if (auth == null || !auth.startsWith("Bearer "))
            return ResponseEntity.status(401).build();

        String token = auth.substring(7);
        Long userId = jwtService.validateAndExtractUserId(token);

        Map<Long, String> map = quizResultService.getStatusMapForUser(userId);

        return ResponseEntity.ok(map);
    }

    @PostMapping("/{quizResultId}/manual-grade")
    public ResponseEntity<QuizResultResponseDTO> manualGrade(
            @PathVariable Long quizResultId,
            @RequestBody ManualGradeRequestDTO request
    ) {
        QuizResult updated =
                gradingService.updateOpenEndedQuestionGradeManually(quizResultId,request.getPoints());

        return ResponseEntity.ok(buildQuizResultResponse(updated));
    }
}
