import org.slf4j.LoggerFactory;
import skadistats.clarity.Clarity;
import skadistats.clarity.io.Util;
import skadistats.clarity.model.EngineId;
import skadistats.clarity.model.Entity;
import skadistats.clarity.model.FieldPath;
import skadistats.clarity.processor.entities.Entities;
import skadistats.clarity.processor.entities.UsesEntities;
import skadistats.clarity.processor.runner.ControllableRunner;
import skadistats.clarity.source.MappedFileSource;
import skadistats.clarity.wire.shared.demo.proto.Demo;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@UsesEntities
public class SimpleParser {

    private final ControllableRunner runner;
    private long matchId = 0;
    private long timestamp = 0;
    private String winner = "Unknown";

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            System.err.println("Usage: java -jar dota-parser.jar <demofile>");
            System.exit(1);
        }

        SimpleParser parser = new SimpleParser(args[0]);
        parser.readHeader(args[0]);
        parser.run();
    }

    public SimpleParser(String fileName) throws IOException {
        runner = new ControllableRunner(new MappedFileSource(fileName)).runWith(this);
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
                }
            }
        } catch (Exception e) {
            // Ignore, we fallback to 0
        }
    }

    public void run() throws InterruptedException {
        runner.seek(runner.getLastTick());
        runner.halt();
        extractStats();
    }

    private void extractStats() {
        // Modern Source 2 Logic from clarity-examples
        Entity pr = getEntity("PlayerResource");
        Entity dataRadiant = getEntity("DataRadiant");
        Entity dataDire = getEntity("DataDire");
        Entity grp = getEntity("GameRulesProxy");

        if (grp != null) {
            Integer gameWinner = getProperty(grp, "dota_gamerules_data.m_nGameWinner");
            if (gameWinner != null) {
                this.winner = gameWinner == 2 ? "Radiant" : (gameWinner == 3 ? "Dire" : "Unknown");
            }
            Long mid = getProperty(grp, "dota_gamerules_data.m_unMatchID64");
            if (mid != null && mid != 0) {
                this.matchId = mid;
            }
        }

        if (pr == null) {
            System.err.println("Error: PlayerResource entity not found.");
            return;
        }

        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("  \"matchId\": ").append(this.matchId).append(",\n");
        json.append("  \"timestamp\": ").append(this.timestamp * 1000L).append(",\n");
        json.append("  \"winner\": \"").append(this.winner).append("\",\n");
        json.append("  \"players\": [\n");

        List<String> playerJsons = new ArrayList<>();

        int radiantIdx = 0;
        int direIdx = 0;

        // Iterate over potential player slots (0-23 usually)
        for (int i = 0; i < 24; i++) {
            // Check if valid player using m_vecPlayerData.%i.m_iPlayerTeam
            // Or m_vecPlayerData.%i.m_iszPlayerName
            try {
                String name = getStringProperty(pr, "m_vecPlayerData.%i.m_iszPlayerName", i);

                if (name == null || name.isEmpty())
                    continue;

                // Retrieve Stats
                // Note: Field paths for 7.37 might be:
                // m_vecPlayerTeamData.%i.m_iKills
                // m_vecPlayerTeamData.%i.m_iDeaths
                // m_vecPlayerTeamData.%i.m_iAssists

                int team = getIntProperty(pr, "m_vecPlayerData.%i.m_iPlayerTeam", i);

                // Spectators (1) or Unassigned (0) skip
                if (team != 2 && team != 3)
                    continue;

                int kills = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iKills", i);
                int deaths = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iDeaths", i);
                int assists = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iAssists", i);

                // Level
                int level = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_iLevel", i);

                // Hero ID (Selected Hero)
                int heroId = getIntProperty(pr, "m_vecPlayerTeamData.%i.m_nSelectedHeroID", i);

                // GPM/XPM are harder. Often stored in "DataRadiant" / "DataDire" entities for
                // split stats?
                // Or m_iTotalEarnedGold / GameTime
                // clarity-examples uses: "Data%n", "m_vecDataTeam.%p.m_iTotalEarnedGold"
                // Let's rely on basic KDA first which confirms the entity method works.

                // Economic Stats from Data Entities
                int lastHits = 0;
                int denies = 0;
                int gold = 0;
                int netWorth = 0;

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

                StringBuilder sb = new StringBuilder();
                sb.append("    {\n");
                sb.append("      \"name\": \"").append(escape(name)).append("\",\n");
                sb.append("      \"team\": \"").append(team == 2 ? "Radiant" : "Dire").append("\",\n");
                sb.append("      \"heroId\": ").append(heroId).append(",\n");
                sb.append("      \"kills\": ").append(kills).append(",\n");
                sb.append("      \"deaths\": ").append(deaths).append(",\n");
                sb.append("      \"assists\": ").append(assists).append(",\n");
                sb.append("      \"level\": ").append(level).append(",\n");
                sb.append("      \"lastHits\": ").append(lastHits).append(",\n");
                sb.append("      \"denies\": ").append(denies).append(",\n");
                sb.append("      \"totalGold\": ").append(gold).append(",\n");
                sb.append("      \"netWorth\": ").append(netWorth).append("\n");
                sb.append("    }");
                playerJsons.add(sb.toString());

            } catch (Exception e) {
                // Usually means field not found or index out of bound logical check
            }
        }

        json.append(String.join(",\n", playerJsons));
        json.append("\n  ]\n");
        json.append("}");

        System.out.println(json.toString());
    }

    private String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    // Helper to abstract the formatting
    private int getIntProperty(Entity e, String pattern, int index) {
        String path = pattern.replaceAll("%i", Util.arrayIdxToString(index));
        Integer val = getProperty(e, path);
        return val != null ? val : 0;
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
        // DOTA 2 Source 2 prefix
        String name = "CDOTA_" + entityName;
        return runner.getContext().getProcessor(Entities.class).getByDtName(name);
    }
}
