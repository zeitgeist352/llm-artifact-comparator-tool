package com.artifactcomparator.artifact_comparator_backend.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "researcher_action_logs")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResearcherActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Researcher performing the action
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "researcher_id")
    private User researcher;

    // Optional: affected user (comment owner)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id")
    private User targetUser;

    // Affected task
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private EvaluationTask task;

    // Affected comment (if any)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id")
    private Comment comment;

    private String commentContent;

    // Action type → "DELETE_COMMENT", "PIN_COMMENT", "UNPIN_COMMENT", "LIKE_COMMENT"
    private String action;

    private LocalDateTime createdAt = LocalDateTime.now();
}
