package com.artifactcomparator.artifact_comparator_backend.Util;

import com.artifactcomparator.artifact_comparator_backend.Entity.ArtifactFolder;
import com.artifactcomparator.artifact_comparator_backend.Entity.ArtifactUpload;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.ArtifactUploadRepository;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.*;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class ZipUtil {

    // Her user'ın klasörüne kaydedilecek
    private static final String UPLOAD_ROOT = "uploads/";

    public static Map<String, ArtifactUpload> extractAndSaveArtifacts(
            MultipartFile zipFile,
            String zipPrefix,
            ArtifactUploadRepository repo,
            User researcher,
            ArtifactFolder folder  // ⭐ NEW PARAMETER
    ) throws Exception {

        Map<String, ArtifactUpload> created = new HashMap<>();

        // Kullanıcı klasörü
        String userFolder = UPLOAD_ROOT + researcher.getUsername() + "/";
        Files.createDirectories(Paths.get(userFolder));

        try (InputStream fis = zipFile.getInputStream();
             ZipInputStream zis = new ZipInputStream(fis)) {

            ZipEntry entry;

            while ((entry = zis.getNextEntry()) != null) {
                if (entry.isDirectory()) continue;

                // -----------------------------
                // 1) ZIP içindeki orijinal dosya adı
                // -----------------------------
                String original = Paths.get(entry.getName()).getFileName().toString();

                // Skip hidden files and system files
                if (original.startsWith(".") || original.startsWith("__MACOSX")) {
                    continue;
                }

                // Extension ayır
                int dotIndex = original.lastIndexOf(".");
                String base = (dotIndex != -1) ? original.substring(0, dotIndex) : original;
                String ext = (dotIndex != -1) ? original.substring(dotIndex) : "";

                // -----------------------------
                // 2) Yeni isim → filename_zipPrefix.ext
                // -----------------------------
                String finalName = base + "_" + zipPrefix + ext;

                // -----------------------------
                // 3) Dosyayı yaz
                // -----------------------------
                Path outputPath = Paths.get(userFolder, finalName);
                Files.copy(zis, outputPath, StandardCopyOption.REPLACE_EXISTING);

                // -----------------------------
                // 4) DB kaydı - ⭐ FOLDER EKLE
                // -----------------------------
                ArtifactUpload art = new ArtifactUpload();
                art.setFilename(finalName);
                art.setFilepath("/uploads/" + researcher.getUsername() + "/" + finalName);
                art.setCategory(null);
                art.setTags(null);
                art.setResearcher(researcher);
                art.setFolder(folder);  // ⭐ SET THE FOLDER

                repo.save(art);

                // CSV'de "artifact1.java" şeklinde aranan key → orijinal isim
                created.put(original, art);

                System.out.println("  ✅ Saved: " + finalName + " → folder: " + folder.getName());
            }
        }

        return created;
    }
}
