package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.NotificationDto;
import com.artifactcomparator.artifact_comparator_backend.Entity.Notification;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Enums.NotificationTypes;
import com.artifactcomparator.artifact_comparator_backend.Enums.QuizStatus;
import com.artifactcomparator.artifact_comparator_backend.Repository.NotificationRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.QuizResultRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;

@Service
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final StudyRepository studyRepository;
    private final QuizResultRepository quizResultRepository;

//    import com.artifactcomparator.artifact_comparator_backend.Service.NotificationService;
//    private final NotificationService notificationService;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               StudyRepository studyRepository,
                               QuizResultRepository quizResultRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.studyRepository = studyRepository;
        this.quizResultRepository = quizResultRepository;
    }

    // ==========================================
    // Public API: Specific Notification Triggers

    // ==========================================
    @Transactional
    public void notifyParticipantAccepted(Long userId, Long studyId) {
        createNotification(userId, studyId, NotificationTypes.ACCEPTED_TO_STUDY_PARTICIPANT, null);
    }

    @Transactional
    public void notifyParticipantInvitation(Long userId, Long studyId) {
        createNotification(userId, studyId, NotificationTypes.INVITATION_TO_STUDY_PARTICIPANT, null);
    }

    @Transactional
    public void notifyResearcherQuizApproval(Long userId, Long studyId) {
        createNotification(userId, studyId, NotificationTypes.WAITING_FOR_QUIZ_APPROVAL_RESEARCHER, null);
    }
    @Transactional
    public void notifyResearcherInvitation(Long userId, Long studyId) {
        createNotification(userId, studyId, NotificationTypes.INVITATION_TO_STUDY_RESEARCHER, null);
    }

    @Transactional
    public void notifyResearcherStudyReported(Long userId, Long studyId, boolean IsAccepted) {
        Study study = null;
        String studyTitle = "";

        if (studyId != null) {
            study = studyRepository.findById(studyId)
                    .orElseThrow(() -> new RuntimeException("Study not found: " + studyId));
            studyTitle = study.getTitle();
        }
        createNotification(userId, studyId, NotificationTypes.STUDY_REPORTED_ACCEPTED_RESEARCHER, IsAccepted ? "INFO: Your study '"+ studyTitle +"' has been accepted by the reviewer." : "ALERT: Your study '"+ studyTitle +"' has been reported by the reviewer.");
    }


    @Transactional
    public void notifyResearcherStudyBlocked(Long userId, Long studyId) {
        createNotification(userId, studyId, NotificationTypes.STUDY_BLOCKED_RESEARCHER, null);
    }

    @Transactional
    public void notifyResearcherStudyCompleted(Long userId, Long studyId) {
        createNotification(userId, studyId, NotificationTypes.STUDY_COMPLETED_BY_ALL_PARTICIPANTS_RESEARCHER, null);
    }

    @Transactional
    public void notifyReviewerInvitation(Long userId, Long studyId) {
        createNotification(userId, studyId, NotificationTypes.INVITATION_TO_STUDY_REVIEWER, null);
    }

    /**
     * Sends a notification to ALL admins that a study has been reported.
     */

    @Transactional
    public void notifyUserAccountChanged(Long userId) {
        // Study ID is null for generic user info changes
        createNotification(userId, null, NotificationTypes.USER_INFO_CHANGED_BY_ADMIN_FORALL, null);
    }
    // ==========================================

    // Helper Methods & Core Logic
    // ==========================================

    /**
     * Core method to build and save the notification.
     * Generates a default message if customMessage is null.
     */

    private void createNotification(Long userId, Long studyId, NotificationTypes type, String customMessage) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Study study = null;
        String studyTitle = "";

        if (studyId != null) {
            study = studyRepository.findById(studyId)
                    .orElseThrow(() -> new RuntimeException("Study not found: " + studyId));
            studyTitle = study.getTitle();
        }
        String finalMessage;
        if( customMessage == null) {
            Long userCount = 0L;

            if(type == NotificationTypes.WAITING_FOR_QUIZ_APPROVAL_RESEARCHER) userCount = quizResultRepository.countByStudyIdAndStatus(studyId, QuizStatus.PENDING) ;
            finalMessage = switch (type) {
                case ACCEPTED_TO_STUDY_PARTICIPANT -> "You have been accepted into the study: " + studyTitle;
                case INVITATION_TO_STUDY_PARTICIPANT ->
                        "You have received an invitation to join the study: " + studyTitle;
                case WAITING_FOR_QUIZ_APPROVAL_RESEARCHER ->
                        "There are " + userCount + " quizzes is waiting for approval for study '" + studyTitle + "' .";
                case STUDY_REPORTED_ACCEPTED_RESEARCHER ->
                        "Alert: Your study '" + studyTitle + "' has been reported or accepted.";
                case STUDY_BLOCKED_RESEARCHER -> "Urgent: Your study '" + studyTitle + "' has been blocked.";
                case STUDY_COMPLETED_BY_ALL_PARTICIPANTS_RESEARCHER ->
                        "Great news! All participants have completed '" + studyTitle + "'.";
                case INVITATION_TO_STUDY_REVIEWER -> "You have been invited to review the study: " + studyTitle;
                case USER_INFO_CHANGED_BY_ADMIN_FORALL ->
                        "Your account information has been updated by an administrator.";
                case INVITATION_TO_STUDY_RESEARCHER ->
                        "You have been invited as a coresearcher to the study: " + studyTitle;
                default -> "You have a new notification.";
            };
        }
        else finalMessage = customMessage;
        // Generate message if not provided
        //finalMessage = (customMessage != null) ? customMessage : generateMessage(type, studyTitle);
        Notification notification = Notification.builder()
                .user(user)
                .study(study)
                .type(type)
                .message(finalMessage)
                .isRead(false)
                .isAnswered(false)
                .build();

        log.info("New notification created: {}", notification);
        notificationRepository.save(notification);
    }

    // ==========================================
    // Retrieval & Status Updates
    // ==========================================


    @Transactional(readOnly = true)
    public List<NotificationDto> getUserNotificationsDto(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(n -> new NotificationDto(
                        n.getId(),
                        n.getMessage(),
                        n.isRead(),
                        n.isAnswered(),
                        n.getUser() != null ? n.getUser().getId() : null,
                        n.getStudy() != null ? n.getStudy().getId() : null,
                        n.getType().name(),
                        n.getCreatedAt()
                ))
                .toList();
    }
    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAsAnswered(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setAnswered(true);
        notificationRepository.save(notification);
    }
}