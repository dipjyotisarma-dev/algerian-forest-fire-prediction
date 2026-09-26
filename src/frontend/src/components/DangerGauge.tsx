import React from 'react';
import { DangerLevel } from '../types';
import { ShieldCheck, AlertCircle, AlertTriangle, Flame, Skull } from 'lucide-react';

interface DangerGaugeProps {
  fwi: number;
  dangerLevel: DangerLevel;
  description: string;
  isLoading: boolean;
}

const DANGER_CONFIG: Record<
  DangerLevel,
  {
    bgClass: string;
    textClass: string;
    borderClass: string;
    icon: React.ReactNode;
  }
> = {
  Low: {
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    borderClass: 'border-emerald-200 dark:border-emerald-800/60',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
  },
  Moderate: {
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-800/60',
    icon: <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
  },
  High: {
    bgClass: 'bg-orange-500/10 dark:bg-orange-500/15',
    textClass: 'text-orange-700 dark:text-orange-400',
    borderClass: 'border-orange-200 dark:border-orange-800/60',
    icon: <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
  },
  'Very High': {
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/15',
    textClass: 'text-rose-700 dark:text-rose-400',
    borderClass: 'border-rose-200 dark:border-rose-800/60',
    icon: <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
  },
  Extreme: {
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/15',
    textClass: 'text-purple-700 dark:text-purple-400',
    borderClass: 'border-purple-200 dark:border-purple-800/60',
    icon: <Skull className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
  },
};

/**
 * Returns a mathematically exact SVG path string for an arc segment on a semicircle.
 * Angle: 0° is leftmost (x = cx - r, y = cy), 90° is top, 180° is rightmost (x = cx + r, y = cy).
 */
function getArcPath(startDeg: number, endDeg: number, cx = 120, cy = 115, r = 85): string {
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;

  const x1 = cx - r * Math.cos(startRad);
  const y1 = cy - r * Math.sin(startRad);
  const x2 = cx - r * Math.cos(endRad);
  const y2 = cy - r * Math.sin(endRad);

  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/**
 * Maps the continuous FWI value piecewise to needle degrees (0° left to 180° right)
 * perfectly aligning the needle with the active danger category segment.
 */
function getNeedleDegrees(fwi: number): number {
  const val = Math.max(0, fwi);
  if (val <= 5.2) {
    // Low: 0 to 5.2 maps to 0° - 36°
    return (val / 5.2) * 36;
  } else if (val <= 13.0) {
    // Moderate: 5.2 to 13.0 maps to 36° - 72°
    return 36 + ((val - 5.2) / (13.0 - 5.2)) * 36;
  } else if (val <= 21.3) {
    // High: 13.0 to 21.3 maps to 72° - 108°
    return 72 + ((val - 13.0) / (21.3 - 13.0)) * 36;
  } else if (val <= 38.0) {
    // Very High: 21.3 to 38.0 maps to 108° - 144°
    return 108 + ((val - 21.3) / (38.0 - 21.3)) * 36;
  } else {
    // Extreme: 38.0 to 60.0+ maps to 144° - 180°
    const clampedExtreme = Math.min(60, val);
    return 144 + ((clampedExtreme - 38.0) / (60.0 - 38.0)) * 36;
  }
}

export const DangerGauge: React.FC<DangerGaugeProps> = ({
  fwi,
  dangerLevel,
  description,
  isLoading,
}) => {
  const config = DANGER_CONFIG[dangerLevel] || DANGER_CONFIG.Low;

  const needleDegrees = getNeedleDegrees(fwi);
  // Needle points up at 0°, so rotate from -90° (left) to +90° (right)
  const rotationAngle = needleDegrees - 90;

  // Arc center & radius
  const cx = 120;
  const cy = 115;
  const radius = 85;

  return (
    <div
      className={`rounded-2xl border ${config.borderClass} ${config.bgClass} p-6 sm:p-8 flex flex-col items-center text-center transition-colors relative overflow-hidden`}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Danger Level Badge */}
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
        {config.icon}
        <span className={config.textClass}>{dangerLevel} Danger</span>
      </div>

      {/* Semicircle Gauge Visualizer */}
      <div className="w-full max-w-[260px] h-[130px] flex items-center justify-center">
        <svg
          viewBox="0 0 240 130"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Subtle background track */}
          <path
            d={getArcPath(0, 180, cx, cy, radius)}
            fill="none"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinecap="round"
            className="text-slate-200 dark:text-slate-800"
          />

          {/* 5 Distinct Precision Color Segments (1.5° separation gap) */}
          {/* 1. Low: 0° to 34.5° */}
          <path
            d={getArcPath(0, 34.5, cx, cy, radius)}
            fill="none"
            stroke="#10b981"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* 2. Moderate: 36° to 70.5° */}
          <path
            d={getArcPath(36, 70.5, cx, cy, radius)}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="14"
            strokeLinecap="butt"
          />
          {/* 3. High: 72° to 106.5° */}
          <path
            d={getArcPath(72, 106.5, cx, cy, radius)}
            fill="none"
            stroke="#f97316"
            strokeWidth="14"
            strokeLinecap="butt"
          />
          {/* 4. Very High: 108° to 142.5° */}
          <path
            d={getArcPath(108, 142.5, cx, cy, radius)}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="14"
            strokeLinecap="butt"
          />
          {/* 5. Extreme: 144° to 180° */}
          <path
            d={getArcPath(144, 180, cx, cy, radius)}
            fill="none"
            stroke="#a855f7"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Rotating Needle */}
          <g
            transform={`translate(${cx}, ${cy}) rotate(${rotationAngle})`}
            className="transition-transform duration-300 ease-out"
          >
            {/* Tapered needle pointer */}
            <polygon
              points="-3,0 3,0 0,-76"
              className="fill-slate-800 dark:fill-slate-100"
            />
            {/* Pivot hub */}
            <circle
              cx="0"
              cy="0"
              r="6.5"
              className="fill-slate-800 dark:fill-slate-100"
            />
            <circle
              cx="0"
              cy="0"
              r="2.5"
              className="fill-white dark:fill-slate-900"
            />
          </g>
        </svg>
      </div>

      {/* Numeric FWI Value & Label Placed Below the Meter */}
      <div className="mt-3 text-center">
        <div className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-slate-900 dark:text-white">
          {fwi.toFixed(1)}
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
          Fire Weather Index
        </div>
      </div>

      {/* Operational Interpretation Description */}
      <p className="mt-4 text-sm text-slate-700 dark:text-slate-300 max-w-sm leading-relaxed">
        {description}
      </p>

      {/* Threshold Scale Legend */}
      <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 w-full grid grid-cols-5 gap-1 text-[11px] font-mono text-center">
        <div className="text-emerald-700 dark:text-emerald-400">
          <div className="font-semibold">&lt;5.2</div>
          <div className="text-[10px] text-slate-500">Low</div>
        </div>
        <div className="text-amber-700 dark:text-amber-400">
          <div className="font-semibold">5.2–13</div>
          <div className="text-[10px] text-slate-500">Mod</div>
        </div>
        <div className="text-orange-700 dark:text-orange-400">
          <div className="font-semibold">13–21.3</div>
          <div className="text-[10px] text-slate-500">High</div>
        </div>
        <div className="text-rose-700 dark:text-rose-400">
          <div className="font-semibold">21.3–38</div>
          <div className="text-[10px] text-slate-500">V.High</div>
        </div>
        <div className="text-purple-700 dark:text-purple-400">
          <div className="font-semibold">&ge;38</div>
          <div className="text-[10px] text-slate-500">Extr</div>
        </div>
      </div>
    </div>
  );
};
