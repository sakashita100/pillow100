window.AudioContext = window.AudioContext || window.webkitAudioContext;  
var context = new AudioContext();

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

function playSound(buffer, time) {
  var source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(time);
}

var beat = null;

//main
window.onload = function() {
  getAudioBuffer('./sound/heart.mp3', function(buffer) {
    beat = buffer;
  });
};

var start = function() {
  const bpms = [
    164,164,164,164,161,160,160,160,159,159,158,158,156,156,156,157,157,157,157,157,
    157,157,157,157,157,157,158,158,157,156,156,156,157,157,158,158,158,158,165,167,
    167,167,166,165,164,164,163,163,163,163,163,163,164,164,164,163,163,163,163,162,
    162,162,162,162,162,163,163,165,166,166,166,166,166,166,167,170,170,170,181,181,
    184,184,184,185,186,186,186,185,185,185,185,185,186,186,186,186,186,186,186,186,
    186,186,186,186,186,186,186,188,188,188,188,188,188,188,188,188,188,188,188,188,
    188,186,186,186,186,186,186,186,186,186,86,184,184,182,182,182,182,182,182,182,
    181,181,180,180,180,180,180,180,180,180,180,180,175,175,175,169,166,166,166,166,
    166,166,166,166,166,166,166,179,181,181,181,181,181,181,181,181,181,181,181,181,
    181,182,182,182,182,182,182,183,183,183,186,186,186,186,188,188,188,188,188,188,
    188,188,188,188,188,188,188,188,188,188,188,190,190,190,190,190,189,189,189,189,
    189,189,189,188,185,185,185,185,185,185,185,185,185,185,185,185,185,185,185,185,
    186,186,186,186,186,186,185,185,185,185,185,185,185,185,185,185
  ];

  var startTime = context.currentTime + 0.100;
  //var bpm = document.getElementById("bpm").value; // BPM (beats per minute)
  var bpm = bpms[0];
  //var eighthNoteTime = (60 / bpm) / 2;
  var bps = 60 / bpm;

  /*
  for (var cnt = 0; cnt < 2; cnt++) {
    //bpm = bpms[cnt];
    //document.getElementById("bpm").innerHTML = bpm;
    //var time = startTime + cnt * 8 * eighthNoteTime;
    var time = startTime + cnt 
    playSound(beat, time);
    playSound(beat, time + 2 * eighthNoteTime);
    playSound(beat, time + 4 * eighthNoteTime);
    playSound(beat, time + 6 * eighthNoteTime);
  }*/


  for (var cnt = 0; cnt < 10; cnt++) {
    var time = startTime + cnt * 4 * bps;
    bpm = bpms[cnt];
    document.getElementById("bpm").innerHTML = bpm;
    
    for (var i = 0; i < 4; ++i) {
      playSound(beat, time + i * bps);
    }

  }

}