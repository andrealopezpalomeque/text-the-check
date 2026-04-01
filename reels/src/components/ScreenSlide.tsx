import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

type AnimationType = "slideUp" | "scaleUp" | "slideRight" | "fadeRotate";

interface ScreenSlideProps {
  animation: AnimationType;
  label: string;
  bgColor: string;
  description: string;
  // When you have real screenshots, add:
  // screenshot?: string;
}

export const ScreenSlide: React.FC<ScreenSlideProps> = ({
  animation,
  label,
  bgColor,
  description,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── ENTER animation (first 25 frames) ──
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.8 },
  });

  // ── EXIT animation (last 20 frames) ──
  const exitOpacity = interpolate(frame, [70, 89], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exitScale = interpolate(frame, [70, 89], [1, 0.9], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Per-animation-type transforms ──
  let transform = "";
  let opacity = 1;

  switch (animation) {
    case "slideUp":
      transform = `translateY(${interpolate(enterProgress, [0, 1], [600, 0])}px)`;
      opacity = enterProgress;
      break;

    case "scaleUp":
      transform = `scale(${interpolate(enterProgress, [0, 1], [0.3, 1])})`;
      opacity = enterProgress;
      break;

    case "slideRight":
      transform = `translateX(${interpolate(enterProgress, [0, 1], [500, 0])}px)`;
      opacity = enterProgress;
      break;

    case "fadeRotate":
      transform = `rotate(${interpolate(enterProgress, [0, 1], [-8, 0])}deg)`;
      opacity = enterProgress;
      break;
  }

  // ── Label animation (staggered after phone enters) ──
  const labelOpacity = interpolate(frame, [18, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelY = interpolate(frame, [18, 35], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
      }}
    >
      {/* ── Phone Mockup Container ── */}
      <div
        style={{
          transform: `${transform} scale(${exitScale})`,
          opacity,
        }}
      >
        {/* Phone frame */}
        <div
          style={{
            width: 340,
            height: 700,
            borderRadius: 40,
            backgroundColor: "#1A1A1A",
            padding: 8,
            boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
          }}
        >
          {/* Phone screen (inner area) */}
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 32,
              backgroundColor: bgColor,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* ─────────────────────────────────────────
                PLACEHOLDER UI — Replace this entire block
                with an <Img> tag when you have screenshots:
                
                import { Img, staticFile } from "remotion";
                <Img src={staticFile("screenshots/screen1.png")}
                     style={{ width: "100%", height: "100%" }} />
                ───────────────────────────────────────── */}

            {/* Status bar placeholder */}
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 20,
                right: 20,
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "rgba(255,255,255,0.7)",
                fontFamily: "SF Pro Display, -apple-system, Helvetica, Arial, sans-serif",
              }}
            >
              <span>9:41</span>
              <span>●●●</span>
            </div>

            {/* Placeholder content */}
            <div
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: "rgba(255,255,255,0.9)",
                fontFamily: "SF Pro Display, -apple-system, Helvetica, Arial, sans-serif",
                textAlign: "center",
                padding: 24,
              }}
            >
              {label}
            </div>

            {/* Fake UI elements */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "80%" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
            </div>

            {/* Fake button */}
            <div
              style={{
                marginTop: 30,
                padding: "14px 48px",
                borderRadius: 25,
                backgroundColor: "rgba(255,255,255,0.25)",
                color: "white",
                fontSize: 16,
                fontWeight: 600,
                fontFamily: "SF Pro Display, -apple-system, Helvetica, Arial, sans-serif",
              }}
            >
              Continue
            </div>

            {/* ───── END PLACEHOLDER ───── */}
          </div>
        </div>
      </div>

      {/* ── Description label below the phone ── */}
      <div
        style={{
          marginTop: 40,
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
          fontSize: 26,
          fontWeight: 500,
          color: "#FFFFFF",
          fontFamily: "SF Pro Display, -apple-system, Helvetica, Arial, sans-serif",
          textAlign: "center",
          letterSpacing: 0.5,
        }}
      >
        {description}
      </div>
    </AbsoluteFill>
  );
};
