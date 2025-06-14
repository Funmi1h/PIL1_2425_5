
  const recipient_id = "{{ recipient.id }}";
  const user_id = "{{ user.id }}";

  const roomName = [user_id, recipient_id].sort().join('_');

  const socket = new WebSocket(
    'ws://' + window.location.host + '/ws/chat/' + roomName + '/'
  );

  socket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    const chatLog = document.getElementById('chat-log');
    const message = `<p><b>${data.sender}</b>: ${data.message}</p>`;
    chatLog.innerHTML = message + chatLog.innerHTML;
  };

  document.getElementById('chat-message-submit').onclick = function (e) {
    const input = document.getElementById('chat-message-input');
    const message = input.value.trim();

    if (!message) return;

    socket.send(JSON.stringify({
      message: message,
      recipient_id: recipient_id
    }));

    input.value = '';
  };
