package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.MonitorTaskDetailsDTO;
import com.artifactcomparator.artifact_comparator_backend.Service.MonitorTaskService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/monitor/task")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class MonitorTaskController {

    private final MonitorTaskService service;

    public MonitorTaskController(MonitorTaskService service) {
        this.service = service;
    }

    @GetMapping("/{taskId}/details")
    public MonitorTaskDetailsDTO getTaskDetails(@PathVariable Long taskId) {
        return service.getTaskDetails(taskId);
    }

    @GetMapping("/{taskId}/details-reviewer")
    public MonitorTaskDetailsDTO getTaskDetailsForReviewer(@PathVariable Long taskId) {
        MonitorTaskDetailsDTO res = service.getTaskDetails(taskId);
        List<MonitorTaskDetailsDTO.ParticipantAnswerDTO> participants = res.getParticipants();
        for (MonitorTaskDetailsDTO.ParticipantAnswerDTO participant : participants) {
            participant.setUsername("****");
        }
        res.setParticipants(participants);
        return res;
    }

}
