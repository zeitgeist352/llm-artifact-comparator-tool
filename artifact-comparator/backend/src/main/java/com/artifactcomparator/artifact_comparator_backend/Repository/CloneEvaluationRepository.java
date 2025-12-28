package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.CloneEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CloneEvaluationRepository extends JpaRepository<CloneEvaluation, Long> {
    boolean existsByTaskIdAndUserId(Long taskId, Long userId);
}
