import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

const CX = 140;
const CY = 130;
const R_OUTER = 100;
const R_TICK_MAJOR = 88;
const R_HIT = 108;
const START_ANGLE = Math.PI;
const END_ANGLE = 0;
const STEP = 6.25;
const TICK_COUNT = 16;

type FuelGaugeProps = {
  value: number | null;
  onChange?: (pct: number) => void;
  mode?: "interactive" | "print";
  className?: string;
};

function pctToAngle(pct: number) {
  const t = pct / 100;
  return START_ANGLE + t * (END_ANGLE - START_ANGLE);
}

function angleToPct(angle: number) {
  let a = angle;
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < 0) a = 0;
  if (a > Math.PI) a = Math.PI;
  const t = (a - START_ANGLE) / (END_ANGLE - START_ANGLE);
  const raw = t * 100;
  const snapped = Math.round(raw / STEP) * STEP;
  return Math.max(0, Math.min(100, snapped));
}

function polar(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
  };
}

/** Convierte el porcentaje (pasos de 6.25 %) a fracción legible: cuartos, octavos o dieciseisavos. */
export function formatCombustibleLabel(pct: number) {
  const sixteenths = Math.round(pct / STEP);
  if (sixteenths <= 0) return "Vacío (E)";
  if (sixteenths >= 16) return "Lleno (F)";
  if (sixteenths === 4) return "1/4";
  if (sixteenths === 8) return "1/2";
  if (sixteenths === 12) return "3/4";

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(sixteenths, 16);
  const num = sixteenths / g;
  const den = 16 / g;

  return `${num}/${den}`;
}

export function FuelGauge({ value, onChange, mode = "interactive", className }: FuelGaugeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isPrint = mode === "print";
  const isInteractive = mode === "interactive" && onChange;

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!isInteractive || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = 280 / rect.width;
      const scaleY = 160 / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      const dx = x - CX;
      const dy = CY - y;
      const dist = Math.hypot(dx, dy);
      if (dist < 40 || dist > R_HIT + 30) return;
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += 2 * Math.PI;
      if (angle < 0 || angle > Math.PI) return;
      onChange(angleToPct(angle));
    },
    [isInteractive, onChange]
  );

  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => {
    const pct = i * STEP;
    const angle = pctToAngle(pct);
    const isMajor = pct % 25 === 0;
    const inner = polar(CX, CY, isMajor ? R_TICK_MAJOR - 14 : R_TICK_MAJOR - 8, angle);
    const outer = polar(CX, CY, R_TICK_MAJOR, angle);
    return { pct, angle, isMajor, inner, outer };
  });

  const needleAngle = value !== null ? pctToAngle(value) : -Math.PI / 2;
  const needleEnd = polar(CX, CY, 72, needleAngle);

  return (
    <div className={cn("flex flex-col items-center print:break-inside-avoid", className)}>
      <svg
        ref={svgRef}
        viewBox="0 0 280 160"
        className="w-full max-w-[280px] select-none touch-none"
        role={isInteractive ? "slider" : "img"}
        aria-label="Medidor de gasolina"
        aria-valuenow={value ?? undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        onPointerDown={(e) => {
          if (!isInteractive) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          handlePointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!isInteractive || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
          handlePointer(e.clientX, e.clientY);
        }}
      >
        {/* Zona táctil invisible sobre el arco */}
        {isInteractive && (
          <path
            d={`M ${polar(CX, CY, R_HIT, START_ANGLE).x} ${polar(CX, CY, R_HIT, START_ANGLE).y}
                A ${R_HIT} ${R_HIT} 0 0 1 ${polar(CX, CY, R_HIT, END_ANGLE).x} ${polar(CX, CY, R_HIT, END_ANGLE).y}`}
            fill="none"
            stroke="transparent"
            strokeWidth={36}
            pointerEvents="stroke"
          />
        )}

        {/* Marcas */}
        {ticks.map(({ pct, isMajor, inner, outer }) => (
          <line
            key={pct}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="currentColor"
            strokeWidth={isMajor ? 3 : 1.5}
            className="text-foreground"
          />
        ))}

        {/* E / F */}
        <text x={28} y={CY + 8} className="fill-foreground text-[22px] font-bold" fontSize={22}>
          E
        </text>
        <text x={248} y={CY + 8} className="fill-foreground text-[22px] font-bold" fontSize={22}>
          F
        </text>

        {/* Icono bomba */}
        <g transform={`translate(${CX - 12}, ${CY - 38})`} className="fill-foreground">
          <rect x={4} y={14} width={16} height={18} rx={2} />
          <path d="M0 10 L8 10 L8 6 L14 6 L14 10 L20 10 L20 14 L8 14 L8 18 L4 18 Z" />
          <rect x={18} y={8} width={4} height={6} rx={1} />
        </g>

        {/* Pivote */}
        <circle cx={CX} cy={CY} r={10} className="fill-foreground" />

        {/* Aguja (oculta en impresión) */}
        {!isPrint && value !== null && (
          <line
            x1={CX}
            y1={CY}
            x2={needleEnd.x}
            y2={needleEnd.y}
            stroke="#dc2626"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}
      </svg>

      {!isPrint && (
        <p className="text-sm text-muted-foreground mt-1 text-center min-h-[1.25rem]">
          {value !== null ? (
            <span className="font-medium text-foreground">{formatCombustibleLabel(value)}</span>
          ) : isInteractive ? (
            "Toca el arco para indicar el nivel"
          ) : null}
        </p>
      )}
    </div>
  );
}
