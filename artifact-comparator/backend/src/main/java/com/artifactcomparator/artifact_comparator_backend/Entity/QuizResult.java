package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Enums.QuizStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "quiz_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    private User participant;  // Link to your existing User entity

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id", nullable = false)
    private Study study;


    // Map: questionId -> participant's answer text
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "result_answers", joinColumns = @JoinColumn(name = "quiz_result_id"))
    @MapKeyColumn(name = "question_id")
    @Column(name = "answer_text", length = 2000)
    private Map<Long, String> answers = new HashMap<>();

    // Map: questionId -> points earned (initially null)
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "result_points", joinColumns = @JoinColumn(name = "quiz_result_id"))
    @MapKeyColumn(name = "question_id")
    @Column(name = "points_earned")
    private Map<Long, Double> pointsEarned = new HashMap<>();

    // Map: questionId -> AI feedback for open-ended (initially null)
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "result_feedback", joinColumns = @JoinColumn(name = "quiz_result_id"))
    @MapKeyColumn(name = "question_id")
    @Column(name = "feedback", columnDefinition = "TEXT")
    private Map<Long, String> aiFeedback = new HashMap<>();


    private LocalDateTime submittedAt;

    private LocalDateTime gradedAt;

    // Summary (initially null, calculated after grading)
    private Double totalPointsEarned;

    private Integer maxPossiblePoints;

    private Double percentageScore;

    @Enumerated(EnumType.STRING)
    private QuizStatus status = QuizStatus.PENDING;

    // Helper method to calculate total
    public void calculateTotalPoints() {
        this.totalPointsEarned = pointsEarned.values().stream()
                .filter(p -> p != null)
                .mapToDouble(Double::doubleValue)
                .sum();

        if (maxPossiblePoints != null && maxPossiblePoints > 0) {
            this.percentageScore = (totalPointsEarned / maxPossiblePoints) * 100;
        }
    }
}
