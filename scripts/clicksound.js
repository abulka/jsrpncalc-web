if ('webkitAudioContext' in window) {
    var myAudioContext = new webkitAudioContext();
}

function ClickSound_PhoneGap(path) {
    var my_media;

    function loadAudio(url) {
	// Play the audio file at url
	my_media = new Media(url,
	// success callback

	function() {
	    //console.log("playAudio():Audio Success");
	},
	// error callback

	function(err) {
	    //console.log("playAudio():Audio Error: "+err);
	});
    }

    loadAudio(path);

    function beep() {
	// Play audio
	my_media.play();
    }

    // Return interface -----------------------

    return {
	play: beep
    }

}

function ClickSound_WebAudio(path) {
    var myBuffer;

    // Private Methods ------------------------

    function load() {
	request = new XMLHttpRequest();
	request.open('GET', path, true);
	request.responseType = 'arraybuffer';

	// SYNCHRONOUS - WORKS OK
	request.addEventListener('load', function(event) {
	    var request = event.target;
	    myBuffer = myAudioContext.createBuffer(request.response, false);
	}, false);

	// Decode asynchronously - UNTRIED
/*
		request.onload = function() {
		context.decodeAudioData(request.response, function(buffer) {
			dogBarkingBuffer = buffer;
		}, onError);
		*/

	request.send();
    }

    load();

    // Public Methods -------------------------

    function beep() {
	var source = myAudioContext.createBufferSource();
	source.buffer = myBuffer;
	source.connect(myAudioContext.destination);
	source.noteOn(0);
    }

    // Return interface -----------------------

    return {
	play: beep
    }

};