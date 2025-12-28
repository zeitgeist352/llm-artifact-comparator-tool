package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "researchers")
public class Researcher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private boolean mainResearcher = false;

    // 🔹 Bağlı olduğu çalışma (Study)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id", nullable = false)
    @JsonBackReference
    private Study study;

    // 🔹 Co-researcher olan User (ANA RESEARCHER DEĞİL!)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 🔹 Davet gönderildiği zaman
    @Column(nullable = false, updatable = false)
    private LocalDateTime invitedAt = LocalDateTime.now();

    // 🔹 Kabul edildiği zaman
    private LocalDateTime acceptedAt;

    // 🔹 PENDING, ACCEPTED, REJECTED
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResearcherStatus status = ResearcherStatus.PENDING;

    // 🔹 Bu co-researcher için özel izinler
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "permission_id", nullable = false)
    private ResearcherPermission permissions;

    public enum ResearcherStatus {
        PENDING,
        ACCEPTED,
        REJECTED
    }
}