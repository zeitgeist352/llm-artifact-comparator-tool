package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.ParticipantProgressDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.UpdateStudyRequestDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Enums.*;
import com.artifactcomparator.artifact_comparator_backend.Repository.InvitationRepository;

import java.time.LocalDateTime;
import com.artifactcomparator.artifact_comparator_backend.Enums.PublishStatus;
import com.artifactcomparator.artifact_comparator_backend.Enums.StudyStatus;
import com.artifactcomparator.artifact_comparator_backend.Repository.*;
import com.artifactcomparator.artifact_comparator_backend.Repository.ParticipantTaskResponseRepository;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudyService {

    private final StudyRepository studyRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final ParticipantTaskResponseRepository participantTaskResponseRepository;
    private final EvaluationTaskRepository evaluationTaskRepository;
    private final InvitationRepository invitationRepository;
    private final DefaultCriteriaFactory defaultCriteriaFactory;
    private final NotificationService notificationService;

    private final EvaluationTaskService evaluationTaskService;
    private final QuizResultRepository quizResultRepository;
    private final InvitationTokenRepository invitationTokenRepository;
    private final NotificationRepository notificationRepository;
    private final ResearcherRepository researcherRepository;
    private final EvaluationCriterionRepository evaluationCriterionRepository;
    private final McOptionRepository mcOptionRepository;



    public StudyService(
            StudyRepository studyRepository,
            UserRepository userRepository,
            EvaluationTaskRepository evaluationTaskRepository,
            QuizRepository quizRepository,
            InvitationRepository invitationRepository,
            ParticipantTaskResponseRepository participantTaskResponseRepository,
            DefaultCriteriaFactory defaultCriteriaFactory,
            NotificationService notificationService,

            // 🔥 EK
            EvaluationTaskService evaluationTaskService,
            QuizResultRepository quizResultRepository,
            InvitationTokenRepository invitationTokenRepository,
            NotificationRepository notificationRepository,
            ResearcherRepository researcherRepository,
            EvaluationCriterionRepository evaluationCriterionRepository,
            McOptionRepository mcOptionRepository          // 🔥 EKLE

    ) {
        this.studyRepository = studyRepository;
        this.userRepository = userRepository;
        this.evaluationTaskRepository = evaluationTaskRepository;
        this.quizRepository = quizRepository;
        this.invitationRepository = invitationRepository;
        this.participantTaskResponseRepository = participantTaskResponseRepository;
        this.defaultCriteriaFactory = defaultCriteriaFactory;
        this.notificationService = notificationService;

        // 🔥 EK
        this.evaluationTaskService = evaluationTaskService;
        this.quizResultRepository = quizResultRepository;
        this.invitationTokenRepository = invitationTokenRepository;
        this.notificationRepository = notificationRepository;
        this.researcherRepository = researcherRepository;
        this.evaluationCriterionRepository = evaluationCriterionRepository;
        this.mcOptionRepository = mcOptionRepository; // 🔥 EKLE


    }


    @Transactional
    public void inviteUser(Long studyId, String username, Role role, Long invitedBy) {
        // 1. Find User by Username
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));

        // 2. Find Study
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found with ID: " + studyId));

        // 3. Validate Role
        if (user.getRole() != role) {
            throw new RuntimeException("User " + username + " does not have the role " + role);
        }
        Invitation invitation = invitationRepository.findByStudyIdAndUserId(studyId, user.getId());
        if(invitation != null){
            throw new RuntimeException("User " + username + " already invited to this study! Status is" + invitation);
        }
        // 4. Handle Invite based on Role
        switch (role) {
            case PARTICIPANT:
                // Check if already a participant
                if (study.getParticipants().contains(user)) {
                    throw new RuntimeException("User is already a participant in this study.");
                }
                if ( study.getStatus() != StudyStatus.ACTIVE ){
                    throw new RuntimeException("Study is not active yet! You cannot invite participants.");
                }

                notificationService.notifyParticipantInvitation(user.getId(), studyId);
                break;

            case REVIEWER:
                // Check if already a reviewer
                if (study.getReviewers().contains(user)) {
                    throw new RuntimeException("User is already a reviewer for this study.");
                }
                if (!study.getResearcher().getId().equals(invitedBy)) {
                    throw new RuntimeException("Only the main researcher can invite reviewers.");
                }
                notificationService.notifyReviewerInvitation(user.getId(), studyId);
                break;

            default:
                throw new RuntimeException("Unsupported role for invitation: " + role);
        }
        invitation = Invitation.builder()
                .study(study)
                .user(user)
                .status(Invitation.InvitationStatus.PENDING)
                .invitedAt(LocalDateTime.now())
                .role(role)
                .build();
        invitationRepository.save(invitation);

    }

    @Transactional
    public Study updateArtifactCount(Long studyId, int count) {

        if (count < 1)
            throw new RuntimeException("Artifact count must be at least 1");

        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        study.setArtifactCountPerTask(count);
        study.setUpdatedAt(LocalDateTime.now());

        return studyRepository.save(study);
    }



    // ✅ Create study and assign researcher
    public Study createStudy(Study study, User researcher) {
        study.setResearcher(researcher);
        study.setStatus(StudyStatus.DRAFT);
        study.setCreatedAt(LocalDateTime.now());
        study.setUpdatedAt(LocalDateTime.now());

        if (study.getEndDate() == null) {
            study.setEndDate(LocalDateTime.now().plusMonths(1));
        }

        Study saved = studyRepository.save(study);

        // 🔥 default kriterler otomatik oluşsun
        if (saved.getStudyType() != StudyType.CUSTOM) {
            defaultCriteriaFactory.createDefaultsForStudy(saved);
        }

        return saved;
    }
    public Study approveStudy(Long studyId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        study.setPublishStatus(PublishStatus.ACCEPTED);
        return studyRepository.save(study);
    }

    @Transactional
    public void rejectStudy(Long studyId, String reason) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found with ID: " + studyId));

        study.setPublishStatus(PublishStatus.REJECTED);

        study.setRejectionReason(reason);

        studyRepository.save(study);
    }

    public List<ParticipantProgressDTO> getParticipantsWithProgress(Long studyId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        return study.getParticipants().stream()
                .map(participant -> new ParticipantProgressDTO(
                        participant.getId(),
                        participant.getUsername(),
                        participant.getName(),      // ✅ firstname separately
                        participant.getLastname(),  // ✅ lastname separately
                        calculateProgress(study, participant) // ✅ Returns double, will auto-box to Double
                ))
                .collect(Collectors.toList());
    }




    public Study reportStudy(Long studyId, String reason) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        study.setPublishStatus(PublishStatus.REPORTED);
        // Assuming the field is named rejectReason based on your prompt
        study.setRejectionReason(reason);

        return studyRepository.save(study);
    }
    // ✅ Get all studies
    public List<Study> getAllStudies() {
        return studyRepository.findAll();
    }

    // ✅ Get studies of a researcher
    public List<Study> getStudiesByResearcher(User researcher) {
        List<Study> studies = studyRepository.findByResearcher(researcher);

        // ⏰ Her get isteğinde bitiş tarihi geçmişse otomatik tamamla
        for (Study s : studies) {
            if (s.getEndDate() != null &&
                    s.getEndDate().isBefore(LocalDateTime.now()) &&
                    s.getStatus() != StudyStatus.COMPLETED) {

                s.setStatus(StudyStatus.COMPLETED);
                studyRepository.save(s);
            }
        }
        return studies;
    }

    // ✅ Get a single study by ID (otomatik status update dahil)
    public Study getStudyById(Long id) {
        Study study = studyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Study not found with id " + id));

        // ⏰ Otomatik tamamlanma kontrolü
        if (study.getEndDate() != null &&
                study.getEndDate().isBefore(LocalDateTime.now()) &&
                study.getStatus() != StudyStatus.COMPLETED) {

            study.setStatus(StudyStatus.COMPLETED);
            studyRepository.save(study);
        }

        return study;
    }

    // ✅ Update study details
    public Study updateStudy(Long id, UpdateStudyRequestDTO request, User researcher) {
        Study study = studyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Study not found with id " + id));

        // 🔒 Sadece kendi study'sini güncelleyebilir
        if (!study.getResearcher().getId().equals(researcher.getId())) {
            throw new RuntimeException("Access denied: This study does not belong to you.");
        }

        // 🔹 Null olmayan alanları güncelle
        if (request.getTitle() != null) study.setTitle(request.getTitle());
        if (request.getDescription() != null) study.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            try {
                study.setStatus(StudyStatus.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status: " + request.getStatus());
            }
        }
        if (request.getVisibility() != null) {
            try {
                study.setVisibility(Visibility.valueOf(request.getVisibility().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid visibility value: " + request.getVisibility());
            }
        }

        study.setUpdatedAt(LocalDateTime.now());
        return studyRepository.save(study);
    }

    @Transactional
    public Study assignQuiz(Long studyId, Long quizId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        study.assignQuiz(quiz);  // Uses the assignQuiz() method from Study entity

        return studyRepository.save(study);
    }
    // ✅ Researcher end date update
    public Study updateEndDate(Long id, LocalDateTime newEndDate, User researcher) {
        Study study = studyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Study not found with id " + id));

        // 🔒 Sadece study sahibi değiştirebilir
        if (!study.getResearcher().getId().equals(researcher.getId())) {
            throw new RuntimeException("Access denied: You are not the owner of this study.");
        }

        // ❌ Geçmiş tarih olamaz
        if (newEndDate.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("End date cannot be set in the past.");
        }

        study.setEndDate(newEndDate);
        study.setUpdatedAt(LocalDateTime.now());
        return studyRepository.save(study);
    }

    // ✅ Get all participants of a study
    public List<User> getParticipantsByStudy(Long studyId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found with id " + studyId));
        return study.getParticipants();
    }

    // ✅ Remove participant from a study
    public void removeParticipantFromStudy(Long studyId, Long userId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found with id " + studyId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + userId));

        if (!study.getParticipants().contains(user)) {
            throw new RuntimeException("User is not a participant in this study.");
        }

        study.getParticipants().remove(user);
        studyRepository.save(study);
    }

    // ✅ Get only public and active studies
    public List<Study> getPublicStudies() {
        return studyRepository.findByVisibilityAndStatus(
                com.artifactcomparator.artifact_comparator_backend.Enums.Visibility.PUBLIC,
                StudyStatus.ACTIVE
        );
    }

    // ✅ Kullanıcının katıldığı tüm çalışmaları getir
    public List<Study> getJoinedStudies(User user) {
        return user.getJoinedStudies();
    }

    // ✅ Her çalışma için progress hesapla
    public double calculateProgress(Study study, User participant) {
        List<EvaluationTask> tasks = study.getEvaluationTasks();
        if (tasks.isEmpty()) return 0.0;

        // ✅ Single query to count all completed tasks
        long completed = participantTaskResponseRepository
                .countByParticipantAndTaskIn(participant, tasks);

        return (completed * 100.0) / tasks.size();
    }



    public List<Study> getStudiesForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Ana researcher olduğu study'ler
        List<Study> mainStudies = studyRepository.findByResearcher(user);

        // Accepted co-researcher olduğu study'ler
        List<Study> coStudies = studyRepository
                .findByResearchers_User_IdAndResearchers_Status(userId, Researcher.ResearcherStatus.ACCEPTED);
        // Birleştir
        return java.util.stream.Stream.concat(mainStudies.stream(), coStudies.stream())
                .distinct()
                .toList();
    }

    // ✅ Katılımcının bir görevi tamamlaması
    @Transactional
    public void markTaskAsCompleted(Long taskId, User participant) {
        EvaluationTask task = evaluationTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getCompletedParticipants().contains(participant)) {
            task.getCompletedParticipants().add(participant);
        }
    }

    @Transactional
    public void deleteStudyHard(Long studyId, Long requesterId) {

        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        // 🔒 YETKİ
        if (!study.getResearcher().getId().equals(requesterId)) {
            throw new RuntimeException("Access denied: only the study owner can delete this study");
        }

        // 🔒 ARTIK SADECE DRAFT DEĞİL
        if (!(study.getStatus() == StudyStatus.DRAFT
                || study.getStatus() == StudyStatus.COMPLETED
                || study.getStatus() == StudyStatus.ARCHIVED)) {
            throw new RuntimeException("Study can only be deleted if DRAFT, COMPLETED or ARCHIVED");
        }

        // 1️⃣ TASKS + ALT TABLOLAR
        List<EvaluationTask> tasks = evaluationTaskRepository.findByStudy(study);
        for (EvaluationTask task : tasks) {
            evaluationTaskService.deleteTaskHard(task.getId());
        }

        // 2️⃣ QUIZ RESULT + QUIZ
        quizResultRepository.deleteByStudy(study);

        Quiz quiz = study.getQuiz();
        if (quiz != null) {
            study.removeQuiz();
            studyRepository.save(study);
            quizRepository.delete(quiz);
        }

        // 3️⃣ INVITATION TOKEN + INVITATION
        invitationTokenRepository.deleteByStudy(study);
        invitationRepository.deleteByStudy(study);

        // 4️⃣ NOTIFICATIONS
        notificationRepository.deleteByStudy(study);

        // 5️⃣ CO-RESEARCHERS
        researcherRepository.deleteByStudy(study);

        // 6️⃣ JOIN TABLES
        study.getParticipants().clear();
        study.getReviewers().clear();
        studyRepository.save(study);

        // 🔥🔥🔥 7️⃣ CRITERIA → ÖNCE mc_options
        List<Long> criterionIds =
                evaluationCriterionRepository.findIdsByStudy(study);

        if (!criterionIds.isEmpty()) {
            mcOptionRepository.deleteOptionsByCriterionIds(criterionIds);
        }

        // 🔥 8️⃣ SONRA criteria
        evaluationCriterionRepository.deleteByStudy(study);

        // 9️⃣ FINAL
        studyRepository.delete(study);
    }
}