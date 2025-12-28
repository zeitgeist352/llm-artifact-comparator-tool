package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.SnapShotEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SnapshotEvaluationRepository extends JpaRepository <SnapShotEvaluation, Long> {
    boolean existsByTaskIdAndUserId(Long taskId, Long userId);
}
