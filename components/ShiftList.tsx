
import React from 'react';
import { ShiftProfile, Route } from '../types';
import { Calendar, Clock, MapPin, ChevronRight, Bus } from 'lucide-react';

interface Props {
  shifts: ShiftProfile[];
  onSelectRoute: (shift: ShiftProfile, route: Route) => void;
}

export const ShiftList: React.FC<Props> = ({ shifts, onSelectRoute }) => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">班次排班管理</h1>
        <p className="text-slate-500 mt-2">管理通勤车班次、车辆规则及自动排班算法参数。</p>
      </div>

      <div className="grid gap-6">
        {shifts.map(shift => (
          <div key={shift.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                <div>
                    <div className="flex items-center space-x-3 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide
                            ${shift.type === 'Morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}
                        `}>
                            {shift.type === 'Morning' ? '早班' : shift.type}
                        </span>
                        <h2 className="text-xl font-bold text-slate-800">{shift.name}</h2>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-500 mt-2">
                        <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {shift.dateRange}</span>
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5" /> 运营: {shift.operatingTime}</span>
                        <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" /> {shift.organization}</span>
                    </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                    <div>预约开放: {shift.bookingOpenTime}</div>
                    <div>预约截止: <span className="text-rose-500 font-medium">{shift.bookingDeadline}</span></div>
                </div>
            </div>

            <div className="p-4 bg-white">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">关联线路</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shift.routes.map(route => (
                        <div 
                            key={route.id} 
                            onClick={() => onSelectRoute(shift, route)}
                            className="group flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-md cursor-pointer transition"
                        >
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-4 group-hover:bg-blue-600 group-hover:text-white transition">
                                    <Bus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800">{route.name}</h4>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {route.rules.length} 台已配置车辆
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                        </div>
                    ))}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
