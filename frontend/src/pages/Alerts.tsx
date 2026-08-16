import React, { useState } from 'react';
import { DEMO_ALERTS, DemoAlert } from '../data/centralData';
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  CheckCircle,
  Clock,
  MapPin,
  Camera,
  X,
  Volume2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState<DemoAlert[]>(DEMO_ALERTS);
  const [selectedAlert, setSelectedAlert] = useState<DemoAlert | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const handleToggleAcknowledge = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: a.status === 'resolved' ? 'open' : 'resolved' } : a
      )
    );
    if (selectedAlert && selectedAlert.id === id) {
      setSelectedAlert((prev) =>
        prev ? { ...prev, status: prev.status === 'resolved' ? 'open' : 'resolved' } : null
      );
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter === 'ALL') return true;
    if (severityFilter === 'CRITICAL' && a.severity === 'critical') return true;
    if (severityFilter === 'WARNING' && a.severity === 'warning') return true;
    if (severityFilter === 'INFORMATIONAL' && a.severity === 'info') return true;
    if (severityFilter === 'RESOLVED' && a.status === 'resolved') return true;
    return false;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning' && a.status !== 'resolved').length;
  const infoCount = alerts.filter((a) => a.severity === 'info' && a.status !== 'resolved').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ShieldAlert className="text-red-500 animate-pulse" size={26} />
            Security & Threat Alert Engine
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Pench Tiger Reserve · Poaching intrusion, territory breach, & range shift alert system
          </p>
        </div>
      </div>

      {/* Emergency Threat Banner */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-600/60 flex items-center justify-between shadow-xl shadow-red-950/40 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center border border-red-500/40 animate-pulse">
              <Volume2 className="text-red-400" size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-red-200 uppercase tracking-wide flex items-center gap-2">
                <span>CRITICAL SECURITY THREAT DETECTED</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-500 text-white font-black">
                  {criticalCount} UNACKNOWLEDGED
                </span>
              </h2>
              <p className="text-xs text-red-300/80 mt-0.5">
                New station detection (ST-27) for T-003 outside historical range centroid.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-2">
          {[
            { id: 'ALL', label: `All (${alerts.length})` },
            { id: 'CRITICAL', label: `Critical (${criticalCount})` },
            { id: 'WARNING', label: `Warning (${warningCount})` },
            { id: 'INFORMATIONAL', label: `Informational (${infoCount})` },
            { id: 'RESOLVED', label: `Resolved (${resolvedCount})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSeverityFilter(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                severityFilter === f.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                  : 'bg-gray-800/60 border border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List Feed */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const isResolved = alert.status === 'resolved';

            return (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                  isResolved
                    ? 'bg-gray-900/40 border-gray-800/80 opacity-60'
                    : alert.severity === 'critical'
                    ? 'bg-red-950/30 border-red-600/40 hover:border-red-500 shadow-lg shadow-red-950/20'
                    : alert.severity === 'warning'
                    ? 'bg-amber-950/20 border-amber-600/30 hover:border-amber-500'
                    : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 shrink-0">
                      {alert.severity === 'critical' ? (
                        <ShieldAlert className="text-red-400" size={22} />
                      ) : alert.severity === 'warning' ? (
                        <AlertTriangle className="text-amber-400" size={22} />
                      ) : (
                        <Radio className="text-blue-400" size={22} />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">{alert.id}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${
                            alert.severity === 'critical'
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : alert.severity === 'warning'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                          }`}
                        >
                          {alert.severity}
                        </span>

                        <span className="text-xs font-bold text-white flex items-center gap-1">
                          🐯 {alert.tigerId}
                        </span>

                        <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                          <MapPin size={12} className="text-gray-500" />
                          Station {alert.stationId}
                        </span>

                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={12} />
                          {alert.timestamp}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                        {alert.title}
                      </h3>
                      <p className="text-xs text-gray-400">{alert.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAcknowledge(alert.id);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isResolved
                          ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md'
                      }`}
                    >
                      <CheckCircle size={14} />
                      {isResolved ? 'Resolved' : 'Acknowledge'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-gray-500 text-sm bg-card rounded-2xl border border-gray-800">
            No threat alerts match the selected severity filter.
          </div>
        )}
      </div>

      {/* ALERT DETAIL PANEL MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-2xl w-full p-6 space-y-6 relative shadow-2xl">
            <button
              onClick={() => setSelectedAlert(null)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div>
              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold">
                <span>{selectedAlert.id}</span> · <span>Station {selectedAlert.stationId}</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">Why Was This Alert Triggered?</h2>
            </div>

            {/* Alert Summary Box */}
            <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-semibold">
                  Tiger: <strong className="text-amber-400 font-extrabold">{selectedAlert.tigerId}</strong>
                </span>
                <span className="text-gray-300 font-semibold">
                  Event: <strong className="text-white font-bold">{selectedAlert.type.replace(/_/g, ' ')}</strong>
                </span>
              </div>
              <p className="text-xs text-gray-400">{selectedAlert.description}</p>
            </div>

            {/* Evidence Checklist */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verification Evidence Checklist</h3>
              <div className="space-y-2">
                {selectedAlert.evidence.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence & Location */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700">
                <span className="text-gray-400 block">Detection Confidence</span>
                <strong className="text-lg font-black text-emerald-400">{selectedAlert.confidence}% Confidence</strong>
              </div>
              <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700">
                <span className="text-gray-400 block">Location Station</span>
                <strong className="text-base font-bold text-white">Camera Station {selectedAlert.stationId}</strong>
              </div>
            </div>

            {/* Recommended Review */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
              <strong className="font-bold flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" /> Recommended Action
              </strong>
              <p>{selectedAlert.recommendedReview}</p>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-800">
              <button
                onClick={() => handleToggleAcknowledge(selectedAlert.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedAlert.status === 'resolved'
                    ? 'bg-gray-800 text-gray-400'
                    : 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 shadow-md'
                }`}
              >
                <CheckCircle size={14} />
                {selectedAlert.status === 'resolved' ? 'Mark Unresolved' : 'Acknowledge Alert'}
              </button>

              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-semibold hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
