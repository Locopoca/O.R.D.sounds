import {joinRoom} from 'https://esm.run/trystero/nostr'

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

console.log('Multiplayer module loaded via CDN. Config:', config); // Debug: Confirm module load

joinButton.addEventListener('click', () => {
  console.log('Join button clicked. Attempting to join room:', roomId); // Debug
  try {
    room = joinRoom(config, roomId);
    console.log('Room joined successfully:', room); // Debug
    console.log('Self ID:', room.selfId); // Debug: Log self ID for chat
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
    if (audioPlayer.paused) audioPlayer.play();
  });
  getPause(() => {
    console.log('Received pause signal'); // Debug
    if (!audioPlayer.paused) audioPlayer.pause();
  });
  getTrack((index) => {
    console.log('Received track change:', index); // Debug
    playTrack(index);
  });
  getTime((time) => {
    console.log('Received time sync:', time); // Debug
    audioPlayer.currentTime = time;
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
    window.adjustShader.setSpeed(data.speed);
    window.adjustShader.setPixelSize(data.pixel);
    window.adjustShader.setDitherScale(data.dither);
  });
  getMessage((msg, peerId) => {
    console.log('Received chat message from', peerId, ':', msg); // Debug
    const li = document.createElement('li');
    li.textContent = `${peerId.slice(0,4)}: ${msg}`;
    chatMessages.appendChild(li);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
  getCursor((pos, peerId) => {
    console.log('Received cursor update from', peerId, ':', pos); // Debug
    if (!cursors[peerId]) {
      cursors[peerId] = document.createElement('div');
      cursors[peerId].className = 'cursor';
      cursors[peerId].style.backgroundColor = `#${peerId.slice(0,6)}`; // Unique color based on peer ID
      cursorContainer.appendChild(cursors[peerId]);
      console.log('Created cursor for peer:', peerId); // Debug
    }
    cursors[peerId].style.left = `${pos.x * 100}%`;
    cursors[peerId].style.top = `${pos.y * 100}%`;
  });

  room.onPeerJoin((peerId) => {
    console.log('Peer joined:', peerId, 'Total peers:', ++peerCount); // Debug
    if (peerCount > 8) {
      console.warn('Room exceeded max peers!'); // Debug
      alert('Room is full (max 8 players)');
      room.leave();
      room = null;
      chat.classList.add('hidden');
      joinButton.disabled = false;
      peerCount = 0;
      return;
    }
    // Sync state to new peer
    sendTrack(currentTrackIndex);
    sendVolume(volumeSlider.value);
    sendShader(getShaderState());
    if (!audioPlayer.paused) {
      sendPlay();
      sendTime(audioPlayer.currentTime);
    } else {
      sendPause();
    }
    updatePeers();
  });

  room.onPeerLeave((peerId) => {
    console.log('Peer left:', peerId, 'Total peers:', --peerCount); // Debug
    if (cursors[peerId]) {
      cursorContainer.removeChild(cursors[peerId]);
      delete cursors[peerId];
      console.log('Removed cursor for peer:', peerId); // Debug
    }
    updatePeers();
  });

  // Show chat
  chat.classList.remove('hidden');
  console.log('Chat UI shown'); // Debug

  // Cursor sharing (throttled)
  let lastCursorSend = 0;
  document.addEventListener('mousemove', (e) => {
    if (Date.now() - lastCursorSend > 50) { // Throttle to 20fps
      try {
        sendCursor({x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight});
        lastCursorSend = Date.now();
      } catch (error) {
        console.error('Error sending cursor:', error); // Debug
      }
    }
  });

  // Chat input (send on Enter)
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && chatInput.value.trim()) {
      const msg = chatInput.value.trim();
      try {
        sendMessage(msg);
        console.log('Sent chat message:', msg); // Debug
        // Add own message to chat for visibility
        const li = document.createElement('li');
        li.textContent = `You: ${msg}`;
        li.style.color = '#ff228b'; // Highlight own messages
        chatMessages.appendChild(li);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatInput.value = '';
      } catch (error) {
        console.error('Error sending chat:', error); // Debug
      }
    }
  });

  updatePeers();
  joinButton.disabled = true; // Disable after join
  joinButton.textContent = '[ JOINED ]'; // Update button text
  console.log('Multiplayer setup complete. Ready for peers.'); // Debug
});

function updatePeers() {
  if (room) {
    const peers = Object.keys(room.getPeers()).length;
    peerInfo.textContent = `[ PEERS: ${peers} / 8 ]`;
    console.log('Updated peer count:', peers); // Debug
  }
}

function getShaderState() {
  return {
    speed: parseFloat(speedSlider.value),
    pixel: parseFloat(pixelSlider.value),
    dither: parseFloat(ditherSlider.value)
  };
}

// Expose functions globally for scripts.js compatibility
window.sendPlay = () => { if (room) { console.log('Sending play'); sendPlay(); } };
window.sendPause = () => { if (room) { console.log('Sending pause'); sendPause(); } };
window.sendTrack = (index) => { if (room) { console.log('Sending track:', index); sendTrack(index); } };
window.sendTime = (time) => { if (room) { console.log('Sending time:', time); sendTime(time); } };
window.sendVolume = (vol) => { if (room) { console.log('Sending volume:', vol); sendVolume(vol); } };
window.sendShader = (state) => { if (room) { console.log('Sending shader:', state); sendShader(state); } };