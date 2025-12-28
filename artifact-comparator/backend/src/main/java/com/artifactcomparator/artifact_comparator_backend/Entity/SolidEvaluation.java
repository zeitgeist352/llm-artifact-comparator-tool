package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Entity.Base.BaseEvaluation;
import com.artifactcomparator.artifact_comparator_backend.Enums.SolidPrinciple;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "solid_evaluations")
@Getter
@Setter
public class SolidEvaluation extends BaseEvaluation {

    // === Violated SOLID Principles (multiple) ===
    private boolean srp;
    private boolean ocp;
    private boolean lsp;
    private boolean isp;
    private boolean dip;

    // === Difficulty flags (just like CorrectAnswer) ===
    private boolean easy;
    private boolean medium;
    private boolean hard;
}
