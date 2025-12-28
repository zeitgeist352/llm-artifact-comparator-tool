package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Enums.CriterionType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter
@NoArgsConstructor
@Table(name = "image_highlight_criteria")
public class ImageHighlightCriterion extends EvaluationCriterion {

    private Integer numberOfAnnotations;

    public ImageHighlightCriterion(String question, String description, Integer priorityOrder,
                                   Integer numberOfAnnotations) {
        super(null, question, description, priorityOrder, CriterionType.IMAGE_HIGHLIGHT, null);
        this.numberOfAnnotations = numberOfAnnotations;
    }
}

