package com.artifactcomparator.artifact_comparator_backend.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class CorrectAnswerEntry {

    @Column(name = "criterion_id", nullable = false)
    private Long criterionId;

    @Column(name = "answer_value", columnDefinition = "TEXT")
    private String answerValue;
}
