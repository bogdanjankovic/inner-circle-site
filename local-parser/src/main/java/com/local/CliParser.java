package com.local;

import opendota.Parse;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;

public class CliParser {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: java -cp ... com.local.CliParser <replay.dem> [output.json] [--opendota]");
            System.out.println("  --opendota  Output in standard OpenDota format instead of website format");
            return;
        }

        String replayPath = args[0];
        String outputPath = args.length > 1 && !args[1].startsWith("--") ? args[1] : "output.json";

        // Default to OpenDota format for full data output
        boolean websiteFormat = false;
        for (String arg : args) {
            if ("--opendota".equals(arg)) {
                websiteFormat = false;
                break;
            }
        }

        File file = new File(replayPath);
        if (!file.exists()) {
            System.err.println("File not found: " + replayPath);
            return;
        }

        System.out.println("Parsing: " + replayPath);
        System.out.println("Format: " + (websiteFormat ? "Website-compatible" : "OpenDota standard"));
        long start = System.currentTimeMillis();

        try (FileInputStream fis = new FileInputStream(file);
                ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            // blob = true, websiteFormat = true by default for website-compatible output
            new Parse(fis, baos, true, websiteFormat);

            String json = baos.toString("UTF-8");

            try (FileOutputStream fos = new FileOutputStream(outputPath)) {
                fos.write(json.getBytes("UTF-8"));
            }

            long end = System.currentTimeMillis();
            System.out.println("Done! Output saved to: " + outputPath);
            System.out.println("Time taken: " + (end - start) + "ms");

        } catch (Exception e) {
            System.err.println("Error during parsing:");
            e.printStackTrace();
        }
    }
}
