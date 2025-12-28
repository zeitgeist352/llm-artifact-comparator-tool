package com.artifactcomparator.artifact_comparator_backend.Enums;

public enum StudyStatus {
    DRAFT,        // Created but not yet published
    ACTIVE,       // Currently running (participants can join)
    COMPLETED,    // Finished (no more evaluations)
    ARCHIVED,
    BLOCKED// Old or hidden from main view
}

