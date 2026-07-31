'use client';

import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { RefreshCw, Activity, ChevronRight, ChevronLeft } from 'lucide-react';

export default function Home() {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  
  // Navigation State
  const [lesson, setLesson] = useState(1);
  const [gravityType, setGravityType] = useState('Earth');

  useEffect(() => {
    const { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint } = Matter;

    // 1. Setup Engine with "Tunneling" Fixes (Higher iterations prevent phasing through blocks)
    const engine = Engine.create({
      positionIterations: 12, 
      velocityIterations: 12
    });
    engineRef.current = engine;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent'
      }
    });

    // 2. Extra Thick Boundaries (Also prevents phasing/tunneling)
    const ground = Bodies.rectangle(width / 2, height + 100, width * 3, 250, { 
      isStatic: true, render: { fillStyle: '#1e293b' } 
    });
    const leftWall = Bodies.rectangle(-100, height / 2, 200, height * 3, { 
      isStatic: true, render: { fillStyle: '#1e293b' }
    });
    const rightWall = Bodies.rectangle(width + 100, height / 2, 200, height * 3, { 
      isStatic: true, render: { fillStyle: '#1e293b' }
    });

    World.add(engine.world, [ground, leftWall, rightWall]);

    // 3. Lesson-Specific Environments
    if (lesson === 2) {
      // Build a friction ramp spanning across the screen
      const ramp = Bodies.rectangle(width / 2, height / 2 + 100, width * 0.8, 40, {
        isStatic: true,
        angle: Math.PI / 8, // ~22.5 degree slope
        render: { fillStyle: '#334155' } // Slate 700
      });
      World.add(engine.world, [ramp]);
    }

    if (lesson === 3) {
      engine.gravity.y = 1; // Default to Earth
      setGravityType('Earth');
    }

    // 4. Mouse Drag Interaction
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    World.add(engine.world, mouseConstraint);

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // 5. Cleanup when switching lessons
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      World.clear(engine.world);
      Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove(); // Prevents multiple canvases from stacking up
      }
    };
  }, [lesson]); 

  // Spawns objects based on the current lesson
  const spawnObject = (type) => {
    if (!engineRef.current) return;
    const { Bodies, World } = Matter;
    const startX = window.innerWidth / 2 + (Math.random() * 50 - 25);
    let newBody;

    // LESSON 1: Bounciness
    if (lesson === 1) {
      if (type === 'rubber') {
        newBody = Bodies.circle(startX, 100, 40, { restitution: 0.95, render: { fillStyle: '#22d3ee' } });
      } else if (type === 'bowling') {
        newBody = Bodies.circle(startX, 100, 50, { restitution: 0.1, density: 0.05, render: { fillStyle: '#475569' } });
      }
    }
    
    // LESSON 2: Friction Ramp
    if (lesson === 2) {
      // Drop blocks from the top left onto the ramp
      const dropX = window.innerWidth * 0.2;
      if (type === 'ice') {
        newBody = Bodies.rectangle(dropX, 100, 50, 50, { friction: 0.001, render: { fillStyle: '#bae6fd' } });
      } else if (type === 'wood') {
        newBody = Bodies.rectangle(dropX, 100, 50, 50, { friction: 0.4, render: { fillStyle: '#d97706' } });
      } else if (type === 'rubber-block') {
        newBody = Bodies.rectangle(dropX, 100, 50, 50, { friction: 0.9, render: { fillStyle: '#1e293b' } });
      }
    }

    // LESSON 3: Gravity
    if (lesson === 3) {
      newBody = Bodies.rectangle(startX, 100, 40, 40, { render: { fillStyle: '#a78bfa' } });
    }

    if (newBody) World.add(engineRef.current.world, newBody);
  };

  const changeGravity = (type) => {
    if (!engineRef.current) return;
    setGravityType(type);
    if (type === 'Earth') engineRef.current.gravity.y = 1;
    if (type === 'Moon') engineRef.current.gravity.y = 0.16; // 16% of Earth
    if (type === 'Jupiter') engineRef.current.gravity.y = 2.4; // 2.4x Earth
  };

  const clearLab = () => {
    if (!engineRef.current) return;
    const world = engineRef.current.world;
    const dynamicBodies = world.bodies.filter(body => !body.isStatic);
    Matter.World.remove(world, dynamicBodies);
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Top Navigation Menu */}
      <div className="absolute top-0 left-0 w-full p-6 z-30 pointer-events-none flex justify-between items-start">
        
        {/* Lesson Controller */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-2xl pointer-events-auto max-w-md">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setLesson(Math.max(1, lesson - 1))} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-30">
              <ChevronLeft className="w-5 h-5"/>
            </button>
            <div className="flex items-center gap-2">
              <Activity className="text-cyan-400 w-5 h-5"/>
              <h1 className="text-xl font-bold text-white">
                Lesson {lesson}: {lesson === 1 ? 'Restitution' : lesson === 2 ? 'Friction' : 'Gravity'}
              </h1>
            </div>
            <button onClick={() => setLesson(Math.min(3, lesson + 1))} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-30">
              <ChevronRight className="w-5 h-5"/>
            </button>
          </div>
          
          {/* Lesson 1 Description */}
          {lesson === 1 && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">Drop objects to see how different materials retain kinetic energy when they bounce.</p>
              <div className="flex gap-2">
                <button onClick={() => spawnObject('rubber')} className="px-3 py-2 bg-cyan-900/50 text-cyan-300 rounded-lg text-sm border border-cyan-800 hover:bg-cyan-800 transition">Rubber Ball</button>
                <button onClick={() => spawnObject('bowling')} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm border border-slate-700 hover:bg-slate-700 transition">Bowling Ball</button>
              </div>
            </div>
          )}

          {/* Lesson 2 Description */}
          {lesson === 2 && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">Friction resists sliding motion. Drop these blocks on the ramp to see how friction values (0.01 to 0.9) affect their speed.</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => spawnObject('ice')} className="px-3 py-2 bg-sky-900/50 text-sky-300 rounded-lg text-sm border border-sky-800 hover:bg-sky-800 transition">Ice Block</button>
                <button onClick={() => spawnObject('wood')} className="px-3 py-2 bg-amber-900/50 text-amber-300 rounded-lg text-sm border border-amber-800 hover:bg-amber-800 transition">Wood Block</button>
                <button onClick={() => spawnObject('rubber-block')} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm border border-slate-700 hover:bg-slate-700 transition">Rubber Block</button>
              </div>
            </div>
          )}

          {/* Lesson 3 Description */}
          {lesson === 3 && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">Mass determines gravitational pull. Change the planet to see how acceleration changes!</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <button onClick={() => changeGravity('Earth')} className={`px-3 py-2 rounded-lg text-sm border transition ${gravityType === 'Earth' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>Earth (1G)</button>
                <button onClick={() => changeGravity('Moon')} className={`px-3 py-2 rounded-lg text-sm border transition ${gravityType === 'Moon' ? 'bg-slate-300 text-slate-900 border-slate-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>Moon (0.16G)</button>
                <button onClick={() => changeGravity('Jupiter')} className={`px-3 py-2 rounded-lg text-sm border transition ${gravityType === 'Jupiter' ? 'bg-orange-700 text-white border-orange-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>Jupiter (2.4G)</button>
              </div>
              <button onClick={() => spawnObject('box')} className="px-3 py-2 bg-purple-900/50 hover:bg-purple-800 text-purple-300 rounded-lg text-sm border border-purple-800 w-full transition">Drop Test Subject</button>
            </div>
          )}
        </div>
      </div>

      <div ref={sceneRef} className="absolute inset-0 z-10" />

      <button onClick={clearLab} className="absolute bottom-8 right-8 z-30 flex items-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg transition-all">
        <RefreshCw className="w-4 h-4"/> Clear Lab
      </button>

    </main>
  );
}