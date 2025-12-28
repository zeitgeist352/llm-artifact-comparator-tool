package com.artifactcomparator.artifact_comparator_backend.Entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@DiscriminatorValue("MULTIPLE_CHOICE")
@Data
@EqualsAndHashCode(callSuper = true)
public class MultipleChoiceQuestion extends Question {

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "question_options", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_text", length = 500)
    @OrderColumn(name = "option_order")
    private List<String> options = new ArrayList<>();

    @Column(name = "correct_answer", nullable = true, length = 500)
    private String correctAnswer;

    @Override
    public String getQuestionType() {
        return "MULTIPLE_CHOICE";
    }

    // Helper method to add options
    public void addOption(String option) {
        if (options == null) {
            options = new ArrayList<>();
        }
        options.add(option);
    }

    // Helper method to check if answer is correct
    public boolean isCorrectAnswer(String answer) {
        if (answer == null || correctAnswer == null) {
            return false;
        }
        return correctAnswer.trim().equalsIgnoreCase(answer.trim());
    }
}
