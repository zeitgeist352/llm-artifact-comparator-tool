package com.artifactcomparator.artifact_comparator_backend.DTO;

import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationCriterion;
import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationTask;

import java.util.List;

public class TaskResultDTO {

    public EvaluationTask task;
    public List<EvaluationCriterion> criteria;
    public List<String> answers;

    // --- Constructors ---
    public TaskResultDTO() {}

    public TaskResultDTO(EvaluationTask task, List<EvaluationCriterion> criteria, List<String> answers) {
        this.task = task;
        this.criteria = criteria;
        this.answers = answers;
    }
}
