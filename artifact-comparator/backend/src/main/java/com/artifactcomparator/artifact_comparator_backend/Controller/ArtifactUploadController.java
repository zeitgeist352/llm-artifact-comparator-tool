package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.Entity.ArtifactFolder;
import com.artifactcomparator.artifact_comparator_backend.Entity.ArtifactUpload;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.ArtifactFolderRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.ArtifactUploadRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping("/api/artifacts")
public class ArtifactUploadController {

    private static final String UPLOAD_DIR = System.getProperty("user.home") + "/uploaded_files/";
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024;

    @Autowired
    private ArtifactUploadRepository fileRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private ArtifactFolderRepository folderRepo; // ⭐ NEW

    // ✅ 1. Artifact yükleme
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadArtifact(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        String username = userDetails.getUsername();
        User researcher = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        if (file.getSize() > MAX_FILE_SIZE)
            return ResponseEntity.badRequest().body(Map.of("error", "File exceeds 50 MB limit"));

        try {
            Path userDir = Paths.get(UPLOAD_DIR, username);
            Files.createDirectories(userDir);

            String filename = Optional.ofNullable(file.getOriginalFilename()).orElse("unnamed");
            Path filePath = userDir.resolve(filename);
            Files.write(filePath, file.getBytes(), StandardOpenOption.CREATE);

            ArtifactUpload artifact = new ArtifactUpload();
            artifact.setFilename(filename);
            artifact.setFilepath(filePath.toString());
            artifact.setResearcher(researcher);
            fileRepo.save(artifact);

            return ResponseEntity.ok(Map.of(
                    "message", "Artifact uploaded successfully",
                    "filename", filename,
                    "path", filePath.toString()
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ 2. Return only ROOT-LEVEL artifacts (no folder)
    @GetMapping("/my-artifacts")
    public ResponseEntity<List<ArtifactUpload>> getMyArtifacts(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null)
            return ResponseEntity.status(401).build();

        String username = userDetails.getUsername();
        User researcher = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        // ⭐ CHANGED: Only return artifacts with no folder (root level)
        List<ArtifactUpload> list = fileRepo.findByFolderIsNullAndResearcherId(researcher.getId());
        return ResponseEntity.ok(list);
    }

    // ⭐ NEW: Get artifacts in a specific folder
    @GetMapping("/folder/{folderId}")
    public ResponseEntity<?> getArtifactsInFolder(
            @PathVariable Long folderId,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        String username = userDetails.getUsername();
        User researcher = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        // Verify folder ownership
        ArtifactFolder folder = folderRepo.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        if (!folder.getOwner().getId().equals(researcher.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Permission denied"));
        }

        List<ArtifactUpload> artifacts = fileRepo.findByFolderIdAndResearcherId(folderId, researcher.getId());
        return ResponseEntity.ok(artifacts);
    }

    // ⭐ NEW: Move artifacts to folder
    @PatchMapping("/move")
    public ResponseEntity<Map<String, String>> moveArtifacts(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        String username = userDetails.getUsername();
        User researcher = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        try {
            @SuppressWarnings("unchecked")
            List<Integer> artifactIds = (List<Integer>) request.get("artifactIds");
            Object folderIdObj = request.get("folderId");

            ArtifactFolder targetFolder = null;
            if (folderIdObj != null) {
                Long folderId = Long.valueOf(folderIdObj.toString());

                // Verify folder ownership
                targetFolder = folderRepo.findById(folderId)
                        .orElseThrow(() -> new RuntimeException("Folder not found"));

                if (!targetFolder.getOwner().getId().equals(researcher.getId())) {
                    return ResponseEntity.status(403)
                            .body(Map.of("error", "Permission denied for folder"));
                }
            }

            for (Integer artifactId : artifactIds) {
                ArtifactUpload artifact = fileRepo.findById(Long.valueOf(artifactId))
                        .orElseThrow(() -> new RuntimeException("Artifact not found: " + artifactId));

                // Verify ownership
                if (!artifact.getResearcher().getId().equals(researcher.getId())) {
                    return ResponseEntity.status(403)
                            .body(Map.of("error", "Permission denied for artifact: " + artifactId));
                }

                artifact.setFolder(targetFolder);
                fileRepo.save(artifact);
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Artifacts moved successfully",
                    "count", String.valueOf(artifactIds.size())
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ 3. Artifact yeniden adlandırma
    @PutMapping("/rename/{id}")
    public ResponseEntity<Map<String, String>> renameArtifact(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        String username = userDetails.getUsername();
        User researcher = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        ArtifactUpload artifact = fileRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Artifact not found"));

        if (!artifact.getResearcher().getId().equals(researcher.getId()))
            return ResponseEntity.status(403).body(Map.of("error", "Permission denied"));

        String newName = body.get("newName");
        if (newName == null || newName.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "New name cannot be empty"));

        Path oldPath = Paths.get(artifact.getFilepath());
        String extension = artifact.getFilename().contains(".")
                ? artifact.getFilename().substring(artifact.getFilename().lastIndexOf("."))
                : "";
        if (newName.contains(".")) newName = newName.substring(0, newName.lastIndexOf("."));

        Path newPath = oldPath.getParent().resolve(newName + extension);

        try {
            Files.move(oldPath, newPath, StandardCopyOption.REPLACE_EXISTING);
            artifact.setFilename(newName + extension);
            artifact.setFilepath(newPath.toString());
            fileRepo.save(artifact);

            return ResponseEntity.ok(Map.of("message", "Artifact renamed successfully"));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/deleteFile/{fileId}")
    public ResponseEntity<?> deleteFile(
            @PathVariable Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            String username = userDetails.getUsername();
            User currentUser = userRepo.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ArtifactUpload artifact = fileRepo.findById(fileId)
                    .orElseThrow(() -> new RuntimeException("File not found"));

            if (!artifact.getResearcher().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            // ⭐ TRY TO DELETE
            try {
                fileRepo.delete(artifact);
                fileRepo.flush();
                return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
            } catch (Exception e) {
                // Delete failed - likely being used in a study
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Cannot delete: This artifact is used in one or more studies")
                );
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    @DeleteMapping("/bulk-delete")
    public ResponseEntity<?> bulkDeleteArtifacts(
            @RequestBody Map<String, List<Long>> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            List<Long> artifactIds = request.get("artifactIds");
            if (artifactIds == null || artifactIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No artifact IDs provided"));
            }

            String username = userDetails.getUsername();
            User currentUser = userRepo.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            int deletedCount = 0;
            int usedCount = 0;
            int notFoundCount = 0;
            List<String> usedArtifactNames = new ArrayList<>();

            for (Long fileId : artifactIds) {
                Optional<ArtifactUpload> artifactOpt = fileRepo.findById(fileId);

                if (!artifactOpt.isPresent()) {
                    notFoundCount++;
                    continue;
                }

                ArtifactUpload artifact = artifactOpt.get();

                // Check ownership
                if (!artifact.getResearcher().getId().equals(currentUser.getId())) {
                    notFoundCount++;
                    continue;
                }

                // Try to delete - if it fails due to foreign key constraint, it's being used
                try {
                    fileRepo.delete(artifact);
                    fileRepo.flush(); // Force the delete to happen now
                    deletedCount++;
                } catch (Exception e) {
                    // Delete failed - likely due to foreign key constraint
                    usedCount++;
                    usedArtifactNames.add(artifact.getFilename());
                    System.out.println("❌ Cannot delete artifact " + fileId + ": " + e.getMessage());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("deletedCount", deletedCount);
            response.put("usedCount", usedCount);
            response.put("notFoundCount", notFoundCount);
            response.put("usedArtifacts", usedArtifactNames);

            String message;
            if (deletedCount > 0 && usedCount > 0) {
                message = String.format("Deleted %d artifact(s). %d artifact(s) are used in studies and cannot be deleted.",
                        deletedCount, usedCount);
            } else if (deletedCount > 0) {
                message = String.format("Successfully deleted %d artifact(s).", deletedCount);
            } else if (usedCount > 0) {
                message = String.format("Cannot delete: %d artifact(s) are used in studies.", usedCount);
            } else {
                message = "No artifacts were deleted.";
            }

            response.put("message", message);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }



    // ✅ 5. Artifact kategorileme / etiketleme
    @PostMapping("/classify/{id}")
    public ResponseEntity<Map<String, String>> classifyArtifact(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        String username = userDetails.getUsername();
        User researcher = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        ArtifactUpload artifact = fileRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Artifact not found"));

        if (!artifact.getResearcher().getId().equals(researcher.getId()))
            return ResponseEntity.status(403).body(Map.of("error", "Permission denied"));

        String category = (String) data.get("category");
        @SuppressWarnings("unchecked")
        List<String> tagsList = (List<String>) data.get("tags");
        artifact.setCategory(category);
        artifact.setTags(tagsList != null ? String.join(",", tagsList) : null);
        fileRepo.save(artifact);

        return ResponseEntity.ok(Map.of("message", "Artifact classified successfully"));
    }
}
