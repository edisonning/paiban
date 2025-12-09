
import React, { useState } from 'react';
import { ShiftList } from './components/ShiftList';
import { RuleEditor } from './components/RuleEditor';
import { ShiftProfile, Route, VehicleRule } from './types';
import { MOCK_SHIFTS } from './constants';

function App() {
  // Initialize shifts from mock data into state so we can update it
  const [shifts, setShifts] = useState<ShiftProfile[]>(MOCK_SHIFTS);
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const handleRouteSelect = (shift: ShiftProfile, route: Route) => {
    setSelectedRoute(route);
    setCurrentView('editor');
  };

  const handleBack = () => {
    setSelectedRoute(null);
    setCurrentView('list');
  };

  // Handler to save updated rules from RuleEditor
  const handleSaveRules = (routeId: string, newRules: VehicleRule[]) => {
    const updatedShifts = shifts.map(shift => ({
      ...shift,
      routes: shift.routes.map(r => {
        if (r.id === routeId) {
          return { ...r, rules: newRules };
        }
        return r;
      })
    }));

    setShifts(updatedShifts);
    
    // Update the currently selected route to reflect changes (good for consistency)
    if (selectedRoute && selectedRoute.id === routeId) {
        setSelectedRoute({ ...selectedRoute, rules: newRules });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Top Navigation Bar */}
      <nav className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">C</div>
          <span className="font-semibold tracking-tight">中车通勤车排班系统</span>
        </div>
        <div className="text-xs text-slate-400">
           v1.0.1 (规则引擎)
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="h-[calc(100vh-56px)] overflow-hidden">
        {currentView === 'list' && (
          <div className="h-full overflow-y-auto">
            <ShiftList shifts={shifts} onSelectRoute={handleRouteSelect} />
          </div>
        )}
        
        {currentView === 'editor' && selectedRoute && (
          <RuleEditor 
            route={selectedRoute} 
            onBack={handleBack} 
            onSave={handleSaveRules}
          />
        )}
      </main>
    </div>
  );
}

export default App;
