package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Enums.CriterionType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter
@NoArgsConstructor
@Table(name = "open_ended_criteria")
public class OpenEndedCriterion extends EvaluationCriterion {

    private Integer minLength;
    private Integer maxLength;

    public OpenEndedCriterion(String question, String description, Integer priorityOrder,
                              Integer minLength, Integer maxLength) {
        super(null, question, description, priorityOrder, CriterionType.OPEN_ENDED, null);
        this.minLength = minLength;
        this.maxLength = maxLength;
    }
}

