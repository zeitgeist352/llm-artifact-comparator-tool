package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.*;

// ✅ DTO for inviting a new researcher
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InviteResearcherRequestDTO {
    private String username; // Email of the researcher to invite
    private Boolean canUploadArtifacts;
    private Boolean canEditStudyDetails;
    private Boolean canInviteParticipants;
}