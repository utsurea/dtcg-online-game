import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  push, 
  serverTimestamp,
  update,
  remove
} from 'firebase/database';

// Firebase設定（あなたの実際の設定に置き換え）
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
export const database = getDatabase(app);

// ゲームルーム作成
export const createGameRoom = async (playerName) => {
  try {
    const roomsRef = ref(database, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key;
    
    const initialGameState = {
      phase: 'waiting',
      roomInfo: {
        id: roomId,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      },
      players: {
        player1: {
          id: 'player1',
          name: playerName,
          connected: true,
          ready: false,
          hero: null
        },
        player2: null
      },
      gameData: {
        round: 1,
        currentPlayer: 'player1',
        phase: 'heroSelect',
        isProcessing: false,
        scores: {
          player1: 0,
          player2: 0
        },
        heroes: {
          player1: null,
          player2: null
        },
        hands: {
          player1: [],
          player2: []
        },
        decks: {
          player1: [],
          player2: []
        },
        slots: {
          player1: [null, null, null],
          player2: [null, null, null]
        },
        units: {
          player1: [],
          player2: []
        },
        revealedCards: {
          player1: [],
          player2: []
        },
        graveyards: {
          player1: [],
          player2: []
        },
        gameLog: [`ルーム ${roomId} が作成されました`]
      }
    };
    
    await set(newRoomRef, initialGameState);
    console.log('ルーム作成成功:', roomId);
    return roomId;
    
  } catch (error) {
    console.error('ルーム作成エラー:', error);
    throw new Error('ルームの作成に失敗しました');
  }
};

// ゲームルーム参加
export const joinGameRoom = async (roomId, playerName) => {
  try {
    const roomRef = ref(database, `rooms/${roomId}`);
    
    return new Promise((resolve, reject) => {
      onValue(roomRef, (snapshot) => {
        const room = snapshot.val();
        
        if (!room) {
          reject(new Error('ルームが見つかりません'));
          return;
        }
        
        if (room.players.player2) {
          reject(new Error('ルームは満員です'));
          return;
        }
        
        // 2番目のプレイヤーとして参加
        const updates = {
          [`rooms/${roomId}/players/player2`]: {
            id: 'player2',
            name: playerName,
            connected: true,
            ready: false,
            hero: null
          },
          [`rooms/${roomId}/phase`]: 'heroSelect',
          [`rooms/${roomId}/roomInfo/lastActivity`]: serverTimestamp()
        };
        
        update(ref(database), updates)
          .then(() => {
            console.log('ルーム参加成功:', roomId);
            resolve('player2');
          })
          .catch((error) => {
            console.error('ルーム参加エラー:', error);
            reject(new Error('ルームへの参加に失敗しました'));
          });
        
      }, { onlyOnce: true });
    });
    
  } catch (error) {
    console.error('ルーム参加エラー:', error);
    throw error;
  }
};

// ゲーム状態更新
export const updateGameState = async (roomId, updates) => {
  try {
    const updateData = {};
    
    Object.keys(updates).forEach(key => {
      updateData[`rooms/${roomId}/${key}`] = updates[key];
    });
    
    updateData[`rooms/${roomId}/roomInfo/lastActivity`] = serverTimestamp();
    
    await update(ref(database), updateData);
    console.log('ゲーム状態更新成功');
    
  } catch (error) {
    console.error('ゲーム状態更新エラー:', error);
    throw new Error('ゲーム状態の更新に失敗しました');
  }
};

// ゲーム状態監視
export const subscribeToGameState = (roomId, callback) => {
  try {
    const roomRef = ref(database, `rooms/${roomId}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const room = snapshot.val();
      if (room) {
        console.log('ゲーム状態受信:', room.phase);
        callback(room);
      } else {
        console.warn('ルームが存在しません:', roomId);
        callback(null);
      }
    }, (error) => {
      console.error('ゲーム状態監視エラー:', error);
    });
    
    return unsubscribe;
    
  } catch (error) {
    console.error('ゲーム状態監視開始エラー:', error);
    throw new Error('ゲーム状態の監視開始に失敗しました');
  }
};

// ヒーロー選択
export const selectHero = async (roomId, playerId, heroId) => {
  try {
    const updates = {
      [`rooms/${roomId}/players/${playerId}/hero`]: heroId,
      [`rooms/${roomId}/gameData/heroes/${playerId}`]: heroId,
      [`rooms/${roomId}/roomInfo/lastActivity`]: serverTimestamp()
    };
    
    await update(ref(database), updates);
    console.log('ヒーロー選択成功:', playerId, heroId);
    
  } catch (error) {
    console.error('ヒーロー選択エラー:', error);
    throw new Error('ヒーローの選択に失敗しました');
  }
};

// 接続テスト
export const testConnection = async () => {
  try {
    const testRef = ref(database, 'test');
    await set(testRef, {
      timestamp: serverTimestamp(),
      message: 'Firebase接続テスト成功'
    });
    
    await remove(testRef);
    
    console.log('Firebase接続テスト成功');
    return true;
    
  } catch (error) {
    console.error('Firebase接続テストエラー:', error);
    return false;
  }
};
