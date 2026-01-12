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

            const { data: matchesData } = await supabase.from('matches').select('*').order('timestamp', { ascending: false });
            if (matchesData) {
                // Parse the data column if needed, but our table struct has data as jsonb. 
                // However, our app acts on the flattened object. 
                // The 'data' column contains the JSON.
                // We need to map it back to the flat format used by the app.
                const flatMatches = matchesData.map(m => ({
                    ...m.data, // Spread the original JSON
                    matchId: m.match_id // Ensure ID consistency
                }));
                setMatchHistory(flatMatches);
                recalculateStats(flatMatches);
            }

            const { data: tourneyData } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
            if (tourneyData) {
                setTournaments(tourneyData);
                const active = tourneyData.find(t => t.status === 'active');
                if (active) setActiveTournament(active);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const recalculateStats = (history) => {
        const newStats = {};
        history.forEach(match => {
            if (!match.players) return;
            match.players.forEach(p => {
                const tid = p.tournamentPlayerId;
                if (!tid) return;

                if (!newStats[tid]) {
                    newStats[tid] = {
                        matches: 0,
                        kills: 0, deaths: 0, assists: 0,
                        gpm: 0, xpm: 0,
                        heroDamage: 0, towerDamage: 0,
                        roshansKilled: 0, towersKilled: 0, tormentorsKilled: 0,
                        runesActivated: 0, neutralTokens: 0,
                        lastHits: 0, denies: 0, netWorth: 0
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

                s.heroDamage += (p.heroDamage || 0);
                s.towerDamage += (p.towerDamage || 0);
                s.roshansKilled += (p.roshans || 0);
                s.towersKilled += (p.towersKilled || 0);
                s.tormentorsKilled += (p.tormentorsKilled || 0);
                s.runesActivated += (p.runesActivated || 0);
                s.neutralTokens += (p.neutralTokens || 0);
            });
        });
        setTournamentStats(newStats);
    };

    const registerTeam = async (teamData) => {
        const newTeam = {
            id: Date.now().toString(),
            name: teamData.name,
            logo: teamData.logo || 'https://via.placeholder.com/150?text=Team',
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

    const processMatchStats = async (matchData) => {
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
        const matchIndex = newBracket.findIndex(m => m.matchId === matchId);
        if (matchIndex === -1) return newBracket;

        newBracket[matchIndex].winner = winnerTeamId;

        // Logic to move winner to next round
        // Simple binary tree assumption: match N feeds into match (totalMatches - (matchesPerRound/2) ... complex general logic)
        // For now, we'll assume the Admin manually edits the next match, OR we implement a 'nextMatchId' pointer.
        // Let's rely on manual bracket editing for advanced progression for now, or simple assumption:
        // If we have a 'nextMatchId' in the object, use it.
        const finishedMatch = newBracket[matchIndex];
        if (finishedMatch.nextMatchId) {
            const nextMatchIndex = newBracket.findIndex(m => m.matchId === finishedMatch.nextMatchId);
            if (nextMatchIndex !== -1) {
                // Determine if it's team1 or team2 slot based on seed or prior arrangement? 
                // We'll just fill the first empty slot for simplicity, or strict check.
                if (!newBracket[nextMatchIndex].team1) {
                    newBracket[nextMatchIndex].team1 = winnerTeamId === finishedMatch.team1.id ? finishedMatch.team1 : finishedMatch.team2;
                } else if (!newBracket[nextMatchIndex].team2) {
                    newBracket[nextMatchIndex].team2 = winnerTeamId === finishedMatch.team1.id ? finishedMatch.team1 : finishedMatch.team2;
                }
            }
        }
        return newBracket;
    };

    const saveTournament = async (name, bracketData) => {
        const { data, error } = await supabase.from('tournaments').insert([{
            name,
            status: 'draft',
            bracket_data: bracketData
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

        let bracket = tournament.bracket_data;
        // Find the bracket match
        const matchIdx = bracket.findIndex(m => m.matchId.toString() === bracketMatchId.toString());
        if (matchIdx === -1) return;

        const winnerTeamId = realMatchData.winner === 'Radiant' ? realMatchData.radiantTeamId : realMatchData.direTeamId;

        // Update the specific match in bracket
        bracket[matchIdx] = {
            ...bracket[matchIdx],
            realMatchId: realMatchData.matchId,
            winner: winnerTeamId,
            status: 'completed'
        };

        // Advance winner logic (simplified for immediate needs)
        const updatedBracket = advanceBracket(bracket, bracketMatchId, winnerTeamId);

        await updateTournament(tournamentId, { bracket_data: updatedBracket });
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
            tournaments, activeTournament, createTournament: saveTournament, updateTournament, deleteTournament, publishTournament, linkMatchToTournament,
            tournamentStats, processMatchStats,
            matchHistory,
            deleteMatch,
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
