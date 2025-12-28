package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.CustomCriteriaSubmitRequestDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.CustomCriteriaEvaluation;
import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationCriterion;
import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationTask;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.CustomCriteriaEvaluationRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.EvaluationCriterionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class CustomCriteriaEvaluationService {

    private final CustomCriteriaEvaluationRepository repository;
    private final EvaluationTaskService taskService;
    private final EvaluationCriterionRepository criterionRepository;

    public CustomCriteriaEvaluationService(
            CustomCriteriaEvaluationRepository repository,
            EvaluationTaskService taskService,
            EvaluationCriterionRepository criterionRepository
    ) {
        this.repository = repository;
        this.taskService = taskService;
        this.criterionRepository = criterionRepository;
    }

    public void saveCustomEvaluation(EvaluationTask task,
                                     String fieldCode,
                                     EvaluationCriterion criterion,
                                     User participant,
                                     String value) {

        // Eğer aynı değerlendirmenin eski kaydı varsa → sil (overwrite)
        List<CustomCriteriaEvaluation> existing =
                repository.findByTaskAndParticipant(task, participant)
                        .stream()
                        .filter(e ->
                                e.getFieldCode().equals(fieldCode) &&
                                        e.getCriterion().getId().equals(criterion.getId())
                        )
                        .toList();

        if (!existing.isEmpty()) {
            repository.deleteAll(existing);
        }

        CustomCriteriaEvaluation eval = new CustomCriteriaEvaluation();
        eval.setTask(task);
        eval.setFieldCode(fieldCode);
        eval.setCriterion(criterion);
        eval.setParticipant(participant);
        eval.setValue(value);

        repository.save(eval);
    }

    public void processSubmitRequest(CustomCriteriaSubmitRequestDTO req, User participant) {

        EvaluationTask task = taskService.getTaskById(req.getTaskId());

        for (Map.Entry<String, Map<String, String>> fieldEntry : req.getResponses().entrySet()) {

            String fieldCode = fieldEntry.getKey();
            Map<String, String> criteriaMap = fieldEntry.getValue();

            for (Map.Entry<String, String> cEntry : criteriaMap.entrySet()) {
                Long criterionId = Long.valueOf(cEntry.getKey());
                String value = cEntry.getValue();

                EvaluationCriterion criterion = criterionRepository.findById(criterionId)
                        .orElseThrow(() ->
                                new RuntimeException("Criterion not found: " + criterionId));

                saveCustomEvaluation(task, fieldCode, criterion, participant, value);
            }
        }
    }
}
