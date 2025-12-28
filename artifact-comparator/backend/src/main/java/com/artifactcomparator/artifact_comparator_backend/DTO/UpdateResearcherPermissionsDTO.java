package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateResearcherPermissionsDTO {
    private Boolean canUploadArtifacts;
    private Boolean canEditStudyDetails;
    private Boolean canInviteParticipants;
}