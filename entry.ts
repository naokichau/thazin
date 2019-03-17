const canvasWidthHeight = Math.min(Math.min(window.innerHeight, window.innerWidth), 512);
const GRAVITY = 9.8;
const GAME_SPEED_X = 120;
const BIRD_FRAME_LIST = [
  './images/frame-1.png',
  './images/frame-2.png',
  './images/frame-3.png',
  './images/frame-4.png',
];

var score = 0;
var gravityOn = true;
var canvasWidth = window.innerWidth;
var canvasHeight = window.innerHeight;

// SYMBOL CODE

class ImageSrc {
  public path: string;
  public start: number;


  constructor(p: string, s: number) {
    this.path = p;
    this.start = s;
  }
}
// flesh out!
const SYMBOL_LIST = [
  new ImageSrc("./images/dogs.jpg", canvasWidth + 50),
  new ImageSrc("./images/cats.jpg", canvasWidth * 2 + 50),
]

// END SYMBOL CODE

// TODO: reduce dependency on this list we don't use
// const TUBE_POS_LIST: number[] = [
//   canvasWidth + 50,
//   // We will use only one tube for simplicity!
//   //canvasWidthHeight + 350,
//   //canvasWidthHeight + 650
// ];
class Bird {
  private speedY: number = 0;
  private sprite = new PIXI.Sprite();
  private isDead: boolean;

  private textureCounter: number = 0;
  private updateTexture = () => {

    if (this.isDead) return;
    this.sprite.texture = PIXI.loader.resources[BIRD_FRAME_LIST[this.textureCounter++]].texture;

    if (this.textureCounter === BIRD_FRAME_LIST.length) this.textureCounter = 0;
  }

  updateSprite = () => {
    this.addSpeed(-options.volume);
    if (gravityOn) this.speedY += GRAVITY / 70;
    this.sprite.y += this.speedY;
    if (this.sprite.y > canvasHeight - 50) {
      this.sprite.y = canvasHeight - 50;
      this.speedY = 0;
    }
    else if (this.sprite.y < 150) {
      this.sprite.y = 150;
      this.speedY = GRAVITY / 70;
    }

    if (gravityOn) this.sprite.rotation = Math.atan(this.speedY / GAME_SPEED_X);
    else this.sprite.rotation = 0;

    let isCollide = false;
    const { x, y, width, height } = this.sprite;
    // object collision
    this.tubeList.forEach(d => {
      if (d.checkCollision(x - width / 2, y - height / 2, width, height)) isCollide = true;
    });
    // limit bird so that it stays on screen
    if (y > canvasHeight + height / 2) this.sprite.y = canvasHeight + height / 2;
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
    this.sprite.x = canvasWidth / 6;
    this.sprite.y = canvasHeight / 2.5;
    this.speedY = 0;
    this.isDead = false;
    document.getElementById('scoreP').innerHTML = "" + score;
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
  private src: ImageSrc;
  private passed: boolean = false;
  private active: boolean = false; // whether the gravity-cancelling effect has been used for a given pass of the tube
  // private tubeWidth = 25;

  private sprite: PIXI.Sprite; // = new PIXI.Sprite(PIXI.Texture.from(this.src.path));

  // TODO: we need to fix this
  reset(x: number = canvasWidth + 2 * this.sprite.width) {
    this.x = x;
    this.y = canvasHeight - this.sprite.height;
    this.passed = false;
    this.active = false;
    //const tubeMinHeight = 60;
    //const randomNum = Math.random() * (canvasHeight - (canvasHeight / 100) * tubeMinHeight);

  }

  checkCollision(x: number, y: number, width: number, height: number) {
     if(((x > this.x && x < this.x + this.sprite.width)|| (x + width > this.x && x + width < this.x + this.sprite.width)) && ((y > this.y || y + height > this.y))) {
    //if (!(x + width < this.x || this.x + this.sprite.width < x || y + height < this.y)) {
      stopRecording()
      return true;
    }
    return false;
  }

  update() {
    this.x -= GAME_SPEED_X / 60;
    if (this.x < -this.sprite.width) this.reset();
    if (this.x < canvasWidth / 7 && !this.passed) {
      onTubePass();
      stopRecording()
      this.passed = true;

    }
    if (this.x < canvasWidth * .5 && !this.active) {
      gravityOn = false; // turn off gravity on approach
      this.active = true;
    }

    this.sprite.x = this.x;
    this.sprite.y = this.y;



    // TODO: change to make it use a sprite!
    // this.sprite.clear();
    // this.sprite.beginFill(0xffffff, 1);
    // const { x, y, tubeWidth } = this;
    // this.sprite.drawRect(x, y, tubeWidth, canvasHeight);
    // this.sprite.endFill();
  }

  constructor(stage: PIXI.Container, img: ImageSrc) {
    this.src = img;
    this.sprite = new PIXI.Sprite(PIXI.Texture.from(this.src.path));
    stage.addChild(this.sprite);
    // this.sprite.anchor.set(this.x, this.y);
    this.reset(img.start);
  }
}

// This function will be called when the bird passes a tube fully.
function onTubePass() {
  score++;
  document.getElementById('scoreP').innerHTML = "" + score;
  gravityOn = true;
}

const renderer = PIXI.autoDetectRenderer(window.innerWidth * 3 / 4, window.innerHeight, { backgroundColor: 0xffffff });
var gameArea = document.getElementById('box-game')
gameArea.appendChild(renderer.view);
const stage = new PIXI.Container();


var landscapeTexture = PIXI.Texture.fromImage('/images/wall.jpg', false, 10, 10);

// new sprite
var background = new PIXI.Sprite(landscapeTexture);


background.anchor.x = 0;
background.anchor.y = 0;

background.position.x = 0;
background.position.y = 0;

stage.addChild(background);

stage.interactive = false;
stage.hitArea = new PIXI.Rectangle(0, 0, 1000, 1000); // do we need to change this?
renderer.render(stage);

const tubeList = SYMBOL_LIST.map(d => new Tube(stage, d));
PIXI.loader
  .add(BIRD_FRAME_LIST)
  .load(setup);

let bird;
const button = document.querySelector('#start');
function setup() {
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
  beginDetect();
  gameStarted = true;
  button.innerHTML = 'Retry';
  if (gameFailed) {
    gameFailed = false;
    tubeList.forEach((d, i) => d.reset(SYMBOL_LIST[i].start));
    bird.reset();
  }
  button.classList.add('hide');
  setTimeout(() => {
    startRecording()
  }, 400)
});

// BEGIN AUDIO CONTROL CODE

var audioContext;
var mediaStreamSource = null
var meter = null
const chunks = [];
var audioRecords = [];
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

  audioRecords.push(blob)
  // audioElement.setAttribute('src', url);
  console.log(audioRecords)
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
  console.log("record started")
  recorder.start();
}

function stopRecording() {
  console.log("record stopped")
  if recorder.state == "recording"{
    recorder.stop();
  }
}

// function stopStream(stream){
//   stream.getTracks().forEach( track => track.stop() );
//   };