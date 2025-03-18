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
        populateTrackList();
    })
    .catch(error => {
        console.error('Error loading music list:', error);
        trackInfo.textContent = "[ERROR LOADING TRACKS]";
    });

function populateTrackList() {
    musicList.forEach((track, index) => {
        const li = document.createElement('li');
        li.textContent = `${track.author} - ${track.description}`;
        li.addEventListener('click', () => playTrack(index));
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
        audioPlayer.src = `https://ipfs.io/ipfs/${track.cid}`; // Direct IPFS URL
        audioPlayer.play().then(() => {
            playPauseBtn.textContent = '[||]';
            trackInfo.textContent = `${track.author}  |  ${formatLength(track.length)}  |  ${track.description}`;
        }).catch(error => {
            console.error('Error playing audio:', error);
            trackInfo.textContent = "[PLAYBACK ERROR - CHECK CID]";
        });
    }
}

playPauseBtn.addEventListener('click', () => {
    if (audioPlayer.paused) {
        audioPlayer.play().then(() => {
            playPauseBtn.textContent = '[||]';
        }).catch(error => console.error('Error resuming audio:', error));
    } else {
        audioPlayer.pause();
        playPauseBtn.textContent = '[>]';
    }
});

skipBackBtn.addEventListener('click', () => {
    playTrack(currentTrackIndex - 1);
});

skipForwardBtn.addEventListener('click', () => {
    playTrack(currentTrackIndex + 1);
});

volumeSlider.addEventListener('input', () => {
    audioPlayer.volume = volumeSlider.value / 100;
});

speedSlider.addEventListener('input', () => {
    window.adjustShader.setSpeed(parseFloat(speedSlider.value));
});

pixelSlider.addEventListener('input', () => {
    window.adjustShader.setPixelSize(parseFloat(pixelSlider.value));
});

ditherSlider.addEventListener('input', () => {
    window.adjustShader.setDitherScale(parseFloat(ditherSlider.value));
});

audioPlayer.volume = volumeSlider.value / 100;

audioPlayer.addEventListener('ended', () => {
    playTrack(currentTrackIndex + 1);
});

// Simulate audio intensity without AudioContext
function updateAudioIntensity() {
    requestAnimationFrame(updateAudioIntensity);
    if (!audioPlayer.paused && audioPlayer.duration) {
        const progress = audioPlayer.currentTime / audioPlayer.duration;
        const intensity = 0.5 + Math.sin(progress * 10) * 0.25; // Simulated pulse
        window.adjustShader.setAudioIntensity(intensity);
    } else {
        window.adjustShader.setAudioIntensity(0.5);
    }
}
updateAudioIntensity();

trackInfo.textContent = "SELECT A TRACK TO BEGIN";