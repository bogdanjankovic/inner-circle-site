import java.util.List;
import java.util.Map;

public class OpenDotaDataModel {
    
    // Root level match data
    public int version;
    public long match_id;
    public List<Teamfight> teamfights;
    public List<Player> players;
    public int leagueid;
    public long start_time;
    public int duration;
    public int series_id;
    public int series_type;
    public int cluster;
    public int replay_salt;
    public boolean radiant_win;
    public int pre_game_duration;
    public long match_seq_num;
    public int tower_status_radiant;
    public int tower_status_dire;
    public int barracks_status_radiant;
    public int barracks_status_dire;
    public int first_blood_time;
    public int lobby_type;
    public int human_players;
    public int game_mode;
    public int flags;
    public int engine;
    public int radiant_score;
    public int dire_score;
    public Integer radiant_team_id;
    public String radiant_name;
    public Long radiant_logo;
    public int radiant_team_complete;
    public Integer dire_team_id;
    public String dire_name;
    public Long dire_logo;
    public int dire_team_complete;
    public Integer radiant_captain;
    public Integer dire_captain;
    public List<PickBan> picks_bans;
    public OdData od_data;
    public League league;
    public RadiantTeam radiant_team;
    public String replay_url;
    public int patch;
    public int region;
    public Map<String, Integer> all_word_counts;
    public Map<String, Integer> my_word_counts;
    public int throw_val;
    public int loss;
    
    // Nested classes matching OpenDota structure
    
    public static class Teamfight {
        public int start;
        public int end;
        public int last_death;
        public int deaths;
        public List<TeamfightPlayer> players;
    }
    
    public static class TeamfightPlayer {
        public Map<String, Integer> deaths_pos;
        public Map<String, Integer> ability_uses;
        public Map<String, Integer> ability_targets;
        public Map<String, Integer> item_uses;
        public Map<String, Integer> killed;
        public int deaths;
        public int buybacks;
        public int damage;
        public int healing;
        public int gold_delta;
        public int xp_delta;
        public int xp_start;
        public int xp_end;
    }
    
    public static class Player {
        public int account_id;
        public int player_slot;
        public int hero_id;
        public int kills;
        public int deaths;
        public int assists;
        public int last_hits;
        public int denies;
        public int gold_per_min;
        public int xp_per_min;
        public int level;
        public int net_worth;
        public int total_gold;
        public int total_xp;
        public int gold_spent;
        public int hero_damage;
        public int tower_damage;
        public int hero_healing;
        public int damage_taken;
        public int damage_inflictor_received;
        public int last_hit_time;
        public int buyback_count;
        public int observer_uses;
        public int sentry_uses;
        public int lane_efficiency_pct;
        public int support_gold_pmin;
        public int camps_stacked;
        public int runes_pickups;
        public int teamfight_participation;
        public int towers_killed;
        public int roshan_kills;
        public int first_blood_claimed;
        public int first_blood_assist;
        public int first_blood_time;
        public int couriers_killed;
        public int nutrients;
        public int actions_per_min;
        public int pings;
        public int stuns;
        public double longest_lobby_time;
        public int lane;
        public int lane_role;
        public int roshan_kills_time;
        public int teamfight_participation_count;
        public int trilane_lane;
        public int trilane_lane_role;
        public int party_id;
        public int party_size;
        public int purchase;
        public int purchase_time;
        public int gold;
        public int gold_t;
        public int gold_lost;
        public int gold_lost_t;
        public int gold_rel;
        public int gold_rel_t;
        public int xp;
        public int xp_t;
        public int xp_rel;
        public int xp_rel_t;
        public int lh;
        public int lh_t;
        public int dn;
        public int dn_t;
        public int lh_rel;
        public int lh_rel_t;
        public int dn_rel;
        public int dn_rel_t;
        public List<AbilityUpgrade> ability_upgrades;
        public List<PermanentBuff> permanent_buffs;
        public List<AdditionalUnit> additional_units;
        public List<BuybackLog> buyback_log;
        public List<Item> item_0;
        public List<Item> item_1;
        public List<Item> item_2;
        public List<Item> item_3;
        public List<Item> item_4;
        public List<Item> item_5;
        public List<Item> backpack_0;
        public List<Item> backpack_1;
        public List<Item> backpack_2;
        public List<Item> item_neutral;
        public Benchmarks benchmarks;
    }
    
    public static class AbilityUpgrade {
        public int ability;
        public int time;
        public int level;
    }
    
    public static class PermanentBuff {
        public int permanent_buff;
        public int stack_count;
        public int grantor_pindex;
        public String grantor_player_slot;
    }
    
    public static class AdditionalUnit {
        public String unitname;
        public int item_0;
        public int item_1;
        public int item_2;
        public int item_3;
        public int item_4;
        public int item_5;
        public int backpack_0;
        public int backpack_1;
        public int backpack_2;
        public int item_neutral;
    }
    
    public static class BuybackLog {
        public int time;
        public int slot;
        public int gold;
        public int net_worth;
    }
    
    public static class Item {
        public int id;
        public String name;
        public int charges;
        public int cooldown;
        public int acquire_time;
    }
    
    public static class Benchmarks {
        public Benchmark gold_per_min;
        public Benchmark xp_per_min;
        public Benchmark kills_per_min;
        public Benchmark last_hits_per_min;
        public Benchmark hero_damage_per_min;
        public Benchmark hero_healing_per_min;
        public Benchmark tower_damage;
    }
    
    public static class Benchmark {
        public int raw;
        public double pct;
    }
    
    public static class PickBan {
        public boolean is_pick;
        public int hero_id;
        public int team;
        public int order;
    }
    
    public static class OdData {
        public boolean has_api;
        public boolean has_gcdata;
        public boolean has_parsed;
        public boolean has_archive;
    }
    
    public static class League {
        public int leagueid;
        public String tier;
        public String name;
    }
    
    public static class RadiantTeam {
        public int team_id;
        public String name;
        public String tag;
    }
}
