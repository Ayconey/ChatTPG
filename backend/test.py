const roomName = "pokoj1";
const chatSocket = new WebSocket(
    'ws://' + window.location.host + '/ws/chat/' + roomName + '/'
);

chatSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    console.log("Wiadomość:", data.message);
    // dodaj do czatu
};

chatSocket.onclose = function(e) {
    console.error('WebSocket zamknięty.');
};

function sendMessage(msg) {
    chatSocket.send(JSON.stringify({
        'message': msg
    }));
}
