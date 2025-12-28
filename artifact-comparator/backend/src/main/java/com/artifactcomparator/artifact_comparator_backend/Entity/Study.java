package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import com.artifactcomparator.artifact_comparator_backend.Enums.StudyStatus;
import com.artifactcomparator.artifact_comparator_backend.Enums.StudyType;
import com.artifactcomparator.artifact_comparator_backend.Enums.PublishStatus;
import com.artifactcomparator.artifact_comparator_backend.Enums.Visibility;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "studies")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler" })
public class Study {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudyStatus status = StudyStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PublishStatus publishStatus = PublishStatus.PENDING;

    @Column(nullable = true)
    private String rejectionReason;

    // 🔹 Default visibility is PRIVATE
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Visibility visibility = Visibility.PRIVATE;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "researcher_id", nullable = false)
    private User researcher;

    // 🔹 Study ↔ Participants
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "study_participants",
            joinColumns = @JoinColumn(name = "study_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @JsonManagedReference // ✅ JSON’da participants’ı düzgün serialize eder
    private List<User> participants = new ArrayList<>();

    // 🔹 Study ↔ Reviewer
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "study_reviewer",
            joinColumns = @JoinColumn(name = "study_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @JsonManagedReference // ✅ JSON’da participants’ı düzgün serialize eder
    private List<User> reviewers = new ArrayList<>();

    // 🔹 Study ↔ Evaluation Tasks
    @OneToMany(mappedBy = "study", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EvaluationTask> evaluationTasks = new ArrayList<>();

    @OneToMany(mappedBy = "study", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<EvaluationCriterion> evaluationCriteria = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime endDate = LocalDateTime.now().plusMonths(1);

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Study.java
    @OneToOne(cascade = {CascadeType.PERSIST, CascadeType.MERGE} ,fetch = FetchType.EAGER)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    // 🔹 Quiz atama
    public void assignQuiz(Quiz quiz) {
        this.quiz = quiz;
    }

    // 🔹 Quiz kaldırma
    public void removeQuiz() {
        this.quiz = null;
    }


    // 🔹 Study ↔ Co-Researchers
    @OneToMany(mappedBy = "study", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Researcher> researchers = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudyType studyType;

    @Column(nullable = false)
    private Integer artifactCountPerTask = 1;


    // ============================================================
// 🔥 Kriterleri priorityOrder'a göre sıralı döndürür
// ============================================================
    @Transient
    public List<EvaluationCriterion> getCriteriaSorted() {
        if (evaluationCriteria == null || evaluationCriteria.isEmpty()) {
            return List.of();
        }

        return evaluationCriteria
                .stream()
                .sorted((a, b) -> Integer.compare(a.getPriorityOrder(), b.getPriorityOrder()))
                .toList();
    }

}
