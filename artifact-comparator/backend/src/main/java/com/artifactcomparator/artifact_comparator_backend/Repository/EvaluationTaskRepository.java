package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationTask;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EvaluationTaskRepository extends JpaRepository<EvaluationTask, Long> {
    List<EvaluationTask> findByStudy(Study study);
}
