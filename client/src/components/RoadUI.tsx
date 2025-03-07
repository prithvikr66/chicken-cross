import React from "react";
import CoinImg from "../assets/road_coin.svg";

interface RoadUIProps {
  laneIndex: number;
  value: number;
  onLaneClick: (laneIndex: number) => void;
  isTargetLane: boolean;
}

function RoadUI({ laneIndex, value, onLaneClick, isTargetLane }: RoadUIProps) {
  return (
    <div
      className={`bg-[#313464] border-r-4 border-dashed border-white flex justify-center items-center h-full cursor-pointer hover:bg-[#3b3e70] ${
        isTargetLane ? "border-4 border-yellow-500" : ""
      }`}
      style={{ width: "200px" }}
      onClick={() => onLaneClick(laneIndex)}
    >
      {/* Coin container */}
      <div className="relative flex items-center justify-center">
        {/* Coin Image */}
        <img
          src={CoinImg}
          alt="Coin"
          className="w-16 h-16 hover:scale-110 transition-transform"
        />
        {/* Multiplier Text in Center of Coin */}
        <span className="absolute text-white text-sm font-bold">
          {value}x
        </span>
      </div>
    </div>
  );
}

export default RoadUI;
