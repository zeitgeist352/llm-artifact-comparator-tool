package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.AdminActionLogDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.RegisterDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.StudyResponseDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.UserDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.Researcher;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import com.artifactcomparator.artifact_comparator_backend.Enums.StudyStatus;
import com.artifactcomparator.artifact_comparator_backend.Event.AdminStudyBlockedEvent;
import com.artifactcomparator.artifact_comparator_backend.Filter.UserFilter;
import com.artifactcomparator.artifact_comparator_backend.Repository.AdminActionLogRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.PasswordResetTokenRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import com.artifactcomparator.artifact_comparator_backend.Service.NotificationService;
import jakarta.transaction.Transactional;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import com.artifactcomparator.artifact_comparator_backend.Entity.AdminActionLog;
import java.time.LocalDateTime;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

@Service
public class AdminService {
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final AdminActionLogRepository adminActionLogRepository;
    private final StudyRepository studyRepository;
    private final JavaMailSender mailSender; // ✅ ekledik
    private final ApplicationEventPublisher eventPublisher;
    private final NotificationService notificationService;

    public AdminService(UserRepository userRepository,
                        PasswordResetTokenRepository tokenRepository,
                        AdminActionLogRepository adminActionLogRepository,
                        StudyRepository studyRepository,
                        JavaMailSender mailSender,
                        ApplicationEventPublisher eventPublisher,
                        NotificationService notificationService
                        ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.adminActionLogRepository = adminActionLogRepository;
        this.studyRepository = studyRepository;
        this.mailSender = mailSender;
        this.eventPublisher = eventPublisher;
        this.notificationService = notificationService;
    }

    // 🔹 Filtreli kullanıcı listesi

    public List<UserDTO> getAllUsersFiltered(UserFilter filter) {
        return userRepository.searchAndFilterUsers(filter)
                .stream()
                .map(u -> new UserDTO(
                        u.getUsername(),
                        u.getName(),
                        u.getLastname(),
                        u.getEmail(),
                        "*****",
                        u.getRole()
                ))
                .toList();
    }

    // 🔹 username ile user sil — önce tokenları ve logları temizle
    @Transactional
    public boolean deleteUserByUsername(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // 1️⃣ Foreign key bağımlılıklarını temizle
            tokenRepository.deleteByUserId(user.getId());

            // 2️⃣ Eğer user bir admin ise, loglarını da sil
            if (user.getRole() == Role.ADMIN) {
                adminActionLogRepository.deleteByAdmin(user);
            }

            // ✅ imza değişmedi ama log atabiliyoruz:
            logCurrentAdminAction("DELETE_USER", "Deleted user " + username);

            // 3️⃣ Son olarak user'ı sil
            userRepository.delete(user);

            return true;
        }
        return false;
    }

    // 🔹 Rol değiştirme
    public boolean changeUserRole(String username, String newRole) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setRole(Role.valueOf(newRole.toUpperCase()));
            userRepository.save(user);

            // ✅ log kaydı
            logCurrentAdminAction("CHANGE_ROLE",
                    "Changed role of " + username + " to " + newRole);

            return true;
        }
        return false;
    }

    public List<AdminActionLogDTO> getAllActionLogs() {
        return adminActionLogRepository.findAll().stream()
                .map(log -> new AdminActionLogDTO(
                        log.getAdmin().getUsername(),
                        log.getActionType(),
                        log.getDescription(),
                        log.getTimestamp()
                ))
                .toList();
    }


    private void logCurrentAdminAction(String actionType, String description) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return;

            String adminUsername = auth.getName();
            Optional<User> adminOpt = userRepository.findByUsername(adminUsername);
            if (adminOpt.isEmpty()) return;

            User admin = adminOpt.get();

            AdminActionLog log = new AdminActionLog();
            log.setAdmin(admin);
            log.setActionType(actionType);
            log.setDescription(description);
            log.setTimestamp(LocalDateTime.now());
            adminActionLogRepository.save(log);

        } catch (Exception e) {
            // sessiz geç (loglama sistemini etkilemesin)
            System.err.println("⚠️ Admin action log oluşturulamadı: " + e.getMessage());
        }
    }

    public boolean createNewUser(RegisterDTO dto) {
        // username veya email zaten varsa, oluşturma
        if (userRepository.findByUsername(dto.getUsername()).isPresent() ||
                userRepository.findByEmail(dto.getEmail()).isPresent()) {
            return false;
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setName(dto.getName());
        user.setLastname(dto.getLastname());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword()); // ⚠️ Gerçek sistemde encoder gerekir
        user.setRole(Role.valueOf(dto.getRole().toUpperCase()));

        userRepository.save(user);

        // log kaydı
        logCurrentAdminAction("CREATE_USER", "Created user " + dto.getUsername());

        return true;
    }

    @Transactional
    public boolean updateUserInfo(String username, UserDTO updatedUser) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();

        // 🔹 Alanları sadece boş değilse güncelle
        if (updatedUser.getName() != null && !updatedUser.getName().isBlank()) {
            user.setName(updatedUser.getName());
        }
        if (updatedUser.getLastname() != null && !updatedUser.getLastname().isBlank()) {
            user.setLastname(updatedUser.getLastname());
        }
        if (updatedUser.getEmail() != null && !updatedUser.getEmail().isBlank()) {
            user.setEmail(updatedUser.getEmail());
        }

        userRepository.save(user);

        // 🔹 Log kaydı ekle
        logCurrentAdminAction(
                "UPDATE_USER",
                "Updated info of user: " + username
        );

        return true;
    }

    public List<StudyResponseDTO> getAllStudies() {
        return studyRepository.findAll().stream()
                .map(s -> new StudyResponseDTO(
                        s.getId(),
                        s.getTitle(),
                        s.getStatus().name(),  // Enum olduğu için .name()
                        s.getPublishStatus() != null ? s.getPublishStatus().name() : "PENDING",  // ✅ ADD THIS
                        s.getEvaluationTasks() != null ? s.getEvaluationTasks().size() : 0,
                        s.getResearcher() != null ? s.getResearcher().getUsername() : "N/A"
                ))
                .toList();
    }

    public StudyResponseDTO getStudyDetails(Long id) {
        return studyRepository.findById(id)
                .map(s -> new StudyResponseDTO(
                        s.getId(),
                        s.getTitle(),
                        s.getStatus() != null ? s.getStatus().name() : "UNKNOWN",
                        s.getPublishStatus() != null ? s.getPublishStatus().name() : "PENDING",
                        s.getEvaluationTasks() != null ? s.getEvaluationTasks().size() : 0,
                        s.getResearcher() != null ? s.getResearcher().getUsername() : "N/A"
                ))
                .orElse(null);
    }

    // ✅ Study block (sebep zorunlu)
    @Transactional
    public boolean blockStudy(Long id, String reason) {
        return studyRepository.findById(id).map(study -> {
            study.setStatus(StudyStatus.BLOCKED);
            studyRepository.save(study);

            logCurrentAdminAction("BLOCK_STUDY",
                    "Blocked study ID " + id + " | Reason: " + reason);

            // 🔹 Event fırlat
            eventPublisher.publishEvent(new AdminStudyBlockedEvent(this, study, reason, true));
            List<Researcher> researchers = study.getResearchers();
            for (Researcher researcher : researchers) {
                notificationService.notifyResearcherStudyBlocked(researcher.getId(), study.getId());
            }
            return true;
        }).orElse(false);
    }

    @Transactional
    public boolean unblockStudy(Long id) {
        return studyRepository.findById(id).map(study -> {
            study.setStatus(StudyStatus.ACTIVE);
            studyRepository.save(study);

            logCurrentAdminAction("UNBLOCK_STUDY", "Unblocked study ID " + id);

            // 🔹 Event fırlat
            eventPublisher.publishEvent(new AdminStudyBlockedEvent(this, study, null, false));

            return true;
        }).orElse(false);
    }
}
