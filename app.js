const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mainUI = document.getElementById('main-ui');
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('current-score');
const gameOverlay = document.getElementById('game-overlay');

// Sound System (Web Audio API)
let audioCtx;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'good') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'bad') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(554, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }
}

function flashError() {
    playSound('bad');
    const flash = document.getElementById('error-flash');
    flash.style.display = 'block';
    flash.classList.add('flash-error');
    setTimeout(() => {
        flash.classList.remove('flash-error');
        flash.style.display = 'none';
    }, 500);
}

function updateScoreUI(newScore) {
    gameState.score = newScore;
    scoreDisplay.innerText = gameState.score;
    scoreDisplay.classList.remove('pulse-text');
    void scoreDisplay.offsetWidth; // trigger reflow
    scoreDisplay.classList.add('pulse-text');
}

let gameState = {
    puzzleWords: [
        { word: "NİKOTİN", hint: "Sigara dumanında bulunan zehirli madde." },
        { word: "İRADENİ KORU", hint: "Zararlı tekliflere karşı en güçlü silahımız nedir?" },
        { word: "HAREKET ET", hint: "Sağlıklı yaşamın ve bereketin temel anahtarı." },
        { word: "DİJİTAL DETOKS", hint: "Ekran bağımlılığından kurtulmak için yapılan mola." },
        { word: "SAĞLIKLI BESLEN", hint: "Vücudun yakıtını kaliteli kaynaklardan seçme eylemi." },
        { word: "YEŞİLAY", hint: "Bağımlılıkla mücadelenin simgesi olan köklü kurum." },
        { word: "TEMİZ HAVA", hint: "Akciğerlerimizin en çok ihtiyaç duyduğu şey." },
        { word: "ZİNDE KALMA", hint: "Kendini her zaman enerjik ve hazır hissetme durumu." },
        { word: "SPOR YAP", hint: "Vücudunu zinde tutmak için düzenli yapılan aktivite." },
        { word: "BAĞIMLILIK", hint: "Bir şeye kontrolsüzce bağlanma ve bırakamama durumu." },
        { word: "SOSYAL AKTİVİTE", hint: "İnsanlarla vakit geçirerek sosyalleşme eylemi." },
        { word: "UYKU DÜZENİ", hint: "Zihinsel ve fiziksel dinlenmenin en önemli parçası." },
        { word: "IRADE", hint: "Kendi kararlarını yönetebilme ve hayır diyebilme gücü." },
        { word: "MÜCADELE", hint: "Zorluklara karşı pes etmeden devam etme süreci." },
        { word: "YAŞAM KALİTESİ", hint: "Sağlıklı alışkanlıklarla artan hayat standardı." },
        { word: "DOĞRU ROTA", hint: "Yanlış yollara sapmadan hedefimize ilerlemek." },
        { word: "SU İÇMEK", hint: "Hücrelerimizin en temel yaşam kaynağı." },
        { word: "DİKKAT", hint: "Odaklanma ve farkındalık seviyemizin yüksekliği." },
        { word: "GELECEĞE İZ", hint: "Bugünkü sağlıklı adımların yarınki sonucu." },
        { word: "GÜÇLÜ KAL", hint: "Tüm zararlı alışkanlıklara karşı duruşumuz." }
    ],
    puzzleLives: 2,
    lives: 3,
    score: 0,
    active: false,
    mode: '',
    speed: 2,
    objects: [],
    spawnTimer: 0,
    player: { lane: 1 },
    lanes: [0, 0, 0, 0],
    animationId: null
};

// Helper for dynamic player sizing in Route Game
function getPlayerSpecs() {
    const lw = canvas.width / 4;
    const radius = Math.min(lw * 0.4, 35);
    const y = canvas.height - Math.max(50, radius * 2.2);
    return {
        radius: radius,
        y: y,
        fontSize: radius * 1.3
    };
}

// Canvas Resize
function resize() {
    const container = document.querySelector('.game-content-area');
    if (!container) return;
    
    let targetWidth = container.clientWidth;
    let targetHeight = container.clientHeight;
    
    if (gameState.mode === 'route') {
        // Allow wider aspect ratio in landscape
        const maxRatio = 1.8;
        if (targetWidth > targetHeight * maxRatio) {
            targetWidth = targetHeight * maxRatio;
        }
    } else if (gameState.mode === 'customs') {
        // Allow wider aspect ratio in landscape
        const maxRatio = 2.5;
        if (targetWidth > targetHeight * maxRatio) {
            targetWidth = targetHeight * maxRatio;
        }
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetHeight}px`;
    
    // Lane positions based on dynamic width
    const lw = canvas.width / 4;
    gameState.lanes = [lw * 0.5, lw * 1.5, lw * 2.5, lw * 3.5];
}
window.addEventListener('resize', resize);
resize();

// Input Handling
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// Unified Customs Game processing
function processCustomsInput(isLeft) {
    if (gameState.objects.length === 0) return;
    const obj = gameState.objects[0];

    if ((isLeft && obj.type === 'bad') || (!isLeft && obj.type === 'good')) {
        playSound('good');
        updateScoreUI(gameState.score + 20);
        gameState.objects.shift();
        if (gameState.speed < 12.0) {
            gameState.speed += 0.8;
        }
    } else {
        flashError();
        gameState.lives--;
        gameState.speed = 1.5; // Can azalınca gümrük yavaşlar
        document.getElementById('current-lives').innerText = gameState.lives;
        const sideText = isLeft ? "reddetme" : "kabul";
        if (gameState.lives <= 0) {
            gameOver(`Hatalı ${sideText} yaptın! Sınır güvenliği aşıldı.`);
        } else {
            gameState.objects.shift(); // Hatalı olanı kaldır ve devam et
        }
    }
}

// Mobile Touch Controls for Canvas Games
canvas.addEventListener('touchstart', (e) => {
    if (!gameState.active) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const touchY = e.touches[0].clientY - rect.top;
    const canvasMid = canvas.width / 2;

    if (gameState.mode === 'route') {
        if (touchX < canvasMid) {
            if (gameState.player.lane > 0) gameState.player.lane--;
        } else {
            if (gameState.player.lane < 3) gameState.player.lane++;
        }
        playSound('click');
    } else if (gameState.mode === 'customs') {
        processCustomsInput(touchX < canvasMid);
    }
    e.preventDefault();
}, { passive: false });

// Input handling
window.addEventListener('keydown', e => {
    if (!gameState.active) return;
    if (gameState.mode === 'route') {
        if (e.code === 'ArrowLeft' && gameState.player.lane > 0) {
            gameState.player.lane--;
            playSound('click');
        }
        if (e.code === 'ArrowRight' && gameState.player.lane < 3) {
            gameState.player.lane++;
            playSound('click');
        }
    }
});

let currentPuzzleIndex = 0;
let guessedLetters = [];
let wrongGuesses = 0;

// Start game manager
function startGame(mode) {
    document.body.classList.add('game-active');
    gameState.mode = mode;
    gameState.score = 0;
    updateScoreUI(0);
    mainUI.style.display = 'none';
    gameContainer.style.display = 'flex';
    gameOverlay.style.display = 'none';
    
    document.getElementById('gameCanvas').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('puzzle-container').style.display = 'none';
    document.getElementById('score-wrapper').style.display = 'block';
    document.getElementById('lives-wrapper').style.display = 'none';

    gameState.active = true;

    if (gameState.animationId) cancelAnimationFrame(gameState.animationId);

    if (mode === 'route') {
        document.getElementById('gameCanvas').style.display = 'block';
        document.getElementById('lives-wrapper').style.display = 'block';
        gameState.lives = 3;
        document.getElementById('current-lives').innerText = gameState.lives;
        resize();
        gameState.speed = 2;
        gameState.objects = [];
        gameState.spawnTimer = 0;
        gameState.player.lane = 1; // start in middle lane
        gameLoop();
    } else if (mode === 'customs') {
        document.getElementById('gameCanvas').style.display = 'block';
        document.getElementById('lives-wrapper').style.display = 'block';
        gameState.lives = 2; // Gümrük için 2 can
        document.getElementById('current-lives').innerText = gameState.lives;
        resize();
        gameState.speed = 1.5;
        gameState.objects = [];
        gameState.spawnTimer = 0;
        gameLoop();
    } else if (mode === 'quiz') {
        document.getElementById('score-wrapper').style.display = 'none';
        document.getElementById('quiz-container').style.display = 'block';
        initQuiz();
    } else if (mode === 'puzzle') {
        document.getElementById('puzzle-container').style.display = 'block';
        gameState.puzzleLives = 2;
        currentPuzzleIndex = 0;
        guessedLetters = [];
        wrongGuesses = 0;
        initPuzzle();
    }
}

function exitGame() {
    document.body.classList.remove('game-active');
    playSound('click');
    gameState.active = false;
    cancelAnimationFrame(gameState.animationId);
    gameContainer.style.display = 'none';
    mainUI.style.display = 'block';
}

function restartGame() {
    startGame(gameState.mode);
}

// =================== CANVAS GAMES =================== //

function spawnObject() {
    let types = [];
    if (gameState.mode === 'route') {
        types = [
            { char: '\uf482', type: 'bad', color: '#ff4b2b' }, // smoking
            { char: '\uf805', type: 'bad', color: '#ff4b2b' }, // burger
            { char: '\uf10b', type: 'bad', color: '#ff4b2b' }, // mobile
            { char: '\uf5d1', type: 'good', color: '#009639' }, // apple
            { char: '\uf70c', type: 'good', color: '#009639' }, // running
            { char: '\uf043', type: 'good', color: '#00d2ff' }  // droplet
        ];
        const obj = types[Math.floor(Math.random() * types.length)];
        const lane = Math.floor(Math.random() * 4);
        gameState.objects.push({
            lane: lane,
            y: -50,
            width: Math.min(canvas.width / 6, 120),
            height: Math.min(canvas.width / 7, 90),
            ...obj
        });
    } else if (gameState.mode === 'customs') {
        types = [
            { text: 'Spor', icon: '\uf70c', type: 'good' }, // running
            { text: 'Kitap', icon: '\uf02d', type: 'good' }, // book
            { text: 'Aşırı Ekran', icon: '\uf10b', type: 'bad' }, // mobile
            { text: 'Hareketsiz', icon: '\uf4b8', type: 'bad' }, // couch
            { text: 'Sağlıklı', icon: '\uf5d1', type: 'good' }, // apple
            { text: 'Tütün', icon: '\uf482', type: 'bad' } // smoking
        ];
        const obj = types[Math.floor(Math.random() * types.length)];
        gameState.objects.push({
            x: canvas.width / 2,
            y: -50,
            width: Math.min(canvas.width * 0.4, 180),
            height: Math.min(canvas.height * 0.15, 120),
            ...obj
        });
    }
}

function update() {
    if (gameState.mode === 'route') {
        gameState.spawnTimer++;
        if (gameState.spawnTimer > Math.max(40, 100 - gameState.speed * 10)) {
            spawnObject();
            gameState.spawnTimer = 0;
            if (gameState.speed < 12) {
                gameState.speed += 0.2; 
            }
        }

        for (let i = gameState.objects.length - 1; i >= 0; i--) {
            let obj = gameState.objects[i];
            obj.y += gameState.speed;
            
            const specs = getPlayerSpecs();
            if (obj.y > specs.y - specs.radius - 10 && obj.y < specs.y + specs.radius + 10) {
                if (obj.lane === gameState.player.lane) {
                    if (obj.type === 'good') {
                        playSound('good');
                        updateScoreUI(gameState.score + 10);
                    } else {
                        flashError();
                        gameState.lives--;
                        gameState.speed = 2; // Can azalınca hız yavaşlar ve tekrar artar
                        document.getElementById('current-lives').innerText = gameState.lives;
                        canvas.style.transform = "translate(10px, 10px)";
                        setTimeout(() => canvas.style.transform = "translate(0, 0)", 50);
                        if(gameState.lives <= 0) {
                            gameOver("Maalesef rotada çok fazla kaza yaptın!");
                        }
                    }
                    gameState.objects.splice(i, 1);
                    continue;
                }
            }
            if (obj.y > canvas.height + 50) {
                gameState.objects.splice(i, 1);
            }
        }
    } else if (gameState.mode === 'customs') {
        gameState.spawnTimer++;
        if (gameState.objects.length === 0 && gameState.spawnTimer > 40) {
            spawnObject();
            gameState.spawnTimer = 0;
        }

        for (let i = gameState.objects.length - 1; i >= 0; i--) {
            let obj = gameState.objects[i];
            obj.y += gameState.speed;
            const btnHeight = Math.min(canvas.height * 0.25, 100);
            if (obj.y > canvas.height - btnHeight) {
                if(obj.type === 'good') {
                    flashError();
                    updateScoreUI(gameState.score - 10);
                } else {
                    flashError();
                    gameOver("Zararlı alışkanlık sınırdan geçti!");
                }
                gameState.objects.splice(i, 1);
            }
        }
    }
}

// Controls
canvas.addEventListener('mousedown', e => {
    if (!gameState.active) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    
    if (gameState.mode === 'route') {
        const laneWidth = canvas.width / 4;
        if (mx < laneWidth) gameState.player.lane = 0;
        else if (mx < laneWidth * 2) gameState.player.lane = 1;
        else if (mx < laneWidth * 3) gameState.player.lane = 2;
        else gameState.player.lane = 3;
        playSound('click');
    } else if (gameState.mode === 'customs') {
        processCustomsInput(mx < canvas.width / 2);
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState.mode === 'route') {
        ctx.fillStyle = '#1b3b2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const laneWidth = canvas.width / 4;
        for(let i=0; i<4; i++) {
            if(i % 2 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.02)';
                ctx.fillRect(i * laneWidth, 0, laneWidth, canvas.height);
            }
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 20]);
        ctx.lineDashOffset = -Date.now() / 20;
        for(let i=1; i<4; i++) {
            ctx.beginPath();
            ctx.moveTo(i * laneWidth, 0);
            ctx.lineTo(i * laneWidth, canvas.height);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        const specs = getPlayerSpecs();
        ctx.beginPath();
        ctx.arc(gameState.lanes[gameState.player.lane], specs.y, specs.radius, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fill();

        ctx.font = `900 ${specs.fontSize}px "Font Awesome 6 Free"`;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\uf70c', gameState.lanes[gameState.player.lane], specs.y);

        gameState.objects.forEach(obj => {
            // Draw card base like Customs Control
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.roundRect(gameState.lanes[obj.lane] - obj.width/2, obj.y - obj.height/2, obj.width, obj.height, 12);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw Icon
            ctx.font = `900 ${Math.min(obj.height * 0.6, 40)}px "Font Awesome 6 Free"`;
            ctx.fillStyle = obj.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(obj.char, gameState.lanes[obj.lane], obj.y);
        });

    } else if (gameState.mode === 'customs') {
        const roadWidth = Math.min(canvas.width * 0.6, 240);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(canvas.width/2 - roadWidth/2, 0, roadWidth, canvas.height);
        
        const btnHeight = Math.min(canvas.height * 0.25, 100);
        ctx.fillStyle = 'rgba(255, 75, 43, 0.2)';
        ctx.fillRect(0, canvas.height - btnHeight, canvas.width/2, btnHeight);
        ctx.fillStyle = 'rgba(0, 150, 57, 0.2)';
        ctx.fillRect(canvas.width/2, canvas.height - btnHeight, canvas.width/2, btnHeight);
        
        ctx.font = `bold ${Math.min(btnHeight * 0.25, 20)}px Inter`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('İADE ET', canvas.width/4, canvas.height - btnHeight/2 + Math.min(btnHeight * 0.08, 7));
        ctx.fillText('GEÇİŞ VER', canvas.width*0.75, canvas.height - btnHeight/2 + Math.min(btnHeight * 0.08, 7));

        gameState.objects.forEach(obj => {
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.roundRect(obj.x - obj.width/2, obj.y - obj.height/2, obj.width, obj.height, 15);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            const iconSize = Math.min(obj.height * 0.45, 35);
            const textSize = Math.min(obj.height * 0.2, 16);
            
            ctx.font = `900 ${iconSize}px "Font Awesome 6 Free"`;
            ctx.fillStyle = obj.type === 'good' ? '#009639' : '#ff4b2b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(obj.icon, obj.x, obj.y - obj.height * 0.15);
            
            ctx.fillStyle = '#111';
            ctx.font = `bold ${textSize}px Inter`;
            ctx.fillText(obj.text, obj.x, obj.y + obj.height * 0.25);
        });
    }
}

function gameOver(msg = "") {
    gameState.active = false;
    let endText = `<div style="font-size:1.1rem; color:var(--text-muted);">Skorun: <strong style="color:var(--primary); font-size:1.5em;">${gameState.score}</strong></div><br>${msg}`;
    if (gameState.mode === 'quiz') endText = msg; 
    if (gameState.mode === 'puzzle') endText = `<div style="font-size:1.1rem; color:var(--text-muted);">Puanın: <strong style="color:var(--primary); font-size:1.5em;">${gameState.score}</strong></div><br>Tüm yükleri başarıyla buldun!`;
    openModal("GÖREV TAMAMLANDI", endText, "fa-trophy", "Harika!");
    exitGame();
}

function gameLoop() {
    if (!gameState.active) return;
    update();
    draw();
    gameState.animationId = requestAnimationFrame(gameLoop);
}

// =================== QUIZ GAME (Assessment) =================== //
const quizData = [
    { 
        q: "Günde ortalama kaç saat amaçsızca ekrana bakıyorsun?", 
        options: [
            { text: "1 saatten az (Sadece iş/okul)", weight: 0 },
            { text: "2-3 saat arası", weight: 1 },
            { text: "4-6 saat", weight: 2 },
            { text: "Sürekli, sayısını bilmiyorum", weight: 3 }
        ] 
    },
    { 
        q: "Stresli veya üzgün olduğunda ilk ne yaparsın?", 
        options: [
            { text: "Yürüyüşe çıkar, spor yaparım", weight: 0 },
            { text: "Birileriyle konuşurum", weight: 1 },
            { text: "Hemen sosyal medyaya dalarım", weight: 2 },
            { text: "Zararlı maddelere yönelirim", weight: 4 }
        ] 
    },
    { 
        q: "Bir arkadaşın sana zararlı bir madde denemeni teklif etti, tepkin ne olur?", 
        options: [
            { text: "Kesinlikle reddeder, ortamdan uzaklaşırım", weight: 0 },
            { text: "İstemediğimi söylerim ama yanlarında dururum", weight: 1 },
            { text: "Bir kereden bir şey olmaz deyip denerim", weight: 3 },
            { text: "Daha önce de denedim, katılırım", weight: 4 }
        ] 
    },
    { 
        q: "Uyku düzenin nasıldır?", 
        options: [
            { text: "Düzenli, ekranı uykudan önce kapatırım", weight: 0 },
            { text: "Bazen geç yatarım ama genelde iyidir", weight: 1 },
            { text: "Uyuyana kadar video izlerim/oyun oynarım", weight: 2 },
            { text: "Uyku düzenim tamamen bozuk", weight: 3 }
        ] 
    },
    { 
        q: "Hobilerin ve fiziksel aktivitelerin hayatındaki yeri nedir?", 
        options: [
            { text: "Düzenli spor veya sanatla ilgilenirim", weight: 0 },
            { text: "Zaman buldukça bir şeyler yaparım", weight: 1 },
            { text: "Sadece dijital oyunlar oynarım", weight: 2 },
            { text: "Hiçbir hobim yok", weight: 3 }
        ] 
    },
    { 
        q: "Asansör yerine merdiven kullanmayı tercih eder misin?", 
        options: [
            { text: "Her zaman merdiven kullanırım", weight: 0 },
            { text: "Duruma göre değişir", weight: 1 },
            { text: "Çok nadir", weight: 2 },
            { text: "Asla, hep asansör kullanırım", weight: 3 }
        ] 
    },
    { 
        q: "Günde ne kadar su içiyorsun?", 
        options: [
            { text: "2-3 litre (Yeterli miktarda)", weight: 0 },
            { text: "1-2 litre arası", weight: 1 },
            { text: "Sadece susadıkça (Çok az)", weight: 2 },
            { text: "Çoğunlukla çay/kahve/asitli içecek tüketiyorum", weight: 3 }
        ] 
    },
    { 
        q: "Gece yatağa girdiğinde uykuya dalma süren ortalama nedir?", 
        options: [
            { text: "Hemen dalarım (10-15 dk)", weight: 0 },
            { text: "Yarım saat civarı", weight: 1 },
            { text: "Telefona bakmaktan 1 saati bulur", weight: 2 },
            { text: "Uykuya dalmakta çok zorlanırım", weight: 3 }
        ] 
    },
    { 
        q: "Fast food ve işlenmiş gıda tüketim sıklığın nedir?", 
        options: [
            { text: "Neredeyse hiç tüketmem", weight: 0 },
            { text: "Haftada 1-2 kez", weight: 1 },
            { text: "Haftada 3-4 kez", weight: 2 },
            { text: "Hemen hemen her gün", weight: 3 }
        ] 
    },
    { 
        q: "Kendini genel olarak ne kadar enerjik hissediyorsun?", 
        options: [
            { text: "Sabahları dinç kalkar, günü enerjik geçiririm", weight: 0 },
            { text: "Öğleden sonraları hafif yorulurum", weight: 1 },
            { text: "Sürekli bir yorgunluk halim var", weight: 2 },
            { text: "Hiç enerjim yok, sürekli bitkinim", weight: 3 }
        ] 
    }
];

let currentQuizIndex = 0;
let quizScore = 0; 

function initQuiz() {
    currentQuizIndex = 0;
    quizScore = 0;
    loadQuizQuestion();
}

function loadQuizQuestion() {
    if (currentQuizIndex >= quizData.length) {
        finishQuiz();
        return;
    }

    const qData = quizData[currentQuizIndex];
    document.getElementById('quiz-progress-text').innerText = `Soru ${currentQuizIndex + 1} / ${quizData.length}`;
    
    // Update progress bar
    const progressFill = document.getElementById('quiz-progress-fill');
    progressFill.style.width = `${((currentQuizIndex) / quizData.length) * 100}%`;

    document.getElementById('quiz-question').innerText = qData.q;
    
    const optionsGrid = document.getElementById('quiz-options');
    optionsGrid.innerHTML = '';
    
    const letters = ['A', 'B', 'C', 'D'];
    qData.options.forEach((opt, index) => {
        const btn = document.createElement('div');
        btn.className = 'quiz-btn';
        
        const letterSpan = document.createElement('span');
        letterSpan.className = 'option-letter';
        letterSpan.innerText = letters[index];
        
        const textSpan = document.createElement('span');
        textSpan.innerText = opt.text;
        
        btn.appendChild(letterSpan);
        btn.appendChild(textSpan);
        
        btn.onclick = () => {
            playSound('click');
            quizScore += opt.weight;
            currentQuizIndex++;
            loadQuizQuestion();
        };
        optionsGrid.appendChild(btn);
    });
}

function finishQuiz() {
    playSound('win');
    document.getElementById('quiz-progress-fill').style.width = '100%';
    
    let profile = "";
    if (quizScore <= 6) {
        profile = "<strong style='color:#009639; font-size:1.5em;'>Sağlam Rota:</strong><br> Kontrol tamamen sende! Fiziksel ve mental sağlığın çok yerinde. Böyle devam et!";
    } else if (quizScore <= 15) {
        profile = "<strong style='color:#f39c12; font-size:1.5em;'>Uyarı Sinyali:</strong><br> Rotada ufak sapmalar var. Dijital detoks yapmak ve hobilerine daha çok vakit ayırmak sana iyi gelecek.";
    } else {
        profile = "<strong style='color:#ff4b2b; font-size:1.5em;'>Tehlikeli Sapma:</strong><br> Bağımlılık radarına girmişsin! Sağlık hattını acilen onarman gerekiyor. Yeşilay YEDAM (115) ile görüşmekten çekinme.";
    }
    
    gameOver(profile);
}

// =================== PUZZLE GAME (Hangman Style) =================== //
let currentPuzzle = null;

function initPuzzle() {
    currentPuzzleIndex = Math.floor(Math.random() * gameState.puzzleWords.length);
    currentPuzzle = gameState.puzzleWords[currentPuzzleIndex];
    guessedLetters = [];
    wrongGuesses = 0;
    
    document.getElementById('puzzle-clue').innerText = `"${currentPuzzle.hint}"`;
    const livesEl = document.getElementById('puzzle-lives');
    if (livesEl) {
        livesEl.innerHTML = `Kalan Hak: <span id="wrong-count" style="color:var(--danger)">${5 - wrongGuesses}</span>`;
    }
    renderPuzzle();
    renderKeyboard();
}

function renderPuzzle() {
    const targetArea = document.getElementById('puzzle-target');
    targetArea.innerHTML = '';
    
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.justifyContent = 'center';
    container.style.gap = 'clamp(4px, 1.5vw, 12px)';
    
    let win = true;

    for(let i=0; i<currentPuzzle.word.length; i++) {
        const char = currentPuzzle.word[i];
        
        if (char === ' ') {
            const spaceBox = document.createElement('div');
            spaceBox.style.width = 'clamp(15px, 4vw, 30px)';
            container.appendChild(spaceBox);
            continue;
        }

        const box = document.createElement('div');
        box.className = 'letter-box';
        
        if (guessedLetters.includes(char)) {
            box.innerText = char;
            box.classList.add('filled');
        } else {
            win = false;
        }
        container.appendChild(box);
    }
    targetArea.appendChild(container);

    if (win) {
        playSound('win');
        setTimeout(() => {
            currentPuzzleIndex++;
            if (currentPuzzleIndex >= gameState.puzzleWords.length) {
                gameOver("Tebrikler! Tüm kelimeleri başarıyla buldun.");
            } else {
                openModal("TEBRİKLER", "Kelimeyi buldun! Bir sonraki yük için devam edelim.", "fa-star");
                initPuzzle();
            }
        }, 500);
    }
}

function handleGuess(letter) {
    if (guessedLetters.includes(letter)) return;
    
    guessedLetters.push(letter);
    if (currentPuzzle.word.includes(letter)) {
        playSound('good');
        updateScoreUI(gameState.score + 10);
    } else {
        wrongGuesses++;
        flashError();
        if (wrongGuesses >= 5) {
            playSound('bad');
            gameOver(`Maalesef tüm hakların bitti! Doğru cevap: <strong>${currentPuzzle.word}</strong>`);
            return;
        }
    }
    
    const livesEl = document.getElementById('puzzle-lives');
    if (livesEl) {
        livesEl.innerHTML = `Kalan Hak: <span id="wrong-count" style="color:var(--danger)">${5 - wrongGuesses}</span>`;
    }
    renderPuzzle();
    renderKeyboard();
}

function renderKeyboard() {
    const keyboardArea = document.getElementById('puzzle-keyboard');
    keyboardArea.innerHTML = '';
    const layout = ["ABCÇDEFG", "ĞHIİJKLM", "NOÖPRSŞT", "UÜVYZ"];
    
    layout.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        rowDiv.style.justifyContent = 'center';
        rowDiv.style.gap = 'clamp(4px, 1.2vw, 8px)';
        rowDiv.style.marginBottom = 'clamp(4px, 1.2vw, 8px)';
        
        for (let char of row) {
            const btn = document.createElement('div');
            btn.className = 'key-btn';
            btn.innerText = char;
            if (guessedLetters.includes(char)) btn.style.opacity = '0.3';
            btn.onclick = () => handleGuess(char);
            rowDiv.appendChild(btn);
        }
        keyboardArea.appendChild(rowDiv);
    });
}

function getPuzzleHint() {
    if (gameState.score < 20) {
        flashError();
        return;
    }
    
    let unrevealed = [];
    for(let char of currentPuzzle.word) {
        if (char !== " " && !guessedLetters.includes(char)) {
            unrevealed.push(char);
        }
    }
    
    if (unrevealed.length > 0) {
        gameState.score -= 20;
        updateScoreUI(gameState.score);
        const randomChar = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        handleGuess(randomChar);
    }
}

// Info logic
function openModal(title, desc, icon = "fa-circle-info", btnText = "Anladım") {
    playSound('click');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-desc').innerHTML = desc;
    document.getElementById('modal-icon').innerHTML = `<i class="fa-solid ${icon}"></i>`;
    document.getElementById('modal-btn').innerText = btnText;
    
    document.getElementById('site-modal').style.display = 'block';
    document.getElementById('modal-backdrop').style.display = 'block';
}

function closeModal() {
    playSound('click');
    document.getElementById('site-modal').style.display = 'none';
    document.getElementById('modal-backdrop').style.display = 'none';
}

function showInfo(topic) {
    const info = {
        'tech': { 
            title: "Teknoloji Bağımlılığı", 
            text: `
                <div style="text-align:left;">
                    <p>Kontrolsüz ekran kullanımı zihinsel yorgunluğa ve odaklanma sorunlarına yol açar.</p><br>
                    <strong style="color:var(--primary);">Öneriler:</strong>
                    <ul style="margin-left:20px; margin-top:10px;">
                        <li><strong>20-20-20 Kuralı:</strong> Her 20 dakikada bir, 20 saniye boyunca 20 fit (6 metre) uzağa bakarak gözlerini dinlendir.</li>
                        <li><strong>Yataktan Önce:</strong> Uykudan en az 1 saat önce tüm ekranlarla bağını kes.</li>
                        <li><strong>Dijital Diyet:</strong> Bildirimleri kapat ve sadece belirli saatlerde sosyal medyaya bak.</li>
                    </ul>
                </div>
            `
        },
        'tobacco': { 
            title: "Tütün Bağımlılığı", 
            text: `
                <div style="text-align:left;">
                    <p>Sigara içmek vücudun oksijen kapasitesini düşürür ve her nefeste 4000'den fazla zehirli maddeyi ciğerlerine doldurur.</p><br>
                    <strong style="color:var(--primary);">Öneriler:</strong>
                    <ul style="margin-left:20px; margin-top:10px;">
                        <li><strong>Tetikleyicileri Tanı:</strong> Sigara isteği uyandıran ortam ve alışkanlıklardan uzak dur.</li>
                        <li><strong>Su Tüketimi:</strong> İstek geldiğinde bir bardak su içerek ağız alışkanlığını kır.</li>
                        <li><strong>Derin Nefes:</strong> Kriz anlarında 10 kez derin nefes alarak ciğerlerini temiz hava ile doldur.</li>
                    </ul>
                </div>
            `
        },
        'substance': { 
            title: "Madde Bağımlılığı", 
            text: `
                <div style="text-align:left;">
                    <p>Uyuşturucu maddeler beynin ödül sistemini kalıcı olarak bozar ve gerçek mutluluk kaynaklarını yok eder.</p><br>
                    <strong style="color:var(--primary);">Bilmen Gerekenler:</strong>
                    <ul style="margin-left:20px; margin-top:10px;">
                        <li><strong>Hayır Demek:</strong> En büyük özgürlük, zararlı tekliflere "Hayır" diyebilme gücüdür.</li>
                        <li><strong>Sosyal Çevre:</strong> Seni kötü alışkanlıklara değil, başarıya ve sağlığa teşvik eden dostlar seç.</li>
                        <li><strong>YEDAM (115):</strong> Her zaman profesyonel destek alabileceğin Yeşilay yanındadır.</li>
                    </ul>
                </div>
            `
        },
        'alcohol': { 
            title: "Alkol Bağımlılığı", 
            text: `
                <div style="text-align:left;">
                    <p>Alkol, merkezi sinir sistemini yavaşlatarak refleksleri ve muhakeme yeteneğini köreltir.</p><br>
                    <strong style="color:var(--primary);">Gerçekler:</strong>
                    <ul style="margin-left:20px; margin-top:10px;">
                        <li><strong>Karaciğer Sağlığı:</strong> Alkol karaciğeri yorar ve vücudun toksin atma yeteneğini bitirir.</li>
                        <li><strong>Berrak Zihin:</strong> Sağlıklı kararlar ancak alkolün bulanıklığı olmadığında alınabilir.</li>
                        <li><strong>Alternatifler:</strong> Sosyalleşmek için alkole değil, ortak hobilere ve aktivitelere odaklan.</li>
                    </ul>
                </div>
            `
        },
        'gambling': { 
            title: "Kumar Bağımlılığı", 
            text: `
                <div style="text-align:left;">
                    <p>Kumar, kazanma hırsıyla başlayıp kaybetme döngüsüyle devam eden psikolojik bir tuzaktır.</p><br>
                    <strong style="color:var(--primary);">Korunma Yolları:</strong>
                    <ul style="margin-left:20px; margin-top:10px;">
                        <li><strong>Emek ve Sabır:</strong> Gerçek kazanç şans oyunlarında değil, disiplinli çalışmadadır.</li>
                        <li><strong>Zaman Yönetimi:</strong> Boş zamanlarını seni geliştirecek yeteneklere harca.</li>
                        <li><strong>Farkındalık:</strong> Kumarın sadece para değil, aile ve güven kaybı olduğunu unutma.</li>
                    </ul>
                </div>
            `
        },
        'movement': { 
            title: "Sağlıklı Hareket", 
            text: `
                <div style="text-align:left;">
                    <p>Düzenli egzersiz, vücudun doğal antidepresanı olan endorfin ve serotonin salgılatır.</p><br>
                    <strong style="color:var(--primary);">Eylem Planı:</strong>
                    <ul style="margin-left:20px; margin-top:10px;">
                        <li><strong>10.000 Adım:</strong> Günlük hareketliliğini artırmak için asansör yerine merdivenleri kullan.</li>
                        <li><strong>Esneklik:</strong> Uzun süre oturduğunda her saat başı kalkıp 5 dakika esneme hareketleri yap.</li>
                        <li><strong>Geleceğe Yatırım:</strong> Bugün attığın her adım, yaşlılıktaki enerjin için bir birikimdir.</li>
                    </ul>
                </div>
            `
        }
    };
    openModal(info[topic].title, info[topic].text);
}

// Header Scroll Interaction
window.addEventListener('scroll', () => {
    const header = document.querySelector('.main-header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Mobile Menu Toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
    });
}

// Close mobile menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-xmark');
        }
    });
});
