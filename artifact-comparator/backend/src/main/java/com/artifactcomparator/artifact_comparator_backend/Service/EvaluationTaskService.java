package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Repository.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import com.artifactcomparator.artifact_comparator_backend.DTO.TaskUpdateRequest;


import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EvaluationTaskService {

    private final EvaluationTaskRepository taskRepo;
    private final ArtifactUploadRepository artifactRepo;
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final DeletedCommentLogRepository deletedCommentLogRepository;
    private final ParticipantTaskResponseRepository participantTaskResponseRepository;
    private final ReportRepository reportRepository;
    private final ResearcherActionLogRepository researcherActionLogRepository;


    public EvaluationTaskService(
            EvaluationTaskRepository taskRepo,
            ArtifactUploadRepository artifactRepo,
            CommentRepository commentRepository,
            CommentLikeRepository commentLikeRepository,
            DeletedCommentLogRepository deletedCommentLogRepository,
            ParticipantTaskResponseRepository participantTaskResponseRepository,
            ReportRepository reportRepository,
            ResearcherActionLogRepository researcherActionLogRepository
    ) {
        this.taskRepo = taskRepo;
        this.artifactRepo = artifactRepo;
        this.commentRepository = commentRepository;
        this.commentLikeRepository = commentLikeRepository;
        this.deletedCommentLogRepository = deletedCommentLogRepository;
        this.participantTaskResponseRepository = participantTaskResponseRepository;
        this.reportRepository = reportRepository;
        this.researcherActionLogRepository = researcherActionLogRepository;
    }

    /* ============================================================
                      CRUD BASICS
    ============================================================ */
    public EvaluationTask createTask(EvaluationTask task) {
        return taskRepo.save(task);
    }

    public EvaluationTask updateTask(EvaluationTask task) {
        return taskRepo.save(task);
    }

    private List<ArtifactUpload> getArtifactsInOrder(List<Long> ids) {

        List<ArtifactUpload> dbList = artifactRepo.findAllById(ids);

        // id → artifact map
        Map<Long, ArtifactUpload> map = new HashMap<>();
        for (ArtifactUpload a : dbList) {
            map.put(a.getId(), a);
        }

        // sırayı kesinlikle koru
        List<ArtifactUpload> ordered = new ArrayList<>();
        for (Long id : ids) {
            ordered.add(map.get(id));
        }

        return ordered;
    }

    public EvaluationTask getTaskById(Long id) {
        return taskRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + id));
    }

    public List<EvaluationTask> getTasksByStudy(Study study) {
        return taskRepo.findByStudy(study);
    }

    /* ============================================================
                      UPDATE TASK INFO
    ============================================================ */
    public EvaluationTask updateTaskInfo(Long id, TaskUpdateRequest req) {
        EvaluationTask task = getTaskById(id);

        if (req.getQuestionText() != null) task.setQuestionText(req.getQuestionText());
        if (req.getDescription() != null) task.setDescription(req.getDescription());

        return taskRepo.save(task);
    }

    /* ============================================================
                      UPDATE SELECTED ARTIFACTS
    ============================================================ */
    public EvaluationTask updateTaskArtifacts(Long taskId, List<Long> artifactIds) {
        EvaluationTask task = getTaskById(taskId);

        if (artifactIds.size() != task.getArtifactCount())
            throw new RuntimeException("Incorrect artifact count selected");

        // 🔥 Sıra garantili şekilde artifact'ları getir
        List<ArtifactUpload> ordered = getArtifactsInOrder(artifactIds);

        // Mevcut listeyi temizle ve doğru sırayla yeniden ekle
        task.getArtifacts().clear();
        task.getArtifacts().addAll(ordered);

        return taskRepo.save(task);
    }


    /* ============================================================
                      RESPONSE FIELD GENERATION
    ============================================================ */
    public void generateResponseFields(EvaluationTask task, int artifactCount, int criterionCount) {

        List<String> fields = new ArrayList<>();
        char[] letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".toCharArray();

        if (criterionCount == 1) {
            for (int i = 0; i < artifactCount; i++) {
                fields.add("" + letters[i]);  // A, B, C...
            }
        } else {
            for (int a = 0; a < artifactCount; a++) {
                for (int c = 0; c < criterionCount; c++) {
                    fields.add("" + letters[a] + (c + 1)); // A1, A2, B1, B2...
                }
            }
        }

        task.setResponseFields(fields);
    }

    /* ============================================================
                      NEW: UPDATE CORRECT ANSWERS
    ============================================================ */
    public EvaluationTask updateCorrectAnswers(Long taskId, List<CorrectAnswerEntry> answers) {
        EvaluationTask task = getTaskById(taskId);

        task.setCorrectAnswers(answers); // FULL REPLACE

        return taskRepo.save(task);
    }

    public EvaluationTask createTaskBulk(
            Study study,
            List<ArtifactUpload> artifacts,
            String question,
            String description,
            List<CorrectAnswerEntry> correctAnswers
    ) {
        EvaluationTask task = new EvaluationTask();

        task.setStudy(study);
        task.setQuestionText(question);
        task.setDescription(description);
        task.setArtifactCount(artifacts.size());
        task.setArtifacts(artifacts);

        List<EvaluationCriterion> criteria = study.getEvaluationCriteria();

        generateResponseFields(task, artifacts.size(), criteria.size());

        List<CorrectAnswerEntry> normalizedAnswers = new ArrayList<>();

        for (int i = 0; i < criteria.size(); i++) {

            EvaluationCriterion criterion = criteria.get(i);
            CorrectAnswerEntry answer = correctAnswers.get(i);
            String rawValue = answer.getAnswerValue();

            // -------------------------------
            // MULTIPLE CHOICE (tekli + çoklu)
            // -------------------------------
            if (criterion instanceof MultipleChoiceCriterion mc) {

                if (rawValue == null || rawValue.isBlank()) {
                    answer.setAnswerValue(null);
                } else {
                    // Çoklu split → "A,B" → ["A","B"]
                    String[] parts = rawValue.split(",");

                    List<String> cleaned = new ArrayList<>();
                    for (String p : parts) {
                        String trimmed = p.trim();
                        if (mc.getOptions().contains(trimmed)) {
                            cleaned.add(trimmed);
                        } else {
                            throw new RuntimeException("Invalid MC option: " + trimmed);
                        }
                    }

                    // DB formatı "A,B"
                    answer.setAnswerValue(String.join(",", cleaned));
                }
            }

            // -------------------------------
            // DİĞER CRITERIA → olduğu gibi bırak
            // -------------------------------

            normalizedAnswers.add(answer);
        }

        task.setCorrectAnswers(normalizedAnswers);

        return taskRepo.save(task);
    }

    @Transactional
    public void deleteTaskHard(Long taskId) {

        EvaluationTask task = taskRepo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // 6️⃣ Researcher action logs
        researcherActionLogRepository.deleteByTask(task);

        // 1️⃣ CommentLike
        commentLikeRepository.deleteByTask(task);

        // 2️⃣ Deleted comment logs
        deletedCommentLogRepository.deleteByTask(task);

        // 3️⃣ Comments (reply’ler cascade)
        commentRepository.deleteByTask(task);

        // 4️⃣ Participant responses
        participantTaskResponseRepository.deleteByTask(task);

        // 5️⃣ Reports
        reportRepository.deleteByTaskId(task.getId());

        // 7️⃣ EvaluationTask (EN SON)
        taskRepo.delete(task);
    }



}
