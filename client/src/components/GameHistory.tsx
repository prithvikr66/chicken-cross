import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Game {
  id: string;
  wallet_address: string;
  seed_pair_id: string;
  bet_amount: number;
  payout: number;
  cash_out_lane: number;
  crash_lane: number;
  difficulty: string;
  created_at: string;
}

interface GameHistoryProps {
  apiUrl: string;
}

const GameHistory: React.FC<GameHistoryProps> = ({ apiUrl }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const response = await axios.get(`${apiUrl}/api/games/waggers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGames(response.data.games);
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
    // Set up polling every 30 seconds
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-[#1A2C38] rounded-2xl p-6 backdrop-blur-lg border border-white/10">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
        Mission Uncrossable
      </h2>
      
      <p className="text-gray-300 mb-6 mt-[10px]">
        Play Mission Uncrossable, the Chicken Game on Roobet Crypto Casino, Crypto's Fastest Growing Casino! 
        Enjoy a library of 6,300+ exciting games and counting, including games by Roobet, such as Mission Uncrossable, 
        the Chicken Game. Play all kinds of provably fair games with Bitcoin, Ethereum, and other cryptocurrencies, 
        or try Mission Uncrossable, the Chicken Game for free in Fun Mode with the largest online gambling community. 
        Join the fun!
      </p>

      <h3 className="text-xl font-semibold text-gray-200 mb-4">Wagers</h3>

      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="max-h-[400px] overflow-y-auto hide-scrollbar">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <tr className="text-left text-gray-400">
                  <th className="sticky top-0 px-4 py-3 bg-[#1A2C38] font-semibold">User</th>
                  <th className="sticky top-0 px-4 py-3 bg-[#1A2C38] font-semibold hidden md:table-cell">Amount</th>
                  <th className="sticky top-0 px-4 py-3 bg-[#1A2C38] font-semibold">Payout</th>
                  <th className="sticky top-0 px-4 py-3 bg-[#1A2C38] font-semibold hidden md:table-cell">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {games.map((game, index) => (
                  <tr 
                    key={game.id} 
                    className={`hover:bg-white/5 transition-colors ${
                      index % 2 === 0 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-purple-400">{formatAddress(game.wallet_address)}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-yellow-400">{game.bet_amount.toFixed(3)} SOL</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${
                        game.payout > game.bet_amount ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {game.payout.toFixed(3)} SOL
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        game.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                        game.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        game.difficulty === 'hard' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {game.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHistory;