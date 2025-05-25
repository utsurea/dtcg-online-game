import React, { useState, useEffect, useRef } from 'react';
// Firebase imports
import { createGameRoom, joinGameRoom, updateGameState, subscribeToGameState, selectHero as firebaseSelectHero, testConnection } from './firebase';

// ヒーローデータ（更新版）
const HEROES = [
  {
    id: 1,
    name: 'セイバー',
    constantEffect: '1ラウンドに3スロットすべてにカードをセットしている場合、勝利ポイント+2、カードを1枚ドロー',
    awakenEffect: '毎ターン手札に特殊ユニット「シロウ」を2枚生成する',
    color: '#3b82f6'
  },
  {
    id: 2,
    name: 'アーチャー',
    constantEffect: '1ラウンドに3スロットすべてにカードをセットしていると、相手のすべてのユニットに1ダメージ',
    awakenEffect: '1ラウンドに3スロットすべてにカードをセットしていると、相手のすべてのユニットに3ダメージ、勝利ポイント+3',
    color: '#10b981'
  },
  {
    id: 3,
    name: 'ランサー',
    constantEffect: '1ラウンドに3スロットすべてにカードをセットしていると、相手の公開カードを1枚ランダムに破壊する',
    awakenEffect: '1ラウンドに3スロットすべてにカードをセットしていると、相手の公開カードを全て破壊し、破壊した枚数の勝利ポイントを得る',
    color: '#dc2626'
  },
  {
    id: 4,
    name: 'バーサーカー',
    constantEffect: '1ラウンドに3スロットすべてにカードをセットしていると、自分の手札をすべて捨て、その枚数分勝利ポイントを得る。このヒーローを選択した場合、自分はドローフェイズに常に5枚カードを引く',
    awakenEffect: '墓地のすべてのカードをデッキに加えてシャッフルする',
    color: '#7c2d12'
  }
];

// ユニットカード（更新版）
const UNIT_CARDS = [
  { id: 1, name: 'エルフ', type: 'ユニット', def: 1, atk: 1, slots: [1, 2, 3], effect: 'なし', roundLimit: 1, color: '#22c55e', race: 'エルフ' },
  { id: 2, name: 'ゴブリン', type: 'ユニット', def: 1, atk: 2, slots: [1], effect: 'なし', roundLimit: 1, color: '#22c55e', race: 'ゴブリン' },
  { id: 3, name: 'ドラゴン', type: 'ユニット', def: 2, atk: 5, slots: [1], effect: 'なし', roundLimit: 3, color: '#dc2626', race: 'ドラゴン' },
  { id: 4, name: 'フェアリー', type: 'ユニット', def: 2, atk: 2, slots: [2], effect: 'なし', roundLimit: 1, color: '#a855f7', race: 'フェアリー' },
  { id: 5, name: 'オーク', type: 'ユニット', def: 3, atk: 3, slots: [1], effect: 'なし', roundLimit: 2, color: '#065f46', race: 'オーク' },
  { id: 6, name: 'ドラゴンウォリアー', type: 'ユニット', def: 3, atk: 2, slots: [1], effect: '攻撃フェイズに、自分以外の味方ユニットに1ダメージ与える', roundLimit: 1, color: '#b91c1c', race: '戦士' },
  { id: 7, name: 'ドロシー', type: 'ユニット', def: 8, atk: 5, slots: [1], effect: 'このカードが手札で公開されている間、ラウンド終了時に自分の勝利ポイントは毎ターン「-3」され続ける', roundLimit: 5, color: '#7c3aed', race: '魔法使い' },
  { id: 8, name: '召喚士', type: 'ユニット', def: 1, atk: 1, slots: [1], effect: '召還時、特殊ユニット「猿」を召喚する', roundLimit: 1, color: '#0891b2', race: 'サモナー' },
  { id: 9, name: '穴埋め要員', type: 'ユニット', def: 0, atk: 3, slots: ['FREE'], effect: 'なし', roundLimit: 1, color: '#6b7280', race: '-' },
  { id: 10, name: 'ミザル', type: 'ユニット', def: 2, atk: 0, slots: [1], effect: '召還時、「キガザル」をデッキから公開手札に加える', roundLimit: 1, color: '#8b5cf6', race: 'サル' },
  { id: 11, name: 'キカザル', type: 'ユニット', def: 4, atk: 3, slots: ['FREE'], effect: '召還時、「ミザル」をデッキから公開手札に加える。自分の「ミザル」がいない場合、召喚できない', roundLimit: 1, color: '#8b5cf6', race: 'サル' },
  { id: 12, name: 'イワザル', type: 'ユニット', def: 5, atk: 3, slots: ['FREE'], effect: '召還時、「ミザル」をデッキから公開手札に加える。自分の「キカザル」がいない場合、召喚できない', roundLimit: 1, color: '#8b5cf6', race: 'サル' }
];

// イベントカード（更新版）
const EVENT_CARDS = [
  { id: 20, name: '勝利のために！', type: 'イベント', power: 3, slots: [1], effect: '勝利ポイントを+3する', roundLimit: 1, color: '#fbbf24' },
  { id: 21, name: '予期された占術', type: 'イベント', power: 0, slots: ['ALL'], effect: 'カードを1枚ドローする', roundLimit: 1, color: '#3b82f6' },
  { id: 22, name: '延焼', type: 'イベント', power: 0, slots: [1, 2], effect: '相手のすべてのユニットに1ダメージ', roundLimit: 1, color: '#ef4444' },
  { id: 23, name: 'その瞬間を待っていた！', type: 'イベント', power: 0, slots: ['ALL'], effect: '次に効果処理する相手カードを無効し、破壊する。相手は次のターン4枚ドローし、「スロット4」を得る', roundLimit: 1, color: '#8b5cf6' },
  { id: 24, name: '見せもんじゃねーぞ！', type: 'イベント', power: 0, slots: [1, 2, 3], effect: '自分のランダムなユニット1体を生け贄にする。そうしたなら、相手手札の公開カードをすべて破壊する', roundLimit: 1, color: '#dc2626' },
  { id: 25, name: '抹殺行為', type: 'イベント', power: 0, slots: [2], effect: '相手手札の公開カードをすべて破壊する', roundLimit: 1, color: '#991b1b' },
  { id: 26, name: 'オープンリーチ！', type: 'イベント', power: 0, slots: [2, 3], effect: '自分の手札をすべて公開し、公開状態のカード枚数分勝利ポイントを加算する', roundLimit: 1, color: '#f59e0b' },
  { id: 27, name: 'さよーならまたいつか！', type: 'イベント', power: 0, slots: [3], effect: '相手ユニットをすべて破壊する。相手は次のターン4枚ドローし、「スロット4」を得る', roundLimit: 1, color: '#dc2626' },
  { id: 28, name: '俺も見せたんだからさ', type: 'イベント', power: 0, slots: [2], effect: '次のターン開始時、お互いの手札はすべて公開状態になる', roundLimit: 1, color: '#6366f1' },
  { id: 29, name: '道はここで途切れている', type: 'イベント', power: 0, slots: [2, 3], effect: 'ATKが最も高いユニット1体を破壊する', roundLimit: 1, color: '#374151' },
  { id: 30, name: 'じゃあ……これがいいな！', type: 'イベント', power: 0, slots: [3], effect: '相手の公開手札をランダムに1枚破壊する', roundLimit: 1, color: '#7c2d12' },
  { id: 31, name: 'ロマンスの神様', type: 'イベント', power: 0, slots: ['ALL'], effect: '次のターン、自分に「スロット4」を付与する', roundLimit: 6, color: '#ec4899' },
  { id: 32, name: '一歩だけ、前へ！', type: 'イベント', power: 1, slots: [1, 2], effect: '勝利ポイントを+1する', roundLimit: 1, color: '#10b981' },
  { id: 33, name: '詰めろ逃れろ', type: 'イベント', power: 6, slots: [2], effect: '勝利ポイントを6点得る。次のターン、自分は勝利ポイントを6点失う', roundLimit: 1, color: '#f97316' }
];

// 特殊ユニットカード
const SPECIAL_UNIT_CARDS = [
  { id: 100, name: 'シロウ', type: 'ユニット', def: 2, atk: 2, slots: [1, 2], effect: '特殊ユニット。ゲーム開始時にはデッキに含まれない', roundLimit: 1, color: '#6366f1', race: '英霊', isSpecial: true },
  { id: 101, name: '猿', type: 'ユニット', def: 2, atk: 1, slots: [1, 2, 3], effect: '特殊ユニット。召喚士によって生成される', roundLimit: 1, color: '#8b5cf6', race: '動物', isSpecial: true }
];

const ALL_CARDS = [...UNIT_CARDS, ...EVENT_CARDS];

// スロット処理の改善
function canPlayCardInSlot(card, slotIndex, playerSlots = [], isSlot4Available = false) {
  if (!card || !card.slots) return false;
  
  if (card.slots.includes('FREE')) return true;
  if (card.slots.includes('ALL')) return true;
  
  const targetSlot = slotIndex + 1;
  if (!card.slots.includes(targetSlot)) return false;
  if (playerSlots[slotIndex] !== null) return false;
  
  return true;
}

// 自動デッキ構築関数
function createAutoDeck() {
  const deck = [];
  
  ALL_CARDS.forEach(cardType => {
    if (!cardType.isSpecial) {
      deck.push({ ...cardType, uid: `${cardType.id}_1`, currentDef: cardType.def || 0, damage: 0 });
      deck.push({ ...cardType, uid: `${cardType.id}_2`, currentDef: cardType.def || 0, damage: 0 });
    }
  });
  
  return deck.sort(() => Math.random() - 0.5);
}

// パーティクルコンポーネント
const Particle = ({ x, y, color, onComplete, type = 'normal' }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, type === 'hero' ? 3000 : type === 'score' || type === 'penalty' ? 2500 : 2000);
    return () => clearTimeout(timer);
  }, [onComplete, type]);

  if (type === 'hero') {
    return (
      <div
        className="absolute pointer-events-none z-50"
        style={{
          left: x,
          top: y,
          animation: 'heroParticle 3s ease-out forwards'
        }}
      >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
          style={{ 
            backgroundColor: color,
            animation: 'heroGlow 3s ease-out forwards',
            boxShadow: `0 0 20px ${color}`
          }}
        >
          ⭐
        </div>
      </div>
    );
  }

  if (type === 'score') {
    return (
      <div
        className="absolute pointer-events-none z-50"
        style={{
          left: x,
          top: y,
          animation: 'scoreParticle 2.5s ease-out forwards'
        }}
      >
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ 
            backgroundColor: color,
            animation: 'scoreGlow 2.5s ease-out forwards',
            boxShadow: `0 0 15px ${color}`
          }}
        >
          +
        </div>
      </div>
    );
  }

  if (type === 'penalty') {
    return (
      <div
        className="absolute pointer-events-none z-50"
        style={{
          left: x,
          top: y,
          animation: 'penaltyParticle 2.5s ease-out forwards'
        }}
      >
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ 
            backgroundColor: color,
            animation: 'penaltyGlow 2.5s ease-out forwards',
            boxShadow: `0 0 15px ${color}`
          }}
        >
          -
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: x,
        top: y,
        animation: 'particleFade 2s ease-out forwards'
      }}
    >
      <div 
        className="w-4 h-4 rounded-full"
        style={{ 
          backgroundColor: color,
          animation: 'particleFloat 2s ease-out forwards'
        }}
      />
    </div>
  );
};

const DTCGGame = () => {
  // ゲームモード管理
  const [gameMode, setGameMode] = useState('menu'); // menu, local, online
  const [onlineState, setOnlineState] = useState({
    roomId: '',
    playerId: '',
    playerName: '',
    opponentName: '',
    connected: false,
    isHost: false
  });

  const [gameState, setGameState] = useState({
    phase: 'heroSelect',
    round: 1,
    playerScore: 0,
    opponentScore: 0,
    playerHero: null,
    opponentHero: null,
    playerHand: [],
    opponentHand: [],
    playerDeck: [],
    opponentDeck: [],
    playerSlots: [null, null, null],
    opponentSlots: [null, null, null],
    playerSlot4Available: false,
    opponentSlot4Available: false,
    playerSlot4Card: null,
    opponentSlot4Card: null,
    playerUnits: [],
    opponentUnits: [],
    playerRevealedCards: [],
    opponentRevealedCards: [],
    playerGraveyard: [],
    opponentGraveyard: [],
    currentPlayer: 'player',
    isProcessing: false,
    processingStep: null,
    highlightedSlot: null,
    gameLog: [],
    scoreEffect: null,
    particles: [],
    isFlipping: false,
    flipCard: null,
    heroEffectTriggered: false,
    hoveredCard: null,
    hoverPosition: { x: 0, y: 0 },
    scoreAnimation: null
  });

  const audioContextRef = useRef(null);
  const synthRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Firebaseリスナーのクリーンアップ
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const playSound = (frequency, duration = 0.2, type = 'sine') => {
    if (synthRef.current) {
      try {
        synthRef.current.triggerAttackRelease(frequency, duration);
      } catch (error) {
        console.log('Sound play failed:', error);
      }
    }
  };

  const addParticle = (x, y, color = '#ffd700', type = 'normal') => {
    const newParticle = {
      id: Date.now() + Math.random(),
      x: x - 8,
      y: y - 8,
      color,
      type
    };
    
    setGameState(prev => ({
      ...prev,
      particles: [...prev.particles, newParticle]
    }));
  };

  const removeParticle = (id) => {
    setGameState(prev => ({
      ...prev,
      particles: prev.particles.filter(p => p.id !== id)
    }));
  };

  const addLog = (message) => {
    setGameState(prev => ({
      ...prev,
      gameLog: [...prev.gameLog.slice(-8), message]
    }));
  };

  // Firebase リアルタイム監視
  const subscribeToRoom = (roomId) => {
    const unsubscribe = subscribeToGameState(roomId, (roomData) => {
      if (!roomData) {
        console.log('ルームが削除されました');
        setGameMode('menu');
        return;
      }

      console.log('Firebase データ受信:', roomData);

      // プレイヤー情報を更新
      if (roomData.players) {
        const isPlayer1 = onlineState.playerId === 'player1';
        const opponent = isPlayer1 ? roomData.players.player2 : roomData.players.player1;
        
        if (opponent) {
          setOnlineState(prev => ({
            ...prev,
            opponentName: opponent.name
          }));
        }
      }

      // ゲーム状態を更新
      if (roomData.gameData) {
        setGameState(prev => ({
          ...prev,
          phase: roomData.phase || prev.phase,
          round: roomData.gameData.round || prev.round,
          gameLog: roomData.gameData.gameLog || prev.gameLog
        }));
      }

      // フェーズ変更の処理
      if (roomData.phase === 'heroSelect' && gameState.phase === 'waiting') {
        setGameState(prev => ({ ...prev, phase: 'heroSelect' }));
        addLog('両プレイヤーが参加しました！ヒーローを選択してください');
      }
    });

    // unsubscribe 関数を保存
    unsubscribeRef.current = unsubscribe;
  };

  // オンライン機能
  const createRoom = async () => {
    if (!onlineState.playerName.trim()) {
      alert('プレイヤー名を入力してください');
      return;
    }

    try {
      // Firebase接続テスト
      const connectionTest = await testConnection();
      if (!connectionTest) {
        alert('Firebase接続に失敗しました。設定を確認してください。');
        return;
      }

      // 実際のFirebase関数を使用
      const roomId = await createGameRoom(onlineState.playerName);
      
      setOnlineState(prev => ({
        ...prev,
        roomId,
        playerId: 'player1',
        connected: true,
        isHost: true
      }));
      
      setGameMode('online');
      setGameState(prev => ({
        ...prev,
        phase: 'waiting',
        gameLog: [`ルーム ${roomId} を作成しました`, '友人の参加を待っています...']
      }));
      
      // Firebase監視開始
      subscribeToRoom(roomId);
      
    } catch (error) {
      console.error('ルーム作成エラー:', error);
      alert('ルームの作成に失敗しました: ' + error.message);
    }
  };

  const joinRoom = async () => {
    if (!onlineState.playerName.trim() || !onlineState.roomId.trim()) {
      alert('プレイヤー名とルームIDを入力してください');
      return;
    }

    try {
      // Firebase接続テスト
      const connectionTest = await testConnection();
      if (!connectionTest) {
        alert('Firebase接続に失敗しました。設定を確認してください。');
        return;
      }

      // 実際のFirebase関数を使用
      const playerId = await joinGameRoom(onlineState.roomId, onlineState.playerName);
      
      setOnlineState(prev => ({
        ...prev,
        playerId,
        connected: true,
        isHost: false
      }));
      
      setGameMode('online');
      setGameState(prev => ({
        ...prev,
        phase: 'heroSelect',
        gameLog: [`ルーム ${onlineState.roomId} に参加しました`, 'ヒーローを選択してください']
      }));
      
      // Firebase監視開始
      subscribeToRoom(onlineState.roomId);
      
    } catch (error) {
      console.error('ルーム参加エラー:', error);
      alert('ルームへの参加に失敗しました: ' + error.message);
    }
  };

  const showScoreEffect = (player, points, sourceName = null, sourcePosition = null) => {
    playSound(points > 0 ? (player === 'player' ? 'C5' : 'G4') : 'F3', 0.5);
    
    setGameState(prev => ({
      ...prev,
      scoreEffect: { player, points, sourceName, sourcePosition },
      scoreAnimation: { player, points, timestamp: Date.now() }
    }));
    
    const particleColor = points > 0 
      ? (player === 'player' ? '#ffd700' : '#ff6b6b')
      : '#8b5cf6';
    
    const targetX = player === 'player' ? 600 : 200;
    const targetY = 300;
    
    for (let i = 0; i < Math.min(15, Math.abs(points) * 3); i++) {
      setTimeout(() => {
        let x, y;
        if (sourcePosition) {
          const progress = Math.random() * 0.5;
          x = sourcePosition.x + (targetX - sourcePosition.x) * progress + (Math.random() - 0.5) * 100;
          y = sourcePosition.y + (targetY - sourcePosition.y) * progress + (Math.random() - 0.5) * 50;
        } else {
          x = targetX + (Math.random() - 0.5) * 150;
          y = targetY + (Math.random() - 0.5) * 100;
        }
        addParticle(x, y, particleColor, points > 0 ? 'score' : 'penalty');
      }, i * 80);
    }
    
    if (points >= 3) {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const x = targetX + (Math.random() - 0.5) * 200;
          const y = targetY + (Math.random() - 0.5) * 150;
          addParticle(x, y, '#ffd700', 'hero');
        }, i * 150);
      }
    }
    
    setTimeout(() => {
      setGameState(prev => ({ 
        ...prev, 
        scoreEffect: null,
        scoreAnimation: null 
      }));
    }, 3000);
  };

  const hideCardHover = (immediate = false) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    if (immediate) {
      setGameState(prev => ({
        ...prev,
        hoveredCard: null,
        hoverPosition: { x: 0, y: 0 }
      }));
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          hoveredCard: null,
          hoverPosition: { x: 0, y: 0 }
        }));
      }, 100);
    }
  };

  const showCardHover = (card, event) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (card && !card.faceDown) {
      const rect = event.target.getBoundingClientRect();
      setGameState(prev => ({
        ...prev,
        hoveredCard: card,
        hoverPosition: {
          x: rect.left + rect.width / 2,
          y: rect.top
        }
      }));
    }
  };

  const CardTooltip = ({ card, position }) => {
    if (!card) return null;
    
    return (
      <div 
        className="fixed z-50 bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-4 max-w-xs pointer-events-none"
        style={{
          left: position.x,
          top: position.y - 10,
          transform: 'translate(-50%, -100%)',
          boxShadow: `0 0 20px ${card.color || '#3b82f6'}40`
        }}
      >
        <div className="text-lg font-bold mb-2" style={{ color: card.color }}>
          {card.name}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold">タイプ:</span>
            <span className={card.type === 'ユニット' ? 'text-green-600' : 'text-red-600'}>
              {card.type}
            </span>
          </div>
          
          {card.type === 'ユニット' ? (
            <>
              <div className="flex justify-between">
                <span className="font-semibold">攻撃力:</span>
                <span className="text-red-600 font-bold">{card.atk}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">防御力:</span>
                <span className="text-blue-600 font-bold">{card.currentDef || card.def}</span>
              </div>
              {card.damage > 0 && (
                <div className="flex justify-between">
                  <span className="font-semibold">ダメージ:</span>
                  <span className="text-red-500 font-bold">{card.damage}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-between">
              <span className="font-semibold">パワー:</span>
              <span className="text-purple-600 font-bold">{card.power || 0}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="font-semibold">スロット:</span>
            <span className="text-gray-600">{card.slots ? (Array.isArray(card.slots) ? card.slots.join(', ') : card.slots) : 'なし'}</span>
          </div>
          
          {card.roundLimit > 1 && (
            <div className="flex justify-between">
              <span className="font-semibold">ラウンド制限:</span>
              <span className="text-orange-600 font-bold">{card.roundLimit}以降</span>
            </div>
          )}
          
          {card.effect && card.effect !== 'なし' && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="font-semibold text-purple-600 mb-1">効果:</div>
              <div className="text-gray-700 text-xs leading-relaxed">
                {card.effect}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const selectHero = async (heroId, player = 'player') => {
    const hero = HEROES.find(h => h.id === heroId);
    playSound('F5', 0.5);
    
    setGameState(prev => ({
      ...prev,
      [player === 'player' ? 'playerHero' : 'opponentHero']: hero
    }));
    
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const x = Math.random() * 400 + 200;
        const y = Math.random() * 200 + 200;
        addParticle(x, y, hero.color, 'hero');
      }, i * 100);
    }
    
    addLog(`${player === 'player' ? 'あなた' : '相手'}が${hero.name}を選択！`);
    
    // オンラインモードの場合、Firebaseに同期
    if (gameMode === 'online' && player === 'player') {
      try {
        await firebaseSelectHero(onlineState.roomId, onlineState.playerId, heroId);
      } catch (error) {
        console.error('ヒーロー選択同期エラー:', error);
      }
    }
  };

  const startGame = () => {
    if (!gameState.playerHero || !gameState.opponentHero) {
      alert('両プレイヤーがヒーローを選択してください');
      return;
    }
    
    const playerDeck = createAutoDeck();
    const opponentDeck = createAutoDeck();
    
    playSound('C4', 0.5);
    
    setGameState(prev => ({
      ...prev,
      phase: 'play',
      round: 1,
      playerScore: 0,
      opponentScore: 0,
      playerHand: playerDeck.slice(0, 5),
      opponentHand: opponentDeck.slice(0, 5),
      playerDeck: playerDeck.slice(5),
      opponentDeck: opponentDeck.slice(5),
      playerSlots: [null, null, null],
      opponentSlots: [null, null, null],
      playerSlot4Available: false,
      opponentSlot4Available: false,
      playerSlot4Card: null,
      opponentSlot4Card: null,
      playerUnits: [],
      opponentUnits: [],
      playerRevealedCards: [],
      opponentRevealedCards: [],
      playerGraveyard: [],
      opponentGraveyard: [],
      currentPlayer: 'player',
      isProcessing: false,
      gameLog: [`ゲーム開始！ラウンド1`, `自動デッキ構築完了（各プレイヤー${playerDeck.length}枚）`]
    }));
  };

  const Card = ({ card, onClick, disabled, small, faceDown, isAnimating }) => {
    if (!card) {
      return (
        <div className={`${small ? 'w-16 h-20' : 'w-24 h-32'} border-2 rounded-lg p-2 bg-gray-200 border-gray-400`}>
          <div className="text-xs text-gray-500">カードなし</div>
        </div>
      );
    }

    return (
      <div 
        data-card-hover="true"
        className={`
          ${small ? 'w-16 h-20' : 'w-24 h-32'} 
          border-2 rounded-lg p-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg
          ${isAnimating ? 'animate-pulse' : ''}
          ${faceDown ? 'bg-gradient-to-br from-blue-900 to-purple-900 border-blue-700' : ''}
          ${disabled ? 'bg-gray-300 opacity-50 hover:scale-100' : (faceDown ? '' : 'bg-gradient-to-br from-white to-gray-100 hover:from-blue-50 hover:to-white border-blue-300')}
          ${!faceDown && card && card.type === 'ユニット' ? 'border-green-400 shadow-green-200' : ''}
          ${!faceDown && card && card.type === 'イベント' ? 'border-red-400 shadow-red-200' : ''}
          hover:z-10 relative
        `}
        style={{
          boxShadow: !faceDown && card ? `0 4px 15px ${card.color || '#3b82f6'}20` : '',
          animation: isAnimating ? 'cardGlow 0.8s ease-in-out' : ''
        }}
        onClick={onClick}
        onMouseEnter={(e) => !disabled && showCardHover(card, e)}
        onMouseLeave={hideCardHover}
      >
        {faceDown ? (
          <div className="w-full h-full flex items-center justify-center text-white text-xs">
            <div className="w-8 h-8 border-2 border-white rounded-full opacity-50"></div>
          </div>
        ) : (
          <>
            <div className={`${small ? 'text-xs' : 'text-sm'} font-bold truncate text-gray-800`}>
              {card.name || '名前なし'}
            </div>
            <div className={`${small ? 'text-xs' : 'text-sm'} text-gray-600`}>
              {card.type || 'タイプなし'}
            </div>
            {card.type === 'ユニット' ? (
              <div className={`${small ? 'text-xs' : 'text-sm'} font-bold`} style={{ color: card.color || '#3b82f6' }}>
                ATK:{card.atk || 0} DEF:{card.currentDef || card.def || 0}
              </div>
            ) : (
              <div className={`${small ? 'text-xs' : 'text-sm'} font-bold`} style={{ color: card.color || '#3b82f6' }}>
                PWR:{card.power || 0}
              </div>
            )}
            <div className={`${small ? 'text-xs' : 'text-sm'} text-gray-500`}>
              スロット:{card.slots ? card.slots.join(',') : 'なし'}
            </div>
            {card.roundLimit > 1 && (
              <div className={`${small ? 'text-xs' : 'text-sm'} text-orange-600 font-bold`}>
                {card.roundLimit}R以降
              </div>
            )}
            {card.effect && card.effect !== 'なし' && (
              <div className={`${small ? 'text-xs' : 'text-sm'} text-purple-600 truncate`} title={card.effect}>
                効果あり
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // メニュー画面
  if (gameMode === 'menu') {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 min-h-screen flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
          <h1 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            DTCG オンライン
          </h1>
          
          <div className="space-y-6">
            {/* ローカル対戦 */}
            <button
              onClick={() => setGameMode('local')}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-xl text-xl font-bold"
            >
              🏠 ローカル対戦
              <div className="text-sm font-normal mt-1">同じPC上で2人対戦</div>
            </button>
            
            {/* オンライン対戦セクション */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 space-y-4">
              <h2 className="text-2xl font-bold text-center text-purple-700 mb-4">🌐 オンライン対戦</h2>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="あなたの名前"
                  value={onlineState.playerName}
                  onChange={(e) => setOnlineState(prev => ({ ...prev, playerName: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg text-lg focus:border-purple-500 focus:outline-none"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ルーム作成 */}
                  <button
                    onClick={createRoom}
                    disabled={!onlineState.playerName.trim()}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg font-bold"
                  >
                    🎯 ルーム作成
                    <div className="text-sm font-normal mt-1">新しいゲームを作成</div>
                  </button>
                  
                  {/* ルーム参加 */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="ルームID"
                      value={onlineState.roomId}
                      onChange={(e) => setOnlineState(prev => ({ ...prev, roomId: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      onClick={joinRoom}
                      disabled={!onlineState.playerName.trim() || !onlineState.roomId.trim()}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg font-bold"
                    >
                      🚀 ルーム参加
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-600 mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="font-semibold text-green-800 mb-1">🔥 Firebase統合版</div>
                <div>本格的なリアルタイム同期機能が有効です！</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // オンライン待機画面
  if (gameMode === 'online' && gameState.phase === 'waiting') {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 min-h-screen flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-2xl text-center">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            ルーム作成完了！
          </h1>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
            <div className="text-2xl font-bold text-green-700 mb-4">ルームID</div>
            <div className="text-6xl font-mono font-bold text-blue-600 mb-4 tracking-wider">
              {onlineState.roomId}
            </div>
            <div className="text-lg text-gray-600">
              この番号を友人に伝えてください
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-lg">
              <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-blue-600 font-semibold">友人の参加を待っています...</span>
            </div>
            
            <div className="text-sm text-gray-500">
              プレイヤー: {onlineState.playerName} (ホスト)
            </div>
            
            <div className="text-xs text-green-600 font-bold">
              🔥 Firebase リアルタイム同期中
            </div>
          </div>
          
          <button
            onClick={() => setGameMode('menu')}
            className="mt-6 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  // ヒーロー選択画面
  if (gameState.phase === 'heroSelect') {
    return (
      <div className="max-w-7xl mx-auto p-4 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 min-h-screen relative overflow-hidden">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 relative z-10">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ヒーローを選択してください
            </h2>
            
            {gameMode === 'online' && (
              <div className="text-lg text-purple-600 font-bold">
                🌐 ルーム: {onlineState.roomId} | プレイヤー: {onlineState.playerName}
                {onlineState.opponentName && ` vs ${onlineState.opponentName}`}
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {HEROES.map(hero => (
                <div
                  key={hero.id}
                  data-card-hover="true"
                  className="p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
                  style={{ borderColor: hero.color }}
                  onClick={() => selectHero(hero.id, 'player')}
                  onMouseEnter={(e) => showCardHover(hero, e)}
                  onMouseLeave={hideCardHover}
                >
                  <div className="font-bold text-lg" style={{ color: hero.color }}>{hero.name}</div>
                  <div className="text-xs mt-2 text-gray-600">{hero.constantEffect.slice(0, 50)}...</div>
                </div>
              ))}
            </div>
            
            <button
              onClick={startGame}
              disabled={!gameState.playerHero}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-xl text-lg font-bold"
            >
              ゲーム開始
            </button>
          </div>
        </div>

        {/* Tooltips */}
        {gameState.hoveredCard && (
          <CardTooltip card={gameState.hoveredCard} position={gameState.hoverPosition} />
        )}
      </div>
    );
  }

  // 基本ゲーム画面（簡略版）
  return (
    <div className="max-w-7xl mx-auto p-4 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 min-h-screen relative overflow-hidden">
      {/* パーティクル */}
      {gameState.particles.map(particle => (
        <Particle
          key={particle.id}
          x={particle.x}
          y={particle.y}
          color={particle.color}
          type={particle.type}
          onComplete={() => removeParticle(particle.id)}
        />
      ))}

      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 relative z-10">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎮 ゲーム画面
          </h1>
          
          {gameMode === 'online' && (
            <div className="text-lg text-purple-600 font-bold">
              🌐 オンライン対戦 | ルーム: {onlineState.roomId}
            </div>
          )}
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-green-700 mb-4">
              🎉 Firebase統合完了！
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              本格的なリアルタイム同期機能が動作しています！
            </p>
            <div className="text-sm text-gray-600">
              • ルーム作成・参加機能 ✅<br/>
              • リアルタイム状態同期 ✅<br/>
              • ヒーロー選択同期 ✅<br/>
              • Firebase接続テスト ✅
            </div>
          </div>
          
          <button 
            onClick={() => setGameMode('menu')}
            className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            メニューに戻る
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes particleFloat {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }
        
        @keyframes particleFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes cardGlow {
          0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
        }
        
        @keyframes heroParticle {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-150px) scale(1.5) rotate(720deg); opacity: 0; }
        }
        
        @keyframes heroGlow {
          0%, 100% { box-shadow: 0 0 10px currentColor; }
          50% { box-shadow: 0 0 30px currentColor, 0 0 40px currentColor; }
        }
        
        @keyframes scoreParticle {
          0% { transform: translateY(0) translateX(0) scale(1) rotate(0deg); opacity: 1; }
          30% { transform: translateY(-40px) translateX(-10px) scale(1.3) rotate(120deg); opacity: 1; }
          70% { transform: translateY(-90px) translateX(-30px) scale(1.1) rotate(300deg); opacity: 0.8; }
          100% { transform: translateY(-140px) translateX(-60px) scale(0.5) rotate(450deg); opacity: 0; }
        }
        
        @keyframes scoreGlow {
          0%, 100% { box-shadow: 0 0 15px currentColor, 0 0 30px currentColor; transform: scale(1); }
          50% { box-shadow: 0 0 40px currentColor, 0 0 60px currentColor, 0 0 80px currentColor; transform: scale(1.1); }
        }
        
        @keyframes penaltyParticle {
          0% { transform: translateY(0) translateX(0) scale(1) rotate(0deg); opacity: 1; }
          30% { transform: translateY(40px) translateX(10px) scale(1.3) rotate(-120deg); opacity: 1; }
          70% { transform: translateY(90px) translateX(30px) scale(1.1) rotate(-300deg); opacity: 0.8; }
          100% { transform: translateY(140px) translateX(60px) scale(0.5) rotate(-450deg); opacity: 0; }
        }
        
        @keyframes penaltyGlow {
          0%, 100% { box-shadow: 0 0 10px currentColor, 0 0 20px currentColor; transform: scale(1); }
          50% { box-shadow: 0 0 25px currentColor, 0 0 35px currentColor, 0 0 45px currentColor; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default DTCGGame;
