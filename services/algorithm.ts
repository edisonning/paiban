
import { VehicleRule, ODPair, SimulationResult, SimulationLog } from '../types';

interface DemandPool {
  [odId: string]: number; // count of passengers waiting for specific OD
}

export const runSchedulingAlgorithm = (
  rules: VehicleRule[],
  mockDemand: ODPair[]
): SimulationResult => {
  
  // Deep copy demand so we can mutate it during simulation
  const demandPool: DemandPool = {};
  mockDemand.forEach(d => {
    demandPool[d.id] = d.estimatedDemand || 0;
  });

  const results: SimulationResult['vehicleResults'] = [];
  
  // Step 1: Sort Vehicles by Priority (High to Low)
  const sortedVehicles = [...rules].sort((a, b) => b.priority - a.priority);

  for (const vehicle of sortedVehicles) {
    const logs: SimulationLog[] = [];
    let currentSeats = vehicle.availableSeats;
    let captainSeatsReserved = 0;
    
    logs.push({ step: '初始化', details: `车辆 ${vehicle.plateNumber} 初始可用座位: ${currentSeats}`, type: 'info' });

    // Step 1.3: Captain Reservation Logic
    // Priority: Temp Captain > Fixed Captain
    if (vehicle.enableTempCaptain && vehicle.tempCaptainNames && vehicle.tempCaptainNames.length > 0) {
      const count = vehicle.tempCaptainNames.length;
      currentSeats -= count;
      captainSeatsReserved = count;
      logs.push({ step: '车长预留', details: `启用 ${count} 名临时车长: ${vehicle.tempCaptainNames.join(', ')}，预留 ${count} 个座位。剩余: ${currentSeats}`, type: 'info' });
    } else if (vehicle.hasFixedCaptain) {
      currentSeats -= 1;
      captainSeatsReserved = 1;
      logs.push({ step: '车长预留', details: `启用固定车长: ${vehicle.fixedCaptainName || '未知'}，预留 1 个座位。剩余: ${currentSeats}`, type: 'info' });
    }

    // Step 2: Main Loop - Iterate OD Priorities
    for (const od of vehicle.odPriorityList) {
      if (currentSeats <= 0) break;

      const waitingCount = demandPool[od.id] || 0;
      if (waitingCount === 0) continue;

      // Step 2.1: Full Load Threshold Check (Pruning/Skip Logic)
      let skipOD = false;
      if (vehicle.fullLoadThreshold.enabled) {
        if (currentSeats <= vehicle.fullLoadThreshold.value) {
          // Check if demand is greater than remaining seats (would break a group)
          if (waitingCount > currentSeats) {
            skipOD = true;
            logs.push({ 
              step: '满载跳过', 
              details: `跳过 OD [${od.origin}->${od.destination}]。待排人数(${waitingCount}) > 剩余座位(${currentSeats}) 且触发满载阈值（防止拆团）。`, 
              type: 'skip' 
            });
          }
        }
      }

      // Step 2.2: Regular Allocation
      if (!skipOD) {
        const allocateCount = Math.min(waitingCount, currentSeats);
        if (allocateCount > 0) {
          demandPool[od.id] -= allocateCount;
          currentSeats -= allocateCount;
          logs.push({ 
            step: '常规分配', 
            details: `接纳 ${allocateCount} 人 [${od.origin}->${od.destination}]。剩余座位: ${currentSeats}`, 
            type: 'allocation' 
          });
        }
      }
    }

    // Step 3: Redundancy (Bottom-filling logic)
    if (currentSeats > 0 && vehicle.redundancyThreshold.enabled) {
      const lastOD = vehicle.odPriorityList[vehicle.odPriorityList.length - 1];
      if (lastOD) {
        const remainingDemand = demandPool[lastOD.id] || 0;
        // Logic: If remaining demand is small enough (<= threshold) AND > 0
        if (remainingDemand > 0 && remainingDemand <= vehicle.redundancyThreshold.value) {
            // PRD: "Allow arranging persons within physical seat limits".
            const physicalRemaining = (vehicle.totalSeats - (vehicle.availableSeats - currentSeats)) - captainSeatsReserved;
            
            if (remainingDemand <= physicalRemaining) {
                 demandPool[lastOD.id] = 0; // Take them all
                 currentSeats -= remainingDemand; 
                 logs.push({
                    step: '冗余兜底',
                    details: `在末站 [${lastOD.origin}] 触发兜底机制，强行安排剩余 ${remainingDemand} 人。`,
                    type: 'redundancy'
                 });
            }
        }
      }
    }

    if (currentSeats <= 0) {
         logs.push({ step: '状态', details: '车辆已满载', type: 'full' });
    }

    results.push({
      vehicleId: vehicle.vehicleId,
      allocatedPassengers: (vehicle.availableSeats - captainSeatsReserved) - currentSeats,
      remainingSeats: currentSeats,
      logs
    });
  }

  // Calculate unallocated
  const totalLeft = Object.values(demandPool).reduce((a, b) => a + b, 0);

  return {
    vehicleResults: results,
    unallocatedPassengers: totalLeft
  };
};
