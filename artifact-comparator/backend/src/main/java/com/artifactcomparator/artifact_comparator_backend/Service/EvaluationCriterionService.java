package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.CreateCriterionRequest;
import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Enums.CriterionType;
import com.artifactcomparator.artifact_comparator_backend.Repository.EvaluationCriterionRepository;
import com.artifactcomparator.artifact_comparator_backend.Service.StudyService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EvaluationCriterionService {

    private final EvaluationCriterionRepository repository;
    private final StudyService studyService;

    public EvaluationCriterionService(EvaluationCriterionRepository repository, StudyService studyService) {
        this.repository = repository;
        this.studyService = studyService;
    }

    public EvaluationCriterion createCriterion(Long studyId, CreateCriterionRequest req) {

        Study study = studyService.getStudyById(studyId);

        EvaluationCriterion criterion = switch (req.getType()) {

            case MULTIPLE_CHOICE -> new MultipleChoiceCriterion(
                    req.getQuestion(),
                    req.getDescription(),
                    req.getPriorityOrder(),
                    req.getNumberOfOptions(),
                    req.getOptions(),
                    req.getMultipleSelection()
            );

            case RATING -> new RatingCriterion(
                    req.getQuestion(),
                    req.getDescription(),
                    req.getPriorityOrder(),
                    req.getStartValue(),
                    req.getEndValue()
            );

            case OPEN_ENDED -> new OpenEndedCriterion(
                    req.getQuestion(),
                    req.getDescription(),
                    req.getPriorityOrder(),
                    req.getMinLength(),
                    req.getMaxLength()
            );

            case NUMERIC -> new OpenEndedNumericCriterion(
                    req.getQuestion(),
                    req.getDescription(),
                    req.getPriorityOrder(),
                    req.getIntegerOnly(),
                    req.getMinValue(),
                    req.getMaxValue()
            );

            case CODE_EDIT -> new CodeEditCriterion(
                    req.getQuestion(),
                    req.getDescription(),
                    req.getPriorityOrder()
            );

            case IMAGE_HIGHLIGHT -> new ImageHighlightCriterion(
                    req.getQuestion(),
                    req.getDescription(),
                    req.getPriorityOrder(),
                    req.getNumberOfAnnotations()
            );

            default -> throw new IllegalArgumentException("Unexpected criterion type: " + req.getType());
        };

        criterion.setStudy(study); // 🔥 ortak bağlantı
        criterion.setType(req.getType()); // 🔥 JSON polymorphism için gerekli

        return repository.save(criterion);
    }


    public List<EvaluationCriterion> getCriteriaByStudy(Long studyId) {
        Study study = studyService.getStudyById(studyId);
        return repository.findByStudyOrderByPriorityOrderAsc(study);
    }

    public void deleteCriterion(Long id) {
        EvaluationCriterion criterion = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Criterion not found"));

        repository.delete(criterion);
    }
}
