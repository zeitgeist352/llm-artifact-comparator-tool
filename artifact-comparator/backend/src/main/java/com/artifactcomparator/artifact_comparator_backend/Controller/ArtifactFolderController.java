package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.Entity.ArtifactFolder;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.ArtifactFolderRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.ArtifactUploadRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import com.artifactcomparator.artifact_comparator_backend.Service.ArtifactFolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/artifact-folders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ArtifactFolderController {

    private final ArtifactFolderService folderService;
    private final UserRepository userRepo; // ⭐ ADD THIS
    private final ArtifactFolderRepository folderRepo; // ⭐ ADD THIS
    private final ArtifactUploadRepository artifactRepo; // ⭐ ADD THIS

    @PostMapping
    public ResponseEntity<?> createFolder(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails userDetails // ⭐ CHANGE THIS
    ) {
        System.out.println("🔵 CREATE FOLDER ENDPOINT CALLED");
        System.out.println("Request body: " + request);

        if (userDetails == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        try {
            // ⭐ GET USER FROM DATABASE LIKE YOUR OTHER CONTROLLERS
            String username = userDetails.getUsername();
            User currentUser = userRepo.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            System.out.println("Current user: " + currentUser.getUsername());

            String name = (String) request.get("name");
            System.out.println("Folder name: " + name);

            Long parentFolderId = null;

            if (request.get("parentFolderId") != null) {
                parentFolderId = Long.valueOf(request.get("parentFolderId").toString());
            }
            System.out.println("Parent folder ID: " + parentFolderId);

            if (name == null || name.trim().isEmpty()) {
                System.out.println("❌ Folder name is empty");
                return ResponseEntity.badRequest().body(Map.of("error", "Folder name is required"));
            }

            System.out.println("🟢 Calling service to create folder...");
            ArtifactFolder folder = folderService.createFolder(name.trim(), currentUser, parentFolderId);
            System.out.println("✅ Folder created with ID: " + folder.getId());

            return ResponseEntity.ok(folder);

        } catch (Exception e) {
            System.out.println("❌ ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my-folders")
    public ResponseEntity<?> getMyFolders(@AuthenticationPrincipal UserDetails userDetails) {
        System.out.println("🔵 GET MY FOLDERS ENDPOINT CALLED");

        if (userDetails == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        try {
            String username = userDetails.getUsername();
            User currentUser = userRepo.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<ArtifactFolder> folders = folderService.getUserFolders(currentUser);
            System.out.println("Found " + folders.size() + " folders");
            return ResponseEntity.ok(folders);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    // ⭐ UPDATED: Root folders with artifact count
    @GetMapping("/root")
    public ResponseEntity<?> getRootFolders(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        try {
            String username = userDetails.getUsername();
            User currentUser = userRepo.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<ArtifactFolder> rootFolders = folderRepo.findByParentFolderIsNullAndOwnerId(
                    currentUser.getId()
            );

            // Add artifact count to each folder
            List<Map<String, Object>> foldersWithCount = rootFolders.stream()
                    .map(folder -> {
                        Long count = artifactRepo.countByFolderId(folder.getId());
                        Map<String, Object> folderData = new HashMap<>();
                        folderData.put("id", folder.getId());
                        folderData.put("name", folder.getName());
                        folderData.put("artifactCount", count);
                        return folderData;
                    })
                    .toList();

            return ResponseEntity.ok(foldersWithCount);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ⭐ NEW: Get subfolders with artifact count
    @GetMapping("/subfolders/{parentId}")
    public ResponseEntity<?> getSubfolders(
            @PathVariable Long parentId,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            String username = userDetails.getUsername();
            User researcher = userRepo.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Verify parent folder ownership
            ArtifactFolder parentFolder = folderRepo.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Folder not found"));

            if (!parentFolder.getOwner().getId().equals(researcher.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            // Get subfolders
            List<ArtifactFolder> subfolders = folderRepo.findByParentFolderIdAndOwnerId(
                    parentId,
                    researcher.getId()
            );

            // Add artifact count to each folder
            List<Map<String, Object>> foldersWithCount = subfolders.stream()
                    .map(folder -> {
                        Long count = artifactRepo.countByFolderId(folder.getId());
                        Map<String, Object> folderData = new HashMap<>();
                        folderData.put("id", folder.getId());
                        folderData.put("name", folder.getName());
                        folderData.put("artifactCount", count);
                        return folderData;
                    })
                    .toList();

            return ResponseEntity.ok(foldersWithCount);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFolder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        try {
            String username = userDetails.getUsername();
            User currentUser = userRepo.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ArtifactFolder folder = folderService.getFolderById(id, currentUser);
            return ResponseEntity.ok(folder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFolder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        try {
            String username = userDetails.getUsername();
            User currentUser = userRepo.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            folderService.deleteFolder(id, currentUser);
            return ResponseEntity.ok(Map.of("message", "Folder deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
