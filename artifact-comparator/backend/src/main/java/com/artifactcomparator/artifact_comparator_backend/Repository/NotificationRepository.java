package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.Notification;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Fetch notifications for a specific user, ordered by the newest first
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndStudyId(Long userId, Long studyId);

    // Optional: Fetch only unread notifications
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    @Modifying
    @Query("""
    DELETE FROM Notification n
    WHERE n.study = :study
""")
    void deleteByStudy(@Param("study") Study study);

}