package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Enums.CriterionType;
import com.artifactcomparator.artifact_comparator_backend.Repository.ParticipantTaskResponseRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;

import com.artifactcomparator.artifact_comparator_backend.Service.StudyPdfExportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;


import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/monitor")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class MonitorController {

    private final StudyRepository studyRepo;
    private final ParticipantTaskResponseRepository respRepo;
    private final StudyPdfExportService pdfExportService; // 🔥 yeni


    public MonitorController(StudyRepository studyRepo,
                             ParticipantTaskResponseRepository respRepo,
                             StudyPdfExportService pdfExportService) {
        this.studyRepo = studyRepo;
        this.respRepo = respRepo;
        this.pdfExportService = pdfExportService; // ✔ Sorunsuz
    }

    @GetMapping("/{studyId}/progress")
    public Map<String, Object> getStudyMonitor(@PathVariable Long studyId) {

        Study study = studyRepo.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        int totalParticipants = study.getParticipants().size();
        List<EvaluationTask> tasks = study.getEvaluationTasks();

        // Tüm verilen cevaplar
        List<ParticipantTaskResponse> allResponses =
                respRepo.findByTask_Study_Id(studyId);

        List<Map<String, Object>> taskStats = new ArrayList<>();

        // Study kriterleri (ortak)
        List<EvaluationCriterion> sortedCriteria = study.getCriteriaSorted();

        for (EvaluationTask task : tasks) {

            // Bu task'a cevap gönderenler
            List<ParticipantTaskResponse> taskResponses =
                    allResponses.stream()
                            .filter(r -> r.getTask().getId().equals(task.getId()))
                            .toList();

            // Pending: cevap göndermeyen user sayısı
            int pendingParticipants = totalParticipants - taskResponses.size();

            // ---- Correct answers mapping ----
            List<CorrectAnswerEntry> correctAnswers =
                    Optional.ofNullable(task.getCorrectAnswers()).orElse(Collections.emptyList());

            Map<Long, String> correctMap = correctAnswers.stream()
                    .filter(Objects::nonNull)
                    .filter(c -> c.getCriterionId() != null)
                    .collect(Collectors.toMap(
                            c -> c.getCriterionId(),
                            c -> Optional.ofNullable(c.getAnswerValue()).orElse("")
                    ));


            List<Map<String, Object>> criteriaStats = new ArrayList<>();

            for (int i = 0; i < sortedCriteria.size(); i++) {

                EvaluationCriterion crit = sortedCriteria.get(i);

                boolean isCodeEdit = crit.getType() == CriterionType.CODE_EDIT;

                String correctValue = correctMap.getOrDefault(crit.getId(), "");

                int correct = 0;
                int wrong = 0;
                int blank = 0;
                int unknown = 0;

                boolean isUnknownCriterion = (correctValue == null || correctValue.isBlank());

                for (ParticipantTaskResponse r : taskResponses) {

                    List<String> userAns = (r.getAnswers() != null)
                            ? r.getAnswers()
                            : Collections.emptyList();

                    String userValue = (i < userAns.size() && userAns.get(i) != null)
                            ? userAns.get(i)
                            : "";

                    boolean correctEmpty = (correctValue == null || correctValue.isBlank());
                    boolean userEmpty = (userValue == null || userValue.isBlank());

                    // ================================================================
                    // ① Correct boş → tüm cevaplar UNKNOWN
                    // ================================================================
                    if (correctEmpty) {
                        unknown++;
                        continue;
                    }

                    // ================================================================
                    // ② User boş, correct dolu → WRONG
                    // ================================================================
                    if (userEmpty && !correctEmpty) {
                        wrong++;
                        continue;
                    }

                    // ================================================================
                    // ③ User boş, correct boş (normalde yukarıda unknown'a giderdi ama kural gereği yine UNKNOWN)
                    // ================================================================
                    if (userEmpty && correctEmpty) {
                        unknown++;
                        continue;
                    }

                    // ================================================================
                    // ④ User dolu & correct eşleşiyor → CORRECT
                    // ================================================================
                    boolean matches = isCodeEdit
                            ? normalizeCode(extractEditedCode(userValue))
                            .equals(normalizeCode(correctValue))
                            : userValue.equals(correctValue);

                    if (matches) {
                        correct++;
                        continue;
                    }

                    // ================================================================
                    // ⑤ User dolu & correct eşleşmiyor → WRONG
                    // ================================================================
                    wrong++;
                }


                Map<String, Object> critStat = new HashMap<>();
                critStat.put("criterionId", crit.getId());
                critStat.put("label", crit.getQuestion());

                critStat.put("correct", correct);
                critStat.put("wrong", wrong);
                critStat.put("blank", blank);

                // 🔥 YENİ – unknown değerini ekle
                critStat.put("unknown", unknown);

                // 🔥 Pending her zaman aynı: cevap göndermeyenler
                critStat.put("pending", pendingParticipants);

                criteriaStats.add(critStat);
            }


            // ============================
            // TASK ENTRY OLUŞTUR
            // ============================
            Map<String, Object> entry = new HashMap<>();
            entry.put("taskId", task.getId());
            entry.put("questionText", task.getQuestionText());
            entry.put("totalParticipants", totalParticipants);
            entry.put("completedCount", taskResponses.size());
            entry.put("pendingCount", pendingParticipants);

            // Yeni eklenen: Criterion bazlı sonuçlar
            entry.put("criteriaStats", criteriaStats);

            taskStats.add(entry);
        }

        // ================================================================
        // STUDY OVERVIEW (TOP LEVEL)
        // ================================================================
        Map<String, Object> studyMap = new HashMap<>();
        studyMap.put("studyId", study.getId());
        studyMap.put("studyTitle", study.getTitle());
        studyMap.put("endDate", study.getEndDate());
        studyMap.put("totalParticipants", totalParticipants);
        studyMap.put("taskStats", taskStats);
        studyMap.put("status", study.getStatus().name());

        return studyMap;
    }

    @GetMapping("/{studyId}/export-pdf")
    public ResponseEntity<byte[]> exportStudyPdf(@PathVariable Long studyId) {
        byte[] pdfBytes = pdfExportService.generateStudyReport(studyId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                org.springframework.http.ContentDisposition
                        .attachment()
                        .filename("study-" + studyId + "-report.pdf")
                        .build()
        );

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
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


