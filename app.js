// GoodTimer - Reward Timer for Kids

// State
let state = {
    totalPoints: 0,
    streak: 0,
    lastActiveDate: null,
    activities: {
        reading: 0,
        exercise: 0,
        chores: 0,
        practice: 0,
        homework: 0
    },
    history: [],
    timerMinutes: 10,
    timerSeconds: 0,
    timerRunning: false,
    timerPaused: false
};

let timerInterval = null;

// DOM Elements
const totalPointsEl = document.getElementById('total-points');
const streakEl = document.getElementById('streak');
const timerDisplayEl = document.getElementById('timer-display');
const timerLabelEl = document.getElementById('timer-label');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const historyListEl = document.getElementById('history-list');
const celebrationModal = document.getElementById('celebration-modal');
const celebrationMessage = document.getElementById('celebration-message');
const closeCelebrationBtn = document.getElementById('close-celebration');

// Initialize
function init() {
    loadState();
    checkStreak();
    updateUI();
    setupEventListeners();
}

function setupEventListeners() {
    // Timer duration buttons
    document.querySelectorAll('.timer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const minutes = parseInt(btn.dataset.minutes);
            setTimer(minutes);
        });
    });

    // Timer controls
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    // Quick add buttons
    document.querySelectorAll('.quick-add').forEach(btn => {
        btn.addEventListener('click', () => {
            const activity = btn.dataset.activity;
            const minutes = parseInt(btn.dataset.minutes);
            addActivityTime(activity, minutes);
        });
    });

    // Redeem buttons
    document.querySelectorAll('.redeem-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.reward-card');
            const cost = parseInt(card.dataset.cost);
            const name = card.querySelector('.reward-name').textContent;
            redeemReward(name, cost);
        });
    });

    // Close celebration
    closeCelebrationBtn.addEventListener('click', () => {
        celebrationModal.classList.remove('show');
    });

    // Set default timer
    document.querySelector('.timer-btn[data-minutes="10"]').classList.add('active');
}

function setTimer(minutes) {
    if (state.timerRunning) return;
    state.timerMinutes = minutes;
    state.timerSeconds = 0;
    updateTimerDisplay();
    timerLabelEl.textContent = `${minutes} minute timer ready`;
}

function startTimer() {
    if (state.timerRunning && !state.timerPaused) return;
    
    state.timerRunning = true;
    state.timerPaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    timerLabelEl.textContent = 'Timer running...';

    timerInterval = setInterval(() => {
        if (state.timerSeconds === 0) {
            if (state.timerMinutes === 0) {
                timerComplete();
                return;
            }
            state.timerMinutes--;
            state.timerSeconds = 59;
        } else {
            state.timerSeconds--;
        }
        updateTimerDisplay();
    }, 1000);
}

function pauseTimer() {
    if (!state.timerRunning) return;
    
    state.timerPaused = true;
    state.timerRunning = false;
    clearInterval(timerInterval);
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    timerLabelEl.textContent = 'Timer paused';
}

function resetTimer() {
    state.timerRunning = false;
    state.timerPaused = false;
    clearInterval(timerInterval);
    
    const activeBtn = document.querySelector('.timer-btn.active');
    const minutes = activeBtn ? parseInt(activeBtn.dataset.minutes) : 10;
    state.timerMinutes = minutes;
    state.timerSeconds = 0;
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    timerLabelEl.textContent = 'Ready to start!';
    updateTimerDisplay();
}

function timerComplete() {
    clearInterval(timerInterval);
    state.timerRunning = false;
    
    const activeBtn = document.querySelector('.timer-btn.active');
    const minutes = activeBtn ? parseInt(activeBtn.dataset.minutes) : 10;
    
    // Award points (1 star per 5 minutes)
    const pointsEarned = Math.floor(minutes / 5);
    addPoints(pointsEarned, `Completed ${minutes} min timer`);
    
    // Play sound
    playCompletionSound();
    
    // Show celebration
    showCelebration(`You earned ${pointsEarned} star${pointsEarned !== 1 ? 's' : ''} for completing a ${minutes} minute task!`);
    
    // Reset
    resetTimer();
}

function addActivityTime(activity, minutes) {
    state.activities[activity] += minutes;
    
    // Award points (1 star per 10 minutes of activity)
    const pointsEarned = Math.floor(minutes / 10);
    if (pointsEarned > 0) {
        addPoints(pointsEarned, `${activity.charAt(0).toUpperCase() + activity.slice(1)} time`);
    }
    
    updateActivityDisplay(activity);
    saveState();
    
    // Quick celebration
    const activityEl = document.querySelector(`.activity-time[data-activity="${activity}"]`);
    activityEl.style.transform = 'scale(1.2)';
    setTimeout(() => activityEl.style.transform = 'scale(1)', 200);
}

function updateActivityDisplay(activity) {
    const el = document.querySelector(`.activity-time[data-activity="${activity}"]`);
    el.textContent = `${state.activities[activity]} min`;
}

function addPoints(amount, reason) {
    state.totalPoints += amount;
    addHistoryEntry(`+${amount} ⭐`, reason, 'positive');
    updatePointsDisplay();
    saveState();
}

function redeemReward(name, cost) {
    if (state.totalPoints < cost) {
        showCelebration(`You need ${cost - state.totalPoints} more stars for "${name}"! Keep going!`);
        return;
    }
    
    state.totalPoints -= cost;
    addHistoryEntry(`-${cost} ⭐`, `Redeemed: ${name}`, 'negative');
    updatePointsDisplay();
    saveState();
    
    showCelebration(`🎉 You redeemed "${name}"! 🎉`);
}

function addHistoryEntry(points, action, type) {
    const entry = {
        points,
        action,
        type,
        timestamp: new Date().toLocaleTimeString()
    };
    state.history.unshift(entry);
    if (state.history.length > 50) state.history.pop();
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    historyListEl.innerHTML = state.history.slice(0, 10).map(entry => `
        <div class="history-item">
            <span class="history-action">${entry.action}</span>
            <span class="history-points ${entry.type}">${entry.points}</span>
        </div>
    `).join('');
}

function checkStreak() {
    const today = new Date().toDateString();
    
    if (state.lastActiveDate) {
        const lastDate = new Date(state.lastActiveDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate.toDateString() === yesterday.toDateString()) {
            // Continuing streak
            if (state.lastActiveDate !== today) {
                state.streak++;
            }
        } else if (lastDate.toDateString() !== today) {
            // Streak broken
            state.streak = 1;
        }
    } else {
        state.streak = 1;
    }
    
    state.lastActiveDate = today;
    saveState();
}

function updateUI() {
    updatePointsDisplay();
    updateTimerDisplay();
    Object.keys(state.activities).forEach(updateActivityDisplay);
    updateHistoryDisplay();
}

function updatePointsDisplay() {
    totalPointsEl.textContent = state.totalPoints;
    streakEl.textContent = state.streak;
    
    // Animate points
    totalPointsEl.style.transform = 'scale(1.2)';
    setTimeout(() => totalPointsEl.style.transform = 'scale(1)', 200);
}

function updateTimerDisplay() {
    const mins = state.timerMinutes.toString().padStart(2, '0');
    const secs = state.timerSeconds.toString().padStart(2, '0');
    timerDisplayEl.textContent = `${mins}:${secs}`;
}

function showCelebration(message) {
    celebrationMessage.textContent = message;
    celebrationModal.classList.add('show');
    createConfetti();
}

function createConfetti() {
    const confettiEl = document.getElementById('confetti');
    confettiEl.innerHTML = '';
    
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96c93d', '#ffd93d', '#a55eea'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            top: -10px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            animation: fall ${1 + Math.random() * 2}s linear forwards;
        `;
        confettiEl.appendChild(confetti);
    }
    
    // Add fall animation
    if (!document.querySelector('#confetti-style')) {
        const style = document.createElement('style');
        style.id = 'confetti-style';
        style.textContent = `
            @keyframes fall {
                to {
                    transform: translateY(500px) rotate(720deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function playCompletionSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(ctx.currentTime + i * 0.15);
            osc.stop(ctx.currentTime + i * 0.15 + 0.3);
        });
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Persistence
function saveState() {
    localStorage.setItem('goodtimer-state', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('goodtimer-state');
    if (saved) {
        const loaded = JSON.parse(saved);
        state = { ...state, ...loaded };
        
        // Reset daily activities if it's a new day
        const today = new Date().toDateString();
        if (state.lastActiveDate !== today) {
            state.activities = {
                reading: 0,
                exercise: 0,
                chores: 0,
                practice: 0,
                homework: 0
            };
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
