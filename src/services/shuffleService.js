// Shuffle Tournament Service - Team Balancing Algorithm
import { supabase } from '../lib/supabase';
import { sendDiscordWebhook, formatLfgPlayerEmbed, formatShuffleTeamsEmbed, DISCORD_AVATARS } from './discordService';

const DISCORD_WEBHOOK_LFG = import.meta.env.VITE_DISCORD_WEBHOOK_LFG;

export const SHUFFLE_LOGO = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/meepo.png";

/**
 * Fetch all approved shuffle players
 */
export const getApprovedShufflePlayers = async () => {
    const { data, error } = await supabase
        .from('shuffle_players')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching shuffle players:', error);
        return [];
    }

    return data || [];
};

/**
 * Fetch all pending shuffle players for admin approval
 */
export const getPendingShufflePlayers = async () => {
    const { data, error } = await supabase
        .from('shuffle_players')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching pending players:', error);
        return [];
    }

    return data || [];
};

/**
 * Approve a shuffle player and send Discord notification
 */
export const approveShufflePlayer = async (playerId) => {
    // First update status
    const { data: player, error: updateError } = await supabase
        .from('shuffle_players')
        .update({ status: 'approved' })
        .eq('id', playerId)
        .select()
        .single();

    if (updateError) {
        console.error('Error approving player:', updateError);
        throw updateError;
    }

    // Send Discord notification
    if (DISCORD_WEBHOOK_LFG && player) {
        try {
            const shuffleUrl = `${window.location.origin}/shuffle`;
            const embed = formatLfgPlayerEmbed(player, shuffleUrl);
            await sendDiscordWebhook(
                DISCORD_WEBHOOK_LFG,
                `🎯 **NOVI IGRAČ TRAŽI EKIPU**`,
                embed,
                DISCORD_AVATARS.LFG
            );
        } catch (err) {
            console.error('Error sending Discord notification:', err);
        }
    }

    return player;
};

/**
 * Reject a shuffle player
 */
export const rejectShufflePlayer = async (playerId) => {
    const { error } = await supabase
        .from('shuffle_players')
        .update({ status: 'rejected' })
        .eq('id', playerId);

    if (error) {
        console.error('Error rejecting player:', error);
        throw error;
    }
};

/**
 * Generate balanced teams from approved players
 * 
 * Algorithm:
 * 1. Sort players by number of preferred positions (fewer = more strict preference)
 * 2. Assign players with fewer position options first
 * 3. Balance teams by total rank
 * 
 * @param {Array} players - Approved players with preferred_positions and rank_tier
 * @param {number} minTeams - Minimum teams to form (default: 2)
 * @returns {Object} { teams: Array<Team>, unassigned: Array<Player> }
 */
export const generateBalancedTeams = (players, minTeams = 2) => {
    if (players.length < minTeams * 5) {
        return {
            error: `Potrebno je minimum ${minTeams * 5} igrača za ${minTeams} tima. Trenutno: ${players.length}`,
            teams: [],
            unassigned: players
        };
    }

    const numTeams = Math.floor(players.length / 5);
    const teams = Array.from({ length: numTeams }, (_, i) => ({
        id: i + 1,
        name: `Tim ${i + 1}`,
        players: [],
        positions: { 1: null, 2: null, 3: null, 4: null, 5: null },
        totalRank: 0
    }));

    // Sort players by flexibility (fewer options = assign first)
    const sortedPlayers = [...players].sort((a, b) => {
        return a.preferred_positions.length - b.preferred_positions.length;
    });

    const assignedPlayerIds = new Set();

    // PHASE 1: Assign players with strict preferences (1-2 positions)
    for (const player of sortedPlayers) {
        if (player.preferred_positions.length > 2) continue;
        if (assignedPlayerIds.has(player.id)) continue;

        const assigned = tryAssignPlayer(player, teams, assignedPlayerIds);
        if (!assigned) {
            console.log(`Could not assign strict player: ${player.persona_name}`);
        }
    }

    // PHASE 2: Assign remaining players (flexible)
    for (const player of sortedPlayers) {
        if (assignedPlayerIds.has(player.id)) continue;

        const assigned = tryAssignPlayer(player, teams, assignedPlayerIds);
        if (!assigned) {
            console.log(`Could not assign flexible player: ${player.persona_name}`);
        }
    }

    // Identify unassigned players
    const unassigned = players.filter(p => !assignedPlayerIds.has(p.id));

    // Calculate team completeness
    const completedTeams = teams.filter(t =>
        t.positions[1] && t.positions[2] && t.positions[3] && t.positions[4] && t.positions[5]
    );

    return {
        teams: completedTeams,
        incompleteTeams: teams.filter(t =>
            !(t.positions[1] && t.positions[2] && t.positions[3] && t.positions[4] && t.positions[5])
        ),
        unassigned,
        stats: {
            totalPlayers: players.length,
            assignedCount: assignedPlayerIds.size,
            completeTeams: completedTeams.length,
            avgTeamRank: completedTeams.length > 0
                ? Math.round(completedTeams.reduce((sum, t) => sum + t.totalRank / 5, 0) / completedTeams.length)
                : 0
        }
    };
};

/**
 * Try to assign a player to the team that needs that position most
 */
function tryAssignPlayer(player, teams, assignedPlayerIds) {
    // Sort teams by total rank (lowest first for balance)
    const sortedTeams = [...teams].sort((a, b) => a.totalRank - b.totalRank);

    for (const position of player.preferred_positions) {
        // Find team that needs this position, prioritize lowest rank teams
        for (const team of sortedTeams) {
            if (!team.positions[position]) {
                // Assign player
                team.positions[position] = {
                    ...player,
                    assigned_position: position
                };
                team.players.push({
                    ...player,
                    assigned_position: position
                });
                team.totalRank += player.rank_tier || 0;
                assignedPlayerIds.add(player.id);
                return true;
            }
        }
    }

    return false;
}

/**
 * Manually move a player to a different team/position
 */
export const movePlayerToTeam = (teams, playerId, targetTeamId, targetPosition) => {
    // Deep clone teams
    const newTeams = JSON.parse(JSON.stringify(teams));

    // Find and remove player from current team
    let player = null;
    for (const team of newTeams) {
        for (let pos = 1; pos <= 5; pos++) {
            if (team.positions[pos]?.id === playerId) {
                player = { ...team.positions[pos] };
                team.totalRank -= player.rank_tier || 0;
                team.positions[pos] = null;
                team.players = team.players.filter(p => p.id !== playerId);
                break;
            }
        }
        if (player) break;
    }

    if (!player) return { error: 'Player not found', teams };

    // Add to target team
    const targetTeam = newTeams.find(t => t.id === targetTeamId);
    if (!targetTeam) return { error: 'Target team not found', teams };

    if (targetTeam.positions[targetPosition]) {
        return { error: `Position ${targetPosition} is already occupied`, teams };
    }

    player.assigned_position = targetPosition;
    targetTeam.positions[targetPosition] = player;
    targetTeam.players.push(player);
    targetTeam.totalRank += player.rank_tier || 0;

    return { teams: newTeams, success: true };
};

/**
 * Reset all shuffle players (clear assigned teams)
 */
export const resetShufflePlayers = async () => {
    const { error } = await supabase
        .from('shuffle_players')
        .update({
            assigned_position: null,
            assigned_team_id: null,
            status: 'approved' // Reset to approved if they were assigned
        })
        .eq('status', 'assigned');

    if (error) {
        console.error('Error resetting shuffle players:', error);
        throw error;
    }
};

/**
 * Get confirmed shuffle teams from storage
 */
export const getConfirmedShuffleTeams = async () => {
    const { data, error } = await supabase
        .from('shuffle_teams')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error fetching confirmed teams:', error);
        return null;
    }

    return data?.teams || null;
};

/**
 * Confirm shuffle teams - save to database and send Discord notification
 */
export const confirmShuffleTeams = async (teams) => {
    // Save teams to shuffle_teams table
    const { error: insertError } = await supabase
        .from('shuffle_teams')
        .insert([{
            teams: teams,
            created_at: new Date().toISOString()
        }]);

    if (insertError) {
        console.error('Error saving teams:', insertError);
        throw insertError;
    }

    // Update all assigned players' status
    for (const team of teams) {
        for (let pos = 1; pos <= 5; pos++) {
            const player = team.positions[pos];
            if (player) {
                await supabase
                    .from('shuffle_players')
                    .update({
                        status: 'assigned',
                        assigned_team_id: team.id,
                        assigned_position: pos
                    })
                    .eq('id', player.id);
            }
        }
    }

    // Send Discord notification
    if (DISCORD_WEBHOOK_LFG) {
        try {
            const shuffleUrl = `${window.location.origin}/shuffle`;
            const embed = formatShuffleTeamsEmbed(teams, shuffleUrl);
            await sendDiscordWebhook(
                DISCORD_WEBHOOK_LFG,
                `🎲 **SHUFFLE TIMOVI FORMIRANI!**`,
                embed,
                DISCORD_AVATARS.LFG
            );
        } catch (err) {
            console.error('Error sending Discord notification:', err);
        }
    }

    return { success: true };
};

/**
 * Register a shuffle team as a regular team to make it compatible with tournament system
 */
export const registerShuffleTeam = async (shuffleTeam) => {
    // Format players for the teams table structure
    const players = [1, 2, 3, 4, 5].map(pos => {
        const p = shuffleTeam.positions[pos];
        if (!p) return null;
        return {
            personaName: p.persona_name,
            accountId: p.steam_account_id,
            steamId: p.steam_id,
            avatar: p.avatar,
            rankTier: p.rank_tier,
            winrate: p.winrate,
            position: pos,
            isCaptain: pos === 1
        };
    }).filter(Boolean);

    // We use a unique-ish name for the teams table to avoid simple name collisions
    // but the displayed name can remain "Tim 1"
    const { data: newTeam, error } = await supabase
        .from('teams')
        .insert([{
            id: `shuffle_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: shuffleTeam.name,
            logo: SHUFFLE_LOGO,
            players: players,
            stats: {
                type: 'shuffle',
                registered_at: new Date().toISOString(),
                wins: 0,
                losses: 0,
                winrate: 0,
                matchesPlayed: []
            }
        }])
        .select()
        .single();

    if (error) {
        console.error('Error registering shuffle team:', error);
        throw error;
    }

    return newTeam;
};

/**
 * Reset shuffle state - sets players to idle to require re-registration for next tournament
 */
export const resetShuffleState = async () => {
    // 1. Reset players to idle and clear their assignments
    const { error: playerError } = await supabase
        .from('shuffle_players')
        .update({
            status: 'idle',
            assigned_position: null,
            assigned_team_id: null
        })
        .neq('status', 'rejected'); // Don't reset rejected players

    if (playerError) {
        console.error('Error resetting shuffle players:', playerError);
        throw playerError;
    }

    // 2. Clear all confirmed team formations (Shuffle Page)
    const { error: teamError } = await supabase
        .from('shuffle_teams')
        .delete()
        .not('id', 'is', null);

    if (teamError) {
        console.error('Error clearing shuffle team formations:', teamError);
        throw teamError;
    }

    // 3. Delete all temporary shuffle teams from the main teams table (Admin Panel)
    const { error: mainTeamsError } = await supabase
        .from('teams')
        .delete()
        .eq('stats->>type', 'shuffle');

    if (mainTeamsError) {
        console.error('Error clearing main teams table of shuffle entries:', mainTeamsError);
    }

    return { success: true };
};

/**
 * Get a map of all player trophies by steam_id
 */
export const getShuffleTrophiesMap = async () => {
    const { data, error } = await supabase
        .from('shuffle_players')
        .select('steam_id, trophies')
        .not('trophies', 'is', null);

    if (error) {
        console.error('Error fetching trophies map:', error);
        return {};
    }

    const map = {};
    data.forEach(p => {
        if (p.trophies && p.trophies.length > 0) {
            map[p.steam_id] = p.trophies;
        }
    });
    return map;
};

