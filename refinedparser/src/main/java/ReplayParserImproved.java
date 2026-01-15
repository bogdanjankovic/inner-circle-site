import skadistats.clarity.Clarity;
import skadistats.clarity.io.Util;
import skadistats.clarity.model.Entity;
import skadistats.clarity.model.FieldPath;
import skadistats.clarity.processor.entities.Entities;
import skadistats.clarity.processor.entities.OnEntityCreated;
import skadistats.clarity.processor.entities.OnEntityUpdated;
import skadistats.clarity.processor.entities.UsesEntities;
import skadistats.clarity.processor.gameevents.OnGameEvent;
import skadistats.clarity.processor.runner.ControllableRunner;
import skadistats.clarity.source.MappedFileSource;
import skadistats.clarity.wire.shared.demo.proto.Demo;

import java.io.*;
import java.util.*;
import skadistats.clarity.model.CombatLogEntry;
import skadistats.clarity.processor.gameevents.OnCombatLogEntry;

@UsesEntities
public class ReplayParserImproved {
    
    private final ControllableRunner runner;
    private OpenDotaDataModel matchData;
    
    // Game state tracking
    private long matchId = 0;
    private float duration = 0;
    private boolean radiantWin = false;
    
    // Player data tracking
    private Map<Integer, OpenDotaDataModel.Player> players = new HashMap<>();
    private Map<Integer, Integer> playerSlotToAccount = new HashMap<>();
    
    // Combat log events
    private List<CombatLogEntry> combatLog = new ArrayList<>();
    
    // Pick/ban tracking
    private List<OpenDotaDataModel.PickBan> picksBans = new ArrayList<>();
    
    public ReplayParserImproved(String replayFile) throws IOException {
        this.matchData = new OpenDotaDataModel();
        this.runner = new ControllableRunner(new MappedFileSource(replayFile));
        runner.runWith(this);
        
        // Read header info first
        readHeader(replayFile);
    }
    
    private void readHeader(String fileName) {
        try {
            Demo.CDemoFileInfo info = Clarity.infoForFile(fileName);
            if (info != null) {
                Demo.CGameInfo.CDotaGameInfo dota = info.getGameInfo().getDota();
                if (dota != null) {
                    this.matchId = dota.getMatchId();
                    this.radiantWin = dota.getGameWinner() == 2;
                    if (info.hasPlaybackTime()) {
                        this.duration = info.getPlaybackTime();
                    }
                    
                    // Set match data
                    matchData.match_id = this.matchId;
                    matchData.start_time = dota.getEndTime();
                    matchData.radiant_win = this.radiantWin;
                    matchData.duration = (int) this.duration;
                    matchData.pre_game_duration = 0; // Default value
                    matchData.cluster = 184; // Default cluster
                    matchData.game_mode = dota.getGameMode();
                    matchData.lobby_type = 0; // Default value
                }
            }
        } catch (Exception e) {
            System.err.println("Header Error: " + e.toString());
        }
    }
    
    @OnEntityCreated
    public void onEntityCreated(Entity e) {
        String className = e.getDtClass().getDtName();
        
        // Track players
        if ("CDOTAPlayer".equals(className)) {
            extractPlayerInfo(e);
        }
        
        // Track heroes
        if ("CDOTAPlayerHero".equals(className)) {
            extractHeroInfo(e);
        }
        
        // Track player resource entity
        if ("CDOTA_PlayerResource".equals(className)) {
            extractPlayerResourceInfo(e);
        }
    }
    
    @OnEntityUpdated
    public void onEntityUpdated(Entity e, FieldPath[] updatedPaths, int num) {
        String className = e.getDtClass().getDtName();
        
        // Track game state changes
        if ("CDOTAGamerulesProxy".equals(className)) {
            updateGameState(e, updatedPaths);
        }
        
        // Track player resource updates
        if ("CDOTA_PlayerResource".equals(className)) {
            updatePlayerResourceStats(e, updatedPaths);
        }
    }
    
    @OnCombatLogEntry
    public void onCombatLogEntry(CombatLogEntry entry) {
        combatLog.add(entry);
        processCombatLogEntry(entry);
    }
    
    private void extractPlayerInfo(Entity e) {
        try {
            // Use the working logic from SimpleParser
            Entities entities = runner.getContext().getProcessor(Entities.class);
            Entity pr = entities.getByDtName("CDOTA_PlayerResource");
            if (pr == null) return;
            
            // Extract player data from player resource
            for (int i = 0; i < 24; i++) {
                Integer accountId = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iPlayerSteamID");
                if (accountId != null && accountId != 0) {
                    OpenDotaDataModel.Player player = new OpenDotaDataModel.Player();
                    player.account_id = accountId;
                    player.player_slot = i;
                    
                    // Extract basic stats
                    player.kills = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iKills");
                    player.deaths = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iDeaths");
                    player.assists = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iAssists");
                    player.last_hits = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iLastHitCount");
                    player.denies = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iDenyCount");
                    player.level = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iLevel");
                    player.gold = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iCurrentGold");
                    player.net_worth = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iTotalEarnedGold");
                    player.hero_damage = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iHeroDamage");
                    player.tower_damage = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iTowerDamage");
                    player.hero_healing = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iHealing");
                    player.gold_spent = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iTotalSpentGold");
                    player.total_xp = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iTotalEarnedXP");
                    
                    // Get hero ID
                    Integer heroHandle = getProperty(pr, "m_vecPlayerTeamData." + Util.arrayIdxToString(i) + ".m_hSelectedHero");
                    if (heroHandle != null && heroHandle != 2097151) {
                        Entity hero = entities.getByHandle(heroHandle);
                        if (hero != null) {
                            player.hero_id = getProperty(hero, "m_iSelectedHeroID");
                        }
                    }
                    
                    // Initialize arrays
                    player.ability_upgrades = new ArrayList<>();
                    player.permanent_buffs = new ArrayList<>();
                    player.buyback_log = new ArrayList<>();
                    
                    players.put(i, player);
                }
            }
            
        } catch (Exception ex) {
            System.err.println("Error extracting player info: " + ex.getMessage());
        }
    }
    
    private void extractHeroInfo(Entity e) {
        try {
            // This will be called for each hero entity
            // Additional hero-specific data can be extracted here
            
        } catch (Exception ex) {
            System.err.println("Error extracting hero info: " + ex.getMessage());
        }
    }
    
    private void extractPlayerResourceInfo(Entity e) {
        try {
            // Extract initial player resource data
            extractPlayerInfo(e);
            
        } catch (Exception ex) {
            System.err.println("Error extracting player resource info: " + ex.getMessage());
        }
    }
    
    private void updateGameState(Entity e, FieldPath[] updatedPaths) {
        try {
            for (FieldPath path : updatedPaths) {
                String fieldName = e.getDtClass().getNameForFieldPath(path);
                
                if (fieldName != null) {
                    switch (fieldName) {
                        case "m_pGameRules.m_fGameTime":
                            duration = getFloatProperty(e, path);
                            matchData.duration = (int) duration;
                            break;
                        case "m_pGameRules.m_iGameWinner":
                            int winner = getIntProperty(e, path);
                            radiantWin = winner == 2;
                            matchData.radiant_win = radiantWin;
                            break;
                        case "m_pGameRules.m_nRadiantScore":
                            matchData.radiant_score = getIntProperty(e, path);
                            break;
                        case "m_pGameRules.m_nDireScore":
                            matchData.dire_score = getIntProperty(e, path);
                            break;
                        case "m_pGameRules.m_nFirstBloodTime":
                            matchData.first_blood_time = getIntProperty(e, path);
                            break;
                        case "m_pGameRules.m_iHumanPlayerCount":
                            matchData.human_players = getIntProperty(e, path);
                            break;
                    }
                }
            }
        } catch (Exception ex) {
            // Ignore field access errors
        }
    }
    
    private void updatePlayerResourceStats(Entity e, FieldPath[] updatedPaths) {
        try {
            for (FieldPath path : updatedPaths) {
                String fieldName = e.getDtClass().getNameForFieldPath(path);
                
                if (fieldName != null && fieldName.startsWith("m_vecPlayerData.")) {
                    // Extract player index from field name - simplified approach
                    // This is a basic implementation, would need refinement for production
                    try {
                        // For now, we'll extract final data at the end instead of real-time updates
                    } catch (Exception ex) {
                        // Ignore parsing errors
                    }
                }
            }
        } catch (Exception ex) {
            // Ignore field access errors
        }
    }
    
    private void updatePlayerField(OpenDotaDataModel.Player player, String fieldName, Entity e, FieldPath path) {
        try {
            if (fieldName.contains("m_iKills")) {
                player.kills = getIntProperty(e, path);
            } else if (fieldName.contains("m_iDeaths")) {
                player.deaths = getIntProperty(e, path);
            } else if (fieldName.contains("m_iAssists")) {
                player.assists = getIntProperty(e, path);
            } else if (fieldName.contains("m_iLastHitCount")) {
                player.last_hits = getIntProperty(e, path);
            } else if (fieldName.contains("m_iDenyCount")) {
                player.denies = getIntProperty(e, path);
            } else if (fieldName.contains("m_iLevel")) {
                player.level = getIntProperty(e, path);
            } else if (fieldName.contains("m_iCurrentGold")) {
                player.gold = getIntProperty(e, path);
            } else if (fieldName.contains("m_iTotalEarnedGold")) {
                player.net_worth = getIntProperty(e, path);
            } else if (fieldName.contains("m_iHeroDamage")) {
                player.hero_damage = getIntProperty(e, path);
            } else if (fieldName.contains("m_iTowerDamage")) {
                player.tower_damage = getIntProperty(e, path);
            } else if (fieldName.contains("m_iHealing")) {
                player.hero_healing = getIntProperty(e, path);
            } else if (fieldName.contains("m_iTotalSpentGold")) {
                player.gold_spent = getIntProperty(e, path);
            } else if (fieldName.contains("m_iTotalEarnedXP")) {
                player.total_xp = getIntProperty(e, path);
            }
        } catch (Exception ex) {
            // Ignore field access errors
        }
    }
    
    private void processCombatLogEntry(CombatLogEntry entry) {
        // Process combat log entries to extract additional data
        try {
            switch (entry.getType().name()) {
                case "DOTA_COMBATLOG_DAMAGE":
                    // Process damage events
                    break;
                case "DOTA_COMBATLOG_HEAL":
                    // Process healing events
                    break;
                case "DOTA_COMBATLOG_ABILITY_USE":
                    // Process ability usage
                    break;
                case "DOTA_COMBATLOG_ITEM_USE":
                    // Process item usage
                    break;
                case "DOTA_COMBATLOG_DEATH":
                    // Process death events
                    break;
            }
        } catch (Exception ex) {
            // Ignore combat log errors
        }
    }
    
    public OpenDotaDataModel parse() throws Exception {
        int lastTick = runner.getLastTick();
        
        try {
            while (runner.getTick() < lastTick) {
                runner.tick();
                
                int t = runner.getTick();
                if (t % 5000 == 0) {
                    System.out.println("Processing Tick " + t + " / " + lastTick + " (" + (t * 100 / (lastTick > 0 ? lastTick : 1)) + "%)");
                }
            }
        } catch (Exception e) {
            System.err.println("Error in parsing loop: " + e.toString());
        }
        
        // Final data extraction at the end
        extractFinalData();
        
        // Convert players map to list
        matchData.players = new ArrayList<>(players.values());
        
        // Set additional match data
        matchData.version = 22;
        matchData.engine = 1;
        matchData.human_players = players.size();
        
        // Calculate GPM and XPM
        for (OpenDotaDataModel.Player player : matchData.players) {
            if (duration > 0) {
                player.gold_per_min = (int) ((player.net_worth * 60) / duration);
                player.xp_per_min = (int) ((player.total_xp * 60) / duration);
            }
        }
        
        // Create OD data structure
        matchData.od_data = new OpenDotaDataModel.OdData();
        matchData.od_data.has_api = false;
        matchData.od_data.has_gcdata = true;
        matchData.od_data.has_parsed = true;
        matchData.od_data.has_archive = false;
        
        return matchData;
    }
    
    private void extractFinalData() {
        try {
            Entities entities = runner.getContext().getProcessor(Entities.class);
            Entity pr = entities.getByDtName("CDOTA_PlayerResource");
            if (pr == null) return;
            
            // Extract final player stats
            for (int i = 0; i < 24; i++) {
                OpenDotaDataModel.Player player = players.get(i);
                if (player != null) {
                    // Update final stats
                    player.kills = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iKills");
                    player.deaths = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iDeaths");
                    player.assists = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iAssists");
                    player.last_hits = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iLastHitCount");
                    player.denies = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iDenyCount");
                    player.level = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iLevel");
                    player.gold = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iCurrentGold");
                    player.net_worth = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iTotalEarnedGold");
                    player.hero_damage = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iHeroDamage");
                    player.tower_damage = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iTowerDamage");
                    player.hero_healing = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iHealing");
                    player.gold_spent = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iTotalSpentGold");
                    player.total_xp = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iTotalEarnedXP");
                }
            }
            
        } catch (Exception e) {
            System.err.println("Error extracting final data: " + e.toString());
        }
    }
    
    public void close() {
        if (runner != null) {
            runner.halt();
        }
    }
    
    // Helper methods for property access
    private Integer getProperty(Entity e, String property) {
        try {
            return e.getProperty(property);
        } catch (Exception ex) {
            return null;
        }
    }
    
    private Integer getIntProperty(Entity e, FieldPath path) {
        try {
            return e.getPropertyForFieldPath(path);
        } catch (Exception ex) {
            return null;
        }
    }
    
    private Float getFloatProperty(Entity e, FieldPath path) {
        try {
            return e.getPropertyForFieldPath(path);
        } catch (Exception ex) {
            return null;
        }
    }
}
