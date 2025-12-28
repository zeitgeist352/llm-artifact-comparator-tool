package com.artifactcomparator.artifact_comparator_backend.Event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ReportThresholdReachedEvent extends ApplicationEvent {

    private final Long artifactId;
    private final String reportedUsername;
    private final boolean isArtifactReport;
    private final Long studyId;

    public ReportThresholdReachedEvent(
            Object source,
            Long artifactId,
            String reportedUsername,
            boolean isArtifactReport,
            Long studyId
    ) {
        super(source);
        this.artifactId = artifactId;
        this.reportedUsername = reportedUsername;
        this.isArtifactReport = isArtifactReport;
        this.studyId = studyId;
    }
}
