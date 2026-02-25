document.getElementById('addBall').addEventListener('click', async () => {
  const size = document.getElementById('ballSize').value;
  
  // 1. Trouver l'onglet actif
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 2. Envoyer le message à cet onglet
  if (tab) {
    chrome.tabs.sendMessage(tab.id, {
      action: "createBall",
      size: parseInt(size),
      color: "#" + Math.floor(Math.random()*16777215).toString(16) // Couleur aléatoire
    });
  }
});