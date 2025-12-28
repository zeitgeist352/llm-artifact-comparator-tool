package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "artifact_folders")
public class ArtifactFolder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonBackReference("owner-folders") // ⭐ Give it a unique name
    private User owner;

    // ⭐ CHANGE THIS: Remove @JsonBackReference so it's serialized
    @ManyToOne(fetch = FetchType.EAGER) // ⭐ Change to EAGER
    @JoinColumn(name = "parent_folder_id")
    @JsonProperty("parentFolder") // ⭐ Explicitly include in JSON
    private ArtifactFolder parentFolder;

    // ⭐ Keep this to prevent infinite recursion
    @OneToMany(mappedBy = "parentFolder", cascade = CascadeType.ALL)
    @JsonIgnore // Don't serialize subfolders in the parent
    private List<ArtifactFolder> subFolders = new ArrayList<>();

    @OneToMany(mappedBy = "folder", cascade = CascadeType.ALL)
    @JsonIgnore // Don't serialize artifacts in folder list
    private List<ArtifactUpload> artifacts = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
