// import WaveBell from "wavebell"
var canvasWidthHeight = Math.min(Math.min(window.innerHeight, window.innerWidth), 512);
var GRAVITY = 9.8;
var GAME_SPEED_X = 80;
var BIRD_FRAME_LIST = [
    './images/frame-1.png',
    './images/frame-2.png',
    './images/frame-3.png',
    './images/frame-4.png',
];
var TUBE_POS_LIST = [
    canvasWidthHeight + 50,
    canvasWidthHeight + 250,
    canvasWidthHeight + 480
];
var Bird = /** @class */ (function () {
    function Bird(stage, tubeList, onCollision) {
        var _this = this;
        this.tubeList = tubeList;
        this.onCollision = onCollision;
        this.speedY = 0;
        this.sprite = new PIXI.Sprite();
        this.textureCounter = 0;
        this.lastY = 0;
        this.updateTexture = function () {
            if (_this.isDead)
                return;
            _this.sprite.texture = PIXI.loader.resources[BIRD_FRAME_LIST[_this.textureCounter++]].texture;
            if (_this.textureCounter === BIRD_FRAME_LIST.length)
                _this.textureCounter = 0;
        };
        this.updateSprite = function () {
            _this.addSpeed(-options.volume);
            _this.speedY += GRAVITY / 70;
            _this.sprite.y += _this.speedY;
            if (_this.sprite.y > 480) {
                _this.sprite.y = 480;
                _this.speedY = 0;
            }
            else if (_this.sprite.y < 30) {
                _this.sprite.y = 30;
                _this.speedY = GRAVITY / 70;
            }
            _this.sprite.rotation = Math.atan(_this.speedY / GAME_SPEED_X); // fix this lol
            _this.lastY = _this.sprite.y;
            var isCollide = false;
            var _a = _this.sprite, x = _a.x, y = _a.y, width = _a.width, height = _a.height;
            // Can use this later for object collision
            _this.tubeList.forEach(function (d) {
                if (d.checkCollision(x - width / 2, y - height / 2, width, height))
                    isCollide = true;
            });
            if (y < -height / 2 || y > canvasWidthHeight + height / 2)
                isCollide = true;
            if (y > canvasWidthHeight + height / 2)
                _this.sprite.y = canvasWidthHeight + height / 2;
            if (y < -height / 2)
                _this.sprite.y = -height / 2;
            if (isCollide) {
                _this.onCollision();
                _this.isDead = true;
            }
            console.log("Updated");
        };
        stage.addChild(this.sprite);
        this.sprite.anchor.set(0.5, 0.5);
        this.updateTexture();
        this.sprite.scale.x = 0.06;
        this.sprite.scale.y = 0.06;
        this.reset();
        // document.addEventListener('keydown', e => {
        //   if (e.keyCode == 32) this.addSpeed(-GRAVITY / 3);
        // });
        // stage.on('pointerdown', () => this.addSpeed(-GRAVITY / 3))
        setInterval(this.updateTexture, 200);
    }
    Bird.prototype.addSpeed = function (speedInc) {
        if (!(this.sprite.y < 80)) {
            this.speedY += speedInc;
            this.speedY = Math.max(-GRAVITY / 3.5, this.speedY);
        }
    };
    Bird.prototype.reset = function () {
        this.sprite.x = canvasWidthHeight / 6;
        this.sprite.y = canvasWidthHeight / 2.5;
        this.speedY = 0;
        this.isDead = false;
    };
    return Bird;
}());
var Tube = /** @class */ (function () {
    function Tube(stage, x) {
        this.innerDistance = 120;
        this.tubeWidth = 25;
        this.sprite = new PIXI.Graphics();
        stage.addChild(this.sprite);
        this.reset(x);
    }
    Tube.prototype.reset = function (x) {
        if (x === void 0) { x = canvasWidthHeight + 300; }
        this.x = x;
        var tubeMinHeight = 60;
        var randomNum = Math.random() * (canvasWidthHeight - 2 * tubeMinHeight - this.innerDistance);
        this.y = tubeMinHeight + randomNum;
    };
    Tube.prototype.checkCollision = function (x, y, width, height) {
        if (!(x + width < this.x || this.x + this.tubeWidth < x || this.y < y)) {
            return true;
        }
        if (!(x + width < this.x || this.x + this.tubeWidth < x || y + height < this.y + this.innerDistance)) {
            return true;
        }
        return false;
    };
    Tube.prototype.update = function () {
        this.x -= GAME_SPEED_X / 60;
        if (this.x < -this.tubeWidth)
            this.reset();
        this.sprite.clear();
        this.sprite.beginFill(0xffffff, 1);
        var _a = this, x = _a.x, y = _a.y, tubeWidth = _a.tubeWidth, innerDistance = _a.innerDistance;
        this.sprite.drawRect(x, 0, tubeWidth, y);
        this.sprite.drawRect(x, y + innerDistance, tubeWidth, canvasWidthHeight);
        this.sprite.endFill();
    };
    return Tube;
}());
var renderer = PIXI.autoDetectRenderer(canvasWidthHeight, canvasWidthHeight, { backgroundColor: 0xc1c2c4 });
document.body.appendChild(renderer.view);
var stage = new PIXI.Container();
stage.interactive = true;
stage.hitArea = new PIXI.Rectangle(0, 0, 1000, 1000);
renderer.render(stage);
var tubeList = TUBE_POS_LIST.map(function (d) { return new Tube(stage, d); });
PIXI.loader
    .add(BIRD_FRAME_LIST)
    .load(setup);
var bird;
var button = document.querySelector('#start');
function setup() {
    bird = new Bird(stage, tubeList, function () {
        // Called when bird hit tube/ground/upper bound
        gameFailed = true;
        button.classList.remove('hide');
    });
    requestAnimationFrame(draw);
}
var gameStarted = false;
var gameFailed = false;
function draw() {
    if (gameStarted) {
        bird.updateSprite();
        if (!gameFailed)
            tubeList.forEach(function (d) { return d.update(); });
    }
    renderer.render(stage);
    requestAnimationFrame(draw);
}
button.addEventListener('click', function () {
    gameStarted = true;
    button.innerHTML = 'Retry';
    if (gameFailed) {
        gameFailed = false;
        tubeList.forEach(function (d, i) { return d.reset(TUBE_POS_LIST[i]); });
        bird.reset();
    }
    button.classList.add('hide');
});
// BEGIN AUDIO CONTROL CODE
var audioContext;
var mediaStreamSource = null;
var meter = null;
function beginDetect() {
    audioContext = new AudioContext();
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
            mediaStreamSource = audioContext.createMediaStreamSource(stream);
            meter = createAudioMeter(audioContext);
            mediaStreamSource.connect(meter);
        });
    }
}
var options = {
    clipping: false,
    lastClip: 0,
    volume: 0,
    clipLevel: 0.98,
    averaging: 0.97,
    clipLag: 750
};
var checkClipping = function () {
    if (!options.clipping) {
        return false;
    }
    if ((options.lastClip + options.clipLag) < performance.now()) {
        options.clipping = false;
    }
    return options.clipping;
};
var shutdown = function () {
    this.disconnect();
    this.onaudioprocess = null;
};
function createAudioMeter(audioContext, clipLevel, averaging, clipLag) {
    var processor = audioContext.createScriptProcessor(512);
    processor.onaudioprocess = volumeAudioProcess;
    options.clipLevel = clipLevel || options.clipLevel;
    options.averaging = averaging || options.averaging;
    options.clipLag = clipLag || options.clipLag;
    // this will have no effect, since we don't copy the input to the output,
    // but works around a current Chrome bug.
    processor.connect(audioContext.destination);
    return processor;
}
function volumeAudioProcess(event) {
    var buf = event.inputBuffer.getChannelData(0);
    var bufLength = buf.length;
    var sum = 0;
    var x;
    // Do a root-mean-square on the samples: sum up the squares...
    for (var i = 0; i < bufLength; i++) {
        x = buf[i];
        if (Math.abs(x) >= options.clipLevel) {
            options.clipping = true;
            options.lastClip = window.performance.now();
        }
        sum += x * x * 2;
    }
    // ... then take the square root of the sum.
    var rms = Math.sqrt(sum / bufLength);
    // Now smooth this out with the averaging factor applied
    // to the previous sample - take the max here because we
    // want "fast attack, slow release."
    options.volume = Math.max(rms, options.volume * options.averaging);
    document.getElementById('audio-value').innerHTML = options.volume.toFixed(2);
}
// var bell = new WaveBell();
// bell.on('wave', function (e) {
//   // draw oscilloscope
//   // drawColumn(e.value);
//   console.log(e.value)
// });
// bell.on('stop', function () {
//   var blob = bell.result;
//   // play recorded audio
//   // playback(URL.createObjectURL(blob));
// });
// // 25 frames per second
// bell.start(1000 / 25);
beginDetect();
