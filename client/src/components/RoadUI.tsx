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
      className={`bg-[#313464] border-r-4 border-dashed border-white  hover:cursor-pointer flex justify-center items-center ${
        isTargetLane ? 'border-4 border-yellow-500' : ''
      }`}
      style={{ width: "200px", height: "400px" }}
      onClick={() => onLaneClick(laneIndex)}
    >
      <img src={CoinImg} alt="Coin" className="border hover:cursor-pointer w-16 h-16" />
      <span className="absolute border border-red-600 text-white text-sm font-bold">{value}x</span>
    </div> 
  );
}

export default RoadUI;