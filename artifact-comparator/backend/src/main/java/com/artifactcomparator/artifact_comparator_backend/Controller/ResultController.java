package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.TaskResultDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationTask;
import com.artifactcomparator.artifact_comparator_backend.Entity.ParticipantTaskResponse;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.EvaluationTaskRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.ParticipantTaskResponseRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/results")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ResultController {

    private final ParticipantTaskResponseRepository repo;
    private final EvaluationTaskRepository taskRepo;
    private final UserRepository userRepo;

    public ResultController(
            ParticipantTaskResponseRepository repo,
            EvaluationTaskRepository taskRepo,
            UserRepository userRepo
    ) {
        this.repo = repo;
        this.taskRepo = taskRepo;
        this.userRepo = userRepo;
    }

    @GetMapping("/{taskId}/{participantId}")
    public TaskResultDTO getResult(
            @PathVariable Long taskId,
            @PathVariable Long participantId
    ) {

        EvaluationTask task = taskRepo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User participant = userRepo.findById(participantId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ParticipantTaskResponse resp = repo.findByTaskAndParticipant(task, participant)
                .orElseThrow(() -> new RuntimeException("Response not found"));

        return new TaskResultDTO(
                task,
                task.getStudy().getCriteriaSorted(),
                resp.getAnswers()
        );
    }
}
