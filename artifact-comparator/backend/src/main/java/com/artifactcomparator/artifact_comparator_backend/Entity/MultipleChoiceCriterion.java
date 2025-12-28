package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Enums.CriterionType;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Getter @Setter
@NoArgsConstructor
@Table(name = "mc_criteria")
public class MultipleChoiceCriterion extends EvaluationCriterion {

    private Integer numberOfOptions;

    @ElementCollection
    @CollectionTable(name = "mc_options", joinColumns = @JoinColumn(name = "criterion_id"))
    @Column(name = "option_value")
    private List<String> options;

    private boolean multipleSelection;

    public MultipleChoiceCriterion(String question, String description, Integer priorityOrder,
                                   Integer numberOfOptions, List<String> options, boolean multipleSelection) {
        super(null, question, description, priorityOrder, CriterionType.MULTIPLE_CHOICE, null);
        this.numberOfOptions = numberOfOptions;
        this.options = options;
        this.multipleSelection = multipleSelection;
    }
}

