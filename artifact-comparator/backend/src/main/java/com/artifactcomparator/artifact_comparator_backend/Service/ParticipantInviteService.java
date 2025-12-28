package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.Entity.InvitationToken;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.InvitationTokenRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import com.artifactcomparator.artifact_comparator_backend.Service.NotificationService;
import jakarta.transaction.Transactional;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
@Service
public class ParticipantInviteService {


    private final NotificationService notificationService;
    private final JavaMailSender mailSender;
    private final StudyRepository studyRepository;
    private final UserRepository userRepository;
    private final InvitationTokenRepository tokenRepository;

    public ParticipantInviteService(JavaMailSender mailSender,
                                    StudyRepository studyRepository,
                                    UserRepository userRepository,
                                    InvitationTokenRepository tokenRepository,
                                    NotificationService notificationService) {
        this.notificationService = notificationService;
        this.mailSender = mailSender;
        this.studyRepository = studyRepository;
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
    }

    // ✔ ESKİ HALİ BOZMADAN → HÂLÂ sendInvitationEmail KULLANIYORUZ
    @Transactional
    public void sendInvitationEmail(String email, Long studyId) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        // Token üretelim ama method adı değişmesin
        tokenRepository.deleteByParticipantIdAndStudyId(user.getId(), studyId);

        InvitationToken token = new InvitationToken();
        token.setToken(UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", ""));
        token.setCreatedAt(LocalDateTime.now());
        token.setExpiresAt(LocalDateTime.now().plusDays(2));
        token.setParticipant(user);
        token.setStudy(study);
        tokenRepository.save(token);

        String link = "http://localhost:3000/join-study/" + studyId + "?token=" + token.getToken();

        String subject = "📩 Invitation to Participate: " + study.getTitle();
        String body = """
                Hello,

                You have been invited to participate in the study:

                "%s"

                Click the link below to join:
                %s

                This invitation expires in 48 hours.

                — Artifact Comparator Team
                """.formatted(study.getTitle(), link);

        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(email);
        mail.setSubject(subject);
        mail.setText(body);
        mailSender.send(mail);

        System.out.println("📨 Invitation email sent to " + email + " for study " + study.getId());
        notificationService.notifyParticipantInvitation(user.getId(), studyId);
    }

    public InvitationToken validateToken(String tokenStr) {
        InvitationToken token = tokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new RuntimeException("Invalid invitation token"));

        if (token.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new RuntimeException("Invitation token expired");

        return token;
    }
}

