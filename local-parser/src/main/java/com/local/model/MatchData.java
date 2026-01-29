
package com.local.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class MatchData {
    public long matchId;
    public String winner;
    public float duration;
    public List<Player> players = new ArrayList<>();
    public List<PickBan> picks_bans = new ArrayList<>();
    public List<Ward> wards = new ArrayList<>();
    public List<CombatEvent> events = new ArrayList<>();
    public Map<Integer, Integer> facets;
    public TeamStats radiant_stats;
    public TeamStats dire_stats;

    public static class Player {
        public String steamId;
        public String name;
        public String team;
        public int heroId;
        public String heroName;
        public int level;
        public int facet;
        public int kills;
        public int deaths;
        public int assists;
        public int lastHits;
        public int denies;
        public int gold;
        public int netWorth;
        public int gpm;
        public int xpm;
        public int heroDamage;
        public int towerDamage;
        public int heroHealing;
        public List<String> items = new ArrayList<>();
        public List<ItemPurchase> item_purchase_log = new ArrayList<>();
        public List<AbilityUpgrade> ability_upgrades = new ArrayList<>();
        public List<AbilityLevel> abilities = new ArrayList<>();
        public List<int[]> positions = new ArrayList<>(); // [time, x, y]
        public List<Integer> gold_recap = new ArrayList<>(); // gold at each minute
        public List<Integer> xp_recap = new ArrayList<>(); // xp at each minute
        public int stacks;
        public int neutral_tokens;
        public int tormentor_kills;
    }

    public static class PickBan {
        public boolean is_pick;
        public int hero_id;
        public int team;
        public int order;
    }

    public static class Ward {
        public String type; // Observer, Sentry
        public int x;
        public int y;
        public String team;
        public float time;
        public Integer owner;
    }

    public static class CombatEvent {
        public String type; // kill, buyback, tower_kill, etc.
        public float time;
        public Map<String, Object> data;
    }

    public static class ItemPurchase {
        public String item;
        public float time;
    }

    public static class AbilityUpgrade {
        public String name;
        public float time;
        public int level;
    }

    public static class AbilityLevel {
        public String name;
        public int level;
    }

    public static class TeamStats {
        public List<Integer> gold_adv = new ArrayList<>();
        public List<Integer> xp_adv = new ArrayList<>();
        public int tower_kills;
        public int roshan_kills;
    }
}
