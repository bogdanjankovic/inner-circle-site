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

    const processMatchStats = (matchData) => {
        if (!matchData || !matchData.players) return;

        const newStats = { ...tournamentStats };

        matchData.players.forEach(p => {
            // 64-bit to 32-bit conversion implicitly handled by API usually, but ensure matching
            // We use accountId as key.
            const aid = p.accountId;
            if (!aid) return;

            if (!newStats[aid]) {
                newStats[aid] = {
                    matches: 0,
                    kills: 0, deaths: 0, assists: 0,
                    gpm: 0, xpm: 0,
                    heroDamage: 0, towerDamage: 0,
                    roshansKilled: 0, towersKilled: 0, tormentorsKilled: 0,
                    runesActivated: 0, neutralTokens: 0
                };
            }

            const s = newStats[aid];
            s.matches += 1;
            s.kills += p.kills;
            s.deaths += p.deaths;
            s.assists += p.assists;
            s.gpm += p.gpm; // We will avg this later or keep sum
            s.xpm += p.xpm;
            s.heroDamage += p.heroDamage;
            s.towerDamage += p.towerDamage;
            s.roshansKilled += p.roshansKilled;
            s.towersKilled += p.towersKilled;
            s.tormentorsKilled += p.tormentorsKilled;
            s.runesActivated += p.runesActivated;
            s.neutralTokens += p.neutralTokens;
        });

        setTournamentStats(newStats);
        alert("Statistika uspešno ažurirana!");
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
            dispatch // Expose dispatch
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
