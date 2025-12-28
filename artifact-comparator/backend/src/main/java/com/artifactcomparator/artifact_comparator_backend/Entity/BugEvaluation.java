package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Entity.Base.BaseEvaluation;
import com.artifactcomparator.artifact_comparator_backend.Enums.BugCategory;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "bug_evaluations")
@Getter
@Setter
public class BugEvaluation extends BaseEvaluation {

    private boolean configurationIssue;
    private boolean networkIssue;
    private boolean databaseIssue;
    private boolean guiIssue;
    private boolean performanceIssue;
    private boolean permissionIssue;
    private boolean securityIssue;
    private boolean functionalIssue;
    private boolean testCodeIssue;
}
