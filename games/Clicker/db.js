// Firebase config (replace with your Firebase config)
const firebaseConfig = {
  apiKey: "AIzaSyAz8uNJx_2pNN9iG68y4DY-GFMPfp2QZ-g",
  authDomain: "vibecraft29.firebaseapp.com",
  projectId: "vibecraft29",
  storageBucket: "vibecraft29.firebasestorage.app",
  messagingSenderId: "973166457917",
  appId: "1:973166457917:web:c7df33898ca1ea3ca52654",
  measurementId: "G-RCS1V6BMNN"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function saveScoreToFirebase(name, score, time) {
  const ref = db.ref(`leaderboard_${time}`).push();
  ref.set({ name, score });
}

async function getScoresFromFirebase(time) {
  const snapshot = await db.ref(`leaderboard_${time}`).once('value');
  const data = snapshot.val();
  if (!data) return [];

  return Object.values(data).sort((a, b) => b.score - a.score).slice(0, 10);
}
