package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Enums.QuizStatus;
import com.artifactcomparator.artifact_comparator_backend.Repository.QuizRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.QuizResultRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import com.artifactcomparator.artifact_comparator_backend.Service.NotificationService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class QuizResultService {

    private final QuizResultRepository quizResultRepository;
    private final StudyRepository studyRepository;
    private final UserRepository userRepository;
    private final GradingService gradingService;
    private final NotificationService notificationService;

    @Transactional
    public QuizResult createQuizResult(Long studyId, Long participantId) {
        log.info("Creating QuizResult for studyId: {} and participantId: {}", studyId, participantId);

        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found with id: " + studyId));

        if (study.getQuiz() == null) {
            throw new RuntimeException("Study does not have an assigned quiz");
        }

        Quiz quiz = study.getQuiz();

        User participant = userRepository.findById(participantId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + participantId));

        // 1. devam eden (henüz submit edilmemiş) result var mı?
        var existing = quizResultRepository
                .findByStudyIdAndParticipantIdAndSubmittedAtIsNull(studyId, participantId);
        if (existing.isPresent()) {
            log.info("Returning existing unsubmitted QuizResult id: {}", existing.get().getId());
            return existing.get();
        }

// 2. daha önce submit edilmişse 409 döndür
        if (quizResultRepository.existsByStudyIdAndParticipantIdAndSubmittedAtIsNotNull(studyId, participantId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Participant already submitted for this study");
        }

        // 🔹 3. Yeni result oluştur
        QuizResult result = new QuizResult();
        result.setStudy(study);
        result.setQuiz(quiz);
        result.setParticipant(participant);
        result.setMaxPossiblePoints(quiz.getTotalPoints());
        result.setSubmittedAt(null);

        for (Question question : quiz.getQuestions()) {
            result.getAnswers().put(question.getId(), null);
            result.getPointsEarned().put(question.getId(), null);
            result.getAiFeedback().put(question.getId(), null);
        }

        QuizResult savedResult = quizResultRepository.save(result);
        log.info("Created new QuizResult with id: {}", savedResult.getId());
        return savedResult;
    }


    @Transactional
    public QuizResult submitAnswers(Long resultId, Map<Long, String> answers) {
        log.info("Submitting answers for QuizResult id: {}", resultId);

        QuizResult result = quizResultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("QuizResult not found with id: " + resultId));

        // Check if already submitted
        if (result.getSubmittedAt() != null) {
            throw new RuntimeException("Quiz already submitted");
        }
        // Update answers Map
        result.getAnswers().putAll(answers);
        result.setSubmittedAt(LocalDateTime.now());

        QuizResult savedResult = quizResultRepository.save(result);
        log.info("Answers submitted for QuizResult id: {}", resultId);
        Study study = result.getStudy();
        User mainResearcher = study.getResearcher();
        notificationService.notifyResearcherQuizApproval(mainResearcher.getId(), study.getId());
        List<Researcher> researchers = study.getResearchers();
        log.info("Sending notifications to {} researchers for study id: {}", researchers.size(), study.getId());
        for (Researcher researcher : researchers) {
            notificationService.notifyResearcherQuizApproval(researcher.getId(), study.getId());
        }
        try {
            QuizResult gradedResult = gradingService.gradeQuizResult(savedResult.getId());
            log.info("Auto-grading completed for QuizResult id: {}", resultId);
            return gradedResult;
        } catch (Exception e) {
            log.error("Auto-grading failed for QuizResult id: {}", resultId, e);
            // Return submitted result even if grading fails
            // Researcher can manually trigger grading later
            return savedResult;
        }
    }

    /**
     * Get QuizResult by ID
     */
    public QuizResult getQuizResultById(Long id) {
        return quizResultRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("QuizResult not found with id: " + id));
    }

    /**
     * Get participant's result for a specific study
     */
    public QuizResult getQuizResultByStudyAndParticipant(Long studyId, Long participantId) {
        QuizResult result = quizResultRepository.findByStudyIdAndParticipantId(studyId, participantId);
        if (result == null) {
            throw new RuntimeException("No result found for study: " + studyId + " and participant: " + participantId);
        }
        return result;
    }

    /**
     * Get all results for a study (researcher view)
     */
    public List<QuizResult> getAllResultsForStudy(Long studyId) {
        return quizResultRepository.findByStudyId(studyId);
    }

    /**
     * Get all results for a quiz
     */
    public List<QuizResult> getAllResultsForQuiz(Long quizId) {
        return quizResultRepository.findByQuizId(quizId);
    }

    /**
     * Get all quiz results for a participant (participant's history)
     */
    public List<QuizResult> getAllResultsForParticipant(Long participantId) {
        return quizResultRepository.findByParticipantId(participantId);
    }

    /**
     * Check if participant has already submitted for a study
     */
    public boolean hasParticipantSubmitted(Long studyId, Long participantId) {
        return quizResultRepository.existsByStudyIdAndParticipantId(studyId, participantId);
    }

    /**
     * Get participant's result for a specific quiz
     */
    public QuizResult getQuizResultByQuizAndParticipant(Long quizId, Long participantId) {
        QuizResult result = quizResultRepository.findByQuizIdAndParticipantId(quizId, participantId);
        if (result == null) {
            throw new RuntimeException("No result found for quiz: " + quizId + " and participant: " + participantId);
        }
        return result;
    }

    /**
     * Delete a quiz result
     */
    @Transactional
    public void deleteQuizResult(Long id) {
        log.info("Deleting QuizResult with id: {}", id);

        if (!quizResultRepository.existsById(id)) {
            throw new RuntimeException("QuizResult not found with id: " + id);
        }

        quizResultRepository.deleteById(id);
        log.info("Deleted QuizResult with id: {}", id);
    }

    /**
     * Manually trigger grading (if auto-grading failed or for re-grading)
     */
    @Transactional
    public QuizResult manuallyGradeResult(Long resultId) {
        log.info("Manually triggering grading for QuizResult id: {}", resultId);
        return gradingService.gradeQuizResult(resultId);
    }

    @Transactional
    public void acceptAttempt(Long quizResultId) {
        QuizResult quizResult = quizResultRepository.findById(quizResultId)
                .orElseThrow(() -> new RuntimeException("QuizResult not found"));

        quizResult.setStatus(QuizStatus.ACCEPTED);

        User participant = quizResult.getParticipant();
        Study study = quizResult.getStudy();

        // Study'nin participants set'ine ekle
        study.getParticipants().add(participant);

        studyRepository.save(study); // ManyToMany join tablosu update olur
        notificationService.notifyParticipantAccepted(participant.getId(), study.getId());
    }

    @Transactional
    public void rejectAttempt(Long quizResultId) {
        QuizResult qr = quizResultRepository.findById(quizResultId)
                .orElseThrow(() -> new RuntimeException("QuizResult not found"));

        // Status güncelle
        qr.setStatus(QuizStatus.REJECTED);

        quizResultRepository.save(qr);
    }

    public Map<Long, String> getStatusMapForUser(Long userId) {
        List<QuizResult> results = quizResultRepository.findByParticipantId(userId);

        Map<Long, String> map = new HashMap<>();

        for (QuizResult qr : results) {
            Long studyId = qr.getStudy().getId();
            map.put(studyId, qr.getStatus().name()); // ACCEPTED / REJECTED / PENDING
        }

        return map;
    }
}

