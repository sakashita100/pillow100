window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
var soundBuffer;

var request = new XMLHttpRequest();
request.open('GET', './sound/heart.mp3', true);
request.responseType = 'arraybuffer';

// Decode asynchronously
request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
        soundBuffer = buffer;
    });
}
request.send();

      
var RhythmSample = {};
RhythmSample.play = function() {
    function playSound(buffer, time) {
        var source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        if (!source.start)
            source.start = source.noteOn;
            source.start(time);
        }

        var beat = BUFFERS.beat;

        // We'll start playing the rhythm 100 milliseconds from "now"
        var startTime = context.currentTime + 0.100;
        var tempo = 80; // BPM (beats per minute)
        var eighthNoteTime = (60 / tempo) / 2;

        // Play 2 bars of the following:
        for (var bar = 0; bar < 2; bar++) {
          var time = startTime + bar * 8 * eighthNoteTime;
          // Play the bass (kick) drum on beats 1, 5
          playSound(beat, time);
          playSound(beat, time + 2 * eighthNoteTime);
          playSound(beat, time + 4 * eighthNoteTime);
          playSound(beat, time + 6 * eighthNoteTime);

        }
      };

      function playSound(buffer, time) {
        var source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(time);
      }
