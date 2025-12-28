package com.artifactcomparator.artifact_comparator_backend.DTO;

import com.artifactcomparator.artifact_comparator_backend.Entity.CorrectAnswerEntry;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class EvaluationTaskCreateRequest {

    private String questionText;
    private String description;

    private int artifactCount;
    private List<Long> artifactIds;

    // 🔥 unified correct answer list
    private List<CorrectAnswerEntry> correctAnswers;
}

