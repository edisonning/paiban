
import React, { useState, useRef } from 'react';
import { Route, VehicleRule, ODPair, ThresholdConfig, VehicleMasterData } from '../types';
import { MOCK_OD_PAIRS, MOCK_VEHICLE_POOL, MOCK_AVAILABLE_CAPTAINS } from '../constants';
import { ArrowUp, ArrowDown, Trash2, Plus, GripVertical, Settings, User, Bus, X, Check, ChevronDown, Save } from 'lucide-react';
import { SimulationPreview } from './SimulationPreview';

interface Props {
  route: Route;
  onBack: () => void;
  onSave: (routeId: string, rules: VehicleRule[]) => void;
}

export const RuleEditor: React.FC<Props> = ({ route, onBack, onSave }) => {
  const [rules, setRules] = useState<VehicleRule[]>(route.rules);
  const [showSim, setShowSim] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

  // Refs for Drag and Drop
  const dragItem = useRef<{ ruleId: string; index: number } | null>(null);
  const dragOverItem = useRef<{ ruleId: string; index: number } | null>(null);

  // Helper to update a specific vehicle rule
  const updateRule = (id: string, updates: Partial<VehicleRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  // Helper to update thresholds
  const updateThreshold = (ruleId: string, type: 'fullLoadThreshold' | 'redundancyThreshold', field: keyof ThresholdConfig, val: any) => {
    setRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      return {
        ...r,
        [type]: {
          ...r[type],
          [field]: val
        }
      };
    }));
  };

  // Move vehicle priority up/down
  const moveVehicle = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === rules.length - 1) return;
    
    const newRules = [...rules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newRules[index], newRules[targetIndex]] = [newRules[targetIndex], newRules[index]];
    
    // Update numerical priorities to reflect new order
    const prioritizedRules = newRules.map((r, idx) => ({
        ...r,
        priority: 100 - idx
    }));
    
    setRules(prioritizedRules);
  };

  const addOD = (ruleId: string, od: ODPair) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule && !rule.odPriorityList.find(o => o.id === od.id)) {
      updateRule(ruleId, { odPriorityList: [...rule.odPriorityList, od] });
    }
  };

  const removeOD = (ruleId: string, odId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      updateRule(ruleId, { odPriorityList: rule.odPriorityList.filter(o => o.id !== odId) });
    }
  };

  const removeVehicle = (ruleId: string) => {
      setRules(prev => prev.filter(r => r.id !== ruleId));
  }

  const handleAddVehicle = (vehicle: VehicleMasterData) => {
      // Create new rule from master data
      const newRule: VehicleRule = {
          id: `new-${Date.now()}`,
          vehicleId: vehicle.vehicleId,
          plateNumber: vehicle.plateNumber,
          organization: vehicle.organization,
          driverName: vehicle.driverName,
          totalSeats: vehicle.totalSeats,
          availableSeats: vehicle.totalSeats, // Default to total
          hasFixedCaptain: !!vehicle.fixedCaptainName,
          fixedCaptainName: vehicle.fixedCaptainName,
          enableTempCaptain: false,
          tempCaptainNames: [],
          priority: 0, // Will be fixed by re-sort or append
          fullLoadThreshold: { enabled: true, value: 3 }, // Default policy
          redundancyThreshold: { enabled: true, value: 2 }, // Default policy
          odPriorityList: []
      };

      setRules(prev => {
        const updated = [...prev, newRule];
        // Recalculate priorities
        return updated.map((r, idx) => ({ ...r, priority: 100 - idx }));
      });
      setShowAddVehicleModal(false);
  };

  const toggleTempCaptain = (ruleId: string, name: string) => {
      const rule = rules.find(r => r.id === ruleId);
      if(!rule) return;
      
      const current = rule.tempCaptainNames || [];
      const isSelected = current.includes(name);
      
      let newNames;
      if(isSelected) {
          newNames = current.filter(n => n !== name);
      } else {
          newNames = [...current, name];
      }
      updateRule(ruleId, { tempCaptainNames: newNames });
  };

  const handleSave = () => {
    onSave(route.id, rules);
    alert('排班规则配置已保存！');
  };

  // Drag and Drop Handlers for OD List
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ruleId: string, index: number) => {
    dragItem.current = { ruleId, index };
    // e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, ruleId: string, index: number) => {
    // Only sort if we are dragging an item from the same list (rule)
    if (!dragItem.current || dragItem.current.ruleId !== ruleId) return;
    
    // If the item is dragged over itself, ignore
    if (dragItem.current.index === index) return;

    const _rules = [...rules];
    const rIndex = _rules.findIndex(r => r.id === ruleId);
    if (rIndex === -1) return;

    const newList = [..._rules[rIndex].odPriorityList];
    const draggedItemContent = newList[dragItem.current.index];
    
    // Remove the item from its old position
    newList.splice(dragItem.current.index, 1);
    // Insert it at the new position
    newList.splice(index, 0, draggedItemContent);
    
    // Update local state
    _rules[rIndex] = { ..._rules[rIndex], odPriorityList: newList };
    setRules(_rules);

    // Update the reference so we track the item's new index
    dragItem.current.index = index;
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
           <button onClick={onBack} className="text-sm text-slate-500 hover:text-blue-600 mb-1">
             &larr; 返回班次列表
           </button>
           <h1 className="text-2xl font-bold text-slate-900">{route.name}</h1>
           <p className="text-sm text-slate-500">配置车辆排班规则与算法逻辑</p>
        </div>
        <div className="flex space-x-3">
             <button 
                onClick={handleSave}
                className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow-md">
                <Save className="w-4 h-4" />
                <span>保存配置</span>
            </button>
            <button 
                onClick={() => setShowSim(true)}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md">
                <Settings className="w-4 h-4" />
                <span>模拟排班逻辑</span>
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 max-w-5xl mx-auto w-full space-y-6 pb-20">
        
        {/* Vehicles List */}
        <div className="space-y-4">
            {rules.map((rule, idx) => (
                <div key={rule.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                    {/* Vehicle Header / Priority Bar */}
                    <div className="bg-slate-100 p-3 flex items-center justify-between border-b border-slate-200">
                        <div className="flex items-center space-x-4">
                            <div className="flex flex-col space-y-1">
                                <button onClick={() => moveVehicle(idx, 'up')} disabled={idx === 0} className="p-1 rounded hover:bg-white text-slate-500 disabled:opacity-30">
                                    <ArrowUp className="w-4 h-4" />
                                </button>
                                <button onClick={() => moveVehicle(idx, 'down')} disabled={idx === rules.length - 1} className="p-1 rounded hover:bg-white text-slate-500 disabled:opacity-30">
                                    <ArrowDown className="w-4 h-4" />
                                </button>
                            </div>
                            <span className="text-2xl font-bold text-slate-400 w-8 text-center">{idx + 1}</span>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    {rule.plateNumber}
                                    <span className="text-xs font-normal px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">优先级 {rule.priority}</span>
                                </h3>
                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                    <span className="font-mono bg-slate-200 px-1 rounded">{rule.vehicleId}</span>
                                    <span>{rule.organization}</span>
                                    <span>•</span>
                                    <span>司机: {rule.driverName}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                             <div className="text-right">
                                <div className="text-sm font-medium text-slate-600">可用 / 总座</div>
                                <div className="text-lg font-bold text-slate-900">{rule.availableSeats} <span className="text-slate-400 text-sm font-normal">/ {rule.totalSeats}</span></div>
                            </div>
                             <button onClick={() => removeVehicle(rule.id)} className="text-slate-400 hover:text-rose-500 p-2">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:divide-x divide-slate-100">
                        {/* Column 1: Capacity & Resources */}
                        <div className="p-5 space-y-5">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
                                <User className="w-4 h-4 mr-1.5" /> 资源配置
                            </h4>
                            
                            {/* Captain Config */}
                            <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-3">
                                {/* Fixed Captain Info */}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">固定车长:</span>
                                    {rule.hasFixedCaptain ? (
                                        <span className="font-medium text-slate-800">{rule.fixedCaptainName}</span>
                                    ) : (
                                        <span className="text-slate-400 italic">无</span>
                                    )}
                                </div>

                                {/* Temp Captain Toggle */}
                                <div className="pt-2 border-t border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-blue-800">启用临时车长</label>
                                        <input 
                                            type="checkbox"
                                            checked={rule.enableTempCaptain}
                                            onChange={(e) => updateRule(rule.id, { enableTempCaptain: e.target.checked })}
                                            className="h-4 w-4 text-blue-600 rounded"
                                        />
                                    </div>
                                    
                                    {/* Multi-select for Captains */}
                                    {rule.enableTempCaptain && (
                                        <div className="space-y-2">
                                             <div className="flex flex-wrap gap-1.5 mb-2">
                                                {rule.tempCaptainNames && rule.tempCaptainNames.length > 0 ? (
                                                    rule.tempCaptainNames.map(name => (
                                                        <span key={name} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            {name}
                                                            <button onClick={() => toggleTempCaptain(rule.id, name)} className="ml-1 text-blue-600 hover:text-blue-900"><X className="w-3 h-3"/></button>
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400">请选择临时车长</span>
                                                )}
                                             </div>
                                            
                                            <div className="relative group/captain-select">
                                                <button className="w-full text-left text-xs bg-white border border-slate-300 rounded px-2 py-1.5 flex items-center justify-between hover:border-blue-500">
                                                    <span>选择人员...</span>
                                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                                </button>
                                                
                                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-lg rounded-md z-20 hidden group-hover/captain-select:block max-h-40 overflow-y-auto">
                                                    {MOCK_AVAILABLE_CAPTAINS.map(cap => {
                                                        const isSelected = rule.tempCaptainNames?.includes(cap);
                                                        return (
                                                            <div 
                                                                key={cap} 
                                                                onClick={() => toggleTempCaptain(rule.id, cap)}
                                                                className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-slate-50 ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                                                            >
                                                                <span>{cap}</span>
                                                                {isSelected && <Check className="w-3 h-3" />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                        {(rule.enableTempCaptain && rule.tempCaptainNames && rule.tempCaptainNames.length > 0) 
                                            ? `已预留 ${rule.tempCaptainNames.length} 个座位 (覆盖固定车长)` 
                                            : (rule.hasFixedCaptain ? "固定车长预留 1 座" : "当前不占座")}
                                    </div>
                                </div>
                            </div>

                            {/* Seat Limits */}
                             <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">排班可用座位上限</label>
                                <input 
                                    type="number" 
                                    max={rule.totalSeats}
                                    value={rule.availableSeats}
                                    onChange={(e) => updateRule(rule.id, { availableSeats: Math.min(parseInt(e.target.value), rule.totalSeats) })}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                                <div className="text-xs text-slate-400 mt-1">物理总座: {rule.totalSeats}</div>
                            </div>
                        </div>

                        {/* Column 2: Threshold Logic */}
                        <div className="p-5 space-y-5 bg-slate-50/30">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
                                <Settings className="w-4 h-4 mr-1.5" /> 阈值控制
                            </h4>
                            
                            {/* Full Load Threshold */}
                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-slate-700">满载座位阈值</label>
                                    <input 
                                        type="checkbox" 
                                        checked={rule.fullLoadThreshold.enabled}
                                        onChange={(e) => updateThreshold(rule.id, 'fullLoadThreshold', 'enabled', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 rounded" 
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        value={rule.fullLoadThreshold.value}
                                        disabled={!rule.fullLoadThreshold.enabled}
                                        onChange={(e) => updateThreshold(rule.id, 'fullLoadThreshold', 'value', parseInt(e.target.value))}
                                        className="w-full px-2 py-1 border rounded text-sm disabled:bg-slate-100"
                                    />
                                    <span className="text-sm text-slate-600 w-8">座</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">触发时跳过大团需求</div>
                            </div>

                             {/* Redundancy Threshold */}
                             <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-slate-700">冗余座位阈值</label>
                                    <input 
                                        type="checkbox" 
                                        checked={rule.redundancyThreshold.enabled}
                                        onChange={(e) => updateThreshold(rule.id, 'redundancyThreshold', 'enabled', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 rounded" 
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        value={rule.redundancyThreshold.value}
                                        disabled={!rule.redundancyThreshold.enabled}
                                        onChange={(e) => updateThreshold(rule.id, 'redundancyThreshold', 'value', parseInt(e.target.value))}
                                        className="w-full px-2 py-1 border rounded text-sm disabled:bg-slate-100"
                                    />
                                    <span className="text-sm text-slate-600 w-8">人</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">末站剩余少量时强塞</div>
                            </div>
                        </div>

                        {/* Column 3: OD Priority */}
                        <div className="p-5 space-y-4">
                             <div className="flex justify-between items-center">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">OD 优先标志</h4>
                                <div className="relative group/add">
                                    <button className="text-xs flex items-center text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50">
                                        <Plus className="w-3 h-3 mr-1"/> 添加流向
                                    </button>
                                    {/* Dropdown to add OD (Mock implementation) */}
                                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 shadow-lg rounded-lg hidden group-hover/add:block z-20 max-h-48 overflow-y-auto">
                                        {MOCK_OD_PAIRS.map(od => (
                                            <button 
                                                key={od.id}
                                                onClick={() => addOD(rule.id, od)}
                                                className="block w-full text-left px-4 py-3 text-xs hover:bg-slate-50 text-slate-700 border-b border-slate-100 last:border-0"
                                            >
                                                <div className="font-semibold">{od.origin} &rarr; {od.destination}</div>
                                                <div className="text-slate-400 scale-90 origin-left mt-0.5">预估 {od.estimatedDemand} 人</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                             </div>
                             
                             <div className="space-y-2 min-h-[100px]">
                                {rule.odPriorityList.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                                        <span>未配置 OD 流向</span>
                                        <span className="text-xs mt-1">车辆将不会接单</span>
                                    </div>
                                )}
                                {rule.odPriorityList.map((od, odIdx) => (
                                    <div 
                                        key={`${rule.id}-${od.id}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, rule.id, odIdx)}
                                        onDragEnter={(e) => handleDragEnter(e, rule.id, odIdx)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => e.preventDefault()}
                                        className="flex items-center bg-white border border-slate-200 rounded-md p-2 shadow-sm hover:border-blue-300 transition group/od cursor-move"
                                    >
                                        <div className="text-slate-300 mr-2 flex flex-col items-center justify-center w-5">
                                            <span className="text-[10px] font-bold text-blue-500 mb-0.5">{odIdx + 1}</span>
                                            <GripVertical className="w-3 h-3" />
                                        </div>
                                        <div className="flex-1 text-sm select-none">
                                            <div className="text-slate-700 font-medium">{od.origin} &rarr; {od.destination}</div>
                                        </div>
                                        <button 
                                            onClick={() => removeOD(rule.id, od.id)}
                                            className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover/od:opacity-100 transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        {/* Add Vehicle Button */}
        <div 
            onClick={() => setShowAddVehicleModal(true)}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition cursor-pointer"
        >
            <Plus className="w-8 h-8 mb-2" />
            <span className="font-medium">绑定新车号到线路</span>
        </div>

      </div>

      <SimulationPreview 
        isOpen={showSim} 
        onClose={() => setShowSim(false)} 
        rules={rules} 
        demand={MOCK_OD_PAIRS}
      />

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[80vh]">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg text-slate-800">选择车号绑定</h3>
                      <button onClick={() => setShowAddVehicleModal(false)}><X className="w-6 h-6 text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <div className="overflow-y-auto p-4 space-y-3">
                      {MOCK_VEHICLE_POOL.filter(v => !rules.find(r => r.vehicleId === v.vehicleId)).length === 0 && (
                          <div className="text-center py-8 text-slate-500">
                              没有更多可用车号。
                          </div>
                      )}
                      {MOCK_VEHICLE_POOL.filter(v => !rules.find(r => r.vehicleId === v.vehicleId)).map(vehicle => (
                          <div key={vehicle.vehicleId} 
                               onClick={() => handleAddVehicle(vehicle)}
                               className="group border border-slate-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <div className="bg-slate-100 text-slate-600 p-3 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600">
                                      <Bus className="w-6 h-6" />
                                  </div>
                                  <div>
                                      <div className="font-bold text-slate-900">{vehicle.plateNumber}</div>
                                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                          <span className="font-mono bg-white border border-slate-200 px-1 rounded">{vehicle.vehicleId}</span>
                                          <span>{vehicle.organization}</span>
                                          <span>{vehicle.driverName}</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="text-lg font-bold text-slate-700">{vehicle.totalSeats}座</div>
                                  {vehicle.fixedCaptainName && (
                                      <div className="text-xs text-amber-600 flex items-center justify-end">
                                          <User className="w-3 h-3 mr-1" /> {vehicle.fixedCaptainName}
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
