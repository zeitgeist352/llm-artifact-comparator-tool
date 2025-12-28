package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.AdminActionLog;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminActionLogRepository extends JpaRepository<AdminActionLog, Long> {

    // 🔹 Belirli bir admin'e ait tüm logları sil
    void deleteByAdmin(User admin);
}
