package com.artifactcomparator.artifact_comparator_backend.Util;

import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;

public class CSVReaderUtil {

    public static List<List<String>> readCSV(MultipartFile file) throws Exception {
        List<List<String>> rows = new ArrayList<>();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;

            while ((line = br.readLine()) != null) {

                List<String> parsed = parseCSVLine(line);
                rows.add(parsed);
            }
        }

        return rows;
    }

    // 🔥 TIRNAK İÇİNDEKİ VİRGÜLLERİ BÖLMEYEN PARSER
    private static List<String> parseCSVLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();

        boolean insideQuotes = false;

        for (char ch : line.toCharArray()) {

            if (ch == '"') {
                insideQuotes = !insideQuotes;  // aç kapa
            }
            else if (ch == ',' && !insideQuotes) {
                // virgül ama tırnak dışında → yeni kolon
                result.add(current.toString().trim());
                current.setLength(0);
            }
            else {
                current.append(ch);
            }
        }

        // son kolon
        result.add(current.toString().trim());
        return result;
    }
}
