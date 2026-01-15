import opendota.Parse;
import opendota.Entry;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

public class OpenDotaLocalParser {
    
    public static class ParseResult {
        public List<Entry> entries;
        public String jsonOutput;
        public long parseTime;
        
        public ParseResult(List<Entry> entries, String jsonOutput, long parseTime) {
            this.entries = entries;
            this.jsonOutput = jsonOutput;
            this.parseTime = parseTime;
        }
    }
    
    /**
     * Parse a local replay file using OpenDota's parser
     * @param replayFilePath Path to the .dem replay file
     * @return ParseResult with all entries and JSON output
     */
    public static ParseResult parseReplay(String replayFilePath) {
        long startTime = System.currentTimeMillis();
        
        try {
            // Read the replay file
            File replayFile = new File(replayFilePath);
            if (!replayFile.exists()) {
                throw new FileNotFoundException("Replay file not found: " + replayFilePath);
            }
            
            // Create input stream from file
            FileInputStream fis = new FileInputStream(replayFile);
            
            // Create output stream to capture JSON
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            
            // Parse using OpenDota's Parse class
            Parse parser = new Parse(fis, baos, false);
            
            // Get the JSON output
            String jsonOutput = baos.toString();
            
            // Parse entries from JSON (simplified - in real implementation would parse JSON properly)
            List<Entry> entries = new ArrayList<>();
            
            long parseTime = System.currentTimeMillis() - startTime;
            
            fis.close();
            baos.close();
            
            return new ParseResult(entries, jsonOutput, parseTime);
            
        } catch (Exception e) {
            throw new RuntimeException("Error parsing replay: " + e.getMessage(), e);
        }
    }
    
    /**
     * Parse replay and save to file
     * @param replayFilePath Path to .dem file
     * @param outputPath Where to save the JSON output
     */
    public static void parseAndSave(String replayFilePath, String outputPath) {
        try {
            System.out.println("Parsing replay: " + replayFilePath);
            
            ParseResult result = parseReplay(replayFilePath);
            
            // Save JSON to file
            try (FileWriter writer = new FileWriter(outputPath)) {
                writer.write(result.jsonOutput);
            }
            
            System.out.println("Parse completed in " + result.parseTime + "ms");
            System.out.println("Output saved to: " + outputPath);
            System.out.println("JSON output size: " + result.jsonOutput.length() + " characters");
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Main method for command line usage
     */
    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: java OpenDotaLocalParser <replay_file.dem> [output_file.json]");
            System.out.println("Example: java OpenDotaLocalParser match.dem match_data.json");
            return;
        }
        
        String replayFile = args[0];
        String outputFile = args.length > 1 ? args[1] : "output.json";
        
        parseAndSave(replayFile, outputFile);
    }
}
