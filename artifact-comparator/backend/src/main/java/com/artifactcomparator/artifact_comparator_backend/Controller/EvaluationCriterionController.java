package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.CreateCriterionRequest;
import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationCriterion;
import com.artifactcomparator.artifact_comparator_backend.Service.EvaluationCriterionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/criteria")
@CrossOrigin(origins = "http://localhost:3000")
public class EvaluationCriterionController {

    private final EvaluationCriterionService service;

    public EvaluationCriterionController(EvaluationCriterionService service) {
        this.service = service;
    }

    @PostMapping("/create/{studyId}")
    public EvaluationCriterion createCriterion(
            @PathVariable Long studyId,
            @RequestBody CreateCriterionRequest request
    ) {
        return service.createCriterion(studyId, request);
    }

    @GetMapping("/study/{studyId}")
    public List<EvaluationCriterion> getByStudy(@PathVariable Long studyId) {
        return service.getCriteriaByStudy(studyId);
    }

    @DeleteMapping("/{id}")
    public void deleteCriterion(@PathVariable Long id) {
        service.deleteCriterion(id);
    }
}
