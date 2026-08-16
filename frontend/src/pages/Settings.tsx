import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  ShieldCheck,
  Bell,
  Cpu,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function Settings() {
  const [confidence, setConfidence] = useState<number>(85);
  const [autoQuarantine, setAutoQuarantine] = useState<boolean>(true);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="text-amber-500" size={26} />
          System Settings & Parameters
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure offline AI model thresholds, threat alert rules, and local storage rules
        </p>
      </div>

      {/* Settings Form */}
      <div className="rounded-2xl border border-gray-800 bg-card p-6 space-y-6 shadow-xl">
        {/* Model Thresholds */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <Sliders size={18} className="text-amber-400" />
            AI Inference Confidence Thresholds
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-gray-300">Tiger Re-ID Minimum Confidence</label>
              <span className="font-bold text-amber-400 text-sm">{confidence}%</span>
            </div>
            <input
              type="range"
              min="60"
              max="98"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[11px] text-gray-500">
              Higher values require stronger flank stripe similarity matches before assigning individual IDs.
            </p>
          </div>
        </div>

        {/* Triage & Quarantine Rules */}
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <ShieldCheck size={18} className="text-emerald-400" />
            Triage & Quarantine Isolation Rules
          </h2>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/60 border border-gray-800">
            <div>
              <h3 className="text-xs font-bold text-white">Auto-Quarantine High Confidence Blanks</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Automatically isolate empty camera-trap frames with &gt; 90% blank confidence into recycling bin
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoQuarantine}
              onChange={(e) => setAutoQuarantine(e.target.checked)}
              className="w-5 h-5 accent-amber-500 cursor-pointer rounded"
            />
          </div>
        </div>

        {/* Notification Sound */}
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <Bell size={18} className="text-red-400" />
            Security & Threat Alerts Configuration
          </h2>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/60 border border-gray-800">
            <div>
              <h3 className="text-xs font-bold text-white">Audible Threat Alerts</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Play sound notification when critical poaching human intrusion or buffer breach occurs
              </p>
            </div>
            <input
              type="checkbox"
              checked={soundAlerts}
              onChange={(e) => setSoundAlerts(e.target.checked)}
              className="w-5 h-5 accent-amber-500 cursor-pointer rounded"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          {saved && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 size={16} /> System parameters saved successfully.
            </span>
          )}
          <button
            onClick={handleSave}
            className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-amber-500/20"
          >
            <Save size={16} />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
