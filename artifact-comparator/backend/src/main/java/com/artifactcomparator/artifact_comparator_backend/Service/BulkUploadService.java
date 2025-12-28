package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Repository.ArtifactUploadRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;
import com.artifactcomparator.artifact_comparator_backend.Util.CSVReaderUtil;
import com.artifactcomparator.artifact_comparator_backend.Util.ZipUtil;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
public class BulkUploadService {

    private final StudyRepository studyRepository;
    private final ArtifactUploadRepository artifactRepo;
    private final EvaluationTaskService taskService;

    public BulkUploadService(
            StudyRepository studyRepository,
            ArtifactUploadRepository artifactRepo,
            EvaluationTaskService taskService
    ) {
        this.studyRepository = studyRepository;
        this.artifactRepo = artifactRepo;
        this.taskService = taskService;
    }

    public int processBulkUpload(  // ⭐ CHANGED: Return task count
                                   Long studyId,
                                   MultipartFile zipFile,
                                   MultipartFile csvFile,
                                   User researcher,
                                   ArtifactFolder folder  // ⭐ NEW PARAMETER
    ) throws Exception {

        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found"));

        int artifactCount = study.getArtifactCountPerTask();

        // ⭐ ZIP işle - FOLDER'A KAYDET
        String zipName = zipFile.getOriginalFilename().replace(".zip", "");
        Map<String, ArtifactUpload> savedArtifacts =
                ZipUtil.extractAndSaveArtifacts(
                        zipFile,
                        zipName,
                        artifactRepo,
                        researcher,
                        folder  // ⭐ PASS FOLDER
                );

        // CSV oku
        List<List<String>> rows = CSVReaderUtil.readCSV(csvFile);

        if (rows.isEmpty())
            throw new RuntimeException("CSV is empty.");

        // 🔥 HEADER AL
        List<String> header = rows.get(0);
        rows.remove(0);  // header'ı çıkar

        // 🔥 HEADER → column index map
        Map<String, Integer> colIndex = new HashMap<>();
        for (int i = 0; i < header.size(); i++) {
            colIndex.put(header.get(i).trim(), i);
        }

        List<EvaluationCriterion> criteria = study.getEvaluationCriteria()
                .stream()
                .sorted(Comparator.comparing(EvaluationCriterion::getPriorityOrder))
                .toList();

        int tasksCreated = 0;  // ⭐ TRACK COUNT

        // -----------------------------------------
        //   SATIR SATIR TASK OLUŞTUR
        // -----------------------------------------
        for (List<String> row : rows) {

            // ARTIFACTLERİ OKU
            List<ArtifactUpload> artifactsForTask = new ArrayList<>();
            for (int i = 1; i <= artifactCount; i++) {

                String colName = "artifact_" + i + "_filename";

                if (!colIndex.containsKey(colName))
                    throw new RuntimeException("CSV column missing: " + colName);

                String filename = row.get(colIndex.get(colName)).trim();

                ArtifactUpload art = savedArtifacts.get(filename);
                if (art == null)
                    throw new RuntimeException("Artifact not found in ZIP: " + filename);

                artifactsForTask.add(art);
            }

            // QUESTION
            String question = row.get(colIndex.get("question"));

            // DESCRIPTION
            String description = row.get(colIndex.get("description"));

            // CORRECT ANSWERS
            List<CorrectAnswerEntry> correctAnswers = new ArrayList<>();

            for (EvaluationCriterion crit : criteria) {

                String col = "criterion_" + crit.getPriorityOrder() + "_" + crit.getType() + "_answer";

                if (!colIndex.containsKey(col))
                    throw new RuntimeException("Missing criterion column: " + col);

                String rawVal = row.get(colIndex.get(col));

                CorrectAnswerEntry entry = new CorrectAnswerEntry();
                entry.setCriterionId(crit.getId());
                entry.setAnswerValue(rawVal); // HAM STRING → A,B veya A veya null
                correctAnswers.add(entry);
            }

            // TASK OLUŞTUR
            taskService.createTaskBulk(
                    study,
                    artifactsForTask,
                    question,
                    description,
                    correctAnswers
            );

            tasksCreated++;  // ⭐ INCREMENT
        }

        System.out.println("✅ Bulk upload complete: " + tasksCreated + " tasks created in folder: " + folder.getName());
        return tasksCreated;  // ⭐ RETURN COUNT
    }
}
