package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.Researcher;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ResearcherRepository extends JpaRepository<Researcher, Long> {

    List<Researcher> findByStudy(Study study);

    List<Researcher> findByStudyAndStatus(Study study, Researcher.ResearcherStatus status);

    Optional<Researcher> findByStudyAndUser(Study study, User user);

    boolean existsByStudyAndUser(Study study, User user);

    List<Researcher> findByUser(User user);

    // ❌ BU YANLIŞTI → SİLİYORUZ
    // List<Researcher> findByStudyAndStatusAccepted(Study study);

    List<Researcher> findByUserId(Long userId);

    @Modifying
    @Query("""
    DELETE FROM Researcher r
    WHERE r.study = :study
""")
    void deleteByStudy(@Param("study") Study study);

}