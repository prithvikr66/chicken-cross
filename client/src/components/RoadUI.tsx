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
  showCashout?: boolean;
}

function RoadUI({
  laneIndex,
  value,
  currentLane,
  multipliers,
  gameActive,
  onLaneClick,
  hideWall,
  showCashout,
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
            className={`wall-img ${wallFalling ? "fall" : ""} 
            ${laneIndex === multipliers.length && showCashout
                ? "hidden"
                : ""
              } `}
          />
        )}

        <img
          src={CoinImg}
          alt="Coin"
          className={`coin-img ${coinFaded ? "fade-out" : "hover:scale-110 transition-transform"
            }`}
        />
        <span
          className={`absolute text-sm font-bold ${coinFaded ? "hidden" : ""} ${isNextLane ? "text-white" : "text-gray-500"
            }`}
        >
          {value.toFixed(2)}x
        </span>
      </div>
      <div
        className={`cashout absolute px-6 py-2 bg-[#32de84] border-2 border-white rounded-xl
          ${laneIndex === multipliers.length && showCashout
            ? "animate-flyUp"
            : "hidden"
          }
        `}
      >
        $ {value}
      </div>
      <div className=" crashicon hidden font-[500]  px-6 py-2 bg-[#EE4B2B] border-2  border-white rounded-xl ">
        $ {value}
      </div>
    </div>
  );
}

export default RoadUI;
