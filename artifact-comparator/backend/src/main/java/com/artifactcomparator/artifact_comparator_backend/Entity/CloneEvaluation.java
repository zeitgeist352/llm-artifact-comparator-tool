package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Entity.Base.BaseEvaluation;
import com.artifactcomparator.artifact_comparator_backend.Enums.CloneType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "clone_evaluations")
@Getter
@Setter
public class CloneEvaluation extends BaseEvaluation {
    @Enumerated(EnumType.STRING)
    private CloneType cloneType;
}