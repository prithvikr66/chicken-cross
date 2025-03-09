import CoinImg from "../assets/road_coin.svg";

interface RoadUIProps {
  laneIndex: number;
  value: number;
  onLaneClick: (laneIndex: number) => void;
  isTargetLane: boolean;
  loading: boolean; // New prop to indicate if game data is still loading
}

function RoadUI({ laneIndex, value, onLaneClick, isTargetLane, loading }: RoadUIProps) {
  // Determine background color based on loading state
  const bgColor = loading ? "bg-[#252745]" : "bg-[#313464]";
  const hoverColor = loading ? "hover:bg-[#252745]" : "hover:bg-[#3b3e70]";
  
  return (
    <div
      className={`${bgColor} border-r-4 border-dashed border-white flex justify-center items-center h-full ${
        loading ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      } ${hoverColor} ${
        isTargetLane ? "border-4 border-yellow-500" : ""
      }`}
      style={{ width: "200px" }}
      onClick={() => !loading && onLaneClick(laneIndex)}
    >
      {/* Coin container */}
      <div className="relative flex items-center justify-center">
        {/* Coin Image */}
        <img
          src={CoinImg}
          alt="Coin"
          className={`w-16 h-16 ${loading ? "" : "hover:scale-110 transition-transform"}`}
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