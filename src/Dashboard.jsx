import React from 'react';

const Dashboard = ({ logs, inventory }) => {
  // 1. Calculate Daily Burn Rate (last 7 days)
  const dailyBurn = 45.5; // Placeholder: We will calculate this from logs later
  
  // 2. Calculate "Days of Feed Remaining"
  const daysRemaining = Math.floor(inventory.currentAmount / dailyBurn);
  
  // 3. Status Logic
  const getStatusColor = (days) => {
    if (days <= 3) return 'bg-red-500';    // Critical
    if (days <= 7) return 'bg-yellow-500'; // Warning
    return 'bg-green-500';                // Healthy
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {/* Metric 1: Runway */}
      <div className={`p-6 rounded-lg text-white ${getStatusColor(daysRemaining)}`}>
        <h3 className="text-sm font-bold uppercase">Feed Runway</h3>
        <p className="text-3xl font-extrabold">{daysRemaining} Days</p>
        <p className="text-xs">Based on 45lb/day average</p>
      </div>

      {/* Metric 2: Inventory Value */}
      <div className="p-6 rounded-lg bg-slate-800 text-white border border-slate-700">
        <h3 className="text-sm font-bold uppercase text-slate-400">On-Hand Value</h3>
        <p className="text-3xl font-extrabold">${(inventory.currentAmount * 0.18).toFixed(2)}</p>
        <p className="text-xs">Current market estimate</p>
      </div>

      {/* Metric 3: Weekly Cost */}
      <div className="p-6 rounded-lg bg-slate-800 text-white border border-slate-700">
        <h3 className="text-sm font-bold uppercase text-slate-400">Weekly Burn Cost</h3>
        <p className="text-3xl font-extrabold">${(dailyBurn * 7 * 0.18).toFixed(2)}</p>
        <p className="text-xs">Projected operating expense</p>
      </div>
    </div>
  );
};

export default Dashboard;