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
  onFirstLaneClick?: () => void;
  crashLane: any;
  setCrashLane: any;
  handleCrashComplete: any;
  setCurrentLane: any;
  currentLane: any;
}

const GameUI: React.FC<GameUIProps> = ({
  betAmount,
  difficulty,
  multipliers,
  encryptedCrashLane,
  gameActive,
  onFirstLaneClick,
  crashLane,
  setCrashLane,
  handleCrashComplete,
  currentLane,
  setCurrentLane,
}) => {
  const roadWidth = 155;

  // (existing states, etc.)
  const [targetLane, setTargetLane] = useState<number | null>(null);
  const [forceCrashCar, setForceCrashCar] = useState(false);
  const [cockDead, setCockDead] = useState(false);
  const [henExiting, setHenExiting] = useState(false);
  const lanesContainerRef = useRef<HTMLDivElement>(null);

  // NEW: Show or hide the "cashout" animation in the last lane
  const [showLastLaneCashout, setShowLastLaneCashout] = useState(false);

  // If we get the final crash lane from server, store it
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
      setHenExiting(false);
      setShowLastLaneCashout(false);
    }
  }, [gameActive]);

  useEffect(() => {
    if (gameActive) {
      const isMobile = window.innerWidth <= 768; // Common breakpoint for mobile devices
      if (isMobile) {
        const firstLaneElement = document.getElementById(`lane-1`);
        if (firstLaneElement) {
          firstLaneElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "end", // Scroll to the start of the first lane
          });
        }
      }
    }
  }, [gameActive]);

  const handleLaneClick = (clickedLaneIndex: number) => {
    if (!gameActive) return;
    setTargetLane(clickedLaneIndex);

    // If the user clicked lane #1, notify to enable "Cash Out" button in parent
    if (onFirstLaneClick) onFirstLaneClick();
  };

  const handleGameEnd = () => {
    if (targetLane !== null) {
      setCurrentLane(targetLane);

      // If this lane is the crash lane => force crash
      if (crashLane && targetLane === crashLane) {
        setForceCrashCar(true);
      } else {
        // If user is on the last lane & it's not a crash => exit the screen
        if (targetLane === multipliers.length && crashLane !== multipliers.length) {
          setHenExiting(true);

          // HERE: Show the cashout div in the last lane
          setShowLastLaneCashout(true);
          const isMobile = window.innerWidth <= 768;
          const rightBgElement = document.getElementById(`right-bg-road`);
          if (rightBgElement)
            rightBgElement.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: isMobile ? "end" : "center", // Use "end" for mobile, "center" for larger screens
            });
          setTimeout(() => window.location.reload(), 2000);
        }

      }

      setTargetLane(null);

      // Auto-scroll so the hen is in view
      const laneElement = document.getElementById(`lane-${targetLane + 1}`);
      if (laneElement) {
        const isMobile = window.innerWidth <= 768;
        laneElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: isMobile ? "end" : "center",
        });
      }
    }
  };

  // Car crash passes => set cockDead
  const handleCrashPass = () => {
    setCockDead(true);
  };

  return (
    <div className="h-[20rem] lg:h-[25rem] w-fit relative">
      <div className="h-full flex relative">
        {/* Left BG */}
        <div
          style={{
            background: `url(${LeftRightBg})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
          className="overflow-hidden h-full w-[10rem] relative"
        >
          <img src={LeftBg} className="absolute left-0" alt="Left background" />
        </div>

        {/* Road lanes */}
        <div ref={lanesContainerRef} className="flex h-full overflow-x-auto lanes-container">
          {multipliers.map((value, index) => (
            <RoadUI
              key={index}
              gameActive={gameActive}
              laneIndex={index + 1}
              value={value}
              multipliers={multipliers}
              currentLane={currentLane}
              onLaneClick={handleLaneClick}
              hideWall={crashLane === index + 1}
              // Pass down a prop to show the cashout on the final lane
              showCashout={showLastLaneCashout && index + 1 === multipliers.length}
            />
          ))}
        </div>

        {/* Car UI */}
        <div className="absolute top-0 left-[10rem] right-[10rem] bottom-0 pointer-events-none">
          <CarUi
            difficulty={difficulty}
            henLane={currentLane}
            roadWidth={roadWidth}
            multipliers={multipliers}
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
            onMoveComplete={handleGameEnd}
            crashLane={crashLane}
            multipliers={multipliers}
            cockDead={cockDead}
            henExiting={henExiting}
            gameOver={false} // existing
          />
        </div>

        {/* Right BG */}
        <div
          id="right-bg-road"
          style={{
            background: `url(${LeftRightBg})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
          className="overflow-hidden h-full w-[10rem] relative"
        >
          <img src={RightBg} className="absolute right-0" alt="Right background" />
        </div>
      </div>
    </div>
  );
};

export default GameUI;
