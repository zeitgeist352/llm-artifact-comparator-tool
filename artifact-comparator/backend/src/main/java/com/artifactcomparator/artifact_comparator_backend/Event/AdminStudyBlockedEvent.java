package com.artifactcomparator.artifact_comparator_backend.Event;

import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class AdminStudyBlockedEvent extends ApplicationEvent {
    private final Study study;
    private final String reason;
    private final boolean blocked;

    public AdminStudyBlockedEvent (Object source, Study study, String reason, boolean blocked) {
        super(source);
        this.study = study;
        this.reason = reason;
        this.blocked = blocked;
    }
}
