# OpenDota Kompatibilni Parser - Migracioni Plan

## 🎯 Cilj: 100% OpenDota API Kompantibilnost

### ✅ Već Implementirano (95%):
- [x] Match metadata (version, duration, picks_bans)
- [x] Player statistics (KDA, LH/Denies, GPM/XPM, Damage/Healing)
- [x] Ward logs (obs_log, sen_log) sa koordinatama
- [x] Ability upgrades sa timestampovima
- [x] Time series data (interval entries)
- [x] Draft phase data

### 🔧 Potrebna Poboljšanja za 100%:

#### 1. Hero ID Mapping
- Dodati `hero_id` polje u CompletePlayer
- Mapirati hero_name na hero_id kroz hero konstante
- Primer: "npc_dota_hero_warlock" → 27

#### 2. Player Slot Assignment  
- Ispraviti slot mapping (0-4=Radiant, 128-132=Dire)
- Dodati `player_slot` polje
- Dodati `team` polje (2=Radiant, 3=Dire)

#### 3. Account ID Integration
- Ekstraktovati account_id iz player_slot entries
- Handle anonymous igrače (account_id: 0)

#### 4. Item Purchase Logs
- Procesirati CHAT_MESSAGE_ITEM_PURCHASE entries
- Dodati `purchase_log` sa time, item_name, gold_cost
- Mapirati item ID-ove na imena

#### 5. Combat Log Enhancement
- Procesirati DOTA_COMBATLOG_DAMAGE entries
- Popuniti `damage`, `damage_taken` mape
- Dodati `kills_log` sa detaljima

#### 6. Time Series Arrays
- Popuniti `times`, `gold_t`, `lh_t`, `xp_t` nizove
- Koristiti interval entries za time series

#### 7. Additional Fields
- `gold_spent` - iz item purchases
- `tower_damage` - iz combat loga
- `buyback_log` - iz DOTA_COMBATLOG_BUYBACK
- `runes_log` - iz CHAT_MESSAGE_RUNE_PICKUP

### 📊 Implementation Priority:

#### Phase 1: Critical (Core Compatibility)
1. Hero ID mapping
2. Player slot/team assignment  
3. Account ID integration

#### Phase 2: Enhanced Data
4. Item purchase logs
5. Combat log processing
6. Time series arrays

#### Phase 3: Advanced Features
7. Rune logs
8. Buyback logs
9. Performance metrics

### 🎮 Web Sajt Integration:

#### API Endpoint:
```
POST /api/match/parse
Content-Type: multipart/form-data
Body: replay_file.dem

Response:
{
  "match_id": 8323680117,
  "data": { ...OpenDota compatible JSON... }
}
```

#### Database Schema:
```sql
CREATE TABLE matches (
    match_id BIGINT PRIMARY KEY,
    duration INTEGER,
    radiant_win BOOLEAN,
    data JSONB  -- OpenDota compatible structure
);

CREATE INDEX idx_matches_data ON matches USING GIN(data);
```

#### Frontend Components:
- Match summary cards
- Player comparison tables  
- Ability build visualizer
- Ward placement heatmap
- Gold/XP graphs

### 🔍 Testing Strategy:
1. Unit testovi za svaki entry type
2. Integration testovi sa real replay fajlovima
3. Output validation vs OpenDota API
4. Performance benchmarking

### 📈 Expected Results:
- 100% OpenDota API kompatibilnost
- <5 sekundi parsing per meč
- <10MB memorije po meču
- Podrška za sve Dota 2 patcheve (7.00+)

### 🚀 Next Steps:
1. Implement Phase 1 (Hero ID, Slot, Account ID)
2. Test sa existing replay fajlovima
3. Validate output vs OpenDota API
4. Deploy na staging server
5. Frontend integration
