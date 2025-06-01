
  // -- JavaScript code starts here --

  // Game Variables
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

  // DOM Elements
  const musicPlayer = document.getElementById('backgroundMusic');
  const totalSongs = 30;
  let shuffledSongs = [];
  let currentSongIndex = 0;

  // ---------- MUSIC ---------- //
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
    musicPlayer.play().catch(() => {});
    currentSongIndex = (currentSongIndex + 1) % totalSongs;
  }

  musicPlayer.addEventListener('ended', playNextSong);

  function startMusicOnUserAction() {
    if (musicPlayer.paused) {
      playNextSong();
    }
  }

  // ---------- UI Update ---------- //
  function updateDisplay() {
    document.getElementById("moneyDisplay").textContent = money;
    document.getElementById("mpcDisplay").textContent = mpc;
    document.getElementById("mpsDisplay").textContent = mps;
    document.getElementById("clickUpgradeBtn").textContent = `+1 Click (Cost: ${mpcCost})`;
    document.getElementById("mpsUpgradeBtn").textContent = `+1/sec (Cost: ${mpsCost})`;
    saveGame();
  }

  // ---------- Game Logic ---------- //
  function clickCookie() {
    if (challengeActive && challengeStarted) {
      challengeScore += 1; // Always +1 in challenge
      document.getElementById("challengeStatus").textContent = `Time Left: ${remainingTime}s | Score: ${challengeScore}`;
    } else if (challengeActive && !challengeStarted) {
      challengeStarted = true;
      startChallengeCountdown();
    } else {
      money += mpc;
      updateDisplay();
    }
    startMusicOnUserAction();
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

  // ---------- Challenge Mode ---------- //
  function startChallenge() {
    if (challengeActive) return;
    challengeActive = true;
    challengeStarted = false;
    challengeScore = 0;
    remainingTime = parseInt(document.getElementById('challengeTimeSelect').value, 10);
    document.getElementById("challengeStatus").textContent = `Click the cookie to start! Time: ${remainingTime}s`;
  }

  // Records management
  const maxRecords = 10;

  function getRecords() {
    const rec = localStorage.getItem('vibecraft_challenge_records');
    return rec ? JSON.parse(rec) : [];
  }

  function saveRecords(records) {
    localStorage.setItem('vibecraft_challenge_records', JSON.stringify(records));
  }

  function addRecord(score, duration) {
    let records = getRecords();

    records.push({ score, duration, date: new Date().toISOString() });

    // Sort descending by score
    records.sort((a, b) => b.score - a.score);

    if (records.length > maxRecords) {
      records = records.slice(0, maxRecords);
    }

    saveRecords(records);
    renderRecords();
  }

  function renderRecords() {
    const records = getRecords();
    const tbody = document.getElementById('recordBody');
    if (!tbody) return;

    tbody.innerHTML = ''; // Clear existing

    if(records.length === 0){
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.setAttribute('colspan', '4');
      td.textContent = "No records yet. Play a challenge!";
      td.style.textAlign = 'center';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    records.forEach((rec, idx) => {
      const tr = document.createElement('tr');

      const rankTd = document.createElement('td');
      rankTd.textContent = idx + 1;
      rankTd.style.padding = '0.5rem';
      tr.appendChild(rankTd);

      const scoreTd = document.createElement('td');
      scoreTd.textContent = rec.score;
      scoreTd.style.padding = '0.5rem';
      tr.appendChild(scoreTd);

      const durationTd = document.createElement('td');
      durationTd.textContent = `${rec.duration}s`;
      durationTd.style.padding = '0.5rem';
      tr.appendChild(durationTd);

      const dateTd = document.createElement('td');
      dateTd.textContent = new Date(rec.date).toLocaleDateString();
      dateTd.style.padding = '0.5rem';
      tr.appendChild(dateTd);

      tbody.appendChild(tr);
    });
  }

  function endChallenge() {
    clearInterval(challengeInterval);
    challengeActive = false;
    challengeStarted = false;
    document.getElementById("challengeStatus").textContent = `Challenge Over! Score: ${challengeScore}`;
    addRecord(challengeScore, parseInt(document.getElementById('challengeTimeSelect').value, 10));
  }

  function startChallengeCountdown() {
    challengeInterval = setInterval(() => {
      remainingTime--;
      document.getElementById("challengeStatus").textContent = `Time Left: ${remainingTime}s | Score: ${challengeScore}`;
      if (remainingTime <= 0) {
        endChallenge();
      }
    }, 1000);
  }

  // ---------- Save / Load ---------- //
  function saveGame() {
    const saveData = {
      money, mpc, mps, mpcCost, mpsCost,
      records: getRecords()
    };
    localStorage.setItem('vibecraft_save', JSON.stringify(saveData));
  }

  function loadGame() {
    const save = localStorage.getItem('vibecraft_save');
    if (save) {
      const data = JSON.parse(save);
      money = data.money || 0;
      mpc = data.mpc || 1;
      mps = data.mps || 0;
      mpcCost = data.mpcCost || baseMpcCost;
      mpsCost = data.mpsCost || baseMpsCost;
      if(data.records) {
        saveRecords(data.records);
      }
    }
  }

  // ---------- Event Listeners ---------- //
  document.getElementById('cookie').addEventListener('click', clickCookie);
  document.getElementById('clickUpgradeBtn').addEventListener('click', buyUpgrade);
  document.getElementById('mpsUpgradeBtn').addEventListener('click', buyMpsUpgrade);
  document.getElementById('startChallengeBtn').addEventListener('click', startChallenge);

  // ---------- Initialization ---------- //
  shuffleSongs();
  loadGame();
  updateDisplay();
  renderRecords();

  setInterval(addMpsIncome, 1000);
