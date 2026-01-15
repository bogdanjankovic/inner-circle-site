# Dota 2 Replay File Parser

A GUI application for analyzing Dota 2 replay files and comparing data with OpenDota API.

## Features

- **File Browser**: Select .dem replay files from your local system
- **Replay Analysis**: Extract basic information from replay files
- **OpenDota Comparison**: Fetch and compare data from OpenDota API
- **Match ID Extraction**: Automatically extract match IDs from filenames
- **User-Friendly Interface**: Easy-to-use GUI with clear status updates

## How to Use

### 1. Launch the Application
```bash
java -jar target/refinedparser-1.0-SNAPSHOT.jar
```
Or simply double-click the jar file.

### 2. Select a Replay File
1. Click the "Browse..." button
2. Navigate to your Dota 2 replay files (usually found in):
   - `Documents\Dota 2\replays\`
   - `Steam\steamapps\common\dota 2 beta\game\dota\replays\`
3. Select a .dem file and click "Open"

### 3. Analyze the Replay
- Click "Parse Replay" to extract basic file information
- The app will show file details and extract potential match ID

### 4. Compare with OpenDota (Optional)
- Click "Compare with OpenDota API" to fetch online data
- The app will extract the match ID from the filename
- Confirm the match ID and fetch comprehensive match statistics
- Compare local replay capabilities with OpenDota's data

## Current Capabilities

### ✅ Implemented
- File selection and basic analysis
- Match ID extraction from filenames
- OpenDota API integration for comparison
- User-friendly GUI interface

### 🚧 Planned Features
- Full replay parsing using Clarity library
- Combat log extraction
- Player position tracking
- Ability usage analysis
- Item purchase timeline
- Ward placement tracking
- Export to JSON/CSV formats

## File Structure

```
refinedparser/
├── src/main/java/
│   ├── ReplayFileParserGUI.java    # Main GUI application
│   ├── RefinedParser.java          # OpenDota API client
│   └── RefinedParserGUI.java       # Original API-only GUI
├── pom.xml                         # Maven configuration
├── README.md                       # This file
└── target/
    └── refinedparser-1.0-SNAPSHOT.jar  # Executable application
```

## Dependencies

- **Clarity**: Dota 2 replay parsing library
- **Gson**: JSON parsing
- **OkHttp**: HTTP client for API calls
- **Swing**: GUI framework

## Next Steps for Development

1. **Integrate Clarity Parser**: Use the existing SimpleParser logic
2. **Extract Match Metadata**: Teams, players, duration, winner
3. **Parse Combat Events**: Damage, healing, deaths, abilities
4. **Track Positions**: Player coordinates over time
5. **Generate Statistics**: Comprehensive match analytics
6. **Data Export**: Save parsed data in various formats

## Troubleshooting

- **Jar file won't open**: Make sure you have Java 17 or higher installed
- **Can't find replay files**: Check your Dota 2 replay directory in Steam settings
- **API errors**: Ensure you have an internet connection for OpenDota comparison

## Match ID Format

Dota 2 replay files typically contain the match ID in the filename:
- Format: `match_id_random_numbers.dem`
- Example: `8643916411_569831212.dem`
- The app automatically extracts the long number as the match ID
