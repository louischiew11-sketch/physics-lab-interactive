'use client';

import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import Link from 'next/link'; // Added for the Home button
import { RefreshCw, Activity, ChevronRight, ChevronLeft, Settings, Hammer, Minimize2, Maximize2, Home } from 'lucide-react'; // Added Home icon

export default function Lab() {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [lesson, setLesson] = useState(1);
  const [gravityType, setGravityType] = useState('Earth');

  // Customizer State
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customShape, setCustomShape] = useState('circle');
  const [customMaterial, setCustomMaterial] = useState('wood');
  const [customSize, setCustomSize] = useState(40);
  const [customMassMult, setCustomMassMult] = useState(1);

  const materials = {
    rubber: { restitution: 0.95, friction: 0.1, density: 0.01, color: '#22d3ee', name: 'Rubber' },
    wood: { restitution: 0.4, friction: 0.4, density: 0.04, color: '#d97706', name: 'Wood' },
    metal: { restitution: 0.1, friction: 0.2, density: 0.1, color: '#94a3b8', name: 'Metal' },
    ice: { restitution: 0.2, friction: 0.001, density: 0.02, color: '#bae6fd', name: 'Ice' }
  };

  useEffect(() => {
    const { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint, Composites, Constraint } = Matter;

    const engine = Engine.create({ positionIterations: 12, velocityIterations: 12 });
    engineRef.current = engine;

    // Fixed canvas height since the header is gone now
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

    const buildEnvironment = () => {
      engine.gravity.y = 1; 
      setGravityType('Earth');

      if (lesson === 2) {
        World.add(engine.world, Bodies.rectangle(width / 2, height / 2 + 100, width * 0.8, 40, { isStatic: true, angle: Math.PI / 8, render: { fillStyle: '#334155' } }));
      }
      if (lesson === 5) {
        const cradle = Composites.newtonsCradle(width / 2 - 100, 100, 5, 20, 200);
        World.add(engine.world, cradle);
      }
      if (lesson === 6) {
        const pyramid = Composites.pyramid(width / 2, height - 300, 9, 10, 0, 0, (x, y) => Bodies.rectangle(x, y, 30, 30, { render: { fillStyle: '#d97706' } }));
        World.add(engine.world, pyramid);
      }
      if (lesson === 7) {
        const anchor = { x: width / 2, y: 300 };
        const ball = Bodies.circle(anchor.x, anchor.y + 100, 30, { render: { fillStyle: '#f43f5e' } });
        const spring = Constraint.create({ pointA: anchor, bodyB: ball, stiffness: 0.05, render: { strokeStyle: '#64748b' } });
        World.add(engine.world, [ball, spring]);
      }
      if (lesson === 8) {
        const group = Matter.Body.nextGroup(true);
        const bridge = Composites.stack(width * 0.2, height * 0.4, 10, 1, 0, 0, (x, y) => 
          Bodies.rectangle(x, y, 50, 20, { collisionFilter: { group: group }, render: { fillStyle: '#64748b' } })
        );
        Composites.chain(bridge, 0.5, 0, -0.5, 0, { stiffness: 0.9, length: 2, render: { visible: false } });
        World.add(engine.world, [
          bridge,
          Constraint.create({ pointA: { x: width * 0.2, y: height * 0.4 }, bodyB: bridge.bodies[0], pointB: { x: -25, y: 0 }, stiffness: 0.9 }),
          Constraint.create({ pointA: { x: width * 0.8, y: height * 0.4 }, bodyB: bridge.bodies[bridge.bodies.length - 1], pointB: { x: 25, y: 0 }, stiffness: 0.9 })
        ]);
      }
      if (lesson === 9) {
        const softBody = Composites.softBody(width / 2, 100, 5, 5, 0, 0, true, 18, { render: { fillStyle: '#10b981' } });
        World.add(engine.world, softBody);
      }
      if (lesson === 10) {
        World.add(engine.world, [
          Bodies.rectangle(width / 2 - 150, height / 2, 300, 20, { isStatic: true, angle: Math.PI / 6, render: { fillStyle: '#334155' } }),
          Bodies.rectangle(width / 2 + 150, height / 2, 300, 20, { isStatic: true, angle: -Math.PI / 6, render: { fillStyle: '#334155' } })
        ]);
      }
    };

    buildEnvironment();

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
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

  const spawn = (type) => {
    if (!engineRef.current) return;
    const { Bodies, World } = Matter;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2 + (Math.random() * 50 - 25);
    
    let newBody;

    switch(type) {
      case 'rubber': newBody = Bodies.circle(cx, 100, 40, { restitution: 0.95, render: { fillStyle: '#22d3ee' } }); break;
      case 'bowling': newBody = Bodies.circle(cx, 100, 50, { restitution: 0.1, density: 0.05, render: { fillStyle: '#475569' } }); break;
      case 'ice': newBody = Bodies.rectangle(w * 0.2, 100, 50, 50, { friction: 0.001, render: { fillStyle: '#bae6fd' } }); break;
      case 'wood': newBody = Bodies.rectangle(w * 0.2, 100, 50, 50, { friction: 0.4, render: { fillStyle: '#d97706' } }); break;
      case 'feather': newBody = Bodies.circle(w * 0.4, 100, 30, { frictionAir: 0.1, density: 0.001, render: { fillStyle: '#f8fafc' } }); break;
      case 'iron': newBody = Bodies.circle(w * 0.6, 100, 30, { frictionAir: 0.001, density: 0.05, render: { fillStyle: '#334155' } }); break;
      case 'wrecking-ball': newBody = Bodies.circle(w * 0.3, h * 0.3, 60, { density: 0.1, restitution: 0.1, render: { fillStyle: '#1e293b' } }); break;
      case 'heavy-box': newBody = Bodies.rectangle(cx, 50, 60, 60, { density: 0.08, render: { fillStyle: '#9333ea' } }); break;
      case 'particles': 
        for(let i=0; i<30; i++) World.add(engineRef.current.world, Bodies.circle(cx + (Math.random()*100-50), 50, 8, { render: { fillStyle: '#eab308' } }));
        break;
      case 'custom':
        const mat = materials[customMaterial];
        const options = { restitution: mat.restitution, friction: mat.friction, density: mat.density * customMassMult, render: { fillStyle: mat.color } };
        const startX = lesson === 2 ? w * 0.2 : cx;
        if (customShape === 'circle') newBody = Bodies.circle(startX, 100, customSize, options);
        else if (customShape === 'square') newBody = Bodies.rectangle(startX, 100, customSize * 2, customSize * 2, options);
        else if (customShape === 'triangle') newBody = Bodies.polygon(startX, 100, 3, customSize * 1.2, options);
        break;
    }
    if (newBody) World.add(engineRef.current.world, newBody);
  };

  const changeGravity = (type) => {
    if (!engineRef.current) return;
    setGravityType(type);
    engineRef.current.gravity.y = type === 'Earth' ? 1 : type === 'Moon' ? 0.16 : 2.4;
  };

  const clearLab = () => {
    if (!engineRef.current) return;
    const dynamicBodies = engineRef.current.world.bodies.filter(b => !b.isStatic);
    const composites = engineRef.current.world.composites;
    const constraints = engineRef.current.world.constraints;
    Matter.World.remove(engineRef.current.world, [...dynamicBodies, ...composites, ...constraints]);
    setLesson(lesson);
  };

  const lessonData = {
    1: { title: 'Restitution', desc: 'Observe kinetic energy retention (bounciness).', buttons: [{ label: 'Rubber', action: () => spawn('rubber') }, { label: 'Bowling', action: () => spawn('bowling') }] },
    2: { title: 'Friction', desc: 'Friction resists sliding. Drop blocks on the ramp.', buttons: [{ label: 'Ice', action: () => spawn('ice') }, { label: 'Wood', action: () => spawn('wood') }] },
    3: { title: 'Gravity', desc: 'Change planetary mass.', isGravity: true },
    4: { title: 'Air Resistance', desc: 'Drag affects falling speed regardless of mass.', buttons: [{ label: 'Feather', action: () => spawn('feather') }, { label: 'Iron Ball', action: () => spawn('iron') }] },
    5: { title: 'Momentum', desc: 'Conservation of momentum. Drag the end ball of the Cradle and drop it!', buttons: [] },
    6: { title: 'Kinetics', desc: 'Transfer massive force into a stable structure.', buttons: [{ label: 'Drop Wrecking Ball', action: () => spawn('wrecking-ball') }] },
    7: { title: 'Elasticity', desc: 'Springs & Constraints. Drag the ball and release it to slingshot it.', buttons: [{ label: 'Drop Heavy Box', action: () => spawn('heavy-box') }] },
    8: { title: 'Tension', desc: 'Suspension bridge held by constraints.', buttons: [{ label: 'Drop Heavy Box', action: () => spawn('heavy-box') }] },
    9: { title: 'Soft Bodies', desc: 'Deformable composite structures.', buttons: [{ label: 'Drop Heavy Box', action: () => spawn('heavy-box') }] },
    10: { title: 'Granular Flow', desc: 'Thousands of particles acting like fluid.', buttons: [{ label: 'Spawn 30 Particles', action: () => spawn('particles') }] },
  };

  const currentLesson = lessonData[lesson];

  return (
    <div className="relative h-screen w-full overflow-hidden">
      
      {/* HUD Menu */}
      <div className="absolute top-6 left-6 z-30 pointer-events-none flex justify-between items-start max-h-[85vh] overflow-y-auto custom-scrollbar">
        <div className={`bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl pointer-events-auto w-full transition-all duration-300 ease-in-out ${isMinimized ? 'max-w-xs p-4' : 'max-w-sm p-6'}`}>
          
          <div className={`flex items-center justify-between ${isMinimized ? '' : 'mb-4 pb-4 border-b border-slate-800'}`}>
            <div className="flex items-center gap-2">
              
              {/* NEW: Home Button */}
              {!isMinimized && (
                <Link href="/" className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-lg transition mr-1" title="Back to Home">
                  <Home className="w-4 h-4" />
                </Link>
              )}

              {!isMinimized && <button onClick={() => setLesson(Math.max(1, lesson - 1))} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg disabled:opacity-30 transition"><ChevronLeft className="w-4 h-4"/></button>}
              <Activity className="text-cyan-400 w-5 h-5"/>
              <h1 className="text-lg font-bold text-white whitespace-nowrap">
                {isMinimized ? `L${lesson}` : `Lesson ${lesson}: ${currentLesson.title}`}
              </h1>
              {!isMinimized && <button onClick={() => setLesson(Math.min(10, lesson + 1))} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg disabled:opacity-30 transition"><ChevronRight className="w-4 h-4"/></button>}
            </div>
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg transition">
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </div>
          
          {!isMinimized && (
            <div className="animate-in fade-in">
              <p className="text-slate-400 text-sm mb-4">{currentLesson.desc}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                
                {/* BUG FIX: Added ?. before map to prevent crashing if buttons array is missing */}
                {currentLesson.buttons?.map((btn, i) => (
                  <button key={i} onClick={btn.action} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition">
                    {btn.label}
                  </button>
                ))}
                
                {currentLesson.isGravity && (
                  <>
                    <button onClick={() => changeGravity('Earth')} className={`px-3 py-2 rounded-lg text-sm border ${gravityType === 'Earth' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Earth</button>
                    <button onClick={() => changeGravity('Moon')} className={`px-3 py-2 rounded-lg text-sm border ${gravityType === 'Moon' ? 'bg-slate-300 text-slate-900' : 'bg-slate-800 text-slate-400'}`}>Moon</button>
                    <button onClick={() => changeGravity('Jupiter')} className={`px-3 py-2 rounded-lg text-sm border ${gravityType === 'Jupiter' ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-400'}`}>Jupiter</button>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button onClick={() => setShowCustomizer(!showCustomizer)} className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 text-sm font-medium transition w-full">
                  <Settings className="w-4 h-4" /> {showCustomizer ? 'Close Forge' : 'Open Forge'}
                </button>
                
                {showCustomizer && (
                  <div className="mt-4 space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 block mb-2">SHAPE</label>
                        <select onChange={e => setCustomShape(e.target.value)} className="w-full bg-slate-800 text-xs p-2 rounded-md border border-slate-700">
                          <option value="circle">Circle</option><option value="square">Square</option><option value="triangle">Triangle</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-2">MATERIAL</label>
                        <select onChange={e => setCustomMaterial(e.target.value)} className="w-full bg-slate-800 text-xs p-2 rounded-md border border-slate-700">
                          <option value="wood">Wood</option><option value="metal">Metal</option><option value="rubber">Rubber</option><option value="ice">Ice</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 flex justify-between mb-1"><span>SIZE</span><span>{customSize}px</span></label>
                        <input type="range" min="15" max="80" value={customSize} onChange={e => setCustomSize(Number(e.target.value))} className="w-full accent-cyan-500"/>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 flex justify-between mb-1"><span>MASS</span><span>{customMassMult}x</span></label>
                        <input type="range" min="0.1" max="10" step="0.1" value={customMassMult} onChange={e => setCustomMassMult(Number(e.target.value))} className="w-full accent-indigo-500"/>
                      </div>
                    </div>
                    <button onClick={() => spawn('custom')} className="w-full flex justify-center items-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition">
                      <Hammer className="w-4 h-4" /> Forge
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div ref={sceneRef} className="absolute inset-0 z-10" />

      <button onClick={clearLab} className="absolute bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl shadow-lg backdrop-blur-md transition-all">
        <RefreshCw className="w-4 h-4"/> Reset
      </button>

    </div>
  );
}