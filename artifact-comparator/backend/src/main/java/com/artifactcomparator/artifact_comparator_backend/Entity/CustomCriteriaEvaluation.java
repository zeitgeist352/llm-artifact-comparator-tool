package com.artifactcomparator.artifact_comparator_backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomCriteriaEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private EvaluationTask task;

    private String fieldCode; // "A", "B", "C" — artifact’in o task içindeki yeri

    @ManyToOne
    private EvaluationCriterion criterion;

    private String value;

    @ManyToOne
    private User participant;

    private LocalDateTime createdAt = LocalDateTime.now();
}

