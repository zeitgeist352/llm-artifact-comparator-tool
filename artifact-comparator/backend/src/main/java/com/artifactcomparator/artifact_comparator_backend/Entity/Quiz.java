package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quizzes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, length = 200)
    private String topic;

    @Column(length = 50)
    private String difficulty;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Question> questions = new ArrayList<>();

    // Helper methods
    public void addQuestion(Question question) {
        questions.add(question);
        question.setQuiz(this);
    }

    public void removeQuestion(Question question) {
        questions.remove(question);
        question.setQuiz(null);
    }

    public int getQuestionCount() {
        return questions != null ? questions.size() : 0;
    }

    public int getTotalPoints() {
        if (questions == null || questions.isEmpty()) {
            return 0;
        }
        return questions.stream()
                .mapToInt(Question::getPoints)
                .sum();
    }

    @OneToOne(mappedBy = "quiz")
    @JsonIgnore
    private Study study;
}
