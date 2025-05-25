// firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, push, serverTimestamp, off } from 'firebase/database';

// Firebase設定（環境変数から取得）
const firebaseConfig = {
  apiKey: "AIzaSyAbRqRKuWC-FSUeh8xeQGeUnhdFwICxw50",
  authDomain: "dtcg-ab99c.firebaseapp.com",
  databaseURL: "https://dtcg-ab99c-default-rtdb.firebaseio.com",
  projectId: "dtcg-ab99c",
  storageBucket: "dtcg-ab99c.firebasestorage.app",
  messagingSenderId: "297281620080",
  appId: "1:297281620080:web:48f22a13321c6493c1ccb5"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ルームIDの生成
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 接続テスト
export async function testConnection() {
  try {
    const testRef = ref(database, '.info/connected');
    const snapshot = await get(testRef);
    console.log('Firebase接続テスト:', snapshot.exists());
    return true;
  } catch (error) {
    console.error('Firebase接続エラー:', error);
    return false;
  }
}

// ゲームルーム作成
export async function createGameRoom(playerName) {
  try {
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
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      throw new Error('ルームが見つかりません');
    }
    
    const roomData = snapshot.val();
    
    if (roomData.players.player2) {
      throw new Error('ルームは満員です');
    }
    
    // プレイヤー2として参加
    const updateData = {
      [`rooms/${roomId}/players/player2`]: {
        id: 'player2',
        name: playerName,
        connected: true,
        hero: null,
        ready: false
      },
      [`rooms/${roomId}/phase`]: 'heroSelect',
      [`rooms/${roomId}/gameData/gameLog`]: [
        ...roomData.gameData.gameLog,
        `${playerName} が参加しました`,
        'ヒーローを選択してください'
      ]
    };
    
    await set(ref(database), updateData);
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
    const updateData = {
      [`rooms/${roomId}/players/${playerId}/hero`]: heroId,
      [`rooms/${roomId}/players/${playerId}/ready`]: true
    };
    
    await set(ref(database), updateData);
    
    // 両プレイヤーの準備状況を確認
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    const roomData = snapshot.val();
    
    if (roomData.players.player1?.ready && roomData.players.player2?.ready) {
      // 両プレイヤーが準備完了したらゲーム開始
      await set(ref(database, `rooms/${roomId}/phase`), 'gameStart');
      
      // ゲームログ更新
      const newLog = [
        ...roomData.gameData.gameLog,
        '両プレイヤーの準備が完了しました',
        'ゲーム開始！'
      ];
      await set(ref(database, `rooms/${roomId}/gameData/gameLog`), newLog);
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
    const updateData = {
      [`rooms/${roomId}/gameData`]: gameData,
      [`rooms/${roomId}/lastUpdate`]: serverTimestamp()
    };
    
    await set(ref(database), updateData);
    console.log('ゲーム状態を更新しました');
  } catch (error) {
    console.error('ゲーム状態更新エラー:', error);
    throw error;
  }
}

// ゲーム状態監視
export function subscribeToGameState(roomId, callback) {
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
    const roomRef = ref(database, `rooms/${roomId}`);
    await set(roomRef, null);
    console.log(`ルーム ${roomId} を削除しました`);
  } catch (error) {
    console.error('ルーム削除エラー:', error);
    throw error;
  }
}
