window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = null;
var unlocked = false;
var isPlaying = false;  //現在再生中かどうか
var startTime;
var currentNote;  //現在の最後に予定されているメモは何か
var lookahead = 25.0; //スケジューリング関数を呼び出す間隔(ミリ秒)
var scheduleAheadTime = 0.1;  //音をスケジュールする先読み時間の長さ(秒)
                              //先読みから計算され、タイマーが遅れた場合は次の間隔と重複する
var nextNoteTime = 0.0; //次のメモの期限が来たとき
var noteLength = 0.05;  //ビープ音の長さ(秒単位)
var beat = null; //心拍の音を入れる箱
const bpms = [
  70,87,88,84,91,94,92,93,96,99,
  101,100,100,98,96,94,95,94,95,
  95,97,98,99,100,99,99,100,99,97,
  98,97,96,95,96,97,98,99,101,102,
  101,98,104,103,100,99,99,98,97,
  98,99,103,100,100,100,102,101,103,
  104,105,104,103,102,99,100,99,100,
  104,103,103,102,101,100,97,99,98,
  98,97,96,93,92,92,93,94,95,96,101,
  101,101,101,102,102,101,101,100,100,
  95,98,98,98,98,99,99,99,99,99,99,99,
  98,98,98,98,98,99,99,98,99,100,105,
  106,105,104,100,100,101,103,104,105,
  105,104,102,101,100,95,95,95,92,92,92,93,
  95,95,96,94,97,99,99,98,97,96,95,95,95,95,
  94,94,95,94,105,104,104,105,104,103,99,98,
  97,95,95,95,97,99,99,98,98,97,96,96,97,97,
  97,94,93,93,93,93,92,92,93,94,94,95,97,97,
  97,96,96,97,100,100,100,99,97,94,91,97,96,
  95,93,94,92,94,95,97,96,97,97,97,95,95,96,
  97,96,94,95,92,93,93,93,94,94,96,96,97,98,
  98,96,97,96,95,96,97,98,97,95,96,96,97,95,
  96,96,96,96,97,97,98,97,103,105,106,107,105,
  102,94,91,87,84,92,93,93,94,93,92,91,90,91,
  92,91,90,89,90,91,89,90,87,85,84,84,86,87
];
var bpm = bpms[0];
var count = 0;
var timer = null;



function startTimer() {
  timer = setInterval(update, 3000);
}

function stopTimer() {
  clearInterval(timer);
  count = 0;
  bpm = bpms[count];
}

var update = function() {
  console.log(count);
  if(count < bpms.length) {
    ++count;
    console.log("countup");
    if(count == bpms.length) {
      count = 0;
      console.log("countdown");
    }
  }
  console.log(count);
  bpm = bpms[count];
  document.getElementById("bpm").innerHTML = bpm;
};

function nextNote() {
  //現在の音符と時間を次の4分音符に進める
  //nextNoteTime変数とcurrentNote変数の更新
  var bps = 60 / bpm;
  nextNoteTime += bps;  //最後のビート時間に16分音符の長さのビートを追加する　16分音符 = 0.25 8分音符 = 0.5 をbpsとかける
  currentNote++;  //ビート番号を進めてゼロに折り返す
  if (currentNote == 4) {
      currentNote = 0;
  }
}

function scheduleNote( time ) {
  //次に鳴らすべきWebAudioの音をスケジューリングする

  //AudioBufferSourceノードを作成して任意の音をここで設定できる
  var source = context.createBufferSource();
  source.buffer = beat;
  source.connect(context.destination);
  source.start(time); 
}

function scheduler() {
  //オーディオクロックの時間を取得し、次に鳴らすべき音の発音時刻と比較する
  //ほとんどはスケジュールされる音が存在せずに無処理で抜ける
  //存在したらWebAudioAPIを使って次の間隔の前に再生するノートをスケジュールし、ポインターを進める
  //この関数はlookaheadで設定したミリ秒ごとに呼ばれる
  while (nextNoteTime < context.currentTime + scheduleAheadTime ) {
      scheduleNote( nextNoteTime );
      nextNote();
  }
}

function play() {
  if (!unlocked) {
    //サイレントバッファを再生してオーディオのロックを解除します
    var silentBuffer = context.createBuffer(1, 1, 22050);
    var node = context.createBufferSource();
    node.buffer = silentBuffer;
    node.start(0);
    unlocked = true;
  }

  isPlaying = !isPlaying;

  if (isPlaying) { // start playing
    currentNote = 0;
    document.getElementById("bpm").innerHTML = bpm;
    startTimer();
    nextNoteTime = context.currentTime;
    timerWorker.postMessage("start");
    return "stop";
  } 
  else {
    stopTimer();
    document.getElementById("bpm").innerHTML = 0;
    timerWorker.postMessage("stop");
    return "play";
  }
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
  context = new AudioContext();

  //オーディオファイルをロード
  getAudioBuffer('./sound/heart.mp3', function(buffer) {
    beat = buffer;
  });

  timerWorker = new Worker("./js/worker.js");

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
