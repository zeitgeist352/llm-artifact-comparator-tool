package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.DeletedCommentLog;
import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface DeletedCommentLogRepository extends JpaRepository<DeletedCommentLog, Long> {

    List<DeletedCommentLog> findByTaskId(Long taskId);

    boolean existsByOriginalCommentId(Long originalCommentId);

    @Modifying
    @Query("""
        DELETE FROM DeletedCommentLog d
        WHERE d.task = :task
    """)
    void deleteByTask(@Param("task") EvaluationTask task);
}
