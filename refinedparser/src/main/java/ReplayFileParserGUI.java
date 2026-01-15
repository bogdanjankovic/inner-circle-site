import javax.swing.*;
import javax.swing.filechooser.FileNameExtensionFilter;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.File;
import java.io.FileInputStream;
import java.io.ByteArrayOutputStream;

public class ReplayFileParserGUI extends JFrame {
    private JTextField filePathField;
    private JTextArea outputArea;
    private JButton browseButton;
    private JButton parseButton;
    private JButton clearButton;
    private JLabel statusLabel;
    private JButton compareWithApiButton;
    
    public ReplayFileParserGUI() {
        setTitle("Dota 2 Replay File Parser");
        setSize(1000, 700);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        
        initComponents();
        layoutComponents();
    }
    
    private void initComponents() {
        filePathField = new JTextField(30);
        filePathField.setEditable(false);
        browseButton = new JButton("Browse...");
        parseButton = new JButton("Parse Replay");
        clearButton = new JButton("Clear Output");
        compareWithApiButton = new JButton("Compare with OpenDota API");
        outputArea = new JTextArea();
        outputArea.setEditable(false);
        outputArea.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        statusLabel = new JLabel("Ready - Select a replay file to begin");
        
        browseButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                browseReplayFile();
            }
        });
        
        parseButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                parseReplayFile();
            }
        });
        
        clearButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                outputArea.setText("");
                statusLabel.setText("Output cleared");
            }
        });
        
        compareWithApiButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                compareWithOpenDota();
            }
        });
        
        // Initially disable parse buttons
        parseButton.setEnabled(false);
        compareWithApiButton.setEnabled(false);
    }
    
    private void layoutComponents() {
        JPanel topPanel = new JPanel(new BorderLayout());
        JPanel filePanel = new JPanel(new FlowLayout());
        filePanel.add(new JLabel("Replay File:"));
        filePanel.add(filePathField);
        filePanel.add(browseButton);
        
        JPanel buttonPanel = new JPanel(new FlowLayout());
        buttonPanel.add(parseButton);
        buttonPanel.add(compareWithApiButton);
        buttonPanel.add(clearButton);
        
        topPanel.add(filePanel, BorderLayout.CENTER);
        topPanel.add(buttonPanel, BorderLayout.SOUTH);
        
        JScrollPane scrollPane = new JScrollPane(outputArea);
        scrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_ALWAYS);
        
        setLayout(new BorderLayout());
        add(topPanel, BorderLayout.NORTH);
        add(scrollPane, BorderLayout.CENTER);
        add(statusLabel, BorderLayout.SOUTH);
    }
    
    private void browseReplayFile() {
        // Set default path to user's specified replay folder
        String defaultPath = "A:\\SteamLibrary\\steamapps\\common\\dota 2 beta\\game\\dota\\replays";
        
        JFileChooser fileChooser = new JFileChooser(defaultPath);
        fileChooser.setFileFilter(new FileNameExtensionFilter("Dota 2 Replay Files (*.dem)", "dem"));
        fileChooser.setDialogTitle("Select Dota 2 Replay File");
        
        // Check if default path exists, if not fallback to user home
        File defaultDir = new File(defaultPath);
        if (!defaultDir.exists()) {
            fileChooser.setCurrentDirectory(new File(System.getProperty("user.home")));
        }
        
        int result = fileChooser.showOpenDialog(this);
        if (result == JFileChooser.APPROVE_OPTION) {
            File selectedFile = fileChooser.getSelectedFile();
            filePathField.setText(selectedFile.getAbsolutePath());
            parseButton.setEnabled(true);
            compareWithApiButton.setEnabled(true);
            statusLabel.setText("Selected: " + selectedFile.getName());
        }
    }
    
    private void parseReplayFile() {
        String filePath = filePathField.getText().trim();
        if (filePath.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please select a replay file", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }
        
        File replayFile = new File(filePath);
        if (!replayFile.exists()) {
            JOptionPane.showMessageDialog(this, "Replay file does not exist", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }
        
        // Run in background thread
        SwingWorker<String, Void> worker = new SwingWorker<String, Void>() {
            @Override
            protected String doInBackground() throws Exception {
                long startTime = System.currentTimeMillis();
                
                try {
                    // Use complete OpenDota parser (fixed version)
                    OpenDotaCompleteParserFixed.CompleteMatchData matchData = OpenDotaCompleteParserFixed.parseReplayFile(replayFile.getAbsolutePath());
                    
                    // Convert to pretty JSON
                    com.google.gson.Gson gson = new com.google.gson.GsonBuilder()
                        .setPrettyPrinting()
                        .create();
                    
                    String jsonOutput = gson.toJson(matchData);
                    
                    long parseTime = System.currentTimeMillis() - startTime;
                    
                    // Save to file
                    String filename = "complete_opendota_" + replayFile.getName().replace(".dem", ".json");
                    try {
                        java.io.FileWriter writer = new java.io.FileWriter(filename);
                        writer.write(jsonOutput);
                        writer.close();
                        
                        return "=== COMPLETE OPENDOTA PARSER RESULTS ===\n\n" +
                               "Replay: " + replayFile.getName() + "\n" +
                               "Parse Time: " + parseTime + "ms\n" +
                               "Match ID: " + matchData.match_id + "\n" +
                               "Duration: " + matchData.duration + " seconds\n" +
                               "Players: " + matchData.players.size() + "\n" +
                               "Picks/Bans: " + matchData.picks_bans.size() + "\n" +
                               "Teamfights: " + matchData.teamfights.size() + "\n" +
                               "Chat Messages: " + matchData.chat.size() + "\n" +
                               "Objectives: " + matchData.objectives.size() + "\n" +
                               "Output Size: " + jsonOutput.length() + " characters\n" +
                               "Data saved to: " + filename + "\n\n" +
                               "=== PLAYER SUMMARY ===\n\n" +
                               getPlayerSummaryFixed(matchData) + "\n\n" +
                               "=== DRAFT SUMMARY ===\n\n" +
                               getDraftSummaryFixed(matchData) + "\n\n" +
                               "=== SAMPLE JSON ===\n\n" +
                               getJsonSample(jsonOutput) + "\n\n" +
                               "=== FULL JSON DATA ===\n\n" + jsonOutput;
                               
                    } catch (Exception e) {
                        return "Error saving file: " + e.getMessage() + "\n\n" + jsonOutput;
                    }
                    
                } catch (Exception e) {
                    throw new RuntimeException("Error parsing replay: " + e.getMessage(), e);
                }
            }
            
            @Override
            protected void done() {
                try {
                    String result = get();
                    outputArea.setText(result);
                    statusLabel.setText("Replay parsed successfully with OpenDota parser");
                } catch (Exception e) {
                    JOptionPane.showMessageDialog(ReplayFileParserGUI.this, 
                        "Error parsing replay file: " + e.getMessage(), 
                        "Error", 
                        JOptionPane.ERROR_MESSAGE);
                    statusLabel.setText("Error: " + e.getMessage());
                }
            }
        };
        
        worker.execute();
        statusLabel.setText("Parsing replay with OpenDota engine...");
    }
    
    private String getPlayerSummaryFixed(OpenDotaCompleteParserFixed.CompleteMatchData matchData) {
        StringBuilder summary = new StringBuilder();
        
        for (int i = 0; i < matchData.players.size(); i++) {
            OpenDotaCompleteParserFixed.CompletePlayer player = matchData.players.get(i);
            if (player.hero_name != null) {
                String team = player.team == 2 ? "Radiant" : "Dire";
                summary.append(String.format("%s %s (Slot %d): %d/%d/%d | GPM: %d | XPM: %d | Net Worth: %d | Hero Damage: %d\n",
                    team,
                    player.hero_name,
                    player.player_slot,
                    player.kills,
                    player.deaths,
                    player.assists,
                    player.gold_per_min,
                    player.xp_per_min,
                    player.net_worth,
                    player.hero_damage
                ));
            }
        }
        
        return summary.toString();
    }
    
    private String getDraftSummaryFixed(OpenDotaCompleteParserFixed.CompleteMatchData matchData) {
        StringBuilder summary = new StringBuilder();
        
        for (OpenDotaCompleteParserFixed.PickBan pickBan : matchData.picks_bans) {
            String action = pickBan.is_pick ? "PICK" : "BAN";
            String team = pickBan.team == 2 ? "Radiant" : "Dire";
            summary.append(String.format("Order %d: %s %s - %s (Time: %ds)\n",
                pickBan.order,
                team,
                action,
                pickBan.hero_name,
                pickBan.time
            ));
        }
        
        return summary.toString();
    }
    
    private String getPlayerSummary(OpenDotaCompleteParserFixed.CompleteMatchData matchData) {
        return getPlayerSummaryFixed(matchData); // Use fixed version
    }
    
    private String getDraftSummary(OpenDotaCompleteParserFixed.CompleteMatchData matchData) {
        return getDraftSummaryFixed(matchData); // Use fixed version
    }
    
    private String getJsonSample(String json) {
        String[] lines = json.split("\n");
        StringBuilder sample = new StringBuilder();
        int maxLines = Math.min(30, lines.length);
        
        for (int i = 0; i < maxLines; i++) {
            sample.append(lines[i]).append("\n");
        }
        
        if (lines.length > 30) {
            sample.append("... (").append(lines.length - 30).append(" more lines)\n");
        }
        
        return sample.toString();
    }
    
    private void compareWithOpenDota() {
        String filePath = filePathField.getText().trim();
        if (filePath.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please select a replay file", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }
        
        // Extract match ID from filename
        File replayFile = new File(filePath);
        String fileName = replayFile.getName();
        
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(\\d{8,})");
        java.util.regex.Matcher matcher = pattern.matcher(fileName);
        
        if (matcher.find()) {
            String matchId = matcher.group(1);
            
            int confirm = JOptionPane.showConfirmDialog(
                this,
                "Extracted Match ID: " + matchId + "\n\nFetch data from OpenDota API for comparison?",
                "Confirm Match ID",
                JOptionPane.YES_NO_OPTION
            );
            
            if (confirm == JOptionPane.YES_OPTION) {
                fetchOpenDotaData(matchId);
            }
        } else {
            JOptionPane.showMessageDialog(this, 
                "Could not extract match ID from filename", 
                "Error", 
                JOptionPane.ERROR_MESSAGE);
        }
    }
    
    private void fetchOpenDotaData(String matchId) {
        SwingWorker<String, Void> worker = new SwingWorker<String, Void>() {
            @Override
            protected String doInBackground() throws Exception {
                RefinedParser parser = new RefinedParser();
                return parser.fetchMatchData(Long.parseLong(matchId));
            }
            
            @Override
            protected void done() {
                try {
                    String result = get();
                    
                    // Create comparison view
                    StringBuilder comparison = new StringBuilder();
                    comparison.append("=== OPEN DOTA API DATA ===\n\n");
                    comparison.append("Match ID: ").append(matchId).append("\n");
                    comparison.append("Data fetched successfully\n\n");
                    
                    // Parse JSON to extract key info
                    com.google.gson.JsonObject json = com.google.gson.JsonParser.parseString(result).getAsJsonObject();
                    
                    if (json.has("match_id")) {
                        comparison.append("Match ID: ").append(json.get("match_id").getAsString()).append("\n");
                    }
                    if (json.has("duration")) {
                        int duration = json.get("duration").getAsInt();
                        int minutes = duration / 60;
                        int seconds = duration % 60;
                        comparison.append("Duration: ").append(minutes).append(":").append(String.format("%02d", seconds)).append("\n");
                    }
                    if (json.has("radiant_win")) {
                        comparison.append("Winner: ").append(json.get("radiant_win").getAsBoolean() ? "Radiant" : "Dire").append("\n");
                    }
                    if (json.has("radiant_score") && json.has("dire_score")) {
                        comparison.append("Score: ").append(json.get("radiant_score").getAsInt())
                                  .append(" - ").append(json.get("dire_score").getAsInt()).append("\n");
                    }
                    
                    comparison.append("\n=== FULL JSON DATA ===\n");
                    comparison.append(result);
                    
                    outputArea.setText(comparison.toString());
                    statusLabel.setText("OpenDota data fetched for match " + matchId);
                    
                    // Also save to file
                    String filename = "match_data_opendota_" + matchId + ".json";
                    try {
                        java.io.FileWriter writer = new java.io.FileWriter(filename);
                        writer.write(result);
                        writer.close();
                        statusLabel.setText("Data saved to " + filename);
                    } catch (Exception e) {
                        statusLabel.setText("Data fetched, error saving file: " + e.getMessage());
                    }
                    
                } catch (Exception e) {
                    JOptionPane.showMessageDialog(ReplayFileParserGUI.this, 
                        "Error fetching OpenDota data: " + e.getMessage(), 
                        "Error", 
                        JOptionPane.ERROR_MESSAGE);
                    statusLabel.setText("Error: " + e.getMessage());
                }
            }
        };
        
        worker.execute();
        statusLabel.setText("Fetching data from OpenDota API...");
    }
    
    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
        return String.format("%.1f GB", bytes / (1024.0 * 1024.0 * 1024.0));
    }
    
    public static void main(String[] args) {
        // Set Look and Feel
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            // Use default
        }
        
        SwingUtilities.invokeLater(new Runnable() {
            @Override
            public void run() {
                new ReplayFileParserGUI().setVisible(true);
            }
        });
    }
}
