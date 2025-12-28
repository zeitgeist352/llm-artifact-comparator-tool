package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Enums.NotificationTypes;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationTypes type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private boolean isRead = false; // Default to unread

    // Useful for invitations (Accept/Reject actions)
    @Column(nullable = false)
    private boolean isAnswered = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 🔹 Relationships
    // Using objects ensures Foreign Key constraints are created in the DB

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE) // If user is deleted, delete their notifications
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "uploadedArtifacts", "joinedStudies", "notifications"})
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id", nullable = true) // Nullable as requested
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "participants", "reviewers", "evaluationTasks"})
    private Study study;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}