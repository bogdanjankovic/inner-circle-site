# OpenDota Variable Mapping for Replay Parser

## Overview
This document shows how our replay parser uses the **exact same variable names and data structure** as OpenDota's API. This ensures perfect compatibility and makes it easy to compare local parsing results with OpenDota's data.

## Root Level Variables

### Match Information
```java
// Our parser uses these exact OpenDota field names:
public int version;                    // Game version
public long match_id;                   // Unique match identifier  
public int leagueid;                    // League ID (0 = public match)
public long start_time;                 // Unix timestamp
public int duration;                    // Match duration in seconds
public int series_id;                   // Series ID
public int series_type;                 // Series type
public int cluster;                     // Server cluster
public int replay_salt;                // Replay salt
public boolean radiant_win;             // True if Radiant won
public int pre_game_duration;           // Pregame setup time
public long match_seq_num;              // Match sequence number
public int first_blood_time;            // First blood time in seconds
public int lobby_type;                  // Lobby type (0 = public, 1 = practice, etc.)
public int human_players;               // Number of human players
public int game_mode;                   // Game mode (1 = all pick, 2 = captains mode, etc.)
public int flags;                       // Match flags
public int engine;                      // Engine version
public int patch;                       // Game patch
public int region;                      // Server region
```

### Score and Status
```java
public int radiant_score;               // Radiant team kills
public int dire_score;                  // Dire team kills
public int tower_status_radiant;        // Binary tower status for Radiant
public int tower_status_dire;           // Binary tower status for Dire
public int barracks_status_radiant;     // Binary barracks status for Radiant
public int barracks_status_dire;        // Binary barracks status for Dire
```

### Team Information
```java
public Integer radiant_team_id;          // Radiant team ID
public String radiant_name;             // Radiant team name
public Long radiant_logo;               // Radiant team logo
public int radiant_team_complete;       // Radiant team complete flag
public Integer radiant_captain;          // Radiant captain account ID

public Integer dire_team_id;            // Dire team ID
public String dire_name;                // Dire team name
public Long dire_logo;                  // Dire team logo
public int dire_team_complete;          // Dire team complete flag
public Integer dire_captain;             // Dire captain account ID
```

## Player Data Structure

### Core Player Statistics
```java
public static class Player {
    public int account_id;               // Player Steam ID
    public int player_slot;              // Player slot (0-4 Radiant, 128-132 Dire)
    public int hero_id;                  // Hero ID
    
    // Basic KDA
    public int kills;                    // Number of kills
    public int deaths;                   // Number of deaths
    public int assists;                  // Number of assists
    
    // Farming
    public int last_hits;                // Number of last hits
    public int denies;                   // Number of denies
    public int gold_per_min;             // Gold per minute
    public int xp_per_min;               // Experience per minute
    public int level;                    // Hero level
    
    // Economy
    public int net_worth;                // Total net worth
    public int total_gold;               // Total gold earned
    public int total_xp;                 // Total experience earned
    public int gold_spent;               // Gold spent
    public int gold;                     // Current gold
    
    // Combat
    public int hero_damage;              // Hero damage dealt
    public int tower_damage;             // Tower damage dealt
    public int hero_healing;             // Hero healing done
    public int damage_taken;             // Damage received
    public int damage_inflictor_received; // Damage from inflicters
    
    // Utility
    public int observer_uses;            // Observer wards used
    public int sentry_uses;              // Sentry wards used
    public int camps_stacked;            // Neutral camps stacked
    public int runes_pickups;            // Runes picked up
    public int teamfight_participation;  // Teamfight participation percentage
    public int towers_killed;             // Towers killed
    public int roshan_kills;             // Roshan kills
    public int couriers_killed;          // Couriers killed
    public int stuns;                    // Stun duration
    
    // Performance
    public int actions_per_min;          // Actions per minute
    public int pings;                    // Number of pings
    public double longest_lobby_time;    // Longest lobby time
    
    // Lane information
    public int lane;                     // Lane assignment
    public int lane_role;                // Lane role (1-4)
    public int lane_efficiency_pct;      // Lane efficiency percentage
    
    // Party information
    public int party_id;                 // Party ID
    public int party_size;               // Party size
}
```

### Advanced Player Arrays
```java
public List<AbilityUpgrade> ability_upgrades;     // Ability upgrade timeline
public List<PermanentBuff> permanent_buffs;       // Permanent buffs (talents, runes)
public List<BuybackLog> buyback_log;             // Buyback events
public List<Item> item_0;                         // Inventory slot 0
public List<Item> item_1;                         // Inventory slot 1
// ... item_2 through item_5
public List<Item> backpack_0;                     // Backpack slot 0
// ... backpack_1 through backpack_2
public List<Item> item_neutral;                   // Neutral item slot
public Benchmarks benchmarks;                     // Performance benchmarks
```

## Nested Data Structures

### Teamfights
```java
public static class Teamfight {
    public int start;                    // Start time
    public int end;                      // End time
    public int last_death;               // Last death time
    public int deaths;                   // Total deaths
    public List<TeamfightPlayer> players; // Player performance data
}

public static class TeamfightPlayer {
    public Map<String, Integer> deaths_pos;      // Death positions
    public Map<String, Integer> ability_uses;     // Abilities used
    public Map<String, Integer> ability_targets;  // Ability targets
    public Map<String, Integer> item_uses;        // Items used
    public Map<String, Integer> killed;           // Heroes killed
    public int deaths;                             // Number of deaths
    public int buybacks;                           // Number of buybacks
    public int damage;                             // Damage dealt
    public int healing;                            // Healing done
    public int gold_delta;                         // Gold change
    public int xp_delta;                           // Experience change
    public int xp_start;                           // Starting XP
    public int xp_end;                             // Ending XP
}
```

### Ability Upgrades
```java
public static class AbilityUpgrade {
    public int ability;                 // Ability ID
    public int time;                    // Upgrade time
    public int level;                   // Ability level
}
```

### Permanent Buffs
```java
public static class PermanentBuff {
    public int permanent_buff;          // Buff ID
    public int stack_count;             // Stack count
    public int grantor_pindex;          // Grantor player index
    public String grantor_player_slot;  // Grantor player slot
}
```

### Buyback Log
```java
public static class BuybackLog {
    public int time;                    // Buyback time
    public int slot;                    // Player slot
    public int gold;                    // Gold at time of buyback
    public int net_worth;              // Net worth at time of buyback
}
```

### Benchmarks
```java
public static class Benchmarks {
    public Benchmark gold_per_min;      // GPM benchmark
    public Benchmark xp_per_min;        // XPM benchmark
    public Benchmark kills_per_min;     // KPM benchmark
    public Benchmark last_hits_per_min; // LHPM benchmark
    public Benchmark hero_damage_per_min; // DPM benchmark
    public Benchmark hero_healing_per_min; // HPM benchmark
    public Benchmark tower_damage;      // Tower damage benchmark
}

public static class Benchmark {
    public int raw;                     // Raw value
    public double pct;                  // Percentile rank
}
```

## Data Extraction Process

### 1. Header Information
```java
// Extracted from demo file header
Demo.CDemoFileInfo info = Clarity.infoForFile(fileName);
matchData.match_id = dota.getMatchId();
matchData.start_time = dota.getEndTime();
matchData.radiant_win = dota.getGameWinner() == 2;
matchData.duration = (int) info.getPlaybackTime();
```

### 2. Entity Processing
```java
@OnEntityCreated
public void onEntityCreated(Entity e) {
    String className = e.getDtClass().getDtName();
    
    if ("CDOTAGamerulesProxy".equals(className)) {
        // Extract game mode, lobby type, etc.
        matchData.game_mode = getIntProperty(e, "m_pGameRules.m_iGameMode");
        matchData.lobby_type = getIntProperty(e, "m_pGameRules.m_iLobbyType");
    }
    
    if ("CDOTAPlayer".equals(className)) {
        // Extract player information
        player.account_id = getIntProperty(e, "m_iPlayerSteamID");
        player.player_slot = getIntProperty(e, "m_nPlayerID");
    }
}
```

### 3. Real-time Updates
```java
@OnEntityUpdated
public void onEntityUpdated(Entity e, FieldPath[] updatedPaths) {
    for (FieldPath path : updatedPaths) {
        String fieldName = e.getDtClass().getNameForFieldPath(path);
        
        switch (fieldName) {
            case "m_pGameRules.m_fGameTime":
                matchData.duration = getFloatProperty(e, path);
                break;
            case "m_pGameRules.m_iGameWinner":
                matchData.radiant_win = getIntProperty(e, path) == 2;
                break;
        }
    }
}
```

## Benefits of Using OpenDota Structure

### 1. **Perfect Compatibility**
- Same JSON structure as OpenDota API
- Easy to compare local vs online data
- Drop-in replacement for OpenDota data

### 2. **Comprehensive Coverage**
- All standard Dota 2 statistics included
- Advanced metrics and benchmarks
- Timeline events and teamfights

### 3. **Future-Proof**
- Follows established industry standard
- Easy to add new fields as OpenDota updates
- Compatible with existing tools and dashboards

### 4. **Private Lobby Support**
- Works with any replay file
- No dependency on public API availability
- Perfect for tournament and private match analysis

## Usage Example

```java
// Parse replay file
ReplayParserFixed parser = new ReplayParserFixed("match.dem");
OpenDotaDataModel matchData = parser.parse();

// Convert to JSON (same format as OpenDota)
Gson gson = new GsonBuilder().setPrettyPrinting().create();
String json = gson.toJson(matchData);

// Save to file
Files.write(Paths.get("match_data.json"), json.getBytes());
```

The resulting JSON file will have the **exact same structure** as data from OpenDota's `/matches/{match_id}` endpoint, making it perfect for comparison and analysis.
