// client.js const socket = io(); 
 
// UI refs 
const messagesEl = document.getElementById('messages'); const composer = document.getElementById('composer'); const msgInput = document.getElementById('msgInput'); const usersEl = document.getElementById('users'); const typingEl = document.getElementById('typing'); 
 const myNameEl = document.getElementById('myName'); const myAvatarEl = document.getElementById('myAvatar'); const changeNameBtn = document.getElementById('changeNameBtn'); const nameModal = document.getElementById('nameModal'); const nameInput = document.getElementById('nameInput'); const saveName = document.getElementById('saveName'); const cancelName = document.getElementById('cancelName'); 
 let myName = localStorage.getItem('chat_name') || `User${Math.floor(Math.random()*900+100)}`; myNameEl.textContent = myName; 
myAvatarEl.textContent = (myName[0] || 'U').toUpperCase(); 
 
let typingTimeout = null; let isTyping = false; 
 
// show modal to change name 
changeNameBtn.addEventListener('click', () => {   nameInput.value = myName;   nameModal.classList.remove('hidden');   nameInput.focus(); 
}); 
cancelName.addEventListener('click', () => nameModal.classList.add('hidden')); saveName.addEventListener('click', () => {   const v = nameInput.value.trim();   if (v) { 
    myName = v.slice(0,32); 
    localStorage.setItem('chat_name', myName);     myNameEl.textContent = myName; 
    myAvatarEl.textContent = (myName[0] || 'U').toUpperCase();     nameModal.classList.add('hidden'); 
    socket.emit('join', myName); // announce changed name 
  } 
}); 
 
// init: when connected, join with name socket.on('connect', () => {   socket.emit('join', myName); 
}); 
 
// initialize with history + users socket.on('init', (data) => {   // render history 
  if (data && data.history && data.history.length) {     data.history.forEach(renderMessage); 
    // scroll to bottom     scrollBottom(); 
  } 
  if (data && data.users) renderUsers(data.users); 
}); 
 
// users list update socket.on('users', (list) => {   renderUsers(list); 
}); 
 
// new message 
socket.on('message', (msg) => {   renderMessage(msg);   scrollBottom(); 
}); 
 
// typing indicator from others 
socket.on('typing', ({ username, isTyping }) => {   if (isTyping) { 
    typingEl.textContent = `${username} is typing…`; 
  } else { 
    typingEl.textContent = ''; 
  } 
}); 
 
// send message 
composer.addEventListener('submit', (e) => { 
  e.preventDefault();   const text = msgInput.value.trim();   if (!text) return;   socket.emit('message', text);   msgInput.value = '';   // notify stopped typing   notifyTyping(false); 
}); 
 
// typing notifications with debounce msgInput.addEventListener('input', () => {   if (!isTyping) {     isTyping = true; 
    socket.emit('typing', true); 
  } 
  clearTimeout(typingTimeout);   typingTimeout = setTimeout(() => {     notifyTyping(false); 
  }, 800); }); 
function notifyTyping(flag) {   isTyping = !!flag; 
  socket.emit('typing', isTyping); 
} 
 
// render helper function renderMessage(msg){ 
  const el = document.createElement('div'); 
 
  // system messages   if (msg.system) {     el.className = 'msg system'; 
    el.textContent = `${formatTime(msg.ts)} — ${msg.text}`;     messagesEl.appendChild(el);     return; 
  }  
  const me = (msg.user === myName); 
  el.className = 'msg ' + (me ? 'self' : 'other'); 
 
  const meta = document.createElement('div');   meta.className = 'meta'; 
  meta.textContent = `${msg.user} • ${formatTime(msg.ts)}`; 
   const body = document.createElement('div');   body.className = 'body';   body.textContent = msg.text; 
   el.appendChild(meta);   el.appendChild(body);   messagesEl.appendChild(el); 
} 
 
// render users function renderUsers(list){   usersEl.innerHTML = '';   list.forEach(u => { 
    const li = document.createElement('li');     li.innerHTML = `<div class="avatar" style="width:34px;height:34px;border-radius:8px;fontsize:13px">${(u[0]||'U').toUpperCase()}</div><div style="flex:1">${escapeHtml(u)}</div>`;     usersEl.appendChild(li); 
  }); 
} 
 
// safe text function escapeHtml(s){ 
  return s.replace(/[&<>"']/g, (m) => ({ 
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' 
  })[m]); 
} 
 
// scroll to bottom nicely function scrollBottom(){   messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 
'smooth' }); 
}  
function formatTime(ts){   const d = new Date(ts || Date.now()); 
  return d.toLocaleTimeString([], {hour: '2-digit', minute:'2digit'}); 
} 
