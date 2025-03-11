import React, { useState } from "react";
import CoinImg from "../assets/road_coin.svg";
import wallImg from "../assets/roadblock_wall.svg";
import "./RoadUi.css";

interface RoadUIProps {
  laneIndex: number;
  value: number;
  onLaneClick: (laneIndex: number) => void;
  isTargetLane: boolean;
  loading: boolean;
  hideWall?: boolean;
}

function RoadUI({
  laneIndex,
  value,
  onLaneClick,
  loading,
  hideWall,
}: RoadUIProps) {
  const [coinFaded, setCoinFaded] = useState(false);
  const [wallFalling, setWallFalling] = useState(false);

  const handleClick = () => {
    if (loading) return;
    setCoinFaded(true);
    setWallFalling(true);
    onLaneClick(laneIndex);
  };

  const bgColor = loading ? "bg-[#252745]" : "bg-[#313464]";
  const hoverColor = loading ? "" : "hover:bg-[#3b3e70]";

  return (
    <div
      id={`lane-${laneIndex}`}
      className={`${bgColor} border-r-4 border-dashed border-white flex justify-center items-center h-full ${hoverColor} ${
        loading ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      }`}
      style={{ width: "200px" }}
      onClick={handleClick}
    >
      <div className="relative flex items-center justify-center">
        {/* Only show the wall image if NOT hideWall */}
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
          className={`w-16 h-16 coin-img ${
            coinFaded ? "fade-out" : "hover:scale-110 transition-transform"
          }`}
        />
        <span
          className={`absolute text-white text-sm font-bold ${
            coinFaded ? "hidden" : ""
          }`}
        >
          {value.toFixed(1)}x
        </span>
      </div>
    </div>
  );
}

export default RoadUI;
