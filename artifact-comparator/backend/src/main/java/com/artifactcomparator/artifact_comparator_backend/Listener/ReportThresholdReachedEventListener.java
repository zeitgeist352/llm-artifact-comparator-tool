package com.artifactcomparator.artifact_comparator_backend.Listener;

import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Event.ReportThresholdReachedEvent;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class ReportThresholdReachedEventListener {

    private final JavaMailSender mailSender;
    private final StudyRepository studyRepository;

    public ReportThresholdReachedEventListener(JavaMailSender mailSender,
                                               StudyRepository studyRepository) {
        this.mailSender = mailSender;
        this.studyRepository = studyRepository;
    }

    @Async
    @org.springframework.context.event.EventListener
    public void handleThresholdEvent(ReportThresholdReachedEvent event) {

        Study study = studyRepository.findById(event.getStudyId())
                .orElse(null);

        if (study == null || study.getResearcher() == null) {
            System.err.println("⚠️ Researcher not found for study " + event.getStudyId());
            return;
        }

        User researcher = study.getResearcher();

        // MAIL GÖNDERİLECEK BODY
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(researcher.getEmail());

        if (event.isArtifactReport()) {
            mail.setSubject("⚠️ Artifact Report Threshold Triggered");

            mail.setText("""
                    Dear %s,

                    An artifact in your study ("%s") has reached the report threshold.

                    Artifact ID: %s
                    Please review the artifact and take appropriate moderation action.

                    Regards,
                    Artifact Comparator System
                    """.formatted(
                    researcher.getName(),
                    study.getTitle(),
                    event.getArtifactId()
            ));
        } else {
            mail.setSubject("⚠️ Participant Report Threshold Triggered");

            mail.setText("""
                    Dear %s,

                    A participant in your study ("%s") has received multiple reports.

                    Reported Username: %s
                    Please verify this user's activity.

                    Regards,
                    Artifact Comparator System
                    """.formatted(
                    researcher.getName(),
                    study.getTitle(),
                    event.getReportedUsername()
            ));
        }

        try {
            mailSender.send(mail);
            System.out.println("📨 Threshold alert email sent to " + researcher.getEmail());
        } catch (Exception e) {
            System.err.println("❌ Failed to send threshold email: " + e.getMessage());
        }
    }
}
