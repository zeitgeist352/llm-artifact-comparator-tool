package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Enums.CriterionType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter
@NoArgsConstructor
@Table(name = "rating_criteria")
public class RatingCriterion extends EvaluationCriterion {

    private Integer startValue;
    private Integer endValue;

    public RatingCriterion(String question, String description, Integer priorityOrder,
                           Integer startValue, Integer endValue) {
        super(null, question, description, priorityOrder, CriterionType.RATING, null);
        this.startValue = startValue;
        this.endValue = endValue;
    }
}

