import React, { useState } from 'react';
import Game from './components/Game';
import './styles/App.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <div className="app">
      <Game gameStarted={gameStarted} setGameStarted={setGameStarted} />
    </div>
  );
}

export default App;
