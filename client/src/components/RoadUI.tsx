import React, { useState } from "react";
import CoinImg from "../assets/road_coin.svg";
import wallImg from "../assets/roadblock_wall.svg";
import "./RoadUi.css";

interface RoadUIProps {
  laneIndex: number;
  value: number;
  gameActive: boolean;
  currentLane: number;
  onLaneClick: (laneIndex: number) => void;
  hideWall?: boolean;
}

function RoadUI({
  laneIndex,
  value,
  currentLane,
  gameActive,
  onLaneClick,
  hideWall,
}: RoadUIProps) {
  const [coinFaded, setCoinFaded] = useState(false);
  const [wallFalling, setWallFalling] = useState(false);

  // If this lane is the “next” one to the hen (currentLane+1) AND gameActive => highlight text white
  const isNext =
    laneIndex === currentLane + 1 && currentLane >= 0 && gameActive;

  const handleClick = () => {
    setCoinFaded(true);
    setWallFalling(true);
    onLaneClick(laneIndex);
  };

  return (
    // In RoadUI.tsx, maintain the ID structure
    <div
      id={`lane-${laneIndex}`} // Keep this ID format
      className="bg-[#313464] border-r-4 border-dashed border-white flex justify-center items-center h-full hover:bg-[#3b3e70] cursor-pointer"
      style={{ width: "200px" }}
      onClick={handleClick}
    >
      <div className="relative flex items-center justify-center">
        {/* Wall, hidden if hideWall */}
        {!hideWall && (
          <img
            src={wallImg}
            alt="Wall"
            className={`wall-img ${wallFalling ? "fall" : ""}`}
          />
        )}

        <img
          src={CoinImg}
          alt="Coin"
          className={` coin-img ${
            coinFaded ? "fade-out" : "hover:scale-110 transition-transform"
          }`}
        />
        <span
          className={`absolute text-sm font-bold ${coinFaded ? "hidden" : ""} ${
            isNext ? "text-white" : "text-gray-500"
          }`}
        >
          {value.toFixed(2)}x
        </span>
      </div>
    </div>
  );
}

export default RoadUI;
