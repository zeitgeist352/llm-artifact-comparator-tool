package com.artifactcomparator.artifact_comparator_backend.DTO;

import java.time.LocalDateTime;
import java.util.List;

public class StudyMonitorDTO {

    public String studyTitle;
    public LocalDateTime studyEndDate;

    public int totalParticipants;
    public double overallProgressPercentage;

    public List<TaskMonitorDTO> tasks;
}
