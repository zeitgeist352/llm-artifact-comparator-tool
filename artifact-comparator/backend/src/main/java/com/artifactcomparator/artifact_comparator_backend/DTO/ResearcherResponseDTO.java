package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResearcherResponseDTO {

    private Long id;
    private Long userId;
    private String username;
    private String email;
    private String name;
    private String lastname;
    private String status;                 // PENDING, ACCEPTED, REJECTED
    private Long invitedAt;                // epoch / long
    private Long acceptedAt;               // epoch / long (nullable)
    private ResearcherPermissionsDTO permissions;

    private Long studyId;                  // study info
    private String studyTitle;             // study info

    // Ana constructor
    public ResearcherResponseDTO(
            Long id,
            Long userId,
            String username,
            String email,
            String name,
            String lastname,
            String status,
            Long invitedAt,
            Long acceptedAt,
            ResearcherPermissionsDTO permissions
    ) {
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.name = name;
        this.lastname = lastname;
        this.status = status;
        this.invitedAt = invitedAt;
        this.acceptedAt = acceptedAt;
        this.permissions = permissions;
    }
}