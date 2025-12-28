package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.DTO.ParticipantProgressDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.Researcher;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Enums.StudyStatus;
import com.artifactcomparator.artifact_comparator_backend.Enums.Visibility;
import com.artifactcomparator.artifact_comparator_backend.Entity.QuizResult;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudyRepository extends JpaRepository<Study, Long> {

    List<Study> findByResearcher(User researcher);

    List<Study> findTop3ByOrderByCreatedAtDesc();

    List<Study> findByReviewers_Id(Long id);

    List<Study> findByResearchers_User_IdAndResearchers_Status(
            Long userId,
            Researcher.ResearcherStatus status
    );

    // ✅ Public & active studies
    List<Study> findByVisibilityAndStatus(
            Visibility visibility,
            StudyStatus status
    );
    List<Study> findByPublishStatusAndStatus(com.artifactcomparator.artifact_comparator_backend.Enums.PublishStatus publishStatus, com.artifactcomparator.artifact_comparator_backend.Enums.StudyStatus status);
    @Query("SELECT s.rejectionReason FROM Study s WHERE s.id = :id")
    String findRejectionReasonById(@Param("id") Long id);
    // ✅ ✅ ✅ RESEARCHER İÇİN PARTICIPANT PROGRESS QUERY (GERÇEK VERİ)
    @Query("""
SELECT new com.artifactcomparator.artifact_comparator_backend.DTO.ParticipantProgressDTO(
    u.id,
    u.name,
    u.lastname,
    u.email,
    COALESCE(qr.percentageScore, 0d))

FROM Study s
JOIN s.participants u
LEFT JOIN QuizResult qr
       ON qr.participant.id = u.id AND qr.study.id = s.id
WHERE s.id = :studyId
""")
    List<ParticipantProgressDTO> getParticipantsWithProgress(@Param("studyId") Long studyId);
}