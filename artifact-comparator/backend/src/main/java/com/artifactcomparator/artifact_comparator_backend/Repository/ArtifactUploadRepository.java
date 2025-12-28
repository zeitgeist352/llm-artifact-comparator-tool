package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.ArtifactFolder;
import com.artifactcomparator.artifact_comparator_backend.Entity.ArtifactUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArtifactUploadRepository extends JpaRepository<ArtifactUpload, Long> {


    // Researcher'a göre tüm artifactlar
    List<ArtifactUpload> findByResearcherId(Long researcherId);

    // 🔥 Yeni — startsWith matching
    List<ArtifactUpload> findByResearcherIdAndFilenameStartingWith(Long researcherId, String prefix);

    // ⭐ NEW: Find artifacts in a specific folder (using researcherId)
    List<ArtifactUpload> findByFolderIdAndResearcherId(Long folderId, Long researcherId);

    // ⭐ NEW: Find artifacts with no folder (root level) - using researcherId
    List<ArtifactUpload> findByFolderIsNullAndResearcherId(Long researcherId);

    Long countByFolderId(Long folderId);


    Optional<ArtifactUpload> findByFilenameAndResearcherIdAndFolderId(
            String filename, Long researcherId, Long folderId);

}
