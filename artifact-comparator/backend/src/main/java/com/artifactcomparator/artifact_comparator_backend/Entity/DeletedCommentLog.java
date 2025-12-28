package com.artifactcomparator.artifact_comparator_backend.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "deleted_comment_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeletedCommentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🔹 Silinen yorumun gerçek sahibi
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "original_comment_id")
    private Long originalCommentId;

    private Long parentCommentId;

    // 🔹 Yorumu silen kişi (researcher veya kendisi)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deleted_by", nullable = false)
    private User deletedBy;

    // 🔹 Yorumun ait olduğu task
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private EvaluationTask task;

    // 🔹 Yorumun ait olduğu study (kolay query için)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id", nullable = false)
    private Study study;

    // 🔹 Silinen yorumun içeriği
    @Column(nullable = false, length = 2000)
    private String originalContent;

    // 🔹 Silinme nedeni (researcher UI’dan seçebilir)
    private String deleteReason;

    // 🔹 Ne zaman silindi
    private LocalDateTime deletedAt = LocalDateTime.now();
}
