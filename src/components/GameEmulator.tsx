import React, { useState, useEffect, useRef } from 'react';
import { Game } from '../types';
import { playSound } from '../utils/audio';
import { ArrowLeft, RotateCcw, Heart, Play, Trophy, Sparkles, AlertCircle, Volume2, ShieldCheck, Smile } from 'lucide-react';

interface GameEmulatorProps {
  game: Game;
  onClose: () => void;
}

export default function GameEmulator({ game, onClose }: GameEmulatorProps) {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover' | 'clear'>('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [activeTab, setActiveTab] = useState<'play' | 'idea' | 'reviews'>('play');

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem(`high-score-${game.id}`);
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, [game.id]);

  // Update High Score
  const updateHighScore = (newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem(`high-score-${game.id}`, newScore.toString());
    }
  };

  // State & Game Loop Ref
  const gameLoopRef = useRef<number | null>(null);

  // -----------------------------------------------------------------
  // 1. GAME: Space Explorer (🚀)
  // -----------------------------------------------------------------
  const [spaceX, setSpaceX] = useState(50); // percentage 0 - 100
  const [spaceMeteors, setSpaceMeteors] = useState<{ id: number; x: number; y: number; speed: number }[]>([]);
  const [spaceStars, setSpaceStars] = useState<{ id: number; x: number; y: number; speed: number }[]>([]);

  const startSpaceGame = () => {
    setScore(0);
    setSpaceX(50);
    setSpaceMeteors([]);
    setSpaceStars([]);
    setGameState('playing');
    playSound('jump');
  };

  useEffect(() => {
    if (game.id !== 'space-explorer' || gameState !== 'playing') return;

    let localMeteors = [...spaceMeteors];
    let localStars = [...spaceStars];
    let meteorIdCounter = 0;
    let starIdCounter = 0;
    let localScore = 0;
    let frameCount = 0;

    const gameLoop = () => {
      frameCount++;

      // Spawn meteors
      if (frameCount % 45 === 0) {
        localMeteors.push({
          id: meteorIdCounter++,
          x: Math.random() * 90 + 5,
          y: -10,
          speed: Math.random() * 2 + 2 + Math.min(localScore * 0.05, 3)
        });
      }

      // Spawn stars
      if (frameCount % 80 === 0) {
        localStars.push({
          id: starIdCounter++,
          x: Math.random() * 90 + 5,
          y: -10,
          speed: Math.random() * 1.5 + 1.5
        });
      }

      // Move meteors
      localMeteors = localMeteors
        .map(m => ({ ...m, y: m.y + m.speed }))
        .filter(m => {
          if (m.y > 100) {
            localScore += 1; // Survive point
            setScore(localScore);
            updateHighScore(localScore);
            return false;
          }
          return true;
        });

      // Move stars
      localStars = localStars
        .map(s => ({ ...s, y: s.y + s.speed }))
        .filter(s => {
          if (s.y > 100) return false;
          return true;
        });

      // Check collision with player spaceship
      // Spacecraft occupies roughly x: spaceX - 6 to spaceX + 6, y: 85 to 95
      setSpaceX(prevX => {
        const playerLeft = prevX - 6;
        const playerRight = prevX + 6;

        // Meteor collisions
        for (let i = 0; i < localMeteors.length; i++) {
          const m = localMeteors[i];
          if (m.y >= 82 && m.y <= 94) {
            if (m.x >= playerLeft && m.x <= playerRight) {
              playSound('hit');
              setGameState('gameover');
              updateHighScore(localScore);
              return prevX;
            }
          }
        }

        // Star collections
        const initialStarCount = localStars.length;
        localStars = localStars.filter(s => {
          if (s.y >= 82 && s.y <= 94) {
            if (s.x >= playerLeft && s.x <= playerRight) {
              playSound('coin');
              localScore += 10;
              setScore(localScore);
              updateHighScore(localScore);
              return false; // remove star
            }
          }
          return true;
        });

        return prevX;
      });

      setSpaceMeteors([...localMeteors]);
      setSpaceStars([...localStars]);

      if (gameState === 'playing') {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [game.id, gameState]);

  // Keyboard controls for Space Explorer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (game.id !== 'space-explorer' || gameState !== 'playing') return;
      if (e.key === 'ArrowLeft') {
        setSpaceX(prev => Math.max(8, prev - 7));
      } else if (e.key === 'ArrowRight') {
        setSpaceX(prev => Math.min(92, prev + 7));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game.id, gameState]);


  // -----------------------------------------------------------------
  // 2. GAME: Squishy Cat's Feast (🐱)
  // -----------------------------------------------------------------
  const [catX, setCatX] = useState(50);
  const [catFood, setCatFood] = useState<{ id: number; x: number; y: number; type: 'fish' | 'candy' | 'bomb'; speed: number }[]>([]);

  const startCatGame = () => {
    setScore(0);
    setLives(3);
    setCatX(50);
    setCatFood([]);
    setGameState('playing');
    playSound('jump');
  };

  useEffect(() => {
    if (game.id !== 'cat-feast' || gameState !== 'playing') return;

    let localFood = [...catFood];
    let foodIdCounter = 0;
    let localScore = 0;
    let localLives = 3;
    let frameCount = 0;

    const gameLoop = () => {
      frameCount++;

      // Spawn falling foods/bombs
      if (frameCount % 45 === 0) {
        const rand = Math.random();
        let foodType: 'fish' | 'candy' | 'bomb' = 'candy';
        if (rand < 0.4) {
          foodType = 'fish';
        } else if (rand > 0.75) {
          foodType = 'bomb';
        }

        localFood.push({
          id: foodIdCounter++,
          x: Math.random() * 90 + 5,
          y: -10,
          type: foodType,
          speed: Math.random() * 1.5 + 2 + Math.min(localScore * 0.03, 2.5)
        });
      }

      // Move items and check boundaries
      localFood = localFood
        .map(f => ({ ...f, y: f.y + f.speed }))
        .filter(f => {
          if (f.y > 100) {
            // Missed a delicious fish or candy (no penalty, just falls off)
            return false;
          }
          return true;
        });

      // Catch detection
      setCatX(prevX => {
        const catLeft = prevX - 9;
        const catRight = prevX + 9;

        localFood = localFood.filter(f => {
          if (f.y >= 80 && f.y <= 92) {
            if (f.x >= catLeft && f.x <= catRight) {
              if (f.type === 'bomb') {
                playSound('hit');
                localLives -= 1;
                setLives(localLives);
                if (localLives <= 0) {
                  setGameState('gameover');
                  updateHighScore(localScore);
                }
              } else if (f.type === 'fish') {
                playSound('coin');
                localScore += 20;
                setScore(localScore);
                updateHighScore(localScore);
              } else {
                playSound('coin');
                localScore += 10;
                setScore(localScore);
                updateHighScore(localScore);
              }
              return false; // remove from screen
            }
          }
          return true;
        });

        return prevX;
      });

      setCatFood([...localFood]);

      if (gameState === 'playing' && localLives > 0) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [game.id, gameState]);

  // Keyboard controls for Cat Feast
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (game.id !== 'cat-feast' || gameState !== 'playing') return;
      if (e.key === 'ArrowLeft') {
        setCatX(prev => Math.max(10, prev - 8));
      } else if (e.key === 'ArrowRight') {
        setCatX(prev => Math.min(90, prev + 8));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game.id, gameState]);


  // -----------------------------------------------------------------
  // 3. GAME: Obstacle Jump Dino (🦖)
  // -----------------------------------------------------------------
  const [dinoY, setDinoY] = useState(0); // offset from ground (which is 0)
  const [dinoVelocity, setDinoVelocity] = useState(0);
  const [dinoObstacles, setDinoObstacles] = useState<{ id: number; x: number; width: number; height: number }[]>([]);

  const startDinoGame = () => {
    setScore(0);
    setDinoY(0);
    setDinoVelocity(0);
    setDinoObstacles([]);
    setGameState('playing');
    playSound('jump');
  };

  const handleDinoJump = () => {
    if (gameState !== 'playing') return;
    if (dinoY === 0) {
      setDinoVelocity(13); // jump impulse
      playSound('jump');
    }
  };

  useEffect(() => {
    if (game.id !== 'jump-dino' || gameState !== 'playing') return;

    let localObstacles = [...dinoObstacles];
    let obsIdCounter = 0;
    let localScore = 0;
    let frameCount = 0;
    let currentDinoY = dinoY;
    let currentDinoVel = dinoVelocity;

    const gravity = -0.7;

    const gameLoop = () => {
      frameCount++;

      // Physics of Jump
      currentDinoVel += gravity;
      currentDinoY += currentDinoVel;
      if (currentDinoY <= 0) {
        currentDinoY = 0;
        currentDinoVel = 0;
      }
      setDinoY(currentDinoY);
      setDinoVelocity(currentDinoVel);

      // Spawn Obstacles (cacti)
      if (frameCount % 100 === 0 || (frameCount > 300 && frameCount % 160 === 30)) {
        localObstacles.push({
          id: obsIdCounter++,
          x: 110, // starts off-screen on the right
          width: Math.random() > 0.5 ? 8 : 12,
          height: Math.random() * 15 + 15 // height percentage
        });
      }

      // Move obstacles from right to left
      let crashed = false;
      localObstacles = localObstacles
        .map(obs => ({ ...obs, x: obs.x - (2.5 + Math.min(localScore * 0.1, 3)) }))
        .filter(obs => {
          // Check collision
          // Player is at x: 20 to 28, height is roughly 25.
          const dinoLeft = 18;
          const dinoRight = 28;
          const dinoBottom = currentDinoY;

          // If obstacle overlaps Dino X range
          if (obs.x >= dinoLeft && obs.x <= dinoRight) {
            // Obstacle height is absolute percentage from ground. 
            // Dino height is ground+offset. Since obstacle sits on ground, if dinoY (offset) is less than obstacle height, crash!
            if (dinoBottom < obs.height - 4) {
              crashed = true;
            }
          }

          // If passed player safely
          if (obs.x < 10) {
            localScore += 1;
            setScore(localScore);
            updateHighScore(localScore);
            playSound('coin');
            return false;
          }
          return true;
        });

      if (crashed) {
        playSound('hit');
        setGameState('gameover');
        updateHighScore(localScore);
        return;
      }

      setDinoObstacles([...localObstacles]);

      if (gameState === 'playing') {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [game.id, gameState, dinoY, dinoVelocity]);

  // Keyboard Listener for Dino Jump
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (game.id !== 'jump-dino' || gameState !== 'playing') return;
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleDinoJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game.id, gameState, dinoY]);


  // -----------------------------------------------------------------
  // 4. GAME: Color Match Pop! (🎈)
  // -----------------------------------------------------------------
  interface Bubble {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    colorName: '빨강' | '파랑' | '노랑' | '초록';
    hexColor: string;
    size: number;
  }

  const colorPool = [
    { name: '빨강' as const, hex: '#EF4444' },
    { name: '파랑' as const, hex: '#3B82F6' },
    { name: '노랑' as const, hex: '#F59E0B' },
    { name: '초록' as const, hex: '#10B981' }
  ];

  const [missionColor, setMissionColor] = useState<'빨강' | '파랑' | '노랑' | '초록'>('빨강');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(30);

  const startColorGame = () => {
    setScore(0);
    setTimeRemaining(30);
    
    // Choose random starting color
    const randomColor = colorPool[Math.floor(Math.random() * colorPool.length)].name;
    setMissionColor(randomColor);

    // Spawn 10 initial bubbles
    const initial: Bubble[] = [];
    for (let i = 0; i < 12; i++) {
      const type = colorPool[Math.floor(Math.random() * colorPool.length)];
      initial.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 70 + 15,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        colorName: type.name,
        hexColor: type.hex,
        size: Math.random() * 10 + 35
      });
    }
    setBubbles(initial);
    setGameState('playing');
    playSound('jump');
  };

  // 30 seconds countdown timer
  useEffect(() => {
    if (game.id !== 'color-pop' || gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [game.id, gameState]);

  // Mission Color rotation
  useEffect(() => {
    if (game.id !== 'color-pop' || gameState !== 'playing') return;

    const interval = setInterval(() => {
      const randomColor = colorPool[Math.floor(Math.random() * colorPool.length)].name;
      setMissionColor(randomColor);
      playSound('alert');
    }, 4500);

    return () => clearInterval(interval);
  }, [game.id, gameState]);

  // Bubble Movement loop
  useEffect(() => {
    if (game.id !== 'color-pop' || gameState !== 'playing') return;

    const loop = () => {
      setBubbles(prev => {
        return prev.map(b => {
          let nx = b.x + b.vx;
          let ny = b.y + b.vy;
          let nvx = b.vx;
          let nvy = b.vy;

          // Bounce walls
          if (nx < 5 || nx > 95) nvx = -nvx;
          if (ny < 12 || ny > 88) nvy = -nvy;

          return {
            ...b,
            x: Math.max(5, Math.min(95, nx)),
            y: Math.max(12, Math.min(88, ny)),
            vx: nvx,
            vy: nvy
          };
        });
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [game.id, gameState]);

  const handleBubbleClick = (clickedId: number, colorName: string) => {
    if (gameState !== 'playing') return;

    if (colorName === missionColor) {
      playSound('coin');
      setScore(prev => {
        const next = prev + 15;
        updateHighScore(next);
        return next;
      });

      // Pop and replace clicked bubble with a new random one
      setBubbles(prev =>
        prev.map(b => {
          if (b.id === clickedId) {
            const nextType = colorPool[Math.floor(Math.random() * colorPool.length)];
            return {
              id: Math.random(), // new key
              x: Math.random() * 80 + 10,
              y: Math.random() * 70 + 15,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              colorName: nextType.name,
              hexColor: nextType.hex,
              size: Math.random() * 10 + 35
            };
          }
          return b;
        })
      );
    } else {
      playSound('hit');
      setScore(prev => Math.max(0, prev - 10));
    }
  };


  // -----------------------------------------------------------------
  // 5. GAME: Candy Sneak (🍬)
  // -----------------------------------------------------------------
  const [candyProgress, setCandyProgress] = useState(0); // 0 to 100%
  const [momState, setMomState] = useState<'writing' | 'alert' | 'looking'>('writing');
  const [isPressingCandy, setIsPressingCandy] = useState(false);
  const pressTimerRef = useRef<number | null>(null);

  const startCandyGame = () => {
    setScore(0);
    setCandyProgress(0);
    setMomState('writing');
    setIsPressingCandy(false);
    setGameState('playing');
    playSound('jump');
  };

  // Mom AI cycle
  useEffect(() => {
    if (game.id !== 'candy-sneak' || gameState !== 'playing') return;

    let momTimer: NodeJS.Timeout;

    const runMomCycle = () => {
      // 1. Safe phase (writing on board)
      setMomState('writing');
      const writeDuration = Math.random() * 2000 + 2000; // 2 to 4 seconds

      momTimer = setTimeout(() => {
        // 2. Alert phase (gets suspicious)
        setMomState('alert');
        playSound('alert');
        
        momTimer = setTimeout(() => {
          // 3. Turning around to look (unsafe!)
          setMomState('looking');
          
          momTimer = setTimeout(() => {
            // Cycle repeats
            runMomCycle();
          }, 1500); // looks for 1.5s
          
        }, 900); // alert lasts 0.9s

      }, writeDuration);
    };

    runMomCycle();
    return () => clearTimeout(momTimer);
  }, [game.id, gameState]);

  // Handle candy-holding action
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (isPressingCandy) {
      const incrementProgress = () => {
        // If caught eating candy
        if (momState === 'looking') {
          playSound('hit');
          setGameState('gameover');
          setIsPressingCandy(false);
          return;
        }

        setCandyProgress(prev => {
          const next = prev + 1;
          if (next >= 100) {
            playSound('win');
            setGameState('clear');
            setScore(100);
            updateHighScore(100);
            setIsPressingCandy(false);
            return 100;
          }
          // Increment score proportional to progress
          setScore(next);
          updateHighScore(next);
          if (next % 8 === 0) playSound('coin');
          return next;
        });

        pressTimerRef.current = requestAnimationFrame(incrementProgress);
      };

      pressTimerRef.current = requestAnimationFrame(incrementProgress);
    } else {
      if (pressTimerRef.current) cancelAnimationFrame(pressTimerRef.current);
    }

    return () => {
      if (pressTimerRef.current) cancelAnimationFrame(pressTimerRef.current);
    };
  }, [isPressingCandy, momState, gameState]);

  // Spacebar listeners for Candy Sneak
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (game.id !== 'candy-sneak' || gameState !== 'playing') return;
      if (e.key === ' ') {
        e.preventDefault();
        setIsPressingCandy(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (game.id !== 'candy-sneak' || gameState !== 'playing') return;
      if (e.key === ' ') {
        setIsPressingCandy(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [game.id, gameState]);


  // -----------------------------------------------------------------
  // 6. GAME: Baby Duck Pathfinder (🦆)
  // -----------------------------------------------------------------
  const [duckPos, setDuckPos] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [duckWorms, setDuckWorms] = useState<{ r: number; c: number; active: boolean }[]>([
    { r: 0, c: 3, active: true },
    { r: 2, c: 1, active: true },
    { r: 4, c: 0, active: true }
  ]);
  const [duckSteps, setDuckSteps] = useState(0);

  // Obstacles (mud puddles, tree trunks)
  const duckObstacles = [
    { r: 1, c: 1 },
    { r: 1, c: 2 },
    { r: 3, c: 1 },
    { r: 2, c: 3 },
    { r: 3, c: 3 }
  ];

  const startDuckGame = () => {
    setScore(0);
    setDuckPos({ r: 0, c: 0 });
    setDuckSteps(0);
    setDuckWorms([
      { r: 0, c: 3, active: true },
      { r: 2, c: 1, active: true },
      { r: 4, c: 0, active: true }
    ]);
    setGameState('playing');
    playSound('jump');
  };

  const moveDuck = (dr: number, dc: number) => {
    if (gameState !== 'playing') return;

    const nr = duckPos.r + dr;
    const nc = duckPos.c + dc;

    // Check bounds
    if (nr < 0 || nr >= 5 || nc < 0 || nc >= 5) return;

    // Check obstacles
    const isObstacle = duckObstacles.some(o => o.r === nr && o.c === nc);
    if (isObstacle) {
      playSound('hit');
      return;
    }

    // Valid move!
    const newPos = { r: nr, c: nc };
    setDuckPos(newPos);
    setDuckSteps(prev => prev + 1);
    playSound('jump');

    // Check worm item collision
    setDuckWorms(prev => {
      let wormCollected = false;
      const updated = prev.map(w => {
        if (w.r === nr && w.c === nc && w.active) {
          wormCollected = true;
          return { ...w, active: false };
        }
        return w;
      });

      if (wormCollected) {
        playSound('coin');
        setScore(scorePrev => {
          const next = scorePrev + 30;
          updateHighScore(next);
          return next;
        });
      }
      return updated;
    });

    // Check win condition (Goal is mother duck at [4, 4])
    if (nr === 4 && nc === 4) {
      playSound('win');
      setGameState('clear');
      // Final bonus based on efficiency
      const stepBonus = Math.max(10, 100 - duckSteps * 4);
      setScore(prev => {
        const next = prev + stepBonus;
        updateHighScore(next);
        return next;
      });
    }
  };

  // Keyboard support for Duck Game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (game.id !== 'duck-maze' || gameState !== 'playing') return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        moveDuck(-1, 0);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        moveDuck(1, 0);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        moveDuck(0, -1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        moveDuck(0, 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game.id, gameState, duckPos, score, duckSteps]);


  // Cleanup active frame loops on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);


  // Mock comment submission
  const [comments, setComments] = useState<{ id: string; author: string; content: string; date: string }[]>([
    { id: '1', author: '4학년 민지', content: '대박 진짜 재밌어요!! 최고최고 👍', date: '방금 전' },
    { id: '2', author: '수학교사 이선생님', content: '2학년 꼬마 개발자가 만들었다고 믿기지 않는 퀄리티네요. 멋집니다!', date: '3분 전' },
    { id: '3', author: '민우엄마', content: '우리 아들이 이렇게 훌륭한 게임을 기획했다니 감동이에요 😭❤️ 많이 해 주세요!', date: '12분 전' }
  ]);
  const [newAuthor, setNewAuthor] = useState('');
  const [newComment, setNewComment] = useState('');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newComment.trim()) return;

    setComments(prev => [
      {
        id: Math.random().toString(),
        author: newAuthor,
        content: newComment,
        date: '방금 전'
      },
      ...prev
    ]);
    setNewAuthor('');
    setNewComment('');
    playSound('coin');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-[#FBFBFD] w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden border border-black/5 max-h-[90vh] flex flex-col">
        
        {/* Header - Glassmorphic / Apple Design style */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#FBFBFD]/80 backdrop-blur-md border-b border-black/5">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>돌아가기</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
              <span>{game.emoji}</span>
              <span>{game.title}</span>
            </h2>
            <p className="text-xs text-slate-500">{game.creator} 작품</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-full py-1 px-3 border border-black/5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-display text-xs font-semibold text-slate-700">{highScore}</span>
            </div>
            <Volume2 className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Dynamic Navigation Tabs inside Emulator Modal */}
        <div className="flex justify-center border-b border-black/5 bg-[#FBFBFD]">
          <div className="flex gap-2 p-1 bg-slate-100/70 rounded-full my-3">
            <button
              onClick={() => setActiveTab('play')}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'play' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🎮 게임하기
            </button>
            <button
              onClick={() => setActiveTab('idea')}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'idea' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📝 기획 의도
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'reviews' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              💬 격려 한마디 ({comments.length})
            </button>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          
          {/* TAB 1: PLAYING FIELD */}
          {activeTab === 'play' && (
            <>
              {/* Game Screen Canvas Box (Left column) */}
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 rounded-[24px] overflow-hidden border border-black/10 relative p-4 min-h-[380px] md:min-h-[420px] shadow-inner text-white select-none">
                
                {/* Score & HUD top line */}
                {gameState === 'playing' && (
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 bg-black/40 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-xs font-medium">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>SCORE: <span className="font-display font-bold text-amber-300">{score}</span></span>
                    </div>
                    
                    {game.id === 'cat-feast' && (
                      <div className="flex items-center gap-1 text-rose-400">
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <Heart 
                            key={idx} 
                            className={`w-3.5 h-3.5 ${idx < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} 
                          />
                        ))}
                      </div>
                    )}

                    {game.id === 'color-pop' && (
                      <div className="font-semibold text-amber-200">
                        ⏱️ 남은시간: {timeRemaining}초
                      </div>
                    )}

                    {game.id === 'duck-maze' && (
                      <div className="text-emerald-300 font-semibold text-[11px]">
                        👣 이동: {duckSteps}회
                      </div>
                    )}

                    {game.id === 'candy-sneak' && (
                      <div className="text-[11px]">
                        🍬 진행도: <span className="font-display font-bold text-purple-300">{candyProgress}%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* GAME SCREEN VIEWS */}
                {gameState === 'ready' && (
                  <div className="flex flex-col items-center text-center p-6 max-w-sm">
                    <span className="text-6xl animate-bounce mb-3 select-none">{game.emoji}</span>
                    <h3 className="text-xl font-bold tracking-tight mb-2 font-display">{game.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-6">
                      {game.description}
                    </p>
                    <button
                      onClick={() => {
                        if (game.id === 'space-explorer') startSpaceGame();
                        if (game.id === 'cat-feast') startCatGame();
                        if (game.id === 'jump-dino') startDinoGame();
                        if (game.id === 'color-pop') startColorGame();
                        if (game.id === 'candy-sneak') startCandyGame();
                        if (game.id === 'duck-maze') startDuckGame();
                      }}
                      className="px-6 py-3 bg-white text-slate-900 rounded-full text-sm font-semibold hover:bg-slate-100 flex items-center gap-1.5 transition-all shadow-md hover:-translate-y-0.5"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>게임 시작하기</span>
                    </button>
                  </div>
                )}

                {gameState === 'gameover' && (
                  <div className="flex flex-col items-center text-center p-6">
                    <span className="text-5xl mb-2">💥</span>
                    <h3 className="text-xl font-bold text-rose-400 font-display mb-1">GAME OVER</h3>
                    <p className="text-xs text-slate-400 mb-6">최종 점수: {score}점</p>
                    
                    <button
                      onClick={() => {
                        if (game.id === 'space-explorer') startSpaceGame();
                        if (game.id === 'cat-feast') startCatGame();
                        if (game.id === 'jump-dino') startDinoGame();
                        if (game.id === 'color-pop') startColorGame();
                        if (game.id === 'candy-sneak') startCandyGame();
                        if (game.id === 'duck-maze') startDuckGame();
                      }}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>다시 시도하기</span>
                    </button>
                  </div>
                )}

                {gameState === 'clear' && (
                  <div className="flex flex-col items-center text-center p-6">
                    <span className="text-5xl mb-2 animate-bounce">🎉</span>
                    <h3 className="text-xl font-bold text-emerald-400 font-display mb-1">GAME CLEAR!</h3>
                    <p className="text-xs text-slate-400 mb-2">엄청나게 멋진 실력이네요!</p>
                    <p className="text-sm font-bold text-amber-300 mb-6">최종 점수: {score}점</p>
                    
                    <button
                      onClick={() => {
                        if (game.id === 'space-explorer') startSpaceGame();
                        if (game.id === 'cat-feast') startCatGame();
                        if (game.id === 'jump-dino') startDinoGame();
                        if (game.id === 'color-pop') startColorGame();
                        if (game.id === 'candy-sneak') startCandyGame();
                        if (game.id === 'duck-maze') startDuckGame();
                      }}
                      className="px-5 py-2.5 bg-white text-slate-900 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>한 번 더 하기</span>
                    </button>
                  </div>
                )}

                {/* ACTIVE SIMULATION ENGINES */}
                {gameState === 'playing' && (
                  <div className="w-full h-full relative overflow-hidden flex-1 flex items-center justify-center">
                    
                    {/* 1. Space Explorer Screen rendering */}
                    {game.id === 'space-explorer' && (
                      <div className="w-full h-full bg-gradient-to-b from-[#0B0F19] to-[#1E1B4B] relative overflow-hidden">
                        {/* Space Stars (background decoration) */}
                        <div className="absolute inset-0 opacity-40">
                          <div className="absolute top-10 left-12 w-1 h-1 bg-white rounded-full"></div>
                          <div className="absolute top-24 left-2/3 w-1.5 h-1.5 bg-white rounded-full"></div>
                          <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-white rounded-full"></div>
                          <div className="absolute top-2/3 left-4/5 w-1 h-1 bg-white rounded-full"></div>
                        </div>

                        {/* Space Explorer Ship Player */}
                        <div 
                          className="absolute bottom-8 text-3xl transition-all duration-75 text-center flex flex-col items-center"
                          style={{ left: `${spaceX}%`, transform: 'translateX(-50%)' }}
                        >
                          <span>🚀</span>
                          <span className="w-3 h-2 bg-amber-400 rounded-full blur-[2px] animate-pulse"></span>
                        </div>

                        {/* Space Explorer Meteors */}
                        {spaceMeteors.map(m => (
                          <div 
                            key={m.id}
                            className="absolute text-2xl"
                            style={{ left: `${m.x}%`, top: `${m.y}%`, transform: 'translateX(-50%)' }}
                          >
                            ☄️
                          </div>
                        ))}

                        {/* Space Explorer Stars */}
                        {spaceStars.map(s => (
                          <div 
                            key={s.id}
                            className="absolute text-xl animate-pulse"
                            style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translateX(-50%)' }}
                          >
                            ⭐
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2. Squishy Cat's Feast rendering */}
                    {game.id === 'cat-feast' && (
                      <div className="w-full h-full bg-gradient-to-b from-rose-100 to-amber-50 text-slate-800 relative overflow-hidden">
                        {/* Floor */}
                        <div className="absolute bottom-0 left-0 right-0 h-4 bg-amber-200 border-t border-amber-300"></div>

                        {/* Cat Basket Player */}
                        <div 
                          className="absolute bottom-4 text-4xl transition-all duration-75 text-center flex flex-col items-center"
                          style={{ left: `${catX}%`, transform: 'translateX(-50%)' }}
                        >
                          <span>🐱</span>
                          <span className="text-[10px] bg-white/80 font-bold px-1 rounded shadow-xs mt-1">말랑보리</span>
                        </div>

                        {/* Food / Bombs list */}
                        {catFood.map(f => (
                          <div 
                            key={f.id}
                            className="absolute text-3xl"
                            style={{ left: `${f.x}%`, top: `${f.y}%`, transform: 'translateX(-50%)' }}
                          >
                            {f.type === 'fish' ? '🐟' : f.type === 'candy' ? '🍬' : '💣'}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 3. Obstacle Jump Dino rendering */}
                    {game.id === 'jump-dino' && (
                      <div className="w-full h-full bg-gradient-to-b from-[#FFF1F2] via-[#FFE4E6] to-[#FECDD3] text-slate-800 relative overflow-hidden">
                        {/* Sand Floor */}
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#FBCFE8] border-t-2 border-[#F472B6] flex items-center justify-around overflow-hidden text-[#EC4899]/30 font-display select-none">
                          <span>🌵</span><span>🌵</span><span>🌵</span><span>🌵</span><span>🌵</span>
                        </div>

                        {/* Dino Player */}
                        <div 
                          className="absolute text-4xl"
                          style={{ 
                            left: '20%', 
                            bottom: `${16 + dinoY}%`, 
                            transform: 'translateY(1px)'
                          }}
                        >
                          <span className="inline-block animate-bounce select-none">🦖</span>
                        </div>

                        {/* Dino Obstacles */}
                        {dinoObstacles.map(obs => (
                          <div 
                            key={obs.id}
                            className="absolute flex items-end select-none"
                            style={{ 
                              left: `${obs.x}%`, 
                              bottom: '16%',
                              width: `${obs.width}%`,
                              height: `${obs.height}%`
                            }}
                          >
                            <span className="text-3xl filter drop-shadow">🌵</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 4. Color Match Pop! rendering */}
                    {game.id === 'color-pop' && (
                      <div className="w-full h-full bg-[#1E293B] text-white relative overflow-hidden flex flex-col justify-between">
                        {/* Target Color Banner */}
                        <div className="w-full bg-[#334155] border-b border-slate-700 p-2 text-center text-xs font-semibold z-10 flex items-center justify-center gap-2">
                          <span>🎯 미션 색상:</span>
                          <span 
                            className="px-3 py-1 rounded-full text-white font-bold tracking-wider shadow-sm flex items-center gap-1"
                            style={{ 
                              backgroundColor: colorPool.find(c => c.name === missionColor)?.hex 
                            }}
                          >
                            <span>🎈</span>
                            <span>{missionColor}</span>
                          </span>
                        </div>

                        {/* Floating Bubbles */}
                        <div className="relative w-full flex-1">
                          {bubbles.map(b => (
                            <button
                              key={b.id}
                              onClick={() => handleBubbleClick(b.id, b.colorName)}
                              className="absolute rounded-full border-2 border-white/40 flex items-center justify-center text-[10px] font-bold text-white transition-transform active:scale-90 hover:scale-105 cursor-pointer shadow-md select-none"
                              style={{
                                left: `${b.x}%`,
                                top: `${b.y}%`,
                                width: `${b.size}px`,
                                height: `${b.size}px`,
                                backgroundColor: `${b.hexColor}99`, // semi transparent background
                                transform: 'translate(-50%, -50%)',
                                backdropFilter: 'blur(2px)'
                              }}
                            >
                              🎈
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 5. Candy Sneak rendering */}
                    {game.id === 'candy-sneak' && (
                      <div className="w-full h-full bg-slate-800 text-white relative overflow-hidden flex flex-col items-center p-3 justify-between">
                        
                        {/* Mother's State Visualization Area */}
                        <div className="w-full flex-1 rounded-2xl bg-slate-900 border border-slate-700/80 p-4 relative flex flex-col items-center justify-center">
                          
                          {/* Alert Signs */}
                          {momState === 'alert' && (
                            <div className="absolute top-2 bg-amber-500 border-2 border-amber-300 text-slate-950 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-md z-10">
                              <AlertCircle className="w-4 h-4 fill-slate-950" />
                              <span>엄마가 부스럭 소리를 들었어!</span>
                            </div>
                          )}

                          {momState === 'looking' && (
                            <div className="absolute top-2 bg-rose-600 border-2 border-rose-400 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-bounce shadow-md z-10">
                              <AlertCircle className="w-4 h-4 fill-white text-rose-600" />
                              <span>위험! 뒤돌아보셨어!</span>
                            </div>
                          )}

                          {momState === 'writing' && (
                            <div className="absolute top-2 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full z-10">
                              ✍️ 엄마가 공부 가이드북 작성 중 (안전)
                            </div>
                          )}

                          {/* Mother character rendering */}
                          <div className="flex flex-col items-center justify-center mt-6">
                            <span className="text-6xl filter drop-shadow-md select-none transition-transform duration-300">
                              {momState === 'writing' ? '👵' : momState === 'alert' ? '🤨' : '👁️_👁️'}
                            </span>
                            <p className="text-xs font-semibold mt-2 text-slate-300">
                              {momState === 'writing' ? '칠판 보는 중' : momState === 'alert' ? '귀를 쫑긋하는 중..' : '뒤돌아 보는 중!!!'}
                            </p>
                          </div>

                          {/* Student rendering */}
                          <div className="absolute bottom-4 left-6 text-center">
                            <span className="text-4xl block select-none">
                              {isPressingCandy ? '😋' : '✍️'}
                            </span>
                            <span className="text-[10px] text-slate-400">나 (태양이)</span>
                          </div>

                          {/* Desk and candy bar */}
                          <div className="absolute bottom-4 right-6 text-center">
                            <span className="text-4xl block animate-pulse select-none">🍭</span>
                            <span className="text-[10px] text-slate-400">무지개 사탕</span>
                          </div>

                        </div>

                        {/* ProgressBar and Action Area */}
                        <div className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 mt-3 flex flex-col gap-2 items-center">
                          <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-purple-500 h-full transition-all duration-75"
                              style={{ width: `${candyProgress}%` }}
                            ></div>
                          </div>
                          
                          {/* Hold Eat Trigger Button */}
                          <button
                            onMouseDown={() => setIsPressingCandy(true)}
                            onMouseUp={() => setIsPressingCandy(false)}
                            onMouseLeave={() => setIsPressingCandy(false)}
                            onTouchStart={(e) => { e.preventDefault(); setIsPressingCandy(true); }}
                            onTouchEnd={(e) => { e.preventDefault(); setIsPressingCandy(false); }}
                            className={`w-full py-4 text-center text-xs font-bold tracking-wide rounded-lg cursor-pointer transition-all ${
                              isPressingCandy 
                                ? 'bg-purple-600 text-white scale-[0.98]' 
                                : 'bg-purple-100 text-purple-900 border border-purple-200 hover:bg-purple-200'
                            }`}
                          >
                            🍬 [스페이스바] 또는 [마우스 홀드] 사탕 몰래 녹여먹기!
                          </button>
                        </div>

                      </div>
                    )}

                    {/* 6. Baby Duck Pathfinder rendering */}
                    {game.id === 'duck-maze' && (
                      <div className="w-full h-full bg-[#14532D] text-white relative overflow-hidden flex flex-col items-center p-3 justify-center">
                        <div className="grid grid-cols-5 gap-1.5 w-full max-w-[280px] bg-emerald-950 p-2 rounded-2xl border border-emerald-800">
                          {Array.from({ length: 5 }).map((_, r) => (
                            Array.from({ length: 5 }).map((_, c) => {
                              const isPlayer = duckPos.r === r && duckPos.c === c;
                              const isObstacle = duckObstacles.some(o => o.r === r && o.c === c);
                              const isGoal = r === 4 && c === 4;
                              const activeWorm = duckWorms.find(w => w.r === r && w.c === c && w.active);

                              let cellBg = 'bg-emerald-900/60';
                              let emoji = '';

                              if (isPlayer) {
                                emoji = '🦆';
                                cellBg = 'bg-yellow-500/20 ring-2 ring-yellow-400';
                              } else if (isGoal) {
                                emoji = '🌊';
                                cellBg = 'bg-sky-500/30';
                              } else if (duckObstacles.some(o => o.r === r && o.c === c)) {
                                emoji = '🪵';
                                cellBg = 'bg-amber-950/80';
                              } else if (activeWorm) {
                                emoji = '🐛';
                                cellBg = 'bg-emerald-800';
                              }

                              return (
                                <div 
                                  key={`${r}-${c}`}
                                  className={`aspect-square rounded-lg flex items-center justify-center text-xl transition-all duration-150 ${cellBg}`}
                                >
                                  {emoji}
                                </div>
                              );
                            })
                          ))}
                        </div>

                        {/* Duck Controls HUD */}
                        <div className="text-[10px] text-emerald-300 mt-2 flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full border border-emerald-900">
                          <Smile className="w-3 h-3" />
                          <span>엄마 오리가 기다려요! 키보드 방향키로 움직이세요.</span>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Virtual Mobile Controllers overlay (only shown during play for games that require navigation) */}
                {gameState === 'playing' && ['space-explorer', 'cat-feast', 'jump-dino', 'duck-maze'].includes(game.id) && (
                  <div className="w-full mt-3 flex justify-center gap-2">
                    
                    {/* Left/Right controllers for Space and Cat games */}
                    {['space-explorer', 'cat-feast'].includes(game.id) && (
                      <div className="flex gap-4 w-full px-2">
                        <button 
                          onTouchStart={() => {
                            if (game.id === 'space-explorer') setSpaceX(prev => Math.max(8, prev - 8));
                            if (game.id === 'cat-feast') setCatX(prev => Math.max(10, prev - 9));
                          }}
                          className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 rounded-xl text-center active:bg-white/30 text-white font-bold select-none cursor-pointer"
                        >
                          ◀ 왼쪽으로
                        </button>
                        <button 
                          onTouchStart={() => {
                            if (game.id === 'space-explorer') setSpaceX(prev => Math.min(92, prev + 8));
                            if (game.id === 'cat-feast') setCatX(prev => Math.min(90, prev + 9));
                          }}
                          className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 rounded-xl text-center active:bg-white/30 text-white font-bold select-none cursor-pointer"
                        >
                          오른쪽으로 ▶
                        </button>
                      </div>
                    )}

                    {/* Jump action controller for Dino Jump */}
                    {game.id === 'jump-dino' && (
                      <button 
                        onClick={handleDinoJump}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-center text-white active:scale-95 font-bold transition-transform select-none cursor-pointer"
                      >
                        🦖 점프하기 (클릭/터치)
                      </button>
                    )}

                    {/* D-Pad for Duck Pathfinder */}
                    {game.id === 'duck-maze' && (
                      <div className="flex flex-col items-center gap-1 select-none">
                        <button 
                          onClick={() => moveDuck(-1, 0)}
                          className="w-12 h-10 bg-white/10 active:bg-white/30 text-white font-bold rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          ▲
                        </button>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => moveDuck(0, -1)}
                            className="w-12 h-10 bg-white/10 active:bg-white/30 text-white font-bold rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            ◀
                          </button>
                          <button 
                            onClick={() => moveDuck(1, 0)}
                            className="w-12 h-10 bg-white/10 active:bg-white/30 text-white font-bold rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            ▼
                          </button>
                          <button 
                            onClick={() => moveDuck(0, 1)}
                            className="w-12 h-10 bg-white/10 active:bg-white/30 text-white font-bold rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>

              {/* Game Info Sheet (Right column) */}
              <div className="w-full md:w-80 flex flex-col justify-between bg-white rounded-2xl p-5 border border-black/5">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">게임 정보</h4>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-4">
                    {game.description}
                  </p>

                  <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">🎮 조작 가이드</h4>
                  <ul className="space-y-1.5 mb-6">
                    {game.instructions.map((inst, index) => (
                      <li key={index} className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                        <span className="text-slate-400 shrink-0">{index + 1}.</span>
                        <span>{inst}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>꼬마 보호 안심 필터링</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    본 웹사이트의 게임들은 아이들의 정서 안전 가이드라인에 맞춰 피 폭력성, 비 선정적인 순수 창작 작품으로 제작되었습니다.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ORIGINAL IDEA ARCHIVES */}
          {activeTab === 'idea' && (
            <div className="flex-1 bg-amber-50/40 rounded-3xl p-6 md:p-8 border border-amber-100/50 flex flex-col md:flex-row gap-8 overflow-y-auto">
              
              {/* Left Sketch mockup */}
              <div className="flex-1 flex flex-col justify-center">
                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full w-max mb-3 font-display">
                  ✏️ 꼬마 개발자의 비밀 아이디어 노트
                </span>
                
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-4 font-sans leading-snug">
                  "{game.title}" 은(는) 어떻게 시작되었을까요?
                </h3>
                
                <div className="space-y-4 text-slate-700 leading-relaxed text-sm bg-white p-5 rounded-2xl border border-amber-100 shadow-sm relative">
                  <div className="absolute -top-3 -right-3 text-3xl select-none">💡</div>
                  <p className="whitespace-pre-line font-medium text-slate-800 italic">
                    "{game.originalIdea}"
                  </p>
                  <p className="text-right text-xs text-amber-600 font-semibold mt-4">
                    - 기획자 {game.creator}
                  </p>
                </div>
              </div>

              {/* Right Paper Note illustration */}
              <div className="w-full md:w-80 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center">
                <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">🛠️ 개발 기술 스택</h4>
                <div className="space-y-2.5 mb-6">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">엔진</span>
                    <span className="font-semibold text-slate-800">HTML5 Canvas + React state</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">디자인</span>
                    <span className="font-semibold text-slate-800">iPad drawing + Vector Emoji</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">사운드 효과음</span>
                    <span className="font-semibold text-slate-800">Web Audio 8-Bit Synthesizer</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">배포 방식</span>
                    <span className="font-semibold text-slate-800">GitHub push & Vercel deployment</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl">
                  <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
                    📢 아이들의 그림 기획 원고와 스토리를 바탕으로 현대 프로그래밍 코드를 더해 실제 플레이 가능한 웹 아케이드로 탄생한 작품입니다.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: USER REVIEWS & COMPLIMENTS */}
          {activeTab === 'reviews' && (
            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-y-auto">
              
              {/* Comment submission form */}
              <div className="w-full md:w-80 bg-white border border-black/5 rounded-2xl p-5 shrink-0 flex flex-col justify-between">
                <form onSubmit={handleAddComment} className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">격려 메시지 남기기</h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    아이들이 보고 큰 용기를 얻을 수 있도록 힘나는 한마디를 적어주세요!
                  </p>
                  
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">작성자 명칭</label>
                    <input 
                      type="text" 
                      value={newAuthor}
                      onChange={e => setNewAuthor(e.target.value)}
                      placeholder="예: 4학년 서연이, 교장선생님"
                      maxLength={15}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">응원 메시지</label>
                    <textarea 
                      rows={3}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="칭찬은 꼬마 개발자를 춤추게 해요!"
                      maxLength={100}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer active:scale-95 transition-transform"
                  >
                    글 올리기 📝
                  </button>
                </form>
                
                <div className="mt-4 text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-lg">
                  💡 비방, 욕설, 유해한 글은 자동 안심 필터링 시스템에 의해 즉시 차단 처리됩니다.
                </div>
              </div>

              {/* Comment List */}
              <div className="flex-1 space-y-3 pr-2 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-800 mb-2">응원 한마디 모음 ({comments.length}개)</h3>
                
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">아직 등록된 메시지가 없어요. 첫 번째 주인공이 되어 보세요!</p>
                ) : (
                  comments.map(c => (
                    <div 
                      key={c.id} 
                      className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-xs transition-all hover:bg-slate-50/50"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-800">{c.author}</span>
                        <span className="text-[10px] text-slate-400">{c.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-black/5 text-center text-[10px] text-slate-400 flex items-center justify-between">
          <span>제작 도구: React & Framer Motion</span>
          <span className="font-display font-medium">✨ 우리 반 꼬마 개발자들의 멋진 아이디어를 응원합니다!</span>
        </div>

      </div>
    </div>
  );
}
