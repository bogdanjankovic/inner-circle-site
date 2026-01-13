
import javax.swing.*;
import java.awt.*;
import java.awt.datatransfer.StringSelection;
import java.io.File;
import java.util.prefs.Preferences;

public class GuiParser extends JFrame {

    private JTextArea resultArea;
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

        topPanel.add(selectButton);
        topPanel.add(resetButton);

        resultArea = new JTextArea();
        resultArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        resultArea.setEditable(false);
        resultArea.setText("Ready to parse. Select a replay file.");
        JScrollPane scrollPane = new JScrollPane(resultArea);

        JPanel bottomPanel = new JPanel();
        JButton copyButton = new JButton("Copy to Clipboard");
        bottomPanel.add(copyButton);

        add(topPanel, BorderLayout.NORTH);
        add(scrollPane, BorderLayout.CENTER);
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

        resetButton.addActionListener(e -> {
            resultArea.setText("Ready to parse. Select a replay file.");
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

    private void parseFile(String path) {
        resultArea.setText("Parsing " + new File(path).getName() + "...\nPlease wait...");

        new Thread(() -> {
            try {
                SimpleParser parser = new SimpleParser(path);

                // Set callback to update UI
                parser.setStatusCallback(msg -> {
                    SwingUtilities.invokeLater(() -> {
                        resultArea.append(msg + "\n");
                        // Scroll to bottom
                        resultArea.setCaretPosition(resultArea.getDocument().getLength());
                    });
                });

                parser.readHeader(path);
                String json = parser.run();

                SwingUtilities.invokeLater(() -> {
                    // Clear progress logs and show final JSON
                    resultArea.setText(json);
                    resultArea.setCaretPosition(0);
                });
            } catch (Exception e) {
                SwingUtilities.invokeLater(() -> resultArea.setText("Error: " + e.getMessage()));
                e.printStackTrace();
            }
        }).start();
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
