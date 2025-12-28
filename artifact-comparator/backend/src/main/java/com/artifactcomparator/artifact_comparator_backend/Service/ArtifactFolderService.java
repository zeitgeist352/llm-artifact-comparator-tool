package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.Entity.ArtifactFolder;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.ArtifactFolderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ArtifactFolderService {

    private final ArtifactFolderRepository folderRepository;

    @Transactional
    public ArtifactFolder createFolder(String name, User owner, Long parentFolderId) {
        ArtifactFolder parentFolder = null;

        // If parent folder ID is provided, fetch it
        if (parentFolderId != null) {
            parentFolder = folderRepository.findById(parentFolderId)
                    .orElseThrow(() -> new RuntimeException("Parent folder not found"));

            // Verify the parent folder belongs to the same owner
            if (!parentFolder.getOwner().getId().equals(owner.getId())) {
                throw new RuntimeException("Unauthorized to create folder in this location");
            }
        }

        // Check if folder with same name already exists in this location
        var existing = folderRepository.findByNameAndOwnerAndParentFolder(name, owner, parentFolder);
        if (existing.isPresent()) {
            throw new RuntimeException("Folder with this name already exists in this location");
        }

        // Create new folder
        ArtifactFolder folder = new ArtifactFolder();
        folder.setName(name);
        folder.setOwner(owner);
        folder.setParentFolder(parentFolder);

        return folderRepository.save(folder);
    }

    @Transactional(readOnly = true)
    public List<ArtifactFolder> getUserFolders(User owner) {
        return folderRepository.findByOwner(owner);
    }

    @Transactional(readOnly = true)
    public List<ArtifactFolder> getRootFolders(User owner) {
        return folderRepository.findByOwnerAndParentFolderIsNull(owner);
    }

    @Transactional(readOnly = true)
    public ArtifactFolder getFolderById(Long id, User owner) {
        ArtifactFolder folder = folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        // Verify ownership
        if (!folder.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Unauthorized access to this folder");
        }

        return folder;
    }

    @Transactional
    public void deleteFolder(Long id, User owner) {
        ArtifactFolder folder = getFolderById(id, owner);

        // Check if folder has artifacts or subfolders
        if (!folder.getArtifacts().isEmpty() || !folder.getSubFolders().isEmpty()) {
            throw new RuntimeException("Cannot delete folder: it contains artifacts or subfolders");
        }

        folderRepository.delete(folder);
    }
}
