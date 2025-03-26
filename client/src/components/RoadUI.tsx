import { useState } from "react";
import CoinImg from "../assets/road_coin.svg";
import wallImg from "../assets/roadblock_wall.svg";
import "./RoadUi.css";
import SkeletonImg from "../assets/skeleton.svg";
import ClaimedCoinImg from "../assets/claimed_coin.svg";

interface RoadUIProps {
  laneIndex: number;
  value: number;
  gameActive: boolean;
  currentLane: number;
  multipliers: number[];
  onLaneClick: (laneIndex: number) => void;
  hideWall?: boolean;
  ifCashOut?: {
    ifCashOut: boolean;
    cashOutLane: number;
    crashLane: number;
  };
  showGameEnd?: boolean;
  isCoinVisible?: boolean;
}

function RoadUI({
  laneIndex,
  value,
  currentLane,
  multipliers,
  gameActive,
  onLaneClick,
  ifCashOut,
  hideWall,
  showGameEnd,
  isCoinVisible
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
        <img
          src={CoinImg}
          alt="Coin"
          className={`coin-img   ${ifCashOut?.ifCashOut && (ifCashOut?.crashLane - 1 === laneIndex) ? "hidden" : "block"}
           ${coinFaded ? " hidden  " : "hover:scale-110 transition-transform"
            }`}
        />
        <span
          className={`absolute text-sm font-bold ${coinFaded ? "hidden" : ""} ${isNextLane ? "text-white" : "text-gray-500"
            }`}
        >
          {value.toFixed(2)}x
        </span>
      </div>

      {!hideWall && (
        <img
          src={wallImg}
          alt="Wall"
          className={`wall-img mt-[65%] lg:mt-[80%]  ${laneIndex <= currentLane ? "fall" : ""} 
            ${(laneIndex === multipliers.length && showGameEnd) || (ifCashOut?.ifCashOut && laneIndex === ifCashOut.cashOutLane + 1)
              ? "hidden"
              : ""
            } `}
        />
      )}
      <img
        src={ClaimedCoinImg}
        className={` 
    ${laneIndex <= currentLane - 1 ? "animate-bounce mt-[40%] lg:mt-[40%] " : "hidden"}
  `}
        alt=""
      />
      <div
        className={`gameend absolute px-3 py-1 bg-[#32de84] border-2 border-white rounded-xl
          ${laneIndex === multipliers.length && showGameEnd
            ? "animate-flyUp"
            : "hidden"
          }
        `}
      >
        <span className=" font-outline-black text-xl font-[800] " >$ {value}</span>
      </div>
      <div
        className={`gameend absolute px-3 py-1 z-50 bg-[#32de84] border-2 border-white rounded-xl
          ${ifCashOut?.ifCashOut && laneIndex === ifCashOut.cashOutLane + 1
            ? "animate-flyUp"
            : "hidden"
          }
        `}
      >
        <span className=" font-outline-black text-xl font-[800] " >$ {value}</span>
      </div>
      <div className={` ${ifCashOut?.ifCashOut && (ifCashOut?.crashLane - 1 === laneIndex) ? "block" : "hidden"} absolute flex justify-center items-center crashicon  font-[500]  px-3 py-1   bg-[#EE4B2B] border-2  border-white rounded-xl `}>
        <img className=" inline mr-1 " src={SkeletonImg} alt="" />  <span className=" font-outline-black text-xl font-[800] " >$ {value}</span>
      </div>
    </div>
  );
}

export default RoadUI;
