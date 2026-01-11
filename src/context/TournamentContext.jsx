import { createContext, useContext, useState, useEffect } from 'react';

const TournamentContext = createContext();

export const TournamentProvider = ({ children }) => {
    // Initialize teams from localStorage or empty array
    const [teams, setTeams] = useState(() => {
        try {
            const saved = localStorage.getItem('dota_teams');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load teams", e);
            return [];
        }
    });

    const [tournamentStats, setTournamentStats] = useState(() => {
        try {
            const saved = localStorage.getItem('dota_tournament_stats');
            return saved ? JSON.parse(saved) : {}; // Key: AccountID, Value: { kills, deaths, ... }
        } catch (e) {
            return {};
        }
    });

    const [tournaments, setTournaments] = useState([]);
    const [activeTournament, setActiveTournament] = useState(null);

    // Persist teams to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('dota_teams', JSON.stringify(teams));
    }, [teams]);

    useEffect(() => {
        localStorage.setItem('dota_tournament_stats', JSON.stringify(tournamentStats));
    }, [tournamentStats]);

    const [matchHistory, setMatchHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('dota_match_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('dota_match_history', JSON.stringify(matchHistory));
    }, [matchHistory]);

    // Initialize pending teams
    const [pendingTeams, setPendingTeams] = useState(() => {
        try {
            const saved = localStorage.getItem('dota_pending_teams');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Persist pending teams
    useEffect(() => {
        localStorage.setItem('dota_pending_teams', JSON.stringify(pendingTeams));
    }, [pendingTeams]);

    const registerTeam = (teamData) => {
        const newTeam = {
            id: Date.now().toString(),
            name: teamData.name,
            logo: teamData.logo || 'https://via.placeholder.com/150?text=Team',
            players: teamData.players,
            captainId: teamData.captainId,
            registeredAt: new Date().toISOString(),
            stats: { wins: 0, losses: 0, winrate: 0, matchesPlayed: [] }
        };

        // Add to PENDING instead of TEAMS
        setPendingTeams((prev) => [...prev, newTeam]);
        return newTeam;
    };

    const approveTeam = (teamId) => {
        const teamToApprove = pendingTeams.find(t => t.id === teamId);
        if (teamToApprove) {
            setTeams(prev => [...prev, teamToApprove]);
            setPendingTeams(prev => prev.filter(t => t.id !== teamId));
        }
    };

    const rejectTeam = (teamId) => {
        setPendingTeams(prev => prev.filter(t => t.id !== teamId));
    };

    const deleteTeam = (teamId) => {
        if (window.confirm('POTVRDA BRISANJA: Da li ste sigurni? Ovo je nepovratno.')) {
            setTeams(prev => prev.filter(t => t.id !== teamId));
        }
    };

    const updateTeam = (teamId, updatedData) => {
        setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...updatedData } : t));
    };

    const createTournament = (name, matches) => {
        const tournament = { id: Date.now(), name, matches, status: 'ongoing' };
        setActiveTournament(tournament);
        setTournaments(prev => [...prev, tournament]);
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

    const processMatchStats = (matchData) => {
        if (!matchData || !matchData.players) return;

        setMatchHistory(prev => {
            // Deduplicate
            if (matchData.matchId && prev.some(m => m.matchId === matchData.matchId)) {
                alert("Match already exists!");
                return prev;
            }
            const newHistory = [matchData, ...prev];
            recalculateStats(newHistory); // Recalculate everything
            alert("Utakmica uspesno sačuvana!");
            return newHistory;
        });
    };

    const deleteMatch = (matchId) => {
        if (window.confirm("DA LI STE SIGURNI? Ovo će obrisati meč i ponovo izračunati statistiku.")) {
            setMatchHistory(prev => {
                const newHistory = prev.filter(m => m.matchId !== matchId);
                recalculateStats(newHistory);
                return newHistory;
            });
        }
    };

    // Dispatch function to handle actions
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
            matchHistory, // Expose matchHistory
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
