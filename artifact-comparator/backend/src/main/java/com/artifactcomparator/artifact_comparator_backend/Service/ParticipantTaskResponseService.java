package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationTask;
import com.artifactcomparator.artifact_comparator_backend.Entity.ParticipantTaskResponse;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.EvaluationTaskRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.ParticipantTaskResponseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ParticipantTaskResponseService {

    @Autowired
    private EvaluationTaskRepository taskRepo;

    @Autowired
    private ParticipantTaskResponseRepository responseRepo;

    public void saveResponse(User participant, Long taskId, List<String> answers) {

        EvaluationTask task = taskRepo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // 🔍 VAR MI BAK
        ParticipantTaskResponse response =
                responseRepo.findByTaskAndParticipant(task, participant)
                        .orElseGet(() -> {
                            ParticipantTaskResponse r = new ParticipantTaskResponse();
                            r.setParticipant(participant);
                            r.setTask(task);
                            return r;
                        });

        // 🔁 ÜSTÜNE YAZ
        response.setAnswers(answers);
        responseRepo.save(response);

        // ✅ TASK COMPLETION EKLE
        if (!task.getCompletedParticipants().contains(participant)) {
            task.getCompletedParticipants().add(participant);
            taskRepo.save(task);
        }

    }

    public Optional<ParticipantTaskResponse> getResponseForParticipant(
            User participant, Long taskId
    ) {
        EvaluationTask task = taskRepo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        return responseRepo.findByTaskAndParticipant(task, participant);
    }

    public List<Long> getCompletedTaskIdsForStudy(User participant, Long studyId) {
        return responseRepo
                .findCompletedTaskIdsForStudy(participant.getId(), studyId);
    }
}
