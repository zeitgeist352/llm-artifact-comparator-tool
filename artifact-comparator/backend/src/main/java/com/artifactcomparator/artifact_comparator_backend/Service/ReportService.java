package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.CreateReportRequestDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.Comment;
import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationTask;
import com.artifactcomparator.artifact_comparator_backend.Entity.Report;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Enums.ReportType;
import com.artifactcomparator.artifact_comparator_backend.Event.ReportThresholdReachedEvent;
import com.artifactcomparator.artifact_comparator_backend.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.config.Task;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
public class ReportService {
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final EvaluationTaskRepository evaluationTaskRepository;
    private final StudyRepository studyRepository;
    private final CommentRepository commentRepository;

    private final int THRESHOLD = 3;

    public Report createReport(CreateReportRequestDTO req, String reporterUsername) {

        if (req.getReason() == null || req.getReason().isBlank()
                || req.getDescription() == null || req.getDescription().isBlank()) {
            throw new RuntimeException("Reason and description are required.");
        }

        User reporter = userRepository.findByUsername(reporterUsername)
                .orElseThrow(() -> new RuntimeException("Reporter not found"));

        Report.ReportBuilder builder = Report.builder()
                .taskId(req.getTaskId())
                .type(req.getType())
                .artifactId(req.getArtifactId())
                .reportedUsername(req.getReportedUsername())
                .reason(req.getReason())
                .description(req.getDescription())
                .reporter(reporter)
                .createdAt(LocalDateTime.now());

// 👇 COMMENT REPORT SNAPSHOT
        if (req.getType() == ReportType.PARTICIPANT) {
            if (req.getCommentId() == null) {
                throw new RuntimeException("commentId is required for COMMENT report");
            }

            Comment comment = commentRepository.findById(req.getCommentId())
                    .orElseThrow(() -> new RuntimeException("Comment not found"));

            builder
                    .commentId(comment.getId())
                    .commentSnapshot(comment.getContent());
        }

        Report report = builder.build();

        Report saved = reportRepository.save(report);

        checkThreshold(saved);

        return saved;
    }

    private void checkThreshold(Report report) {

        // Task → Study
        EvaluationTask task = evaluationTaskRepository.findById(report.getTaskId())
                .orElse(null);

        if (task == null || task.getStudy() == null) {
            System.err.println("⚠️ Study not found for taskId=" + report.getTaskId());
            return;
        }

        Long studyId = task.getStudy().getId();

        // === ARTIFACT REPORT ===
        if (report.getType() == ReportType.ARTIFACT) {
            long count = reportRepository.countByArtifactId(report.getArtifactId());

            if (count >= THRESHOLD) {
                eventPublisher.publishEvent(
                        new ReportThresholdReachedEvent(
                                this,
                                report.getArtifactId(),
                                null,
                                true,
                                studyId
                        )
                );

                System.out.println("🚨 Artifact #" + report.getArtifactId() +
                        " threshold triggered for study " + studyId);
            }
        }

        // === PARTICIPANT REPORT ===
        if (report.getType() == ReportType.PARTICIPANT) {
            long count = reportRepository.countByReportedUsername(report.getReportedUsername());

            if (count >= THRESHOLD) {
                eventPublisher.publishEvent(
                        new ReportThresholdReachedEvent(
                                this,
                                null,
                                report.getReportedUsername(),
                                false,
                                studyId
                        )
                );

                System.out.println("🚨 User @" + report.getReportedUsername() +
                        " threshold triggered for study " + studyId);
            }
        }
    }
}
