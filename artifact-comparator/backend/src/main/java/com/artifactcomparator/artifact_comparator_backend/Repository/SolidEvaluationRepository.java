package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.SolidEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SolidEvaluationRepository extends JpaRepository<SolidEvaluation, Long> {
    boolean existsByTaskIdAndUserId(Long taskId, Long userId);
}
