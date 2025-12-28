package com.artifactcomparator.artifact_comparator_backend.Listener;

import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Event.AdminStudyBlockedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class AdminStudyBlockedEventListener {

    private final JavaMailSender mailSender;

    public AdminStudyBlockedEventListener(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async // 🔹 Mail işlemi arka planda yürüsün
    @EventListener
    public void handleAdminStudyBlockedEvent(AdminStudyBlockedEvent event) {
        Study study = event.getStudy();
        User researcher = study.getResearcher();

        if (researcher == null || researcher.getEmail() == null) {
            System.err.println("⚠️ Researcher email not found for study ID " + study.getId());
            return;
        }

        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(researcher.getEmail());

            if (event.isBlocked()) {
                mail.setSubject("Your Study Has Been Blocked");
                mail.setText("""
                        Dear %s,
                        
                        Your study titled "%s" has been blocked by an administrator.
                        Reason: %s
                        
                        Please review your content or contact the admin team for clarification.
                        
                        Regards,
                        Artifact Comparator Team
                        """.formatted(
                        researcher.getName() != null ? researcher.getName() : "Researcher",
                        study.getTitle(),
                        event.getReason() != null ? event.getReason() : "No reason provided"
                ));
            } else {
                mail.setSubject("Your Study Has Been Unblocked");
                mail.setText("""
                        Dear %s,
                        
                        Your study titled "%s" has been unblocked and is now visible again.
                        
                        Regards,
                        Artifact Comparator Team
                        """.formatted(
                        researcher.getName() != null ? researcher.getName() : "Researcher",
                        study.getTitle()
                ));
            }

            mailSender.send(mail);
            System.out.println("📨 Mail sent to: " + researcher.getEmail());
        } catch (Exception e) {
            System.err.println("❌ Failed to send study block/unblock mail: " + e.getMessage());
        }
    }
}
