import { useState, useEffect, useRef } from "react";
import CockImg from "../assets/standing_clock.svg";
import CockMovingImg1 from "../assets/cock_walk_1.svg";
import CockMovingImg2 from "../assets/cock_walk_2.svg";
import DeadCockImg from "../assets/dead_cock.svg";

interface CockUiProps {
  maxWidth: number;
  maxHeight: number;
  targetLane: number | null;
  currentLane: number;
  multipliers: number[];
  onMoveComplete: () => void;
  crashLane: number | null;
  gameOver: boolean;
  cockDead: boolean;

  // NEW: if true => hen walks off screen
  henExiting?: boolean;
}

function CockUi({
  maxWidth,
  maxHeight,
  multipliers,
  targetLane,
  currentLane,
  onMoveComplete,
  crashLane,
  cockDead,
  henExiting,
}: CockUiProps) {
  // Explicitly define the type of `henRef` to be HTMLImageElement
  const henRef = useRef<HTMLImageElement | null>(null);

  const laneWidth = maxWidth; // 155 from GameUI
  const [position, setPosition] = useState({ left: calculateLanePosition(currentLane) });
  const [isMoving, setIsMoving] = useState(false);
  const [currentImage, setCurrentImage] = useState(CockImg);

  function calculateLanePosition(lane: number): number {
    // For example, each lane is laneWidth wide, left offset for lane 1 is some constant
    const leftBackgroundWidth = 160;
    if (lane === 0) return 75;
    return leftBackgroundWidth + (lane - 1) * laneWidth + laneWidth / 2 - 50;
  }

  // If hen is dead => show DeadCock
  useEffect(() => {
    if (cockDead) {
      setCurrentImage(DeadCockImg);
      setIsMoving(false);
    }
  }, [cockDead]);

  // If the targetLane changes => animate
  useEffect(() => {
    if (targetLane !== null && targetLane > currentLane && !cockDead) {
      setIsMoving(true);
      const newLeft = calculateLanePosition(targetLane);
      setPosition({ left: newLeft });

      const distance = targetLane - currentLane;
      const animationTime = Math.min(800, 300 * distance);

      const timer = setTimeout(() => {
        setIsMoving(false);
        onMoveComplete();
      }, animationTime);

      return () => clearTimeout(timer);
    }
  }, [targetLane, currentLane, cockDead, onMoveComplete]);

  // Toggle walk frames if isMoving
  useEffect(() => {
    if (isMoving) {
      const interval = setInterval(() => {
        setCurrentImage((prev) =>
          prev === CockMovingImg1 ? CockMovingImg2 : CockMovingImg1
        );
      }, 200);
      return () => clearInterval(interval);
    } else if (!cockDead) {
      setCurrentImage(CockImg);
    }
  }, [isMoving, cockDead]);

  // NEW: if henExiting => we move the hen off-screen
  useEffect(() => {
    if (henExiting && !cockDead) {
      // e.g. animate further to the right
      setIsMoving(true);
      const newLeft = calculateLanePosition(multipliers.length + 1);
      setPosition({ left: newLeft }); // some large number to push off screen

      // Takes 1s to walk off screen
      const timer = setTimeout(() => {
        setIsMoving(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [henExiting, cockDead]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="absolute z-20 " style={{
        left: `${position.left}px`,
        bottom: "58px",
        transition: cockDead
          ? "none"
          : "left 0.8s cubic-bezier(0.33, 1, 0.68, 1)",
      }}>
        {/* Hen image */}
        <img
          src={currentImage}
          alt="Hen"
          className=""
          style={{
            width: "85px",
            height: "85px",
          }}
          ref={henRef}
        />

        {/* Multiplier displayed directly below the hen */}
        {!cockDead && (
          currentLane > 0 && multipliers[currentLane] ? (
            <div className="z-20 text-center bg-[#171C4C] text-white rounded-xl p-2 mt-2">
              {multipliers[currentLane - 1].toFixed(2)}x
            </div>
          ) : (
            <div
              className="z-20 text-center text-white rounded-xl p-2 mt-2"
              style={{ backgroundColor: 'transparent', opacity: 0 }}
            >
              x
            </div>
          )
        )}

      </div>
    </div>
  );
}

export default CockUi;