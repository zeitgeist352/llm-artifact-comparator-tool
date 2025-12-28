package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Repository.ParticipantTaskResponseRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.JFreeChart;
import org.jfree.data.category.DefaultCategoryDataset;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.awt.Paint;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import org.jfree.chart.axis.NumberAxis;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.renderer.category.BarRenderer;
import org.jfree.chart.renderer.category.StandardBarPainter;

@Service
public class StudyPdfExportService {

    private final StudyRepository studyRepo;
    private final ParticipantTaskResponseRepository respRepo;

    public StudyPdfExportService(StudyRepository studyRepo,
                                 ParticipantTaskResponseRepository respRepo) {
        this.studyRepo = studyRepo;
        this.respRepo = respRepo;
    }

    public byte[] generateStudyReport(Long studyId) {
        try (PDDocument doc = new PDDocument()) {

            Study study = studyRepo.findById(studyId)
                    .orElseThrow(() -> new RuntimeException("Study not found"));

            int totalParticipants = study.getParticipants().size();
            List<EvaluationTask> tasks = study.getEvaluationTasks();

            // Tüm cevaplar
            List<ParticipantTaskResponse> allResponses =
                    respRepo.findByTask_Study_Id(studyId);

            // Study kriterleri (ortak, sıralı)
            List<EvaluationCriterion> sortedCriteria = study.getCriteriaSorted();
            int totalCriteria = sortedCriteria.size();
            int totalSubmissions = allResponses.size();

            // Study overview için overall completion hesabı
            double overallCompletion = 0.0;
            if (!tasks.isEmpty() && totalParticipants > 0) {
                int sum = 0;
                for (EvaluationTask t : tasks) {
                    long completed = allResponses.stream()
                            .filter(r -> r.getTask().getId().equals(t.getId()))
                            .count();
                    sum += Math.round((completed * 100.0) / totalParticipants);
                }
                overallCompletion = sum / (double) tasks.size();
            }

            // ============================
            // 1) OVERVIEW SAYFASI
            // ============================
            addOverviewPage(
                    doc,
                    study,
                    totalParticipants,
                    tasks.size(),
                    overallCompletion,
                    totalCriteria,
                    totalSubmissions
            );

            // ============================
            // 2) HER TASK / CRITERION İÇİN SAYFA
            //    → 1 task'taki her criterion için 1 sayfa
            // ============================
            for (EvaluationTask task : tasks) {

                // Bu task'a ait cevaplar
                List<ParticipantTaskResponse> taskResponses = allResponses.stream()
                        .filter(r -> r.getTask().getId().equals(task.getId()))
                        .toList();

                int completedCount = taskResponses.size();
                int pendingParticipants = totalParticipants - completedCount;

                // Correct answer map (criterionId → correctValue)
                List<CorrectAnswerEntry> correctAnswers =
                        Optional.ofNullable(task.getCorrectAnswers()).orElse(Collections.emptyList());

                Map<Long, String> correctMap = correctAnswers.stream()
                        .filter(Objects::nonNull)
                        .filter(c -> c.getCriterionId() != null)
                        .collect(Collectors.toMap(
                                CorrectAnswerEntry::getCriterionId,
                                c -> Optional.ofNullable(c.getAnswerValue()).orElse("")
                        ));

                // Her criterion için ayrı stats hesapla → ayrı sayfa yaz
                for (int i = 0; i < sortedCriteria.size(); i++) {

                    // Study kriterleri sıralı
                    EvaluationCriterion crit = sortedCriteria.get(i);

                    // Correct answer'ı criterionId üzerinden bul (frontend ile birebir aynı)
                    // Correct answer index-based alınmalı (frontend ile birebir aynı)
                    String correctValue = "";
                    if (i < correctAnswers.size()) {
                        CorrectAnswerEntry entry = correctAnswers.get(i);
                        if (entry != null && entry.getAnswerValue() != null) {
                            correctValue = entry.getAnswerValue().trim();
                        }
                    }

                    CriterionStats stats = new CriterionStats();
                    stats.criterionId = crit.getId();
                    stats.label = crit.getQuestion();
                    stats.correct = 0;
                    stats.wrong = 0;
                    stats.unknown = 0;
                    stats.pending = pendingParticipants;
                    stats.optionCounts = new LinkedHashMap<>();

                    boolean correctEmpty = (correctValue == null || correctValue.isBlank());

                    for (ParticipantTaskResponse r : taskResponses) {

                        List<String> userAns = (r.getAnswers() != null)
                                ? r.getAnswers()
                                : Collections.emptyList();

                        String rawUserValue = (i < userAns.size() && userAns.get(i) != null)
                                ? userAns.get(i)
                                : "";
                        String userValue = rawUserValue.trim();

                        boolean userEmpty = userValue.isEmpty();

                        // -------------------------------
                        // 1) Cevap içeriği dağılımı (A, B, "— (blank)" vb.)
                        // -------------------------------
                        String optionKey = userEmpty ? "— (blank)" : userValue;
                        stats.optionCounts.merge(optionKey, 1, Integer::sum);

                        // Doğruluk mantığı (frontend ile birebir aynı)
                        if (correctEmpty) {
                            stats.unknown++;
                        } else {
                            if (userEmpty) {
                                stats.wrong++;
                            } else if (userValue.equals(correctValue)) {
                                stats.correct++;
                            } else {
                                stats.wrong++;
                            }
                        }
                    }

                    // Bu criterion için ayrı bir sayfa oluştur
                    addCriterionPage(
                            doc,
                            study,
                            task,
                            stats,
                            totalParticipants,
                            completedCount,
                            sortedCriteria
                    );
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    // ============================
    // OVERVIEW PAGE
    // ============================
    private void addOverviewPage(
            PDDocument doc,
            Study study,
            int totalParticipants,
            int taskCount,
            double overallCompletion,
            int totalCriteria,
            int totalSubmissions
    ) throws IOException {

        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);

        try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {

            float margin = 50;
            float y = page.getMediaBox().getHeight() - margin;

            // ============================
            // REPORT TITLE — ACADEMIC STYLE
            // ============================

            // Study Report title (left-aligned)
            cs.setFont(PDType1Font.TIMES_BOLD, 24);
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText("Study Report");
            cs.endText();

// Right-aligned "Artifact Comparator Team"
            String team = "Artifact Comparator Team";
            float teamFontSize = 14;
            cs.setFont(PDType1Font.TIMES_ITALIC, teamFontSize);

            float pageWidth = page.getMediaBox().getWidth();
            float textWidth = PDType1Font.TIMES_ITALIC.getStringWidth(team) / 1000f * teamFontSize;

            float rightX = pageWidth - margin - textWidth;

            cs.beginText();
            cs.newLineAtOffset(rightX, y); // SAME Y, but right-aligned
            cs.showText(team);
            cs.endText();

            y -= 32;



            y -= 32;

            // ============================
            // STUDY INFORMATION
            // ============================
            cs.setFont(PDType1Font.TIMES_BOLD, 14);
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText("Study Information");
            cs.endText();

            y -= 18;
            cs.setFont(PDType1Font.TIMES_ROMAN, 12);

            List<String> info = new ArrayList<>();
            info.add("Study Title: " + study.getTitle());
            info.add("Research Type: " + study.getStudyType().name());
            info.add("Status: " + study.getStatus().name());

            if (study.getEndDate() != null) {
                String endDate = study.getEndDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
                info.add("End Date: " + endDate);
            }

            for (String line : info) {
                cs.beginText();
                cs.newLineAtOffset(margin, y);
                cs.showText(line);
                cs.endText();
                y -= 14;
            }

            y -= 10;
            drawSectionDivider(cs, margin, page.getMediaBox().getWidth() - margin, y);
            y -= 25;


            // ============================
            // GENERAL STATISTICS
            // ============================
            y -= 26;
            cs.setFont(PDType1Font.TIMES_BOLD, 14);
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText("1. General Statistics");
            cs.endText();

            y -= 18;
            cs.setFont(PDType1Font.TIMES_ROMAN, 12);

            List<String> summary = List.of(
                    "• Total Participants: " + totalParticipants,
                    "• Total Tasks: " + taskCount,
                    "• Total Criteria: " + totalCriteria,
                    "• Total Submissions: " + totalSubmissions,
                    "• Average Task Completion: " + String.format("%.0f%%", overallCompletion)
            );

            for (String line : summary) {
                cs.beginText();
                cs.newLineAtOffset(margin, y);
                cs.showText(line);
                cs.endText();
                y -= 14;
            }

            y -= 10;
            drawSectionDivider(cs, margin, page.getMediaBox().getWidth() - margin, y);
            y -= 25;


            // ============================
            // CRITERIA SUMMARY
            // ============================
            y -= 28;
            cs.setFont(PDType1Font.TIMES_BOLD, 14);
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText("2. Study Criteria Summary");
            cs.endText();

            y -= 20;
            cs.setFont(PDType1Font.TIMES_ROMAN, 12);

            for (EvaluationCriterion crit : study.getCriteriaSorted()) {

                String header = "• " + crit.getQuestion() + "  [" + crit.getType().name() + "]";
                y = writeWrappedText(cs, header, margin, y, 480, 14);

                if (crit.getDescription() != null && !crit.getDescription().isBlank()) {
                    String desc = "   Description: " + crit.getDescription();
                    y = writeWrappedText(cs, desc, margin, y, 470, 12);
                }

                switch (crit.getType()) {

                    case MULTIPLE_CHOICE -> {
                        MultipleChoiceCriterion mc = (MultipleChoiceCriterion) crit;

                        y = writeWrappedText(cs,
                                "   Selection Mode: " + (mc.isMultipleSelection() ? "Multiple Selection" : "Single Selection"),
                                margin, y, 470, 12);

                        y = writeWrappedText(cs,
                                "   Number of Options: " + mc.getNumberOfOptions(),
                                margin, y, 470, 12);

                        if (mc.getOptions() != null) {
                            y = writeWrappedText(cs, "   Options:", margin, y, 470, 12);
                            for (String opt : mc.getOptions()) {
                                y = writeWrappedText(cs, "      - " + opt, margin, y, 450, 12);
                            }
                        }
                    }

                    case RATING -> {
                        RatingCriterion rc = (RatingCriterion) crit;
                        y = writeWrappedText(cs,
                                "   Rating Scale: " + rc.getStartValue() + " to " + rc.getEndValue(),
                                margin, y, 470, 12);
                    }

                    case NUMERIC -> {
                        OpenEndedNumericCriterion nc = (OpenEndedNumericCriterion) crit;
                        y = writeWrappedText(cs,
                                "   Input: " + (nc.isIntegerOnly() ? "Integer Only" : "Decimal Allowed"),
                                margin, y, 470, 12);
                    }

                    case CODE_EDIT -> {
                        y = writeWrappedText(cs,
                                "   Response Type: Code Editing",
                                margin, y, 470, 12);
                    }

                    case IMAGE_HIGHLIGHT -> {
                        ImageHighlightCriterion ic = (ImageHighlightCriterion) crit;
                        y = writeWrappedText(cs,
                                "   Max Annotations: " + ic.getNumberOfAnnotations(),
                                margin, y, 470, 12);
                    }

                    case OPEN_ENDED -> {
                        y = writeWrappedText(cs,
                                "   Response Type: Open Text Answer",
                                margin, y, 470, 12);
                    }
                }

                y -= 10;
            }

            y -= 10;
            drawSectionDivider(cs, margin, page.getMediaBox().getWidth() - margin, y);
            y -= 25;

            // ============================
            // 3) STUDY DESCRIPTION (BACK!)
            // ============================
            y -= 30;
            cs.setFont(PDType1Font.TIMES_BOLD, 14);
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText("3. Study Description");
            cs.endText();

            y -= 18;

            cs.setFont(PDType1Font.TIMES_ROMAN, 12);

            String desc = (study.getDescription() != null) ? study.getDescription() : "";
            if (desc.length() > 600) desc = desc.substring(0, 600) + "...";

            y = writeWrappedText(cs, desc, margin, y, 480, 14);
        }
    }

    private void addCriterionPage(
            PDDocument doc,
            Study study,
            EvaluationTask task,
            CriterionStats stats,
            int totalParticipants,
            int completedCount,
            List<EvaluationCriterion> sortedCriteria
    ) throws IOException {

        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);

        float margin = 50;
        float y = page.getMediaBox().getHeight() - margin;
        float pageWidth = page.getMediaBox().getWidth();

        try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {


            // ============================================
// PAGE TITLE — ACADEMIC FORMAT
// ============================================
            cs.setFont(PDType1Font.TIMES_BOLD, 20);

// --- Left title: Criterion Analysis Report ---
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText("Criterion Analysis Report");
            cs.endText();

// --- Right-aligned Task information ---
            String taskHeader = "Task #" + task.getId();
            float titleFontSize = 20;

            float textWidth = PDType1Font.TIMES_BOLD.getStringWidth(taskHeader) / 1000f * titleFontSize;

            float rightX = pageWidth - margin - textWidth;

            cs.beginText();
            cs.newLineAtOffset(rightX, y);
            cs.showText(taskHeader);
            cs.endText();

            y -= 22;

// Underline / divider under title
            drawSectionDivider(cs, margin, pageWidth - margin, y);
            y -= 25;



// UNDERLINE / SECTION DIVIDER (thin Apple-style line)

            y -= 25;


            // ============================================
            // TASK HEADER
            // ============================================
            cs.setFont(PDType1Font.TIMES_BOLD, 14);
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText("Task Information");
            cs.endText();
            y -= 18;

            cs.setFont(PDType1Font.TIMES_ROMAN, 12);
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText("Task #" + task.getId() + ": " + task.getQuestionText());
            cs.endText();
            y -= 18;

            // ============================================
            // CRITERION META
            // ============================================
            cs.setFont(PDType1Font.TIMES_BOLD, 14);
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText("Criterion Details");
            cs.endText();
            y -= 18;

            EvaluationCriterion criterionObj = sortedCriteria.stream()
                    .filter(c -> Objects.equals(c.getId(), stats.criterionId))
                    .findFirst()
                    .orElse(null);

            String criterionType = (criterionObj != null)
                    ? criterionObj.getType().name()
                    : "UNKNOWN";

            // Question
            cs.setFont(PDType1Font.TIMES_ROMAN, 12);
            y = writeWrappedText(cs,
                    "• Question: " + stats.label,
                    margin, y, 480, 14);

            // DESCRIPTION
            String descriptionText = (criterionObj != null &&
                    criterionObj.getDescription() != null &&
                    !criterionObj.getDescription().isBlank())
                    ? criterionObj.getDescription()
                    : "—";

            y = writeWrappedText(cs,
                    "• Description: " + descriptionText,
                    margin, y, 480, 14);

            // Type
            y = writeWrappedText(cs,
                    "• Type: " + criterionType,
                    margin, y, 480, 14);

            // Correct answer
            String correctKey = "—";
            List<CorrectAnswerEntry> answerList = task.getCorrectAnswers();
            for (int j = 0; j < answerList.size(); j++) {
                if (Objects.equals(sortedCriteria.get(j).getId(), stats.criterionId)) {
                    String v = answerList.get(j).getAnswerValue();
                    correctKey = (v == null || v.isBlank()) ? "—" : v.trim();
                    break;
                }
            }

            y = writeWrappedText(cs,
                    "• Correct Answer: " + correctKey,
                    margin, y, 480, 14);

            y -= 20;

            // ============================================
            // CHART 1 — Correct/Wrong/Unknown/Pending
            // ============================================
            float chartWidth = 360f;
            float chartHeight = 160f;
            float centerX = (pageWidth - chartWidth) / 2f;

            JFreeChart correctnessChart = buildCorrectnessChart(stats);
            BufferedImage correctnessImage = correctnessChart.createBufferedImage(
                    (int) chartWidth, (int) chartHeight
            );
            PDImageXObject correctXImg = LosslessFactory.createFromImage(doc, correctnessImage);

            float chartY1 = y - chartHeight;
            cs.drawImage(correctXImg, centerX, chartY1, chartWidth, chartHeight);

            // Title under chart
            y = chartY1 - 18;
            cs.setFont(PDType1Font.TIMES_BOLD, 12);
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText("Correctness Distribution");
            cs.endText();

            y -= 20;

            // ============================================
            // CHART 2 — Answer Distribution
            // ============================================
            JFreeChart answerChart = buildAnswerDistributionChart(stats);
            BufferedImage answerImage = answerChart.createBufferedImage(
                    (int) chartWidth, (int) chartHeight
            );
            PDImageXObject answerXImg = LosslessFactory.createFromImage(doc, answerImage);

            float chartY2 = y - chartHeight;
            cs.drawImage(answerXImg, centerX, chartY2, chartWidth, chartHeight);

            y = chartY2 - 20;

            // ============================================
            // SUMMARY
            // ============================================
            cs.setFont(PDType1Font.TIMES_BOLD, 14);
            cs.beginText();
            cs.newLineAtOffset(margin, y);
            cs.showText("Summary");
            cs.endText();
            y -= 18;

            cs.setFont(PDType1Font.TIMES_ROMAN, 12);

            List<String> bulletLines = List.of(
                    "• Correct answers: " + stats.correct,
                    "• Wrong answers: " + stats.wrong,
                    "• Unknown: " + stats.unknown,
                    "• Pending (no submission): " + stats.pending,
                    "• Total analyzed submissions: " + (stats.correct + stats.wrong + stats.unknown),
                    "• Researcher key: " + correctKey
            );

            for (String line : bulletLines) {
                y = writeWrappedText(cs, line, margin, y, 480, 14);
            }
        }
    }

    // ============================
    // GRAFİK: Correct / Wrong / Unknown / Pending
    // Apple Numbers tarzı: ince barlar, pastel renkler, light-gray grid
    // ============================
    private JFreeChart buildCorrectnessChart(CriterionStats stats) {
        DefaultCategoryDataset dataset = new DefaultCategoryDataset();
        String series = "Count";

        dataset.addValue(stats.correct, series, "Correct");
        dataset.addValue(stats.wrong, series, "Wrong");
        dataset.addValue(stats.unknown, series, "Unknown");
        dataset.addValue(stats.pending, series, "Pending");

        JFreeChart chart = ChartFactory.createBarChart(
                "",          // title
                "Status",    // category axis
                "Count",     // value axis
                dataset
        );

        chart.removeLegend();   // ← turuncu nokta - "Count" legendını kaldırır

        CategoryPlot plot = chart.getCategoryPlot();

        // Arka plan & grid — Apple Numbers hissi
        plot.setBackgroundPaint(Color.WHITE);
        plot.setRangeGridlinePaint(new Color(220, 220, 220)); // light-gray grid
        plot.setDomainGridlinesVisible(false);
        plot.setOutlineVisible(false);

        NumberAxis rangeAxis = (NumberAxis) plot.getRangeAxis();
        rangeAxis.setAxisLineVisible(false);
        rangeAxis.setTickMarkPaint(new Color(190, 190, 190));

        // İnce barlar, pastel renkler
        BarRenderer renderer = new BarRenderer() {
            private final Map<String, Paint> colorMap = Map.of(
                    "Correct", new Color(143, 201, 166),   // pastel green
                    "Wrong", new Color(242, 164, 155),     // pastel red/peach
                    "Unknown", new Color(200, 200, 210),   // soft gray
                    "Pending", new Color(155, 187, 228)    // pastel blue
            );

            @Override
            public Paint getItemPaint(int row, int column) {
                Comparable<?> key = getPlot().getDataset().getColumnKey(column);
                Paint p = colorMap.get(key.toString());
                if (p != null) return p;
                return super.getItemPaint(row, column);
            }
        };

        renderer.setBarPainter(new StandardBarPainter());
        renderer.setDrawBarOutline(false);
        renderer.setMaximumBarWidth(0.10); // ince bar
        renderer.setItemMargin(0.20);      // barlar arası boşluk

        plot.setRenderer(renderer);

        chart.setBackgroundPaint(Color.WHITE);
        return chart;
    }

    // ============================
    // GRAFİK: Cevap İçeriği Dağılımı
    // Apple Numbers tarzı: pastel palette, ince barlar
    // ============================
    private JFreeChart buildAnswerDistributionChart(CriterionStats stats) {
        DefaultCategoryDataset dataset = new DefaultCategoryDataset();
        String series = "Answers";

        // OptionCounts LinkedHashMap → ekleme sırasını korur
        for (Map.Entry<String, Integer> e : stats.optionCounts.entrySet()) {
            dataset.addValue(e.getValue(), series, e.getKey());
        }

        JFreeChart chart = ChartFactory.createBarChart(
                "",          // title
                "Answer",    // category axis
                "Count",     // value axis
                dataset
        );

        chart.removeLegend();   // ← turuncu nokta - "Answers" legendını kaldırır


        CategoryPlot plot = chart.getCategoryPlot();

        plot.setBackgroundPaint(Color.WHITE);
        plot.setRangeGridlinePaint(new Color(220, 220, 220));
        plot.setDomainGridlinesVisible(false);
        plot.setOutlineVisible(false);

        NumberAxis rangeAxis = (NumberAxis) plot.getRangeAxis();
        rangeAxis.setAxisLineVisible(false);
        rangeAxis.setTickMarkPaint(new Color(190, 190, 190));

        // Farklı cevap seçenekleri için dönen pastel palette
        List<Color> pastelColors = List.of(
                new Color(155, 187, 228),
                new Color(143, 201, 166),
                new Color(242, 164, 155),
                new Color(248, 206, 130),
                new Color(196, 189, 151),
                new Color(200, 200, 210)
        );

        BarRenderer renderer = new BarRenderer() {
            @Override
            public Paint getItemPaint(int row, int column) {
                int idx = column % pastelColors.size();
                return pastelColors.get(idx);
            }
        };

        renderer.setBarPainter(new StandardBarPainter());
        renderer.setDrawBarOutline(false);
        renderer.setMaximumBarWidth(0.10);
        renderer.setItemMargin(0.15);

        plot.setRenderer(renderer);

        chart.setBackgroundPaint(Color.WHITE);
        return chart;
    }

    // ============================
    // Wraplı text yazmak için helper
    // ============================
    private float writeWrappedText(PDPageContentStream cs,
                                   String text,
                                   float x,
                                   float y,
                                   float maxWidth,
                                   float lineHeight) throws IOException {

        List<String> lines = wrapText(text, maxWidth, PDType1Font.TIMES_ROMAN, 10);

        for (String line : lines) {
            cs.beginText();
            cs.newLineAtOffset(x, y);
            cs.showText(line);
            cs.endText();
            y -= lineHeight;
        }
        return y;
    }

    private void drawSectionDivider(PDPageContentStream cs, float startX, float endX, float y) throws IOException {
        cs.setStrokingColor(200, 200, 200); // light gray
        cs.setLineWidth(0.6f);
        cs.moveTo(startX, y);
        cs.lineTo(endX, y);
        cs.stroke();
    }

    private List<String> wrapText(String text, float maxWidth,
                                  PDType1Font font, float fontSize) throws IOException {

        List<String> lines = new ArrayList<>();
        if (text == null || text.isEmpty()) return lines;

        String[] words = text.split("\\s+");
        StringBuilder currentLine = new StringBuilder();

        for (String w : words) {
            String candidate = currentLine.isEmpty()
                    ? w
                    : currentLine + " " + w;

            float width = fontSize * font.getStringWidth(candidate) / 1000;

            if (width > maxWidth) {
                if (!currentLine.isEmpty()) {
                    lines.add(currentLine.toString());
                }
                currentLine = new StringBuilder(w);
            } else {
                currentLine = new StringBuilder(candidate);
            }
        }

        if (!currentLine.isEmpty()) {
            lines.add(currentLine.toString());
        }

        return lines;
    }

    // ============================
    // KÜÇÜK İÇ CLASS
    // ============================
    private static class CriterionStats {
        Long criterionId;
        String label;
        int correct;
        int wrong;
        int unknown;
        int pending;
        Map<String, Integer> optionCounts = new LinkedHashMap<>();
    }
}
