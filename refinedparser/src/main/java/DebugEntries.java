import opendota.Parse;
import opendota.Entry;

import java.io.*;
import java.util.*;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public class DebugEntries {
    
    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: java DebugEntries <replay_file.dem>");
            return;
        }
        
        String replayFile = args[0];
        
        try {
            System.out.println("Analyzing entry types from: " + replayFile);
            
            // Get entries from OpenDota parser
            List<Entry> entries = getEntriesFromParser(replayFile);
            
            // Analyze entry types
            Map<String, Integer> typeCounts = new HashMap<>();
            Set<String> allTypes = new HashSet<>();
            
            for (Entry entry : entries) {
                String type = entry.type;
                if (type != null) {
                    typeCounts.put(type, typeCounts.getOrDefault(type, 0) + 1);
                    allTypes.add(type);
                }
            }
            
            System.out.println("\n=== ENTRY TYPES ANALYSIS ===");
            System.out.println("Total entries: " + entries.size());
            System.out.println("Unique types: " + allTypes.size());
            
            System.out.println("\n=== TYPE COUNTS ===");
            typeCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .forEach(entry -> {
                    System.out.printf("%-30s: %d%n", entry.getKey(), entry.getValue());
                });
            
            System.out.println("\n=== ALL TYPES ===");
            allTypes.stream().sorted().forEach(type -> {
                System.out.println("- " + type);
            });
            
            // Show sample entries for each type
            System.out.println("\n=== SAMPLE ENTRIES ===");
            Map<String, Entry> sampleEntries = new HashMap<>();
            
            for (Entry entry : entries) {
                String type = entry.type;
                if (type != null && !sampleEntries.containsKey(type)) {
                    sampleEntries.put(type, entry);
                    if (sampleEntries.size() >= 10) break; // Show first 10 types
                }
            }
            
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            
            for (Map.Entry<String, Entry> sample : sampleEntries.entrySet()) {
                System.out.println("\n--- " + sample.getKey() + " ---");
                System.out.println(gson.toJson(sample.getValue()));
            }
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private static List<Entry> getEntriesFromParser(String replayFilePath) throws Exception {
        FileInputStream fis = new FileInputStream(replayFilePath);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        // Use OpenDota's parser to get line-delimited entries
        new opendota.Parse(fis, baos, false);
        
        String jsonOutput = baos.toString();
        String[] lines = jsonOutput.split("\n");
        
        List<Entry> entries = new ArrayList<>();
        Gson gson = new Gson();
        
        for (String line : lines) {
            if (!line.trim().isEmpty()) {
                try {
                    Entry entry = gson.fromJson(line, Entry.class);
                    entries.add(entry);
                } catch (Exception e) {
                    // Skip invalid lines
                }
            }
        }
        
        fis.close();
        baos.close();
        
        return entries;
    }
}
