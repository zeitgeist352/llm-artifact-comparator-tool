package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "Users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String lastname;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; // RESEARCHER, PARTICIPANT, ADMIN, REVIEWER

    @ManyToMany(mappedBy = "reviewers", fetch = FetchType.LAZY)
    @JsonBackReference
    private List<Study> reviewedStudies;

    // 🔹 Katıldığı çalışmalar (Participant ilişkisi)
    @ManyToMany(mappedBy = "participants", fetch = FetchType.LAZY)
    @JsonBackReference
    private List<Study> joinedStudies;

    // 🔹 Yüklediği artifact'ler (sadece researcher'lar kullanır)
    @OneToMany(mappedBy = "researcher", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<ArtifactUpload> uploadedArtifacts;
}
