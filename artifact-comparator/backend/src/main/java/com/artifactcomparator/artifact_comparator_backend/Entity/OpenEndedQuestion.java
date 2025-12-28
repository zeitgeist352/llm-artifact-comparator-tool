package com.artifactcomparator.artifact_comparator_backend.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("OPEN_ENDED")
@Data
@EqualsAndHashCode(callSuper = true)
public class OpenEndedQuestion extends Question {

    @Override
    public String getQuestionType() {
        return "OPEN_ENDED";
    }
}
