package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Enums.ReportType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private ReportType type; // ARTIFACT / PARTICIPANT

    private Long taskId;

    // ARTIFACT REPORT
    private Long artifactId;

    // PARTICIPANT REPORT
    private String reportedUsername;

    @ManyToOne
    @JoinColumn(name = "reporter_id")
    private User reporter;  // raporu gönderen participant

    private String reason;        // required
    private String description;   // required

    private LocalDateTime createdAt;

    // COMMENT REPORT
    private Long commentId;

    private String commentSnapshot;
}
