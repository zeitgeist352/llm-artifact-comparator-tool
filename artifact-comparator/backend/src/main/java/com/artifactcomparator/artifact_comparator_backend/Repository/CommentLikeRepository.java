package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.CommentLike;
import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

    boolean existsByUserIdAndCommentId(Long userId, Long commentId);

    void deleteByUserIdAndCommentId(Long userId, Long commentId);

    int countByCommentId(Long commentId);

    @Modifying
    @Query("""
        DELETE FROM CommentLike cl
        WHERE cl.comment.task = :task
    """)
    void deleteByTask(@Param("task") EvaluationTask task);
}
