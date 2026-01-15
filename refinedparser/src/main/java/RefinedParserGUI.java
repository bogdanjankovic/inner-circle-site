import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.File;

public class RefinedParserGUI extends JFrame {
    private JTextField matchIdField;
    private JTextArea outputArea;
    private JButton fetchButton;
    private JButton clearButton;
    private JLabel statusLabel;
    
    public RefinedParserGUI() {
        setTitle("Dota 2 Refined Parser - OpenDota API");
        setSize(800, 600);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        
        initComponents();
        layoutComponents();
    }
    
    private void initComponents() {
        matchIdField = new JTextField("8643916411", 15);
        fetchButton = new JButton("Fetch Match Data");
        clearButton = new JButton("Clear Output");
        outputArea = new JTextArea();
        outputArea.setEditable(false);
        outputArea.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        statusLabel = new JLabel("Ready");
        
        fetchButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                fetchMatchData();
            }
        });
        
        clearButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                outputArea.setText("");
                statusLabel.setText("Output cleared");
            }
        });
    }
    
    private void layoutComponents() {
        JPanel topPanel = new JPanel(new FlowLayout());
        topPanel.add(new JLabel("Match ID:"));
        topPanel.add(matchIdField);
        topPanel.add(fetchButton);
        topPanel.add(clearButton);
        
        JScrollPane scrollPane = new JScrollPane(outputArea);
        scrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_ALWAYS);
        
        setLayout(new BorderLayout());
        add(topPanel, BorderLayout.NORTH);
        add(scrollPane, BorderLayout.CENTER);
        add(statusLabel, BorderLayout.SOUTH);
    }
    
    private void fetchMatchData() {
        String matchIdText = matchIdField.getText().trim();
        if (matchIdText.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please enter a match ID", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }
        
        long matchId;
        try {
            matchId = Long.parseLong(matchIdText);
        } catch (NumberFormatException e) {
            JOptionPane.showMessageDialog(this, "Invalid match ID format", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }
        
        // Run in background thread
        SwingWorker<String, Void> worker = new SwingWorker<String, Void>() {
            @Override
            protected String doInBackground() throws Exception {
                RefinedParser parser = new RefinedParser();
                return parser.fetchMatchData(matchId);
            }
            
            @Override
            protected void done() {
                try {
                    String result = get();
                    outputArea.setText(result);
                    statusLabel.setText("Successfully fetched match " + matchId);
                    
                    // Also save to file
                    String filename = "match_data_opendota_" + matchId + ".json";
                    try {
                        java.io.FileWriter writer = new java.io.FileWriter(filename);
                        writer.write(result);
                        writer.close();
                        statusLabel.setText("Data saved to " + filename);
                    } catch (Exception e) {
                        statusLabel.setText("Error saving file: " + e.getMessage());
                    }
                    
                } catch (Exception e) {
                    JOptionPane.showMessageDialog(RefinedParserGUI.this, 
                        "Error fetching data: " + e.getMessage(), 
                        "Error", 
                        JOptionPane.ERROR_MESSAGE);
                    statusLabel.setText("Error: " + e.getMessage());
                }
            }
        };
        
        worker.execute();
        statusLabel.setText("Fetching data...");
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
                new RefinedParserGUI().setVisible(true);
            }
        });
    }
}
