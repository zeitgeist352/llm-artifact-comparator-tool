package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.EvaluationRequestDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Enums.*;
import com.artifactcomparator.artifact_comparator_backend.Repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class EvaluationService {

    private final SnapshotEvaluationRepository snapshotRepo;
    private final BugEvaluationRepository bugRepo;
    private final SolidEvaluationRepository solidRepo;
    private final CloneEvaluationRepository cloneRepo;
    private final StudyRepository studyRepository;
    private final EvaluationTaskRepository taskRepository;

    public EvaluationService(
            SnapshotEvaluationRepository snapshotRepo,
            BugEvaluationRepository bugRepo,
            SolidEvaluationRepository solidRepo,
            CloneEvaluationRepository cloneRepo,
            StudyRepository studyRepository,
            EvaluationTaskRepository taskRepository
    ) {
        this.snapshotRepo = snapshotRepo;
        this.bugRepo = bugRepo;
        this.solidRepo = solidRepo;
        this.cloneRepo = cloneRepo;
        this.studyRepository = studyRepository;
        this.taskRepository = taskRepository;
    }

    public void submitEvaluation(EvaluationRequestDTO req, Long userId) {

        Long taskId = req.getTaskId();

        // ⛔ Task var mı kontrol
        EvaluationTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        Study study = task.getStudy();
        StudyType type = study.getStudyType();

        // ⛔ Bu kullanıcı zaten evaluation yaptıysa engelle
        if (existsAlready(type, taskId, userId)) {
            throw new RuntimeException("You already submitted an evaluation for this task.");
        }

        // 🔥 Study type'a göre ilgili evaluation’ı oluştur
        switch (type) {

            case SNAPSHOT_TESTING -> handleSnapshot(req, userId);

            case BUG_CATEGORIZATION -> handleBug(req, userId);

            case SOLID_DETECTION -> handleSolid(req, userId);

            case CODE_CLONE -> handleClone(req, userId);

            default -> throw new RuntimeException("Unsupported study type: " + type);
        }
    }

    // ============================================================
    //  DUPLICATE CONTROL
    // ============================================================
    private boolean existsAlready(StudyType type, Long taskId, Long userId) {
        return switch (type) {
            case SNAPSHOT_TESTING -> snapshotRepo.existsByTaskIdAndUserId(taskId, userId);
            case BUG_CATEGORIZATION -> bugRepo.existsByTaskIdAndUserId(taskId, userId);
            case SOLID_DETECTION -> solidRepo.existsByTaskIdAndUserId(taskId, userId);
            case CODE_CLONE -> cloneRepo.existsByTaskIdAndUserId(taskId, userId);
            default -> false;
        };
    }


    // ============================================================
    //  SNAPSHOT HANDLER
    // ============================================================
    private void handleSnapshot(EvaluationRequestDTO req, Long userId) {

        SnapShotEvaluation eval = new SnapShotEvaluation();
        eval.setTaskId(req.getTaskId());
        eval.setUserId(userId);
        eval.setCreatedAt(LocalDateTime.now());

        eval.setColorChange(Boolean.TRUE.equals(req.getColorChange()));
        eval.setShapeChange(Boolean.TRUE.equals(req.getShapeChange()));
        eval.setPositionChange(Boolean.TRUE.equals(req.getPositionChange()));
        eval.setLayoutChange(Boolean.TRUE.equals(req.getLayoutChange()));
        eval.setVisibilityChange(Boolean.TRUE.equals(req.getVisibilityChange()));
        eval.setFontChange(Boolean.TRUE.equals(req.getFontChange()));
        eval.setContentChange(Boolean.TRUE.equals(req.getContentChange()));
        eval.setSizeChange(Boolean.TRUE.equals(req.getSizeChange()));
        eval.setUnknownChange(Boolean.TRUE.equals(req.getUnknownChange()));

        snapshotRepo.save(eval);
    }


    // ============================================================
    //  BUG HANDLER
    // ============================================================
    private void handleBug(EvaluationRequestDTO req, Long userId) {

        BugEvaluation eval = new BugEvaluation();
        eval.setTaskId(req.getTaskId());
        eval.setUserId(userId);
        eval.setCreatedAt(LocalDateTime.now());

        eval.setConfigurationIssue(Boolean.TRUE.equals(req.getConfigurationIssue()));
        eval.setNetworkIssue(Boolean.TRUE.equals(req.getNetworkIssue()));
        eval.setDatabaseIssue(Boolean.TRUE.equals(req.getDatabaseIssue()));
        eval.setGuiIssue(Boolean.TRUE.equals(req.getGuiIssue()));
        eval.setPerformanceIssue(Boolean.TRUE.equals(req.getPerformanceIssue()));
        eval.setPermissionIssue(Boolean.TRUE.equals(req.getPermissionIssue()));
        eval.setSecurityIssue(Boolean.TRUE.equals(req.getSecurityIssue()));
        eval.setFunctionalIssue(Boolean.TRUE.equals(req.getFunctionalIssue()));
        eval.setTestCodeIssue(Boolean.TRUE.equals(req.getTestCodeIssue()));

        bugRepo.save(eval);
    }


    // ============================================================
    //  SOLID HANDLER
    // ============================================================
    private void handleSolid(EvaluationRequestDTO req, Long userId) {

        SolidEvaluation eval = new SolidEvaluation();
        eval.setTaskId(req.getTaskId());
        eval.setUserId(userId);
        eval.setCreatedAt(LocalDateTime.now());

        eval.setSrp(Boolean.TRUE.equals(req.getSrp()));
        eval.setOcp(Boolean.TRUE.equals(req.getOcp()));
        eval.setLsp(Boolean.TRUE.equals(req.getLsp()));
        eval.setIsp(Boolean.TRUE.equals(req.getIsp()));
        eval.setDip(Boolean.TRUE.equals(req.getDip()));

        eval.setEasy(Boolean.TRUE.equals(req.getEasy()));
        eval.setMedium(Boolean.TRUE.equals(req.getMedium()));
        eval.setHard(Boolean.TRUE.equals(req.getHard()));

        solidRepo.save(eval);
    }


    // ============================================================
    //  CLONE HANDLER
    // ============================================================
    private void handleClone(EvaluationRequestDTO req, Long  userId) {

        if (req.getIsClone() == null) {
            throw new RuntimeException("isClone is required");
        }

        CloneEvaluation eval = new CloneEvaluation();
        eval.setTaskId(req.getTaskId());
        eval.setUserId(userId);
        eval.setCreatedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(req.getIsClone())) {
            if (req.getCloneType() == null) {
                throw new RuntimeException("cloneType is required when isClone=true");
            }
            eval.setCloneType(CloneType.valueOf(req.getCloneType()));
        }

        cloneRepo.save(eval);
    }
}
