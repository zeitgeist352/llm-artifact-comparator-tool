package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.InviteResearcherRequestDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.UpdateResearcherPermissionsDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.ResearcherResponseDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.ResearcherPermissionsDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Service.NotificationService;

import com.artifactcomparator.artifact_comparator_backend.Repository.ResearcherRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ResearcherService {

    private final ResearcherRepository researcherRepository;
    private final StudyRepository studyRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public ResearcherService(
            ResearcherRepository researcherRepository,
            StudyRepository studyRepository,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this.researcherRepository = researcherRepository;
        this.studyRepository = studyRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;

    }

    // ✅ Get all researchers for a study (only main researcher can view)
    public List<ResearcherResponseDTO> getResearchersForStudy(Long studyId, Long requestingUserId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        // Verify that requesting user is the main researcher
        if (!study.getResearcher().getId().equals(requestingUserId)) {
            throw new RuntimeException("Only the main researcher can view co-researchers");
        }

        List<Researcher> researchers = researcherRepository.findByStudy(study);
        return researchers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // GET invitations for user
    public List<ResearcherResponseDTO> getInvitationsForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Researcher> list = researcherRepository.findByUser(user)
                .stream()
                .filter(r -> r.getStatus() == Researcher.ResearcherStatus.PENDING)
                .collect(Collectors.toList());

        return list.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public ResearcherResponseDTO getInvitationSpecificForUser(Long userId, Long studyId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));
        Researcher researcher = researcherRepository.findByStudyAndUser(study, user).orElseThrow(() -> new RuntimeException("Researcher not found"));
        System.out.println(researcher.getStatus());
        return convertToDTO(researcher);
    }
    // ACCEPT invitation
    public void acceptInvitation(Long researcherId, Long userId) {
        Researcher r = researcherRepository.findById(researcherId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (!r.getUser().getId().equals(userId))
            throw new RuntimeException("Not authorized to accept this invitation");

        r.setStatus(Researcher.ResearcherStatus.ACCEPTED);
        r.setAcceptedAt(LocalDateTime.now());

        researcherRepository.save(r);
    }

    // REJECT invitation
    public void rejectInvitation(Long researcherId, Long userId) {
        Researcher r = researcherRepository.findById(researcherId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (!r.getUser().getId().equals(userId))
            throw new RuntimeException("Not authorized to reject this invitation");

        r.setStatus(Researcher.ResearcherStatus.REJECTED);
        r.setAcceptedAt(LocalDateTime.now());

        researcherRepository.save(r);
    }

    @Transactional
    public void acceptInvitation(Long researcherId) {
        Researcher r = researcherRepository.findById(researcherId)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        r.setStatus(Researcher.ResearcherStatus.ACCEPTED);
        r.setAcceptedAt(LocalDateTime.now());

        researcherRepository.save(r);
    }

    @Transactional
    public void rejectInvitation(Long researcherId) {
        Researcher r = researcherRepository.findById(researcherId)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        r.setStatus(Researcher.ResearcherStatus.REJECTED);

        researcherRepository.save(r);
    }


    // ✅ Invite a new co-researcher to the study
    public Researcher inviteResearcher(
            Long studyId,
            Long mainResearcherId,
            String usernameToInvite,
            Boolean canUploadArtifacts,
            Boolean canEditStudyDetails,
            Boolean canInviteParticipants
    ) {
        // 1️⃣ Fetch and validate study
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        // 2️⃣ Verify requesting user is main researcher
        if (!study.getResearcher().getId().equals(mainResearcherId)) {
            throw new RuntimeException("Only the main researcher can invite co-researchers");
        }

        // 3️⃣ Find user to invite by usnm
        User userToInvite = userRepository.findByUsername(usernameToInvite)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + usernameToInvite));

        // 4️⃣ Check if already a co-researcher
        if (researcherRepository.existsByStudyAndUser(study, userToInvite)) {
            throw new RuntimeException("This user is already a co-researcher in this study");
        }
        if(study.getResearcher().getId().equals(userToInvite.getId())){
            throw new RuntimeException("You cannot invite the main researcher to the study");
        }
        // 5️⃣ Create permissions
        ResearcherPermission permissions = ResearcherPermission.builder()
                .canUploadArtifacts(canUploadArtifacts != null ? canUploadArtifacts : false)
                .canEditStudyDetails(canEditStudyDetails != null ? canEditStudyDetails : false)
                .canInviteParticipants(canInviteParticipants != null ? canInviteParticipants : false)
                .canManageResearchers(false)
                .build();

        // 6️⃣ Create researcher record
        Researcher researcher = Researcher.builder()
                .study(study)
                .user(userToInvite)
                .permissions(permissions)
                .status(Researcher.ResearcherStatus.PENDING)
                .invitedAt(LocalDateTime.now())
                .build();

        // 7️⃣ Save and return
        notificationService.notifyResearcherInvitation(userToInvite.getId(), studyId);

        return researcherRepository.save(researcher);
    }

    // ✅ Update researcher permissions
    public void updateResearcherPermissions(
            Long studyId,
            Long researcherId,
            Long mainResearcherId,
            UpdateResearcherPermissionsDTO request
    ) {
        // 1️⃣ Fetch and validate study
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        // 2️⃣ Verify requesting user is main researcher
        if (!study.getResearcher().getId().equals(mainResearcherId)) {
            throw new RuntimeException("Only the main researcher can update permissions");
        }

        // 3️⃣ Find researcher
        Researcher researcher = researcherRepository.findById(researcherId)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        // 4️⃣ Verify researcher belongs to this study
        if (!researcher.getStudy().getId().equals(studyId)) {
            throw new RuntimeException("Researcher does not belong to this study");
        }

        // 5️⃣ Update permissions
        ResearcherPermission permissions = researcher.getPermissions();
        if (request.getCanUploadArtifacts() != null) {
            permissions.setCanUploadArtifacts(request.getCanUploadArtifacts());
        }
        if (request.getCanEditStudyDetails() != null) {
            permissions.setCanEditStudyDetails(request.getCanEditStudyDetails());
        }
        if (request.getCanInviteParticipants() != null) {
            permissions.setCanInviteParticipants(request.getCanInviteParticipants());
        }

        researcherRepository.save(researcher);
    }

    // ✅ Remove a co-researcher from a study
    public void removeResearcher(Long studyId, Long researcherId, Long mainResearcherId) {
        // 1️⃣ Fetch and validate study
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        // 2️⃣ Verify requesting user is main researcher
        if (!study.getResearcher().getId().equals(mainResearcherId)) {
            throw new RuntimeException("Only the main researcher can remove co-researchers");
        }

        // 3️⃣ Find and remove researcher
        Researcher researcher = researcherRepository.findById(researcherId)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        if (!researcher.getStudy().getId().equals(studyId)) {
            throw new RuntimeException("Researcher does not belong to this study");
        }

        researcherRepository.delete(researcher);
    }

    // ✅ Get researcher details
    public ResearcherResponseDTO getResearcherDetails(Long studyId, Long researcherId, Long mainResearcherId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        if (!study.getResearcher().getId().equals(mainResearcherId)) {
            throw new RuntimeException("Only the main researcher can view researcher details");
        }

        Researcher researcher = researcherRepository.findById(researcherId)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        if (!researcher.getStudy().getId().equals(studyId)) {
            throw new RuntimeException("Researcher does not belong to this study");
        }

        return convertToDTO(researcher);
    }

    // ✅ Check if user has permission in a study
    public boolean hasPermission(Long studyId, Long userId, String permission) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        // Main researcher has all permissions
        if (study.getResearcher().getId().equals(userId)) {
            return true;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Researcher researcher = researcherRepository.findByStudyAndUser(study, user)
                .orElse(null);

        if (researcher == null || researcher.getStatus() != Researcher.ResearcherStatus.ACCEPTED) {
            return false;
        }

        ResearcherPermission perms = researcher.getPermissions();

        switch (permission.toLowerCase()) {
            case "upload_artifacts":
                return perms.getCanUploadArtifacts();
            case "edit_study_details":
                return perms.getCanEditStudyDetails();
            case "invite_participants":
                return perms.getCanInviteParticipants();
            case "manage_researchers":
                return perms.getCanManageResearchers();
            default:
                return false;
        }
    }

    // ✅ Convert Researcher entity to DTO
    private ResearcherResponseDTO convertToDTO(Researcher researcher) {

        ResearcherPermissionsDTO permDTO = new ResearcherPermissionsDTO(
                researcher.getPermissions().getId(),
                researcher.getPermissions().getCanUploadArtifacts(),
                researcher.getPermissions().getCanEditStudyDetails(),
                researcher.getPermissions().getCanInviteParticipants(),
                researcher.getPermissions().getCanManageResearchers()
        );

        Long invitedAtTimestamp = null;
        Long acceptedAtTimestamp = null;

        if (researcher.getInvitedAt() != null) {
            invitedAtTimestamp = researcher.getInvitedAt()
                    .atZone(java.time.ZoneId.systemDefault())
                    .toInstant().toEpochMilli();
        }

        if (researcher.getAcceptedAt() != null) {
            acceptedAtTimestamp = researcher.getAcceptedAt()
                    .atZone(java.time.ZoneId.systemDefault())
                    .toInstant().toEpochMilli();
        }

        // 🔥 Ana DTO oluşturuluyor
        ResearcherResponseDTO dto = new ResearcherResponseDTO(
                researcher.getId(),
                researcher.getUser().getId(),
                researcher.getUser().getUsername(),
                researcher.getUser().getEmail(),
                researcher.getUser().getName(),
                researcher.getUser().getLastname(),
                researcher.getStatus().toString(),
                invitedAtTimestamp,
                acceptedAtTimestamp,
                permDTO
        );

        // 🔥 Study bilgileri ekleniyor (frontend için kritik!)
        dto.setStudyId(researcher.getStudy().getId());
        dto.setStudyTitle(researcher.getStudy().getTitle());

        return dto;
    }
}