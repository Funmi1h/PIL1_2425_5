
    const recipient = "{{ recipient_firstname }}";
    const user = "{{ me }}";
    const socket = new WebSocket(
        'ws://' + window.location.host + '/ws/chat/' + [user, recipient].sort().join('_') + '/'
    );

    socket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        const chatLog = document.getElementById('chat-log');
        const message = `<p><b>${data.sender}</b>: ${data.message}</p>`;
        chatLog.innerHTML = message + chatLog.innerHTML; // ajoute en haut
    };

    document.getElementById('chat-message-submit').onclick = function(e) {
        const input = document.getElementById('chat-message-input');
        const message = input.value;
        socket.send(JSON.stringify({
            'message': message,
            'recipient': recipient
        }));
        input.value = '';
    };


