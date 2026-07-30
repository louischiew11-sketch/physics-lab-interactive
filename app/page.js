'use client';

import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Play, RefreshCw, Zap } from 'lucide-react';

export default function Home() {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const [gravityEnabled, setGravityEnabled] = useState(false);

  const skills = ['Next.js', 'React', 'Tailwind CSS', 'Matter.js', 'JavaScript', 'UI/UX', 'Git', 'Vercel'];

  useEffect(() => {
    const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, World } = Matter;

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

    // Boundaries
    const ground = Bodies.rectangle(width / 2, height + 30, width, 60, { isStatic: true });
    const leftWall = Bodies.rectangle(-30, height / 2, 60, height, { isStatic: true });
    const rightWall = Bodies.rectangle(width + 30, height / 2, 60, height, { isStatic: true });
    const ceiling = Bodies.rectangle(width / 2, -30, width, 60, { isStatic: true });

    World.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    // Add interactive physics bodies
    const items = [];
    const elements = document.querySelectorAll('.physics-item');

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const body = Bodies.rectangle(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        rect.width,
        rect.height,
        {
          restitution: 0.8,
          friction: 0.1,
          isStatic: true, // Start locked in place
          render: { fillStyle: 'transparent' }
        }
      );
      body.domElement = el;
      items.push(body);
    });

    World.add(engine.world, items);

    // Mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    World.add(engine.world, mouseConstraint);

    // Sync HTML with Matter.js positions
    Matter.Events.on(engine, 'afterUpdate', () => {
      items.forEach((body) => {
        if (body.domElement && !body.isStatic) {
          const { x, y } = body.position;
          const angle = body.angle;
          body.domElement.style.transform = `translate(${x - body.domElement.offsetWidth / 2}px, ${y - body.domElement.offsetHeight / 2}px) rotate(${angle}rad)`;
          body.domElement.style.position = 'fixed';
          body.domElement.style.left = '0px';
          body.domElement.style.top = '0px';
        }
      });
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Composite.clear(engine.world);
      Engine.clear(engine);
    };
  }, []);

  const toggleGravity = () => {
    if (!engineRef.current) return;
    const isNowActive = !gravityEnabled;
    setGravityEnabled(isNowActive);

    engineRef.current.gravity.y = isNowActive ? 1 : 0;

    // Unlock static bodies so they fall
    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    bodies.forEach((body) => {
      if (body.domElement) {
        Matter.Body.setStatic(body, !isNowActive);
      }
    });
  };

  const blastOff = () => {
    if (!engineRef.current) return;
    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    bodies.forEach((body) => {
      if (body.domElement) {
        Matter.Body.setStatic(body, false);
        Matter.Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * 0.1,
          y: -0.15
        });
      }
    });
    setGravityEnabled(true);
    engineRef.current.gravity.y = 1;
  };

  const resetUI = () => {
    window.location.reload();
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Background canvas for Matter.js debugging if needed */}
      <div ref={sceneRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Hero Section */}
      <div className="relative z-20 flex flex-col items-center justify-center pt-24 px-4 text-center">
        <h1 className="physics-item inline-block text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent mb-6 p-2 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
          Breaking the 4th Wall
        </h1>
        <p className="physics-item max-w-xl text-lg text-slate-400 mb-10 p-4 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
          An interactive portfolio built with Next.js & Matter.js. Toggle gravity below to drop the DOM elements!
        </p>

        {/* Skill Badges */}
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl mb-12">
          {skills.map((skill, i) => (
            <span
              key={i}
              className="physics-item px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 font-medium text-sm shadow-lg backdrop-blur-md"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Interactive Control Dock */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 p-3 rounded-2xl border border-slate-700 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
        <button
          onClick={toggleGravity}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
            gravityEnabled
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/40'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          {gravityEnabled ? 'Restore Gravity' : 'Turn Off Gravity'}
        </button>

        <button
          onClick={blastOff}
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