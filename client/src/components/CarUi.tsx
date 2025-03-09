import React, { useState, useEffect, useRef } from "react";
// Import car images
import Car1Img from "../assets/car_1.svg";
import Car2Img from "../assets/car_2.svg";

// Define props interface
interface CarUiProps {
  difficulty: "easy" | "medium" | "hard"|"daredevil";
  henLane: number;
  roadWidth: number;
}

// Define car object type
interface CarType {
  id: number;
  lane: number;
  image: string;
  top: number; // Position from top (0% to 100%)
}

const CarUi: React.FC<CarUiProps> = ({ difficulty, henLane, roadWidth }) => {
  const [cars, setCars] = useState<CarType[]>([]); // Active cars in state
  const nextId = useRef(0); // Unique ID tracker
  const lanesCount = difficulty === "easy" ? 6 : 5; // Count from Level object
  const crossedLanes = useRef<number[]>([]); // Track lanes the cock has crossed

  // Effect to update crossedLanes when henLane changes
  useEffect(() => {
    // When the hen moves to a new lane, add all previous lanes to crossedLanes
    if (henLane > 0) {
      const newCrossedLanes = [];
      for (let i = 1; i <= henLane; i++) {
        newCrossedLanes.push(i);
      }
      crossedLanes.current = newCrossedLanes;
    }
  }, [henLane]);

  // Define speed for each difficulty level
  const speedMap: Record<"easy" | "medium" | "hard", number> = {
    easy: 5000, // 5s
    medium: 2000, // 3s
    hard: 800, // 2s
  };
  const travelTime = speedMap[difficulty]; // Get time based on difficulty

  // Effect: Spawn new cars at intervals
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      setCars((prevCars) => {
        // Get all lanes that are greater than the current henLane
        // This ensures cars only spawn on lanes the cock hasn't crossed yet
        const availableLanes = Array.from(
          { length: lanesCount },
          (_, i) => i + 1
        ).filter(
          (lane) =>
            !crossedLanes.current.includes(lane) && // Don't spawn on crossed lanes
            !prevCars.some((car) => car.lane === lane) // Don't spawn where a car already exists
        );

        if (availableLanes.length === 0) return prevCars; // No available lanes

        const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
        const images = [Car1Img, Car2Img];
        const image = images[Math.floor(Math.random() * images.length)];

        const id = nextId.current++;
        const newCar: CarType = { id, lane, image, top: -50 }; // Start above the visible area

        setTimeout(() => {
          setCars((currentCars) =>
            currentCars.map((car) =>
              car.id === id ? { ...car, top: 120 } : car // Move to below the visible area
            )
          );
        }, 50);

        setTimeout(() => {
          setCars((currentCars) => currentCars.filter((car) => car.id !== id));
        }, travelTime);

        return [...prevCars, newCar];
      });
    }, 2000); // Spawn every 2 seconds

    return () => clearInterval(spawnInterval); // Cleanup on unmount
  }, [difficulty, henLane, lanesCount, travelTime]);

  // Effect: Check for collisions (hen vs. car in the same lane)
  useEffect(() => {
    cars.forEach((car) => {
      if (car.lane === henLane && car.top > 40 && car.top < 60) {
        console.log(`Collision! Hen and car in lane ${henLane}`);
        // Could trigger game over or other effects here
      }
    });
  }, [cars, henLane]);

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
          <img
            src={car.image}
            alt="Car"
            className="w-[400px] h-[150px] "
          />
        </div>
      ))}
    </div>
  );
};

export default CarUi;