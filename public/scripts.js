const audioPlayer = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('play-pause');
const skipBackBtn = document.getElementById('skip-back');
const skipForwardBtn = document.getElementById('skip-forward');
const volumeSlider = document.getElementById('volume-slider');
const speedSlider = document.getElementById('speed-slider');
const pixelSlider = document.getElementById('pixel-slider');
const ditherSlider = document.getElementById('dither-slider');
const trackInfo = document.getElementById('track-info');
const trackList = document.getElementById('track-list');
let musicList = [];
let currentTrackIndex = -1;

fetch('/musicList.json')
    .then(response => response.json())
    .then(data => {
        musicList = data;
        console.log('Loaded music list:', musicList); // Debug
        populateTrackList();
    })
    .catch(error => {
        console.error('Error loading music list:', error); // Debug
        trackInfo.textContent = "[ERROR LOADING TRACKS]";
    });

function populateTrackList() {
    trackList.innerHTML = ''; // Clear existing
    musicList.forEach((track, index) => {
        const li = document.createElement('li');
        li.textContent = `${track.author} - ${track.description}`;
        li.addEventListener('click', () => {
            console.log('Track clicked:', index); // Debug
            playTrack(index);
            if (window.sendTrack) window.sendTrack(index); // Use exposed function
        });
        trackList.appendChild(li);
    });
}

function formatLength(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function playTrack(index) {
    if (index >= 0 && index < musicList.length) {
        currentTrackIndex = index;
        const track = musicList[index];
        console.log('Playing track:', track); // Debug
        audioPlayer.src = `https://ipfs.io/ipfs/${track.cid}`; // Direct IPFS URL
        audioPlayer.play().then(() => {
            playPauseBtn.textContent = '[||]';
            trackInfo.textContent = `${track.author} | ${formatLength(track.length)} | ${track.description}`;
            if (window.sendTrack) window.sendTrack(currentTrackIndex);
            if (window.sendTime) window.sendTime(audioPlayer.currentTime);
        }).catch(error => {
            console.error('Error playing audio:', error); // Debug
            trackInfo.textContent = "[PLAYBACK ERROR - CHECK CID]";
        });
    }
}

playPauseBtn.addEventListener('click', () => {
    console.log('Play/pause clicked. Paused?', audioPlayer.paused); // Debug
    if (audioPlayer.paused) {
        audioPlayer.play().then(() => {
            playPauseBtn.textContent = '[||]';
            if (window.sendPlay) window.sendPlay();
            if (window.sendTime) window.sendTime(audioPlayer.currentTime);
        }).catch(error => console.error('Error resuming audio:', error));
    } else {
        audioPlayer.pause();
        playPauseBtn.textContent = '[>]';
        if (window.sendPause) window.sendPause();
    }
});

skipBackBtn.addEventListener('click', () => {
    const newIndex = (currentTrackIndex - 1 + musicList.length) % musicList.length;
    console.log('Skip back to:', newIndex); // Debug
    playTrack(newIndex);
});

skipForwardBtn.addEventListener('click', () => {
    const newIndex = (currentTrackIndex + 1) % musicList.length;
    console.log('Skip forward to:', newIndex); // Debug
    playTrack(newIndex);
});

volumeSlider.addEventListener('input', () => {
    console.log('Volume changed to:', volumeSlider.value); // Debug
    audioPlayer.volume = volumeSlider.value / 100;
    if (window.sendVolume) window.sendVolume(volumeSlider.value);
});

speedSlider.addEventListener('input', () => {
    console.log('Speed changed to:', speedSlider.value); // Debug
    window.adjustShader.setSpeed(parseFloat(speedSlider.value));
    if (window.sendShader) window.sendShader(getShaderState());
});

pixelSlider.addEventListener('input', () => {
    console.log('Pixel changed to:', pixelSlider.value); // Debug
    window.adjustShader.setPixelSize(parseFloat(pixelSlider.value));
    if (window.sendShader) window.sendShader(getShaderState());
});

ditherSlider.addEventListener('input', () => {
    console.log('Dither changed to:', ditherSlider.value); // Debug
    window.adjustShader.setDitherScale(parseFloat(ditherSlider.value));
    if (window.sendShader) window.sendShader(getShaderState());
});

audioPlayer.volume = volumeSlider.value / 100;
audioPlayer.addEventListener('ended', () => {
    const newIndex = (currentTrackIndex + 1) % musicList.length;
    console.log('Track ended, next:', newIndex); // Debug
    playTrack(newIndex);
});

function updateAudioIntensity() {
    requestAnimationFrame(updateAudioIntensity);
    if (!audioPlayer.paused && audioPlayer.duration) {
        const progress = audioPlayer.currentTime / audioPlayer.duration;
        const intensity = 0.5 + Math.sin(progress * 10) * 0.25;
        window.adjustShader.setAudioIntensity(intensity);
    } else {
        window.adjustShader.setAudioIntensity(0.5);
    }
}
updateAudioIntensity();

function getShaderState() {
  return {
    speed: parseFloat(speedSlider.value),
    pixel: parseFloat(pixelSlider.value),
    dither: parseFloat(ditherSlider.value)
  };
}

trackInfo.textContent = "SELECT A TRACK TO BEGIN";
console.log('Scripts.js loaded. Exposed functions ready.'); // Debug