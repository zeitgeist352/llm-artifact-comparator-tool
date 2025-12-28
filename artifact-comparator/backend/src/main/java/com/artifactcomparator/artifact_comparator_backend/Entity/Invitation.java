package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "invitations")
public class Invitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "study_id", nullable = false)
    private Study study;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, updatable = false)
    private LocalDateTime invitedAt = LocalDateTime.now();

    private LocalDateTime acceptedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; // RESEARCHER, PARTICIPANT, ADMIN, REVIEWER

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvitationStatus status = InvitationStatus.PENDING;

    public enum InvitationStatus {
        PENDING,
        ACCEPTED,
        REJECTED
    }
}