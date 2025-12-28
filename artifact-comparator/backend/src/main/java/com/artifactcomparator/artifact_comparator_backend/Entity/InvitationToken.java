package com.artifactcomparator.artifact_comparator_backend.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class InvitationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String token; // random 64 chars
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    @ManyToOne
    private User participant;

    @ManyToOne
    private Study study;

    // getters & setters
}
