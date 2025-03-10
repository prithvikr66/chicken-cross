import React, { useState, useEffect, useRef } from "react";
import Car1Img from "../assets/car_1.svg";
import Car2Img from "../assets/car_2.svg";

interface CarUiProps {
  difficulty: "easy" | "medium" | "hard" | "daredevil";
  henLane: number;
  roadWidth: number;
  forceCrashCar?: boolean;
  crashLane?: number;
  // NEW CALLBACKS to notify GameUI:
  onCrashPass?: () => void;       // Called when the crash car is “over” the cock
  onCrashComplete?: () => void;   // Called when the crash car fully exits
}

interface CarType {
  id: number;
  lane: number;
  image: string;
  top: number; // from -50% (above screen) to 120% (exited below)
  isCrashCar?: boolean;
}

const CarUi: React.FC<CarUiProps> = ({
  difficulty,
  henLane,
  roadWidth,
  forceCrashCar,
  crashLane,
  onCrashPass,
  onCrashComplete,
}) => {
  const [cars, setCars] = useState<CarType[]>([]);
  const nextId = useRef(0);
  const lanesCount = difficulty === "easy" ? 6 : 5;
  const crossedLanes = useRef<number[]>([]);

  // Keep track of the crash car’s ID (if any) so we can detect its progress
  const [crashCarId, setCrashCarId] = useState<number | null>(null);

  // Speed at which cars travel from top to bottom:
  const speedMap: Record<"easy" | "medium" | "hard" | "daredevil", number> = {
    easy: 5000,
    medium: 2000,
    hard: 800,
    daredevil: 500, // for example
  };
  const travelTime = speedMap[difficulty];

  // Keep track of whether we have already triggered "onCrashPass"
  const hasPassedRef = useRef(false);

  useEffect(() => {
    if (henLane > 0) {
      const newCrossedLanes = [];
      for (let i = 1; i <= henLane; i++) {
        newCrossedLanes.push(i);
      }
      crossedLanes.current = newCrossedLanes;
    }
  }, [henLane]);

  // Regular random car spawning (not the forced crash car)
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      setCars((prevCars) => {
        // Choose a lane where the hen hasn’t already crossed and there’s no existing car
        const availableLanes = Array.from({ length: lanesCount }, (_, i) => i + 1).filter(
          (lane) =>
            !crossedLanes.current.includes(lane) &&
            !prevCars.some((car) => car.lane === lane && !car.isCrashCar)
        );
        if (availableLanes.length === 0) return prevCars;

        const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
        const images = [Car1Img, Car2Img];
        const image = images[Math.floor(Math.random() * images.length)];

        const id = nextId.current++;
        const newCar: CarType = { id, lane, image, top: -50 };
        // Animate the car downward
        setTimeout(() => {
          setCars((currentCars) =>
            currentCars.map((car) =>
              car.id === id ? { ...car, top: 120 } : car
            )
          );
        }, 50);

        // Remove the car after it exits
        setTimeout(() => {
          setCars((currentCars) => currentCars.filter((c) => c.id !== id));
        }, travelTime + 100);

        return [...prevCars, newCar];
      });
    }, 2000);

    return () => clearInterval(spawnInterval);
  }, [difficulty, henLane, lanesCount, travelTime]);

  /**
   * Force-spawn a “crash car” in the crashLane, if forceCrashCar is true.
   * This car is special: isCrashCar = true. We track it in crashCarId state.
   */
  useEffect(() => {
    if (forceCrashCar && crashLane) {
      const id = nextId.current++;
      setCrashCarId(id); // remember this is the forced crash car
      const newCar: CarType = {
        id,
        lane: crashLane,
        image: Car1Img,
        top: -50,
        isCrashCar: true,
      };

      setCars((prevCars) => [...prevCars, newCar]);

      // Animate it downward
      setTimeout(() => {
        setCars((currentCars) =>
          currentCars.map((car) =>
            car.id === id ? { ...car, top: 120 } : car
          )
        );
      }, 50);

      // After it exits bottom, remove from state
      setTimeout(() => {
        setCars((currentCars) => currentCars.filter((car) => car.id !== id));
      }, travelTime + 100);
    }
  }, [forceCrashCar, crashLane, travelTime]);

  /**
   * Monitor the position of the "crash car" (if any).
   * If it has reached the hen’s Y-range, call onCrashPass().
   * If the crash car is removed from state, call onCrashComplete().
   */
  useEffect(() => {
    if (crashCarId === null) return;

    // Find the crash car in the array
    const crashCar = cars.find((c) => c.id === crashCarId);

    // If the crash car no longer exists in `cars`, that means it was removed => fully exited
    if (!crashCar) {
      // If we had a crashCar and it's gone, trigger onCrashComplete
      onCrashComplete?.();
      return;
    }

    // If the crash car is around 50% - 60% top, it is “over” the cock
    // => we call onCrashPass once
    if (!hasPassedRef.current && crashCar.top >= 50) {
      hasPassedRef.current = true;
      onCrashPass?.();
    }
  }, [cars, crashCarId, onCrashPass, onCrashComplete]);

  return (
    <div className="relative w-full h-full overflow-hidden z-10">
      {cars.map((car) => (
        <div
          key={car.id}
          className="absolute transition-all ease-linear z-10"
          style={{
            top: `${car.top}%`,
            left: `${(car.lane - 1) * roadWidth}px`,
            width: `${roadWidth}px`,
            height: "100px",
            display: "flex",
            justifyContent: "center",
            transitionDuration: `${travelTime}ms`,
          }}
        >
          <img src={car.image} alt="Car" className="w-[400px] h-[150px]" />
        </div>
      ))}
    </div>
  );
};

export default CarUi;
