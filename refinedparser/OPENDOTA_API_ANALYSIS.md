# OpenDota API Data Structure Analysis

## Overview
This document analyzes the data structure returned by OpenDota's API for match ID 8643916411. This will serve as a reference for implementing our own replay parser.

## Key Data Categories

### 1. Basic Match Information
- `match_id`: Unique identifier (8643916411)
- `version`: Game version (22)
- `start_time`: Unix timestamp (1768068507)
- `duration`: Match duration in seconds (3699 = 61:39)
- `radiant_win`: Boolean indicating winner (true)
- `pre_game_duration`: Pregame setup time (90 seconds)
- `first_blood_time`: Time of first blood (143 seconds)

### 2. Teams
- `radiant_team_id`, `dire_team_id`: Team identifiers
- `radiant_name`, `dire_name`: Team names
- `radiant_score`, `dire_score`: Final kill scores (54-35)
- `tower_status_radiant/dire`: Binary tower status
- `barracks_status_radiant/dire`: Binary barracks status

### 3. Players Array (10 players)
Each player contains extensive statistics:

#### Core Stats
- `account_id`: Player Steam ID
- `hero_id`: Hero identifier
- `player_slot`: Position (0-4 for Radiant, 128-132 for Dire)
- `level`: Final hero level
- `kills`, `deaths`, `assists`: Basic KDA
- `last_hits`, `denies`: Farming stats
- `gold_per_min`, `xp_per_min`: Performance metrics
- `hero_damage`, `tower_damage`, `hero_healing`: Combat stats

#### Advanced Stats
- `net_worth`: Total gold value
- `total_gold`, `total_xp`: Accumulated resources
- `gold_spent`: Gold expenditure
- `hero_healing`: Healing done
- `damage_taken`: Damage received
- `camps_stacked`: Neutral camps stacked
- `rune_pickups`: Runes collected

#### Item Data
- `item_0` through `item_5`: Inventory slots
- `backpack_0` through `backpack_2`: Backpack items
- `item_neutral`: Neutral item slot

#### Ability Upgrades
- `abilities`: Array of ability upgrade objects
- Each contains `ability`, `time`, `level`

#### Permanent Buffs
- `permanent_buffs`: Array of persistent effects
- Includes talents, runes, etc.

#### Additional Actions
- `actions`: Actions per minute
- `pings`: Communication pings- `purchase`: Gold spent on items
- `buyback_log`: Buyback events
- `lane_role`: Assigned lane (1-4)
- `roshan_kills`: Roshan kills
- `obs_placed`, `sen_placed`: Ward placements
- `creep_stacks`: Camp stacking actions

### 4. Teamfights Array
Detailed breakdown of each teamfight:
- `start`, `end`: Timestamps
- `deaths`: Total deaths
- `players`: Individual player performance per fight
  - `damage`, `healing`: Damage/healing done
  - `gold_delta`, `xp_delta`: Resources gained
  - `ability_uses`: Abilities cast
  - `item_uses`: Items used
  - `killed`, `deaths`: Kill/death counts

### 5. Picks and Bans
- `picks_bans`: Array of draft phase actions
- Each contains `is_pick`, `hero_id`, `team`, `order`

### 6. Additional Data
- `word_counts`: Chat statistics
- `patch`: Game patch version (59)
- `region`: Server region (8)
- `replay_url`: Valve replay download URL
- `league`: Tournament information if applicable

## Key Insights for Our Parser

### Critical Data Points to Extract
1. **Timeline Events**: Ability uses, item purchases, deaths
2. **Position Data**: Player coordinates over time
3. **Combat Log**: Detailed damage/healing events
4. **Ward Data**: Observer/Sentry ward placements and destructions
5. **Economy**: Gold/XP gain rates, net worth tracking
6. **Teamfight Analysis**: Detailed combat breakdowns

### Missing from OpenDota API
- **Raw Position Data**: No coordinate tracking
- **Granular Combat Log**: Only aggregated stats
- **Detailed Item Usage**: No precise usage timestamps
- **Chat Logs**: Only word counts, not actual messages
- **Replay-specific Events**: Some game events not exposed

## Recommendations for Our Parser

1. **Prioritize Data Collection**:
   - Player positions at regular intervals
   - Combat log entries with timestamps
   - Ability usage with exact timing
   - Item purchase and usage events
   - Ward placement/destruction events

2. **Data Structure Design**:
   - Use similar JSON structure for compatibility
   - Add arrays for timeline-based events
   - Include raw coordinate data
   - Preserve combat log granularity

3. **Performance Considerations**:
   - OpenDota provides aggregated stats efficiently
   - Our parser should balance detail with performance
   - Consider configurable detail levels

## Next Steps
1. Compare this structure with current SimpleParser output
2. Identify gaps in our current implementation
3. Design enhanced data collection methods
4. Implement missing data extraction from replay files
