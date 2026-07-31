'use client';

import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { RefreshCw, PlusCircle, Activity } from 'lucide-react';

export default function Home() {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint } = Matter;

    // 1. Setup Engine
    const engine = Engine.create();
    engineRef.current = engine;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 2. Setup Renderer (Native Matter.js Canvas)
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

    // 3. Create Lab Boundaries
    const ground = Bodies.rectangle(width / 2, height, width, 60, { 
      isStatic: true, 
      render: { fillStyle: '#1e293b' } // Slate 800
    });
    const leftWall = Bodies.rectangle(0, height / 2, 60, height, { 
      isStatic: true,
      render: { fillStyle: '#1e293b' }
    });
    const rightWall = Bodies.rectangle(width, height / 2, 60, height, { 
      isStatic: true,
      render: { fillStyle: '#1e293b' }
    });

    World.add(engine.world, [ground, leftWall, rightWall]);

    // 4. Add Mouse Interaction so users can grab the shapes
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    World.add(engine.world, mouseConstraint);

    // Run Engine
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Cleanup
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      World.clear(engine.world);
      Engine.clear(engine);
    };
  }, []);

  // Function to spawn different types of objects
  const spawnObject = (material) => {
    if (!engineRef.current) return;
    const { Bodies, World } = Matter;
    
    const startX = window.innerWidth / 2 + (Math.random() * 100 - 50); // Randomize drop point slightly
    let newBody;

    if (material === 'rubber') {
      newBody = Bodies.circle(startX, 100, 40, {
        restitution: 0.95, // VERY Bouncy
        friction: 0.05,
        render: { fillStyle: '#22d3ee' } // Cyan
      });
    } else if (material === 'bowling') {
      newBody = Bodies.circle(startX, 100, 50, {
        restitution: 0.1, // Heavy thud, low bounce
        density: 0.05,    // Much heavier
        render: { fillStyle: '#475569' } // Slate 600
      });
    } else if (material === 'box') {
      newBody = Bodies.rectangle(startX, 100, 60, 60, {
        restitution: 0.4, 
        friction: 0.8,    // High friction, slides slowly
        render: { fillStyle: '#f59e0b' } // Amber
      });
    }

    World.add(engineRef.current.world, newBody);
  };

  const clearLab = () => {
    if (!engineRef.current) return;
    const world = engineRef.current.world;
    // Remove everything except the static walls/ground
    const dynamicBodies = world.bodies.filter(body => !body.isStatic);
    Matter.World.remove(world, dynamicBodies);
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Educational Overlay - UI stays on top of the physics canvas */}
      <div className="absolute top-0 left-0 w-full p-8 z-20 pointer-events-none">
        <div className="max-w-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-cyan-400 w-6 h-6" />
            <h1 className="text-2xl font-bold text-white">Lesson 1: Restitution</h1>
          </div>
          
          <p className="text-slate-400 mb-4 text-sm leading-relaxed">
            In physics, <strong>restitution</strong> is a measure of bounciness. It determines how much kinetic energy remains after a collision. 
            <br/><br/>
            A value of <strong>1.0</strong> means a perfect bounce (no energy lost). A value of <strong>0.0</strong> means the object absorbs all the energy and stops dead.
          </p>
          
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Spawn Objects (Try dropping them!)</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => spawnObject('rubber')} className="flex items-center gap-2 px-4 py-2 bg-cyan-900/50 hover:bg-cyan-800 text-cyan-300 border border-cyan-700/50 rounded-lg text-sm font-medium transition-colors">
                <PlusCircle className="w-4 h-4" /> Rubber Ball (0.95)
              </button>
              <button onClick={() => spawnObject('bowling')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-sm font-medium transition-colors">
                <PlusCircle className="w-4 h-4" /> Bowling Ball (0.10)
              </button>
              <button onClick={() => spawnObject('box')} className="flex items-center gap-2 px-4 py-2 bg-amber-900/50 hover:bg-amber-800 text-amber-300 border border-amber-700/50 rounded-lg text-sm font-medium transition-colors">
                <PlusCircle className="w-4 h-4" /> Wooden Box
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Physics Canvas Background */}
      <div ref={sceneRef} className="absolute inset-0 z-10" />

      {/* Reset Button */}
      <button 
        onClick={clearLab}
        className="absolute bottom-8 right-8 z-30 flex items-center gap-2 px-4 py-3 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl font-medium shadow-lg backdrop-blur-md transition-all"
      >
        <RefreshCw className="w-4 h-4" /> Clear Lab
      </button>
    
    </main>
  );
}