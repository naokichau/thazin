const canvasWidthHeight = Math.min(Math.min(window.innerHeight, window.innerWidth), 512);
const GRAVITY = 9.8;
const GAME_SPEED_X = 120;
const BIRD_FRAME_LIST = [
  './images/frame-1.png',
  './images/frame-2.png',
  './images/frame-3.png',
  './images/frame-4.png',
  "./images/dogs.jpg",
  "./images/cats.jpg",
  "./images/apple.png",
  "./images/pineapple.png",
  "./images/book.png",
];


class ImageObj {
  public url: string;
  public id: string;

  constructor(url: string, id: string) {
    this.url = url;
    this.id = id;
  }
}

var objectList = [new ImageObj("sdf", "sdfsd")]


var score = 0;
var gravityOn = true;
var canvasWidth = window.innerWidth;
var canvasHeight = window.innerHeight;

// SYMBOL CODE

// class ImageSrc {
//   public path: string;
//   public start: number;
//   public texture: PIXI.Texture;


//   constructor(p: string, s: number) {
//     this.path = p;
//     this.start = s;
//     this.texture = PIXI.Texture.from(p);
//   }
// }
// flesh out!
// const SYMBOL_LIST = [
//   new ImageSrc("./images/dogs.jpg", canvasWidth + 50),
//   new ImageSrc("./images/cats.jpg", canvasWidth * 2 + 50),
// ]

// const TUBE_PATHS = [
//   "./images/dogs.jpg",
//   "./images/cats.jpg",
//   "./images/apple.png",
//   "./images/pineapple.png",
//   "./images/book.png",
// ];

// END SYMBOL CODE

class Bird {
  private speedY: number = 0;
  private sprite = new PIXI.Sprite();
  private isDead: boolean;

  private textureCounter: number = 0;
  private updateTexture = () => {

    if (this.isDead) return;
    this.sprite.texture = PIXI.loader.resources[BIRD_FRAME_LIST[this.textureCounter++]].texture;

    if (this.textureCounter === 4) this.textureCounter = 0; // === BIRD_FRAME_LIST.length
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
    } else {
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
  // private x: number;
  // private y: number;
  private src: PIXI.Texture;
  private passed: boolean = false;
  private appeared: boolean = false;
  private active: boolean = false; // whether the gravity-cancelling effect has been used for a given pass of the tube

  private sprite: PIXI.Sprite;

  // TODO: we need to fix this
  reset(x: number = canvasWidth * (BIRD_FRAME_LIST.length - 4) + this.sprite.width) {
    // console.log(this.sprite.y + this.src.path + "\n" + canvasHeight + ", " + this.sprite.height);
    // if(this.sprite.height == 1) {
    //   this.sprite = new PIXI.Sprite(PIXI.Texture.from(this.src.path));
    // }
    this.sprite.x = x;
    this.sprite.y = canvasHeight - this.sprite.height;
    // need we do something with y?
    this.passed = false;
    this.appeared = false;
    this.active = false;
    //console.log("Reset\n" + this.sprite.y + this.src + "\n" + canvasHeight + ", " + this.sprite.height);
    
  }

  checkCollision(x: number, y: number, width: number, height: number) {
    if (((x > this.sprite.x && x < this.sprite.x + this.sprite.width)
      || (x + width > this.sprite.x && x + width < this.sprite.x + this.sprite.width))
      && ((y > this.sprite.y || y + height > this.sprite.y))) {
      if (!gameFailed) {
        stopRecording()
      }
      return true;
    }
    return false;
  }

  update() {
    //console.log("update tube!")
    this.sprite.x -= GAME_SPEED_X / 60;
    if (this.sprite.x < -this.sprite.width) this.reset();
    if (this.sprite.x + this.sprite.width < canvasWidth / 7 && !this.passed) {
      onTubePass();
      stopRecording()
      setTimeout(() => {
        startRecording()
      }, 500)
      this.passed = true;

    }
    if(this.sprite.x < canvasWidth && !this.appeared) {
      onTubeAppear();
      this.appeared = true;
    }

    if (this.sprite.x < canvasWidth * .5 && !this.active) {
      gravityOn = false; // turn off gravity on approach
      this.active = true;
    }

    // this.sprite.x = this.x;
    // this.sprite.y = this.y; //theoretically not necessary, but...
    //console.log("Updated tube! X: " + this.sprite.x)
  }

  constructor(stage: PIXI.Container, img: PIXI.Texture, x: number) {
    this.src = img;
    this.sprite = new PIXI.Sprite(img);
    this.reset(x);
    //this.sprite.anchor.set(0, 0);
    stage.addChild(this.sprite);

    // this.y = canvasHeight - this.sprite.height;
    // this.sprite.y = this.y;
  }
}

// This function will be called when the bird passes a tube fully.
function onTubePass() {
  score++;
  document.getElementById('scoreP').innerHTML = "" + score;
  gravityOn = true;
}

// called when a tube appears on screen
function onTubeAppear() {

}




const renderer = PIXI.autoDetectRenderer(window.innerWidth * 3 / 4, window.innerHeight, { backgroundColor: 0xffffff });
var gameArea = document.getElementById('box-game')
gameArea.appendChild(renderer.view);
const stage = new PIXI.Container();


var landscapeTexture = PIXI.Texture.fromImage('/images/wall.jpg', false);

// new sprite
var background = new PIXI.Sprite(landscapeTexture);
background.scale.x = 0.85;
background.scale.y = 0.85;

background.anchor.x = 0;
background.anchor.y = 0;

background.position.x = 0;
background.position.y = 0;

stage.addChild(background);

stage.interactive = false;
stage.hitArea = new PIXI.Rectangle(0, 0, 1000, 1000); // do we need to change this?
renderer.render(stage);

// TUBE INIT CODE

var tubeTextures = [];
var tubeList = [];
function initTubes() {
  console.log("initTubes")
  for (var i = 4; i < BIRD_FRAME_LIST.length; i++) { // we use now the one array for all textures - a hacky solution
    let textureHolder = PIXI.loader.resources[BIRD_FRAME_LIST[i]].texture;
    tubeList.push(new Tube(stage, textureHolder, canvasWidth * 1.5 * (i - 3) + textureHolder.width));
  }
  //tubeList = tubeTextures.map(t => new Tube(stage, t, ));
}


// don't use this
// function test(callback) {
//     console.log("running test")
//     for(var i = 0; i < TUBE_PATHS.length; i++) {
//       tubeTextures.push(PIXI.Texture.fromImage(TUBE_PATHS[i]));
//       console.log(tubeTextures[i])
//     }
//     console.log("done with test")
//     callback();
// }
// console.log("just before running test")
// test(initTubes);
// const tubeList = SYMBOL_LIST.map(d => new Tube(stage, d));

// END TUBE INIT CODE

PIXI.loader
  .add(BIRD_FRAME_LIST)
  .load(setup);

let bird;
const button = document.querySelector('#start');
function setup() {
  initTubes();
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
  audioRecords = []
  beginDetect();
  gameStarted = true;
  button.innerHTML = 'Retry';
  if (gameFailed) {
    gameFailed = false;
    tubeList.forEach((d, i) => d.reset((i + 1) * canvasWidth * 1.5 + d.sprite.width));
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
var chunks = [];
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
  chunks = []
  const url = URL.createObjectURL(blob);
  if (!gameFailed) {
    audioRecords.push(blob)
  }
  console.log(audioRecords)


  var itmbox = document.createElement("div")
  itmbox.className = "audio-image-box"

  var itmaudio = document.createElement("audio")
  itmaudio.id = "test1"
  itmbox.appendChild(itmaudio)

  var itmImg = document.createElement("div")
  itmImg.className = "audio-image"
  itmImg.setAttribute("style", "background:url('./images/dogs.jpg') center")

  var itmbtn = document.createElement("button")
  itmbtn.className = "audio-btn"
  var itmBtnImg = document.createElement("div")
  itmBtnImg.className = "audio-btn-image"

  itmbtn.appendChild(itmBtnImg)
  itmImg.appendChild(itmbtn)
  itmbox.appendChild(itmImg)

  var audtrks = document.getElementById('audio-tracks')
  audtrks.appendChild(itmbox)
  // audioElement.setAttribute('src', url);
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
  if (recorder.state == "recording") {
    recorder.stop();
  }
}

// function stopStream(stream){
//   stream.getTracks().forEach( track => track.stop() );
//   };