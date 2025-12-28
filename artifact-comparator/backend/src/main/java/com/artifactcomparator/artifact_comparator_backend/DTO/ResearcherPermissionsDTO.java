package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResearcherPermissionsDTO {
    private Long id;
    private Boolean canUploadArtifacts;
    private Boolean canEditStudyDetails;
    private Boolean canInviteParticipants;
    private Boolean canManageResearchers;
}