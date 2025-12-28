package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "evaluation_tasks")
public class EvaluationTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String questionText;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private int artifactCount;

    /* ------------------- STUDY LINK ------------------- */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id", nullable = false)
    @JsonIgnore
    private Study study;

    /* ------------------- ARTIFACTS ------------------- */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "task_artifacts",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "artifact_id")
    )
    @OrderColumn(name = "artifact_order")   // ⭐ SIRAYI %100 GARANTİ EDER
    @JsonIgnoreProperties({"study", "tasks"})
    private List<ArtifactUpload> artifacts = new ArrayList<>();

    /* -------------- COMPLETED PARTICIPANTS ------------- */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "task_completions",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @JsonIgnoreProperties({"studies", "password"})
    private List<User> completedParticipants = new ArrayList<>();

    /* ------------------- RESPONSE FIELDS ------------------- */
    @ElementCollection
    @CollectionTable(name = "evaluation_task_fields", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "field_code")
    private List<String> responseFields = new ArrayList<>();

    /* ============================================================
       🔥 NEW CORRECT ANSWER SYSTEM — MAPPING TO CRITERIA
       correctAnswers: Each criterion has a correct answer value.
       criterionId → answerValue (string or JSON)
    ============================================================ */
    @ElementCollection
    @CollectionTable(name = "task_correct_answers", joinColumns = @JoinColumn(name = "task_id"))
    private List<CorrectAnswerEntry> correctAnswers = new ArrayList<>();
}
