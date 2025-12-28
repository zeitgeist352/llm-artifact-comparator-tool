package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationTask;
import com.artifactcomparator.artifact_comparator_backend.Entity.Report;
import com.artifactcomparator.artifact_comparator_backend.Enums.ReportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByType(ReportType type);

    List<Report> findByTaskId(Long taskId);

    List<Report> findByArtifactId(Long artifactId);

    List<Report> findByReportedUsername(String username);

    long countByArtifactId(Long artifactId);

    long countByReportedUsername(String username);

    long countByTaskId(Long taskId);

    // =========================
    // HARD DELETE (🔥)
    // =========================
    @Modifying
    @Query("""
        DELETE FROM Report r
        WHERE r.taskId = :taskId
    """)
    void deleteByTaskId(@Param("taskId") Long taskId);
}
