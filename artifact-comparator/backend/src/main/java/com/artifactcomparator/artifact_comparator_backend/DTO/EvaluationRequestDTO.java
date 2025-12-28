package com.artifactcomparator.artifact_comparator_backend.DTO;

import com.artifactcomparator.artifact_comparator_backend.Enums.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EvaluationRequestDTO {

    private Long taskId;

    private StudyType studyType;

    // =======================
    // SNAPSHOT EVALUATION
    // =======================
    private Boolean colorChange;
    private Boolean shapeChange;
    private Boolean positionChange;
    private Boolean layoutChange;
    private Boolean visibilityChange;
    private Boolean fontChange;
    private Boolean contentChange;
    private Boolean sizeChange;
    private Boolean unknownChange;

    // =======================
    // BUG EVALUATION
    // =======================
    private Boolean configurationIssue;
    private Boolean networkIssue;
    private Boolean databaseIssue;
    private Boolean guiIssue;
    private Boolean performanceIssue;
    private Boolean permissionIssue;
    private Boolean securityIssue;
    private Boolean functionalIssue;
    private Boolean testCodeIssue;

    // =======================
    // SOLID EVALUATION
    // =======================
    private Boolean srp;
    private Boolean ocp;
    private Boolean lsp;
    private Boolean isp;
    private Boolean dip;

    private Boolean easy;
    private Boolean medium;
    private Boolean hard;

    // =======================
    // CLONE EVALUATION
    // =======================
    private Boolean isClone;
    private String cloneType;
}
