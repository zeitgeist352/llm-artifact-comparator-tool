package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Enums.CriterionType;
import com.fasterxml.jackson.annotation.*;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "evaluation_criteria")
@Inheritance(strategy = InheritanceType.JOINED)
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = MultipleChoiceCriterion.class, name = "MULTIPLE_CHOICE"),
        @JsonSubTypes.Type(value = RatingCriterion.class, name = "RATING"),
        @JsonSubTypes.Type(value = OpenEndedCriterion.class, name = "OPEN_ENDED"),
        @JsonSubTypes.Type(value = OpenEndedNumericCriterion.class, name = "NUMERIC"),
        @JsonSubTypes.Type(value = CodeEditCriterion.class, name = "CODE_EDIT"),
        @JsonSubTypes.Type(value = ImageHighlightCriterion.class, name = "IMAGE_HIGHLIGHT"),
})
public abstract class EvaluationCriterion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String question;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Integer priorityOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CriterionType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id", nullable = false)
    @JsonIgnore
    private Study study;
}
