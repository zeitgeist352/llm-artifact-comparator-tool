package com.artifactcomparator.artifact_comparator_backend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Entity
public class ParticipantTaskResponse {

    // --- Getters & Setters ---
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @ManyToOne
    private User participant;

    @Setter
    @ManyToOne
    private EvaluationTask task;

    // answers[i] -> criterion with priorityOrder i+1
    @Setter
    @ElementCollection
    @OrderColumn(name = "answer_index")   // ✅ Kritik ekleme
    @Column(columnDefinition = "TEXT")
    private List<String> answers;

}
