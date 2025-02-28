import LeftBg from "../assets/left_bg.svg";
import RightBg from "../assets/right_bg.svg";
import LeftRightBg from "../assets/left_right_road.png";
import RoadUI from "./RoadUI";
import CockUi from "./CockUi";
import { useState } from "react";

const Level = {
  easy: [1.0, 1.04, 1.09, 1.14, 1.2, 1.26],
  medium: [1.09, 1.25, 1.43, 1.66, 1.94],
  hard: [1.09, 1.25, 1.43, 1.66, 1.94],
};

function GameUI() {
  const roadHeight = 400;
  const roadWidth = 2000;
  const [targetLane, setTargetLane] = useState<number | null>(null);
  const [currentLane, setCurrentLane] = useState<number>(0);

  const handleLaneClick = (laneIndex: number) => {
    if (!targetLane && laneIndex > currentLane) {
      setTargetLane(laneIndex);
    }
  };

  const handleMoveComplete = () => {
    if (targetLane !== null) {
      setCurrentLane(targetLane);
      setTargetLane(null);
    }
  };

  return (
    <div className="m-5 h-[25rem] w-fit">
      <div className="relative h-full flex">
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
        <CockUi
          maxWidth={roadWidth}
          maxHeight={roadHeight}
          targetLane={targetLane}
          currentLane={currentLane}
          onMoveComplete={handleMoveComplete}
        />
        <div className="flex">
          {Level.easy.map((value, index) => (
            <RoadUI
              key={index}
              value={value}
              laneIndex={index + 1}
              onLaneClick={handleLaneClick}
              isTargetLane={targetLane === index + 1}
            />
          ))}
        </div>
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
    </div>
  );
}

export default GameUI;