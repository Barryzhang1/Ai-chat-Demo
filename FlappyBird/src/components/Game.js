import React, { useEffect, useRef, useState } from 'react';
import Bird from '../game/Bird';
import PipeManager from '../game/PipeManager';
import { playSound, initSounds } from '../utils/sound';
import { drawBackground, drawGround } from '../utils/draw';
import {
  submitGameScore,
  getPlayerName,
  savePlayerName,
  generateAnonymousName,
} from '../services/gameScoreService';
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
  const [rank, setRank] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const gameStartTimeRef = useRef(null);
  const scoreRef = useRef(0); // 用于存储最新的score值
  
  const gameLoopRef = useRef(null);
  const birdRef = useRef(null);
  const pipeManagerRef = useRef(null);
  const groundXRef = useRef(0);

  // 同步score到scoreRef，确保始终获取最新值
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

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
        gameStartTimeRef.current = Date.now();
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

  const gameOver = async () => {
    setGameState('gameOver');
    playSound('hit');
    playSound('die');

    // 使用scoreRef获取最新分数
    const currentScore = scoreRef.current;

    // Update high score
    if (currentScore > highScore) {
      setHighScore(currentScore);
      localStorage.setItem('flappyBirdHighScore', currentScore.toString());
    }

    // 提交分数到后端
    await submitScore(currentScore);
  };

  const submitScore = async (finalScore) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 获取或生成玩家名称
      let playerName = getPlayerName();
      let playerId = null;
      
      if (!playerName) {
        // 未登录且没有匿名名称，生成一个
        playerName = generateAnonymousName();
        savePlayerName(playerName);
      } else {
        // 检查是否为登录用户
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          try {
            const user = JSON.parse(userInfo);
            playerId = user.userId;
          } catch (e) {
            console.warn('解析用户信息失败:', e);
          }
        }
      }

      // 计算游戏时长
      const playTime = gameStartTimeRef.current
        ? Math.floor((Date.now() - gameStartTimeRef.current) / 1000)
        : 0;

      // 提交分数
      const scoreData = {
        playerName,
        score: finalScore,
        gameType: 'FlappyBird',
        playTime,
      };
      
      // 如果是登录用户，添加playerId
      if (playerId) {
        scoreData.playerId = playerId;
      }
      
      const result = await submitGameScore(scoreData);

      if (result && result.data) {
        setRank(result.data.rank);
      } else {
        console.warn('响应格式异常:', result);
      }
    } catch (error) {
      console.error('❌ 提交分数失败:', error);
      console.error('错误详情:', error.message);
      setSubmitError('分数提交失败，已保存到本地');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetGame = () => {
    birdRef.current = new Bird(CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2);
    pipeManagerRef.current = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT);
    groundXRef.current = 0;
    setScore(0);
    setRank(null);
    setSubmitError(null);
    setGameState('ready');
    gameStartTimeRef.current = null;
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
              {rank && (
                <div className="score-item">
                  <span className="score-label">排名</span>
                  <span className="score-value">#{rank}</span>
                </div>
              )}
            </div>
            {isSubmitting && (
              <p className="submit-status">正在提交分数...</p>
            )}
            {submitError && (
              <p className="submit-error">{submitError}</p>
            )}
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
