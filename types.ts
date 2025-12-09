
// 2.1 Shift Profile
export interface ShiftProfile {
  id: string;
  name: string;
  type: 'Morning' | 'Evening' | 'Night';
  organization: string;
  operatingTime: string;
  dateRange: string;
  bookingOpenTime: string;
  bookingDeadline: string;
  routes: Route[];
}

// Route Definition
export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  rules: VehicleRule[];
}

// 2.2 B. Capacity Control Parameters
export interface ThresholdConfig {
  enabled: boolean;
  value: number;
}

// 2.2 C. OD Priority
export interface ODPair {
  id: string;
  origin: string;
  destination: string;
  estimatedDemand?: number; // For simulation context
}

// Master Data for Vehicle Selection (The pool of available vehicles)
export interface VehicleMasterData {
  vehicleId: string;
  plateNumber: string;
  organization: string;
  driverName: string;
  totalSeats: number;
  fixedCaptainName?: string; // Information from master data
}

// 2.2 A. Scheduling Rule (Vehicle Configuration)
export interface VehicleRule {
  id: string;
  vehicleId: string;
  plateNumber: string;
  organization: string;
  driverName: string;
  totalSeats: number;
  availableSeats: number; // Configurable cap <= totalSeats
  
  // Resources
  hasFixedCaptain: boolean; // Inherited from master data or config
  fixedCaptainName?: string; // The name of the fixed captain
  
  // Temporary Captain (New Requirement)
  enableTempCaptain: boolean; // Toggle for this specific rule
  tempCaptainNames: string[]; // Names of the temp captains (Changed to Array)

  // Priority (Higher index in array = lower priority usually, but we will store explicit integer)
  priority: number; 

  // Thresholds
  fullLoadThreshold: ThresholdConfig; // "Skip if nearly full"
  redundancyThreshold: ThresholdConfig; // "Force fill if end of line"

  // OD Sequence
  odPriorityList: ODPair[];
}

// Simulation Types
export interface SimulationLog {
  step: string;
  details: string;
  type: 'info' | 'allocation' | 'skip' | 'full' | 'redundancy';
}

export interface SimulationResult {
  vehicleResults: {
    vehicleId: string;
    allocatedPassengers: number;
    remainingSeats: number;
    logs: SimulationLog[];
  }[];
  unallocatedPassengers: number;
}
