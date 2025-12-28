package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Enums.CriterionType;
import com.artifactcomparator.artifact_comparator_backend.Enums.StudyType;
import com.artifactcomparator.artifact_comparator_backend.Repository.EvaluationCriterionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DefaultCriteriaFactory {

    private final EvaluationCriterionRepository criterionRepo;

    public DefaultCriteriaFactory(EvaluationCriterionRepository criterionRepo) {
        this.criterionRepo = criterionRepo;
    }

    public void createDefaultsForStudy(Study study) {

        StudyType t = study.getStudyType();

        switch (t) {

            case BUG_CATEGORIZATION -> createBugDefaults(study);

            case CODE_CLONE -> createCloneDefaults(study);

            case SNAPSHOT_TESTING -> createSnapshotDefaults(study);

            case SOLID_DETECTION -> createSolidDefaults(study);

            case CUSTOM -> {
                // CUSTOM → default criterion yok
            }

            default -> throw new IllegalStateException("Unknown study type: " + t);
        }
    }

    /* ---------------------------------------------
       BUG CATEGORIZATION — TEK MULTI-SELECT CRITERION
    --------------------------------------------- */
    private void createBugDefaults(Study study) {

        MultipleChoiceCriterion c = new MultipleChoiceCriterion(
                "Bug Category",
                "Select all applicable bug categories",
                1,
                9,
                List.of(
                        "Functional Issue",
                        "Security Issue",
                        "GUI Issue",
                        "Performance Issue",
                        "Configuration Issue",
                        "Network Issue",
                        "Database Issue",
                        "Permission Issue",
                        "Test Code Issue"
                ),
                true // multi-select
        );

        c.setType(CriterionType.MULTIPLE_CHOICE);
        c.setStudy(study);
        criterionRepo.save(c);
    }

    /* ---------------------------------------------
       CODE CLONE — TEK SINGLE-SELECT CRITERION
    --------------------------------------------- */
    private void createCloneDefaults(Study study) {

        MultipleChoiceCriterion c = new MultipleChoiceCriterion(
                "Clone Type",
                "Select the clone type",
                1,
                5,
                List.of(
                        "TYPE-1",
                        "TYPE-2",
                        "TYPE-3",
                        "TYPE-4",
                        "NOT A CLONE"
                ),
                false // single-select
        );

        c.setType(CriterionType.MULTIPLE_CHOICE);
        c.setStudy(study);
        criterionRepo.save(c);
    }

    /* ---------------------------------------------
       SNAPSHOT — TEK MULTI-SELECT CRITERION
    --------------------------------------------- */
    private void createSnapshotDefaults(Study study) {

        MultipleChoiceCriterion c = new MultipleChoiceCriterion(
                "UI Changes",
                "Select all changes visible in UI",
                1,
                9,
                List.of(
                        "Color Change",
                        "Shape Change",
                        "Position Change",
                        "Layout Change",
                        "Visibility Change",
                        "Font Change",
                        "Content Change",
                        "Size Change",
                        "Unknown Change"
                ),
                true // multi-select
        );

        c.setType(CriterionType.MULTIPLE_CHOICE);
        c.setStudy(study);
        criterionRepo.save(c);
    }

    /* ---------------------------------------------
       SOLID DETECTION — 2 CRITERION
    --------------------------------------------- */
    private void createSolidDefaults(Study study) {

        /* A) Violated Principle — MULTI SELECT */
        MultipleChoiceCriterion p = new MultipleChoiceCriterion(
                "Violated Principle",
                "Select violated SOLID principles",
                1,
                5,
                List.of("SRP", "OCP", "LSP", "ISP", "DIP"),
                true // multi-select
        );
        p.setType(CriterionType.MULTIPLE_CHOICE);
        p.setStudy(study);
        criterionRepo.save(p);

        /* B) Difficulty — SINGLE SELECT */
        MultipleChoiceCriterion d = new MultipleChoiceCriterion(
                "Difficulty",
                "Select task difficulty",
                2,
                3,
                List.of("EASY", "MEDIUM", "HARD"),
                false // single-select
        );
        d.setType(CriterionType.MULTIPLE_CHOICE);
        d.setStudy(study);
        criterionRepo.save(d);
    }
}
