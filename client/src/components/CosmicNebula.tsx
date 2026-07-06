import { useRef, useEffect, useCallback } from "react";

export type NebulaState =
  | "idle"
  | "thinking"
  | "green"
  | "yellow"
  | "red"
  | "blue"
  | "purple"
  | "orange"
  | "pink"
  | "white"
  | "gold"
  | "teal"
  | "indigo";

interface CosmicNebulaProps {
  /** Current emotional/response state */
  state: NebulaState;
  /** Size of the canvas in px */
  size?: number;
  /** Optional label override */
  label?: string;
}

interface Particle {
  x: number;
  y: number;
  angle: number;
  speed: number;
  distance: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  layer: number;
}

const STATE_COLORS: Record<NebulaState, { r: number; g: number; b: number; label: string }> = {
  idle:     { r: 0,   g: 220, b: 220, label: "In Ascolto" },
  thinking: { r: 160, g: 100, b: 255, label: "Elaborazione..." },
  green:    { r: 0,   g: 255, b: 120, label: "Risposta Sicura" },
  yellow:   { r: 255, g: 210, b: 0,   label: "Verifica Necessaria" },
  red:      { r: 255, g: 50,  b: 50,  label: "Escalation Attiva" },
  blue:     { r: 60,  g: 140, b: 255, label: "Informativo" },
  purple:   { r: 180, g: 80,  b: 255, label: "Analisi Profonda" },
  orange:   { r: 255, g: 140, b: 30,  label: "Attenzione" },
  pink:     { r: 255, g: 100, b: 180, label: "Empatico" },
  white:    { r: 240, g: 240, b: 255, label: "Neutro" },
  gold:     { r: 255, g: 200, b: 50,  label: "Importante" },
  teal:     { r: 0,   g: 200, b: 180, label: "Navigazione" },
  indigo:   { r: 100, g: 60,  b: 220, label: "Creativo" },
};

export default function CosmicNebula({ state = "idle", size = 500, label }: CosmicNebulaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const currentColorRef = useRef({ ...STATE_COLORS.idle });
  const targetColorRef = useRef({ ...STATE_COLORS.idle });
  const timeRef = useRef(0);
  const pulseRef = useRef(0);
  const prevStateRef = useRef<NebulaState>("idle");

  // Touch/interaction state
  const touchRef = useRef<{ x: number; y: number; active: boolean; pressure: number }>({
    x: 0, y: 0, active: false, pressure: 0,
  });
  const breathRef = useRef({ scale: 1, targetScale: 1, velocity: 0 });

  const createParticle = useCallback((cx: number, cy: number, layer: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const baseDistance = layer === 0 ? 30 : layer === 1 ? 80 : 140;
    const distance = baseDistance + Math.random() * (size * 0.12);
    const speed = (Math.random() * 0.004 + 0.001) * (layer === 0 ? 2 : layer === 1 ? 1.2 : 0.7);
    const maxLife = Math.random() * 300 + 150;
    return {
      x: cx + Math.cos(angle) * distance,
      y: cy + Math.sin(angle) * distance,
      angle,
      speed,
      distance,
      size: Math.random() * (layer === 0 ? 2 : layer === 1 ? 2.5 : 1.8) + 0.3,
      alpha: Math.random() * 0.8 + 0.2,
      life: 0,
      maxLife,
      layer,
    };
  }, [size]);

  // Handle touch/mouse interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e: MouseEvent | Touch) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / (window.devicePixelRatio || 1)) / rect.width,
        y: (e.clientY - rect.top) * (canvas.height / (window.devicePixelRatio || 1)) / rect.height,
      };
    };

    const onMouseDown = (e: MouseEvent) => {
      const pos = getPos(e);
      touchRef.current = { x: pos.x, y: pos.y, active: true, pressure: 1 };
      breathRef.current.targetScale = 1.15;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (touchRef.current.active) {
        const pos = getPos(e);
        touchRef.current.x = pos.x;
        touchRef.current.y = pos.y;
      }
    };

    const onMouseUp = () => {
      touchRef.current.active = false;
      touchRef.current.pressure = 0;
      breathRef.current.targetScale = 1;
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const pos = getPos(touch);
      touchRef.current = { x: pos.x, y: pos.y, active: true, pressure: (touch as any).force || 1 };
      breathRef.current.targetScale = 1.2;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const pos = getPos(touch);
        touchRef.current.x = pos.x;
        touchRef.current.y = pos.y;
        touchRef.current.pressure = (touch as any).force || 1;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      touchRef.current.active = false;
      touchRef.current.pressure = 0;
      breathRef.current.targetScale = 1;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (state !== prevStateRef.current) {
      targetColorRef.current = { ...STATE_COLORS[state] };
      pulseRef.current = 2.0;
      prevStateRef.current = state;
    }
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;

    // Initialize particles
    particlesRef.current = [];
    const counts = [200, 250, 200];
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < counts[layer]; i++) {
        particlesRef.current.push(createParticle(cx, cy, layer));
      }
    }

    const animate = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;

      // Smooth color transition
      const curr = currentColorRef.current;
      const target = targetColorRef.current;
      const lerpSpeed = 0.025;
      curr.r += (target.r - curr.r) * lerpSpeed;
      curr.g += (target.g - curr.g) * lerpSpeed;
      curr.b += (target.b - curr.b) * lerpSpeed;

      // Breathing physics (spring-based)
      const breath = breathRef.current;
      const springForce = (breath.targetScale - breath.scale) * 0.08;
      breath.velocity += springForce;
      breath.velocity *= 0.85; // damping
      breath.scale += breath.velocity;

      // Natural breathing when not touched
      const naturalBreath = Math.sin(time * 1.2) * 0.04 + 1.0;
      const effectiveScale = touchRef.current.active
        ? breath.scale
        : naturalBreath;

      // Decay pulse
      pulseRef.current *= 0.985;
      if (pulseRef.current < 0.005) pulseRef.current = 0;
      const pulse = pulseRef.current;

      const { r, g, b } = curr;
      const touchActive = touchRef.current.active;
      const touchX = touchRef.current.x;
      const touchY = touchRef.current.y;

      // Clear with TRANSPARENT background (no separate bg)
      ctx.clearRect(0, 0, size, size);

      // Very subtle space dust (transparent)
      const dustAlpha = 0.012 + Math.sin(time * 0.5) * 0.004;
      const dustGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.48);
      dustGrad.addColorStop(0, `rgba(${r * 0.3}, ${g * 0.3}, ${b * 0.3}, ${dustAlpha})`);
      dustGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = dustGrad;
      ctx.fillRect(0, 0, size, size);

      // === CORE RENDERING with breathing scale ===
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(effectiveScale, effectiveScale);
      ctx.translate(-cx, -cy);

      const coreRadius = (35 + pulse * 25);

      // Outer glow
      const outerGlow = ctx.createRadialGradient(cx, cy, coreRadius * 2, cx, cy, size * 0.42);
      outerGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.06 + pulse * 0.04})`);
      outerGlow.addColorStop(0.5, `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.5}, 0.02)`);
      outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.42, 0, Math.PI * 2);
      ctx.fill();

      // Mid glow
      const midGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 3.5);
      midGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.4 + pulse * 0.2})`);
      midGlow.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${0.15})`);
      midGlow.addColorStop(0.7, `rgba(${r * 0.6}, ${g * 0.6}, ${b * 0.6}, 0.04)`);
      midGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = midGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Bright inner core — pulses more when touched
      const touchBoost = touchActive ? 0.15 : 0;
      const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 1.2);
      innerGlow.addColorStop(0, `rgba(255, 255, 255, ${0.95 + touchBoost})`);
      innerGlow.addColorStop(0.2, `rgba(${Math.min(255, r + 80)}, ${Math.min(255, g + 80)}, ${Math.min(255, b + 80)}, ${0.8 + touchBoost})`);
      innerGlow.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${0.3 + touchBoost * 0.5})`);
      innerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = innerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // === PARTICLES with touch attraction ===
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;

        // Orbital motion
        const turbulence = p.layer === 0 ? 0.5 : p.layer === 1 ? 1.0 : 1.5;
        p.angle += p.speed * (1 + pulse * 1.5);
        const wobbleX = Math.sin(time * 1.5 + i * 0.05) * turbulence * 3;
        const wobbleY = Math.cos(time * 1.8 + i * 0.07) * turbulence * 3;
        let targetX = cx + Math.cos(p.angle) * p.distance * effectiveScale + wobbleX;
        let targetY = cy + Math.sin(p.angle) * p.distance * effectiveScale + wobbleY;

        // Touch attraction — particles gravitate toward finger
        if (touchActive) {
          const dx = touchX - p.x;
          const dy = touchY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const attractRadius = size * 0.35;
          if (dist < attractRadius) {
            const force = (1 - dist / attractRadius) * 0.3 * touchRef.current.pressure;
            targetX += dx * force;
            targetY += dy * force;
          }
        }

        p.x += (targetX - p.x) * 0.06;
        p.y += (targetY - p.y) * 0.06;

        // Life-based alpha
        const lifeRatio = p.life / p.maxLife;
        const fadeAlpha = lifeRatio > 0.8 ? (1 - lifeRatio) * 5 : Math.min(1, lifeRatio * 4);

        // Distance-based brightness
        const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
        const maxDist = size * 0.42;
        const distFactor = Math.max(0, 1 - dist / maxDist);

        const finalAlpha = p.alpha * fadeAlpha * (0.5 + pulse * 0.5) * (0.3 + distFactor * 0.7);

        if (finalAlpha < 0.01) {
          if (p.life > p.maxLife) particles[i] = createParticle(cx, cy, p.layer);
          continue;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + distFactor * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalAlpha})`;
        ctx.fill();

        // Glow for bright particles
        if (p.size > 1.8 && distFactor > 0.4) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalAlpha * 0.08})`;
          ctx.fill();
        }

        // Respawn
        if (p.life > p.maxLife) {
          particles[i] = createParticle(cx, cy, p.layer);
        }
      }

      // === TOUCH RIPPLE EFFECT ===
      if (touchActive) {
        const rippleRadius = 30 + Math.sin(time * 4) * 10;
        const rippleGrad = ctx.createRadialGradient(touchX, touchY, 0, touchX, touchY, rippleRadius);
        rippleGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
        rippleGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.1)`);
        rippleGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = rippleGrad;
        ctx.beginPath();
        ctx.arc(touchX, touchY, rippleRadius, 0, Math.PI * 2);
        ctx.fill();

        // Connection lines from touch point to nearby particles
        for (let i = 0; i < particles.length; i += 3) {
          const p = particles[i];
          const dx = touchX - p.x;
          const dy = touchY - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 80) {
            const lineAlpha = (1 - d / 80) * 0.15;
            ctx.beginPath();
            ctx.moveTo(touchX, touchY);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // === ENERGY RAYS ===
      const numRays = 8;
      for (let i = 0; i < numRays; i++) {
        const rayAngle = (Math.PI * 2 / numRays) * i + time * 0.15;
        const rayPulse = Math.sin(time * 2.5 + i * 0.8) * 0.5 + 0.5;
        const rayLength = (50 + rayPulse * 40) * (1 + pulse * 0.8) * effectiveScale;
        const rayAlpha = (0.06 + rayPulse * 0.06) * (1 + pulse * 0.5);

        const grad = ctx.createLinearGradient(
          cx, cy,
          cx + Math.cos(rayAngle) * rayLength,
          cy + Math.sin(rayAngle) * rayLength
        );
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${rayAlpha * 2})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + Math.cos(rayAngle) * rayLength,
          cy + Math.sin(rayAngle) * rayLength
        );
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5 + rayPulse;
        ctx.stroke();
      }

      // === THINKING: Spinning orbital ring ===
      if (state === "thinking") {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * 2);
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius * 3 * effectiveScale, 0, Math.PI * 0.8);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius * 3 * effectiveScale, Math.PI, Math.PI * 1.6);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // === PULSE RING on state change ===
      if (pulse > 0.1) {
        const ringRadius = coreRadius * 2 + (2 - pulse) * 60;
        const ringAlpha = pulse * 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${ringAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [size, createParticle, state]);

  const displayLabel = label || STATE_COLORS[state]?.label || "ADAM";

  return (
    <div className="relative flex flex-col items-center justify-center select-none touch-none">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, cursor: "pointer" }}
      />
      {/* State label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        <span
          className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-80 transition-colors duration-700"
          style={{
            color: `rgb(${STATE_COLORS[state].r}, ${STATE_COLORS[state].g}, ${STATE_COLORS[state].b})`,
            textShadow: `0 0 10px rgba(${STATE_COLORS[state].r}, ${STATE_COLORS[state].g}, ${STATE_COLORS[state].b}, 0.5)`,
          }}
        >
          {displayLabel}
        </span>
      </div>
    </div>
  );
}
