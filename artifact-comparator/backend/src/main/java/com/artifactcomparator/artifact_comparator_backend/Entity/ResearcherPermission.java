package com.artifactcomparator.artifact_comparator_backend.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "researcher_permissions")
public class ResearcherPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ Can upload artifacts to the project
    @Column(nullable = false)
    private Boolean canUploadArtifacts = false;

    // ✅ Can edit study details
    @Column(nullable = false)
    private Boolean canEditStudyDetails = false;

    // ✅ Can invite new participants
    @Column(nullable = false)
    private Boolean canInviteParticipants = false;

    // Optional: Can manage other researchers
    @Column(nullable = false)
    private Boolean canManageResearchers = false;
}