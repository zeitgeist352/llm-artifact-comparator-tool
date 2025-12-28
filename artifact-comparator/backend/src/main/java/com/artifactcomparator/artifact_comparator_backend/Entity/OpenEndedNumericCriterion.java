package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Enums.CriterionType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter
@NoArgsConstructor
@Table(name = "numeric_criteria")
public class OpenEndedNumericCriterion extends EvaluationCriterion {

    private boolean integerOnly;
    private Double minValue;
    private Double maxValue;

    public OpenEndedNumericCriterion(String question, String description, Integer priorityOrder,
                                     boolean integerOnly, Double minValue, Double maxValue) {
        super(null, question, description, priorityOrder, CriterionType.NUMERIC, null);
        this.integerOnly = integerOnly;
        this.minValue = minValue;
        this.maxValue = maxValue;
    }
}

