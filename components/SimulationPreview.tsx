
import React, { useMemo } from 'react';
import { VehicleRule, ODPair } from '../types';
import { runSchedulingAlgorithm } from '../services/algorithm';
import { XCircle, Play, Users, SkipForward, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rules: VehicleRule[];
  demand: ODPair[];
}

export const SimulationPreview: React.FC<Props> = ({ isOpen, onClose, rules, demand }) => {
  if (!isOpen) return null;

  // Run algorithm whenever dependencies change
  const result = useMemo(() => {
    return runSchedulingAlgorithm(rules, demand);
  }, [rules, demand]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <Play className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">排班算法模拟预览</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-sm text-blue-600 font-medium">启用车辆数</div>
              <div className="text-2xl font-bold text-blue-900">{result.vehicleResults.length}</div>
            </div>
             <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
              <div className="text-sm text-emerald-600 font-medium">已排班人数</div>
              <div className="text-2xl font-bold text-emerald-900">
                {result.vehicleResults.reduce((acc, v) => acc + v.allocatedPassengers, 0)}
              </div>
            </div>
             <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-center">
              <div className="text-sm text-rose-600 font-medium">滞留/未分配人数</div>
              <div className="text-2xl font-bold text-rose-900">{result.unallocatedPassengers}</div>
            </div>
          </div>

          {/* Vehicle Logs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">处理日志详情</h3>
            {result.vehicleResults.map((vRes, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 flex justify-between items-center border-b border-slate-200">
                  <span className="font-semibold text-slate-700">
                    #{idx + 1} {rules.find(r => r.vehicleId === vRes.vehicleId)?.plateNumber}
                  </span>
                  <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-1 rounded">
                     剩余座位: {vRes.remainingSeats}
                  </span>
                </div>
                <div className="p-4 space-y-2 bg-white text-sm">
                  {vRes.logs.length === 0 && <p className="text-slate-400 italic">无操作记录。</p>}
                  {vRes.logs.map((log, lIdx) => (
                    <div key={lIdx} className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {log.type === 'allocation' && <Users className="w-4 h-4 text-emerald-500" />}
                        {log.type === 'skip' && <SkipForward className="w-4 h-4 text-amber-500" />}
                        {log.type === 'full' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                        {log.type === 'redundancy' && <CheckCircle className="w-4 h-4 text-purple-500" />}
                        {log.type === 'info' && <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 ml-1.5"></div>}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900 mr-2">[{log.step}]</span>
                        <span className="text-slate-600">{log.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium">
            关闭模拟
          </button>
        </div>

      </div>
    </div>
  );
};
