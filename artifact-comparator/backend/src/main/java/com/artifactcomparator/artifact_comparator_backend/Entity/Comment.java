package com.artifactcomparator.artifact_comparator_backend.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- relations ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private EvaluationTask task;

    @Column(nullable = false)
    private String fieldCode;

    @Column(nullable = false, length = 2000)
    private String content;

    private LocalDateTime createdAt = LocalDateTime.now();

    // NEW
    private boolean pinned = false;

    // NEW
    private int likeCount = 0;

    private boolean deleted = false;

    // NEW
    private int replyCount = 0;

    // NEW → nested comments
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private Comment parentComment;

    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> replies = new ArrayList<>();
}

