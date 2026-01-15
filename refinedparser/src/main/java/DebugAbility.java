import opendota.Parse;
import opendota.Entry;

import java.io.*;
import java.util.*;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public class DebugAbility {
    
    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: java DebugAbility <replay_file.dem>");
            return;
        }
        
        String replayFile = args[0];
        
        try {
            System.out.println("Analyzing DOTA_ABILITY_LEVEL entries from: " + replayFile);
            
            // Get entries from OpenDota parser
            List<Entry> entries = getEntriesFromParser(replayFile);
            
            int count = 0;
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            
            for (Entry entry : entries) {
                if ("DOTA_ABILITY_LEVEL".equals(entry.type)) {
                    count++;
                    System.out.println("\n--- DOTA_ABILITY_LEVEL Entry #" + count + " ---");
                    System.out.println(gson.toJson(entry));
                    
                    // Show all available fields
                    System.out.println("Fields:");
                    System.out.println("  time: " + entry.time);
                    System.out.println("  type: " + entry.type);
                    System.out.println("  key: " + entry.key);
                    System.out.println("  value: " + entry.value);
                    System.out.println("  player_slot: " + entry.player_slot);
                    System.out.println("  slot: " + entry.slot);
                    System.out.println("  abilitylevel: " + entry.abilitylevel);
                    System.out.println("  hero_id: " + entry.hero_id);
                    System.out.println("  attackername: " + entry.attackername);
                    System.out.println("  targetname: " + entry.targetname);
                    
                    if (count >= 5) break; // Show first 5 entries
                }
            }
            
            System.out.println("\nTotal DOTA_ABILITY_LEVEL entries: " + count);
            
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
