document.addEventListener('DOMContentLoaded', () => {
  const userId = document.body.dataset.userId;
  if (!userId) return;

  const notifSound = document.getElementById('notif-sound');
  const badge = document.getElementById('message-notif-badge');

  // ✅ Autoriser lecture du son après une interaction utilisateur
  document.body.addEventListener('click', () => {
    if (notifSound) {
      notifSound.play().then(() => {
        notifSound.pause();
        notifSound.currentTime = 0;
      }).catch(() => {});
    }
  }, { once: true });

  // 📡 Connexion WebSocket
  const wsNotif = new WebSocket(
    `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/notifs/${userId}/`
  );

  wsNotif.onopen = () => console.log("✅ WebSocket notifications connecté");

  wsNotif.onmessage = (e) => {
    const data = JSON.parse(e.data);
    console.log("🔔 Notification reçue :", data);

    if (data.type === 'new_message') {
      // 🔊 Joue le son de notification
      if (notifSound) {
        notifSound.play().catch((err) => {
          console.warn("🔇 Impossible de jouer le son :", err);
        });
      }

      // 🔵 Affiche la pastille rouge
      if (badge) badge.classList.remove('d-none', 'cached');
    }
  };

  wsNotif.onerror = (e) => console.error("❌ Erreur WebSocket notif :", e);
});
