package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.ParticipantTaskResponse;
import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationTask;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ParticipantTaskResponseRepository
        extends JpaRepository<ParticipantTaskResponse, Long> {

    Optional<ParticipantTaskResponse> findByTaskAndParticipant(EvaluationTask task, User participant);
    // ✅ Check if participant has submitted response for a specific task
    boolean existsByParticipantAndTask(User participant, EvaluationTask task);

    // Optional: Get count directly (more efficient)
    long countByParticipantAndTaskIn(User participant, List<EvaluationTask> tasks);
    // 🔥 STUDY BAZINDA TÜM CEVAPLARI ÇEKMEK İÇİN YENİ QUERY
    List<ParticipantTaskResponse> findByTask_Study_Id(Long studyId);

    List<ParticipantTaskResponse> findByTask_Id(Long taskId);

    @Modifying
    @Query("""
    DELETE FROM ParticipantTaskResponse p
    WHERE p.task = :task
""")
    void deleteByTask(@Param("task") EvaluationTask task);

    @Query("""
    select ptr.task.id
    from ParticipantTaskResponse ptr
    where ptr.participant.id = :participantId
      and ptr.task.study.id = :studyId
""")
    List<Long> findCompletedTaskIdsForStudy(
            @Param("participantId") Long participantId,
            @Param("studyId") Long studyId
    );
}
