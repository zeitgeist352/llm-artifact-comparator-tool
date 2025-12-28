package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.Service.BulkUploadService;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.ArtifactFolderRepository;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Entity.ArtifactFolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/bulk")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class BulkUploadController {

    private final BulkUploadService bulkUploadService;
    private final UserRepository userRepository;
    private final ArtifactFolderRepository folderRepository;

    public BulkUploadController(
            BulkUploadService bulkUploadService,
            UserRepository userRepository,
            ArtifactFolderRepository folderRepository) {
        this.bulkUploadService = bulkUploadService;
        this.userRepository = userRepository;
        this.folderRepository = folderRepository;
    }

    @PostMapping("/upload/{studyId}")
    public ResponseEntity<?> bulkUpload(
            @PathVariable Long studyId,
            @RequestParam("zipFile") MultipartFile zipFile,
            @RequestParam("csvFile") MultipartFile csvFile,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            User researcher = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Researcher not found"));

            // ⭐ 1. CREATE FOLDER NAMED AFTER ZIP FILE
            String zipFileName = zipFile.getOriginalFilename();
            if (zipFileName == null) {
                zipFileName = "BulkUpload_" + System.currentTimeMillis();
            }

            // Remove .zip extension
            String folderName = zipFileName.endsWith(".zip")
                    ? zipFileName.substring(0, zipFileName.length() - 4)
                    : zipFileName;

            // Create the folder at root level
            ArtifactFolder bulkFolder = new ArtifactFolder();
            bulkFolder.setName(folderName);
            bulkFolder.setOwner(researcher);
            bulkFolder.setParentFolder(null); // Root level
            bulkFolder = folderRepository.save(bulkFolder);

            System.out.println("📁 Created folder: " + folderName + " (ID: " + bulkFolder.getId() + ")");

            // ⭐ 2. PROCESS BULK UPLOAD WITH FOLDER
            int tasksCreated = bulkUploadService.processBulkUpload(
                    studyId,
                    zipFile,
                    csvFile,
                    researcher,
                    bulkFolder  // ⭐ Pass the folder to service
            );

            return ResponseEntity.ok(Map.of(
                    "message", "Bulk upload completed successfully",
                    "folderName", folderName,
                    "folderId", bulkFolder.getId(),
                    "tasksCreated", tasksCreated
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Bulk upload failed: " + e.getMessage()
            ));
        }
    }
}

