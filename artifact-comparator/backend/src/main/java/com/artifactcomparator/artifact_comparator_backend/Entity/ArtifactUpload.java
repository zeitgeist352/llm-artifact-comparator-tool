package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "uploaded_files")
public class ArtifactUpload {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String filepath;

    @Column(name = "category")
    private String category;

    @Column(name = "tags", length = 1000)
    private String tags;

    // ⭐ NEW: Folder relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    @JsonBackReference("folder-artifacts")
    private ArtifactFolder folder;

    // 🔹 Researcher bağlantısı (foreign key)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "researcher_id", nullable = false)
    @JsonBackReference("researcher-artifacts")
    private User researcher;
}
