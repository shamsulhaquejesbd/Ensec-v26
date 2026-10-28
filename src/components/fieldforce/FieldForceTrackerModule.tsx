import React, { useState } from 'react';
import {
  Navigation,
  MapPin,
  Smartphone,
  BatteryCharging,
  Gauge,
  CheckCircle2,
  Calendar,
  Phone,
  User,
  Radio,
  Search,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { FieldForceRep, VisitLog } from '../../types/erp.ts';

// Helper to safely extract coordinates and telemetry info even with partial/undefined data
const getSafeCoords = (rep?: FieldForceRep | null) => {
  const lat = typeof rep?.currentLocation?.latitude === 'number'
    ? rep.currentLocation.latitude
    : (Number(rep?.currentLatitude) || 23.8103);
  const lng = typeof rep?.currentLocation?.longitude === 'number'
    ? rep.currentLocation.longitude
    : (Number(rep?.currentLongitude) || 90.4125);
  return {
    latitude: isNaN(lat) ? 23.8103 : lat,
    longitude: isNaN(lng) ? 90.4125 : lng,
    address: rep?.currentLocation?.address || rep?.lastKnownAddress || (rep ? `${rep.territory || rep.region || 'Dhaka'}, Bangladesh` : 'Dhaka, Bangladesh'),
    speedKmH: Number(rep?.currentLocation?.speedKmH) || 0,
    batteryLevel: Number(rep?.currentLocation?.batteryLevel ?? rep?.batteryLevel ?? 95),
    lastUpdated: rep?.currentLocation?.lastUpdated || rep?.lastLocationUpdate || 'Live GPS',
    isOnline: rep?.currentLocation?.isOnline ?? rep?.isOnline ?? true,
  };
};

export const FieldForceTrackerModule: React.FC = () => {
  const { fieldForceReps = [], visitLogs = [], updateRepLocation } = useERP();
  const [selectedRepId, setSelectedRepId] = useState<string>('');
  const [filterRegion, setFilterRegion] = useState('All');

  // Active rep is derived safely from fieldForceReps
  const selectedRep =
    (selectedRepId ? fieldForceReps.find((r) => r.id === selectedRepId) : null) ||
    fieldForceReps[0] ||
    null;

  const currentRepLocation = getSafeCoords(selectedRep);

  // Simulated GPS movement ping
  const handleSimulateGPSMove = (repId?: string) => {
    if (!repId) return;
    const rep = fieldForceReps.find((r) => r.id === repId);
    if (!rep) return;
    const coords = getSafeCoords(rep);
    const latOffset = (Math.random() - 0.5) * 0.005;
    const lngOffset = (Math.random() - 0.5) * 0.005;
    const newLat = coords.latitude + latOffset;
    const newLng = coords.longitude + lngOffset;
    const streetNames = [
      'Mirpur Section 11 Market',
      'Uttara Sector 3 Road 12',
      'Agrabad Commercial Area',
      'Kushtia Sadar High Road',
      'Motijheel C/A',
      'Dhanmondi Road 27',
    ];
    const randomAddress = streetNames[Math.floor(Math.random() * streetNames.length)];
    updateRepLocation(repId, newLat, newLng, randomAddress);
  };

  const filteredReps = filterRegion === 'All'
    ? fieldForceReps
    : fieldForceReps.filter((r) => r.region && r.region.includes(filterRegion));

  // Visits for selected rep
  const repVisits = selectedRep
    ? visitLogs.filter((v) => v.repId === selectedRep.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Salesman Live GPS Tracker & Field Force Hierarchy
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Live Telemetry</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time geospatial tracking of sales officers, daily route breadcrumbs, battery telemetry, and visit productivity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => selectedRep && handleSimulateGPSMove(selectedRep.id)}
            disabled={!selectedRep}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white transition-colors shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Simulate Live GPS Ping</span>
          </button>
        </div>
      </div>

      {/* Main Map + Rep Roster Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Rep Roster & Performance Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Active Field Representatives ({filteredReps.length})
            </h3>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px]"
            >
              <option value="All">All Divisions</option>
              <option value="Dhaka">Dhaka</option>
              <option value="Chittagong">Chittagong</option>
              <option value="Khulna">Khulna & Kushtia</option>
            </select>
          </div>

          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredReps.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">No field representatives found in this region.</p>
              </div>
            ) : (
              filteredReps.map((rep) => {
                const isSelected = selectedRep?.id === rep.id;
                const coords = getSafeCoords(rep);

                return (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedRepId(rep.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 shadow-sm ring-1 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                            {rep.name ? rep.name.charAt(0) : 'R'}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                              coords.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          ></span>
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">{rep.name}</div>
                          <div className="text-[10px] text-slate-500">{rep.designation || 'Sales Officer'}</div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                        {rep.code}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">{coords.address}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Speed: {coords.speedKmH} km/h</span>
                      <span>Battery: {coords.batteryLevel}%</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {rep.productiveVisitsCount || 0} Orders Taken
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Interactive GPS Visual Map & Live Route Breadcrumbs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Live Telemetry Map: {selectedRep?.name || 'Field Roster Telemetry'}
                  </h2>
                  <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                    ● Active GPS Stream
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Territory: {selectedRep?.territory || 'National'} ({selectedRep?.area || 'All Areas'}) • Rep Contact: {selectedRep?.phone || 'N/A'}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Lat: {currentRepLocation.latitude.toFixed(4)}, Lng:{' '}
                  {currentRepLocation.longitude.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Visual SVG Map Container */}
            <div className="relative w-full h-80 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center select-none shadow-inner">
              {/* Map Grid Background */}
              <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Simulated Map Road Network & River Geo Representation */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 400">
                {/* Simulated River Padma/Buriganga curve */}
                <path
                  d="M0,280 Q 200,240 400,290 T 800,260"
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth="12"
                  opacity="0.4"
                />
                {/* Major Highways */}
                <path
                  d="M100,0 L 250,180 L 480,240 L 700,400"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="4"
                  strokeDasharray="4 2"
                />
                <path
                  d="M300,100 L 400,200 L 520,380"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="3"
                />

                {/* Simulated Breadcrumb Route Trail */}
                <path
                  d="M 320,120 L 350,150 L 390,170 L 430,210 L 460,200"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  className="animate-pulse"
                />

                {/* Route Checkpoints (Previous Customer Visits) */}
                <circle cx="320" cy="120" r="5" fill="#3b82f6" />
                <text x="330" y="125" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
                  Check-in: 09:30 AM (Depot)
                </text>

                <circle cx="390" cy="170" r="5" fill="#10b981" />
                <text x="400" y="175" fill="#10b981" fontSize="10" fontFamily="sans-serif">
                  Visit 1: Rahman Solar (Order Placed)
                </text>

                <circle cx="430" cy="210" r="5" fill="#10b981" />
                <text x="440" y="215" fill="#10b981" fontSize="10" fontFamily="sans-serif">
                  Visit 2: Green Auto EV (Order Placed)
                </text>

                {/* Current Live Position Pin */}
                <g transform="translate(460, 200)">
                  <circle cx="0" cy="0" r="18" fill="#a855f7" opacity="0.3" className="animate-ping" />
                  <circle cx="0" cy="0" r="8" fill="#a855f7" stroke="#ffffff" strokeWidth="2" />
                  <rect x="-60" y="-35" width="120" height="22" rx="4" fill="#0f172a" stroke="#a855f7" strokeWidth="1" />
                  <text x="0" y="-20" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                    {selectedRep?.name || 'Field Agent'} ({currentRepLocation.speedKmH} km/h)
                  </text>
                </g>
              </svg>

              {/* Map HUD Overlay */}
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-xs p-2.5 rounded-lg border border-slate-800 text-[11px] text-white space-y-1 font-mono">
                <div className="text-purple-400 font-bold flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>GPS TRACKING RADAR</span>
                </div>
                <div>Location: {currentRepLocation.address}</div>
                <div>Status: Online ({currentRepLocation.lastUpdated})</div>
              </div>

              <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono">
                Coverage: Bangladesh GIS Grid • High Accuracy Mode
              </div>
            </div>

            {/* Visit Schedule & Productive Visit Logs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Today's Field Activity & Customer Visit Log
                </h3>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {selectedRep?.productiveVisitsCount || 0} Orders Booked Today
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Time</th>
                      <th className="p-3">Customer / Dealer</th>
                      <th className="p-3">Visit Purpose</th>
                      <th className="p-3">Outcome</th>
                      <th className="p-3 text-right">Order Placed (BDT)</th>
                      <th className="p-3">Feedback / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {repVisits.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          No logged customer visits recorded for this representative today.
                        </td>
                      </tr>
                    ) : (
                      repVisits.map((vis) => (
                        <tr key={vis.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono text-slate-500">{vis.time}</td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">{vis.customerName}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{vis.purpose}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                vis.isProductive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {vis.isProductive ? 'Productive (Order)' : 'Follow-up'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-right font-bold text-slate-900 dark:text-white">
                            {vis.orderPlacedBDT ? `৳ ${vis.orderPlacedBDT.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate">{vis.feedback}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
