import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Lenis from "lenis";
import { useEffect, useMemo, useRef, useState } from "react";

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

/** ✅ FIX: no conditional hook call. */
function useLenisSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      smoothTouch: false,
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [enabled]);
}

function ParticleField({ intensity = 1 }) {
  const dots = useMemo(() => {
    const count = Math.floor(26 * intensity);
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: 0.6 + Math.random() * 1.6,
      d: 6 + Math.random() * 10,
      o: 0.08 + Math.random() * 0.12,
    }));
  }, [intensity]);

  return (
    <div className="particles" aria-hidden="true">
      {dots.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.s}rem`,
            height: `${p.s}rem`,
            animationDuration: `${p.d}s`,
            opacity: p.o,
          }}
        />
      ))}
    </div>
  );
}

function ProgressPill() {
  return (
    <div className="progressPill" aria-label="Scroll progress">
      <div className="progressTrack">
        <div className="progressFill" />
      </div>
      <div className="progressText">
        <span className="progressHint">Scroll</span>
        <span className="progressPct">0%</span>
      </div>
    </div>
  );
}

/** ✅ NEW: MotionValue based line reveal (no .get() issues) */
function LineRevealMV({ lines, progressMV, start, end }) {
  const n = lines.length;

  return (
    <div className="lineStack">
      {lines.map((line, idx) => {
        const t = n <= 1 ? 0 : idx / (n - 1);
        const appearAt = start + (end - start) * t;
        const fadeInEnd = Math.min(end, appearAt + (end - start) * 0.18);

        const opacity = useTransform(
          progressMV,
          [appearAt, fadeInEnd],
          [0, 1]
        );
        const y = useTransform(progressMV, [appearAt, fadeInEnd], [12, 0]);
        const blur = useTransform(progressMV, [appearAt, fadeInEnd], [6, 0]);
        const filter = useTransform(blur, (b) => `blur(${b}px)`);

        return (
          <motion.p
            key={idx}
            className="line"
            style={{ opacity, y, filter }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {line}
          </motion.p>
        );
      })}
    </div>
  );
}

function Orbs({ progress }) {
  const leftX = useTransform(progress, [0, 1], ["-22vw", "-2.8vw"]);
  const rightX = useTransform(progress, [0, 1], ["22vw", "2.8vw"]);
  const glow = useTransform(progress, [0, 1], [0.25, 0.85]);
  const scale = useTransform(progress, [0, 1], [0.92, 1.08]);

  return (
    <div className="orbsWrap" aria-hidden="true">
      <motion.div className="orb orbLeft" style={{ x: leftX, opacity: glow, scale }} />
      <motion.div className="orb orbRight" style={{ x: rightX, opacity: glow, scale }} />
      <motion.div
        className="orbBridge"
        style={{
          opacity: useTransform(progress, [0.25, 1], [0, 1]),
          scaleX: useTransform(progress, [0, 1], [0.5, 1]),
        }}
      />
    </div>
  );
}

/** Confetti burst */
function confettiBurst() {
  const root = document.createElement("div");
  root.className = "confettiRoot";
  document.body.appendChild(root);

  const count = 110;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `-8%`;
    piece.style.transform = `translateY(0) rotate(${Math.random() * 360}deg)`;
    piece.style.opacity = `${0.7 + Math.random() * 0.25}`;
    piece.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
    piece.style.animationDelay = `${Math.random() * 0.12}s`;
    root.appendChild(piece);
  }

  setTimeout(() => root.remove(), 3200);
}

function sparkleBurst() {
  const root = document.createElement("div");
  root.className = "sparkleRoot";
  document.body.appendChild(root);

  const count = 26;
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.className = "sparkle";
    s.style.left = `${50 + (Math.random() * 30 - 15)}%`;
    s.style.top = `${50 + (Math.random() * 20 - 10)}%`;
    s.style.animationDelay = `${Math.random() * 0.2}s`;
    root.appendChild(s);
  }

  setTimeout(() => root.remove(), 1600);
}

/** ✅ NEW: Perfect, cinematic stage redesign */
function StageSection({ reduceMotion, globalProgress }) {
  const stageRef = useRef(null);

  // Local progress for cinematic pacing inside this section
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start 80%", "end 25%"],
  });

  // Connector grows as you scroll
  const connectorScale = useTransform(scrollYProgress, [0, 1], [0.05, 1]);
  const connectorOpacity = useTransform(scrollYProgress, [0, 0.2, 1], [0, 0.35, 0.55]);

  // Subtle “fill” motion for the whole grid
  const gridY = useTransform(scrollYProgress, [0, 1], [14, -6]);
  const gridOpacity = useTransform(scrollYProgress, [0, 0.12], [0, 1]);

  // Whisper text (soft anchor to remove emptiness)
  const whisperOpacity = useTransform(scrollYProgress, [0.05, 0.22], [0, 1]);
  const whisperY = useTransform(scrollYProgress, [0.05, 0.22], [10, 0]);

  // Bottom card “sigh” expansion
  const bottomScale = useTransform(scrollYProgress, [0.45, 0.95], [0.985, 1]);

  return (
    <section ref={stageRef} className="stage stageRedesign">
      {/* keep your existing orbs vibe using the GLOBAL progress */}
      <Orbs progress={globalProgress} />

      <motion.p
        className="stageWhisper"
        style={{
          opacity: whisperOpacity,
          y: reduceMotion ? 0 : whisperY,
          filter: reduceMotion ? "none" : "blur(0px)",
        }}
      >
        Even silence carries meaning.
      </motion.p>

      <motion.div
        className="stageGrid stageGridNew"
        style={{
          opacity: gridOpacity,
          y: reduceMotion ? 0 : gridY,
        }}
      >
        {/* Connector */}
        <motion.div
          className="stageConnector"
          aria-hidden="true"
          style={{
            opacity: connectorOpacity,
            scaleY: connectorScale,
          }}
        />

        {/* Left card */}
        <motion.div
          className="stageLeft stageCard"
          initial={{ opacity: 0, y: 26, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        >
          <div className="label">At the top</div>
          <LineRevealMV
            progressMV={scrollYProgress}
            start={0.08}
            end={0.42}
            lines={[
              "Distance feels loud.",
              "Silence feels heavier than it should.",
              "Even simple days can feel incomplete.",
            ]}
          />
        </motion.div>

        {/* Right card */}
        <motion.div
          className="stageRight stageCard"
          initial={{ opacity: 0, y: 26, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
        >
          <div className="label">As you keep going</div>
          <LineRevealMV
            progressMV={scrollYProgress}
            start={0.26}
            end={0.68}
            lines={[
              "But then… warmth returns.",
              "The world steadies.",
              "And the space between us starts shrinking.",
            ]}
          />
        </motion.div>

        {/* Bottom card */}
        <motion.div
          className="stageBottom stageCard"
          style={{ scale: reduceMotion ? 1 : bottomScale }}
          initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "none" }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.28 }}
        >
          <div className="label">Near the end</div>
          <LineRevealMV
            progressMV={scrollYProgress}
            start={0.55}
            end={0.98}
            lines={[
              "Not because everything is perfect ",
              "but because we keep choosing kindness.",
              "And choosing each other.",
            ]}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

/** Upgrade #3: Memory cards */
function MemorySection({ reduceMotion }) {
  const memRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: memRef,
    offset: ["start 80%", "end 20%"],
  });

  const titleOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);
  const titleY = useTransform(scrollYProgress, [0, 0.15], [10, 0]);

  const memories = [
    { img: "/memories/m1.jpeg", cap: "A moment I replay in my head." },
    { img: "/memories/m2.jpeg", cap: "The kind of happy that feels calm." },
    { img: "/memories/m3.jpeg", cap: "One of my favorite versions of you." },
    { img: "/memories/m4.jpeg", cap: "Sexy as always🥰." },
  ];

  return (
    <section ref={memRef} className="memories">
      <motion.div className="memHeader" style={{ opacity: titleOpacity, y: titleY }}>
        <h2 className="memTitle">Little memories</h2>
        <p className="memSub">Scroll slowly — each one shows up gently.</p>
      </motion.div>

      <div className="polaroidGrid">
        {memories.map((m, idx) => (
          <PolaroidCard
            key={idx}
            idx={idx}
            img={m.img}
            cap={m.cap}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </section>
  );
}

function PolaroidCard({ idx, img, cap, reduceMotion }) {
  const cardRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start 85%", "end 60%"],
  });

  const baseRotate = [-10, 8, -6, 10][idx % 4];
  const baseX = [-30, 18, -18, 30][idx % 4];

  const opacity = useTransform(scrollYProgress, [0, 0.35, 1], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const x = useTransform(scrollYProgress, [0, 1], [baseX, 0]);
  const rotate = useTransform(scrollYProgress, [0, 1], [baseRotate, baseRotate * 0.25]);
  const blur = useTransform(scrollYProgress, [0, 0.5, 1], [8, 0, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  return (
    <motion.figure
      ref={cardRef}
      className="polaroid"
      style={{
        opacity,
        y: reduceMotion ? 0 : y,
        x: reduceMotion ? 0 : x,
        rotate: reduceMotion ? 0 : rotate,
        filter: reduceMotion ? "none" : filter,
      }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="polaroidImgWrap">
        <img className="polaroidImg" src={img} alt="Memory" loading="lazy" />
      </div>
      <figcaption className="polaroidCap">{cap}</figcaption>
    </motion.figure>
  );
}

function SoftModeToggle({ soft, setSoft }) {
  function handleToggle() {
    setSoft((prev) => {
      if (!prev) sparkleBurst();
      return !prev;
    });
  }

  return (
    <button
      className="audioBtn"
      onClick={handleToggle}
      aria-pressed={soft}
      title="Toggle Soft Mode"
    >
      <span className="audioIcon" aria-hidden="true">
        {soft ? "✨" : "✦"}
      </span>
      <span className="audioText">Soft Mode</span>
    </button>
  );
}

function PasscodeUnlock({ code = "0812", hint = "Try a special date 💗" }) {
  const [value, setValue] = useState("");
  const [unlocked, setUnlocked] = useState(() => {
    return localStorage.getItem("closer_unlocked") === "1";
  });
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  function normalize(s) {
    return (s || "").trim().toLowerCase();
  }

  function handleUnlock() {
    if (normalize(value) === normalize(code)) {
      setUnlocked(true);
      localStorage.setItem("closer_unlocked", "1");
      // little sparkle (re-use your sparkleBurst if you have it)
      if (typeof sparkleBurst === "function") sparkleBurst();
      setValue("");
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 420);
    }
  }

  function resetLock() {
    localStorage.removeItem("closer_unlocked");
    setUnlocked(false);
    setValue("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div className="unlockWrap">
      <div className="unlockCard">
        <div className="unlockTop">
          <span className="unlockIcon" aria-hidden="true">
            {unlocked ? "🔓" : "🔒"}
          </span>
          <div>
            <div className="unlockTitle">
              {unlocked ? "Unlocked" : "A private note"}
            </div>
            <div className="unlockHint">{unlocked ? "Just for you." : hint}</div>
          </div>
        </div>

        {!unlocked ? (
          <>
            <div className={`unlockRow ${shake ? "shake" : ""}`}>
              <input
                ref={inputRef}
                className="unlockInput"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter our code"
                inputMode="numeric"
                autoComplete="one-time-code"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUnlock();
                }}
                aria-label="Enter passcode"
              />
              <button className="unlockBtn" onClick={handleUnlock}>
                Unlock ✨
              </button>
            </div>
            <div className="unlockNote">
              Tip: A date that matters.
            </div>
          </>
        ) : (
          <>
            <div className="unlockReveal">
              <div className="unlockGlow" aria-hidden="true" />
              <p className="unlockMsg">
                I don’t need a perfect moment to love you.
                <br />
                I just need you to know:
                <br />
                <strong>I’m on your side—always.</strong>
              </p>
            </div>

            <div className="unlockActions">
              <button className="unlockBtn ghost" onClick={resetLock}>
                Lock again
              </button>
              <button
                className="unlockBtn"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Replay ↺
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}




export default function App() {
  const [soft, setSoft] = useState(false);
  const reduceMotion = useReducedMotion();

  // ✅ FIX: safe hook
  useLenisSmoothScroll(!reduceMotion);

  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const bg1 = useTransform(scrollYProgress, [0, 0.55, 1], [
    "radial-gradient(1200px 800px at 50% 10%, rgba(120,170,255,0.18), rgba(0,0,0,0.90))",
    "radial-gradient(1200px 800px at 50% 10%, rgba(255,120,185,0.16), rgba(0,0,0,0.90))",
    "radial-gradient(1200px 800px at 50% 10%, rgba(255,205,120,0.18), rgba(0,0,0,0.88))",
  ]);

  const vignette = useTransform(scrollYProgress, [0, 1], [0.78, 0.64]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  const finaleOpacity = useTransform(scrollYProgress, [0.78, 0.92], [0, 1]);
  const finaleY = useTransform(scrollYProgress, [0.78, 0.92], [16, 0]);

  const hasBurst = useRef(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!hasBurst.current && v >= 0.92 && !reduceMotion) {
      hasBurst.current = true;
      confettiBurst();
    }
    if (hasBurst.current && v <= 0.78) {
      hasBurst.current = false;
    }
  });

  return (
    <div ref={ref} className={`page ${soft ? "softMode" : ""}`}>
      <motion.div className="bg" style={{ backgroundImage: bg1 }} />
      <div className="noise" aria-hidden="true" />
      <motion.div className="vignette" style={{ opacity: vignette }} />

      <header className="topBar">
        <div className="brand">
          <span className="brandMark" aria-hidden="true">
            ✦
          </span>
          <span className="brandText"><i>FOR JASHAN</i></span>
        </div>

        <div className="topRight">
          <SoftModeToggle soft={soft} setSoft={setSoft} />
          <ProgressPill />
        </div>
      </header>

      <ScrollProgressSync progress={scrollYProgress} />

      <main className="content">
        <section className="hero">

          <motion.h1 className="heroTitle" style={{ opacity: titleOpacity }}>
            As you scroll,
            <br />
            I get closer.
          </motion.h1>

          <motion.p className="heroSub" style={{ opacity: titleOpacity }}>
            A quiet little page, made with care.
          </motion.p>

          <motion.div className="scrollHint" style={{ opacity: hintOpacity }}>
            <span className="mouse" aria-hidden="true" />
            <span className="scrollText">Scroll down</span>
          </motion.div>

          {!reduceMotion && <ParticleField intensity={1} />}
        </section>

        {/* ✅ REPLACED: redesigned stage (perfect fill + cinematic timing) */}
        <StageSection reduceMotion={reduceMotion} globalProgress={scrollYProgress} />

        <MemorySection reduceMotion={reduceMotion} />

        <section className="finale">
          <motion.div className="finaleCard" style={{ opacity: finaleOpacity, y: finaleY }}>
            <div className="finaleTop">
              <span className="seal" aria-hidden="true">
                ♡
              </span>
              <span className="finaleTitle">One last thing</span>
            </div>

            <p className="finaleText">
              I don’t want to impress you with big words.
              <br />
              I want to make you feel safe, seen, and genuinely cared for.
            </p>

            <div className="finaleRow">
              <button
                className="finaleBtn"
                onClick={() => {
                  const el = document.getElementById("secret");
                  if (el) el.classList.toggle("reveal");
                }}
              >
                Tap for a small surprise ✨
              </button>
              {/* <span className="finaleNote">You can customize everything in App.jsx</span> */}
            </div>

            <div id="secret" className="secretBox" aria-live="polite">
              <div className="secretGlow" aria-hidden="true" />
              <p className="secretText">
                If you ever doubt yourself for even a second:
                <br />
                <strong>you matter to me, a lot.</strong>
              </p>
            </div>
          </motion.div>

          {!reduceMotion && <ParticleField intensity={1.2} />}
          <PasscodeUnlock code="12102704" hint="Hint: a date that matters 💗" />
        </section>

        {/* <footer className="footer">
          <p className="footerText">
            Made with React • Scroll story • Soft ambience • Confetti finale
          </p>
        </footer> */}
      </main>
    </div>
  );
}

function ScrollProgressSync({ progress }) {
  useEffect(() => {
    const pill = document.querySelector(".progressPill");
    if (!pill) return;

    const pctEl = pill.querySelector(".progressPct");
    const fillEl = pill.querySelector(".progressFill");
    if (!pctEl || !fillEl) return;

    return progress.on("change", (v) => {
      const pct = Math.round(v * 100);
      pctEl.textContent = `${pct}%`;
      fillEl.style.width = `${pct}%`;
    });
  }, [progress]);

  return null;
}
