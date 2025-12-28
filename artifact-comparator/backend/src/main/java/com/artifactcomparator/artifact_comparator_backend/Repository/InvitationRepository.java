package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.Invitation;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {

    /**
     * Finds an invitation for a specific user in a specific study.
     * Useful for checking if an invitation already exists.
     */
    Invitation findByStudyIdAndUserId(Long studyId, Long userId);

    /**
     * Finds all invitations for a specific user, filtered by status (e.g., PENDING).
     */
    List<Invitation> findByUserIdAndStatus(Long userId, Invitation.InvitationStatus status);
    List<Invitation> findByUserIdAndStatusAndRole(Long userId, Invitation.InvitationStatus status, Role role);

    /**
     * Finds all invitations associated with a specific study.
     */
    List<Invitation> findByStudyId(Long studyId);

    /**
     * Checks if a user has a pending invitation for a study.
     */
    boolean existsByStudyIdAndUserIdAndStatus(Long studyId, Long userId, Invitation.InvitationStatus status);

    // =========================
    // HARD DELETE (🔥)
    // =========================
    @Modifying
    @Query("""
        DELETE FROM Invitation i
        WHERE i.study = :study
    """)
    void deleteByStudy(@Param("study") Study study);


}