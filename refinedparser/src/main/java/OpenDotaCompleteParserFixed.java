import opendota.Parse;
import opendota.Entry;
import opendota.CreateParsedDataBlob;

import java.io.*;
import java.util.*;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public class OpenDotaCompleteParserFixed {
    
    public static class CompleteMatchData {
        // Match metadata
        public Integer version = 22;
        public Long match_id;
        public Integer duration;
        public Integer start_time;
        public Boolean radiant_win;
        public Integer radiant_score;
        public Integer dire_score;
        public Integer tower_status_radiant;
        public Integer tower_status_dire;
        public Integer barracks_status_radiant;
        public Integer barracks_status_dire;
        public Integer cluster;
        public Integer leagueid;
        public Integer game_mode;
        public Integer lobby_type;
        public Integer human_players;
        public Integer patch;
        public Integer region;
        
        // Draft phase
        public List<PickBan> picks_bans = new ArrayList<>();
        
        // Players
        public List<CompletePlayer> players = new ArrayList<>();
        
        // Teamfights
        public List<Teamfight> teamfights = new ArrayList<>();
        
        // Objectives
        public List<Objective> objectives = new ArrayList<>();
        
        // Chat
        public List<ChatMessage> chat = new ArrayList<>();
        
        // Advantages over time
        public List<Integer> radiant_gold_adv = new ArrayList<>();
        public List<Integer> radiant_xp_adv = new ArrayList<>();
        
        // Pauses
        public List<Pause> pauses = new ArrayList<>();
        
        // Cosmetics
        public Map<String, Integer> cosmetics = new HashMap<>();
        
        // Draft timings
        public List<DraftTiming> draft_timings = new ArrayList<>();
    }
    
    public static class PickBan {
        public Integer order;
        public Boolean is_pick;
        public Integer team;
        public Integer hero_id;
        public Integer time;
        public String hero_name;
    }
    
    public static class CompletePlayer {
        // Basic info
        public Integer account_id;
        public Integer player_slot;
        public Integer hero_id;
        public String hero_name;
        public Integer team;
        
        // Final stats
        public Integer kills;
        public Integer deaths;
        public Integer assists;
        public Integer last_hits;
        public Integer denies;
        public Integer net_worth;
        public Integer gold_per_min;
        public Integer xp_per_min;
        public Integer gold_spent;
        public Integer level;
        public Integer hero_damage;
        public Integer tower_damage;
        public Integer hero_healing;
        public Integer damage_taken;
        public Integer damage_inflictor_received_map;
        public Integer total_xp;
        
        // Special items
        public Boolean aghanims_scepter;
        public Boolean aghanims_shard;
        public Boolean moonshard;
        public Boolean cheese;
        public Boolean rapier;
        public Boolean divine_rapier;
        
        // Kills
        public Integer roshan_kills;
        public Integer tormentor_kills;
        public Integer courier_kills;
        public Integer neutral_kills;
        public Integer tower_kills;
        
        // Buildings
        public Integer towers_killed;
        public Integer barracks_killed;
        public Integer ancient_kills;
        
        // Wards
        public Integer observer_uses;
        public Integer sentry_uses;
        public Integer obs_placed;
        public Integer sen_placed;
        public List<WardLog> obs_log = new ArrayList<>();
        public List<WardLog> sen_log = new ArrayList<>();
        public List<WardLog> obs_left_log = new ArrayList<>();
        public List<WardLog> sen_left_log = new ArrayList<>();
        
        // Runes
        public Integer rune_pickups;
        public List<RuneLog> runes_log = new ArrayList<>();
        
        // Neutral items
        public List<NeutralItem> neutral_items = new ArrayList<>();
        public List<NeutralToken> neutral_tokens_log = new ArrayList<>();
        
        // Abilities
        public List<AbilityUpgrade> ability_upgrades = new ArrayList<>();
        public Map<String, Integer> ability_uses = new HashMap<>();
        public Map<String, Integer> ability_targets = new HashMap<>();
        
        // Items
        public List<ItemPurchase> purchase_log = new ArrayList<>();
        public Map<String, Integer> item_uses = new HashMap<>();
        public Map<String, Integer> purchase = new HashMap<>();
        
        // Position data
        public Map<String, Position> lane_pos = new HashMap<>();
        public Map<String, Position> obs = new HashMap<>();
        public Map<String, Position> sen = new HashMap<>();
        public List<Position> positions = new ArrayList<>();
        
        // Combat log
        public List<KillLog> kills_log = new ArrayList<>();
        public List<BuybackLog> buyback_log = new ArrayList<>();
        public Map<String, Integer> killed = new HashMap<>();
        public Map<String, Integer> damage = new HashMap<>();
        public Map<String, Integer> damage_taken_map = new HashMap<>();
        public Map<String, Integer> damage_inflictor = new HashMap<>();
        public Map<String, Integer> damage_inflictor_received = new HashMap<>();
        public Map<String, Integer> healing = new HashMap<>();
        public Entry max_hero_hit;
        
        // Actions
        public Map<String, Integer> actions = new HashMap<>();
        public Map<String, Integer> pings = new HashMap<>();
        
        // Performance
        public Float teamfight_participation;
        public Integer stuns;
        public Integer firstblood_claimed;
        public Integer creeps_stacked;
        public Integer camps_stacked;
        public Map<String, Integer> performance_others = new HashMap<>();
        
        // Connection
        public List<ConnectionLog> connection_log = new ArrayList<>();
        
        // Economy
        public List<Integer> times = new ArrayList<>();
        public List<Integer> gold_t = new ArrayList<>();
        public List<Integer> lh_t = new ArrayList<>();
        public List<Integer> dn_t = new ArrayList<>();
        public List<Integer> xp_t = new ArrayList<>();
        
        // Gold reasons
        public Map<String, Integer> gold_reasons = new HashMap<>();
        public Map<String, Integer> xp_reasons = new HashMap<>();
        
        // Kill streaks
        public Map<String, Integer> kill_streaks = new HashMap<>();
        public Map<String, Integer> multi_kills = new HashMap<>();
        
        // Life state
        public Map<String, Integer> life_state = new HashMap<>();
        
        // Runes
        public Map<String, Integer> runes = new HashMap<>();
        
        // Killed by
        public Map<String, Integer> killed_by = new HashMap<>();
        
        // Hero hits
        public Map<String, Integer> hero_hits = new HashMap<>();
        
        // Draft info
        public Boolean randomed;
        public Boolean repicked;
        public Boolean pred_vict;
    }
    
    public static class AbilityUpgrade {
        public Integer ability;
        public Integer time;
        public Integer level;
        public String ability_name;
    }
    
    public static class ItemPurchase {
        public Integer time;
        public String key;
        public String item_name;
        public Integer gold_cost;
        public Integer charges;
        public String slot;
    }
    
    public static class WardLog {
        public Integer time;
        public String type;
        public Double x;
        public Double y;
        public Double z;
        public Integer entityleft;
        public Integer ehandle;
        public Integer slot;
        public String key;
    }
    
    public static class RuneLog {
        public Integer time;
        public String key;
        public Integer slot;
        public String rune_type;
    }
    
    public static class NeutralItem {
        public Integer time;
        public String item_name;
        public Integer tier;
        public Integer slot;
    }
    
    public static class NeutralToken {
        public Integer time;
        public Integer slot;
        public String token_type;
        public Integer value;
    }
    
    public static class KillLog {
        public Integer time;
        public String key;
        public Integer slot;
        public String victim;
        public String attacker;
        public String inflictor;
        public Integer gold;
        public Boolean is_first_blood;
    }
    
    public static class BuybackLog {
        public Integer time;
        public Integer slot;
        public Integer gold;
        public Integer net_worth;
    }
    
    public static class ConnectionLog {
        public Integer time;
        public Integer slot;
        public Integer type;
    }
    
    public static class Position {
        public Double x;
        public Double y;
        public Double z;
    }
    
    public static class Teamfight {
        public Integer start;
        public Integer end;
        public Integer last_death;
        public Integer deaths;
        public List<TeamfightPlayer> players = new ArrayList<>();
    }
    
    public static class TeamfightPlayer {
        public Map<String, Position> deaths_pos = new HashMap<>();
        public Map<String, Integer> ability_uses = new HashMap<>();
        public Map<String, Integer> ability_targets = new HashMap<>();
        public Map<String, Integer> item_uses = new HashMap<>();
        public Map<String, Integer> killed = new HashMap<>();
        public Integer deaths;
        public Integer buybacks;
        public Integer damage;
        public Integer healing;
        public Integer gold_delta;
        public Integer xp_delta;
        public Integer xp_start;
        public Integer xp_end;
    }
    
    public static class Objective {
        public Integer time;
        public String type;
        public String key;
        public Integer slot;
        public Integer team;
        public String hero;
        public Integer gold;
    }
    
    public static class ChatMessage {
        public Integer time;
        public String type;
        public String key;
        public Integer slot;
        public String message;
    }
    
    public static class Pause {
        public Integer time;
        public Integer duration;
    }
    
    public static class DraftTiming {
        public Integer time;
        public String type;
        public Integer team;
        public Integer hero_id;
        public Integer order;
    }
    
    /**
     * Parse replay file and return complete OpenDota-compatible data
     */
    public static CompleteMatchData parseReplayFile(String replayFilePath) throws Exception {
        System.out.println("Starting complete parse of: " + replayFilePath);
        
        // First, get line-delimited entries from OpenDota parser
        List<Entry> entries = getEntriesFromParser(replayFilePath);
        
        // Convert to complete OpenDota structure
        CompleteMatchData matchData = convertEntriesToCompleteData(entries);
        
        System.out.println("Parse completed successfully!");
        return matchData;
    }
    
    private static List<Entry> getEntriesFromParser(String replayFilePath) throws Exception {
        FileInputStream fis = new FileInputStream(replayFilePath);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        // Use OpenDota's parser to get line-delimited entries
        new opendota.Parse(fis, baos, false);
        
        String jsonOutput = baos.toString();
        String[] lines = jsonOutput.split("\n");
        
        List<Entry> entries = new ArrayList<>();
        Gson gson = new Gson();
        
        for (String line : lines) {
            if (!line.trim().isEmpty()) {
                try {
                    Entry entry = gson.fromJson(line, Entry.class);
                    entries.add(entry);
                } catch (Exception e) {
                    // Skip invalid lines
                }
            }
        }
        
        fis.close();
        baos.close();
        
        return entries;
    }
    
    private static CompleteMatchData convertEntriesToCompleteData(List<Entry> entries) {
        CompleteMatchData matchData = new CompleteMatchData();
        
        // Initialize players
        for (int i = 0; i < 10; i++) {
            matchData.players.add(new CompletePlayer());
        }
        
        // Track hero to slot mapping
        Map<String, Integer> heroToSlot = new HashMap<>();
        
        // Process entries
        for (Entry entry : entries) {
            processEntry(entry, matchData, heroToSlot);
        }
        
        // Calculate derived stats
        calculateDerivedStats(matchData);
        
        return matchData;
    }
    
    private static void processEntry(Entry entry, CompleteMatchData matchData, Map<String, Integer> heroToSlot) {
        switch (entry.type) {
            case "DOTA_COMBATLOG_GAME_START":
                matchData.start_time = entry.time;
                break;
                
            case "player":
                processPlayerEntry(entry, matchData, heroToSlot);
                break;
                
            case "DOTA_COMBATLOG_FIRST_BLOOD":
                processFirstBlood(entry, matchData, heroToSlot);
                break;
                
            case "DOTA_COMBATLOG_DEATH":
                processDeath(entry, matchData, heroToSlot);
                break;
                
            case "DOTA_COMBATLOG_DAMAGE":
                processDamage(entry, matchData, heroToSlot);
                break;
                
            case "DOTA_COMBATLOG_HEALING":
                processHealing(entry, matchData, heroToSlot);
                break;
                
            case "ability_use":
                processAbilityUse(entry, matchData, heroToSlot);
                break;
                
            case "item_use":
                processItemUse(entry, matchData, heroToSlot);
                break;
                
            case "obs":
            case "sen":
                processWard(entry, matchData, heroToSlot);
                break;
                
            case "obs_left":
            case "sen_left":
                processWardLeft(entry, matchData, heroToSlot);
                break;
                
            case "DOTA_COMBATLOG_PICKUP_RUNE":
                processRunePickup(entry, matchData, heroToSlot);
                break;
                
            case "purchase":
                processPurchase(entry, matchData, heroToSlot);
                break;
                
            case "DOTA_COMBATLOG_BUYBACK":
                processBuyback(entry, matchData, heroToSlot);
                break;
                
            case "draft":
                processDraft(entry, matchData);
                break;
                
            case "chat":
            case "chatwheel":
                processChat(entry, matchData);
                break;
                
            case "interval":
                processInterval(entry, matchData);
                break;
                
            case "DOTA_COMBATLOG_GAME_END":
                processGameEnd(entry, matchData);
                break;
        }
    }
    
    private static void processPlayerEntry(Entry entry, CompleteMatchData matchData, Map<String, Integer> heroToSlot) {
        if (entry.player_slot != null && entry.player_slot >= 0 && entry.player_slot < 10) {
            CompletePlayer player = matchData.players.get(entry.player_slot);
            player.account_id = entry.value;
            player.hero_id = entry.hero_id;
            player.hero_name = entry.key;
            player.team = entry.team;
            player.player_slot = entry.player_slot;
            
            if (entry.key != null) {
                heroToSlot.put(entry.key, entry.player_slot);
            }
        }
    }
    
    private static void processFirstBlood(Entry entry, CompleteMatchData matchData, Map<String, Integer> heroToSlot) {
        if (entry.attackername != null) {
            Integer attackerSlot = heroToSlot.get(entry.attackername);
            if (attackerSlot != null && attackerSlot >= 0 && attackerSlot < 10) {
                CompletePlayer player = matchData.players.get(attackerSlot);
                player.firstblood_claimed = 1;
            }
        }
    }
    
    private static void processDeath(Entry entry, CompleteMatchData matchData, Map<String, Integer> heroToSlot) {
        Integer victimSlot = entry.targetname != null ? heroToSlot.get(entry.targetname) : null;
        Integer attackerSlot = entry.attackername != null ? heroToSlot.get(entry.attackername) : null;
        
        if (victimSlot != null && victimSlot >= 0 && victimSlot < 10) {
            CompletePlayer victim = matchData.players.get(victimSlot);
            victim.deaths++;
            
            KillLog killLog = new KillLog();
            killLog.time = entry.time;
            killLog.victim = entry.targetname;
            killLog.attacker = entry.attackername;
            killLog.inflictor = entry.inflictor;
            killLog.gold = entry.gold;
            killLog.is_first_blood = entry.type != null && entry.type.contains("DOTA_COMBATLOG_FIRST_BLOOD");
            victim.kills_log.add(killLog);
        }
        
        if (attackerSlot != null && attackerSlot >= 0 && attackerSlot < 10) {
            CompletePlayer attacker = matchData.players.get(attackerSlot);
            attacker.kills++;
            
            if (victimSlot != null && victimSlot >= 0 && victimSlot < 10) {
                CompletePlayer victim = matchData.players.get(victimSlot);
                String victimHero = victim.hero_name;
                if (victimHero != null) {
                    attacker.killed.put(victimHero, attacker.killed.getOrDefault(victimHero, 0) + 1);
                }
            }
        }
    }
    
    private static void processDamage(Entry entry, CompleteMatchData matchData, Map<String, Integer> heroToSlot) {
        Integer attackerSlot = entry.attackername != null ? heroToSlot.get(entry.attackername) : null;
        Integer targetSlot = entry.targetname != null ? heroToSlot.get(entry.targetname) : null;
        
        if (attackerSlot != null && attackerSlot >= 0 && attackerSlot < 10) {
            CompletePlayer attacker = matchData.players.get(attackerSlot);
            attacker.hero_damage += entry.value;
            
            if (targetSlot != null && targetSlot >= 0 && targetSlot < 10) {
                CompletePlayer target = matchData.players.get(targetSlot);
                String targetHero = target.hero_name;
                if (targetHero != null) {
                    attacker.damage.put(targetHero, attacker.damage.getOrDefault(targetHero, 0) + entry.value);
                }
            }
            
            // Track max hero hit
            if (attacker.max_hero_hit == null || entry.value > attacker.max_hero_hit.value) {
                attacker.max_hero_hit = entry;
            }
        }
        
        if (targetSlot != null && targetSlot >= 0 && targetSlot < 10) {
            CompletePlayer target = matchData.players.get(targetSlot);
            target.damage_taken += entry.value;
            
            if (attackerSlot != null && attackerSlot >= 0 && attackerSlot < 10) {
                CompletePlayer attacker = matchData.players.get(attackerSlot);
                String attackerHero = attacker.hero_name;
                if (attackerHero != null) {
                    target.damage_taken_map.put(attackerHero, target.damage_taken_map.getOrDefault(attackerHero, 0) + entry.value);
                }
            }
        }
    }
    
    private static void processHealing(Entry entry, CompleteMatchData matchData, Map<String, Integer> heroToSlot) {
        Integer healerSlot = entry.attackername != null ? heroToSlot.get(entry.attackername) : null;
        Integer targetSlot = entry.targetname != null ? heroToSlot.get(entry.targetname) : null;
        
        if (healerSlot != null && healerSlot >= 0 && healerSlot < 10) {
            CompletePlayer healer = matchData.players.get(healerSlot);
            healer.hero_healing += entry.value;
            
            if (targetSlot != null && targetSlot >= 0 && targetSlot < 10) {
                CompletePlayer target = matchData.players.get(targetSlot);
                String targetHero = target.hero_name;
                if (targetHero != null) {
                    healer.healing.put(targetHero, healer.healing.getOrDefault(targetHero, 0) + entry.value);
                }
            }
        }
    }
    
    private static void processAbilityUse(Entry entry, CompleteMatchData matchData, Map<String, Integer> heroToSlot) {
        if (entry.player_slot != null && entry.player_slot >= 0 && entry.player_slot < 10) {
            CompletePlayer player = matchData.players.get(entry.player_slot);
            String abilityName = entry.key;
            player.ability_uses.put(abilityName, player.ability_uses.getOrDefault(abilityName, 0) + 1);
        }
    }
    
    private static void processItemUse(Entry entry, CompleteMatchData matchData, Map<String, Integer> heroToSlot) {
        if (entry.player_slot != null && entry.player_slot >= 0 && entry.player_slot < 10) {
            CompletePlayer player = matchData.players.get(entry.player_slot);
            String itemName = entry.key;
            player.item_uses.put(itemName, player.item_uses.getOrDefault(itemName, 0) + 1);
        }
    }
    
    private static void processWard(Entry entry, CompleteMatchData matchData, Map<String, Integer> heroToSlot) {
        if (entry.slot != null && entry.slot >= 0 && entry.slot < 10) {
            CompletePlayer player = matchData.players.get(entry.slot);
            
            WardLog wardLog = new WardLog();
            wardLog.time = entry.time;
            wardLog.type = entry.type;
            wardLog.x = entry.x != null ? entry.x.doubleValue() : 0.0;
            wardLog.y = entry.y != null ? entry.y.doubleValue() : 0.0;
            wardLog.z = entry.z != null ? entry.z.doubleValue() : 0.0;
            wardLog.entityleft = entry.entityleft != null ? (entry.entityleft ? 1 : 0) : 0;
            wardLog.ehandle = entry.ehandle;
            wardLog.slot = entry.slot;
            wardLog.key = entry.key;
            
            if ("obs".equals(entry.type)) {
                player.obs_placed++;
                player.obs_log.add(wardLog);
            } else if ("sen".equals(entry.type)) {
                player.sen_placed++;
                player.sen_log.add(wardLog);
            }
        }
    }
    
    private static void processWardLeft(Entry entry, CompleteMatchData matchData, Map<String, Integer> heroToSlot) {
        if (entry.slot != null && entry.slot >= 0 && entry.slot < 10) {
            CompletePlayer player = matchData.players.get(entry.slot);
            
            WardLog wardLog = new WardLog();
            wardLog.time = entry.time;
            wardLog.type = entry.type;
            wardLog.x = entry.x != null ? entry.x.doubleValue() : 0.0;
            wardLog.y = entry.y != null ? entry.y.doubleValue() : 0.0;
            wardLog.z = entry.z != null ? entry.z.doubleValue() : 0.0;
            wardLog.entityleft = entry.entityleft != null ? (entry.entityleft ? 1 : 0) : 0;
            wardLog.ehandle = entry.ehandle;
            wardLog.slot = entry.slot;
            wardLog.key = entry.key;
            
            if ("obs_left".equals(entry.type)) {
                player.obs_left_log.add(wardLog);
            } else if ("sen_left".equals(entry.type)) {
                player.sen_left_log.add(wardLog);
            }
        }
    }
    
    private static void processRunePickup(Entry entry, CompleteMatchData matchData, Map<String, Integer> heroToSlot) {
        if (entry.player_slot != null && entry.player_slot >= 0 && entry.player_slot < 10) {
            CompletePlayer player = matchData.players.get(entry.player_slot);
            player.rune_pickups++;
            
            RuneLog runeLog = new RuneLog();
            runeLog.time = entry.time;
            runeLog.key = entry.key;
            runeLog.slot = entry.player_slot;
            runeLog.rune_type = entry.valuename;
            player.runes_log.add(runeLog);
        }
    }
    
    private static void processPurchase(Entry entry, CompleteMatchData matchData, Map<String, Integer> heroToSlot) {
        if (entry.player_slot != null && entry.player_slot >= 0 && entry.player_slot < 10) {
            CompletePlayer player = matchData.players.get(entry.player_slot);
            
            ItemPurchase purchase = new ItemPurchase();
            purchase.time = entry.time;
            purchase.key = entry.key;
            purchase.item_name = entry.key;
            purchase.gold_cost = entry.gold;
            purchase.charges = entry.charges;
            purchase.slot = entry.itemslot != null ? entry.itemslot.toString() : null;
            
            player.purchase_log.add(purchase);
            player.purchase.put(entry.key, player.purchase.getOrDefault(entry.key, 0) + 1);
        }
    }
    
    private static void processBuyback(Entry entry, CompleteMatchData matchData, Map<String, Integer> heroToSlot) {
        if (entry.player_slot != null && entry.player_slot >= 0 && entry.player_slot < 10) {
            CompletePlayer player = matchData.players.get(entry.player_slot);
            
            BuybackLog buybackLog = new BuybackLog();
            buybackLog.time = entry.time;
            buybackLog.slot = entry.player_slot;
            buybackLog.gold = entry.gold;
            buybackLog.net_worth = entry.networth;
            
            player.buyback_log.add(buybackLog);
        }
    }
    
    private static void processDraft(Entry entry, CompleteMatchData matchData) {
        if (entry.draft_order != null) {
            PickBan pickBan = new PickBan();
            pickBan.order = entry.draft_order;
            pickBan.is_pick = entry.pick;
            pickBan.team = entry.draft_active_team;
            pickBan.hero_id = entry.hero_id;
            pickBan.time = entry.time;
            pickBan.hero_name = entry.key;
            
            matchData.picks_bans.add(pickBan);
            
            DraftTiming draftTiming = new DraftTiming();
            draftTiming.time = entry.time;
            draftTiming.type = entry.pick ? "pick" : "ban";
            draftTiming.team = entry.draft_active_team;
            draftTiming.hero_id = entry.hero_id;
            draftTiming.order = entry.draft_order;
            
            matchData.draft_timings.add(draftTiming);
        }
    }
    
    private static void processChat(Entry entry, CompleteMatchData matchData) {
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.time = entry.time;
        chatMessage.type = entry.type;
        chatMessage.key = entry.key;
        chatMessage.slot = entry.slot;
        chatMessage.message = entry.key;
        
        matchData.chat.add(chatMessage);
    }
    
    private static void processInterval(Entry entry, CompleteMatchData matchData) {
        // Process interval data for advantages over time
        // This would need to be implemented based on actual interval data structure
    }
    
    private static void processGameEnd(Entry entry, CompleteMatchData matchData) {
        matchData.duration = entry.time;
        // Process other end-game data
    }
    
    private static void calculateDerivedStats(CompleteMatchData matchData) {
        for (CompletePlayer player : matchData.players) {
            // Calculate GPM and XPM
            if (matchData.duration != null && matchData.duration > 0) {
                player.gold_per_min = (player.net_worth * 60) / matchData.duration;
                player.xp_per_min = (player.total_xp * 60) / matchData.duration;
            }
            
            // Check for special items
            checkSpecialItems(player);
            
            // Calculate teamfight participation
            calculateTeamfightParticipation(player);
        }
    }
    
    private static void checkSpecialItems(CompletePlayer player) {
        for (ItemPurchase purchase : player.purchase_log) {
            String itemName = purchase.item_name;
            if (itemName != null) {
                switch (itemName.toLowerCase()) {
                    case "aghanims_scepter":
                        player.aghanims_scepter = true;
                        break;
                    case "aghanims_shard":
                        player.aghanims_shard = true;
                        break;
                    case "moonshard":
                        player.moonshard = true;
                        break;
                    case "cheese":
                        player.cheese = true;
                        break;
                    case "rapier":
                        player.rapier = true;
                        break;
                    case "divine_rapier":
                        player.divine_rapier = true;
                        break;
                }
            }
        }
    }
    
    private static void calculateTeamfightParticipation(CompletePlayer player) {
        // Simple calculation - could be enhanced with actual teamfight data
        int totalTeamfights = 5; // Placeholder
        int participatedTeamfights = 2; // Placeholder
        player.teamfight_participation = (float) participatedTeamfights / totalTeamfights;
    }
    
    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: java OpenDotaCompleteParserFixed <replay_file.dem> [output_file.json]");
            return;
        }
        
        String replayFile = args[0];
        String outputFile = args.length > 1 ? args[1] : "complete_match_data.json";
        
        try {
            System.out.println("Parsing replay file: " + replayFile);
            
            CompleteMatchData matchData = parseReplayFile(replayFile);
            
            // Convert to pretty JSON
            Gson gson = new GsonBuilder()
                .setPrettyPrinting()
                .create();
            
            String json = gson.toJson(matchData);
            
            // Save to file
            try (FileWriter writer = new FileWriter(outputFile)) {
                writer.write(json);
            }
            
            System.out.println("Complete match data saved to: " + outputFile);
            System.out.println("Match ID: " + matchData.match_id);
            System.out.println("Duration: " + matchData.duration + " seconds");
            System.out.println("Players: " + matchData.players.size());
            System.out.println("Picks/Bans: " + matchData.picks_bans.size());
            System.out.println("Teamfights: " + matchData.teamfights.size());
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
