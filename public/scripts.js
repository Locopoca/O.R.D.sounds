const audioPlayer = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('play-pause');
const skipBackBtn = document.getElementById('skip-back');
const skipForwardBtn = document.getElementById('skip-forward');
const volumeSlider = document.getElementById('volume-slider');
const speedSlider = document.getElementById('speed-slider');
const pixelSlider = document.getElementById('pixel-slider');
const ditherSlider = document.getElementById('dither-slider');
const redSlider = document.getElementById('red-slider');
const greenSlider = document.getElementById('green-slider');
const blueSlider = document.getElementById('blue-slider');
const toggleTerminalButton = document.getElementById('toggle-terminal');
const toggleChatButton = document.getElementById('toggle-chat');
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
        audioPlayer.currentTime = 0; // Reset time for new track
        audioPlayer.play().then(() => {
            console.log('Track started playing successfully'); // Debug
            playPauseBtn.textContent = '[||]';
            trackInfo.textContent = `${track.author} | ${formatLength(track.length)} | ${track.description}`;
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
            console.log('Resumed playing'); // Debug
            playPauseBtn.textContent = '[||]';
        }).catch(error => console.error('Error resuming audio:', error));
    } else {
        audioPlayer.pause();
        console.log('Paused audio'); // Debug
        playPauseBtn.textContent = '[>]';
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

redSlider.addEventListener('input', () => {
    console.log('Red changed to:', redSlider.value); // Debug
    window.adjustShader.setBgColorR(parseInt(redSlider.value));
});

greenSlider.addEventListener('input', () => {
    console.log('Green changed to:', greenSlider.value); // Debug
    window.adjustShader.setBgColorG(parseInt(greenSlider.value));
});

blueSlider.addEventListener('input', () => {
    console.log('Blue changed to:', blueSlider.value); // Debug
    window.adjustShader.setBgColorB(parseInt(blueSlider.value));
});

toggleTerminalButton.addEventListener('click', () => {
    document.body.classList.toggle('terminal-hidden');
    const isHidden = document.body.classList.contains('terminal-hidden');
    toggleTerminalButton.textContent = isHidden ? '[ SHOW PLAYER ]' : '[ HIDE PLAYER ]';
    console.log('Terminal toggled:', isHidden ? 'hidden' : 'shown'); // Debug
});

toggleChatButton.addEventListener('click', () => {
    document.body.classList.toggle('chat-hidden');
    const isHidden = document.body.classList.contains('chat-hidden');
    toggleChatButton.textContent = isHidden ? '[ SHOW CHAT ]' : '[ HIDE CHAT ]';
    console.log('Chat toggled:', isHidden ? 'hidden' : 'shown'); // Debug
});

audioPlayer.volume = volumeSlider.value / 100;
audioPlayer.addEventListener('ended', () => {
    const newIndex = (currentTrackIndex + 1) % musicList.length;
    console.log('Track ended, next:', newIndex); // Debug
    playTrack(newIndex);
});

// Simulate audio intensity without AudioContext
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

// Chat drag functionality
const chat = document.getElementById('chat');
let isDraggingChat = false;
let chatOffsetX, chatOffsetY;

chat.addEventListener('mousedown', (e) => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
        isDraggingChat = true;
        chatOffsetX = e.clientX - chat.offsetLeft;
        chatOffsetY = e.clientY - chat.offsetTop;
        chat.style.cursor = 'grabbing';
        e.preventDefault();
    }
});

document.addEventListener('mousemove', (e) => {
    if (isDraggingChat) {
        const newX = e.clientX - chatOffsetX;
        const newY = e.clientY - chatOffsetY;

        // Keep chat within viewport bounds
        const maxX = window.innerWidth - chat.offsetWidth;
        const maxY = window.innerHeight - chat.offsetHeight;

        chat.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        chat.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
        chat.style.right = 'auto';
        chat.style.bottom = 'auto';
    }
});

document.addEventListener('mouseup', () => {
    if (isDraggingChat) {
        isDraggingChat = false;
        chat.style.cursor = 'move';
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Hide/show terminal with 'H' key
    if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        document.body.classList.toggle('terminal-hidden');
        const isHidden = document.body.classList.contains('terminal-hidden');
        toggleTerminalButton.textContent = isHidden ? '[ SHOW PLAYER ]' : '[ HIDE PLAYER ]';
        console.log('Terminal toggled via keyboard:', isHidden ? 'hidden' : 'shown'); // Debug
    }
    // Hide/show chat with 'C' key
    if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        document.body.classList.toggle('chat-hidden');
        const isHidden = document.body.classList.contains('chat-hidden');
        toggleChatButton.textContent = isHidden ? '[ SHOW CHAT ]' : '[ HIDE CHAT ]';
        console.log('Chat toggled via keyboard:', isHidden ? 'hidden' : 'shown'); // Debug
    }
});

trackInfo.textContent = "SELECT A TRACK TO BEGIN";
console.log('Scripts.js loaded. Exposed functions ready.'); // Debug