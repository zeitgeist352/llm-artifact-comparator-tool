package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.InvitationToken;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvitationTokenRepository extends JpaRepository<InvitationToken, Long> {

    Optional<InvitationToken> findByToken(String token);

    void deleteByParticipantIdAndStudyId(Long participantId, Long studyId);

    @Modifying
    @Query("""
    DELETE FROM InvitationToken it
    WHERE it.study = :study
""")
    void deleteByStudy(@Param("study") Study study);

}

