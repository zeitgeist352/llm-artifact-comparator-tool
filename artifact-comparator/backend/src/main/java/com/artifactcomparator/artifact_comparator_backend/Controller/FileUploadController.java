package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.Entity.ArtifactUpload;
import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationTask;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.ArtifactUploadRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
public class FileUploadController {

    private final UserRepository userRepository;
    // backend/uploads içine kayıt edecek
    private static final String UPLOAD_DIR = "uploads/";
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "text/plain", "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv", "text/markdown",
            "image/png", "image/jpeg", "image/jpg",
            "text/x-java-source", "text/x-python", "application/x-python-code",
            "text/x-c", "text/x-csrc", "text/x-c++src", "text/x-c++",
            "application/javascript", "text/javascript", "text/x-typescript",
            "text/x-csharp", "text/x-ruby", "text/x-go", "text/x-rustsrc",
            "text/html", "text/css", "application/json", "text/json",
            "application/xml", "text/xml", "application/x-yaml", "text/yaml", "text/x-yaml",
            "text/x-swift"
    );

    @Autowired
    private ArtifactUploadRepository fileRepo;

    @Autowired
    private UserRepository userRepo;

    public FileUploadController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // 🔹 Upload endpoint
    @PostMapping("/uploadFile")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String username = userDetails.getUsername();
        User researcher = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 50 MB limit"));
        }

        String filename = Optional.ofNullable(file.getOriginalFilename()).orElse("unnamed");
        String contentType = file.getContentType();

        boolean isAllowed = ALLOWED_TYPES.contains(contentType)
                || filename.matches(".*\\.(txt|pdf|png|jpg|jpeg|json|docx|xlsx|cpp|java|js|py|rb|html|css|md|csv|swift|ts|go|rs|xml|yml|yaml)$");

        if (!isAllowed) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Unsupported file type: only common text, image, and document formats are allowed"
            ));
        }

        try {
            Path userDir = Paths.get(UPLOAD_DIR, username);
            Files.createDirectories(userDir);

            Path filePath = userDir.resolve(Paths.get(filename).getFileName());
            Files.write(filePath, file.getBytes(), StandardOpenOption.CREATE);

            ArtifactUpload artifact = new ArtifactUpload();
            artifact.setFilename(filename);
            String webPath = "/uploads/" + username + "/" + filename;
            artifact.setFilepath(webPath);
            artifact.setCategory(null);
            artifact.setTags(null);
            artifact.setResearcher(researcher);

            fileRepo.save(artifact);

            System.out.printf("📁 [%s] File uploaded by %s → %s%n", LocalDateTime.now(), username, filename);

            return ResponseEntity.ok(Map.of(
                    "message", "File uploaded successfully",
                    "fileName", filename,
                    "path", filePath.toString()
            ));

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "File upload failed: " + e.getMessage()
            ));
        }
    }

    // 🔹 Get logged-in researcher's files
    @GetMapping("/myFiles")
    public ResponseEntity<List<ArtifactUpload>> getMyFiles(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null)
            return ResponseEntity.status(401).build();

        String username = userDetails.getUsername();
        User researcher = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        List<ArtifactUpload> myFiles = fileRepo.findByResearcherId(researcher.getId());
        return ResponseEntity.ok(myFiles);
    }

    // 🔹 Rename file
    @PutMapping("/renameFile/{id}")
    public ResponseEntity<Map<String, String>> renameFile(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        String username = userDetails.getUsername();
        User researcher = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        String newName = body.get("newName");
        if (newName == null || newName.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "New name cannot be empty"));

        ArtifactUpload file = fileRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getResearcher().getId().equals(researcher.getId()))
            return ResponseEntity.status(403).body(Map.of("error", "Permission denied"));

        Path oldPath = Paths.get(file.getFilepath());
        String extension = "";
        int dotIndex = file.getFilename().lastIndexOf(".");
        if (dotIndex != -1) extension = file.getFilename().substring(dotIndex);
        if (newName.contains(".")) newName = newName.substring(0, newName.lastIndexOf("."));

        String finalName = newName + extension;
        Path newPath = oldPath.getParent().resolve(finalName);

        try {
            Files.move(oldPath, newPath, StandardCopyOption.REPLACE_EXISTING);
            file.setFilename(finalName);
            file.setFilepath(newPath.toString());
            fileRepo.save(file);

            return ResponseEntity.ok(Map.of("message", "File renamed successfully", "newName", finalName));
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Rename failed: " + e.getMessage()));
        }
    }

    // 🔹 Delete file
    @DeleteMapping("/deleteFile/{id}")
    public ResponseEntity<Map<String, String>> deleteFile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        String username = userDetails.getUsername();
        User researcher = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        ArtifactUpload file = fileRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getResearcher().getId().equals(researcher.getId()))
            return ResponseEntity.status(403).body(Map.of("error", "Permission denied"));

        try {
            Files.deleteIfExists(Paths.get(file.getFilepath()));
            fileRepo.delete(file);
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Delete failed: " + e.getMessage()));
        }
    }

    // 🔹 Classify file (add category & tags)
    @PostMapping("/classifyFile/{id}")
    public ResponseEntity<Map<String, String>> classifyFile(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        String username = userDetails.getUsername();
        User researcher = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        ArtifactUpload file = fileRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getResearcher().getId().equals(researcher.getId()))
            return ResponseEntity.status(403).body(Map.of("error", "Permission denied"));

        String category = (String) data.get("category");
        @SuppressWarnings("unchecked")
        List<String> tagsList = (List<String>) data.get("tags");
        String tags = (tagsList != null) ? String.join(",", tagsList) : "";

        file.setCategory(category);
        file.setTags(tags);
        fileRepo.save(file);

        System.out.printf("🏷️ [%s] %s classified file %s → Category: %s, Tags: %s%n",
                LocalDateTime.now(), username, file.getFilename(), category, tags);

        return ResponseEntity.ok(Map.of("message", "Classification saved successfully"));
    }

    // ====================================================
// 🔹 SECURE FILE DOWNLOAD ENDPOINT
// ====================================================
    @GetMapping("/file/{id}")
    public ResponseEntity<Resource> getFile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        ArtifactUpload artifact = fileRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));

        String ownerUsername = artifact.getResearcher().getUsername();

        Optional<User> user = userRepository.findByUsername(userDetails.getUsername());
        List<Study> joined = user.get().getJoinedStudies();
        Long artifactId = artifact.getId();

        boolean allowed = false;

        for (Study study : joined) {
            for (EvaluationTask task : study.getEvaluationTasks()) {
                for (ArtifactUpload art : task.getArtifacts()) {
                    if (art.getId().equals(artifactId)) {
                        allowed = true;
                        break;
                    }
                }
                if (allowed) break;
            }
            if (allowed) break;
        }

        if (!allowed) {
            return ResponseEntity.status(403).build();
        }

        try {
            Path path = Paths.get(UPLOAD_DIR, ownerUsername, artifact.getFilename());
            Resource resource = new UrlResource(path.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            // === Content Type Belirleme ===
            String filename = artifact.getFilename().toLowerCase();
            MediaType type;

            if (filename.endsWith(".pdf")) {
                type = MediaType.APPLICATION_PDF;
            } else if (filename.endsWith(".png")) {
                type = MediaType.IMAGE_PNG;
            } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
                type = MediaType.IMAGE_JPEG;
            } else if (filename.endsWith(".txt") || filename.endsWith(".md") || filename.endsWith(".json")) {
                type = MediaType.TEXT_PLAIN;
            } else {
                type = MediaType.APPLICATION_OCTET_STREAM;
            }

            // === INLINE Açılmasını Sağla (İNDİRME YOK) ===
            return ResponseEntity.ok()
                    .header("Content-Disposition", "inline; filename=\"" + artifact.getFilename() + "\"")
                    .contentType(type)
                    .body(resource);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/researcher/artifact/{id}")
    public ResponseEntity<Resource> getArtifactForResearcher(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        User researcher = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        ArtifactUpload artifact = fileRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Artifact not found"));

        // 🔒 Sadece kendi artifact'ını görebilir
        if (!artifact.getResearcher().getId().equals(researcher.getId())) {
            return ResponseEntity.status(403).build();
        }

        try {
            // 🔥 Artifact DB'deki gerçek filepath'i kullan
            Path path = Paths.get("uploads", artifact.getResearcher().getUsername(), artifact.getFilename());
            Resource resource = new UrlResource(path.toUri());

            if (!resource.exists()) return ResponseEntity.notFound().build();

            String filename = artifact.getFilename().toLowerCase();
            MediaType type = filename.endsWith(".pdf") ? MediaType.APPLICATION_PDF :
                    filename.endsWith(".png") ? MediaType.IMAGE_PNG :
                            filename.endsWith(".jpg") || filename.endsWith(".jpeg") ? MediaType.IMAGE_JPEG :
                                    MediaType.TEXT_PLAIN;

            return ResponseEntity.ok()
                    .header("Content-Disposition", "inline; filename=\"" + artifact.getFilename() + "\"")
                    .contentType(type)
                    .body(resource);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/api/artifacts/upload-json")
    public ResponseEntity<?> uploadJsonArtifact(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String username = userDetails.getUsername();
        User researcher = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Researcher not found"));

        try {
            // 1) RAW NAME
            String rawName = (String) body.getOrDefault("filename", "solid_example");

            // 2) .json garanti et
            String filename = rawName.endsWith(".json") ? rawName : rawName + ".json";

            // 3) unique
            filename = filename.replace(".json", "_" + System.currentTimeMillis() + ".json");

            String content = (String) body.getOrDefault("content", "");
            String tags = (String) body.getOrDefault("tags", "");
            String category = (String) body.getOrDefault("category", "solid_violation");

            // 4) DOĞRU KLASÖRE YAZ
            Path userDir = Paths.get(UPLOAD_DIR, username);
            Files.createDirectories(userDir);

            Path filePath = userDir.resolve(filename);

            Files.writeString(
                    filePath,
                    content != null ? content : "",
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING
            );

            // 5) DB KAYDI
            ArtifactUpload artifact = new ArtifactUpload();
            artifact.setFilename(filename);

            // 🔥 Manuel upload ile aynı format
            artifact.setFilepath("/uploads/" + username + "/" + filename);

            artifact.setTags(tags);
            artifact.setCategory(category);
            artifact.setResearcher(researcher);

            ArtifactUpload saved = fileRepo.save(artifact);

            return ResponseEntity.ok(Map.of(
                    "id", saved.getId(),
                    "filename", saved.getFilename(),
                    "filepath", saved.getFilepath()
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }


}
