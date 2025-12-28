package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.Comment;
import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    // Field altındaki TÜM commentler (şimdilik root + reply birlikte)
    List<Comment> findByTaskIdAndFieldCodeOrderByCreatedAtAsc(Long taskId, String fieldCode);

    List<Comment> findByTaskId(Long taskId);

    List<Comment> findByTaskIdAndUserUsername(Long taskId, String username);

    List<Comment> findByTaskIdAndFieldCodeAndParentCommentIsNullOrderByCreatedAtAsc(Long taskId, String fieldCode);

    // =========================
    // HARD DELETE (🔥)
    // =========================
    @Modifying
    @Query("""
        DELETE FROM Comment c
        WHERE c.task = :task
    """)
    void deleteByTask(@Param("task") EvaluationTask task);
}
