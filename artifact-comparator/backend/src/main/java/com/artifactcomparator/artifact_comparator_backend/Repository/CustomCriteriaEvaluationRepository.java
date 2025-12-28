package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.CustomCriteriaEvaluation;
import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationTask;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomCriteriaEvaluationRepository extends JpaRepository<CustomCriteriaEvaluation, Long> {

    List<CustomCriteriaEvaluation> findByTaskAndParticipant(EvaluationTask task, User participant);
}