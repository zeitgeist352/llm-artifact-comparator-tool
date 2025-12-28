package com.artifactcomparator.artifact_comparator_backend.DTO;

import com.artifactcomparator.artifact_comparator_backend.Enums.CriterionType;
import lombok.*;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class CreateCriterionRequest {

    private CriterionType type;

    private String question;
    private String description;
    private Integer priorityOrder;

    // MULTIPLE CHOICE
    private Integer numberOfOptions;
    private List<String> options;
    private Boolean multipleSelection;

    // RATING
    private Integer startValue;
    private Integer endValue;

    // OPEN ENDED
    private Integer minLength;
    private Integer maxLength;

    // NUMERIC
    private Boolean integerOnly;
    private Double minValue;
    private Double maxValue;

    // IMAGE HIGHLIGHT
    private Integer numberOfAnnotations;
}
