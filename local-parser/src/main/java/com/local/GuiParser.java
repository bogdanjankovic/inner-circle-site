package com.local;

import javax.swing.*;
import java.awt.*;
import java.awt.datatransfer.StringSelection;
import java.io.File;
import java.util.prefs.Preferences;

public class GuiParser extends JFrame {

    private JTextArea resultArea;
    private JTextArea skillBuildArea;
    private JComboBox<String> skillBuildPlayerCombo;
    private com.google.gson.JsonArray currentPlayersArray; // Store parsed players

    private JComboBox<String> parserChoice;
    private JProgressBar progressBar;
    private Preferences prefs;
    private static final String PREF_LAST_DIR = "last_dem_dir";

    public GuiParser() {
        prefs = Preferences.userNodeForPackage(GuiParser.class);

        setTitle("Dota 2 Replay Parser (Basic UI)");
        setSize(800, 600);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        JPanel topPanel = new JPanel();
        JButton selectButton = new JButton("Select .dem File");
        JButton resetButton = new JButton("Reset / Back");
        JButton rawButton = new JButton("Raw Dump");

        parserChoice = new JComboBox<>(new String[] { "OpenDota Official" });

        topPanel.add(new JLabel("Parser:"));
        topPanel.add(parserChoice);
        topPanel.add(selectButton);
        topPanel.add(rawButton);
        topPanel.add(resetButton);

        resultArea = new JTextArea();
        resultArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        resultArea.setEditable(false);
        resultArea.setLineWrap(true);
        resultArea.setWrapStyleWord(true);
        resultArea.setText("Ready to parse. Select a replay file.");
        JScrollPane jsonScrollPane = new JScrollPane(resultArea);

        // --- Skill Build Tab ---
        JPanel skillBuildPanel = new JPanel(new BorderLayout());
        JPanel skillControlPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        skillBuildPlayerCombo = new JComboBox<>();
        skillBuildPlayerCombo.setPreferredSize(new Dimension(300, 25));
        skillBuildPlayerCombo.addActionListener(e -> updateSkillBuildView());

        skillControlPanel.add(new JLabel("Select Player:"));
        skillControlPanel.add(skillBuildPlayerCombo);

        skillBuildArea = new JTextArea();
        skillBuildArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        skillBuildArea.setEditable(false);
        JScrollPane skillScrollPane = new JScrollPane(skillBuildArea);

        skillBuildPanel.add(skillControlPanel, BorderLayout.NORTH);
        skillBuildPanel.add(skillScrollPane, BorderLayout.CENTER);

        JTabbedPane tabbedPane = new JTabbedPane();
        tabbedPane.addTab("JSON Output", jsonScrollPane);
        tabbedPane.addTab("Skill Build Inspector", skillBuildPanel);

        progressBar = new JProgressBar(0, 100);
        progressBar.setStringPainted(true);
        progressBar.setPreferredSize(new Dimension(800, 25));

        JPanel bottomPanel = new JPanel(new BorderLayout());
        JButton copyButton = new JButton("Copy to Clipboard");
        bottomPanel.add(progressBar, BorderLayout.NORTH);
        bottomPanel.add(copyButton, BorderLayout.SOUTH);

        add(topPanel, BorderLayout.NORTH);
        add(tabbedPane, BorderLayout.CENTER);
        add(bottomPanel, BorderLayout.SOUTH);

        selectButton.addActionListener(e -> {
            String lastDir = prefs.get(PREF_LAST_DIR, System.getProperty("user.home"));
            JFileChooser fileChooser = new JFileChooser(lastDir);

            int option = fileChooser.showOpenDialog(this);
            if (option == JFileChooser.APPROVE_OPTION) {
                File file = fileChooser.getSelectedFile();
                prefs.put(PREF_LAST_DIR, file.getParent()); // Save directory
                parseFile(file.getAbsolutePath());
            }
        });

        rawButton.addActionListener(e -> {
            String lastDir = prefs.get(PREF_LAST_DIR, System.getProperty("user.home"));
            JFileChooser fileChooser = new JFileChooser(lastDir);
            if (fileChooser.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
                performRawDump(fileChooser.getSelectedFile().getAbsolutePath());
            }
        });

        resetButton.addActionListener(e -> {
            resultArea.setText("Ready to parse. Select a replay file.");
            progressBar.setValue(0);
        });

        copyButton.addActionListener(e -> {
            String text = resultArea.getText();
            if (text != null && !text.isEmpty()) {
                StringSelection selection = new StringSelection(text);
                Toolkit.getDefaultToolkit().getSystemClipboard().setContents(selection, selection);
                JOptionPane.showMessageDialog(this, "JSON copied to clipboard!");
            }
        });
    }

    private void performRawDump(String path) {
        System.out.println("GUI: Initiating Raw Dump for " + path);
        resultArea.setText(
                "Performing Raw Dump...\nThis processes the whole file to get the final state.\nCheck console for tick progress...\nPlease wait...");
        progressBar.setIndeterminate(true);
        new Thread(() -> {
            try {
                java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                try (java.io.FileInputStream fis = new java.io.FileInputStream(path)) {
                    // blob = false to get raw entries
                    new opendota.Parse(fis, baos, false);
                }
                String result = baos.toString("UTF-8");
                SwingUtilities.invokeLater(() -> {
                    resultArea.setText(result);
                    resultArea.setCaretPosition(0);
                    progressBar.setIndeterminate(false);
                    progressBar.setValue(100);
                    JOptionPane.showMessageDialog(this, "Raw Dump complete!");
                });
            } catch (Exception e) {
                System.err.println("GUI: Raw Dump failed!");
                e.printStackTrace();
                SwingUtilities.invokeLater(() -> {
                    progressBar.setIndeterminate(false);
                    resultArea.setText("Dump Error: " + e.getMessage() + "\nSee console/terminal.");
                });
            }
        }).start();
    }

    private void parseFile(String path) {
        resultArea.setText("Parsing " + new File(path).getName() + "...\nPlease wait...");

        new Thread(() -> {
            try {
                String json = "";
                com.google.gson.Gson prettyGson = new com.google.gson.GsonBuilder().setPrettyPrinting().create();

                java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                try (java.io.FileInputStream fis = new java.io.FileInputStream(path)) {
                    new opendota.Parse(fis, baos, true, true); // Enable WebsiteMatchData format
                }
                json = baos.toString("UTF-8");
                // Pretty print it
                try {
                    com.google.gson.JsonObject rootObj = prettyGson.fromJson(json, com.google.gson.JsonObject.class);
                    // Store players for the inspector
                    if (rootObj.has("players")) {
                        currentPlayersArray = rootObj.getAsJsonArray("players");
                    }
                    Object obj = prettyGson.fromJson(json, Object.class);
                    json = prettyGson.toJson(obj);
                } catch (Exception ex) {
                    // Not a single JSON
                }

                final String finalJson = json;
                SwingUtilities.invokeLater(() -> {
                    resultArea.setText(finalJson);
                    resultArea.setCaretPosition(0);
                    progressBar.setValue(100);
                    populateSkillBuildCombo(); // Update the combo box
                });
            } catch (Exception e) {
                SwingUtilities.invokeLater(() -> resultArea.setText("Error: " + e.getMessage()));
                e.printStackTrace();
            }
        }).start();
    }

    private void populateSkillBuildCombo() {
        skillBuildPlayerCombo.removeAllItems();
        if (currentPlayersArray == null)
            return;

        for (int i = 0; i < currentPlayersArray.size(); i++) {
            com.google.gson.JsonObject p = currentPlayersArray.get(i).getAsJsonObject();
            String name = p.has("name") && !p.get("name").isJsonNull() ? p.get("name").getAsString() : "Unknown";
            String hero = p.has("heroName") && !p.get("heroName").isJsonNull() ? p.get("heroName").getAsString()
                    : "No Hero";
            skillBuildPlayerCombo.addItem(String.format("Slot %d: %s (%s)", i, name, hero));
        }
    }

    private void updateSkillBuildView() {
        int idx = skillBuildPlayerCombo.getSelectedIndex();
        if (idx < 0 || currentPlayersArray == null || idx >= currentPlayersArray.size()) {
            skillBuildArea.setText("");
            return;
        }

        com.google.gson.JsonObject p = currentPlayersArray.get(idx).getAsJsonObject();
        StringBuilder sb = new StringBuilder();

        String name = p.has("name") && !p.get("name").isJsonNull() ? p.get("name").getAsString() : "Unknown";
        String hero = p.has("heroName") && !p.get("heroName").isJsonNull() ? p.get("heroName").getAsString()
                : "No Hero";

        sb.append("Player: ").append(name).append("\n");
        sb.append("Hero:   ").append(hero).append("\n");
        sb.append("=========================================\n");
        sb.append(String.format("%-10s | %-5s | %s\n", "Time", "Level", "Ability"));
        sb.append("-----------------------------------------\n");

        if (p.has("ability_upgrades")) {
            com.google.gson.JsonArray upgrades = p.getAsJsonArray("ability_upgrades");
            // Need to sort? Usually they are appended in order.
            for (com.google.gson.JsonElement el : upgrades) {
                com.google.gson.JsonObject u = el.getAsJsonObject();
                int time = u.get("time").getAsInt();
                int level = u.get("level").getAsInt();
                String ability = u.get("ability").getAsString();

                int min = time / 60;
                int sec = time % 60;
                String timeStr = String.format("%d:%02d", min, sec);

                sb.append(String.format("%-10s | %-5d | %s\n", timeStr, level, ability));
            }
        } else {
            sb.append("No ability_upgrades found.\n");
        }

        skillBuildArea.setText(sb.toString());
        skillBuildArea.setCaretPosition(0);
    }

    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ignored) {
        }

        SwingUtilities.invokeLater(() -> {
            new GuiParser().setVisible(true);
        });
    }
}
