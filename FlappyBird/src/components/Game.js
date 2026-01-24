import React, { useEffect, useRef, useState } from 'react';
import Bird from '../game/Bird';
import PipeManager from '../game/PipeManager';
import { playSound, initSounds } from '../utils/sound';
import { drawBackground, drawGround } from '../utils/draw';
import '../styles/Game.css';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GROUND_HEIGHT = 100;

const Game = ({ gameStarted, setGameStarted }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready'); // ready, playing, gameOver
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('flappyBirdHighScore') || '0');
  });
  
  const gameLoopRef = useRef(null);
  const birdRef = useRef(null);
  const pipeManagerRef = useRef(null);
  const groundXRef = useRef(0);

  useEffect(() => {
    initSounds();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Initialize game objects
    birdRef.current = new Bird(CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2);
    pipeManagerRef.current = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT);

    // Handle input events
    const handleJump = (e) => {
      e.preventDefault();
      
      if (gameState === 'ready') {
        setGameState('playing');
        setGameStarted(true);
        playSound('wing');
      } else if (gameState === 'playing') {
        birdRef.current.flap();
        playSound('wing');
      } else if (gameState === 'gameOver') {
        resetGame();
      }
    };

    // Mouse/Touch events
    canvas.addEventListener('click', handleJump);
    canvas.addEventListener('touchstart', handleJump);

    // Keyboard events
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        handleJump(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('click', handleJump);
      canvas.removeEventListener('touchstart', handleJump);
      window.removeEventListener('keydown', handleKeyDown);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameStarted, setGameStarted]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let lastTime = 0;

    const gameLoop = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update
      if (gameState === 'playing') {
        birdRef.current.update();
        pipeManagerRef.current.update();
        groundXRef.current -= 2;
        if (groundXRef.current <= -48) {
          groundXRef.current = 0;
        }

        // Check collision
        const bird = birdRef.current;
        const pipes = pipeManagerRef.current.pipes;

        // Check ground and ceiling collision
        if (bird.y + bird.radius >= CANVAS_HEIGHT - GROUND_HEIGHT || bird.y - bird.radius <= 0) {
          gameOver();
          return;
        }

        // Check pipe collision
        for (let pipe of pipes) {
          if (pipe.checkCollision(bird)) {
            gameOver();
            return;
          }

          // Score when passing pipe
          if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            pipe.passed = true;
            setScore(prevScore => prevScore + 1);
            playSound('point');
          }
        }
      }

      // Draw
      drawBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
      pipeManagerRef.current.draw(ctx);
      drawGround(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, groundXRef.current);
      birdRef.current.draw(ctx);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  const gameOver = () => {
    setGameState('gameOver');
    playSound('hit');
    playSound('die');

    // Update high score
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('flappyBirdHighScore', score.toString());
    }
  };

  const resetGame = () => {
    birdRef.current = new Bird(CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2);
    pipeManagerRef.current = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT);
    groundXRef.current = 0;
    setScore(0);
    setGameState('ready');
    playSound('swoosh');
  };

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="game-canvas"
      />
      
      {/* UI Overlays */}
      <div className="ui-overlay">
        {gameState === 'ready' && (
          <div className="start-screen">
            <h1 className="game-title">Flappy Bird</h1>
            <p className="instruction">点击或按空格开始</p>
            <p className="high-score">最高分: {highScore}</p>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="score-display">{score}</div>
        )}

        {gameState === 'gameOver' && (
          <div className="game-over-screen">
            <h2 className="game-over-title">游戏结束</h2>
            <div className="score-board">
              <div className="score-item">
                <span className="score-label">得分</span>
                <span className="score-value">{score}</span>
              </div>
              <div className="score-item">
                <span className="score-label">最高分</span>
                <span className="score-value">{highScore}</span>
              </div>
            </div>
            <button className="restart-button" onClick={resetGame}>
              重新开始
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
