
import { ShiftProfile, Route, ODPair, VehicleMasterData } from './types';

export const MOCK_OD_PAIRS: ODPair[] = [
  { id: 'od1', origin: '职工新村A区', destination: '一号厂门', estimatedDemand: 45 },
  { id: 'od2', origin: '地铁B站口', destination: '一号厂门', estimatedDemand: 12 },
  { id: 'od3', origin: '市中心C点', destination: '一号厂门', estimatedDemand: 8 },
  { id: 'od4', origin: '职工新村A区', destination: '二号厂门', estimatedDemand: 20 },
];

export const MOCK_AVAILABLE_CAPTAINS = [
  "临时车长A", "临时车长B", "临时车长C", "临时车长D", "临时车长E", "王五", "赵六", "孙七"
];

// Master Data: Available Vehicles to bind
export const MOCK_VEHICLE_POOL: VehicleMasterData[] = [
  { vehicleId: 'VH-003', plateNumber: '京A-12345', organization: '二车队', driverName: '赵师傅', totalSeats: 45, fixedCaptainName: '孙七' },
  { vehicleId: 'VH-004', plateNumber: '京A-98765', organization: '三车队', driverName: '钱师傅', totalSeats: 50 }, // No fixed captain
  { vehicleId: 'VH-005', plateNumber: '京A-54321', organization: '一车队', driverName: '周师傅', totalSeats: 33, fixedCaptainName: '吴八' },
];

export const MOCK_SHIFTS: ShiftProfile[] = [
  {
    id: 's1',
    name: '早班 - 总厂方向',
    type: 'Morning',
    organization: '生产管理部',
    operatingTime: '07:00 - 08:30',
    dateRange: '2023-10-01 至 2023-12-31',
    bookingOpenTime: '前一日 18:00',
    bookingDeadline: '当日 06:00',
    routes: [
      {
        id: 'r1',
        name: '线路 101: 北区 -> 总厂',
        origin: '北区生活区',
        destination: '总厂',
        rules: [
          {
            id: 'v1',
            vehicleId: 'VH-001',
            plateNumber: '京A-88888',
            organization: '一车队',
            driverName: '张师傅',
            totalSeats: 50,
            availableSeats: 48,
            hasFixedCaptain: true,
            fixedCaptainName: '李四',
            enableTempCaptain: false,
            tempCaptainNames: [],
            priority: 100, // 高优先级
            fullLoadThreshold: { enabled: true, value: 3 },
            redundancyThreshold: { enabled: true, value: 2 },
            odPriorityList: [MOCK_OD_PAIRS[0], MOCK_OD_PAIRS[1]]
          },
          {
            id: 'v2',
            vehicleId: 'VH-002',
            plateNumber: '京A-66666',
            organization: '一车队',
            driverName: '王师傅',
            totalSeats: 30,
            availableSeats: 30,
            hasFixedCaptain: false,
            enableTempCaptain: false,
            tempCaptainNames: [],
            priority: 90,
            fullLoadThreshold: { enabled: false, value: 5 },
            redundancyThreshold: { enabled: false, value: 2 },
            odPriorityList: [MOCK_OD_PAIRS[0], MOCK_OD_PAIRS[2]]
          }
        ]
      },
      {
        id: 'r2',
        name: '线路 102: 南区 -> 总厂',
        origin: '南区生活区',
        destination: '总厂',
        rules: [
            {
                id: 'v3',
                vehicleId: 'VH-003',
                plateNumber: '京A-12345',
                organization: '二车队',
                driverName: '赵师傅',
                totalSeats: 45,
                availableSeats: 44,
                hasFixedCaptain: true,
                fixedCaptainName: '孙七',
                enableTempCaptain: false,
                tempCaptainNames: [],
                priority: 100,
                fullLoadThreshold: { enabled: true, value: 4 },
                redundancyThreshold: { enabled: true, value: 5 },
                odPriorityList: [MOCK_OD_PAIRS[0], MOCK_OD_PAIRS[3]]
            }
        ]
      },
      {
        id: 'r3',
        name: '线路 103: 地铁接驳专线',
        origin: '地铁B站口',
        destination: '二分厂',
        rules: [
            {
                id: 'v4',
                vehicleId: 'VH-004',
                plateNumber: '京A-98765',
                organization: '三车队',
                driverName: '钱师傅',
                totalSeats: 50,
                availableSeats: 50,
                hasFixedCaptain: false,
                fixedCaptainName: undefined,
                enableTempCaptain: true,
                tempCaptainNames: ['临时车长A'],
                priority: 100,
                fullLoadThreshold: { enabled: false, value: 0 },
                redundancyThreshold: { enabled: true, value: 10 },
                odPriorityList: [MOCK_OD_PAIRS[1]]
            }
        ]
      }
    ]
  }
];
