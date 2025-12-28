package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.MonitorTaskDetailsDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Enums.CriterionType;
import com.artifactcomparator.artifact_comparator_backend.Repository.EvaluationTaskRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.ParticipantTaskResponseRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MonitorTaskService {

    private final EvaluationTaskRepository taskRepo;
    private final ParticipantTaskResponseRepository respRepo;

    public MonitorTaskService(EvaluationTaskRepository taskRepo,
                              ParticipantTaskResponseRepository respRepo) {
        this.taskRepo = taskRepo;
        this.respRepo = respRepo;
    }

    public MonitorTaskDetailsDTO getTaskDetails(Long taskId) {

        EvaluationTask task = taskRepo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        Study study = task.getStudy();
        List<EvaluationCriterion> criteria = study.getCriteriaSorted();

        // ============================================================
        // 🔥 Correct Answers Map (criterionId → correctAnswer)
        // ============================================================
        Map<Long, String> correctMap = new HashMap<>();

        if (task.getCorrectAnswers() != null) {
            for (CorrectAnswerEntry entry : task.getCorrectAnswers()) {
                if (entry != null && entry.getCriterionId() != null) {
                    correctMap.put(
                            entry.getCriterionId(),
                            entry.getAnswerValue() != null ? entry.getAnswerValue() : ""
                    );
                }
            }
        }

        // ============================================================
        // Responses
        // ============================================================
        List<ParticipantTaskResponse> responses = respRepo.findByTask_Id(taskId);

        // ============================================================
        // CRITERIA LIST → includes correctAnswer
        // ============================================================
        List<MonitorTaskDetailsDTO.CriterionDTO> criterionList = new ArrayList<>();

        for (EvaluationCriterion c : criteria) {
            criterionList.add(
                    new MonitorTaskDetailsDTO.CriterionDTO(
                            c.getId(),
                            c.getQuestion(),
                            correctMap.getOrDefault(c.getId(), "")
                    )
            );
        }

        // ============================================================
        // DISTRIBUTION LIST → includes correctAnswer
        // ============================================================
        List<MonitorTaskDetailsDTO.CriterionDistributionDTO> distribution = new ArrayList<>();

        for (int i = 0; i < criteria.size(); i++) {

            EvaluationCriterion crit = criteria.get(i);

            // ✅ 3A) Eğer bu kriter CODE_EDIT ise: Correct/Wrong/Pending say
            if (crit.getType() == CriterionType.CODE_EDIT) {

                int correct = 0, wrong = 0, pending = 0;

                String correctAnswer = correctMap.getOrDefault(crit.getId(), "");

                for (ParticipantTaskResponse r : responses) {
                    String ans = "";
                    if (r.getAnswers() != null && r.getAnswers().size() > i) {
                        ans = r.getAnswers().get(i);
                    }

                    if (ans == null || ans.isBlank()) {
                        pending++;
                        continue;
                    }

                    boolean ok = normalizeCode(extractEditedCode(ans))
                            .equals(normalizeCode(correctAnswer));
                    if (ok) correct++;
                    else wrong++;
                }

                Map<String, Integer> options = new LinkedHashMap<>();
                options.put("Correct", correct);
                options.put("Wrong", wrong);
                options.put("Pending", pending);

                distribution.add(
                        new MonitorTaskDetailsDTO.CriterionDistributionDTO(
                                crit.getId(),
                                crit.getQuestion(),
                                options,
                                correctAnswer
                        )
                );

                continue; // 🔥 aşağıdaki eski freq mantığına girmesin
            }

            Map<String, Integer> freq = new LinkedHashMap<>();

            for (ParticipantTaskResponse r : responses) {

                String ans = "";
                if (r.getAnswers() != null && r.getAnswers().size() > i) {
                    ans = r.getAnswers().get(i);
                }

                if (ans == null || ans.isBlank()) ans = "—";

                freq.put(ans, freq.getOrDefault(ans, 0) + 1);
            }

            distribution.add(
                    new MonitorTaskDetailsDTO.CriterionDistributionDTO(
                            crit.getId(),
                            crit.getQuestion(),
                            freq,
                            correctMap.getOrDefault(crit.getId(), "")
                    )
            );
        }

        // ============================================================
        // PARTICIPANT ANSWERS
        // ============================================================
        List<MonitorTaskDetailsDTO.ParticipantAnswerDTO> participantRows = new ArrayList<>();

        for (ParticipantTaskResponse r : responses) {
            participantRows.add(
                    new MonitorTaskDetailsDTO.ParticipantAnswerDTO(
                            r.getParticipant().getUsername(),
                            r.getAnswers()
                    )
            );
        }

        // ============================================================
        // RETURN DTO
        // ============================================================
        return new MonitorTaskDetailsDTO(
                task.getId(),
                task.getQuestionText(),
                criterionList,
                distribution,
                participantRows
        );
    }

    private String normalizeCode(String s) {
        if (s == null) return "";
        return s
                .replaceAll("//.*", "")
                .replaceAll("/\\*(.|\\R)*?\\*/", "")
                .replaceAll("\\s+", "")
                .trim();
    }

    private String extractEditedCode(String raw) {
        if (raw == null || raw.isBlank()) return "";

        String trimmed = raw.trim();

        // JSON gibi duruyorsa
        if (trimmed.startsWith("{")) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper =
                        new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode node =
                        mapper.readTree(trimmed);

                if (node.has("editedCode")) {
                    return node.get("editedCode").asText("");
                }
            } catch (Exception e) {
                // parse edilemezse fallback
            }
        }

        // JSON değilse direkt code kabul et
        return raw;
    }
}
