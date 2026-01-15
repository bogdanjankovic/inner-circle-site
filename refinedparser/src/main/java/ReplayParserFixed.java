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
public class ReplayParserFixed {
    
    private final ControllableRunner runner;
    private OpenDotaDataModel matchData;
    
    // Game state tracking
    private long matchId = 0;
    private long timestamp = 0;
    private float duration = 0;
    private boolean radiantWin = false;
    
    // Player data tracking
    private Map<Integer, OpenDotaDataModel.Player> players = new HashMap<>();
    private Map<Integer, Integer> playerSlotToAccount = new HashMap<>();
    
    // Combat log events
    private List<CombatLogEntry> combatLog = new ArrayList<>();
    
    // Teamfight tracking
    private List<OpenDotaDataModel.Teamfight> teamfights = new ArrayList<>();
    private boolean inTeamfight = false;
    private int teamfightStartTime = 0;
    
    // Pick/ban tracking
    private List<OpenDotaDataModel.PickBan> picksBans = new ArrayList<>();
    
    public ReplayParserFixed(String replayFile) throws IOException {
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
                    this.timestamp = dota.getEndTime();
                    this.radiantWin = dota.getGameWinner() == 2;
                    if (info.hasPlaybackTime()) {
                        this.duration = info.getPlaybackTime();
                    }
                    
                    // Set match data
                    matchData.match_id = this.matchId;
                    matchData.start_time = this.timestamp;
                    matchData.radiant_win = this.radiantWin;
                    matchData.duration = (int) this.duration;
                }
            }
        } catch (Exception e) {
            System.err.println("Header Error: " + e.toString());
        }
    }
    
    @OnEntityCreated
    public void onEntityCreated(Entity e) {
        String className = e.getDtClass().getDtName();
        
        // Track match info
        if ("CDOTAGamerulesProxy".equals(className)) {
            extractMatchInfo(e);
        }
        
        // Track players
        if ("CDOTAPlayer".equals(className)) {
            extractPlayerInfo(e);
        }
        
        // Track heroes
        if ("CDOTAPlayerHero".equals(className)) {
            extractHeroInfo(e);
        }
    }
    
    @OnEntityUpdated
    public void onEntityUpdated(Entity e, FieldPath[] updatedPaths, int num) {
        String className = e.getDtClass().getDtName();
        
        // Track game state changes
        if ("CDOTAGamerulesProxy".equals(className)) {
            updateGameState(e, updatedPaths);
        }
        
        // Track player updates
        if ("CDOTAPlayer".equals(className)) {
            updatePlayerStats(e, updatedPaths);
        }
    }
    
    @OnCombatLogEntry
    public void onCombatLogEntry(CombatLogEntry entry) {
        combatLog.add(entry);
        processCombatLogEntry(entry);
    }
    
    private void extractMatchInfo(Entity e) {
        try {
            // Extract basic match information using OpenDota field names
            matchData.game_mode = getIntProperty(e, "m_pGameRules.m_iGameMode");
            matchData.lobby_type = getIntProperty(e, "m_pGameRules.m_iLobbyType");
            matchData.human_players = getIntProperty(e, "m_pGameRules.m_iHumanPlayerCount");
            matchData.leagueid = getIntProperty(e, "m_pGameRules.m_iLeagueID");
            
            // Extract draft information
            extractDraftInfo(e);
            
        } catch (Exception ex) {
            System.err.println("Error extracting match info: " + ex.getMessage());
        }
    }
    
    private void extractDraftInfo(Entity e) {
        try {
            // Extract picks and bans - simplified version
            // This would need to be implemented based on actual entity structure
            matchData.picks_bans = new ArrayList<>();
            
        } catch (Exception ex) {
            System.err.println("Error extracting draft info: " + ex.getMessage());
        }
    }
    
    private void extractPlayerInfo(Entity e) {
        try {
            int playerSlot = getIntProperty(e, "m_nPlayerID");
            int accountId = getIntProperty(e, "m_iPlayerSteamID");
            
            OpenDotaDataModel.Player player = new OpenDotaDataModel.Player();
            player.account_id = accountId;
            player.player_slot = playerSlot;
            
            players.put(playerSlot, player);
            playerSlotToAccount.put(playerSlot, accountId);
            
        } catch (Exception ex) {
            System.err.println("Error extracting player info: " + ex.getMessage());
        }
    }
    
    private void extractHeroInfo(Entity e) {
        try {
            int playerSlot = getIntProperty(e, "m_nPlayerID");
            int heroId = getIntProperty(e, "m_iSelectedHeroID");
            
            OpenDotaDataModel.Player player = players.get(playerSlot);
            if (player != null) {
                player.hero_id = heroId;
                player.ability_upgrades = new ArrayList<>();
                player.permanent_buffs = new ArrayList<>();
                player.buyback_log = new ArrayList<>();
            }
            
        } catch (Exception ex) {
            System.err.println("Error extracting hero info: " + ex.getMessage());
        }
    }
    
    private void updateGameState(Entity e, FieldPath[] updatedPaths) {
        try {
            for (FieldPath path : updatedPaths) {
                String fieldName = e.getDtClass().getNameForFieldPath(path);
                
                switch (fieldName) {
                    case "m_pGameRules.m_fGameTime":
                        duration = getFloatProperty(e, path);
                        matchData.duration = (int) duration;
                        break;
                    case "m_pGameRules.m_iGameWinner":
                        int winner = getIntProperty(e, path);
                        radiantWin = winner == 2; // 2 = Radiant, 3 = Dire
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
                }
            }
        } catch (Exception ex) {
            // Ignore field access errors
        }
    }
    
    private void updatePlayerStats(Entity e, FieldPath[] updatedPaths) {
        int playerSlot = getIntProperty(e, "m_nPlayerID");
        OpenDotaDataModel.Player player = players.get(playerSlot);
        if (player == null) return;
        
        try {
            for (FieldPath path : updatedPaths) {
                String fieldName = e.getDtClass().getNameForFieldPath(path);
                
                switch (fieldName) {
                    case "m_iKills":
                        player.kills = getIntProperty(e, path);
                        break;
                    case "m_iDeaths":
                        player.deaths = getIntProperty(e, path);
                        break;
                    case "m_iAssists":
                        player.assists = getIntProperty(e, path);
                        break;
                    case "m_iLastHits":
                        player.last_hits = getIntProperty(e, path);
                        break;
                    case "m_iDenies":
                        player.denies = getIntProperty(e, path);
                        break;
                    case "m_iLevel":
                        player.level = getIntProperty(e, path);
                        break;
                    case "m_iNetWorth":
                        player.net_worth = getIntProperty(e, path);
                        break;
                    case "m_iTotalGold":
                        player.gold = getIntProperty(e, path);
                        break;
                    case "m_iTotalEarnedGold":
                        player.total_gold = getIntProperty(e, path);
                        break;
                    case "m_iTotalEarnedXP":
                        player.total_xp = getIntProperty(e, path);
                        break;
                    case "m_iGoldSpent":
                        player.gold_spent = getIntProperty(e, path);
                        break;
                    case "m_iHeroDamage":
                        player.hero_damage = getIntProperty(e, path);
                        break;
                    case "m_iTowerDamage":
                        player.tower_damage = getIntProperty(e, path);
                        break;
                    case "m_iHealing":
                        player.hero_healing = getIntProperty(e, path);
                        break;
                    case "m_iDamageTaken":
                        player.damage_taken = getIntProperty(e, path);
                        break;
                }
            }
        } catch (Exception ex) {
            // Ignore field access errors
        }
    }
    
    private void processCombatLogEntry(CombatLogEntry entry) {
        // Process combat log entries to extract additional data
        // This would include ability usage, item usage, etc.
        
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
        
        // Convert players map to list
        matchData.players = new ArrayList<>(players.values());
        
        // Set additional match data
        matchData.version = 22; // Default version
        matchData.cluster = 184; // Default cluster
        matchData.engine = 1; // Source engine
        matchData.human_players = players.size();
        
        // Create OD data structure
        matchData.od_data = new OpenDotaDataModel.OdData();
        matchData.od_data.has_api = false;
        matchData.od_data.has_gcdata = true;
        matchData.od_data.has_parsed = true;
        matchData.od_data.has_archive = false;
        
        return matchData;
    }
    
    public void close() {
        if (runner != null) {
            runner.halt();
        }
    }
    
    // Helper methods for property access
    private Integer getIntProperty(Entity e, String property) {
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
