import skadistats.clarity.Clarity;
import skadistats.clarity.io.Util;
import skadistats.clarity.model.Entity;
import skadistats.clarity.model.FieldPath;
import skadistats.clarity.processor.entities.Entities;
import skadistats.clarity.processor.entities.UsesEntities;
import skadistats.clarity.processor.runner.ControllableRunner;
import skadistats.clarity.source.MappedFileSource;
import skadistats.clarity.wire.shared.demo.proto.Demo;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Iterator;
import java.util.Map;

@UsesEntities
public class SimpleParser {

    private final ControllableRunner runner;
    private long matchId = 0;
    private long timestamp = 0;
    private float duration = 0; // seconds
    private String winner = "Unknown";
    private int lastTick = 0;

    // PlayerID -> List of ability names (in order of detection)
    private Map<Integer, List<String>> skillBuilds = new HashMap<>();
    // PlayerID -> Map<AbilityName, Level>
    private Map<Integer, Map<String, Integer>> abilityState = new HashMap<>();

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            System.err.println("Usage: java -jar dota-parser.jar <demofile>");
            System.exit(1);
        }

        SimpleParser parser = new SimpleParser(args[0]);
        // Try header first for metadata
        parser.readHeader(args[0]);
        parser.run();
        System.exit(0);
    }

    public SimpleParser(String fileName) throws IOException {
        runner = new ControllableRunner(new MappedFileSource(fileName)).runWith(this);
        lastTick = runner.getLastTick();
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
            // Fallback
        }
    }

    public void run() {
        // Polling Strategy: Seek through replay in 5-second intervals
        int stepSec = 5;
        int stepTicks = stepSec * 30;

        int currentTick = 0;
        int steps = 0;
        while (currentTick <= lastTick) {
            if (steps++ % 30 == 0)
                System.err.println("Processing: " + currentTick + "/" + lastTick);
            try {
                runner.seek(currentTick);
                checkAbilities();
            } catch (Exception e) {
                System.err.println("Seek failed at " + currentTick + ": " + e.getMessage());
                break;
            }
            if (currentTick == lastTick)
                break;
            currentTick += stepTicks;
            if (currentTick > lastTick)
                currentTick = lastTick;
        }

        extractStats();
    }

    private void checkAbilities() {
        Entities entities = runner.getContext().getProcessor(Entities.class);
        Entity pr = getEntity("PlayerResource");
        if (pr == null)
            return;

        for (int i = 0; i < 24; i++) {
            // Check if player exists
            String name = getStringProperty(pr, "m_vecPlayerData.%i.m_iszPlayerName", i);
            if (name == null || name.isEmpty())
                continue;

            // Get hero
            int heroHandle = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_hSelectedHero", i);
            Entity hero = entities.getByHandle(heroHandle);
            if (hero == null)
                continue;

            // Check if player is seen for the first time
            boolean isNewPlayer = !abilityState.containsKey(i);
            if (isNewPlayer) {
                abilityState.put(i, new HashMap<>());
            }
            Map<String, Integer> playerState = abilityState.get(i);

            // Check abilities
            for (int abSlot = 0; abSlot < 32; abSlot++) {
                String abPath = "m_vecAbilities." + Util.arrayIdxToString(abSlot);
                Integer abHandle = getProperty(hero, abPath);
                if (abHandle != null && abHandle != 2097151) {
                    Entity abEntity = entities.getByHandle(abHandle);
                    if (abEntity != null) {
                        String abilityName = abEntity.getDtClass().getDtName().replace("CDOTA_Ability_", "");
                        // FILTER JUNK
                        if (shouldIgnoreAbility(abilityName))
                            continue;

                        int level = getIntProperty(abEntity, "m_iLevel", -1);

                        if (level > 0) {
                            if (isNewPlayer) {
                                // Just record state, do not add to build logic
                                playerState.put(abilityName, level);
                            } else {
                                trackAbilityLearn(i, abilityName, level);
                            }
                        }
                    }
                }
            }
        }
    }

    private boolean shouldIgnoreAbility(String name) {
        if (name == null)
            return true;
        String n = name.toLowerCase();
        return n.contains("innate") ||
                n.startsWith("seasonal_") ||
                n.startsWith("plus_") ||
                n.startsWith("twin_gate") ||
                n.equals("capture") ||
                n.equals("lamp_use") ||
                n.equals("abyssalunderlord_portal_warp") ||
                n.equals("attribute_bonus") ||
                n.equals("default_attack") ||
                n.equals("item_tpscroll") ||
                n.startsWith("special_bonus_attributes") ||
                n.equals("cny_beast_teleport") ||
                n.equals("cny2015_teleport");
    }

    private void trackAbilityLearn(int playerId, String ability, int level) {
        Map<String, Integer> playerState = abilityState.get(playerId);
        int oldLevel = playerState.getOrDefault(ability, 0);

        if (level > oldLevel) {
            List<String> build = skillBuilds.computeIfAbsent(playerId, k -> new ArrayList<>());
            for (int k = oldLevel; k < level; k++) {
                build.add("\"" + ability + "\"");
            }
            playerState.put(ability, level);
        }
    }

    private void extractStats() {
        Entities entities = runner.getContext().getProcessor(Entities.class);

        Entity pr = getEntity("PlayerResource");
        Entity dataRadiant = getEntity("DataRadiant");
        Entity dataDire = getEntity("DataDire");
        Entity grp = getEntity("GameRulesProxy");

        if (grp != null) {
            Integer gameWinner = getProperty(grp, "dota_gamerules_data.m_nGameWinner");
            Float gameTime = getProperty(grp, "dota_gamerules_data.m_fGameTime");
            Float startTime = getProperty(grp, "dota_gamerules_data.m_flGameStartTime");

            if (gameWinner != null) {
                this.winner = gameWinner == 2 ? "Radiant" : (gameWinner == 3 ? "Dire" : "Unknown");
            }
            Long mid = getProperty(grp, "dota_gamerules_data.m_unMatchID64");
            if (mid != null && mid != 0) {
                this.matchId = mid;
            }
            if (gameTime != null && startTime != null) {
                this.duration = gameTime - startTime;
            }
        }

        if (pr == null) {
            System.err.println("{\"error\": \"PlayerResource entity not found\"}");
            return;
        }

        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("  \"matchId\": ").append(this.matchId).append(",\n");
        json.append("  \"timestamp\": ").append(this.timestamp * 1000L).append(",\n");
        json.append("  \"duration\": ").append(this.duration).append(",\n");
        json.append("  \"winner\": \"").append(this.winner).append("\",\n");
        json.append("  \"players\": [\n");

        List<String> playerJsons = new ArrayList<>();
        int radiantIdx = 0;
        int direIdx = 0;

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

            int roshans = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iRoshanKills", i);

            int lastHits = 0;
            int denies = 0;
            int gold = 0;
            int netWorth = 0;

            int gpm = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iGoldPerMin", i);
            int xpm = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iXPPerMin", i);

            int heroDamage = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iHeroDamage", i);
            int towerDamage = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iTowerDamage", i);
            int heroHealing = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iHealAmount", i);

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

            if (gpm == 0 && duration > 0)
                gpm = (int) (gold / (duration / 60));
            if (xpm == 0 && duration > 0) {
                int totalXp = 0;
                if (team == 2 && dataRadiant != null)
                    totalXp = getIntProperty(dataRadiant, "m_vecDataTeam.%i.m_iTotalEarnedXP", radiantIdx - 1);
                else if (team == 3 && dataDire != null)
                    totalXp = getIntProperty(dataDire, "m_vecDataTeam.%i.m_iTotalEarnedXP", direIdx - 1);
                xpm = (int) (totalXp / (duration / 60));
            }

            List<String> items = new ArrayList<>();
            List<String> abilities = new ArrayList<>();

            int heroHandle = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_hSelectedHero", i);
            Entity heroEntity = entities.getByHandle(heroHandle);
            String heroName = "unknown";

            if (heroEntity != null) {
                heroName = heroEntity.getDtClass().getDtName().replace("CDOTA_Unit_Hero_", "")
                        .replace("CDOTA_Unit_", "").toLowerCase(); // Clean up name

                for (int slot = 0; slot < 6; slot++) {
                    String itemPath = "m_hItems." + Util.arrayIdxToString(slot);
                    Integer itemHandle = getProperty(heroEntity, itemPath);
                    if (itemHandle != null && itemHandle != 2097151) {
                        Entity itemEntity = entities.getByHandle(itemHandle);
                        if (itemEntity != null) {
                            String itemName = itemEntity.getDtClass().getDtName().replace("CDOTA_Item_", "");
                            items.add("\"" + itemName + "\"");
                        }
                    }
                }

                for (int abSlot = 0; abSlot < 32; abSlot++) {
                    String abPath = "m_vecAbilities." + Util.arrayIdxToString(abSlot);
                    Integer abHandle = getProperty(heroEntity, abPath);
                    if (abHandle != null && abHandle != 2097151) {
                        Entity abEntity = entities.getByHandle(abHandle);
                        if (abEntity != null) {
                            String abName = abEntity.getDtClass().getDtName().replace("CDOTA_Ability_", "");
                            if (!shouldIgnoreAbility(abName)) {
                                Integer abLevel = getProperty(abEntity, "m_iLevel");
                                if (abLevel != null && abLevel > 0) {
                                    abilities.add("\"" + abName + "\"");
                                }
                            }
                        }
                    }
                }
            }

            StringBuilder sb = new StringBuilder();
            sb.append("    {\n");
            sb.append("      \"name\": \"").append(escape(name)).append("\",\n");
            sb.append("      \"steamId\": \"").append(steamId).append("\",\n");
            sb.append("      \"team\": \"").append(team == 2 ? "Radiant" : "Dire").append("\",\n");
            sb.append("      \"heroId\": ").append(heroId).append(",\n");
            sb.append("      \"heroName\": \"").append(heroName).append("\",\n");
            sb.append("      \"level\": ").append(level).append(",\n");
            sb.append("      \"kills\": ").append(kills).append(",\n");
            sb.append("      \"deaths\": ").append(deaths).append(",\n");
            sb.append("      \"assists\": ").append(assists).append(",\n");
            sb.append("      \"lastHits\": ").append(lastHits).append(",\n");
            sb.append("      \"denies\": ").append(denies).append(",\n");
            sb.append("      \"totalGold\": ").append(gold).append(",\n");
            sb.append("      \"netWorth\": ").append(netWorth).append(",\n");
            sb.append("      \"gpm\": ").append(gpm).append(",\n");
            sb.append("      \"xpm\": ").append(xpm).append(",\n");
            sb.append("      \"heroDamage\": ").append(heroDamage).append(",\n");
            sb.append("      \"towerDamage\": ").append(towerDamage).append(",\n");
            sb.append("      \"heroHealing\": ").append(heroHealing).append(",\n");
            sb.append("      \"roshans\": ").append(roshans).append(",\n");
            sb.append("      \"items\": [").append(String.join(", ", items)).append("],\n");

            // Skill Build
            List<String> build = skillBuilds.get(i);
            if (build == null)
                build = new ArrayList<>();
            sb.append("      \"abilities\": [").append(String.join(", ", abilities)).append("],\n");
            sb.append("      \"abilityMap\": [").append(String.join(", ", build)).append("]\n");

            sb.append("    }");
            playerJsons.add(sb.toString());
        }

        json.append(String.join(",\n", playerJsons));
        json.append("\n  ]\n");
        json.append("}");

        System.out.println(json.toString());
    }

    private String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private int getIntProperty(Entity e, String pattern, int index) {
        String path = pattern.replaceAll("%i", Util.arrayIdxToString(index));
        Integer val = getProperty(e, path);
        return val != null ? val : 0;
    }

    private long getLongProperty(Entity e, String pattern, int index) {
        String path = pattern.replaceAll("%i", Util.arrayIdxToString(index));
        Long val = getProperty(e, path);
        return val != null ? val : 0L;
    }

    private String getStringProperty(Entity e, String pattern, int index) {
        String path = pattern.replaceAll("%i", Util.arrayIdxToString(index));
        return getProperty(e, path);
    }

    private <T> T getProperty(Entity e, String path) {
        try {
            FieldPath fp = e.getDtClass().getFieldPathForName(path);
            if (fp == null)
                return null;
            return e.getPropertyForFieldPath(fp);
        } catch (Exception ex) {
            return null;
        }
    }

    private Entity getEntity(String entityName) {
        String name = "CDOTA_" + entityName;
        return runner.getContext().getProcessor(Entities.class).getByDtName(name);
    }
}
