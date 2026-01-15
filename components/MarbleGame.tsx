import React, { useRef, useEffect, useState } from 'react';
import { PhysicsBody, Obstacle } from '../types';
import { Play, RotateCcw, Trophy, Skull, Target, ArrowRight, Crosshair, HelpCircle, MousePointer2, Ban, X } from 'lucide-react';

// Types internal to the game
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface Hole {
    id: string;
    x: number;
    y: number;
    radius: number;
}

interface LevelConfig {
  name: string;
  description: string;
  shots: number;
  marbles: PhysicsBody[];
  obstacles: Obstacle[];
  holes: Hole[];
}

const PLAYER_START = { x: 400, y: 500 };
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// --- TRICKSHOT LEVEL DESIGNS ---
const LEVELS: LevelConfig[] = [
  {
    name: "Level 1: The Corner Pocket",
    description: "Knock the red marble into the corner pocket.",
    shots: 3,
    obstacles: [
        { id: 'w1', x: 200, y: 300, width: 400, height: 20, color: '#6366f1' } // Barrier
    ],
    holes: [
        { id: 'h1', x: 400, y: 100, radius: 30 } // Top Center
    ],
    marbles: [
      { id: 'm1', x: 400, y: 200, vx: 0, vy: 0, radius: 20, color: '#ff0055', mass: 1 },
    ]
  },
  {
    name: "Level 2: The Split",
    description: "Two targets, two pockets. Watch the bounce.",
    shots: 3,
    obstacles: [
       { id: 'c1', x: 380, y: 280, width: 40, height: 40, color: '#8b5cf6' } // Center block
    ],
    holes: [
        { id: 'h1', x: 200, y: 200, radius: 30 },
        { id: 'h2', x: 600, y: 200, radius: 30 }
    ],
    marbles: [
      { id: 'm1', x: 350, y: 350, vx: 0, vy: 0, radius: 18, color: '#ff0055', mass: 1 },
      { id: 'm2', x: 450, y: 350, vx: 0, vy: 0, radius: 18, color: '#ff0055', mass: 1 },
    ]
  },
  {
    name: "Level 3: The Bunker",
    description: "Bank off the walls to reach the target inside.",
    shots: 4,
    obstacles: [
      { id: 'w1', x: 300, y: 200, width: 20, height: 120, color: '#ec4899' }, // Left
      { id: 'w2', x: 480, y: 200, width: 20, height: 120, color: '#ec4899' }, // Right
      { id: 'w3', x: 300, y: 320, width: 200, height: 20, color: '#ec4899' }, // Bottom
    ],
    holes: [
        { id: 'h1', x: 400, y: 250, radius: 25 } // Inside the box
    ],
    marbles: [
      { id: 'm1', x: 400, y: 280, vx: 0, vy: 0, radius: 15, color: '#00ffaa', mass: 1 }, // Target inside
      { id: 'm2', x: 200, y: 150, vx: 0, vy: 0, radius: 15, color: '#ffcc00', mass: 1 }, // Blocker outside
    ]
  },
  {
    name: "Level 4: The Slalom",
    description: "Weave through the barriers to hit the top targets.",
    shots: 4,
    obstacles: [
      { id: 'w1', x: 150, y: 350, width: 200, height: 20, color: '#06b6d4' }, // Left barrier
      { id: 'w2', x: 450, y: 250, width: 200, height: 20, color: '#06b6d4' }, // Right barrier
      { id: 'w3', x: 150, y: 150, width: 200, height: 20, color: '#06b6d4' }, // Left barrier top
    ],
    holes: [
        { id: 'h1', x: 400, y: 80, radius: 30 },
        { id: 'h2', x: 600, y: 150, radius: 25 }
    ],
    marbles: [
      { id: 'm1', x: 500, y: 100, vx: 0, vy: 0, radius: 18, color: '#ff0055', mass: 1 },
      { id: 'm2', x: 250, y: 250, vx: 0, vy: 0, radius: 18, color: '#ff0055', mass: 1 },
    ]
  },
  {
    name: "Level 5: Needle Thread",
    description: "Precision is key. Shoot through the narrow gap.",
    shots: 3,
    obstacles: [
      { id: 'w1', x: 200, y: 300, width: 180, height: 40, color: '#f59e0b' },
      { id: 'w2', x: 420, y: 300, width: 180, height: 40, color: '#f59e0b' },
    ],
    holes: [
        { id: 'h1', x: 400, y: 150, radius: 25 }
    ],
    marbles: [
      { id: 'm1', x: 400, y: 200, vx: 0, vy: 0, radius: 15, color: '#ff0055', mass: 1 },
      // Blocker balls near the gap
      { id: 'b1', x: 370, y: 280, vx: 0, vy: 0, radius: 12, color: '#ffcc00', mass: 0.5 },
      { id: 'b2', x: 430, y: 280, vx: 0, vy: 0, radius: 12, color: '#ffcc00', mass: 0.5 },
    ]
  },
  {
      name: "Level 6: The Fortress",
      description: "Breach the walls. The target is heavily guarded.",
      shots: 5,
      obstacles: [
          // Box around center
          { id: 'w1', x: 300, y: 150, width: 200, height: 10, color: '#ef4444' }, // Top
          { id: 'w2', x: 300, y: 350, width: 200, height: 10, color: '#ef4444' }, // Bottom
          { id: 'w3', x: 300, y: 150, width: 10, height: 210, color: '#ef4444' }, // Left
          { id: 'w4', x: 490, y: 150, width: 10, height: 210, color: '#ef4444' }, // Right
          // Inner shield
          { id: 'w5', x: 380, y: 280, width: 40, height: 10, color: '#991b1b' }, 
      ],
      holes: [
          { id: 'h1', x: 400, y: 200, radius: 20 }, // Inside
          { id: 'h2', x: 200, y: 200, radius: 30 }, // Outside left
          { id: 'h3', x: 600, y: 200, radius: 30 }, // Outside right
      ],
      marbles: [
          { id: 'm1', x: 400, y: 250, vx: 0, vy: 0, radius: 15, color: '#ff0055', mass: 1 }, // Target
          { id: 'm2', x: 200, y: 250, vx: 0, vy: 0, radius: 18, color: '#ff0055', mass: 1 }, // Left target
          { id: 'm3', x: 600, y: 250, vx: 0, vy: 0, radius: 18, color: '#ff0055', mass: 1 }, // Right target
      ]
  },
  {
      name: "Level 7: Chaos Theory",
      description: "A field of debris. Luck favors the bold.",
      shots: 6,
      obstacles: [
          { id: 'b1', x: 300, y: 400, width: 30, height: 30, color: '#8b5cf6' },
          { id: 'b2', x: 470, y: 400, width: 30, height: 30, color: '#8b5cf6' },
          { id: 'b3', x: 385, y: 300, width: 30, height: 30, color: '#8b5cf6' },
          { id: 'b4', x: 250, y: 200, width: 30, height: 30, color: '#8b5cf6' },
          { id: 'b5', x: 520, y: 200, width: 30, height: 30, color: '#8b5cf6' },
      ],
      holes: [
           { id: 'h1', x: 400, y: 100, radius: 40 },
           { id: 'h2', x: 150, y: 300, radius: 30 },
           { id: 'h3', x: 650, y: 300, radius: 30 },
      ],
      marbles: [
          { id: 'm1', x: 350, y: 150, vx: 0, vy: 0, radius: 15, color: '#ff0055', mass: 1 },
          { id: 'm2', x: 450, y: 150, vx: 0, vy: 0, radius: 15, color: '#ff0055', mass: 1 },
          { id: 'm3', x: 200, y: 350, vx: 0, vy: 0, radius: 15, color: '#ff0055', mass: 1 },
          { id: 'm4', x: 600, y: 350, vx: 0, vy: 0, radius: 15, color: '#ff0055', mass: 1 },
      ]
  }
];

const FRICTION = 0.98;
const RESTITUTION = 0.85; 
const WALL_RESTITUTION = 0.9;
const BOUNDARY_RADIUS = 280;
const MAX_POWER = 35;

const MarbleGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Game State
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(3);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'LEVEL_COMPLETE' | 'GAME_OVER' | 'VICTORY'>('START');
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [canShoot, setCanShoot] = useState(true);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number, y: number } | null>(null);

  // Refs for physics loop
  const bodiesRef = useRef<PhysicsBody[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const holesRef = useRef<Hole[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const reqIdRef = useRef<number>(0);

  // --- Initialization ---

  const initLevel = (levelIndex: number) => {
    const level = LEVELS[levelIndex];
    const player: PhysicsBody = { 
      id: 'player', 
      x: PLAYER_START.x, 
      y: PLAYER_START.y, 
      vx: 0, 
      vy: 0, 
      radius: 14, 
      color: '#ffffff', 
      mass: 2, 
      isPlayer: true 
    };
    
    // Deep copy level data
    bodiesRef.current = [player, ...level.marbles.map(m => ({ ...m }))];
    obstaclesRef.current = level.obstacles.map(o => ({ ...o }));
    holesRef.current = level.holes.map(h => ({ ...h }));
    particlesRef.current = [];
    
    setShotsLeft(level.shots);
    setGameState('PLAYING');
    setCanShoot(true);
  };

  const startGame = () => {
    setCurrentLevelIdx(0);
    setScore(0);
    initLevel(0);
    setShowTutorial(false);
  };

  const nextLevel = () => {
    if (currentLevelIdx < LEVELS.length - 1) {
      setCurrentLevelIdx(p => p + 1);
      initLevel(currentLevelIdx + 1);
    } else {
      setGameState('VICTORY');
    }
  };

  const retryLevel = () => {
    initLevel(currentLevelIdx);
  };

  // --- Physics Helper: Circle-Rectangle Collision ---
  const resolveWallCollision = (ball: PhysicsBody, wall: Obstacle) => {
    // Find closest point on rect
    const closestX = Math.max(wall.x, Math.min(ball.x, wall.x + wall.width));
    const closestY = Math.max(wall.y, Math.min(ball.y, wall.y + wall.height));

    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared < (ball.radius * ball.radius)) {
        const distance = Math.sqrt(distanceSquared);
        
        let nx = dx / distance;
        let ny = dy / distance;

        if (distance === 0) { nx = 0; ny = -1; }

        const overlap = ball.radius - distance;

        // Separate
        ball.x += nx * overlap;
        ball.y += ny * overlap;

        // Reflect
        const dotProduct = ball.vx * nx + ball.vy * ny;
        if (dotProduct < 0) {
            ball.vx = (ball.vx - 2 * dotProduct * nx) * WALL_RESTITUTION;
            ball.vy = (ball.vy - 2 * dotProduct * ny) * WALL_RESTITUTION;
            return true; // collision happened
        }
    }
    return false;
  };

  // --- Physics Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const update = () => {
      const bodies = bodiesRef.current;
      const obstacles = obstaclesRef.current;
      const holes = holesRef.current;
      const particles = particlesRef.current;
      const center = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };

      let movingCount = 0;

      // 1. Update Bodies
      for (let i = bodies.length - 1; i >= 0; i--) {
        const b = bodies[i];
        
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= FRICTION;
        b.vy *= FRICTION;

        if (Math.abs(b.vx) > 0.05 || Math.abs(b.vy) > 0.05) {
          movingCount++;
        } else {
          b.vx = 0;
          b.vy = 0;
        }

        // Boundary Reflection (Walls)
        const distToCenter = Math.sqrt((b.x - center.x) ** 2 + (b.y - center.y) ** 2);
        if (distToCenter > BOUNDARY_RADIUS - b.radius) {
            const angle = Math.atan2(b.y - center.y, b.x - center.x);
            const nx = Math.cos(angle);
            const ny = Math.sin(angle);
            
            const overlap = distToCenter - (BOUNDARY_RADIUS - b.radius);
            b.x -= nx * overlap;
            b.y -= ny * overlap;

            const dot = b.vx * nx + b.vy * ny;
            b.vx = (b.vx - 2 * dot * nx) * 0.7;
            b.vy = (b.vy - 2 * dot * ny) * 0.7;
        }

        // Obstacles
        obstacles.forEach(wall => {
            if (resolveWallCollision(b, wall)) {
                // Spawn sparks if high velocity
                if (Math.abs(b.vx) + Math.abs(b.vy) > 2) {
                    spawnParticles(b.x, b.y, wall.color, 3);
                }
            }
        });

        // Holes
        for (const hole of holes) {
            const dx = b.x - hole.x;
            const dy = b.y - hole.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // If overlapping significantly with hole
            if (dist < hole.radius / 2) {
                // Plunk!
                spawnParticles(b.x, b.y, b.color, 15);
                
                if (b.isPlayer) {
                    // Penalty
                    b.x = PLAYER_START.x;
                    b.y = PLAYER_START.y;
                    b.vx = 0;
                    b.vy = 0;
                } else {
                    // Enemy Eliminated
                    setScore(s => s + 500);
                    bodies.splice(i, 1);
                }
                break; // Stop processing this body
            }
        }
      }

      // 2. Body Collisions
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const b1 = bodies[i];
          const b2 = bodies[j];
          
          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = b1.radius + b2.radius;

          if (dist < minDist) {
            const angle = Math.atan2(dy, dx);
            const overlap = (minDist - dist) / 2;
            b1.x -= Math.cos(angle) * overlap;
            b1.y -= Math.sin(angle) * overlap;
            b2.x += Math.cos(angle) * overlap;
            b2.y += Math.sin(angle) * overlap;

            const normalX = Math.cos(angle);
            const normalY = Math.sin(angle);
            
            const rvx = b2.vx - b1.vx;
            const rvy = b2.vy - b1.vy;
            const velAlongNormal = rvx * normalX + rvy * normalY;

            if (velAlongNormal <= 0) {
                let impulse = -(1 + RESTITUTION) * velAlongNormal;
                impulse /= (1 / b1.mass + 1 / b2.mass);

                const ix = impulse * normalX;
                const iy = impulse * normalY;

                b1.vx -= (1 / b1.mass) * ix;
                b1.vy -= (1 / b1.mass) * iy;
                b2.vx += (1 / b2.mass) * ix;
                b2.vy += (1 / b2.mass) * iy;

                if (Math.abs(impulse) > 3) {
                   spawnParticles(b1.x + dx/2, b1.y + dy/2, '#ffffff', 5);
                }
            }
          }
        }
      }

      // 3. Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // Turn End Check
      if (movingCount === 0 && !canShoot) {
         setCanShoot(true);
      }
    };

    const draw = () => {
      // Clear
      ctx.fillStyle = '#0f1525';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const center = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };

      // Arena Floor
      ctx.beginPath();
      ctx.arc(center.x, center.y, BOUNDARY_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#16213e';
      ctx.fill();

      // Grid
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      for(let i=-10; i<10; i++) {
          ctx.moveTo(center.x + i*40, center.y - BOUNDARY_RADIUS);
          ctx.lineTo(center.x + i*40, center.y + BOUNDARY_RADIUS);
          ctx.moveTo(center.x - BOUNDARY_RADIUS, center.y + i*40);
          ctx.lineTo(center.x + BOUNDARY_RADIUS, center.y + i*40);
      }
      ctx.stroke();

      // Holes
      holesRef.current.forEach(h => {
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#000000';
          ctx.fill();
          // Inner glow
          const g = ctx.createRadialGradient(h.x, h.y, h.radius * 0.5, h.x, h.y, h.radius);
          g.addColorStop(0, 'rgba(0,0,0,1)');
          g.addColorStop(1, 'rgba(50,50,50,0)');
          ctx.fillStyle = g;
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.lineWidth = 1;
          ctx.stroke();
      });

      // Boundary
      ctx.beginPath();
      ctx.arc(center.x, center.y, BOUNDARY_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Obstacles
      obstaclesRef.current.forEach(w => {
          ctx.fillStyle = w.color;
          ctx.shadowColor = w.color;
          ctx.shadowBlur = 10;
          ctx.fillRect(w.x, w.y, w.width, w.height);
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.strokeRect(w.x, w.y, w.width, w.height);
      });

      // Prediction Trajectory
      if (isDragging && dragStart && dragCurrent && gameState === 'PLAYING') {
          const player = bodiesRef.current.find(b => b.isPlayer);
          if (player) {
              const dx = dragStart.x - dragCurrent.x;
              const dy = dragStart.y - dragCurrent.y;
              const forceX = dx * 0.2;
              const forceY = dy * 0.2;
              
              const mag = Math.sqrt(forceX*forceX + forceY*forceY);
              const scale = mag > MAX_POWER ? MAX_POWER / mag : 1;
              
              // Sim vars
              let simX = player.x;
              let simY = player.y;
              let simVx = forceX * scale;
              let simVy = forceY * scale;

              ctx.beginPath();
              ctx.moveTo(simX, simY);
              
              // Simulate 30 frames
              for(let i=0; i<30; i++) {
                  simX += simVx;
                  simY += simVy;
                  
                  // Wall Collisions in Sim
                  obstaclesRef.current.forEach(w => {
                      const closestX = Math.max(w.x, Math.min(simX, w.x + w.width));
                      const closestY = Math.max(w.y, Math.min(simY, w.y + w.height));
                      const dX = simX - closestX;
                      const dY = simY - closestY;
                      if (dX*dX + dY*dY < player.radius * player.radius) {
                          const dist = Math.sqrt(dX*dX + dY*dY);
                          const nx = dX/dist || 0;
                          const ny = dY/dist || -1;
                          const dot = simVx * nx + simVy * ny;
                          if (dot < 0) {
                              simVx = (simVx - 2 * dot * nx);
                              simVy = (simVy - 2 * dot * ny);
                              simX += nx * (player.radius - dist + 1);
                              simY += ny * (player.radius - dist + 1);
                          }
                      }
                  });

                   // Boundary Reflection in Sim
                    const dC = Math.sqrt((simX - center.x)**2 + (simY - center.y)**2);
                    if (dC > BOUNDARY_RADIUS - player.radius) {
                         const angle = Math.atan2(simY - center.y, simX - center.x);
                         const nx = Math.cos(angle);
                         const ny = Math.sin(angle);
                         const dot = simVx * nx + simVy * ny;
                         simVx = (simVx - 2 * dot * nx);
                         simVy = (simVy - 2 * dot * ny);
                         simX -= nx * (dC - (BOUNDARY_RADIUS - player.radius));
                         simY -= ny * (dC - (BOUNDARY_RADIUS - player.radius));
                    }
                  
                  ctx.lineTo(simX, simY);
              }
              
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 5]);
              ctx.stroke();
              ctx.setLineDash([]);
              
              // Power Circle
              ctx.beginPath();
              ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI*2);
              ctx.strokeStyle = `rgba(255, ${255 * (1-scale)}, ${255 * (1-scale)}, 0.5)`;
              ctx.stroke();
          }
      }

      // Bodies
      bodiesRef.current.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 5;
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Shine
        const g = ctx.createRadialGradient(b.x - b.radius/3, b.y - b.radius/3, 1, b.x, b.y, b.radius);
        g.addColorStop(0, 'rgba(255,255,255,0.8)');
        g.addColorStop(0.5, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fill();
        
        // Highlight Player
        if (b.isPlayer && canShoot && gameState === 'PLAYING') {
           ctx.beginPath();
           ctx.arc(b.x, b.y, b.radius + 4, 0, Math.PI*2);
           ctx.strokeStyle = 'rgba(255,255,255,0.5)';
           ctx.lineWidth = 1;
           ctx.stroke();
        }
      });

      // Particles
      particlesRef.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
        ctx.fill();
      });
    };

    const loop = () => {
      update();
      draw();
      reqIdRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(reqIdRef.current);
  }, [isDragging, dragStart, dragCurrent, gameState, canShoot]);

  // Logic Checks
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    if (canShoot) {
        const bodies = bodiesRef.current;
        const enemies = bodies.filter(b => !b.isPlayer);
        
        if (enemies.length === 0) {
            setGameState('LEVEL_COMPLETE');
        } else if (shotsLeft === 0) {
            setGameState('GAME_OVER');
        }
    }
  }, [canShoot, shotsLeft, gameState]);

  // Handlers
  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
        particlesRef.current.push({
            id: Math.random(),
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            color
        });
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      
      // Handle both mouse and touch events
      let clientX, clientY;
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'PLAYING' || !canShoot) return;
    
    // Prevent default to stop scrolling on touch
    if ('touches' in e) {
        // e.preventDefault(); 
        // Can't always prevent default in passive listener, but okay for click handler usually
    }

    const { x, y } = getCanvasCoordinates(e);

    const player = bodiesRef.current.find(b => b.isPlayer);
    if (player) {
      const dist = Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
      if (dist < player.radius * 4) { 
        setIsDragging(true);
        setDragStart({ x, y });
        setDragCurrent({ x, y });
      }
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const { x, y } = getCanvasCoordinates(e);
    setDragCurrent({ x, y });
  };

  const handlePointerUp = () => {
    if (isDragging && dragStart && dragCurrent) {
      const player = bodiesRef.current.find(b => b.isPlayer);
      if (player) {
        const dx = dragStart.x - dragCurrent.x;
        const dy = dragStart.y - dragCurrent.y;
        
        let forceX = dx * 0.2;
        let forceY = dy * 0.2;
        
        const speedVar = 1 + (Math.random() * 0.04 - 0.02);
        forceX *= speedVar;
        forceY *= speedVar;

        const mag = Math.sqrt(forceX*forceX + forceY*forceY);
        const scale = mag > MAX_POWER ? MAX_POWER / mag : 1;

        if (mag > 2) {
            player.vx = forceX * scale;
            player.vy = forceY * scale;
            setShotsLeft(s => s - 1);
            setCanShoot(false);
        }
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center h-full w-full p-2 md:p-4 overflow-hidden">
      {/* Game HUD */}
      <div className="flex justify-between w-full max-w-[800px] mb-2 items-center z-10">
        <div>
            <h2 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                <Crosshair className="text-blue-500 w-5 h-5 md:w-6 md:h-6" />
                <span className="truncate max-w-[150px] md:max-w-none">{LEVELS[currentLevelIdx].name}</span>
            </h2>
            <p className="text-xs md:text-sm text-gray-400 hidden md:block">{LEVELS[currentLevelIdx].description}</p>
        </div>
        
        <div className="flex gap-2 md:gap-4 items-center">
          <div className="flex flex-col items-center">
             <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider">Shots</span>
             <div className="flex gap-1 md:gap-2 mt-1">
                 {Array.from({length: LEVELS[currentLevelIdx].shots}).map((_, i) => (
                     <div 
                        key={i} 
                        className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-300 ${
                            i < shotsLeft 
                            ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-100' 
                            : 'bg-gray-700 scale-75'
                        }`} 
                     />
                 ))}
             </div>
          </div>
          <div className="bg-white/10 px-3 py-1 md:px-4 md:py-2 rounded-xl backdrop-blur-md border border-white/5 flex flex-col items-center min-w-[60px] md:min-w-[80px]">
            <span className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-widest">Score</span>
            <span className="font-mono text-white text-lg md:text-xl font-bold">{score}</span>
          </div>
          <button 
            onClick={() => setShowTutorial(true)}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
              <HelpCircle className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>
      
      {/* Canvas Container */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 group bg-[#0a0f1c] w-full max-w-[800px] aspect-[4/3]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-contain cursor-crosshair touch-none"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
        
        {/* Tutorial Text */}
        {gameState === 'PLAYING' && canShoot && shotsLeft === LEVELS[currentLevelIdx].shots && !isDragging && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center animate-pulse opacity-50">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-white mb-2 flex items-center justify-center">
                    <MousePointer2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-sm font-bold">DRAG TO AIM</span>
                <span className="text-white/60 text-xs">Release to shoot</span>
             </div>
        )}

        {/* Tutorial Overlay */}
        {showTutorial && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-fade-in">
                <div className="max-w-2xl w-full bg-[#16213e] rounded-2xl border border-white/10 p-6 shadow-2xl relative max-h-full overflow-y-auto">
                    <button 
                        onClick={() => setShowTutorial(false)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    
                    <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-2">
                        <HelpCircle className="text-blue-500" /> How to Play
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Step 1 */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 text-blue-400">
                                <MousePointer2 className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-white mb-2">1. Drag to Aim</h3>
                            <p className="text-sm text-gray-400">Click and drag on the white cue ball. The further you drag, the more power you get.</p>
                        </div>
                         {/* Step 2 */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 text-emerald-400">
                                <Target className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-white mb-2">2. Sink Targets</h3>
                            <p className="text-sm text-gray-400">Knock all red marbles into the <span className="text-white font-bold">black holes</span>. Use walls to bank your shots.</p>
                        </div>
                         {/* Step 3 */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 text-red-400">
                                <Ban className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-white mb-2">3. Don't Scratch</h3>
                            <p className="text-sm text-gray-400">Do not sink the white cue ball. If you do, it resets to the start position.</p>
                        </div>
                    </div>

                    <div className="text-center">
                        <button 
                            onClick={() => setShowTutorial(false)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105"
                        >
                            Got it, Let's Play!
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Start Screen Overlay */}
        {gameState === 'START' && !showTutorial && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">TRICKSHOT POOL</h1>
                <p className="text-gray-300 mb-8 max-w-md">
                    Master the angles. Clear the table.
                </p>
                <div className="flex flex-col md:flex-row gap-4">
                    <button 
                        onClick={startGame}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-full font-bold text-xl flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-xl shadow-blue-500/20 border border-blue-400/20"
                    >
                        <Play className="fill-current" /> Start Game
                    </button>
                    <button 
                        onClick={() => setShowTutorial(true)}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all border border-white/10"
                    >
                        <HelpCircle className="w-5 h-5" /> How to Play
                    </button>
                </div>
            </div>
        )}

        {gameState === 'GAME_OVER' && (
             <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
                <Skull className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-4xl font-bold text-white mb-2">Out of Shots</h2>
                <p className="text-gray-400 mb-8">Targets remaining.</p>
                <button 
                    onClick={retryLevel}
                    className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                    <RotateCcw className="w-5 h-5" /> Retry Level
                </button>
             </div>
        )}

        {gameState === 'LEVEL_COMPLETE' && (
             <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
                <Target className="w-16 h-16 text-emerald-400 mb-4" />
                <h2 className="text-4xl font-bold text-white mb-2">Clean Sweep!</h2>
                <p className="text-gray-300 mb-8">Level {currentLevelIdx + 1} Complete</p>
                <button 
                    onClick={nextLevel}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
                >
                    Next Challenge <ArrowRight className="w-5 h-5" />
                </button>
             </div>
        )}

        {gameState === 'VICTORY' && (
             <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/60 to-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
                <Trophy className="w-24 h-24 text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 mb-4">Trickshot Master!</h2>
                <p className="text-gray-300 mb-8 text-lg">You cleared all levels.</p>
                <button 
                    onClick={startGame}
                    className="bg-white text-black px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 transition-all hover:scale-105"
                >
                    <RotateCcw className="w-5 h-5" /> Play Again
                </button>
             </div>
        )}
      </div>
    </div>
  );
};

export default MarbleGame;