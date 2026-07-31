'use client';

import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { RefreshCw, Activity, ChevronRight, ChevronLeft, Settings, Hammer, Minimize2, Maximize2 } from 'lucide-react';

export default function Lab() {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  
  // UI State
  const [isMinimized, setIsMinimized] = useState(false);

  // Navigation & Environment State
  const [lesson, setLesson] = useState(1);
  const [gravityType, setGravityType] = useState('Earth');

  // Customizer State
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customShape, setCustomShape] = useState('circle');
  const [customMaterial, setCustomMaterial] = useState('wood');
  const [customSize, setCustomSize] = useState(40);
  const [customMassMult, setCustomMassMult] = useState(1); // 🚀 NEW: Mass multiplier (0.1x to 10x)

  // Material Physics Definitions
  const materials = {
    rubber: { restitution: 0.95, friction: 0.1, density: 0.01, color: '#22d3ee', name: 'Rubber' },
    wood: { restitution: 0.4, friction: 0.4, density: 0.04, color: '#d97706', name: 'Wood' },
    metal: { restitution: 0.1, friction: 0.2, density: 0.1, color: '#94a3b8', name: 'Metal' },
    ice: { restitution: 0.2, friction: 0.001, density: 0.02, color: '#bae6fd', name: 'Ice' }
  };

  useEffect(() => {
    const { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint } = Matter;

    const engine = Engine.create({ positionIterations: 12, velocityIterations: 12 });
    engineRef.current = engine;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: { width, height, wireframes: false, background: 'transparent' }
    });

    const ground = Bodies.rectangle(width / 2, height + 100, width * 3, 250, { isStatic: true, render: { fillStyle: '#1e293b' } });
    const leftWall = Bodies.rectangle(-100, height / 2, 200, height * 3, { isStatic: true, render: { fillStyle: '#1e293b' } });
    const rightWall = Bodies.rectangle(width + 100, height / 2, 200, height * 3, { isStatic: true, render: { fillStyle: '#1e293b' } });

    World.add(engine.world, [ground, leftWall, rightWall]);

    if (lesson === 2) {
      const ramp = Bodies.rectangle(width / 2, height / 2 + 100, width * 0.8, 40, {
        isStatic: true, angle: Math.PI / 8, render: { fillStyle: '#334155' }
      });
      World.add(engine.world, [ramp]);
    }

    if (lesson === 3) {
      engine.gravity.y = 1;
      setGravityType('Earth');
    }

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    World.add(engine.world, mouseConstraint);

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      World.clear(engine.world);
      Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
    };
  }, [lesson]); 

  const spawnObject = (type) => {
    if (!engineRef.current) return;
    const { Bodies, World } = Matter;
    const startX = window.innerWidth / 2 + (Math.random() * 50 - 25);
    let newBody;

    if (lesson === 1) {
      if (type === 'rubber') newBody = Bodies.circle(startX, 100, 40, { restitution: 0.95, render: { fillStyle: '#22d3ee' } });
      else if (type === 'bowling') newBody = Bodies.circle(startX, 100, 50, { restitution: 0.1, density: 0.05, render: { fillStyle: '#475569' } });
    }
    
    if (lesson === 2) {
      const dropX = window.innerWidth * 0.2;
      if (type === 'ice') newBody = Bodies.rectangle(dropX, 100, 50, 50, { friction: 0.001, render: { fillStyle: '#bae6fd' } });
      else if (type === 'wood') newBody = Bodies.rectangle(dropX, 100, 50, 50, { friction: 0.4, render: { fillStyle: '#d97706' } });
      else if (type === 'rubber-block') newBody = Bodies.rectangle(dropX, 100, 50, 50, { friction: 0.9, render: { fillStyle: '#1e293b' } });
    }

    if (lesson === 3) {
      newBody = Bodies.rectangle(startX, 100, 40, 40, { render: { fillStyle: '#a78bfa' } });
    }

    if (newBody) World.add(engineRef.current.world, newBody);
  };

  const spawnCustomObject = () => {
    if (!engineRef.current) return;
    const { Bodies, World } = Matter;
    
    const startX = lesson === 2 ? window.innerWidth * 0.2 : window.innerWidth / 2 + (Math.random() * 50 - 25);
    const startY = 100;
    
    const mat = materials[customMaterial];
    const options = {
      restitution: mat.restitution,
      friction: mat.friction,
      density: mat.density * customMassMult, // 🚀 NEW: Apply custom mass multiplier
      render: { fillStyle: mat.color }
    };

    let newBody;
    if (customShape === 'circle') {
      newBody = Bodies.circle(startX, startY, customSize, options);
    } else if (customShape === 'square') {
      newBody = Bodies.rectangle(startX, startY, customSize * 2, customSize * 2, options);
    } else if (customShape === 'triangle') {
      newBody = Bodies.polygon(startX, startY, 3, customSize * 1.2, options);
    }

    if (newBody) World.add(engineRef.current.world, newBody);
  };

  const changeGravity = (type) => {
    if (!engineRef.current) return;
    setGravityType(type);
    if (type === 'Earth') engineRef.current.gravity.y = 1;
    if (type === 'Moon') engineRef.current.gravity.y = 0.16;
    if (type === 'Jupiter') engineRef.current.gravity.y = 2.4;
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
        
        {/* Main Controller Panel */}
        <div className={`bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl pointer-events-auto w-full transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-w-xs p-4' : 'max-w-md p-6'}`}>
          
          {/* Header & Window Controls */}
          <div className={`flex items-center justify-between ${isMinimized ? '' : 'mb-4 pb-4 border-b border-slate-800'}`}>
            <div className="flex items-center gap-2">
              {!isMinimized && (
                <button onClick={() => setLesson(Math.max(1, lesson - 1))} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-30 transition">
                  <ChevronLeft className="w-4 h-4"/>
                </button>
              )}
              
              <Activity className="text-cyan-400 w-5 h-5"/>
              <h1 className="text-lg font-bold text-white whitespace-nowrap">
                {isMinimized ? `Lesson ${lesson}` : `Lesson ${lesson}: ${lesson === 1 ? 'Restitution' : lesson === 2 ? 'Friction' : 'Gravity'}`}
              </h1>

              {!isMinimized && (
                <button onClick={() => setLesson(Math.min(3, lesson + 1))} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-30 transition">
                  <ChevronRight className="w-4 h-4"/>
                </button>
              )}
            </div>

            {/* Minimize/Maximize Toggle */}
            <button 
              onClick={() => setIsMinimized(!isMinimized)} 
              className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-lg transition"
              title={isMinimized ? "Expand Menu" : "Minimize Menu"}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Menu Content (Hidden when minimized) */}
          {!isMinimized && (
            <>
              {/* Standard Lesson Controls */}
              <div className="mb-6">
                {lesson === 1 && (
                  <div className="space-y-4 animate-in fade-in">
                    <p className="text-slate-400 text-sm">Drop objects to see how different materials retain kinetic energy when they bounce.</p>
                    <div className="flex gap-2">
                      <button onClick={() => spawnObject('rubber')} className="px-3 py-2 bg-cyan-900/50 text-cyan-300 rounded-lg text-sm border border-cyan-800 hover:bg-cyan-800 transition">Rubber Ball</button>
                      <button onClick={() => spawnObject('bowling')} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm border border-slate-700 hover:bg-slate-700 transition">Bowling Ball</button>
                    </div>
                  </div>
                )}
                {lesson === 2 && (
                  <div className="space-y-4 animate-in fade-in">
                    <p className="text-slate-400 text-sm">Friction resists sliding motion. Drop these blocks on the ramp to test their slip factor.</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => spawnObject('ice')} className="px-3 py-2 bg-sky-900/50 text-sky-300 rounded-lg text-sm border border-sky-800 hover:bg-sky-800 transition">Ice</button>
                      <button onClick={() => spawnObject('wood')} className="px-3 py-2 bg-amber-900/50 text-amber-300 rounded-lg text-sm border border-amber-800 hover:bg-amber-800 transition">Wood</button>
                      <button onClick={() => spawnObject('rubber-block')} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm border border-slate-700 hover:bg-slate-700 transition">Rubber</button>
                    </div>
                  </div>
                )}
                {lesson === 3 && (
                  <div className="space-y-4 animate-in fade-in">
                    <p className="text-slate-400 text-sm">Change the planet to see how acceleration changes the fall rate!</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => changeGravity('Earth')} className={`px-3 py-2 rounded-lg text-sm border transition ${gravityType === 'Earth' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>Earth (1G)</button>
                      <button onClick={() => changeGravity('Moon')} className={`px-3 py-2 rounded-lg text-sm border transition ${gravityType === 'Moon' ? 'bg-slate-300 text-slate-900 border-slate-400' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>Moon (0.16G)</button>
                      <button onClick={() => changeGravity('Jupiter')} className={`px-3 py-2 rounded-lg text-sm border transition ${gravityType === 'Jupiter' ? 'bg-orange-700 text-white border-orange-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>Jupiter (2.4G)</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Object Forge UI */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <button 
                  onClick={() => setShowCustomizer(!showCustomizer)}
                  className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium transition w-full"
                >
                  <Settings className="w-4 h-4" /> 
                  {showCustomizer ? 'Hide Object Forge' : 'Open Object Forge'}
                </button>

                {showCustomizer && (
                  <div className="mt-4 space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800 animate-in slide-in-from-top-2">
                    
                    {/* Shape Selector */}
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Shape</label>
                      <div className="flex gap-2">
                        {['circle', 'square', 'triangle'].map(shape => (
                          <button 
                            key={shape} 
                            onClick={() => setCustomShape(shape)}
                            className={`capitalize flex-1 py-1.5 text-xs rounded-md border transition-colors ${customShape === shape ? 'bg-cyan-900/50 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                          >
                            {shape}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Material Selector */}
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Material</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.keys(materials).map(matKey => (
                          <button 
                            key={matKey} 
                            onClick={() => setCustomMaterial(matKey)}
                            className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md border transition ${customMaterial === matKey ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-800 text-slate-400'}`}
                          >
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: materials[matKey].color }}></span>
                            {materials[matKey].name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dimensions & Mass Multiplier Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Size Slider */}
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                          <span>Size</span>
                          <span className="text-cyan-400">{customSize}px</span>
                        </label>
                        <input 
                          type="range" 
                          min="15" 
                          max="80" 
                          value={customSize} 
                          onChange={(e) => setCustomSize(Number(e.target.value))}
                          className="w-full accent-cyan-500"
                        />
                      </div>
                      
                      {/* Mass Multiplier Slider */}
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                          <span>Mass</span>
                          <span className="text-indigo-400">{customMassMult}x</span>
                        </label>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="10" 
                          step="0.1"
                          value={customMassMult} 
                          onChange={(e) => setCustomMassMult(Number(e.target.value))}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Spawn Button */}
                    <button 
                      onClick={spawnCustomObject}
                      className="w-full flex justify-center items-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg transition"
                    >
                      <Hammer className="w-4 h-4" /> Forge Object
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div ref={sceneRef} className="absolute inset-0 z-10" />

      {/* Clear Lab Button */}
      <button onClick={clearLab} className="absolute bottom-8 right-8 z-30 flex items-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg transition-all">
        <RefreshCw className="w-4 h-4"/> Clear Lab
      </button>

    </main>
  );
}