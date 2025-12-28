package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationTask;
import com.artifactcomparator.artifact_comparator_backend.Entity.ResearcherActionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResearcherActionLogRepository extends JpaRepository<ResearcherActionLog, Long> {
    @Query("SELECT r FROM ResearcherActionLog r WHERE r.task.id = :taskId ORDER BY r.createdAt DESC")
    List<ResearcherActionLog> findByTaskId(@Param("taskId") Long taskId);

    // =========================
    // HARD DELETE (🔥)
    // =========================
    @Modifying
    @Query("""
        DELETE FROM ResearcherActionLog r
        WHERE r.task = :task
    """)
    void deleteByTask(@Param("task") EvaluationTask task);
}