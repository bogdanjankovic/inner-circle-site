package opendota;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

/**
 * Transforms OpenDota ParsedData into a website-compatible format for
 * MatchDetails.jsx
 */
public class WebsiteMatchData {

    public long matchId;
    public String winner;
    public int duration;
    public int radiantScore;
    public int direScore;
    public List<Player> players = new ArrayList<>();
    public List<PickBan> picks_bans = new ArrayList<>();
    public List<Ward> wards = new ArrayList<>();

    // Optional team ID fields for website matching
    public String radiantTeamId;
    public String direTeamId;

    public static class Player {
        public String steamId;
        public String name;
        public String team; // "Radiant" or "Dire"
        public int heroId;
        public String heroName;
        public int level;
        public int facet;
        public String facetTitle;
        public int kills;
        public int deaths;
        public int assists;
        public int lastHits;
        public int denies;
        public int netWorth;
        public int gpm;
        public int xpm;
        public int heroDamage;
        public int towerDamage;
        public int heroHealing;
        public List<String> items = new ArrayList<>();
        public List<String> backpack = new ArrayList<>();
        public String neutral_item;
        public boolean aghs_scepter;
        public boolean aghs_shard;
        public List<Map<String, Object>> purchase_log = new ArrayList<>();
        public List<String> ability_build = new ArrayList<>();
        public List<String> talents = new ArrayList<>();
        public List<int[]> positions = new ArrayList<>(); // [time, x, y]
    }

    public static class PickBan {
        public int hero_id;
        public boolean is_pick;
        public int team; // 2 = Radiant, 3 = Dire
        public int order;
    }

    public static class Ward {
        public String type; // "Observer" or "Sentry"
        public int x;
        public int y;
        public String team; // "Radiant" or "Dire"
        public int time;
    }

    /**
     * Hero ID to internal name mapping for common heroes
     * This is a subset - full version should load from constants file
     */
    private static final Map<Integer, String> HERO_ID_TO_NAME = new HashMap<>();
    static {
        HERO_ID_TO_NAME.put(1, "antimage");
        HERO_ID_TO_NAME.put(2, "axe");
        HERO_ID_TO_NAME.put(3, "bane");
        HERO_ID_TO_NAME.put(4, "bloodseeker");
        HERO_ID_TO_NAME.put(5, "crystal_maiden");
        HERO_ID_TO_NAME.put(6, "drow_ranger");
        HERO_ID_TO_NAME.put(7, "earthshaker");
        HERO_ID_TO_NAME.put(8, "juggernaut");
        HERO_ID_TO_NAME.put(9, "mirana");
        HERO_ID_TO_NAME.put(10, "morphling");
        HERO_ID_TO_NAME.put(11, "shadow_fiend");
        HERO_ID_TO_NAME.put(12, "phantom_lancer");
        HERO_ID_TO_NAME.put(13, "puck");
        HERO_ID_TO_NAME.put(14, "pudge");
        HERO_ID_TO_NAME.put(15, "razor");
        HERO_ID_TO_NAME.put(16, "sand_king");
        HERO_ID_TO_NAME.put(17, "storm_spirit");
        HERO_ID_TO_NAME.put(18, "sven");
        HERO_ID_TO_NAME.put(19, "tiny");
        HERO_ID_TO_NAME.put(20, "vengeful_spirit");
        HERO_ID_TO_NAME.put(21, "windranger");
        HERO_ID_TO_NAME.put(22, "zeus");
        HERO_ID_TO_NAME.put(23, "kunkka");
        HERO_ID_TO_NAME.put(25, "lina");
        HERO_ID_TO_NAME.put(26, "lion");
        HERO_ID_TO_NAME.put(27, "shadow_shaman");
        HERO_ID_TO_NAME.put(28, "slardar");
        HERO_ID_TO_NAME.put(29, "tidehunter");
        HERO_ID_TO_NAME.put(30, "witch_doctor");
        HERO_ID_TO_NAME.put(31, "lich");
        HERO_ID_TO_NAME.put(32, "riki");
        HERO_ID_TO_NAME.put(33, "enigma");
        HERO_ID_TO_NAME.put(34, "tinker");
        HERO_ID_TO_NAME.put(35, "sniper");
        HERO_ID_TO_NAME.put(36, "necrophos");
        HERO_ID_TO_NAME.put(37, "warlock");
        HERO_ID_TO_NAME.put(38, "beastmaster");
        HERO_ID_TO_NAME.put(39, "queen_of_pain");
        HERO_ID_TO_NAME.put(40, "venomancer");
        HERO_ID_TO_NAME.put(41, "faceless_void");
        HERO_ID_TO_NAME.put(42, "skeleton_king");
        HERO_ID_TO_NAME.put(43, "death_prophet");
        HERO_ID_TO_NAME.put(44, "phantom_assassin");
        HERO_ID_TO_NAME.put(45, "pugna");
        HERO_ID_TO_NAME.put(46, "templar_assassin");
        HERO_ID_TO_NAME.put(47, "viper");
        HERO_ID_TO_NAME.put(48, "luna");
        HERO_ID_TO_NAME.put(49, "dragon_knight");
        HERO_ID_TO_NAME.put(50, "dazzle");
        HERO_ID_TO_NAME.put(51, "clockwerk");
        HERO_ID_TO_NAME.put(52, "leshrac");
        HERO_ID_TO_NAME.put(53, "furion");
        HERO_ID_TO_NAME.put(54, "life_stealer");
        HERO_ID_TO_NAME.put(55, "dark_seer");
        HERO_ID_TO_NAME.put(56, "clinkz");
        HERO_ID_TO_NAME.put(57, "omniknight");
        HERO_ID_TO_NAME.put(58, "enchantress");
        HERO_ID_TO_NAME.put(59, "huskar");
        HERO_ID_TO_NAME.put(60, "night_stalker");
        HERO_ID_TO_NAME.put(61, "broodmother");
        HERO_ID_TO_NAME.put(62, "bounty_hunter");
        HERO_ID_TO_NAME.put(63, "weaver");
        HERO_ID_TO_NAME.put(64, "jakiro");
        HERO_ID_TO_NAME.put(65, "batrider");
        HERO_ID_TO_NAME.put(66, "chen");
        HERO_ID_TO_NAME.put(67, "spectre");
        HERO_ID_TO_NAME.put(68, "ancient_apparition");
        HERO_ID_TO_NAME.put(69, "doom");
        HERO_ID_TO_NAME.put(70, "ursa");
        HERO_ID_TO_NAME.put(71, "spirit_breaker");
        HERO_ID_TO_NAME.put(72, "gyrocopter");
        HERO_ID_TO_NAME.put(73, "alchemist");
        HERO_ID_TO_NAME.put(74, "invoker");
        HERO_ID_TO_NAME.put(75, "silencer");
        HERO_ID_TO_NAME.put(76, "outworld_destroyer");
        HERO_ID_TO_NAME.put(77, "lycan");
        HERO_ID_TO_NAME.put(78, "brewmaster");
        HERO_ID_TO_NAME.put(79, "shadow_demon");
        HERO_ID_TO_NAME.put(80, "lone_druid");
        HERO_ID_TO_NAME.put(81, "chaos_knight");
        HERO_ID_TO_NAME.put(82, "meepo");
        HERO_ID_TO_NAME.put(83, "treant");
        HERO_ID_TO_NAME.put(84, "ogre_magi");
        HERO_ID_TO_NAME.put(85, "undying");
        HERO_ID_TO_NAME.put(86, "rubick");
        HERO_ID_TO_NAME.put(87, "disruptor");
        HERO_ID_TO_NAME.put(88, "nyx_assassin");
        HERO_ID_TO_NAME.put(89, "naga_siren");
        HERO_ID_TO_NAME.put(90, "keeper_of_the_light");
        HERO_ID_TO_NAME.put(91, "io");
        HERO_ID_TO_NAME.put(92, "visage");
        HERO_ID_TO_NAME.put(93, "slark");
        HERO_ID_TO_NAME.put(94, "medusa");
        HERO_ID_TO_NAME.put(95, "troll_warlord");
        HERO_ID_TO_NAME.put(96, "centaur");
        HERO_ID_TO_NAME.put(97, "magnataur");
        HERO_ID_TO_NAME.put(98, "shredder");
        HERO_ID_TO_NAME.put(99, "bristleback");
        HERO_ID_TO_NAME.put(100, "tusk");
        HERO_ID_TO_NAME.put(101, "skywrath_mage");
        HERO_ID_TO_NAME.put(102, "abaddon");
        HERO_ID_TO_NAME.put(103, "elder_titan");
        HERO_ID_TO_NAME.put(104, "legion_commander");
        HERO_ID_TO_NAME.put(105, "techies");
        HERO_ID_TO_NAME.put(106, "ember_spirit");
        HERO_ID_TO_NAME.put(107, "earth_spirit");
        HERO_ID_TO_NAME.put(108, "abyssal_underlord");
        HERO_ID_TO_NAME.put(109, "terrorblade");
        HERO_ID_TO_NAME.put(110, "phoenix");
        HERO_ID_TO_NAME.put(111, "oracle");
        HERO_ID_TO_NAME.put(112, "winter_wyvern");
        HERO_ID_TO_NAME.put(113, "arc_warden");
        HERO_ID_TO_NAME.put(114, "monkey_king");
        HERO_ID_TO_NAME.put(119, "dark_willow");
        HERO_ID_TO_NAME.put(120, "pangolier");
        HERO_ID_TO_NAME.put(121, "grimstroke");
        HERO_ID_TO_NAME.put(123, "hoodwink");
        HERO_ID_TO_NAME.put(126, "void_spirit");
        HERO_ID_TO_NAME.put(128, "snapfire");
        HERO_ID_TO_NAME.put(129, "mars");
        HERO_ID_TO_NAME.put(131, "ringmaster");
        HERO_ID_TO_NAME.put(135, "dawnbreaker");
        HERO_ID_TO_NAME.put(136, "marci");
        HERO_ID_TO_NAME.put(137, "primal_beast");
        HERO_ID_TO_NAME.put(138, "muerta");
    }

    /**
     * Transform ParsedData and raw entries into website-compatible format
     */
    public static WebsiteMatchData fromParsedData(ParsedData parsed, List<Entry> entries) {
        WebsiteMatchData result = new WebsiteMatchData();

        try {
            Gson gson = new Gson();

            // Extract match info from epilogue
            int maxTime = 0;
            boolean radiantWin = true;

            // Track per-player data from final intervals
            Map<Integer, Entry> lastIntervals = new HashMap<>();
            Map<Integer, Integer> playerHeroIds = new HashMap<>();
            Map<Integer, Integer> playerVariants = new HashMap<>();
            Map<Integer, String> playerUnits = new HashMap<>();

            for (Entry e : entries) {
                try {
                    if ("interval".equals(e.type) && e.slot != null) {
                        lastIntervals.put(e.slot, e);
                        if (e.hero_id != null && e.hero_id > 0) {
                            playerHeroIds.put(e.slot, e.hero_id);
                        }
                        if (e.variant != null) {
                            playerVariants.put(e.slot, e.variant);
                        }
                        if (e.unit != null) {
                            playerUnits.put(e.slot, e.unit);
                        }
                        if (e.time != null && e.time > maxTime) {
                            maxTime = e.time;
                        }
                    } else if ("epilogue".equals(e.type)) {
                        // Parse epilogue JSON to get match info
                        if (e.key != null) {
                            try {
                                JsonObject json = JsonParser.parseString(e.key).getAsJsonObject();
                                JsonObject gameInfo = json.getAsJsonObject("gameInfo_");
                                if (gameInfo != null) {
                                    JsonObject dota = gameInfo.getAsJsonObject("dota_");
                                    if (dota != null) {
                                        if (dota.has("matchId_")) {
                                            result.matchId = dota.get("matchId_").getAsLong();
                                        }
                                        if (dota.has("gameWinner_")) {
                                            int winner = dota.get("gameWinner_").getAsInt();
                                            radiantWin = (winner == 2);
                                        }
                                        if (dota.has("radiantTeamId_")) {
                                            result.radiantTeamId = String
                                                    .valueOf(dota.get("radiantTeamId_").getAsLong());
                                        }
                                        if (dota.has("direTeamId_")) {
                                            result.direTeamId = String.valueOf(dota.get("direTeamId_").getAsLong());
                                        }
                                        if (dota.has("picksBans_")) {
                                            try {
                                                com.google.gson.JsonArray pbArray = dota.getAsJsonArray("picksBans_");
                                                for (int i = 0; i < pbArray.size(); i++) {
                                                    JsonObject pbObj = pbArray.get(i).getAsJsonObject();
                                                    PickBan pb = new PickBan();
                                                    pb.hero_id = pbObj.has("heroId_") ? pbObj.get("heroId_").getAsInt()
                                                            : 0;
                                                    pb.is_pick = pbObj.has("isPick_")
                                                            && pbObj.get("isPick_").getAsBoolean();
                                                    pb.team = pbObj.has("team_") ? pbObj.get("team_").getAsInt() : 0;
                                                    pb.order = i + 1;
                                                    result.picks_bans.add(pb);
                                                }
                                            } catch (Exception ex) {
                                                System.err.println("Failed to parse picksBans: " + ex.getMessage());
                                            }
                                        }
                                    }
                                }
                            } catch (Exception ex) {
                                System.err.println("Failed to parse epilogue: " + ex.getMessage());
                            }
                        }
                    }
                } catch (Exception ex) {
                    // Skip problematic entry
                }
            }

            result.duration = maxTime;

            // Priority: Use ParsedData winner (from replay parser), fallback to epilogue
            if (parsed.winner != null && !parsed.winner.isEmpty()) {
                result.winner = parsed.winner;
            } else {
                result.winner = radiantWin ? "Radiant" : "Dire";
            }

            // Use parsed scores
            result.radiantScore = parsed.radiantScore;
            result.direScore = parsed.direScore;

            // Build players array
            for (int slot = 0; slot < 10; slot++) {
                Player player = new Player();
                PlayerData pd = parsed.players.get(slot);
                Entry lastInterval = lastIntervals.get(slot);

                // Basic info
                player.team = slot < 5 ? "Radiant" : "Dire";
                player.heroId = playerHeroIds.getOrDefault(slot, 0);
                player.heroName = getHeroName(player.heroId, playerUnits.get(slot));
                player.facet = playerVariants.getOrDefault(slot, 0);

                // Stats from last interval including player name and steamId
                if (lastInterval != null) {
                    player.name = lastInterval.name != null ? lastInterval.name : "Player " + (slot + 1);
                    // Safely convert longValue to string
                    if (lastInterval.longValue != null) {
                        player.steamId = String.valueOf(lastInterval.longValue);
                    } else {
                        player.steamId = "";
                    }
                    player.level = lastInterval.level != null ? lastInterval.level : 1;
                    player.kills = lastInterval.kills != null ? lastInterval.kills : 0;
                    player.deaths = lastInterval.deaths != null ? lastInterval.deaths : 0;
                    player.assists = lastInterval.assists != null ? lastInterval.assists : 0;
                    player.lastHits = lastInterval.lh != null ? lastInterval.lh : 0;
                    player.denies = lastInterval.denies != null ? lastInterval.denies : 0;
                    player.netWorth = lastInterval.networth != null ? lastInterval.networth : 0;
                }

                // Calculate GPM/XPM from gold_t and xp_t
                try {
                    if (pd.gold_t != null && !pd.gold_t.isEmpty()) {
                        int totalGold = pd.gold_t.get(pd.gold_t.size() - 1);
                        player.gpm = maxTime > 0 ? (int) (totalGold / (maxTime / 60.0)) : 0;
                    }
                    if (pd.xp_t != null && !pd.xp_t.isEmpty()) {
                        int totalXp = pd.xp_t.get(pd.xp_t.size() - 1);
                        player.xpm = maxTime > 0 ? (int) (totalXp / (maxTime / 60.0)) : 0;
                    }
                } catch (Exception ex) {
                    // Keep default 0 values
                }

                // Sum hero damage from damage map
                try {
                    if (pd.damage != null) {
                        for (Map.Entry<String, Integer> dmgEntry : pd.damage.entrySet()) {
                            String target = dmgEntry.getKey();
                            if (target.contains("npc_dota_hero_")) {
                                player.heroDamage += dmgEntry.getValue();
                            } else if (target.contains("_tower") || target.contains("_rax_") ||
                                    target.contains("_fort") || target.contains("_healers")) {
                                player.towerDamage += dmgEntry.getValue();
                            }
                        }
                    }
                } catch (Exception ex) {
                    // Keep default 0
                }

                // Sum healing
                try {
                    if (pd.healing != null) {
                        for (Integer heal : pd.healing.values()) {
                            player.heroHealing += heal;
                        }
                    }
                } catch (Exception ex) {
                    // Keep default 0
                }

                // Extract items
                // Extract items
                try {
                    // Start with items from parser (final state)
                    if (pd.items != null && !pd.items.isEmpty()) {
                        player.items.addAll(pd.items);
                    } else if (pd.purchase_log != null) {
                        // Fallback: Extract from purchase log
                        List<String> allPurchases = new ArrayList<>();
                        for (Map<String, Object> purchase : pd.purchase_log) {
                            String item = (String) purchase.get("key");
                            if (item != null && !item.startsWith("recipe_") && !item.equals("ward_observer")
                                    && !item.equals("ward_sentry") && !item.equals("tango") && !item.equals("clarity")
                                    && !item.equals("enchanted_mango") && !item.equals("faerie_fire")) {
                                allPurchases.add(item);
                            }
                        }
                        int start = Math.max(0, allPurchases.size() - 6);
                        for (int i = start; i < allPurchases.size(); i++) {
                            player.items.add(allPurchases.get(i));
                        }
                    }

                    if (pd.backpack != null && !pd.backpack.isEmpty()) {
                        player.backpack.addAll(pd.backpack);
                    }

                    if (pd.purchase_log != null && !pd.purchase_log.isEmpty()) {
                        player.purchase_log.addAll(pd.purchase_log);
                    }

                    if (pd.neutral_item != null)
                        player.neutral_item = pd.neutral_item;
                    if (pd.aghs_scepter != null)
                        player.aghs_scepter = pd.aghs_scepter;
                    if (pd.aghs_shard != null)
                        player.aghs_shard = pd.aghs_shard;

                } catch (Exception ex) {
                    // Keep empty items
                }

                // Extract positions from lane_pos (format: {"time": {"x": y}})
                try {
                    if (pd.lane_pos != null) {
                        for (Map.Entry<String, HashMap<String, Integer>> timeEntry : pd.lane_pos.entrySet()) {
                            int time = Integer.parseInt(timeEntry.getKey());
                            for (Map.Entry<String, Integer> xyEntry : timeEntry.getValue().entrySet()) {
                                int x = Integer.parseInt(xyEntry.getKey());
                                int y = xyEntry.getValue();
                                player.positions.add(new int[] { time, x, y });
                            }
                        }
                        if (slot == 0) {
                            System.err.println("Player 0 positions count: " + player.positions.size());
                        }
                    }
                } catch (Exception ex) {
                    System.err.println("Failed to extract positions for slot " + slot + ": " + ex.getMessage());
                }

                // Extract ability build and talents
                try {
                    if (pd.ability_upgrades != null) {
                        for (Map<String, Object> upgrade : pd.ability_upgrades) {
                            String ability = (String) upgrade.get("ability");
                            if (ability != null) {
                                player.ability_build.add(ability);
                            }
                        }
                    }
                    if (pd.talents != null) {
                        for (Map<String, Object> talent : pd.talents) {
                            String ability = (String) talent.get("ability");
                            if (ability != null) {
                                player.talents.add(ability);
                            }
                        }
                    }
                } catch (Exception ex) {
                    // Keep empty lists
                }

                result.players.add(player);
            }

            // Extract wards from obs_log and sen_log
            for (int slot = 0; slot < 10; slot++) {
                try {
                    PlayerData pd = parsed.players.get(slot);
                    String team = slot < 5 ? "Radiant" : "Dire";

                    if (pd.obs_log != null) {
                        System.err.println("Player slot " + slot + " obs_log size: " + pd.obs_log.size());
                        for (Entry obs : pd.obs_log) {
                            Ward ward = new Ward();
                            ward.type = "Observer";
                            ward.team = team;
                            ward.time = obs.time != null ? obs.time : 0;
                            System.err.println("Observer ward: time=" + obs.time + ", x=" + obs.x + ", y=" + obs.y);
                            if (obs.x != null && obs.y != null) {
                                ward.x = Math.round(obs.x);
                                ward.y = Math.round(obs.y);
                                result.wards.add(ward);
                            }
                        }
                    }

                    if (pd.sen_log != null) {
                        System.err.println("Player slot " + slot + " sen_log size: " + pd.sen_log.size());
                        for (Entry sen : pd.sen_log) {
                            Ward ward = new Ward();
                            ward.type = "Sentry";
                            ward.team = team;
                            ward.time = sen.time != null ? sen.time : 0;
                            System.err.println("Sentry ward: time=" + sen.time + ", x=" + sen.x + ", y=" + sen.y);
                            if (sen.x != null && sen.y != null) {
                                ward.x = Math.round(sen.x);
                                ward.y = Math.round(sen.y);
                                result.wards.add(ward);
                            }
                        }
                    }
                } catch (Exception ex) {
                    System.err.println("Ward extraction error for slot " + slot + ": " + ex.getMessage());
                }
            }

            // Extract picks/bans from draft_timings
            try {
                if (parsed.draft_timings != null) {
                    for (Object dt : parsed.draft_timings) {
                        try {
                            String json = gson.toJson(dt);
                            JsonObject obj = JsonParser.parseString(json).getAsJsonObject();
                            PickBan pb = new PickBan();
                            pb.hero_id = obj.has("hero_id") ? obj.get("hero_id").getAsInt() : 0;
                            pb.is_pick = obj.has("pick") && obj.get("pick").getAsBoolean();
                            pb.team = obj.has("draft_active_team") ? obj.get("draft_active_team").getAsInt() : 2;
                            pb.order = obj.has("draft_order") ? obj.get("draft_order").getAsInt() : 0;
                            result.picks_bans.add(pb);
                        } catch (Exception ex) {
                            // Skip malformed entries
                        }
                    }
                }
            } catch (Exception ex) {
                // Keep empty picks_bans
            }

        } catch (

        Exception ex) {
            System.err.println("Error in WebsiteMatchData.fromParsedData: " + ex.getMessage());
            ex.printStackTrace();
        }

        return result;
    }

    /**
     * Get hero name from ID or unit name
     */
    private static String getHeroName(int heroId, String unitName) {
        // First try ID lookup
        if (HERO_ID_TO_NAME.containsKey(heroId)) {
            return HERO_ID_TO_NAME.get(heroId);
        }

        // Fall back to parsing unit name (CDOTA_Unit_Hero_AntiMage -> antimage)
        if (unitName != null && unitName.startsWith("CDOTA_Unit_Hero_")) {
            String heroName = unitName.substring("CDOTA_Unit_Hero_".length());
            // Convert PascalCase to lowercase
            return heroName.toLowerCase().replace("_", "");
        }

        return "unknown";
    }
}
