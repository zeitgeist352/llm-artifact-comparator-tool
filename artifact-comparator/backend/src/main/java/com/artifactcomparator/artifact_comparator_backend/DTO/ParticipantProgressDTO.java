package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ParticipantProgressDTO {

    private Long id;
    private String name;
    private String lastname;
    private String email;
    private Double progress;

    // ✅ SADECE DOUBLE CONSTRUCTOR KALACAK
    public ParticipantProgressDTO(Long id, String name, String lastname, String email, Double progress) {
        this.id = id;
        this.name = name;
        this.lastname = lastname;
        this.email = email;
        this.progress = progress;
    }
}