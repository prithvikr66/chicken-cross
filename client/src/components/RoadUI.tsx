import { useState } from "react";
import CoinImg from "../assets/road_coin.svg";
import wallImg from "../assets/roadblock_wall.svg";
import "./RoadUi.css";

interface RoadUIProps {
  laneIndex: number;
  value: number;
  gameActive: boolean;
  currentLane: number;
  multipliers: number[];
  onLaneClick: (laneIndex: number) => void;
  hideWall?: boolean;

  // If you previously added highlight logic, e.g. highlightLane?: number | null;
  // you can keep that here, or remove if not needed:
  // highlightLane?: number | null;
}

function RoadUI({
  laneIndex,
  value,
  currentLane,
  multipliers,
  gameActive,
  onLaneClick,
  hideWall,
  // highlightLane,
}: RoadUIProps) {
  const [coinFaded, setCoinFaded] = useState(false);
  const [wallFalling, setWallFalling] = useState(false);

  // If the hen is currently at lane X, the "next" lane is X+1, and only that should be clickable
  const isClickable = gameActive && laneIndex === currentLane + 1;

  // If you still want the text color logic for the "next" lane:
  const isNextLane = isClickable; // same condition
  // e.g. text is white if it's the next lane
  // (Or you can keep your old logic `laneIndex === currentLane + 1 && currentLane >= 0 && gameActive`)

  const handleClick = () => {
    setCoinFaded(true);
    setWallFalling(true);
    onLaneClick(laneIndex);
  };

  return (
    <div
      id={`lane-${laneIndex}`}
      className={`
        ${laneIndex === multipliers.length ? "" : "border-r-4"} 
        bg-[#313464] 
        border-dashed border-white 
        flex justify-center items-center 
        h-full 
        relative
        ${isClickable ? "hover:bg-[#3b3e70] cursor-pointer" : "cursor-not-allowed"}
      `}
      style={{
        minWidth: "155px",
        // Only enable pointer events if this lane is clickable
        pointerEvents: isClickable ? "auto" : "none",
      }}
      onClick={isClickable ? handleClick : undefined}
    >
      <div className="relative flex items-center justify-center">
        {/* Wall (if hideWall is false) */}
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
          className={`coin-img ${
            coinFaded ? "fade-out" : "hover:scale-110 transition-transform"
          }`}
        />
        <span
          className={`absolute text-sm font-bold ${coinFaded ? "hidden" : ""} ${
            isNextLane ? "text-white" : "text-gray-500"
          }`}
        >
          {value.toFixed(2)}x
        </span>
      </div>

      {/* If you have highlight logic, you can add it here, e.g.:
      {highlightLane === laneIndex && (
        <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs z-10">
          Max Potential
        </div>
      )} */}
    </div>
  );
}

export default RoadUI;
