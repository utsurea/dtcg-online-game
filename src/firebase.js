{
  `content`: `// firebase.js - 修正版
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, push, serverTimestamp, off } from 'firebase/database';

// Firebase設定（環境変数から取得）
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Firebase初期化
let app;
let database;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log('Firebase初期化成功');
} catch (error) {
  console.error('Firebase初期化エラー:', error);
}

// ルームIDの生成
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 接続テスト（簡略版）
export async function testConnection() {
  try {
    if (!database) {
      console.error('Database が初期化されていません');
      return false;
    }
    
    // 簡単な書き込みテストを実行
    const testRef = ref(database, 'test/connection');
    await set(testRef, { timestamp: Date.now() });
    console.log('Firebase接続テスト成功');
    return true;
  } catch (error) {
    console.error('Firebase接続エラー:', error);
    return false;
  }
}

// ゲームルーム作成
export async function createGameRoom(playerName) {
  try {
    if (!database) {
      throw new Error('Database が初期化されていません');
    }
    
    const roomId = generateRoomId();
    const roomRef = ref(database, `rooms/${roomId}`);
    
    const roomData = {
      id: roomId,
      createdAt: serverTimestamp(),
      phase: 'waiting',
      players: {
        player1: {
          id: 'player1',
          name: playerName,
          connected: true,
          hero: null,
          ready: false
        }
      },
      gameData: {
        round: 1,
        gameLog: [`ルーム ${roomId} を作成しました`, '友人の参加を待っています...']
      }
    };
    
    await set(roomRef, roomData);
    console.log(`ルーム ${roomId} を作成しました`);
    return roomId;
  } catch (error) {
    console.error('ルーム作成エラー:', error);
    throw error;
  }
}

// ゲームルーム参加
export async function joinGameRoom(roomId, playerName) {
  try {
    if (!database) {
      throw new Error('Database が初期化されていません');
    }
    
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      throw new Error('ルームが見つかりません');
    }
    
    const roomData = snapshot.val();
    
    if (roomData.players && roomData.players.player2) {
      throw new Error('ルームは満員です');
    }
    
    // プレイヤー2として参加
    const player2Ref = ref(database, `rooms/${roomId}/players/player2`);
    await set(player2Ref, {
      id: 'player2',
      name: playerName,
      connected: true,
      hero: null,
      ready: false
    });
    
    // フェーズを更新
    const phaseRef = ref(database, `rooms/${roomId}/phase`);
    await set(phaseRef, 'heroSelect');
    
    // ログを更新
    const logRef = ref(database, `rooms/${roomId}/gameData/gameLog`);
    const currentLog = roomData.gameData?.gameLog || [];
    await set(logRef, [
      ...currentLog,
      `${playerName} が参加しました`,
      'ヒーローを選択してください'
    ]);
    
    console.log(`ルーム ${roomId} に参加しました`);
    return 'player2';
  } catch (error) {
    console.error('ルーム参加エラー:', error);
    throw error;
  }
}

// ヒーロー選択
export async function selectHero(roomId, playerId, heroId) {
  try {
    if (!database) {
      throw new Error('Database が初期化されていません');
    }
    
    // ヒーロー選択を更新
    const heroRef = ref(database, `rooms/${roomId}/players/${playerId}/hero`);
    await set(heroRef, heroId);
    
    const readyRef = ref(database, `rooms/${roomId}/players/${playerId}/ready`);
    await set(readyRef, true);
    
    // 両プレイヤーの準備状況を確認
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    const roomData = snapshot.val();
    
    if (roomData.players?.player1?.ready && roomData.players?.player2?.ready) {
      // 両プレイヤーが準備完了したらゲーム開始
      const phaseRef = ref(database, `rooms/${roomId}/phase`);
      await set(phaseRef, 'gameStart');
      
      // ゲームログ更新
      const logRef = ref(database, `rooms/${roomId}/gameData/gameLog`);
      const currentLog = roomData.gameData?.gameLog || [];
      await set(logRef, [
        ...currentLog,
        '両プレイヤーの準備が完了しました',
        'ゲーム開始！'
      ]);
    }
    
    console.log(`ヒーロー選択完了: ${playerId} -> ${heroId}`);
  } catch (error) {
    console.error('ヒーロー選択エラー:', error);
    throw error;
  }
}

// ゲーム状態更新
export async function updateGameState(roomId, gameData) {
  try {
    if (!database) {
      throw new Error('Database が初期化されていません');
    }
    
    const gameDataRef = ref(database, `rooms/${roomId}/gameData`);
    await set(gameDataRef, gameData);
    
    const updateRef = ref(database, `rooms/${roomId}/lastUpdate`);
    await set(updateRef, serverTimestamp());
    
    console.log('ゲーム状態を更新しました');
  } catch (error) {
    console.error('ゲーム状態更新エラー:', error);
    throw error;
  }
}

// ゲーム状態監視
export function subscribeToGameState(roomId, callback) {
  if (!database) {
    console.error('Database が初期化されていません');
    return () => {};
  }
  
  const roomRef = ref(database, `rooms/${roomId}`);
  
  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      console.log('Firebase データ受信:', roomData);
      callback(roomData);
    } else {
      console.log('ルームが削除されました');
      callback(null);
    }
  }, (error) => {
    console.error('Firebase監視エラー:', error);
    callback(null);
  });
  
  // クリーンアップ関数を返す
  return () => {
    off(roomRef);
    console.log('Firebase監視を停止しました');
  };
}

// ルーム削除（オプション）
export async function deleteRoom(roomId) {
  try {
    if (!database) {
      throw new Error('Database が初期化されていません');
    }
    
    const roomRef = ref(database, `rooms/${roomId}`);
    await set(roomRef, null);
    console.log(`ルーム ${roomId} を削除しました`);
  } catch (error) {
    console.error('ルーム削除エラー:', error);
    throw error;
  }
}`,
  `filename`: `firebase_fixed.js`
}
