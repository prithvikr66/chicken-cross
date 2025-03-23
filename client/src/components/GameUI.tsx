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
  crashLane :any;
  setCrashLane:any;
  handleCrashComplete:any,
  setCurrentLane:any,
  currentLane:any
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
  setCurrentLane
}) => {
  const roadWidth = 155;

  // We track the hen's lane states
  const [targetLane, setTargetLane] = useState<number | null>(null);

  // Crash logic
  const [forceCrashCar, setForceCrashCar] = useState(false);
  const [cockDead, setCockDead] = useState(false);
  const [henExiting, setHenExiting] = useState(false);
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

  // When the game starts, ensure the first lane is in view for mobile devices
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

  // When user clicks a lane => set targetLane
  const handleLaneClick = (clickedLaneIndex: number) => {
    if (!gameActive) return;
    setTargetLane(clickedLaneIndex);

    // If the user clicked lane #1, notify Home so it can enable "Cash Out" button
    if (onFirstLaneClick) {
      onFirstLaneClick();
    }
  };

  // Update the handleMoveComplete function in GameUI.tsx
  const handleMoveComplete = () => {
    if (targetLane !== null) {
      setCurrentLane(targetLane);

      if (crashLane && targetLane === crashLane) {
        setForceCrashCar(true);
      } else {
        // If user is on the last lane & it's not crash => exit screen
        if (targetLane === multipliers.length && crashLane !== multipliers.length) {
          setHenExiting(true);
        }
        const isMobile = window.innerWidth <= 768;
        const rightBgElement = document.getElementById(`right-bg-road`);
        if (rightBgElement)
          rightBgElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: isMobile ? "end" : "center", // Use "end" for mobile, "center" for larger screens
          });
      }
      setTargetLane(null);

      // Auto-scroll to keep hen in view
      const laneElement = document.getElementById(`lane-${targetLane + 1}`);
      if (laneElement) {
        // Detect if the device is likely a mobile device based on screen width
        const isMobile = window.innerWidth <= 768; // Common breakpoint for mobile devices

        laneElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: isMobile ? "end" : "center", // Use "end" for mobile, "center" for larger screens
        });
      }
    }
  };

  // Crash Car passes => cock dead
  const handleCrashPass = () => {
    setCockDead(true);
  };

  useEffect(()=>console.log(currentLane),[currentLane])

  

  return (
    <div className="  h-[20rem] lg:h-[25rem] w-fit relative">
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
        <div
          ref={lanesContainerRef}
          className="flex h-full  overflow-x-auto lanes-container  "
        >
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
            />
          ))}
        </div>
        {/* Car UI */}
        <div className="absolute top-0 left-[10rem] right-[10rem]  bottom-0 pointer-events-none">
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
            onMoveComplete={handleMoveComplete}
            crashLane={crashLane}
            gameOver={false}
            multipliers={multipliers}
            cockDead={cockDead}
            henExiting={henExiting}
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
          <img
            src={RightBg}
            className="absolute right-0"
            alt="Right background"
          />
        </div>
      </div>
    </div>
  );
};

export default GameUI;
