package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "admin_action_log")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // 🔹 Proxy hatasını önler
public class AdminActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // admin bir User nesnesidir
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    @JsonIgnoreProperties({"password", "email"}) // gereksiz alanları gizle
    private User admin;

    private String actionType;    // Örnek: DELETE_USER, CHANGE_ROLE
    private String description;   // Örnek: "Deleted user johndoe"
    private LocalDateTime timestamp;

    public AdminActionLog(User admin, String actionType, String description) {
        this.admin = admin;
        this.actionType = actionType;
        this.description = description;
        this.timestamp = LocalDateTime.now();
    }
}
