
const recipientId = document.querySelector('#chat-message-input').dataset.recipient;
const roomName = "{{ room_name|escapejs }}";

  const chatSocket = new WebSocket(
    'ws://' + window.location.host + '/ws/chat/' + roomName + '/'
  );

  chatSocket.onopen = function(e) {
    console.log("✅ Connexion WebSocket établie !");
  };

  chatSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    const chatLog = document.querySelector('#chat-log');
    chatLog.innerHTML += '<p> <strong>${data.sender} </srtong> : ${data.meesage}</p>';
    chatLog.scrollTop = chatLog.scrollHeight;  // auto-scroll
  };

  chatSocket.onerror = function(e) {
    console.error("❌ Erreur WebSocket :", e);
  };

  chatSocket.onclose = function(e) {
    console.warn("⚠️ WebSocket fermé :", e);
  };

  document.querySelector('#chat-message-submit').onclick = function() {
    const messageInput = document.querySelector('#chat-message-input');
    const message = messageInput.value;

    if (chatSocket.readyState === WebSocket.OPEN) {
      chatSocket.send(JSON.stringify({ 'message': message }));
      messageInput.value = '';
    } else {
      console.error("🚫 WebSocket non ouverte :", chatSocket.readyState);
      alert("La connexion n’est pas prête. Veuillez patienter ou recharger la page.");
    }
  };

