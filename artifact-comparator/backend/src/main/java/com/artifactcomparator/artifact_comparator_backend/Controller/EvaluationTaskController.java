package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.EvaluationTaskCreateRequest;
import com.artifactcomparator.artifact_comparator_backend.DTO.TaskDetailsDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.TaskUpdateRequest;
import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Service.TaskArtifactService;
import com.artifactcomparator.artifact_comparator_backend.Service.EvaluationTaskService;
import com.artifactcomparator.artifact_comparator_backend.Service.StudyService;

import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:3000")
public class EvaluationTaskController {

    private final EvaluationTaskService evaluationTaskService;
    private final StudyService studyService;
    private final TaskArtifactService taskArtifactService;

    public EvaluationTaskController(
            EvaluationTaskService evaluationTaskService,
            StudyService studyService,
            TaskArtifactService taskArtifactService
    ) {
        this.evaluationTaskService = evaluationTaskService;
        this.studyService = studyService;
        this.taskArtifactService = taskArtifactService;
    }

    @PostMapping("/create/{studyId}")
    public TaskDetailsDTO createTask(
            @PathVariable Long studyId,
            @RequestBody EvaluationTaskCreateRequest request
    ) {
        Study study = studyService.getStudyById(studyId);

        EvaluationTask task = new EvaluationTask();
        task.setStudy(study);
        task.setQuestionText(request.getQuestionText());
        task.setDescription(request.getDescription());
        task.setArtifactCount(request.getArtifactCount());

        // Artifacts
        // ⭐ Order guaranteed: fetch one-by-one in the same list order
        List<ArtifactUpload> orderedArtifacts = new ArrayList<>();

        for (Long id : request.getArtifactIds()) {
            ArtifactUpload art = taskArtifactService.getArtifactById(id);
            if (art != null) {
                orderedArtifacts.add(art);
            }
        }

        task.setArtifacts(orderedArtifacts);


        // Response fields (A1, A2, B1…)
        List<EvaluationCriterion> criteria = study.getEvaluationCriteria();
        evaluationTaskService.generateResponseFields(
                task,
                orderedArtifacts.size(),
                criteria.size()
        );

        // ============================
        // 🔥 NEW: Correct Answers
        // ============================
        if (request.getCorrectAnswers() != null) {

            // Validate that criterion belongs to this study
            List<Long> allowedIds = criteria.stream()
                    .map(EvaluationCriterion::getId)
                    .toList();

            for (CorrectAnswerEntry entry : request.getCorrectAnswers()) {
                if (!allowedIds.contains(entry.getCriterionId())) {
                    throw new RuntimeException("Invalid criterionId: " + entry.getCriterionId());
                }
            }

            task.setCorrectAnswers(request.getCorrectAnswers());
        } else {
            task.setCorrectAnswers(new ArrayList<>());
        }

        EvaluationTask saved = evaluationTaskService.createTask(task);

        return new TaskDetailsDTO(saved);
    }


    /* =====================================================================
                              GET TASKS BY STUDY
    ===================================================================== */
    @GetMapping("/study/{studyId}")
    public List<TaskDetailsDTO> getTasksByStudy(@PathVariable Long studyId) {
        Study study = studyService.getStudyById(studyId);
        return evaluationTaskService.getTasksByStudy(study)
                .stream()
                .map(TaskDetailsDTO::new)
                .toList();
    }

    /* =====================================================================
                              GET TASK BY ID
    ===================================================================== */
    @GetMapping("/{taskId}")
    public TaskDetailsDTO getTaskById(@PathVariable Long taskId) {
        return new TaskDetailsDTO(evaluationTaskService.getTaskById(taskId));
    }

    /* =====================================================================
                              GET TASK DETAILS
    ===================================================================== */
    @GetMapping("/details/{taskId}")
    public TaskDetailsDTO getTaskDetails(@PathVariable Long taskId) {
        return new TaskDetailsDTO(evaluationTaskService.getTaskById(taskId));
    }

    /* =====================================================================
                              UPDATE TASK
    ===================================================================== */
    @PutMapping("/update/{taskId}")
    public TaskDetailsDTO updateTask(
            @PathVariable Long taskId,
            @RequestBody TaskUpdateRequest request
    ) {
        EvaluationTask updated = evaluationTaskService.updateTaskInfo(taskId, request);
        return new TaskDetailsDTO(updated);
    }

    /* =====================================================================
                          UPDATE ARTIFACT SELECTION
    ===================================================================== */
    @PutMapping("/update-artifacts/{taskId}")
    public TaskDetailsDTO updateTaskArtifacts(
            @PathVariable Long taskId,
            @RequestBody Map<String, List<Long>> body
    ) {
        EvaluationTask updated =
                evaluationTaskService.updateTaskArtifacts(taskId, body.get("artifactIds"));
        return new TaskDetailsDTO(updated);
    }

    /* =====================================================================
                          UPDATE CORRECT ANSWERS (NEW SYSTEM)
    ===================================================================== */
    @PutMapping("/update-correct-answer/{taskId}")
    public TaskDetailsDTO updateCorrectAnswers(
            @PathVariable Long taskId,
            @RequestBody List<CorrectAnswerEntry> answers
    ) {
        EvaluationTask updated =
                evaluationTaskService.updateCorrectAnswers(taskId, answers);

        return new TaskDetailsDTO(updated);
    }

    @DeleteMapping("/{taskId}")
    public void deleteTask(@PathVariable Long taskId) {
        evaluationTaskService.deleteTaskHard(taskId);
    }

}
