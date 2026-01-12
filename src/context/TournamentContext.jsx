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
            data: matchData
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

    // Client-side transient logic
    const createTournament = (name, matches) => {
        const tournament = { id: Date.now(), name, matches, status: 'ongoing' };
        setActiveTournament(tournament);
        setTournaments(prev => [...prev, tournament]);
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
            tournaments, activeTournament, createTournament, tournamentStats, processMatchStats,
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
