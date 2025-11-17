import {joinRoom} from 'https://esm.run/trystero/torrent'

const config = { appId: 'o.r.d.sounds' };
const roomId = 'main-room'; // Fixed room ID
const joinButton = document.getElementById('join-room');
const peerInfo = document.getElementById('peer-info');
const chat = document.getElementById('chat');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const cursorContainer = document.getElementById('cursors');
let room = null;
let sendPlay, getPlay, sendPause, getPause, sendTrack, getTrack, sendTime, getTime, sendVolume, getVolume, sendShader, getShader, sendMessage, getMessage, sendCursor, getCursor;
let cursors = {}; // Track peer cursors
let peerCount = 0; // Track current peers for max limit

console.log('Multiplayer module loaded via CDN. Config:', config); // Debug

joinButton.addEventListener('click', () => {
  console.log('Join button clicked. Attempting to join room:', roomId); // Debug
  try {
    room = joinRoom(config, roomId);
    console.log('Room joined successfully:', room); // Debug
    console.log('Self ID:', room.selfId); // Debug
  } catch (error) {
    console.error('Error joining room:', error); // Debug
    alert('Failed to join room: ' + error.message);
    return;
  }

  try {
    [sendPlay, getPlay] = room.makeAction('play');
    [sendPause, getPause] = room.makeAction('pause');
    [sendTrack, getTrack] = room.makeAction('track');
    [sendTime, getTime] = room.makeAction('time');
    [sendVolume, getVolume] = room.makeAction('volume');
    [sendShader, getShader] = room.makeAction('shader');
    [sendMessage, getMessage] = room.makeAction('chat');
    [sendCursor, getCursor] = room.makeAction('cursor');
    console.log('Actions created successfully'); // Debug
  } catch (error) {
    console.error('Error creating actions:', error); // Debug
    return;
  }

  getPlay(() => {
    console.log('Received play signal'); // Debug
    if (audioPlayer.paused) {
      audioPlayer.play().then(() => console.log('Synced play success')); // Debug
    }
  });
  getPause(() => {
    console.log('Received pause signal'); // Debug
    if (!audioPlayer.paused) audioPlayer.pause();
  });
  getTrack((index) => {
    console.log('Received track change to:', index); // Debug
    playTrack(index); // This will reset time to 0 and play
  });
  getTime((time) => {
    console.log('Received time sync to:', time); // Debug
    if (Math.abs(audioPlayer.currentTime - time) > 1) { // Only sync if >1s off
      audioPlayer.currentTime = time;
    }
  });
  getVolume((vol) => {
    console.log('Received volume sync:', vol); // Debug
    audioPlayer.volume = vol / 100;
    volumeSlider.value = vol;
  });
  getShader((data) => {
    console.log('Received shader sync:', data); // Debug
    speedSlider.value = data.speed;
    pixelSlider.value = data.pixel;
    ditherSlider.value = data.dither;
    if (data.red !== undefined) redSlider.value = data.red;
    if (data.green !== undefined) greenSlider.value = data.green;
    if (data.blue !== undefined) blueSlider.value = data.blue;
    window.adjustShader.setSpeed(data.speed);
    window.adjustShader.setPixelSize(data.pixel);
    window.adjustShader.setDitherScale(data.dither);
    if (data.red !== undefined) window.adjustShader.setBgColorR(data.red);
    if (data.green !== undefined) window.adjustShader.setBgColorG(data.green);
    if (data.blue !== undefined) window.adjustShader.setBgColorB(data.blue);
  });
  getMessage((msg, peerId) => {
    console.log('Received chat from', peerId, ':', msg); // Debug
    const li = document.createElement('li');
    li.textContent = `${peerId.slice(0,4)}: ${msg}`;
    chatMessages.appendChild(li);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
  getCursor((pos, peerId) => {
    console.log('Received cursor from', peerId, ':', pos); // Debug
    if (!cursors[peerId]) {
      cursors[peerId] = document.createElement('div');
      cursors[peerId].className = 'cursor';
      cursors[peerId].style.backgroundColor = `#${peerId.slice(0,6)}`;
      cursorContainer.appendChild(cursors[peerId]);
      console.log('Created cursor for', peerId); // Debug
    }
    cursors[peerId].style.left = `${pos.x * 100}%`;
    cursors[peerId].style.top = `${pos.y * 100}%`;
  });

  room.onPeerJoin((peerId) => {
    console.log('Peer joined:', peerId, 'Total:', ++peerCount); // Debug
    if (peerCount > 8) {
      console.warn('Room full!'); // Debug
      alert('Room is full (max 8 players)');
      room.leave();
      room = null;
      chat.classList.add('hidden');
      joinButton.disabled = false;
      peerCount = 0;
      return;
    }
    // Sync current state to new peer
    if (window.sendTrack) window.sendTrack(currentTrackIndex);
    if (window.sendVolume) window.sendVolume(volumeSlider.value);
    if (window.sendShader) window.sendShader(getShaderState());
    if (!audioPlayer.paused) {
      if (window.sendPlay) window.sendPlay();
      if (window.sendTime) window.sendTime(audioPlayer.currentTime);
    } else {
      if (window.sendPause) window.sendPause();
    }
    updatePeers();
  });

  room.onPeerLeave((peerId) => {
    console.log('Peer left:', peerId, 'Total:', --peerCount); // Debug
    if (cursors[peerId]) {
      cursorContainer.removeChild(cursors[peerId]);
      delete cursors[peerId];
    }
    updatePeers();
  });

  chat.classList.remove('hidden');
  console.log('Chat shown'); // Debug

  // Cursor sharing
  let lastCursorSend = 0;
  document.addEventListener('mousemove', (e) => {
    if (Date.now() - lastCursorSend > 50) {
      try {
        sendCursor({x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight});
        lastCursorSend = Date.now();
      } catch (error) {
        console.error('Cursor send error:', error); // Debug
      }
    }
  });

  // Chat input
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && chatInput.value.trim()) {
      const msg = chatInput.value.trim();
      try {
        sendMessage(msg);
        console.log('Sent chat:', msg); // Debug
        // Show own message
        const li = document.createElement('li');
        li.textContent = `You: ${msg}`;
        li.style.color = '#ff228b';
        chatMessages.appendChild(li);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatInput.value = '';
      } catch (error) {
        console.error('Chat send error:', error); // Debug
      }
    }
  });

  updatePeers();
  joinButton.disabled = true;
  joinButton.textContent = '[ JOINED ]';
  console.log('Setup complete'); // Debug
});

function updatePeers() {
  if (room) {
    const peers = Object.keys(room.getPeers()).length;
    peerInfo.textContent = `[ PEERS: ${peers} / 8 ]`;
    console.log('Peer update:', peers); // Debug
  }
}

function getShaderState() {
  return {
    speed: parseFloat(speedSlider.value),
    pixel: parseFloat(pixelSlider.value),
    dither: parseFloat(ditherSlider.value),
    red: parseInt(redSlider.value),
    green: parseInt(greenSlider.value),
    blue: parseInt(blueSlider.value)
  };
}

// Global functions for sync (called from scripts.js)
window.sendPlay = () => { if (room) { console.log('Broadcast play'); sendPlay(); } };
window.sendPause = () => { if (room) { console.log('Broadcast pause'); sendPause(); } };
window.sendTrack = (index) => { if (room) { console.log('Broadcast track:', index); sendTrack(index); } };
window.sendTime = (time) => { if (room) { console.log('Broadcast time:', time); sendTime(time); } };
window.sendVolume = (vol) => { if (room) { console.log('Broadcast volume:', vol); sendVolume(vol); } };
window.sendShader = (state) => { if (room) { console.log('Broadcast shader:', state); sendShader(state); } };