import React, { useState, useEffect, useRef } from "react";
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
  const [crashLane, setCrashLane] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // -- NEW STATES --
  // If true, we'll spawn a "crash car" in CarUi
  const [forceCrashCar, setForceCrashCar] = useState(false);
  // Whether the cock has been run over and is now “dead”
  const [cockDead, setCockDead] = useState(false);

  // Ref for the container wrapping the lanes
  const lanesContainerRef = useRef<HTMLDivElement>(null);

  // --- LOADING MULTIPLIERS / CRASH LANE ---
  useEffect(() => {
    if (multipliers.length > 0 && gameActive && encryptedCrashLane !== undefined) {
      const timer = setTimeout(() => setLoading(false), 500);
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

  // --- SCROLL TO FIRST LANE WHEN GAME STARTS ---
  useEffect(() => {
    if (gameActive && !loading) {
      const firstLaneElem = document.getElementById("lane-1");
      if (firstLaneElem) {
        firstLaneElem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [gameActive, loading]);

  /**
   * When a lane is clicked:
   *   1) If it’s the crash lane, we’ll let the hen move to that lane.
   *   2) Otherwise it’s a normal lane, so just move the hen as usual.
   *   3) Scroll into the next lane’s view (or if last lane, scroll at least to itself).
   */
  const handleLaneClick = (clickedLaneIndex: number) => {
    if (!gameActive || loading) return;

    // If user clicks the crash lane, we will handle the crash logic in handleMoveComplete
    setTargetLane(clickedLaneIndex);

    const totalLanes = multipliers.length;
    if (clickedLaneIndex < totalLanes) {
      const nextLaneElem = document.getElementById(`lane-${clickedLaneIndex + 1}`);
      if (nextLaneElem) {
        nextLaneElem.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        // if there's no "next" lane, scroll this lane into view
        const lastLaneElem = document.getElementById(`lane-${clickedLaneIndex}`);
        lastLaneElem?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  /**
   * When the hen finishes its move from `currentLane` -> `targetLane`:
   *  1) Update currentLane.
   *  2) If that lane == crashLane, trigger forceCrashCar => CarUi spawns the “crash” car.
   */
  const handleMoveComplete = () => {
    if (targetLane !== null) {
      setCurrentLane(targetLane);

      // If we just moved onto the crash lane, forcibly spawn the crash car
      if (crashLane !== null && targetLane === crashLane) {
        setForceCrashCar(true);
      }

      // Clear target
      setTargetLane(null);
    }
  };

  // If game stops or restarts, reset everything
  useEffect(() => {
    if (!gameActive) {
      setCurrentLane(0);
      setTargetLane(null);
      setCockDead(false);
      setForceCrashCar(false);
      setCrashLane(null);
    }
  }, [gameActive]);

  /**
   * Called by CarUi once the crash car is “over” the hen’s position.
   * That’s our cue to set the hen’s image to the dead cock.
   */
  const handleCrashPass = () => {
    setCockDead(true);
  };

  /**
   * Called by CarUi once the crash car fully exits the game area.
   * We can then reload or do any cleanup we need.
   */
  const handleCrashComplete = () => {
    window.location.reload();
  };

  return (
    <div className="m-5 h-[25rem] w-fit relative">
      <div className="h-full flex relative">
        {/* Left Background */}
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
        <div
          ref={lanesContainerRef}
          className="flex h-full overflow-x-auto"
          style={{ scrollBehavior: "smooth" }}
        >
          {multipliers.map((value, index) => (
            <RoadUI
              key={index}
              laneIndex={index + 1}
              value={value}
              onLaneClick={handleLaneClick}
              isTargetLane={targetLane === index + 1}
              loading={loading}
              // Hide the wall if this is the crash lane
              hideWall={crashLane !== null && (index + 1) === crashLane}
            />
          ))}
        </div>

        {/* Car UI */}
        <div className="absolute top-0 left-[15rem] right-[15rem] bottom-0 pointer-events-none">
          <CarUi
            difficulty={difficulty}
            henLane={currentLane}
            roadWidth={roadWidth}
            // When forceCrashCar is true, CarUi spawns the crash car in crashLane
            forceCrashCar={forceCrashCar}
            crashLane={crashLane}
            onCrashPass={handleCrashPass}
            onCrashComplete={handleCrashComplete}
          />
        </div>

        {/* Cock (Hen) UI */}
        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
          <CockUi
            maxWidth={roadWidth}
            maxHeight={roadHeight}
            targetLane={targetLane}
            currentLane={currentLane}
            onMoveComplete={handleMoveComplete}
            crashLane={crashLane}
            gameOver={false}
            cockDead={cockDead}
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
          <img src={RightBg} className="absolute right-0" alt="Right background" />
        </div>
      </div>

      {loading && gameActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-30">
          <div className="bg-[#1A2C38] p-6 rounded-lg text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
            <p className="text-white">Loading game data...</p>
          </div>
        </div>
      )}

      {/* Cash Out Button */}
      {currentLane > 0 && currentLane < (multipliers.length + 1) && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={() => onGameEnd(currentLane)}
            className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg"
          >
            Cash Out ({(betAmount * multipliers[currentLane - 1]).toFixed(2)} SOL)
          </button>
        </div>
      )}
    </div>
  );
};

export default GameUI;
