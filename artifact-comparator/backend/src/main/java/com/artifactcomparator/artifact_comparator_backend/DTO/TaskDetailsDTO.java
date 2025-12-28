package com.artifactcomparator.artifact_comparator_backend.DTO;

import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Enums.StudyType;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class TaskDetailsDTO {

    private Long id;
    private String questionText;
    private String description;
    private int artifactCount;

    private List<ArtifactUpload> artifacts;
    private List<String> responseFields;

    private List<EvaluationCriterion> evaluationCriteria;
    private List<User> completedParticipants;
    private List<User> allParticipants;

    private String studyStatus;
    private StudyType studyType;
    private List<ArtifactFieldDTO> artifactFields;

    // ⭐ NEW CORRECT ANSWER SYSTEM
    private List<CorrectAnswerEntry> correctAnswers;

    /* ============================================================
                     CONSTRUCTOR — BUILD FROM TASK
    ============================================================ */
    public TaskDetailsDTO(EvaluationTask task) {

        this.id = task.getId();
        this.questionText = task.getQuestionText();
        this.description = task.getDescription();
        this.artifactCount = task.getArtifactCount();

        this.artifacts = task.getArtifacts();
        this.responseFields = task.getResponseFields();

        this.evaluationCriteria = task.getStudy().getEvaluationCriteria();
        this.completedParticipants = task.getCompletedParticipants();
        this.allParticipants = task.getStudy().getParticipants();

        this.studyStatus = task.getStudy().getStatus().name();
        this.studyType = task.getStudy().getStudyType();

        // ⭐ New unified correct answer list
        this.correctAnswers = task.getCorrectAnswers();

        List<ArtifactFieldDTO> list = new ArrayList<>();

        if (task.getArtifacts() != null && task.getResponseFields() != null) {
            for (int i = 0; i < task.getArtifacts().size(); i++) {
                ArtifactUpload art = task.getArtifacts().get(i);
                String fieldCode = task.getResponseFields().get(i); // A1, A2...
                list.add(new ArtifactFieldDTO(
                        art.getId(),
                        art.getFilename(),
                        fieldCode
                ));
            }
        }

        this.artifactFields = list;
    }
}
