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

    // Collision Masks (0x0001 = Walls/Mouse, 0x0002 = UI Elements)
    const WALL_CATEGORY = 0x0001;
    const ITEM_CATEGORY = 0x0002;

    // Screen Boundary Walls
    const ground = Bodies.rectangle(width / 2, height + 50, width * 2, 100, {
      isStatic: true,
      collisionFilter: { category: WALL_CATEGORY }
    });
    const leftWall = Bodies.rectangle(-50, height / 2, 100, height * 2, {
      isStatic: true,
      collisionFilter: { category: WALL_CATEGORY }
    });
    const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height * 2, {
      isStatic: true,
      collisionFilter: { category: WALL_CATEGORY }
    });
    const ceiling = Bodies.rectangle(width / 2, -50, width * 2, 100, {
      isStatic: true,
      collisionFilter: { category: WALL_CATEGORY }
    });

    World.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    // Measure HTML elements after DOM renders
    const items = [];
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('.physics-item');

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();

        const body = Bodies.rectangle(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          rect.width,
          rect.height,
          {
            restitution: 0.5,
            friction: 0.1,
            frictionAir: 0.04, // Air resistance prevents runaway speed
            isStatic: true,
            // CRITICAL FIX: Only collide with Walls (WALL_CATEGORY), NOT with other items!
            collisionFilter: {
              category: ITEM_CATEGORY,
              mask: WALL_CATEGORY
            },
            render: { fillStyle: 'transparent' }
          }
        );

        body.domElement = el;

        // Lock exact dimensions so flexbox doesn't distort layout on transform
        el.style.width = `${rect.width}px`;
        el.style.height = `${rect.height}px`;

        items.push(body);
      });

      itemsRef.current = items;
      World.add(engine.world, items);
    }, 300);

    // Mouse drag interaction
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
      collisionFilter: { mask: ITEM_CATEGORY }
    });
    World.add(engine.world, mouseConstraint);

    // Sync HTML positions to Matter.js coordinates
    Matter.Events.on(engine, 'afterUpdate', () => {
      itemsRef.current.forEach((body) => {
        if (body.domElement && !body.isStatic) {
          const { x, y } = body.position;
          const angle = body.angle;

          body.domElement.style.position = 'fixed';
          body.domElement.style.left = '0px';
          body.domElement.style.top = '0px';
          body.domElement.style.transform = `translate3d(${x - body.domElement.offsetWidth / 2}px, ${y - body.domElement.offsetHeight / 2}px, 0px) rotate(${angle}rad)`;
          body.domElement.style.zIndex = '50';
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

    engineRef.current.gravity.y = isNowActive ? 1 : 0;

    itemsRef.current.forEach((body) => {
      Matter.Body.setStatic(body, !isNowActive);
      if (isNowActive) {
        // Small initial nudge
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 2,
          y: Math.random() * 2
        });
      }
    });
  };

  const blastOff = () => {
    if (!engineRef.current) return;
    itemsRef.current.forEach((body) => {
      Matter.Body.setStatic(body, false);
      Matter.Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * 0.05,
        y: -0.1
      });
    });
    setGravityEnabled(true);
    engineRef.current.gravity.y = 1;
  };

  const resetUI = () => {
    window.location.reload();
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      <div ref={sceneRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Hero Section */}
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