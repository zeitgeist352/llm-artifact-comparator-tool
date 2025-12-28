package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.QuizResult;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Enums.QuizStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {

        List<QuizResult> findByQuizId(Long quizId);

        List<QuizResult> findByParticipantId(Long participantId);

        QuizResult findByQuizIdAndParticipantId(Long quizId, Long participantId);

        List<QuizResult> findByStudyId(Long studyId);

        QuizResult findByStudyIdAndParticipantId(Long studyId, Long participantId);

        boolean existsByStudyIdAndParticipantId(Long studyId, Long participantId);

        // QuizResultRepository.java
        // QuizResultRepository.java
        Optional<QuizResult> findByStudyIdAndParticipantIdAndSubmittedAtIsNull(Long studyId, Long participantId);

        boolean existsByStudyIdAndParticipantIdAndSubmittedAtIsNotNull(Long studyId, Long participantId);

        long countByStudyIdAndStatus(Long studyId, QuizStatus status);

        @Modifying
        @Query("""
    DELETE FROM QuizResult qr
    WHERE qr.study = :study
""")
        void deleteByStudy(@Param("study") Study study);

}
