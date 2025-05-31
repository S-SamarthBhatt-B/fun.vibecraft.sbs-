let money = 0;
let mpc = 1;
let mps = 0;
let baseMpcCost = 10;
let baseMpsCost = 50;
let mpcCost = baseMpcCost;
let mpsCost = baseMpsCost;

let challengeActive = false;
let challengeStarted = false;
let challengeInterval;
let challengeScore = 0;
let remainingTime = 0;
let challengeMpc = 1;

const musicPlayer = document.getElementById('backgroundMusic');
const totalSongs = 30;
let shuffledSongs = [];
let currentSongIndex = 0;

function shuffleSongs() {
  shuffledSongs = Array.from({ length: totalSongs }, (_, i) => i + 1);
  for (let i = shuffledSongs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledSongs[i], shuffledSongs[j]] = [shuffledSongs[j], shuffledSongs[i]];
  }
}

function playNextSong() {
  const songNum = shuffledSongs[currentSongIndex];
  musicPlayer.src = `music/${songNum}.mp3`;
  musicPlayer.volume = 0.05;
  musicPlayer.play().catch(() => {
    // autoplay might be blocked until user interaction
  });
  currentSongIndex = (currentSongIndex + 1) % totalSongs;
}

musicPlayer.addEventListener('ended', playNextSong);

function startMusicOnUserAction() {
  document.body.addEventListener('click', () => {
    if (musicPlayer.paused) {
      playNextSong();
    }
  }, { once: true });
}

function updateDisplay() {
  document.getElementById("moneyDisplay").textContent = money;
  document.getElementById("mpcDisplay").textContent = mpc;
  document.getElementById("mpsDisplay").textContent = mps;
  document.getElementById("clickUpgradeBtn").textContent = `+1 Click (Cost: ${mpcCost})`;
  document.getElementById("mpsUpgradeBtn").textContent = `+1/sec (Cost: ${mpsCost})`;
}

function clickCookie() {
  if (challengeActive && challengeStarted) {
    challengeScore += challengeMpc;
    document.getElementById("challengeStatus").textContent = `Time Left: ${remainingTime}s | Score: ${challengeScore}`;
  } else if (challengeActive && !challengeStarted) {
    challengeStarted = true;
    startChallengeCountdown();
  } else {
    money += mpc;
    updateDisplay();
  }
}

function buyUpgrade() {
  if (money >= mpcCost) {
    money -= mpcCost;
    mpc += 1;
    mpcCost *= 2;
    updateDisplay();
  }
}

function buyMpsUpgrade() {
  if (money >= mpsCost) {
    money -= mpsCost;
    mps += 1;
    mpsCost *= 2;
    updateDisplay();
  }
}

function addMpsIncome() {
  money += mps;
  updateDisplay();
}

function startChallenge() {
  if (challengeActive) return;
  challengeActive = true;
  challengeStarted = false;
  challengeScore = 0;
  remainingTime = parseInt(document.getElementById('challengeTimeSelect').value, 10);
  challengeMpc = mpc;
  document.getElementById("challengeStatus").textContent = `Click the cookie to start! Time: ${remainingTime}s`;
}

function startChallengeCountdown() {
  challengeInterval = setInterval(() => {
    remainingTime--;
    document.getElementById("challengeStatus").textContent = `Time Left: ${remainingTime}s | Score: ${challengeScore}`;
    if (remainingTime <= 0) {
      clearInterval(challengeInterval);
      challengeActive = false;
      challengeStarted = false;

      document.getElementById("challengeStatus").textContent = `Challenge Over! Score: ${challengeScore}`;

      // Prompt user for name after challenge ends
      setTimeout(() => {
        let playerName = "";
        while (!playerName) {
          playerName = prompt("Time's up! Enter your name (cannot be empty):");
          if (playerName === null) {
            // User cancelled prompt
            playerName = "";
            break;
          }
          playerName = playerName.trim();
        }
        if (playerName) {
          const time = document.getElementById('challengeTimeSelect').value;
          saveScore(playerName, challengeScore, time);
          updateLeaderboard();
          alert(`Thanks, ${playerName}! Your score of ${challengeScore} was saved.`);
        }
      }, 100);

    }
  }, 1000);
}

// Save name + score to Firebase Firestore leaderboard
async function saveScore(name, score, time) {
  if (!score || score <= 0) return;

  const collectionName = `leaderboard_${time}`;
  const leaderboardRef = db.collection(collectionName);

  try {
    // Check if user exists with lower score
    const querySnapshot = await leaderboardRef.where('name', '==', name).get();

    if (!querySnapshot.empty) {
      // Update score if higher
      const doc = querySnapshot.docs[0];
      if (score > doc.data().score) {
        await leaderboardRef.doc(doc.id).update({ score });
      }
    } else {
      // Add new score
      await leaderboardRef.add({ name, score });
    }
  } catch (error) {
    console.error("Error saving score:", error);
  }
}

// Fetch and render leaderboard from Firestore
async function updateLeaderboard() {
  const time = document.getElementById('leaderboardTimeSelect').value;
  const collectionName = `leaderboard_${time}`;
  const leaderboardRef = db.collection(collectionName);
  const list = document.getElementById('leaderboardList');
  list.innerHTML = '';

  try {
    const querySnapshot = await leaderboardRef.orderBy('score', 'desc').limit(10).get();
    if (querySnapshot.empty) {
      const li = document.createElement('li');
      li.textContent = 'No scores yet';
      list.appendChild(li);
    } else {
      let idx = 1;
      querySnapshot.forEach(doc => {
        const entry = doc.data();
        const li = document.createElement('li');
        li.textContent = `${idx}. ${entry.name}: ${entry.score}`;
        list.appendChild(li);
        idx++;
      });
    }
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    const li = document.createElement('li');
    li.textContent = 'Failed to load leaderboard';
    list.appendChild(li);
  }
}

// Reset leaderboard by deleting all docs in all leaderboard collections
async function resetLeaderboard() {
  const password = document.getElementById('adminPassword').value;
  if (password !== 'admin123') {
    alert('Incorrect password!');
    return;
  }

  const times = [10, 30, 60, 300, 600];

  try {
    for (const time of times) {
      const collectionName = `leaderboard_${time}`;
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
    updateLeaderboard();
    alert('All leaderboards reset.');
  } catch (error) {
    console.error("Error resetting leaderboards:", error);
    alert('Failed to reset leaderboards.');
  }

  document.getElementById('adminPassword').value = '';
}

document.getElementById('cookie').addEventListener('click', () => {
  clickCookie();
  if (!challengeActive) startMusicOnUserAction();
});
document.getElementById('clickUpgradeBtn').addEventListener('click', buyUpgrade);
document.getElementById('mpsUpgradeBtn').addEventListener('click', buyMpsUpgrade);
document.getElementById('startChallengeBtn').addEventListener('click', startChallenge);
document.getElementById('leaderboardTimeSelect').addEventListener('change', updateLeaderboard);
document.getElementById('resetLeaderboardBtn').addEventListener('click', resetLeaderboard);

updateDisplay();
shuffleSongs();
updateLeaderboard();
setInterval(addMpsIncome, 1000);
