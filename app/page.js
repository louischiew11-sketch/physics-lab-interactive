'use client';

import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Play, RefreshCw, Zap } from 'lucide-react';

export default function Home() {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const itemsRef = useRef([]);
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

    // Wall boundaries with generous padding
    const ground = Bodies.rectangle(width / 2, height + 50, width * 2, 100, { isStatic: true });
    const leftWall = Bodies.rectangle(-50, height / 2, 100, height * 2, { isStatic: true });
    const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height * 2, { isStatic: true });
    const ceiling = Bodies.rectangle(width / 2, -50, width * 2, 100, { isStatic: true });

    World.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    // Measure elements after layout stabilizes
    const items = [];
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('.physics-item');

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        
        // Slightly shrink hitboxes (90%) to prevent initial collision overlap explosion
        const body = Bodies.rectangle(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          rect.width * 0.9,
          rect.height * 0.9,
          {
            restitution: 0.6,
            friction: 0.1,
            frictionAir: 0.03, // Smoother floating movement
            isStatic: true,
            render: { fillStyle: 'transparent' }
          }
        );
        body.domElement = el;
        items.push(body);
      });

      itemsRef.current = items;
      World.add(engine.world, items);
    }, 200);

    // Mouse drag interaction
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    World.add(engine.world, mouseConstraint);

    // Synchronize HTML position with physics engine body coordinates
    Matter.Events.on(engine, 'afterUpdate', () => {
      itemsRef.current.forEach((body) => {
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
      clearTimeout(timer);
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

    engineRef.current.gravity.y = isNowActive ? 0.8 : 0;

    // Unlock static bodies and apply gentle random nudges
    itemsRef.current.forEach((body) => {
      Matter.Body.setStatic(body, !isNowActive);
      if (isNowActive) {
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 4
        });
      }
    });
  };

  const blastOff = () => {
    if (!engineRef.current) return;
    itemsRef.current.forEach((body) => {
      Matter.Body.setStatic(body, false);
      Matter.Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * 0.08,
        y: -0.12
      });
    });
    setGravityEnabled(true);
    engineRef.current.gravity.y = 0.8;
  };

  const resetUI = () => {
    window.location.reload();
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      <div ref={sceneRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Hero Content */}
      <div className="relative z-20 flex flex-col items-center justify-center pt-24 px-4 text-center">
        <h1 className="physics-item inline-block text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent mb-6 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          Breaking the 4th Wall
        </h1>
        <p className="physics-item max-w-xl text-lg text-slate-400 mb-10 p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          An interactive portfolio built with Next.js & Matter.js. Trigger gravity below to break the page layout!
        </p>

        {/* Skill Badges */}
        <div className="flex flex-wrap justify-center gap-4 max-w-2xl mb-12">
          {skills.map((skill, i) => (
            <span
              key={i}
              className="physics-item px-5 py-2.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 font-medium text-sm shadow-lg backdrop-blur-md cursor-grab active:cursor-grabbing"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Dock Controls */}
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