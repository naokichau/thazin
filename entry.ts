const canvasWidthHeight = Math.min(Math.min(window.innerHeight, window.innerWidth), 512);
const GRAVITY = 9.8;
const GAME_SPEED_X = 80;
const BIRD_FRAME_LIST = [
  './images/frame-1.png',
  './images/frame-2.png',
  './images/frame-3.png',
  './images/frame-4.png',
];

let score = 0;
let gravityOn = false;

const TUBE_POS_LIST: number[] = [
  canvasWidthHeight + 50,
  // We will use only one tube for simplicity!
  //canvasWidthHeight + 350,
  //canvasWidthHeight + 650
];
class Bird {
  private speedY: number = 0;
  private sprite = new PIXI.Sprite();
  private isDead: boolean;

  private textureCounter: number = 0;
  private lastY: number = 0;
  private updateTexture = () => {

    if (this.isDead) return;
    this.sprite.texture = PIXI.loader.resources[BIRD_FRAME_LIST[this.textureCounter++]].texture;

    if (this.textureCounter === BIRD_FRAME_LIST.length) this.textureCounter = 0;
  }

  updateSprite = () => {
    this.addSpeed(-options.volume);
    if(gravityOn) this.speedY += GRAVITY / 70;
    this.sprite.y += this.speedY;
    if (this.sprite.y > 480) {
      this.sprite.y = 480;
      this.speedY = 0;
    }
    else if (this.sprite.y < 30) {
      this.sprite.y = 30;
      this.speedY = GRAVITY / 70;
    }
  
    if(gravityOn) this.sprite.rotation = Math.atan(this.speedY / GAME_SPEED_X);
    else this.sprite.rotation = 0;

    this.lastY = this.sprite.y;
    let isCollide = false;
    const { x, y, width, height } = this.sprite;
    // object collision
    this.tubeList.forEach(d => {
      if (d.checkCollision(x - width / 2, y - height / 2, width, height)) isCollide = true;
    });
    // limit bird so that it stays on screen
    if (y > canvasWidthHeight + height / 2) this.sprite.y = canvasWidthHeight + height / 2;
    if (y < -height / 2) this.sprite.y = -height / 2;

    if (isCollide) {
      this.onCollision();
      this.isDead = true;
    }
  }

  addSpeed(speedInc: number) {
    if (!(this.sprite.y < 80)) {
      this.speedY += speedInc;
      this.speedY = Math.max(-GRAVITY / 3.5, this.speedY);
    }
  }

  reset() {
    score = 0;
    this.sprite.x = canvasWidthHeight / 6;
    this.sprite.y = canvasWidthHeight / 2.5;
    this.speedY = 0;
    this.isDead = false;
  }

  constructor(stage: PIXI.Container, readonly tubeList: Tube[], readonly onCollision: () => void) {
    stage.addChild(this.sprite);
    this.sprite.anchor.set(0.5, 0.5);
    this.updateTexture();
    this.sprite.scale.x = 0.1;
    this.sprite.scale.y = 0.1;
    this.reset();

    setInterval(this.updateTexture, 200);
  }
}

class Tube {
  private x: number;
  private y: number;
  private passed: boolean = false;
  private active: boolean = false; // whether the gravity-cancelling effect has been used for a given pass of the tube
  private tubeWidth = 25;

  private sprite = new PIXI.Graphics();

  reset(x: number = canvasWidthHeight + 300) {
    this.x = x;
    this.passed = false;
    this.active = false;
    const tubeMinHeight = 60;
    const randomNum = Math.random() * (canvasWidthHeight - 2 * tubeMinHeight);
    this.y = tubeMinHeight + randomNum;
  }

  checkCollision(x: number, y: number, width: number, height: number) {
    // if (!(x + width < this.x || this.x + this.tubeWidth < x || this.y < y)) {
    //   console.log("whaa");
    //   return true;
    // }
    if (!(x + width < this.x || this.x + this.tubeWidth < x || y + height < this.y)) {
      return true;
    }
    return false;
  }

  update() {
    this.x -= GAME_SPEED_X / 60;
    if (this.x < -this.tubeWidth) this.reset();
    if (this.x < 20 && !this.passed) {
      onTubePass();
      this.passed = true;
    }
    if(this.x < canvasWidthHeight * .75 && !this.active) {
      gravityOn = false; // turn off gravity on approach
      this.active = true;
    }

    this.sprite.clear();
    this.sprite.beginFill(0xffffff, 1);
    const { x, y, tubeWidth } = this;
    this.sprite.drawRect(x, y, tubeWidth, canvasWidthHeight);
    this.sprite.endFill();
  }

  constructor(stage: PIXI.Container, x: number) {
    stage.addChild(this.sprite);
    this.reset(x);
  }
}

// This function will be called when the bird passes a tube fully.
function onTubePass() {
  score++;
  document.getElementById('scoreP').innerHTML = "" + score;
  gravityOn = true;
}

// const renderer = PIXI.autoDetectRenderer(canvasWidthHeight, canvasWidthHeight, { backgroundColor: 0xc1c2c4 });
const renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, { backgroundColor: 0xc1c2c4 });

document.body.appendChild(renderer.view);
const stage = new PIXI.Container();
stage.interactive = true;
stage.hitArea = new PIXI.Rectangle(0, 0, 1000, 1000);
renderer.render(stage);

const tubeList = TUBE_POS_LIST.map(d => new Tube(stage, d));
PIXI.loader
  .add(BIRD_FRAME_LIST)
  .load(setup);

let bird;
const button = document.querySelector('#start');
function setup() {
  beginDetect();
  bird = new Bird(stage, tubeList, () => {
    // Called when bird hit tube/ground/upper bound
    gameFailed = true;
    button.classList.remove('hide');
  });
  requestAnimationFrame(draw);
}

let gameStarted = false;
let gameFailed = false;
function draw() {
  if (gameStarted) {
    bird.updateSprite();
    if (!gameFailed) tubeList.forEach(d => d.update());
  }
  renderer.render(stage);
  requestAnimationFrame(draw);
}

button.addEventListener('click', () => {
  gameStarted = true;
  button.innerHTML = 'Retry';
  if (gameFailed) {
    gameFailed = false;
    tubeList.forEach((d, i) => d.reset(TUBE_POS_LIST[i]));
    bird.reset();
    recorder.start()
  }
  // document.removeEventListener('audio', handleTest)
  startRecording()
  button.classList.add('hide');
});

// BEGIN AUDIO CONTROL CODE

var audioContext;
var mediaStreamSource = null
var meter = null
const chunks = [];
var recorder
declare var MediaRecorder: any;
let audioElement = null;

const saveChunkToRecording = (event) => {
  console.log(event.data)
  chunks.push(event.data);
};

const saveRecording = () => {
  const blob = new Blob(chunks, {
    type: 'audio/mp4; codecs=opus'
  });
  const url = URL.createObjectURL(blob);

  audioElement.setAttribute('src', url);
};


function beginDetect() {
  audioContext = new AudioContext()
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      audioElement = document.getElementById('audio-player');
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = saveChunkToRecording;
      recorder.onstop = saveRecording;
      mediaStreamSource = audioContext.createMediaStreamSource(stream)
      meter = createAudioMeter(audioContext)
      mediaStreamSource.connect(meter)
      setTimeout(() => {
        recorder.start()
      }, 1000)
    })
  }
}

let options = {
  clipping: false,
  lastClip: 0,
  volume: 0,
  clipLevel: 0.98,
  averaging: 0.97,
  clipLag: 750
}

var checkClipping = function () {
  if (!options.clipping) {
    return false
  }
  if ((options.lastClip + options.clipLag) < performance.now()) {
    options.clipping = false
  }
  return options.clipping
}

var shutdown = function () {
  this.disconnect()
  this.onaudioprocess = null
}


function createAudioMeter(audioContext: AudioContext, clipLevel?: number, averaging?: number, clipLag?: number) {
  const processor = audioContext.createScriptProcessor(512)
  processor.onaudioprocess = volumeAudioProcess

  options.clipLevel = clipLevel || options.clipLevel
  options.averaging = averaging || options.averaging
  options.clipLag = clipLag || options.clipLag

  // this will have no effect, since we don't copy the input to the output,
  // but works around a current Chrome bug.
  processor.connect(audioContext.destination)
  return processor
}

function volumeAudioProcess(event) {
  const buf = event.inputBuffer.getChannelData(0)
  const bufLength = buf.length
  let sum = 0
  let x

  // Do a root-mean-square on the samples: sum up the squares...
  for (var i = 0; i < bufLength; i++) {
    x = buf[i]
    if (Math.abs(x) >= options.clipLevel) {
      options.clipping = true
      options.lastClip = window.performance.now()
    }
    sum += x * x * 2
  }

  // ... then take the square root of the sum.
  const rms = Math.sqrt(sum / bufLength)

  // Now smooth this out with the averaging factor applied
  // to the previous sample - take the max here because we
  // want "fast attack, slow release."
  options.volume = Math.max(rms, options.volume * options.averaging)
  document.getElementById('audio-value').innerHTML = options.volume.toFixed(2)
  const test = new CustomEvent('audio', { detail: buf });
  document.dispatchEvent(test);
}

function startRecording() {
  setTimeout(() => {
    console.log("record stopped")
    recorder.stop();
  }, 3000)
}