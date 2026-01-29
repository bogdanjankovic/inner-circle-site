import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TournamentContext = createContext();

export const TournamentProvider = ({ children }) => {
    const [teams, setTeams] = useState([]);
    const [pendingTeams, setPendingTeams] = useState([]);
    const [matchHistory, setMatchHistory] = useState([]);
    const [tournamentStats, setTournamentStats] = useState({});

    // In-memory (not DB) for now, as tournaments are transient in this logic
    const [tournaments, setTournaments] = useState([]);
    const [activeTournament, setActiveTournament] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: teamsData } = await supabase.from('teams').select('*');
            if (teamsData) setTeams(teamsData);

            const { data: pendingData } = await supabase.from('pending_teams').select('*');
            if (pendingData) setPendingTeams(pendingData);

            // Fetch Tournaments FIRST to use for Trophies
            let fetchedTournaments = [];
            const { data: tourneyData } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
            if (tourneyData) {
                fetchedTournaments = tourneyData;
                setTournaments(tourneyData);
                const active = tourneyData.find(t => t.status === 'active');
                if (active) setActiveTournament(active);
            }

            const { data: matchesData } = await supabase.from('matches').select('*').order('timestamp', { ascending: false });
            if (matchesData) {
                const flatMatches = matchesData.map(m => ({
                    ...m.data, // Spread the original JSON
                    matchId: m.match_id, // Ensure ID consistency
                    winner: m.winner, // Use top-level column which is editable
                    radiantTeamId: m.radiant_team_id, // Use top-level column
                    direTeamId: m.dire_team_id, // Use top-level column
                    createdAt: m.created_at // Use creation date as fallback
                }));
                setMatchHistory(flatMatches);
                recalculateStats(flatMatches, teamsData, fetchedTournaments);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };




    const recalculateStats = (history, teamsOverride = null, tournamentsOverride = null) => {
        // 1. Player Stats
        const newStats = {};

        // 2. Team Stats Accumulators
        const currentTeams = teamsOverride || teams;
        const currentTournaments = tournamentsOverride || tournaments;

        const teamStatsMap = {};
        currentTeams.forEach(t => {
            teamStatsMap[t.id] = { wins: 0, losses: 0, matchesPlayed: [], trophies: [] };

            // Calculate Trophies
            if (currentTournaments) {
                const teamTrophies = currentTournaments.filter(tourney =>
                    tourney.status === 'archived' &&
                    tourney.winner === t.id // Assuming 'winner' column holds team ID
                );
                teamStatsMap[t.id].trophies = teamTrophies;
            }
        });

        // Match Logic
        history.forEach(match => {
            // Normalize IDs to strings for loose comparison
            const winnerStr = match.winner ? match.winner.toString() : null;
            const radiantIdStr = match.radiantTeamId ? match.radiantTeamId.toString() : null;
            const direIdStr = match.direTeamId ? match.direTeamId.toString() : null;

            let winningTeamId = null;
            let losingTeamId = null;

            if (winnerStr === radiantIdStr || winnerStr === 'Radiant') {
                winningTeamId = match.radiantTeamId;
                losingTeamId = match.direTeamId;
            } else if (winnerStr === direIdStr || winnerStr === 'Dire') {
                winningTeamId = match.direTeamId;
                losingTeamId = match.radiantTeamId;
            }

            if (winningTeamId && teamStatsMap[winningTeamId]) {
                teamStatsMap[winningTeamId].wins += 1;
                teamStatsMap[winningTeamId].matchesPlayed.push(match.matchId || match.match_id);
            }
            if (losingTeamId && teamStatsMap[losingTeamId]) {
                teamStatsMap[losingTeamId].losses += 1;
                teamStatsMap[losingTeamId].matchesPlayed.push(match.matchId || match.match_id);
            }

            // Player Logic
            if (!match.players) return;
            match.players.forEach(p => {
                const tid = p.steamId || p.steamid || p.account_id?.toString() || p.tournamentPlayerId;
                if (!tid) return;

                if (!newStats[tid]) {
                    newStats[tid] = {
                        matches: 0,
                        kills: 0, deaths: 0, assists: 0,
                        gpm: 0, xpm: 0,
                        heroDamage: 0, towerDamage: 0, heroHealing: 0,
                        roshansKilled: 0, towersKilled: 0, tormentorsKilled: 0,
                        runesActivated: 0, neutralTokens: 0,
                        lastHits: 0, denies: 0, netWorth: 0,
                        obsPlaced: 0, senPlaced: 0, obsKilled: 0, senKilled: 0,
                        matchHistory: [] // Store individual match results for history view
                    };
                }

                const s = newStats[tid];
                s.matches += 1;
                s.kills += (p.kills || 0);
                s.deaths += (p.deaths || 0);
                s.assists += (p.assists || 0);
                s.gpm += (p.gpm || 0);
                s.xpm += (p.xpm || 0);
                s.lastHits += (p.lastHits || 0);
                s.denies += (p.denies || 0);
                s.netWorth += (p.netWorth || 0);

                s.heroDamage += (p.heroDamage || p.hero_damage || 0);
                s.heroHealing += (p.heroHealing || p.hero_healing || 0);
                s.towerDamage += (p.towerDamage || p.tower_damage || 0);
                s.roshansKilled += (p.roshans || p.roshan_kills || 0);
                s.towersKilled += (p.towersKilled || p.tower_kills || 0);
                s.tormentorsKilled += (p.tormentorsKilled || 0);
                s.runesActivated += (p.runesActivated || p.rune_pickups || 0);
                s.neutralTokens += (p.neutralTokens || 0);

                s.obsPlaced += (p.obs_placed || 0);
                s.senPlaced += (p.sen_placed || 0);
                s.obsKilled += (p.obs_destroyed || 0);
                s.senKilled += (p.sen_destroyed || 0);

                // Add match summary to history
                s.matchHistory.push({
                    matchId: match.matchId || match.match_id,
                    heroId: p.heroId || p.hero_id,
                    heroName: p.heroName,
                    kills: p.kills || 0,
                    deaths: p.deaths || 0,
                    assists: p.assists || 0,
                    winner: match.winner,
                    playerTeam: p.team,
                    isWin: (match.winner === p.team),
                    timestamp: match.timestamp,
                    duration: match.duration,
                    gpm: p.gpm || p.gold_per_min || 0,
                    xpm: p.xpm || p.xp_per_min || 0
                });
            });
        });

        // Calculate averages for player stats
        Object.keys(newStats).forEach(tid => {
            const s = newStats[tid];
            if (s.matches > 0) {
                s.avgKills = (s.kills / s.matches).toFixed(1);
                s.avgDeaths = (s.deaths / s.matches).toFixed(1);
                s.avgAssists = (s.assists / s.matches).toFixed(1);
                s.avgGpm = Math.round(s.gpm / s.matches);
                s.avgXpm = Math.round(s.xpm / s.matches);
                s.avgLastHits = Math.round(s.lastHits / s.matches);
                s.avgDenies = Math.round(s.denies / s.matches);
                s.avgHeroDamage = Math.round(s.heroDamage / s.matches);
                s.avgHeroHealing = Math.round(s.heroHealing / s.matches);
                s.avgTowerDamage = Math.round(s.towerDamage / s.matches);
                s.avgObsPlaced = (s.obsPlaced / s.matches).toFixed(1);
                s.avgSenPlaced = (s.senPlaced / s.matches).toFixed(1);
                s.avgObsKilled = (s.obsKilled / s.matches).toFixed(1);
                s.avgSenKilled = (s.senKilled / s.matches).toFixed(1);

                // Sort history by timestamp descending
                s.matchHistory.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            }
        });

        // Apply Team Stats to State
        setTeams(prevTeams => prevTeams.map(t => {
            const stats = teamStatsMap[t.id] || { wins: 0, losses: 0, matchesPlayed: [], trophies: [] };
            const total = stats.wins + stats.losses;
            const winrate = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : 0;
            return {
                ...t,
                trophies: stats.trophies || [], // Attach trophies here
                stats: {
                    ...t.stats,
                    ...stats,
                    winrate
                }
            };
        }));

        setTournamentStats(newStats);
    };

    const registerTeam = async (teamData) => {
        const newTeam = {
            id: Date.now().toString(),
            name: teamData.name,
            logo: teamData.logo || 'https://placehold.co/150?text=Team',
            players: teamData.players,
            captain_id: teamData.captainId,
            stats: { wins: 0, losses: 0, winrate: 0, matchesPlayed: [] }
        };

        const { error } = await supabase.from('pending_teams').insert([newTeam]);

        if (error) {
            console.error("Error registering team:", error);
            alert("Error registering team.");
        } else {
            setPendingTeams((prev) => [...prev, newTeam]);
        }
        return newTeam;
    };

    const approveTeam = async (teamId) => {
        const teamToApprove = pendingTeams.find(t => t.id === teamId);
        if (teamToApprove) {
            // Transaction-like: Insert to teams, delete from pending
            const { error: insertError } = await supabase.from('teams').insert([teamToApprove]);
            if (!insertError) {
                await supabase.from('pending_teams').delete().eq('id', teamId);
                setTeams(prev => [...prev, teamToApprove]);
                setPendingTeams(prev => prev.filter(t => t.id !== teamId));
            }
        }
    };

    const rejectTeam = async (teamId) => {
        await supabase.from('pending_teams').delete().eq('id', teamId);
        setPendingTeams(prev => prev.filter(t => t.id !== teamId));
    };

    const deleteTeam = async (teamId) => {
        if (window.confirm('POTVRDA BRISANJA: Da li ste sigurni? Ovo je nepovratno.')) {
            await supabase.from('teams').delete().eq('id', teamId);
            setTeams(prev => prev.filter(t => t.id !== teamId));
        }
    };

    const updateTeam = async (teamId, updatedData) => {
        // Optimistic update
        setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...updatedData } : t));
        await supabase.from('teams').update(updatedData).eq('id', teamId);
    };

    // --- Matches ---

    const processMatchStats = async (matchData, skipAutoLink = false) => {
        if (!matchData || !matchData.players) return;

        // Check deduplication in state first
        if (matchData.matchId && matchHistory.some(m => m.matchId === matchData.matchId?.toString())) {
            alert("Match already exists!");
            return;
        }

        // Prepare for DB
        const matchRow = {
            match_id: matchData.matchId.toString(),
            winner: matchData.winner,
            timestamp: matchData.timestamp,
            duration: matchData.duration,
            radiant_team_id: matchData.radiantTeamId,
            dire_team_id: matchData.direTeamId,
            data: {
                ...matchData,
                radiantTeamName: teams.find(t => t.id === matchData.radiantTeamId)?.name || 'Radiant',
                direTeamName: teams.find(t => t.id === matchData.direTeamId)?.name || 'Dire'
            }
        };

        const { error } = await supabase.from('matches').insert([matchRow]);

        if (error) {
            console.error("Error adding match:", error);
            alert("Error saving match to database.");
        } else {
            const newHistory = [matchData, ...matchHistory];
            setMatchHistory(newHistory);
            recalculateStats(newHistory);

            // AUTO-LINKING TO TOURNAMENT
            if (!skipAutoLink && activeTournament) {
                const rId = matchData.radiantTeamId ? matchData.radiantTeamId.toString() : null;
                const dId = matchData.direTeamId ? matchData.direTeamId.toString() : null;

                if (rId && dId) {
                    const bracketMatch = activeTournament.bracket_data.find(m => {
                        if (m.winner) return false; // Already finished in bracket? Maybe update anyway? Let's skip if strictly finished.
                        if (!m.team1 || !m.team2) return false;
                        const t1 = m.team1.id.toString();
                        const t2 = m.team2.id.toString();
                        // Check both permutations
                        return (t1 === rId && t2 === dId) || (t1 === dId && t2 === rId);
                    });

                    if (bracketMatch) {
                        console.log("Found matching tournament match! Auto-linking...", bracketMatch);
                        await linkMatchToTournament(activeTournament.id, bracketMatch.matchId, matchData);
                        alert("Utakmica uspešno sačuvana I automatski povezana sa aktivnim turnirom!");
                        return;
                    }
                }
            }

            alert("Utakmica uspesno sačuvana!");
        }
    };

    const deleteMatch = async (matchId) => {
        if (window.confirm("DA LI STE SIGURNI? Ovo će obrisati meč i ponovo izračunati statistiku.")) {
            const { error } = await supabase.from('matches').delete().eq('match_id', matchId.toString());
            if (!error) {
                const newHistory = matchHistory.filter(m => m.matchId.toString() !== matchId.toString());
                setMatchHistory(newHistory);
                recalculateStats(newHistory);
            }
        }
    };

    const bulkDeleteMatches = async (matchIds) => {
        if (!matchIds || matchIds.length === 0) return;

        if (window.confirm(`DA LI STE SIGURNI? Ovo će obrisati ${matchIds.length} izabranih mečeva i ponovo izračunati statistiku.`)) {
            const stringIds = matchIds.map(id => id.toString());
            const { error } = await supabase.from('matches').delete().in('match_id', stringIds);

            if (!error) {
                const newHistory = matchHistory.filter(m => !stringIds.includes(m.matchId.toString()));
                setMatchHistory(newHistory);
                recalculateStats(newHistory);
                return true;
            } else {
                console.error("Error bulk deleting matches:", error);
                alert("Greška pri brisanju mečeva.");
                return false;
            }
        }
        return false;
    };

    // --- Tournaments ---

    const fetchTournaments = async () => {
        const { data } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
        if (data) {
            setTournaments(data);
            const active = data.find(t => t.status === 'active');
            setActiveTournament(active || null);
        }
    };

    // Helper to advance bracket
    const advanceBracket = (bracket, matchId, winnerTeamId) => {
        const newBracket = [...bracket];
        const matchIndex = newBracket.findIndex(m => m.matchId.toString() === matchId.toString());
        if (matchIndex === -1) return newBracket;

        const finishedMatch = newBracket[matchIndex];

        // Ensure winner is set on the match
        newBracket[matchIndex] = {
            ...finishedMatch,
            winner: winnerTeamId
        };

        if (!finishedMatch.nextMatchId) return newBracket;

        const nextMatchIndex = newBracket.findIndex(m => m.matchId === finishedMatch.nextMatchId);
        if (nextMatchIndex !== -1) {
            // Find the full team object
            let winningTeamObj = null;
            if (finishedMatch.team1 && finishedMatch.team1.id.toString() === winnerTeamId.toString()) {
                winningTeamObj = finishedMatch.team1;
            } else if (finishedMatch.team2 && finishedMatch.team2.id.toString() === winnerTeamId.toString()) {
                winningTeamObj = finishedMatch.team2;
            }

            if (winningTeamObj) {
                // Place into next match
                // Logic: If team1 is empty, put there. Else if team2 is empty, put there. 
                // Determine slot consistency? 
                // For a specific match, usually the "top" feeder goes to Team 1 and "bottom" feeder to Team 2.
                // But without explicit slot mapping, first-come-first-served is acceptable for now.
                const nextMatch = newBracket[nextMatchIndex];
                if (!nextMatch.team1) {
                    newBracket[nextMatchIndex] = { ...nextMatch, team1: winningTeamObj };
                } else if (!nextMatch.team2) {
                    // Ensure we don't overwrite if it's already this team (idempotency)
                    if (nextMatch.team1.id.toString() !== winningTeamObj.id.toString()) {
                        newBracket[nextMatchIndex] = { ...nextMatch, team2: winningTeamObj };
                    }
                }
            }
        }
        return newBracket;
    };

    const saveTournament = async (name, bracketData, isShuffle = false) => {
        const { data, error } = await supabase.from('tournaments').insert([{
            name,
            status: 'draft',
            bracket_data: bracketData,
            is_shuffle: isShuffle
        }]).select();

        if (error) {
            alert("Error creating tournament");
            console.error(error);
        } else {
            setTournaments(prev => [data[0], ...prev]);
        }
    };

    const updateTournament = async (id, updates) => {
        // Optimistic
        setTournaments(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        if (activeTournament?.id === id) setActiveTournament(prev => ({ ...prev, ...updates }));

        await supabase.from('tournaments').update(updates).eq('id', id);
    };

    const deleteTournament = async (id) => {
        if (!confirm("Are you sure?")) return;
        setTournaments(prev => prev.filter(t => t.id !== id));
        if (activeTournament?.id === id) setActiveTournament(null);
        await supabase.from('tournaments').delete().eq('id', id);
    };

    const publishTournament = async (id) => {
        // Set all others to 'completed' or 'archived' if we only allow 1 active? 
        // For now just set this one active.
        await updateTournament(id, { status: 'active' });
        // Optionally fetch again to ensure consistency
        fetchTournaments();
    };

    const linkMatchToTournament = async (tournamentId, bracketMatchId, realMatchData) => {
        const tournament = tournaments.find(t => t.id === tournamentId);
        if (!tournament) return;

        let bracket = [...tournament.bracket_data];
        // Find the bracket match
        const matchIdx = bracket.findIndex(m => m.matchId.toString() === bracketMatchId.toString());
        if (matchIdx === -1) return;

        const realWinnerId = realMatchData.winner === 'Radiant' ? realMatchData.radiantTeamId : realMatchData.direTeamId;
        const currentMatch = bracket[matchIdx];

        // Determine which bracket team won this specific game
        let winnerTeam = null; // 'team1' or 'team2'
        if ((currentMatch.team1 && currentMatch.team1.id.toString() === realWinnerId.toString()) ||
            (realWinnerId && currentMatch.team1 && realMatchData.winner === 'Radiant' && !realMatchData.direTeamId)) { /* fallback logic if mapping vague */
            winnerTeam = 'team1';
        }

        // Robust ID check
        if (currentMatch.team1 && currentMatch.team1.id.toString() == realWinnerId?.toString()) winnerTeam = 'team1';
        else if (currentMatch.team2 && currentMatch.team2.id.toString() == realWinnerId?.toString()) winnerTeam = 'team2';

        if (!winnerTeam) {
            console.warn("Could not map Replay Winner to Bracket Team", realWinnerId, currentMatch);
            // We might still proceed if we trust the dragging, but safer to warn.
            // For now, let's assume if it matches team1 ID ok, else team2.
        }

        // Link the Replay ID
        // push to 'games' array for history of the series
        if (!currentMatch.games) currentMatch.games = [];

        // Avoid duplicates: If match already linked, DO NOT increment score again
        if (currentMatch.games.find(g => g.matchId === realMatchData.matchId)) {
            console.warn("Match already linked to this bracket node. Skipping score update.");
            return {
                success: false,
                reason: 'duplicate',
                team1Score: currentMatch.team1Score || 0,
                team2Score: currentMatch.team2Score || 0,
                format: currentMatch.format || 'bo1'
            };
        }

        // Increment Score
        if (winnerTeam === 'team1') {
            currentMatch.team1Score = (currentMatch.team1Score || 0) + 1;
        } else if (winnerTeam === 'team2') {
            currentMatch.team2Score = (currentMatch.team2Score || 0) + 1;
        }

        currentMatch.games.push({
            matchId: realMatchData.matchId,
            winner: realMatchData.winner,
            timestamp: realMatchData.timestamp,
            duration: realMatchData.duration,
            radiantTeamId: realMatchData.radiantTeamId,
            direTeamId: realMatchData.direTeamId
        });

        // Backward compatibility: realMatchId points to the *latest* match
        currentMatch.realMatchId = realMatchData.matchId;

        // Check Format logic
        const format = currentMatch.format || 'bo1';
        const winsNeeded = format === 'bo3' ? 2 : (format === 'bo5' ? 3 : 1);

        let seriesWinnerId = null;
        if ((currentMatch.team1Score || 0) >= winsNeeded) seriesWinnerId = currentMatch.team1.id;
        if ((currentMatch.team2Score || 0) >= winsNeeded) seriesWinnerId = currentMatch.team2.id;

        if (seriesWinnerId) {
            currentMatch.winner = seriesWinnerId;
            currentMatch.status = 'completed';
        }

        bracket[matchIdx] = currentMatch;

        // Advance winner logic if Series is won
        let updatedBracket = bracket;
        if (seriesWinnerId) {
            updatedBracket = advanceBracket(bracket, bracketMatchId, seriesWinnerId);
        }

        await updateTournament(tournamentId, { bracket_data: updatedBracket });

        return {
            success: true,
            team1Score: currentMatch.team1Score || 0,
            team2Score: currentMatch.team2Score || 0,
            winner: seriesWinnerId,
            format: format
        };
    };

    const finishTournament = async (tournamentId, winnerTeamId) => {
        const { error } = await supabase.from('tournaments')
            .update({ status: 'archived', winner: winnerTeamId })
            .eq('id', tournamentId);

        if (error) {
            console.error("Error archiving tournament:", error);
            alert("Error finishing tournament.");
        } else {
            // Award individual trophies if it's a shuffle tournament
            const tournament = tournaments.find(t => t.id === tournamentId);
            if (tournament && tournament.is_shuffle) {
                const winningTeam = teams.find(t => t.id.toString() === winnerTeamId.toString());
                if (winningTeam && winningTeam.players) {
                    for (const player of winningTeam.players) {
                        const sid = (player.steam_id || player.steamId)?.toString();
                        if (sid) {
                            // Find and update player's trophies in shuffle_players
                            const { data: sPlayer } = await supabase
                                .from('shuffle_players')
                                .select('trophies')
                                .eq('steam_id', sid)
                                .maybeSingle();

                            if (sPlayer) {
                                const newTrophies = [...(sPlayer.trophies || []), {
                                    tournamentId: tournament.id,
                                    tournamentName: tournament.name,
                                    date: new Date().toISOString()
                                }];

                                await supabase
                                    .from('shuffle_players')
                                    .update({ trophies: newTrophies })
                                    .eq('steam_id', sid);
                            }
                        }
                    }
                }
            }

            // Optimistic update
            setTournaments(prev => prev.map(t =>
                t.id === tournamentId ? { ...t, status: 'archived', winner: winnerTeamId } : t
            ));
            setActiveTournament(null);

            // Re-fetch to ensure trophies are calculated
            // Actually, we can just trigger a manual recalculate if we had the new tournaments list
            // But since trophies are calculated in recalculateStats using tournaments list...
            // better to just window.location.reload() or force fetch. 
            // Simple way:
            window.location.reload();
        }
    };

    const dispatch = (action) => {
        switch (action.type) {
            case 'ADD_MATCH':
                processMatchStats(action.payload);
                break;
            default:
                console.warn("Unknown action:", action.type);
        }
    };

    return (
        <TournamentContext.Provider value={{
            teams, pendingTeams, registerTeam, approveTeam, rejectTeam, deleteTeam, updateTeam,
            tournaments, activeTournament, createTournament: saveTournament, updateTournament, deleteTournament, publishTournament, linkMatchToTournament, finishTournament,
            tournamentStats, processMatchStats,
            matchHistory,
            deleteMatch,
            bulkDeleteMatches,
            isLoading,
            dispatch
        }}>
            {children}
        </TournamentContext.Provider>
    );
};

export const useTournament = () => {
    const context = useContext(TournamentContext);
    if (!context) {
        throw new Error('useTournament must be used within a TournamentProvider');
    }
    return context;
};
