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
public class SimpleParser {

    private final ControllableRunner runner;
    private long matchId = 0;
    private long timestamp = 0;
    private float duration = 0; // seconds
    private String winner = "Unknown";

    // Data Holders
    private Map<Integer, Integer> playerFacets = new HashMap<>(); // PlayerID -> Facet Index
    private List<Map<String, Object>> combatLogEvents = new ArrayList<>();

    // Debug: Track unique classes
    private Set<String> seenClasses = new HashSet<>();

    // ... removed duplicate method ...

    private List<Map<String, Object>> wardLog = new ArrayList<>();
    // Ability Build: PlayerID -> List of Ability Names
    private Map<Integer, List<String>> abilityUpgrades = new HashMap<>();
    // Position Storage: PlayerID -> List of "{t, x, y}"
    private Map<Integer, List<String>> playerPositions = new HashMap<>();

    // Damage Stats Maps: key = hero name (e.g. "npc_dota_hero_axe")
    private Map<String, Integer> heroDamageMap = new HashMap<>();
    private Map<String, Integer> towerDamageMap = new HashMap<>();
    private Map<String, Integer> heroHealingMap = new HashMap<>();

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            System.err.println("Usage: java -jar dota-parser.jar <demofile>");
            System.exit(1);
        }

        SimpleParser parser = new SimpleParser(args[0]);
        // Try header first for metadata
        parser.readHeader(args[0]);
        System.out.println(parser.run());
        System.exit(0);
    }

    private StringBuilder debugLog = new StringBuilder();

    public SimpleParser(String fileName) throws IOException {
        runner = new ControllableRunner(new MappedFileSource(fileName));
        runner.runWith(this);
    }

    // Callback for UI updates
    private java.util.function.Consumer<String> statusCallback;

    public void setStatusCallback(java.util.function.Consumer<String> cb) {
        this.statusCallback = cb;
    }

    private void log(String msg) {
        debugLog.append(msg).append("\n");
        System.err.println(msg);
        if (statusCallback != null) {
            statusCallback.accept(msg);
        }
    }

    public void readHeader(String fileName) {
        try {
            Demo.CDemoFileInfo info = Clarity.infoForFile(fileName);
            if (info != null) {
                Demo.CGameInfo.CDotaGameInfo dota = info.getGameInfo().getDota();
                if (dota != null) {
                    this.matchId = dota.getMatchId();
                    this.timestamp = dota.getEndTime();
                    this.winner = dota.getGameWinner() == 2 ? "Radiant" : "Dire";
                    if (info.hasPlaybackTime()) {
                        this.duration = info.getPlaybackTime();
                    }
                }
            }
        } catch (Exception e) {
            log("Header Error: " + e.toString());
        }
    }

    // State for ability polling: PlayerID -> Map<AbilityName, Level>
    private Map<Integer, Map<String, Integer>> playerAbilityLevels = new HashMap<>();
    private int updateCount = 0;

    // Store Picks/Bans found during run
    private List<String> cachedPicksBans = new ArrayList<>();
    private boolean bansFound = false;

    public String run() {
        int lastTick = runner.getLastTick();
        log("DEBUG: Parser Start. Reference LastTick=" + lastTick);

        int ticksPerMinute = 30 * 60;
        int nextSampleTick = 0;
        int nextAbilityCheck = 0;

        try {
            while (runner.getTick() < lastTick) {
                runner.tick();

                int t = runner.getTick();
                if (t % 5000 == 0) {
                    log("Processing Tick " + t + " / " + lastTick + " (" + (t * 100 / (lastTick > 0 ? lastTick : 1))
                            + "%)");
                }

                // Poll Ability Upgrades (Fallback)
                if (t >= nextAbilityCheck) {
                    checkAbilityUpgrades();
                    nextAbilityCheck += 10;
                }

                if (t >= nextSampleTick) {
                    samplePositions(t);
                    nextSampleTick += ticksPerMinute;
                }
            }
        } catch (Exception e) {
            log("DEBUG: CRASH in run loop! " + e.toString());
            // Stack trace to string
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            e.printStackTrace(pw);
            log(sw.toString());
        }

        return extractStats();
    }

    // --- Ability Build Order (Polling with Validation) ---

    // Map<HeroName, Set<ValidAbilityName>>
    private Map<String, Set<String>> validHeroAbilities = new HashMap<>();

    private void checkAbilityUpgrades() {
        // Load validation data ONCE if empty
        if (validHeroAbilities.isEmpty()) {
            loadHeroAbilities();
        }

        Entities entities = runner.getContext().getProcessor(Entities.class);
        Entity pr = entities.getByDtName("CDOTA_PlayerResource");
        if (pr == null)
            return;

        for (int i = 0; i < 24; i++) {
            Integer heroHandle = getProperty(pr,
                    "m_vecPlayerTeamData." + Util.arrayIdxToString(i) + ".m_hSelectedHero");
            if (heroHandle == null)
                continue;

            Entity hero = entities.getByHandle(heroHandle);
            if (hero == null)
                continue;

            // Hero Entity Name (e.g. CDOTA_Unit_Hero_Abaddon -> npc_dota_hero_abaddon)
            String heroDtName = hero.getDtClass().getDtName();
            String heroName = heroDtName.replace("CDOTA_Unit_Hero_", "").replace("CDOTA_Unit_", "").toLowerCase();
            String fullHeroName = "npc_dota_hero_" + heroName;

            // Iterate all abilities
            for (int slot = 0; slot < 32; slot++) {
                Integer abHandle = getProperty(hero, "m_vecAbilities." + Util.arrayIdxToString(slot));
                if (abHandle != null && abHandle != 2097151) {
                    Entity ab = entities.getByHandle(abHandle);
                    if (ab != null) {
                        String abName = ab.getDtClass().getDtName().replace("CDOTA_Ability_", "");
                        int currentValues = getIntPropertyDirect(ab, "m_iLevel", 0);

                        Map<String, Integer> playerLevels = playerAbilityLevels.computeIfAbsent(i,
                                k -> new HashMap<>());

                        if (!playerLevels.containsKey(abName)) {
                            playerLevels.put(abName, currentValues);
                        } else {
                            int oldLevel = playerLevels.get(abName);
                            if (currentValues > oldLevel) {
                                // LEVEL UP DETECTED
                                boolean isValid = true;
                                String normAb = abName.replace("_", "").toLowerCase();

                                // 1. Global Blacklist
                                if (normAb.equals("spectrereality") ||
                                        normAb.startsWith("seasonal") ||
                                        normAb.startsWith("plus") ||
                                        normAb.contains("empty") ||
                                        normAb.equals("unknown")) {
                                    isValid = false;
                                }

                                // 2. Hero-Specific Validation
                                if (isValid && !validHeroAbilities.isEmpty()) {
                                    Set<String> validSet = validHeroAbilities.get(fullHeroName);
                                    if (validSet != null) {
                                        boolean found = false;
                                        for (String v : validSet) {
                                            if (v.replace("_", "").toLowerCase().equals(normAb)) {
                                                found = true;
                                                break;
                                            }
                                        }
                                        if (!found)
                                            isValid = false;
                                    }
                                }

                                // 3. Allow Talents always
                                if (abName.startsWith("special_bonus"))
                                    isValid = true;

                                if (isValid) {
                                    for (int k = oldLevel; k < currentValues; k++) {
                                        abilityUpgrades.computeIfAbsent(i, l -> new ArrayList<>())
                                                .add("\"" + abName + "\"");
                                    }
                                }
                                playerLevels.put(abName, currentValues);
                            }
                        }
                    }
                }
            }
        }
    }

    private void loadHeroAbilities() {
        File cacheFile = new File("hero_abilities.json");
        if (cacheFile.exists()) {
            try {
                log("Loading hero_abilities from local cache...");
                try (java.io.FileReader reader = new java.io.FileReader(cacheFile)) {
                    parseAbilities(reader);
                    return;
                }
            } catch (Exception e) {
                log("Error reading cache: " + e + ". Fallback to network.");
            }
        }

        try {
            log("Downloading hero_abilities from OpenDota (one-time setup)...");
            java.net.URL url = new java.net.URL(
                    "https://raw.githubusercontent.com/odota/dotaconstants/master/build/hero_abilities.json");
            java.net.HttpURLConnection con = (java.net.HttpURLConnection) url.openConnection();
            con.setRequestMethod("GET");
            con.setConnectTimeout(5000);
            con.setReadTimeout(5000);

            if (con.getResponseCode() == 200) {
                // Save to file first
                try (InputStream in = con.getInputStream();
                        FileOutputStream out = new FileOutputStream(cacheFile)) {
                    byte[] buffer = new byte[4096];
                    int bytesRead;
                    while ((bytesRead = in.read(buffer)) != -1) {
                        out.write(buffer, 0, bytesRead);
                    }
                }
                log("Saved hero_abilities.json to local folder.");

                // Read back
                try (java.io.FileReader reader = new java.io.FileReader(cacheFile)) {
                    parseAbilities(reader);
                }
            } else {
                log("Failed to download hero_abilities: HTTP " + con.getResponseCode());
            }
        } catch (Exception e) {
            log("Error loading hero_abilities: " + e.toString());
        }
    }

    private void parseAbilities(java.io.Reader reader) {
        com.google.gson.Gson gson = new com.google.gson.Gson();
        // Structure: Map<HeroName, HeroObject> where HeroObject has "abilities" list
        java.lang.reflect.Type type = new com.google.gson.reflect.TypeToken<Map<String, Map<String, Object>>>() {
        }.getType();

        try {
            Map<String, Map<String, Object>> data = gson.fromJson(reader, type);

            for (Map.Entry<String, Map<String, Object>> e : data.entrySet()) {
                String heroKey = e.getKey();
                Map<String, Object> heroData = e.getValue();

                if (heroData.containsKey("abilities")) {
                    Object abListObj = heroData.get("abilities");
                    if (abListObj instanceof List) {
                        List<?> abList = (List<?>) abListObj;
                        Set<String> abilities = new HashSet<>();
                        for (Object abilityName : abList) {
                            if (abilityName instanceof String) {
                                abilities.add((String) abilityName);
                            }
                        }
                        validHeroAbilities.put(heroKey, abilities);
                    }
                }
            }
            log("Loaded abilities for " + validHeroAbilities.size() + " heroes.");
        } catch (Exception e) {
            log("Data parsing error: " + e.toString());
        }
    }

    private void samplePositions(int tick) {
        Entities entities = runner.getContext().getProcessor(Entities.class);
        Entity pr = entities.getByDtName("CDOTA_PlayerResource");
        if (pr == null)
            return;

        float time = getGameTime();
        if (time < 0)
            return;

        for (int i = 0; i < 24; i++) {
            // Check if team is valid (Radiant=2, Dire=3)
            Integer team = getProperty(pr, "m_vecPlayerData." + Util.arrayIdxToString(i) + ".m_iPlayerTeam");
            if (team == null || (team != 2 && team != 3))
                continue;

            Integer heroHandle = getProperty(pr,
                    "m_vecPlayerTeamData." + Util.arrayIdxToString(i) + ".m_hSelectedHero");
            if (heroHandle != null) {
                Entity hero = entities.getByHandle(heroHandle);
                if (hero != null) {
                    Integer x = getProperty(hero, "CBodyComponent.m_cellX");
                    Integer y = getProperty(hero, "CBodyComponent.m_cellY");
                    if (x != null && y != null) {
                        if (x != null && y != null) {
                            // Adjustment: Cell coordinates are typically 64-192. We map to 0-128.
                            // Actually, cell coordinates usually centered around 128?
                            // Let's assume standard cell range and normalize if needed.
                            // User reported offset.
                            // Try 64 offset? Or just output raw and fix in frontend?
                            // Better to output consistent 0-127 range if possible.
                            // Standard Dota map cell origin is often (cellX - 64, cellY - 64).
                            // Let's try raw first but ensure we log it.
                            // Actually, let's switch to m_vecOrigin if available for smoother heatmaps?
                            // Sticking to cellX/Y for minimap grid consistency.
                            // Offsetting by -64 might actally place it correctly if the map thinks 0,0 is
                            // center.
                            // Let's try to normalize to 0-128 range assuming map is 128x128.
                            // The values typically seen are around ~70-180.
                            // Let's subtract 64.
                            int normX = x - 64;
                            int normY = y - 64;
                            // Clamp
                            if (normX < 0)
                                normX = 0;
                            if (normX > 127)
                                normX = 127;
                            if (normY < 0)
                                normY = 0;
                            if (normY > 127)
                                normY = 127;

                            playerPositions.computeIfAbsent(i, k -> new ArrayList<>())
                                    .add("[" + (int) time + "," + normX + "," + normY + "]");
                        }
                    }
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // Event Processors
    // -------------------------------------------------------------------------

    // --- Ward Tracking ---
    @OnEntityCreated
    public void onEntityCreated(Entity e) {
        String name = e.getDtClass().getDtName();

        // Debug: Log GameRules entities
        if (seenClasses.add(name)) {
            if (name.toLowerCase().contains("gamerules") || name.toLowerCase().contains("proxy")) {
                log("DISCOVERED Entity: " + name);
            }
        }

        if (name.equals("CDOTA_NPC_Observer_Ward") || name.equals("CDOTA_NPC_Sentry_Ward")) {
            Map<String, Object> ward = new HashMap<>();
            ward.put("type", name.contains("Observer") ? "Observer" : "Sentry");
            ward.put("x", getIntPropertyDirect(e, "CBodyComponent.m_cellX", 0) - 64);
            ward.put("y", getIntPropertyDirect(e, "CBodyComponent.m_cellY", 0) - 64);
            ward.put("owner", getProperty(e, "m_hOwnerEntity"));
            ward.put("time", getGameTime());
            wardLog.add(ward);
        }
    }

    // --- Facet Tracking ---
    @OnEntityUpdated
    public void onEntityUpdated(Entity e, FieldPath[] updatedPaths, int num) {
        updateCount++;
        String dtName = e.getDtClass().getDtName();

        if (dtName.equals("CDOTA_PlayerResource")) {
            for (int i = 0; i < 24; i++) {
                String path = "m_vecPlayerTeamData." + Util.arrayIdxToString(i) + ".m_nSelectedHeroFacet";
                Object val = getProperty(e, path);
                int facet = 0;
                if (val instanceof Number) {
                    facet = ((Number) val).intValue();
                }

                if (facet != 0) {
                    playerFacets.put(i, facet);
                }
            }
        }
    }

    @OnGameEvent("dota_player_learned_ability")
    public void onLearn(skadistats.clarity.model.GameEvent event) {
        log("DEBUG: OnLearn event fired: " + event.toString());
        try {
            Integer pid = null;
            String[] keys = { "player", "PlayerID", "player_id" };
            for (String key : keys) {
                try {
                    pid = event.getProperty(key);
                    if (pid != null)
                        break;
                } catch (Exception ignore) {
                }
            }

            String ability = null;
            try {
                ability = event.getProperty("abilityname");
            } catch (Exception ignore) {
            }

            if (pid != null && ability != null) {
                abilityUpgrades.computeIfAbsent(pid, k -> new ArrayList<>()).add("\"" + ability + "\"");
            } else {
                log("DEBUG: OnLearn missing keys. Event: " + event.toString());
            }
        } catch (Exception e) {
            log("Error onLearn: " + e);
        }
    }

    @OnGameEvent("dota_buyback")
    public void onBuyback(skadistats.clarity.model.GameEvent event) {
        Map<String, Object> log = new HashMap<>();
        log.put("type", "buyback");
        log.put("playerId", event.getProperty("entindex"));
        log.put("time", getGameTime());
        combatLogEvents.add(log);
    }

    @OnCombatLogEntry
    public void onCombatLogEntry(CombatLogEntry cle) {
        try {
            int type = cle.getType().ordinal();
            // DOTA_COMBATLOG_DAMAGE = 4
            if (type == 4) {
                String attacker = cle.getAttackerName();
                String target = cle.getTargetName();
                int val = cle.getValue();

                if (attacker != null && attacker.startsWith("npc_dota_hero")) {
                    if (target != null && target.startsWith("npc_dota_hero")) {
                        heroDamageMap.merge(attacker, val, Integer::sum);
                    } else if (target != null && (target.contains("tower") || target.contains("barracks")
                            || target.contains("fort") || target.contains("healer"))) {
                        towerDamageMap.merge(attacker, val, Integer::sum);
                    }
                }
            }
            // DOTA_COMBATLOG_HEAL = 5
            if (type == 5) {
                String attacker = cle.getAttackerName();
                int val = cle.getValue();
                if (attacker != null && attacker.startsWith("npc_dota_hero")) {
                    heroHealingMap.merge(attacker, val, Integer::sum);
                }
            }
        } catch (Exception e) {
        }
    }

    @OnGameEvent("dota_tower_kill")
    public void onTowerKill(skadistats.clarity.model.GameEvent event) {
        Map<String, Object> log = new HashMap<>();
        log.put("type", "tower_kill");
        log.put("killer", event.getProperty("killer_user_id"));
        log.put("team", event.getProperty("teamnumber"));
        log.put("lane", event.getProperty("lane"));
        log.put("tier", event.getProperty("tier"));
        log.put("time", getGameTime());
        combatLogEvents.add(log);
    }

    private float getGameTime() {
        Entities entities = runner.getContext().getProcessor(Entities.class);
        Entity grp = entities.getByDtName("CDOTA_GameRulesProxy");
        if (grp == null)
            grp = entities.getByDtName("CDOTAGamerulesProxy");
        if (grp == null)
            grp = entities.getByDtName("DOTAGameRulesProxy");

        if (grp != null) {
            Float endTime = getProperty(grp, "m_pGameRules.m_flGameEndTime");
            Float startTime = getProperty(grp, "m_pGameRules.m_flGameStartTime");

            if (endTime != null && startTime != null && endTime > 0) {
                return endTime - startTime;
            }

            Float time = getProperty(grp, "dota_gamerules_data.m_fGameTime");
            if (time == null)
                time = getProperty(grp, "m_pGameRules.m_flGameTime");
            if (time == null)
                time = getProperty(grp, "m_pGameRules.m_fGameTime");
            if (time == null)
                time = getProperty(grp, "m_fGameTime");

            if (startTime == null)
                startTime = getProperty(grp, "dota_gamerules_data.m_flGameStartTime");
            if (startTime == null)
                startTime = getProperty(grp, "m_flGameStartTime");

            if (time != null && startTime != null)
                return time - startTime;
        }
        return 0f;
    }

    // -------------------------------------------------------------------------
    // Final Stats Extraction
    // -------------------------------------------------------------------------
    private String extractStats() {
        Entities entities = runner.getContext().getProcessor(Entities.class);
        Entity pr = entities.getByDtName("CDOTA_PlayerResource");
        Entity dataRadiant = entities.getByDtName("CDOTA_DataRadiant");
        Entity dataDire = entities.getByDtName("CDOTA_DataDire");

        Entity gr = entities.getByDtName("CDOTA_GameRulesProxy");
        if (gr == null)
            gr = entities.getByDtName("DOTAGameRulesProxy");
        if (gr == null)
            gr = entities.getByDtName("CDOTAGamerulesProxy"); // Found via debug!

        // Detailed fallback search if still null (Iterate all if possible, but safely)
        if (gr == null)
            gr = entities.getByDtName("CDOTAGamerulesProxy");
        if (gr == null)
            gr = entities.getByDtName("dota_gamerules");

        // Final check
        if (gr == null) {
            log("CRITICAL: All GameRules lookups failed. Stats will be missing.");
        }

        String winner = "Unknown";
        float duration = 0;
        long matchId = 0;

        if (gr == null) {
            log("CRITICAL: Could not find ANY GameRules entity. Stats will be missing.");
        }

        if (gr != null) {
            log("Found GameRulesProxy: " + gr.getDtClass().getDtName());

            // Found GameRulesProxy
            // Validated properties: m_unMatchID64, m_flGameEndTime, m_BannedHeroes (flat)

            // Get Winner
            Integer winnerTeam = getProperty(gr, "dota_gamerules_data.m_nGameWinner");
            if (winnerTeam == null)
                winnerTeam = getProperty(gr, "m_pGameRules.m_nGameWinner");

            if (winnerTeam != null) {
                if (winnerTeam == 2)
                    winner = "Radiant";
                else if (winnerTeam == 3)
                    winner = "Dire";
            }

            duration = getGameTime();

            // Get MatchID
            Long mid = getLongPropertyDirect(gr, "dota_gamerules_data.m_iMatchID");
            if (mid == null)
                mid = getLongPropertyDirect(gr, "dota_gamerules_data.m_nMatchID");
            if (mid == null)
                mid = getLongPropertyDirect(gr, "m_pGameRules.m_iMatchID");
            if (mid == null)
                mid = getLongPropertyDirect(gr, "m_pGameRules.m_nMatchID");
            if (mid == null)
                mid = getLongPropertyDirect(gr, "m_pGameRules.m_ullMatchID"); // Unsigned
            if (mid == null)
                mid = getLongPropertyDirect(gr, "m_pGameRules.m_unMatchID64"); // Found via Dump!

            if (mid != null)
                matchId = mid;
        }

        if (cachedPicksBans.isEmpty() && gr != null) {
            // Strategy 1: m_PickBan Struct (Standard CM)
            boolean foundPickBan = false;
            String[] pickBanPrefixes = { "dota_gamerules_data.m_PickBan.", "m_pGameRules.m_PickBan." };

            for (String prefix : pickBanPrefixes) {
                if (foundPickBan)
                    break;
                for (int i = 0; i < 64; i++) {
                    String base = prefix + (i < 10 ? "0" + i : i);
                    if (i >= 100)
                        base = prefix + i;
                    Integer heroId = getProperty(gr, base + ".m_iHeroID");
                    if (heroId == null)
                        heroId = getProperty(gr, prefix + i + ".m_iHeroID");
                    if (heroId == null || heroId == 0)
                        continue;

                    Integer team = getProperty(gr, base + ".m_iTeam");
                    if (team == null)
                        team = getProperty(gr, prefix + i + ".m_iTeam");
                    Boolean isPick = getProperty(gr, base + ".m_bIsPick");
                    if (isPick == null)
                        isPick = getProperty(gr, prefix + i + ".m_bIsPick");

                    if (team == null)
                        team = 0;
                    if (isPick == null)
                        isPick = false;
                    cachedPicksBans.add(String.format("{\"is_pick\": %b, \"hero_id\": %d, \"team\": %d, \"order\": %d}",
                            isPick, heroId, team, i));
                    foundPickBan = true;
                }
            }

            // Strategy 2: Flat m_BannedHeroes (if Strategy 1 failed)
            if (!foundPickBan) {
                // Bans
                for (int i = 0; i < 24; i++) {
                    String idx = (i < 10 ? "0" + i : "" + i);
                    Integer heroId = getProperty(gr, "m_pGameRules.m_BannedHeroes." + idx);
                    if (heroId != null && heroId > 0) {
                        cachedPicksBans.add(String.format(
                                "{\"is_pick\": false, \"hero_id\": %d, \"team\": 0, \"order\": %d}", heroId, i));
                        foundPickBan = true;
                    }
                }

                // Picks (SelectedHeroes)
                for (int i = 0; i < 24; i++) {
                    String idx = (i < 10 ? "0" + i : "" + i);
                    Integer heroId = getProperty(gr, "m_pGameRules.m_SelectedHeroes." + idx);
                    if (heroId != null && heroId > 0) {
                        cachedPicksBans.add(String.format(
                                "{\"is_pick\": true, \"hero_id\": %d, \"team\": 0, \"order\": %d}", heroId, 24 + i));
                        foundPickBan = true;
                    }
                }
            }

            // Fallback: If no m_PickBan found (Non-CM modes?), try legacy m_BannedHeroes
            // scan
            if (!foundPickBan) {
                for (int i = 0; i < 24; i++) {
                    Integer banId = getProperty(gr,
                            "dota_gamerules_data.m_BannedHeroes." + Util.arrayIdxToString(i) + ".m_iHeroID");
                    if (banId == null) {
                        banId = getProperty(gr,
                                "m_pGameRules.m_BannedHeroes." + Util.arrayIdxToString(i) + ".m_iHeroID");
                    }
                    if (banId != null && banId > 0) {
                        cachedPicksBans.add("{\"is_pick\": false, \"hero_id\": " + banId + ", \"order\": " + i + "}");
                    }
                }
            }
        }

        if (pr == null)
            return "{\"error\": \"PlayerResource not found\"}";

        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("  \"matchId\": ").append(matchId).append(",\n");
        sb.append("  \"winner\": \"").append(winner).append("\",\n");
        sb.append("  \"duration\": ").append(duration).append(",\n");

        // Sort picks/bans by order
        cachedPicksBans.sort((a, b) -> {
            int orderA = extractOrder(a);
            int orderB = extractOrder(b);
            return Integer.compare(orderA, orderB);
        });

        sb.append("  \"picks_bans\": [");
        for (int i = 0; i < cachedPicksBans.size(); i++) {
            sb.append(cachedPicksBans.get(i));
            if (i < cachedPicksBans.size() - 1)
                sb.append(", ");
        }
        sb.append("],\n");

        sb.append("  \"_debug\": ").append("\"").append(debugLog.toString().replace("\n", "\\n").replace("\"", "'"))
                .append("\",\n");

        sb.append("  \"facets\": {");
        int fCount = 0;
        for (Map.Entry<Integer, Integer> e : playerFacets.entrySet()) {
            sb.append("\"").append(e.getKey()).append("\": ").append(e.getValue());
            if (++fCount < playerFacets.size())
                sb.append(", ");
        }
        sb.append("},\n");

        sb.append("  \"events\": [");
        for (int i = 0; i < combatLogEvents.size(); i++) {
            sb.append(mapToJson(combatLogEvents.get(i)));
            if (i < combatLogEvents.size() - 1)
                sb.append(", ");
        }
        sb.append("],\n");

        sb.append("  \"wards\": [");
        for (int i = 0; i < wardLog.size(); i++) {
            sb.append(mapToJson(wardLog.get(i)));
            if (i < wardLog.size() - 1)
                sb.append(", ");
        }
        sb.append("],\n");

        sb.append("  \"players\": [\n");

        int radiantIdx = 0;
        int direIdx = 0;
        List<String> playerJsons = new ArrayList<>();

        for (int i = 0; i < 24; i++) {
            String name = getStringProperty(pr, "m_vecPlayerData.%i.m_iszPlayerName", i);
            if (name == null || name.isEmpty())
                continue;

            int team = getIntProperty(pr, "m_vecPlayerData.%i.m_iPlayerTeam", i);
            if (team != 2 && team != 3)
                continue;

            long steamId = getLongProperty(pr, "m_vecPlayerData.%i.m_iPlayerSteamID", i);
            int kills = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iKills", i);
            int deaths = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iDeaths", i);
            int assists = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iAssists", i);
            int level = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iLevel", i);
            int heroId = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_nSelectedHeroID", i);

            int lastHits = 0, denies = 0, gold = 0, netWorth = 0, gpm = 0, xpm = 0;
            int heroDamage = 0, towerDamage = 0, heroHealing = 0;

            if (team == 2 && dataRadiant != null) {
                lastHits = getIntProperty(dataRadiant, "m_vecDataTeam.%i.m_iLastHitCount", radiantIdx);
                denies = getIntProperty(dataRadiant, "m_vecDataTeam.%i.m_iDenyCount", radiantIdx);
                gold = getIntProperty(dataRadiant, "m_vecDataTeam.%i.m_iTotalEarnedGold", radiantIdx);
                netWorth = getIntProperty(dataRadiant, "m_vecDataTeam.%i.m_iNetWorth", radiantIdx);
                radiantIdx++;
            } else if (team == 3 && dataDire != null) {
                lastHits = getIntProperty(dataDire, "m_vecDataTeam.%i.m_iLastHitCount", direIdx);
                denies = getIntProperty(dataDire, "m_vecDataTeam.%i.m_iDenyCount", direIdx);
                gold = getIntProperty(dataDire, "m_vecDataTeam.%i.m_iTotalEarnedGold", direIdx);
                netWorth = getIntProperty(dataDire, "m_vecDataTeam.%i.m_iNetWorth", direIdx);
                direIdx++;
            }

            // GPM/XPM
            gpm = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iGoldPerMin", i);
            if (gpm == 0 && gold > 0 && duration > 0) {
                gpm = (int) (gold / (duration / 60.0));
            }
            xpm = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iXPPerMin", i);
            if (xpm == 0 && duration > 0) {
                int totalXp = calculateTotalXp(level);
                xpm = (int) (totalXp / (duration / 60.0));
            }

            // Hero Stats from Maps (CombatLog Aggregation)
            Integer heroHandle = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_hSelectedHero", i);
            Entity heroEntity = entities.getByHandle(heroHandle);
            String heroName = "unknown";

            if (heroEntity != null) {
                heroName = heroEntity.getDtClass().getDtName().replace("CDOTA_Unit_Hero_", "")
                        .replace("CDOTA_Unit_", "").toLowerCase();

                String lookupName = "npc_dota_hero_" + heroName;
                if (heroDamageMap.containsKey(lookupName))
                    heroDamage = heroDamageMap.get(lookupName);
                if (towerDamageMap.containsKey(lookupName))
                    towerDamage = towerDamageMap.get(lookupName);
                if (heroHealingMap.containsKey(lookupName))
                    heroHealing = heroHealingMap.get(lookupName);
            }

            List<String> items = new ArrayList<>();
            List<String> abilities = new ArrayList<>();
            // Hero Entity already retrieved above

            if (heroEntity != null) {
                // heroName already retrieved

                for (int slot = 0; slot < 6; slot++) {
                    Integer itemHandle = getProperty(heroEntity, "m_hItems." + Util.arrayIdxToString(slot));
                    if (itemHandle != null && itemHandle != 2097151) {
                        Entity itemEntity = entities.getByHandle(itemHandle);
                        if (itemEntity != null) {
                            items.add("\"" + itemEntity.getDtClass().getDtName().replace("CDOTA_Item_", "")
                                    .replace("item_", "") + "\"");
                        }
                    }
                }

                for (int abSlot = 0; abSlot < 32; abSlot++) {
                    Integer abHandle = getProperty(heroEntity, "m_vecAbilities." + Util.arrayIdxToString(abSlot));
                    if (abHandle != null && abHandle != 2097151) {
                        Entity abEntity = entities.getByHandle(abHandle);
                        if (abEntity != null) {
                            String abName = abEntity.getDtClass().getDtName().replace("CDOTA_Ability_", "");
                            int lvl = getIntPropertyDirect(abEntity, "m_iLevel", 0);
                            if (lvl > 0 && !abName.startsWith("special_bonus")) {
                                abilities.add("{\"name\": \"" + abName + "\", \"level\": " + lvl + "}");
                            }
                        }
                    }
                }
            }

            StringBuilder pJson = new StringBuilder();
            pJson.append("    {\n");
            pJson.append("      \"steamId\": \"").append(steamId).append("\",\n");
            pJson.append("      \"name\": \"").append(escape(name)).append("\",\n");
            pJson.append("      \"team\": \"").append(team == 2 ? "Radiant" : "Dire").append("\",\n");
            pJson.append("      \"heroId\": ").append(heroId).append(",\n");
            pJson.append("      \"heroName\": \"").append(heroName).append("\",\n");
            pJson.append("      \"level\": ").append(level).append(",\n");
            pJson.append("      \"facet\": ").append(playerFacets.getOrDefault(i, 0)).append(",\n");
            pJson.append("      \"kills\": ").append(kills).append(",\n");
            pJson.append("      \"deaths\": ").append(deaths).append(",\n");
            pJson.append("      \"assists\": ").append(assists).append(",\n");
            pJson.append("      \"lastHits\": ").append(lastHits).append(",\n");
            pJson.append("      \"denies\": ").append(denies).append(",\n");
            pJson.append("      \"gold\": ").append(gold).append(",\n");
            pJson.append("      \"netWorth\": ").append(netWorth).append(",\n");
            pJson.append("      \"netWorth\": ").append(netWorth).append(",\n");
            pJson.append("      \"gpm\": ").append(gpm).append(",\n");
            pJson.append("      \"xpm\": ").append(xpm).append(",\n");
            pJson.append("      \"heroDamage\": ").append(heroDamage).append(",\n");
            pJson.append("      \"towerDamage\": ").append(towerDamage).append(",\n");
            pJson.append("      \"heroHealing\": ").append(heroHealing).append(",\n");
            pJson.append("      \"items\": [").append(String.join(", ", items)).append("],\n");
            pJson.append("      \"abilities\": [").append(String.join(", ", abilities)).append("],\n");

            List<String> upgrades = abilityUpgrades.getOrDefault(i, Collections.emptyList());
            pJson.append("      \"ability_build\": [").append(String.join(", ", upgrades)).append("],\n");

            List<String> posList = playerPositions.getOrDefault(i, Collections.emptyList());
            pJson.append("      \"positions\": [").append(String.join(", ", posList)).append("]\n");

            pJson.append("    }");
            playerJsons.add(pJson.toString());
        } // end player loop

        sb.append(String.join(",\n", playerJsons));
        sb.append("\n  ]\n");
        sb.append("}");

        return sb.toString();
    }

    // -------------------------------------------------------------------------
    // Utilities
    // -------------------------------------------------------------------------
    private int calculateTotalXp(int level) {
        // Approximate Table (7.33+)
        int[] xpTable = {
                0, 0, 230, 600, 1080, 1680, 2300, 2940, 3600, 4280, 4980,
                5900, 6820, 7740, 8660, 9780, 10900, 12020, 13140, 14260, 15380,
                16500, 17620, 18740, 19860, 20980, 22100, 23220, 24340, 25460, 30000 // Cap at 30
        };
        if (level <= 1)
            return 0;
        if (level >= xpTable.length)
            return xpTable[xpTable.length - 1];
        return xpTable[level];
    }

    private int extractOrder(String json) {
        try {
            int idx = json.indexOf("\"order\":");
            if (idx != -1) {
                int end = json.indexOf("}", idx);
                String num = json.substring(idx + 8, end).trim();
                return Integer.parseInt(num);
            }
        } catch (Exception e) {
        }
        return 0;
    }

    private String mapToJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        int c = 0;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            sb.append("\"").append(entry.getKey()).append("\": ");
            if (entry.getValue() instanceof String) {
                sb.append("\"").append(((String) entry.getValue()).replace("\"", "\\\"")).append("\"");
            } else {
                sb.append(entry.getValue());
            }
            if (++c < map.size())
                sb.append(", ");
        }
        sb.append("}");
        return sb.toString();
    }

    private String escape(String s) {
        if (s == null)
            return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private <T> T getProperty(Entity e, String path) {
        if (e == null)
            return null;
        try {
            FieldPath fp = e.getDtClass().getFieldPathForName(path);
            return fp != null ? e.getPropertyForFieldPath(fp) : null;
        } catch (Exception ex) {
            return null;
        }
    }

    private int getIntValue(Entity e, String path, int def) {
        Object val = getProperty(e, path);
        if (val instanceof Number) {
            return ((Number) val).intValue();
        }
        return def;
    }

    private String getStringProperty(Entity e, String pattern, int index) {
        return getProperty(e, pattern.replaceAll("%i", Util.arrayIdxToString(index)));
    }

    private int getIntProperty(Entity e, String pattern, int index) {
        String path = pattern.replaceAll("%i", Util.arrayIdxToString(index));
        return getIntValue(e, path, 0);
    }

    private int getIntPropertyDirect(Entity e, String path, int defaultValue) {
        return getIntValue(e, path, defaultValue);
    }

    private long getLongProperty(Entity e, String pattern, int index) {
        Object val = getProperty(e, pattern.replaceAll("%i", Util.arrayIdxToString(index)));
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        return 0L;
    }

    private Long getLongPropertyDirect(Entity e, String path) {
        Object val = getProperty(e, path);
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        return null;
    }
}
