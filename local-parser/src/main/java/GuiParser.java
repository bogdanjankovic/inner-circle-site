
import javax.swing.*;
import java.awt.*;
import java.awt.datatransfer.StringSelection;
import java.io.File;

public class GuiParser extends JFrame {

    private JTextArea resultArea;

    public GuiParser() {
        setTitle("Dota 2 Replay Parser (Basic UI)");
        setSize(800, 600);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        JPanel topPanel = new JPanel();
        JButton selectButton = new JButton("Select .dem File");
        topPanel.add(selectButton);

        resultArea = new JTextArea();
        resultArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        resultArea.setEditable(false);
        JScrollPane scrollPane = new JScrollPane(resultArea);

        JPanel bottomPanel = new JPanel();
        JButton copyButton = new JButton("Copy to Clipboard");
        bottomPanel.add(copyButton);

        add(topPanel, BorderLayout.NORTH);
        add(scrollPane, BorderLayout.CENTER);
        add(bottomPanel, BorderLayout.SOUTH);

        selectButton.addActionListener(e -> {
            JFileChooser fileChooser = new JFileChooser();
            int option = fileChooser.showOpenDialog(this);
            if (option == JFileChooser.APPROVE_OPTION) {
                File file = fileChooser.getSelectedFile();
                parseFile(file.getAbsolutePath());
            }
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
        resultArea.setText("Parsing... Please wait...");

        new Thread(() -> {
            try {
                SimpleParser parser = new SimpleParser(path);
                parser.readHeader(path);
                String json = parser.run();

                SwingUtilities.invokeLater(() -> {
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
