import React, { useState, useEffect } from "react";
import LeftBg from "../assets/left_bg.svg";
import RightBg from "../assets/right_bg.svg";
import LeftRightBg from "../assets/left_right_road.png";
import RoadUI from "./RoadUI";
import CockUi from "./CockUi";
import CarUi from "./CarUi";

interface GameUIProps {
  betAmount: number;
  difficulty: "easy" | "medium" | "hard" | "daredevil";
  seedPairId: string;
  multipliers: number[];
  encryptedCrashLane: number | undefined;
  nonce: string;
  gameActive: boolean;
  onGameEnd: (cashOutLane?: number) => void;
}

const GameUI: React.FC<GameUIProps> = ({
  betAmount,
  difficulty,
  multipliers,
  encryptedCrashLane,
  gameActive,
  onGameEnd,
}) => {
  const roadHeight = 400;
  const roadWidth = 200;
  const [targetLane, setTargetLane] = useState<number | null>(null);
  const [currentLane, setCurrentLane] = useState<number>(0);
  const [gameOver, setGameOver] = useState(false);
  const [crashLane, setCrashLane] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Set loading state based on game conditions
  useEffect(() => {
    // Game is considered loading until we have multipliers and crash lane data
    if (multipliers.length > 0 && gameActive && encryptedCrashLane !== undefined) {
      // Short delay to ensure all resources are loaded
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setLoading(true);
    }
  }, [multipliers, gameActive, encryptedCrashLane]);

  useEffect(() => {
    if (encryptedCrashLane !== undefined) {
      setCrashLane(encryptedCrashLane);
    }
  }, [encryptedCrashLane]);

  /** ✅ Handle Lane Click */
  const handleLaneClick = (laneIndex: number) => {
    if (
      !gameActive ||
      gameOver ||
      targetLane ||
      laneIndex <= currentLane ||
      crashLane === null ||
      loading
    ) {
      console.log("🚫 Lane selection blocked");
      return;
    }

    if (laneIndex >= crashLane) {
      console.log("💥 Game Over - Hit Crash Lane");
      setGameOver(true);
      setTimeout(() => {
        onGameEnd();
      }, 1500); // Delay to show game over UI
      return;
    }

    console.log("🚗 Moving to lane:", laneIndex);
    setTargetLane(laneIndex);
  };

  /** ✅ Update Current Lane after Move */
  const handleMoveComplete = () => {
    if (targetLane !== null) {
      setCurrentLane(targetLane);
      setTargetLane(null);
      
      // Check if we've reached crash lane
      if (crashLane !== null && targetLane >= crashLane) {
        setGameOver(true);
        setTimeout(() => {
          onGameEnd();
        }, 1000);
      }
    }
  };

  /** ✅ Reset Game State when game ends */
  useEffect(() => {
    if (!gameActive) {
      setCurrentLane(0);
      setTargetLane(null);
      setGameOver(false);
      setCrashLane(null);
    }
  }, [gameActive]);

  return (
    <div className="m-5 h-[25rem] w-fit relative">
      <div className="h-full flex relative">
        <div
          style={{
            background: `url(${LeftRightBg})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
          className="overflow-hidden h-full w-[15rem] relative"
        >
          <img src={LeftBg} className="absolute left-0" alt="Left background" />
        </div>

        {/* Road Lanes */}
        <div className="flex h-full">
          {multipliers.map((value, index) => (
            <RoadUI
              key={index}
              value={value}
              laneIndex={index + 1}
              onLaneClick={handleLaneClick}
              isTargetLane={targetLane === index + 1}
              loading={loading}
            />
          ))}
        </div>

        {/* Car Movement */}
        <div className="absolute top-0 left-[15rem] right-[15rem] bottom-0 pointer-events-none">
          <CarUi
            difficulty={difficulty}
            henLane={currentLane}
            roadWidth={roadWidth}
          />
        </div>

        {/* Chicken Animation */}
        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
          <CockUi
            maxWidth={roadWidth}
            maxHeight={roadHeight}
            targetLane={targetLane}
            currentLane={currentLane}
            onMoveComplete={handleMoveComplete}
            onHenLaneChange={setCurrentLane}
            crashLane={crashLane}
            gameOver={gameOver}
          />
        </div>

        {/* Right Background */}
        <div
          style={{
            background: `url(${LeftRightBg})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
          className="overflow-hidden h-full w-[15rem] relative"
        >
          <img
            src={RightBg}
            className="absolute right-0"
            alt="Right background"
          />
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && gameActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-30">
          <div className="bg-[#1A2C38] p-6 rounded-lg text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
            <p className="text-white">Loading game data...</p>
          </div>
        </div>
      )}

      {/* Game Over UI */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="bg-[#1A2C38] p-6 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-red-400">Game Over</h2>
            <p className="text-gray-400 mt-2">
              You hit a car! Your payout: 0 SOL
            </p>
            <button
              onClick={() => onGameEnd()}
              className="mt-4 bg-purple-500 hover:bg-purple-600 text-white font-medium px-4 py-2 rounded-lg"
            >
              End Game
            </button>
          </div>
        </div>
      )}

      {/* Cash Out Button */}
      {currentLane > 0 && !gameOver && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={() => onGameEnd(currentLane)}
            className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg"
          >
            Cash Out ({(betAmount * multipliers[currentLane - 1]).toFixed(2)}{" "}
            SOL)
          </button>
        </div>
      )}
    </div>
  );
};

export default GameUI;