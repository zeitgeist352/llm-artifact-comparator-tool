package com.artifactcomparator.artifact_comparator_backend.DTO;

public class TaskMonitorDTO {

    public Long taskId;
    public String questionText;

    public int totalParticipants;
    public int completedParticipants;
    public double completionRate;

    public int correctCount;
    public int incorrectCount;
    public int unansweredCount;
}
