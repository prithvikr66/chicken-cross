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
  const roadWidth = 200;

  // We track the hen's lane states
  const [currentLane, setCurrentLane] = useState<number>(0);
  const [targetLane, setTargetLane] = useState<number | null>(null);

  // Crash logic
  const [crashLane, setCrashLane] = useState<number | null>(null);
  const [forceCrashCar, setForceCrashCar] = useState(false);
  const [cockDead, setCockDead] = useState(false);

  // Ref for the lanes container so we can auto-scroll
  const lanesContainerRef = useRef<HTMLDivElement>(null);

  // On receiving crash lane from server
  useEffect(() => {
    if (encryptedCrashLane !== undefined) {
      setCrashLane(encryptedCrashLane);
    }
  }, [encryptedCrashLane]);

  // Reset if the game stops
  useEffect(() => {
    if (!gameActive) {
      setCurrentLane(0);
      setTargetLane(null);
      setCockDead(false);
      setForceCrashCar(false);
      setCrashLane(null);
    }
  }, [gameActive]);

  // When user clicks a lane => set targetLane
  const handleLaneClick = (clickedLaneIndex: number) => {
    if (!gameActive) return;
    setTargetLane(clickedLaneIndex);
  };

  // Once the hen moves from currentLane -> targetLane
  const handleMoveComplete = () => {
    if (targetLane !== null) {
      setCurrentLane(targetLane);

      // If that lane is crash => spawn crash car
      if (crashLane && targetLane === crashLane) {
        setForceCrashCar(true);
      }
      setTargetLane(null);
    }
  };

  // AUTO-SCROLL: each time currentLane changes, scroll so that the new lane is in view
  useEffect(() => {
    if (!gameActive) return;
    if (!lanesContainerRef.current) return;
    if (currentLane < 1) return; // lane 0 => no scroll needed
    // We'll scroll so that lane `currentLane` is at the left edge
    const offset = (currentLane - 1) * roadWidth;
    lanesContainerRef.current.scrollTo({
      left: offset,
      behavior: "smooth",
    });
  }, [currentLane, gameActive]);

  // Crash Car passes => cock dead
  const handleCrashPass = () => {
    setCockDead(true);
  };

  // Crash Car fully exits => reload or something
  const handleCrashComplete = () => {
    window.location.reload();
  };

  return (
    <div className="m-5 h-[25rem] w-fit relative">
      <div className="h-full flex relative">
        {/* Left BG */}
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

        {/* Road lanes */}
        <div
          ref={lanesContainerRef}
          className="flex h-full overflow-x-auto"
          style={{ scrollBehavior: "smooth" }}
        >
          {multipliers.map((value, index) => (
            <RoadUI
              key={index}
              gameActive={gameActive}
              laneIndex={index + 1}
              value={value}
              currentLane={currentLane}
              onLaneClick={handleLaneClick}
              hideWall={crashLane === index + 1}
            />
          ))}
        </div>

        {/* Car UI */}
        <div className="absolute top-0 left-[15rem] right-[15rem] bottom-0 pointer-events-none">
          <CarUi
            difficulty={difficulty}
            henLane={currentLane}
            roadWidth={roadWidth}
            forceCrashCar={forceCrashCar}
            crashLane={crashLane ?? undefined}
            onCrashPass={handleCrashPass}
            onCrashComplete={handleCrashComplete}
          />
        </div>

        {/* Cock UI */}
        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
          <CockUi
            maxWidth={roadWidth}
            maxHeight={400}
            targetLane={targetLane}
            currentLane={currentLane}
            onMoveComplete={handleMoveComplete}
            crashLane={crashLane}
            gameOver={false}
            cockDead={cockDead}
          />
        </div>

        {/* Right BG */}
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

      {/* Cash Out Button */}
      {gameActive && currentLane > 0 && currentLane <= multipliers.length && (
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
