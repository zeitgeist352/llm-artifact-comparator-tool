package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Entity.Invitation.InvitationStatus;
import com.artifactcomparator.artifact_comparator_backend.Enums.NotificationTypes;
import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import com.artifactcomparator.artifact_comparator_backend.Repository.InvitationRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.NotificationRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.ResearcherRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final StudyRepository studyRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    // Assuming ResearcherRepository exists based on previous context regarding Co-Researchers
    private final ResearcherRepository researcherRepository;
    private final NotificationService notificationService;

    @Autowired
    public InvitationService(InvitationRepository invitationRepository,
                             StudyRepository studyRepository,
                             UserRepository userRepository,
                             ResearcherRepository researcherRepository,
                             NotificationService notificationService,
                             NotificationRepository notificationRepository) {
        this.invitationRepository = invitationRepository;
        this.studyRepository = studyRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.researcherRepository = researcherRepository;
        this.notificationService = notificationService;
    }

    /**
     * Retrieves invitations for a specific user, optionally filtered by role.
     */
    public List<Invitation> getUserInvitations(Long userId, Role role) {
        if(role == null){
            throw new RuntimeException("Role cannot be null.");
        }
        return invitationRepository.findByUserIdAndStatusAndRole(userId, InvitationStatus.PENDING, role);
    }

    @Transactional
    public Invitation acceptInvitation(Long invitationId, Long userId) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (!invitation.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: This invitation does not belong to you.");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("Invitation is already answered.");
        }

        // 1. Update Invitation Status
        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(LocalDateTime.now());

        // 2. Perform Side Effects based on Role
        Study study = invitation.getStudy();
        User user = invitation.getUser();

        handleNotification(userId,invitation.getStudy().getId());

        return invitationRepository.save(invitation);
    }

    @Transactional
    public Invitation rejectInvitation(Long invitationId, Long userId) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (!invitation.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: This invitation does not belong to you.");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("Invitation is already answered.");
        }

        invitation.setStatus(InvitationStatus.REJECTED);
        handleNotification(userId,invitation.getStudy().getId());
        return invitationRepository.save(invitation);
    }
    private void handleNotification(Long userId, Long studyId){
        List<Notification> notifications = notificationRepository.findByUserIdAndStudyId(userId,studyId);
        for (Notification notification : notifications) {
            if( notification.getType() == NotificationTypes.INVITATION_TO_STUDY_REVIEWER || notification.getType() == NotificationTypes.INVITATION_TO_STUDY_PARTICIPANT){
                notification.setRead(true);
                notification.setAnswered(true);
                notificationRepository.save(notification);
            }
        }
    }
}