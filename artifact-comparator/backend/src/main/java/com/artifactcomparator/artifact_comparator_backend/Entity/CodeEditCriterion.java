package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Enums.CriterionType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter
@NoArgsConstructor
@Table(name = "code_edit_criteria")
public class CodeEditCriterion extends EvaluationCriterion {

    public CodeEditCriterion(String question, String description, Integer priorityOrder) {
        super(null, question, description, priorityOrder, CriterionType.CODE_EDIT, null);
    }
}

