window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = null;
var unlocked = false;
var isPlaying = false;  //現在再生中かどうか
var startTime;
var current16thNote;  //現在の最後に予定されているメモは何か
var bpm = 75;
var lookahead = 25.0; //スケジューリング関数を呼び出す頻度(ミリ秒)
var scheduleAheadTime = 0.1;  //音をスケジュールする予定時刻(秒)
                              //先読みから計算され、タイマーが遅れた場合は次の間隔と重複する
var nextNoteTime = 0.0; //次のメモの期限が来たとき
var noteResolution = 0; //0 == 16分、1 == 8分、2 ==四分音符
var noteLength = 0.05;  //ビープ音の長さ(秒単位)

var canvas,                 // the canvas element
    canvasContext;          // canvasContext is the canvas' context 2D
var last16thNoteDrawn = -1; // the last "box" we drew on the screen
var notesInQueue = [];      // the notes that have been put into the web audio,
                            // and may or may not have played yet. {note, time}
var timerWorker = null;     // The Web Worker used to fire timer messages


// First, let's shim the requestAnimationFrame API, with a setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function( callback ){
      window.setTimeout(callback, 1000 / 60);
  };
})();


function nextNote() {
  //現在の音符と時間を16分音符分進める
  var bps = 60 / bpm;
  nextNoteTime += 0.25 * bps;  //最後のビート時間に16分音符の長さのビートを追加する　16分音符 = 0.25 8分音符 = 0.5 4分音符 = bps
  current16thNote++;  //ビート番号を進めてゼロに折り返す
  if (current16thNote == 16) {
      current16thNote = 0;
  }
}

function scheduleNote( beatNumber, time ) {
  //再生していない場合でも、キューにノートをプッシュする
  notesInQueue.push( { note: beatNumber, time: time } );

  if ( (noteResolution==1) && (beatNumber%2))
      return; //16分音符以外の8分音符は演奏しない
  if ( (noteResolution==2) && (beatNumber%4))
      return; //4分音符以外の8分音符を演奏しない

  // create an oscillator
  /*
  var osc = context.createOscillator();
  osc.connect( context.destination );
  if (beatNumber % 16 === 0)    // beat 0 == high pitch
      osc.frequency.value = 880.0;
  else if (beatNumber % 4 === 0 )    // quarter notes = medium pitch
      osc.frequency.value = 440.0;
  else                        // other 16th notes = low pitch
      osc.frequency.value = 220.0;

  osc.start( time );
  osc.stop( time + noteLength );*/

  context = new AudioContext();
  var buffer = null;
  var source = context.createBufferSource();

  var request = new XMLHttpRequest();
  request.open('GET', './sound/heart.mp3', true);
  request.responseType = 'arraybuffer';
  request.send();

  request.onload = function () {
    var res = request.response;
    context.decodeAudioData(res, function (buf) {
      source.buffer = buf;
    });
  };

  source.connect(context.destination);
  source.start(time);
  source.stop(time + noteLength);

}

function scheduler() {
  //次の間隔の前に再生するノートをスケジュールし、ポインターを進める
  while (nextNoteTime < context.currentTime + scheduleAheadTime ) {
      scheduleNote( current16thNote, nextNoteTime );
      nextNote();
  }
}

function play() {
  if (!unlocked) {
    // play silent buffer to unlock the audio
    var buffer = context.createBuffer(1, 1, 22050);
    var node = context.createBufferSource();
    node.buffer = buffer;
    node.start(0);
    unlocked = true;
  }

  isPlaying = !isPlaying;

  if (isPlaying) { // start playing
      current16thNote = 0;
      nextNoteTime = context.currentTime;
      timerWorker.postMessage("start");
      return "stop";
  } else {
      timerWorker.postMessage("stop");
      return "play";
  }
}

function resetCanvas (e) {
  // resize the canvas - but remember - this clears the canvas too.
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  //make sure we scroll to the top left.
  window.scrollTo(0,0); 
}



function draw() {
  var currentNote = last16thNoteDrawn;
  var currentTime = context.currentTime;

  while (notesInQueue.length && notesInQueue[0].time < currentTime) {
      currentNote = notesInQueue[0].note;
      notesInQueue.splice(0,1);   // remove note from queue
  }

  // We only need to draw if the note has moved.
  if (last16thNoteDrawn != currentNote) {
      var x = Math.floor( canvas.width / 18 );
      canvasContext.clearRect(0,0,canvas.width, canvas.height); 
      for (var i=0; i<16; i++) {
          canvasContext.fillStyle = ( currentNote == i ) ? 
              ((currentNote%4 === 0)?"red":"blue") : "black";
          canvasContext.fillRect( x * (i+1), x, x/2, x/2 );
      }
      last16thNoteDrawn = currentNote;
  }

  // set up to draw again
  requestAnimFrame(draw);
}

var getAudioBuffer = function(url, fn) {  
  var request = new XMLHttpRequest();
  request.responseType = 'arraybuffer';

  request.onreadystatechange = function() {
    if (request.readyState === 4) {
      if (request.status === 0 || request.status === 200) {
        context.decodeAudioData(request.response, function(buffer) {
          fn(buffer);
        });
      }
    }
  };

  request.open('GET', url, true);
  request.send('');
};



function init(){
  var container = document.createElement( 'div' );
  container.className = "container";
  canvas = document.createElement( 'canvas' );
  anvasContext = canvas.getContext( '2d' );
  canvas.width = window.innerWidth; 
  canvas.height = window.innerHeight; 
  document.body.appendChild( container );
  container.appendChild(canvas);    



  context = new AudioContext();

  // if we wanted to load audio files, etc., this is where we should do it.



  requestAnimFrame(draw);    // start the drawing loop.

  timerWorker = new Worker("worker.js");

  timerWorker.onmessage = function(e) {
  if (e.data == "tick") {
  // console.log("tick!");
  scheduler();
  }
  else
  console.log("message: " + e.data);
  };
  timerWorker.postMessage({"interval":lookahead});
}

window.addEventListener("load", init );
