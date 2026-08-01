'use client';

import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import Link from 'next/link';
import { RefreshCw, Activity, ChevronRight, ChevronLeft, Settings, Hammer, Minimize2, Maximize2, Home, Lightbulb, CheckCircle2, XCircle, ZoomIn, ZoomOut } from 'lucide-react';

// Define a fixed logical world size so the physics behaves exactly the same on all devices
const WORLD_W = 1200;
const WORLD_H = 800;

export default function Lab() {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const mouseRef = useRef(null);
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [lesson, setLesson] = useState(1);
  const [gravityType, setGravityType] = useState('Earth');
  const [resetTrigger, setResetTrigger] = useState(0);
  const [zoom, setZoom] = useState(1); // 🚀 NEW: Camera zoom state

  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customShape, setCustomShape] = useState('circle');
  const [customMaterial, setCustomMaterial] = useState('wood');
  const [customSize, setCustomSize] = useState(40);
  const [customMassMult, setCustomMassMult] = useState(1);

  const [showQuiz, setShowQuiz] = useState(false);
  const [quizState, setQuizState] = useState('idle');
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) setIsMinimized(true);
  }, []);

  useEffect(() => {
    setShowQuiz(false);
    setQuizState('idle');
    setSelectedAnswer(null);
  }, [lesson]);

  const materials = {
    rubber: { restitution: 0.95, friction: 0.1, density: 0.01, color: '#22d3ee', name: 'Rubber' },
    wood: { restitution: 0.4, friction: 0.4, density: 0.04, color: '#d97706', name: 'Wood' },
    metal: { restitution: 0.1, friction: 0.2, density: 0.1, color: '#94a3b8', name: 'Metal' },
    ice: { restitution: 0.2, friction: 0.001, density: 0.02, color: '#bae6fd', name: 'Ice' }
  };

  // 🚀 FIX: Camera viewport updating function to scale the logical world into the screen
  const applyCameraView = () => {
    if (!renderRef.current || !mouseRef.current) return;
    const render = renderRef.current;
    const mouse = mouseRef.current;
    
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
    render.options.width = window.innerWidth;
    render.options.height = window.innerHeight;

    const scaleX = window.innerWidth / WORLD_W;
    const scaleY = window.innerHeight / WORLD_H;
    
    // Scale down if on mobile so the whole logical world fits. Multiplied by zoom state!
    const baseScale = Math.min(scaleX, scaleY) * 0.95; 
    const finalScale = baseScale * zoom;

    const visibleW = window.innerWidth / finalScale;
    const visibleH = window.innerHeight / finalScale;

    // Center the camera on the logical world
    render.bounds.min.x = (WORLD_W - visibleW) / 2;
    render.bounds.max.x = render.bounds.min.x + visibleW;
    render.bounds.min.y = (WORLD_H - visibleH) / 2;
    render.bounds.max.y = render.bounds.min.y + visibleH;

    // IMPORTANT: Sync the mouse constraints with the new scaled viewport!
    Matter.Mouse.setScale(mouse, { x: 1 / finalScale, y: 1 / finalScale });
    Matter.Mouse.setOffset(mouse, render.bounds.min);
  };

  // Main Physics Engine Setup
  useEffect(() => {
    const { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint, Composites, Constraint } = Matter;
    
    // Position iterations increased, and sleeping disabled to stop balls from randomly stopping
    const engine = Engine.create({ positionIterations: 16, velocityIterations: 16, enableSleeping: false });
    engineRef.current = engine;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: { 
        width: window.innerWidth, 
        height: window.innerHeight, 
        wireframes: false, 
        background: 'transparent',
        hasBounds: true // 🚀 Required to enable zooming and panning!
      }
    });
    renderRef.current = render;

    // Use logical bounds (WORLD_W, WORLD_H) for environment boundaries instead of device screen
    const ground = Bodies.rectangle(WORLD_W / 2, WORLD_H + 100, WORLD_W * 3, 250, { isStatic: true, render: { fillStyle: '#1e293b' } });
    const leftWall = Bodies.rectangle(-100, WORLD_H / 2, 200, WORLD_H * 3, { isStatic: true, render: { fillStyle: '#1e293b' } });
    const rightWall = Bodies.rectangle(WORLD_W + 100, WORLD_H / 2, 200, WORLD_H * 3, { isStatic: true, render: { fillStyle: '#1e293b' } });
    World.add(engine.world, [ground, leftWall, rightWall]);

    const buildEnvironment = () => {
      engine.gravity.y = 1; 
      setGravityType('Earth');

      if (lesson === 2) {
        // 🚀 FIX: Ghost Collision fixed by adding 15px chamfer (rounded corners) and 0 static friction to the slope!
        World.add(engine.world, Bodies.rectangle(WORLD_W / 2, WORLD_H / 2 + 100, WORLD_W * 0.8, 40, { 
          isStatic: true, angle: Math.PI / 8, friction: 0, frictionStatic: 0, chamfer: { radius: 15 }, render: { fillStyle: '#334155' } 
        }));
      }
      if (lesson === 5) {
        const cradle = Composites.newtonsCradle(WORLD_W / 2 - 100, 100, 5, 20, 200);
        World.add(engine.world, cradle);
      }
      if (lesson === 6) {
        const pyramid = Composites.pyramid(WORLD_W / 2, WORLD_H - 300, 9, 10, 0, 0, (x, y) => Bodies.rectangle(x, y, 30, 30, { render: { fillStyle: '#d97706' } }));
        World.add(engine.world, pyramid);
      }
      if (lesson === 7) {
        const anchor = { x: WORLD_W / 2, y: 300 };
        const ball = Bodies.circle(anchor.x, anchor.y + 100, 30, { render: { fillStyle: '#f43f5e' } });
        const spring = Constraint.create({ pointA: anchor, bodyB: ball, stiffness: 0.05, render: { strokeStyle: '#64748b' } });
        World.add(engine.world, [ball, spring]);
      }
      if (lesson === 8) {
        const group = Matter.Body.nextGroup(true);
        const bridge = Composites.stack(WORLD_W * 0.2, WORLD_H * 0.4, 10, 1, 0, 0, (x, y) => Bodies.rectangle(x, y, 50, 25, { collisionFilter: { group: group }, density: 0.05, render: { fillStyle: '#64748b' } }));
        Composites.chain(bridge, 0.5, 0, -0.5, 0, { stiffness: 0.9, length: 2, render: { visible: false } });
        World.add(engine.world, [
          bridge,
          Constraint.create({ pointA: { x: WORLD_W * 0.2, y: WORLD_H * 0.4 }, bodyB: bridge.bodies[0], pointB: { x: -25, y: 0 }, stiffness: 0.9 }),
          Constraint.create({ pointA: { x: WORLD_W * 0.8, y: WORLD_H * 0.4 }, bodyB: bridge.bodies[bridge.bodies.length - 1], pointB: { x: 25, y: 0 }, stiffness: 0.9 })
        ]);
      }
      if (lesson === 9) {
        const softBody = Composites.softBody(WORLD_W / 2, 100, 5, 5, 2, 2, true, 16, { restitution: 0.5, friction: 0.05, render: { fillStyle: '#10b981' } });
        World.add(engine.world, softBody);
      }
      if (lesson === 10) {
        World.add(engine.world, [
          Bodies.rectangle(WORLD_W / 2 - 150, WORLD_H / 2 + 100, 400, 40, { isStatic: true, angle: Math.PI / 6, chamfer: { radius: 15 }, frictionStatic: 0, render: { fillStyle: '#334155' } }),
          Bodies.rectangle(WORLD_W / 2 + 150, WORLD_H / 2 + 100, 400, 40, { isStatic: true, angle: -Math.PI / 6, chamfer: { radius: 15 }, frictionStatic: 0, render: { fillStyle: '#334155' } })
        ]);
      }
    };

    buildEnvironment();

    const mouse = Mouse.create(render.canvas);
    mouseRef.current = mouse;
    const mouseConstraint = MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
    World.add(engine.world, mouseConstraint);

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Apply scaling immediately and on window resize
    applyCameraView();
    const handleResize = () => applyCameraView();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      Render.stop(render);
      Runner.stop(runner);
      World.clear(engine.world);
      Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
    };
  }, [lesson, resetTrigger]); 

  // Re-apply zoom scale when the zoom state updates
  useEffect(() => {
    applyCameraView();
  }, [zoom]);

  const spawn = (type) => {
    if (!engineRef.current) return;
    const { Bodies, World } = Matter;
    const cx = WORLD_W / 2 + (Math.random() * 50 - 25);
    let newBody;

    switch(type) {
      case 'rubber': newBody = Bodies.circle(cx, 100, 40, { restitution: 0.95, frictionStatic: 0, friction: 0.001, render: { fillStyle: '#22d3ee' } }); break;
      case 'bowling': newBody = Bodies.circle(cx, 100, 50, { restitution: 0.1, density: 0.05, frictionStatic: 0, render: { fillStyle: '#475569' } }); break;
      case 'ice': 
        newBody = Bodies.rectangle(WORLD_W * 0.2, 100, 50, 50, { friction: 0, frictionStatic: 0, inertia: Infinity, render: { fillStyle: '#bae6fd' } }); break;
      case 'wood': 
        newBody = Bodies.rectangle(WORLD_W * 0.2, 100, 50, 50, { friction: 0.5, frictionStatic: 0.2, chamfer: { radius: 4 }, render: { fillStyle: '#d97706' } }); break;
      case 'feather': newBody = Bodies.circle(WORLD_W * 0.4, 100, 30, { frictionAir: 0.1, density: 0.001, render: { fillStyle: '#f8fafc' } }); break;
      case 'iron': newBody = Bodies.circle(WORLD_W * 0.6, 100, 30, { frictionAir: 0.001, density: 0.05, render: { fillStyle: '#334155' } }); break;
      case 'wrecking-ball': newBody = Bodies.circle(WORLD_W * 0.3, WORLD_H * 0.3, 60, { density: 0.1, restitution: 0.1, render: { fillStyle: '#1e293b' } }); break;
      case 'heavy-box': newBody = Bodies.rectangle(cx, 50, 60, 60, { density: 0.1, frictionAir: 0.01, chamfer: { radius: 4 }, render: { fillStyle: '#9333ea' } }); break;
      case 'particles': 
        for(let i=0; i<30; i++) World.add(engineRef.current.world, Bodies.circle(cx + (Math.random()*100-50), 50, 8, { render: { fillStyle: '#eab308' } }));
        break;
      case 'custom':
        const mat = materials[customMaterial];
        const options = { restitution: mat.restitution, friction: mat.friction, frictionStatic: 0, density: mat.density * customMassMult, render: { fillStyle: mat.color } };
        const startX = lesson === 2 ? WORLD_W * 0.2 : cx;
        if (customShape === 'circle') newBody = Bodies.circle(startX, 100, customSize, options);
        else if (customShape === 'square') newBody = Bodies.rectangle(startX, 100, customSize * 2, customSize * 2, { ...options, chamfer: { radius: 4 } });
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

  const clearLab = () => setResetTrigger(prev => prev + 1);

  const lessonData = {
    1: { title: 'Restitution', desc: 'Observe kinetic energy retention (bounciness).', buttons: [{ label: 'Rubber', action: () => spawn('rubber') }, { label: 'Bowling', action: () => spawn('bowling') }], quiz: { question: "Which material property determines how much kinetic energy is retained after a collision?", options: ["Density", "Restitution", "Friction", "Mass"], answer: 1, explanation: "Restitution (bounciness) measures how much kinetic energy remains after an impact." } },
    2: { title: 'Friction', desc: 'Friction resists sliding.', buttons: [{ label: 'Ice', action: () => spawn('ice') }, { label: 'Wood', action: () => spawn('wood') }], quiz: { question: "What force resists the blocks as they slide down the ramp?", options: ["Momentum", "Tension", "Gravity", "Friction"], answer: 3, explanation: "Friction is the resistance that one surface or object encounters when moving over another." } },
    3: { title: 'Gravity', desc: 'Change planetary mass.', isGravity: true, quiz: { question: "If you drop an object on Jupiter, why does it fall faster than on Earth?", options: ["Higher planetary mass creates stronger gravity", "It has no air resistance", "Magnetic pull", "The distance is shorter"], answer: 0, explanation: "Gravity is determined by mass. Jupiter is massive, pulling objects down much faster." } },
    4: { title: 'Air Resistance', desc: 'Drag affects falling speed.', buttons: [{ label: 'Feather', action: () => spawn('feather') }, { label: 'Iron Ball', action: () => spawn('iron') }], quiz: { question: "Why does the feather fall slower than the iron ball on Earth?", options: ["It has less mass", "Air resistance pushes against its large surface area", "Gravity pulls it less", "It has lower restitution"], answer: 1, explanation: "In a vacuum, they fall at the same speed! On Earth, the feather catches the air, creating drag." } },
    5: { title: 'Momentum', desc: 'Conservation of momentum. Drag the end ball!', buttons: [], quiz: { question: "In a Newton's Cradle, what principle causes the ball on the opposite end to swing out?", options: ["Conservation of Momentum", "Friction", "Air Resistance", "Tension"], answer: 0, explanation: "The energy transfers cleanly through the stationary balls until it reaches the end, conserving the momentum!" } },
    6: { title: 'Kinetics', desc: 'Transfer massive force into a structure.', buttons: [{ label: 'Drop Wrecking Ball', action: () => spawn('wrecking-ball') }], quiz: { question: "When the wrecking ball hits the pyramid, where does its kinetic energy go?", options: ["It vanishes", "It turns into gravity", "It transfers into the blocks", "It increases the ball's mass"], answer: 2, explanation: "Energy cannot be destroyed! The kinetic energy transfers directly into the lighter blocks." } },
    7: { title: 'Elasticity', desc: 'Springs & Constraints. Drag to slingshot.', buttons: [{ label: 'Drop Heavy Box', action: () => spawn('heavy-box') }], quiz: { question: "What provides the restorative force that pulls the ball back?", options: ["Gravity", "Friction", "Restitution", "Elastic Tension"], answer: 3, explanation: "The constraint acts like a spring, converting potential energy back to kinetic energy!" } },
    8: { title: 'Tension', desc: 'Suspension bridge held by constraints.', buttons: [{ label: 'Drop Heavy Box', action: () => spawn('heavy-box') }], quiz: { question: "Which force primarily keeps the bridge from collapsing?", options: ["Compression", "Tension from the chains", "Friction", "Restitution"], answer: 1, explanation: "The bridge is held up by tension—a pulling force acting along the invisible constraints." } },
    9: { title: 'Soft Bodies', desc: 'Deformable composite structures.', buttons: [{ label: 'Drop Heavy Box', action: () => spawn('heavy-box') }], quiz: { question: "Why doesn't the soft-body Jello block shatter upon impact?", options: ["Flexible springs absorb the energy", "It has zero mass", "It ignores gravity", "High friction"], answer: 0, explanation: "The elastic springs stretch and deform to absorb the impact energy gracefully." } },
    10: { title: 'Granular Flow', desc: 'Particles acting like fluid.', buttons: [{ label: 'Spawn 30 Particles', action: () => spawn('particles') }], quiz: { question: "How do large amounts of small, solid particles behave when poured?", options: ["Like a solid block", "Like a fluid", "They float away", "They bounce perfectly"], answer: 1, explanation: "When thousands of tiny rigid bodies interact, their collective movement simulates fluid dynamics!" } },
  };

  const currentLesson = lessonData[lesson];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-950">
      
      {showQuiz && currentLesson.quiz && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" /> Knowledge Check
              </h2>
              <button onClick={() => setShowQuiz(false)} className="text-slate-400 hover:text-white transition">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">{currentLesson.quiz.question}</p>
            <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
              {currentLesson.quiz.options.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === currentLesson.quiz.answer;
                let btnClass = "w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-200 ";
                if (quizState === 'idle') {
                  btnClass += "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white";
                } else {
                  if (isCorrect) btnClass += "border-emerald-500 bg-emerald-900/30 text-emerald-400";
                  else if (isSelected && !isCorrect) btnClass += "border-rose-500 bg-rose-900/30 text-rose-400";
                  else btnClass += "border-slate-800 bg-slate-900/50 text-slate-500 opacity-50";
                }
                return (
                  <button key={idx} disabled={quizState !== 'idle'} onClick={() => { setSelectedAnswer(idx); setQuizState(isCorrect ? 'correct' : 'incorrect'); }} className={btnClass}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {quizState !== 'idle' && (
              <div className={`p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-bottom-2 ${quizState === 'correct' ? 'bg-emerald-900/20 border border-emerald-800/50' : 'bg-rose-900/20 border border-rose-800/50'}`}>
                {quizState === 'correct' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                <div>
                  <h4 className={`font-bold mb-1 ${quizState === 'correct' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {quizState === 'correct' ? 'Correct!' : 'Not quite!'}
                  </h4>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{currentLesson.quiz.explanation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main UI Menu */}
      <div className="absolute top-4 left-4 right-4 sm:right-auto sm:left-6 sm:top-6 z-30 pointer-events-none flex justify-between items-start max-h-[60vh] sm:max-h-[85vh] overflow-y-auto custom-scrollbar max-w-[calc(100vw-32px)]">
        <div className={`bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl pointer-events-auto transition-all duration-300 ease-in-out ${isMinimized ? 'w-fit p-3 sm:p-4' : 'w-full sm:w-fit min-w-[280px] sm:max-w-md p-4 sm:p-6'}`}>
          <div className={`flex items-center justify-between gap-4 ${isMinimized ? '' : 'mb-4 pb-4 border-b border-slate-800'}`}>
            <div className="flex items-center gap-2">
              {!isMinimized && (
                <Link href="/" className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-lg transition mr-1" title="Back to Home">
                  <Home className="w-4 h-4" />
                </Link>
              )}
              {!isMinimized && <button onClick={() => setLesson(Math.max(1, lesson - 1))} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg disabled:opacity-30 transition"><ChevronLeft className="w-4 h-4"/></button>}
              <Activity className="text-cyan-400 w-5 h-5 hidden sm:block"/>
              <h1 className="text-base sm:text-lg font-bold text-white whitespace-nowrap">
                {isMinimized ? `L${lesson}` : `Lesson ${lesson}`}
              </h1>
              {!isMinimized && <button onClick={() => setLesson(Math.min(10, lesson + 1))} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg disabled:opacity-30 transition"><ChevronRight className="w-4 h-4"/></button>}
            </div>
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg transition">
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </div>
          
          {!isMinimized && (
            <div className="animate-in fade-in">
              <h2 className="text-cyan-400 font-semibold mb-1">{currentLesson.title}</h2>
              <p className="text-slate-400 text-sm mb-4">{currentLesson.desc}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
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

              {currentLesson.quiz && (
                <div className="pt-4 border-t border-slate-800 mb-4">
                  <button onClick={() => setShowQuiz(true)} className="w-full flex justify-center items-center gap-2 py-2.5 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-500 border border-yellow-700/50 rounded-lg text-sm font-semibold transition shadow-inner">
                    <Lightbulb className="w-4 h-4" /> Test Knowledge
                  </button>
                </div>
              )}

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

      <div ref={sceneRef} className="absolute inset-0 z-10 touch-none" />

      {/* 🚀 NEW: Camera Zoom Controls + Reset Button grouped nicely! */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex flex-col sm:flex-row items-end sm:items-center gap-3">
        <div className="flex bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-800 overflow-hidden">
          <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 transition border-r border-slate-700">
            <ZoomOut className="w-5 h-5" />
          </button>
          <div className="px-3 flex items-center justify-center text-xs font-bold text-slate-400 min-w-[3rem]">
            {Math.round(zoom * 100)}%
          </div>
          <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 transition border-l border-slate-700">
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
        
        <button onClick={clearLab} className="flex items-center gap-2 px-4 py-3 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl shadow-lg backdrop-blur-md transition-all">
          <RefreshCw className="w-5 h-5"/> <span className="hidden sm:inline font-semibold">Reset</span>
        </button>
      </div>

    </div>
  );
}