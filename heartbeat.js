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
    // We'll start playing the rhythm 100 milliseconds from "now"
    var startTime = context.currentTime + 0.100;
    var tempo = 80; // BPM (beats per minute)
    var eighthNoteTime = (60 / tempo) / 2;

    for (var bar = 0; bar < 2; bar++) {
        var time = startTime + bar * 8 * eighthNoteTime;
        playSound(beat, time);
        playSound(beat, time + 2 * eighthNoteTime);
        playSound(beat, time + 4 * eighthNoteTime);
        playSound(beat, time + 6 * eighthNoteTime);
    }
}