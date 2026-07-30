'use client';

import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Play, RefreshCw, Zap, Volume2, VolumeX, ExternalLink, Github } from 'lucide-react';

export default function Home() {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const runnerRef = useRef(null);
  const bodiesRef = useRef([]);
  const audioCtxRef = useRef(null);

  const [gravityEnabled, setGravityEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const skills = ['Next.js', 'React', 'Tailwind CSS', 'Matter.js', 'JavaScript', 'UI/UX', 'Git', 'Vercel'];

  const projects = [
    {
      title: 'AI Code Visualizer',
      desc: 'Interactive AST tree renderer for JavaScript with live execution tracing.',
      tech: ['React', 'D3.js', 'Tailwind'],
      github: 'https://github.com',
      live: 'https://vercel.com'
    },
    {
      title: 'Neural Synthesizer',
      desc: 'Browser-based WebAudio synth engine driven by custom gesture controls.',
      tech: ['Web Audio API', 'Canvas', 'TypeScript'],
      github: 'https://github.com',
      live: 'https://vercel.com'
    }
  ];

  // Synthesizes a clean impact sound based on collision velocity using Web Audio API
  const playImpactSound = (speed) => {
    if (!soundEnabled || speed < 1.2) return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Pitch modulates with impact speed (higher velocity = higher pitch thud)
      const baseFreq = Math.min(120 + speed * 30, 500);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.08);

      // Volume volume envelope
      const vol = Math.min((speed / 12) * 0.3, 0.35);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio context fallback
    }
  };

  useEffect(() => {
    const { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint, Events } = Matter;

    const engine = Engine.create({
      gravity: { x: 0, y: 0, scale: 0.001 }
    });
    engineRef.current = engine;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: 'transparent'
      }
    });

    // Outer Screen Boundaries
    const ground = Bodies.rectangle(width / 2, height + 50, width * 2, 100, { isStatic: true });
    const leftWall = Bodies.rectangle(-50, height / 2, 100, height * 2, { isStatic: true });
    const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height * 2, { isStatic: true });
    const ceiling = Bodies.rectangle(width / 2, -50, width * 2, 100, { isStatic: true });

    World.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    // Mouse Drag Listener
    const mouse = Mouse.create(document.body);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    World.add(engine.world, mouseConstraint);

    // Collision listener for SFX
    Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const speedA = pair.bodyA.speed || 0;
        const speedB = pair.bodyB.speed || 0;
        playImpactSound(Math.max(speedA, speedB));
      });
    });

    // Position sync
    Events.on(engine, 'afterUpdate', () => {
      bodiesRef.current.forEach((body) => {
        if (body.domElement) {
          const { x, y } = body.position;
          const angle = body.angle;
          const w = body.domWidth;
          const h = body.domHeight;

          body.domElement.style.transform = `translate3d(${x - w / 2}px, ${y - h / 2}px, 0px) rotate(${angle}rad)`;
        }
      });
    });

    Render.run(render);
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      World.clear(engine.world);
      Engine.clear(engine);
    };
  }, [soundEnabled]);

  const activatePhysics = (applyBlast = false) => {
    if (!engineRef.current || gravityEnabled) return;

    // Resume Web Audio Context on first click
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const { Bodies, World, Body } = Matter;
    const elements = document.querySelectorAll('.physics-item');
    const newBodies = [];

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();

      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
      el.style.position = 'fixed';
      el.style.left = '0px';
      el.style.top = '0px';
      el.style.margin = '0px';
      el.style.zIndex = '40';
      el.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0px)`;

      const body = Bodies.rectangle(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        rect.width,
        rect.height,
        {
          restitution: 0.65,
          friction: 0.1,
          frictionAir: 0.02
        }
      );

      body.domElement = el;
      body.domWidth = rect.width;
      body.domHeight = rect.height;

      if (applyBlast) {
        Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * 0.1,
          y: -0.15
        });
      } else {
        Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 2,
          y: Math.random() * 2
        });
      }

      newBodies.push(body);
    });

    bodiesRef.current = newBodies;
    World.add(engineRef.current.world, newBodies);

    engineRef.current.gravity.y = 1;
    setGravityEnabled(true);
  };

  const resetUI = () => {
    window.location.reload();
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none pb-32">
      <div ref={sceneRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Hero Section */}
      <div className="relative z-20 flex flex-col items-center justify-center pt-16 px-4 text-center max-w-4xl mx-auto">
        <h1 className="physics-item inline-block text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent mb-6 p-4 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
          Breaking the 4th Wall
        </h1>
        <p className="physics-item max-w-xl text-lg text-slate-400 mb-8 p-4 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
          Interactive Web Developer Portfolio. Toggle gravity below to collapse the page DOM into physical matter!
        </p>

        {/* Skill Badges */}
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl mb-12">
          {skills.map((skill, i) => (
            <span
              key={i}
              className="physics-item px-5 py-2.5 rounded-full border border-cyan-500/30 bg-cyan-950/60 text-cyan-300 font-medium text-sm shadow-lg backdrop-blur-md cursor-grab active:cursor-grabbing"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Interactive Project Showcase */}
        <div className="w-full grid md:grid-cols-2 gap-6 text-left mb-16">
          {projects.map((proj, i) => (
            <div
              key={i}
              className="physics-item p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md shadow-xl flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">{proj.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{proj.desc}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {proj.tech.map((t, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-slate-800">
                <a
                  href={proj.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" /> Code
                </a>
                <a
                  href={proj.live}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Demo
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Dock */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-3 rounded-2xl border border-slate-700 bg-slate-900/90 backdrop-blur-xl shadow-2xl">
        <button
          onClick={() => activatePhysics(false)}
          disabled={gravityEnabled}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
            gravityEnabled
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/40'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          {gravityEnabled ? 'Gravity Active' : 'Turn Off Gravity'}
        </button>

        <button
          onClick={() => activatePhysics(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/40 transition-all"
        >
          <Zap className="w-4 h-4" />
          Blast Off
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2.5 rounded-xl border transition-all ${
            soundEnabled
              ? 'bg-slate-800 text-cyan-400 border-slate-700 hover:bg-slate-700'
              : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
          }`}
          title="Toggle SFX"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={resetUI}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </main>
  );
}