package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.ArtifactFolder;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArtifactFolderRepository extends JpaRepository<ArtifactFolder, Long> {

    // Find all folders owned by a user
    List<ArtifactFolder> findByOwner(User owner);

    // Find folders by owner and parent folder
    List<ArtifactFolder> findByOwnerAndParentFolder(User owner, ArtifactFolder parentFolder);

    // Find root folders (no parent) for a user
    List<ArtifactFolder> findByOwnerAndParentFolderIsNull(User owner);

    // ⭐ NEW: Find root folders by owner ID
    List<ArtifactFolder> findByParentFolderIsNullAndOwnerId(Long ownerId);

    // ⭐ NEW: Find subfolders by parent ID and owner ID
    List<ArtifactFolder> findByParentFolderIdAndOwnerId(Long parentId, Long ownerId);

    // Add this to your existing ArtifactUploadRepository.java


    // Check if folder exists with name and owner
    Optional<ArtifactFolder> findByNameAndOwnerAndParentFolder(String name, User owner, ArtifactFolder parentFolder);
}
