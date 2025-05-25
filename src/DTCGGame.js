import React, { useState } from 'react';

const DTCGGame = () => {
  const [gameMode, setGameMode] = useState('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');

  const createRoom = () => {
    if (!playerName.trim()) {
      alert('プレイヤー名を入力してください');
      return;
    }
    const newRoomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    setRoomId(newRoomId);
    setGameMode('waiting');
  };

  if (gameMode === 'menu') {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '3rem',
            marginBottom: '40px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🎮 DTCG オンライン
          </h1>
          
          <div style={{ marginBottom: '30px' }}>
            <input
              type="text"
              placeholder="あなたの名前"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '18px',
                border: '2px solid #8b5cf6',
                borderRadius: '10px',
                marginBottom: '20px',
                boxSizing: 'border-box'
              }}
            />
            
            <button
              onClick={createRoom}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                padding: '20px',
                fontSize: '20px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                marginBottom: '15px'
              }}
            >
              🎯 ルーム作成
            </button>
            
            <div style={{
              background: '#fef3c7',
              padding: '15px',
              borderRadius: '10px',
              fontSize: '14px',
              color: '#92400e'
            }}>
              💡 友達と一緒にプレイできるシンプル版です！
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameMode === 'waiting') {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '40px',
        background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#10b981', marginBottom: '30px' }}>
            ✅ ルーム作成完了！
          </h1>
          
          <div style={{
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#1d4ed8',
            marginBottom: '20px',
            letterSpacing: '5px'
          }}>
            {roomId}
          </div>
          
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            📋 この番号を友達に伝えてください
          </p>
          
          <p style={{ color: '#6b7280', marginBottom: '30px' }}>
            プレイヤー: {playerName}
          </p>
          
          <button
            onClick={() => {
              setGameMode('game');
            }}
            style={{
              background: '#10b981',
              color: 'white',
              padding: '15px 30px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            ゲーム開始
          </button>
          
          <button
            onClick={() => setGameMode('menu')}
            style={{
              background: '#6b7280',
              color: 'white',
              padding: '15px 30px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px',
      background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)',
      minHeight: '100vh',
      color: 'white',
      textAlign: 'center'
    }}>
      <h1>🎮 ゲーム画面</h1>
      <p>ルーム: {roomId}</p>
      <p>プレイヤー: {playerName}</p>
      <p>基本機能完成！友達とテストできます 🎉</p>
      <button
        onClick={() => setGameMode('menu')}
        style={{
          background: '#6b7280',
          color: 'white',
          padding: '15px 30px',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer'
        }}
      >
        メニューに戻る
      </button>
    </div>
  );
};

export default DTCGGame;
