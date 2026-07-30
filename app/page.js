'use client';

import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Play, RefreshCw, Zap } from 'lucide-react';

export default function Home() {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const runnerRef = useRef(null);
  const bodiesRef = useRef([]);
  const [gravityEnabled, setGravityEnabled] = useState(false);

  const skills = ['Next.js', 'React', 'Tailwind CSS', 'Matter.js', 'JavaScript', 'UI/UX', 'Git', 'Vercel'];

  useEffect(() => {
    const { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint } = Matter;

    // Initialize Engine
    const engine = Engine.create({
      gravity: { x: 0, y: 0, scale: 0.001 }
    });
    engineRef.current = engine;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Render overlay canvas
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

    // Attach mouse listener directly to document body (prevents (0,0) top-left snapping)
    const mouse = Mouse.create(document.body);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    World.add(engine.world, mouseConstraint);

    // Sync HTML element positions to Matter.js body coordinates
    Matter.Events.on(engine, 'afterUpdate', () => {
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
  }, []);

  // Takes a real-time snapshot of DOM positions and converts them into physics bodies
  const activatePhysics = (applyBlast = false) => {
    if (!engineRef.current || gravityEnabled) return;

    const { Bodies, World, Body } = Matter;
    const elements = document.querySelectorAll('.physics-item');
    const newBodies = [];

    elements.forEach((el) => {
      // 1. Snapshot exact screen position before altering CSS
      const rect = el.getBoundingClientRect();

      // 2. Freeze dimensions & convert to fixed positioning seamlessly
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
      el.style.position = 'fixed';
      el.style.left = '0px';
      el.style.top = '0px';
      el.style.margin = '0px';
      el.style.zIndex = '40';
      el.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0px)`;

      // 3. Instantiate dynamic Matter.js body at measured center
      const body = Bodies.rectangle(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        rect.width,
        rect.height,
        {
          restitution: 0.6,
          friction: 0.1,
          frictionAir: 0.02
        }
      );

      body.domElement = el;
      body.domWidth = rect.width;
      body.domHeight = rect.height;

      if (applyBlast) {
        Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * 0.08,
          y: -0.12
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

    // Turn on downwards gravity
    engineRef.current.gravity.y = 1;
    setGravityEnabled(true);
  };

  const resetUI = () => {
    window.location.reload();
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Physics Overlay Canvas */}
      <div ref={sceneRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Hero Content */}
      <div className="relative z-20 flex flex-col items-center justify-center pt-20 px-4 text-center">
        <h1 className="physics-item inline-block text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent mb-6 p-4 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
          Breaking the 4th Wall
        </h1>
        <p className="physics-item max-w-xl text-lg text-slate-400 mb-10 p-4 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
          An interactive portfolio built with Next.js & Matter.js. Trigger gravity below to break the page layout!
        </p>

        {/* Skill Badges */}
        <div className="flex flex-wrap justify-center gap-4 max-w-2xl mb-12">
          {skills.map((skill, i) => (
            <span
              key={i}
              className="physics-item px-5 py-2.5 rounded-full border border-cyan-500/30 bg-cyan-950/60 text-cyan-300 font-medium text-sm shadow-lg backdrop-blur-md cursor-grab active:cursor-grabbing"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Control Dock */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-3 rounded-2xl border border-slate-700 bg-slate-900/90 backdrop-blur-xl shadow-2xl">
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