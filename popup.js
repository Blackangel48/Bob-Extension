async function updateBallCount(){
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "getBallCount" });
      if (response) document.getElementById('ballCount').textContent = response.count;
    } catch(e) { /* Le script n'est pas encore injecté sur cette page */ }
  }
}

// Fonction utilitaire pour envoyer des messages facilement au script de contenu
async function sendToContentScript(action, data = {}) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action, ...data });
  }
}

document.getElementById('addBall').addEventListener('click', async () => {
  const size = document.getElementById('ballSize').value;
  const number = document.getElementById('ballNumber').value;
  const isRandom = document.getElementById('ballRandomColor').checked;
  let color = document.getElementById('ballColor').value;

  await sendToContentScript("createBall", {
    size: parseInt(size),
    isRandomColor: isRandom,
    color: color,
    number: parseInt(number)
  });
  updateBallCount();
});

document.getElementById('deleteBalls').addEventListener('click', async () => {
  await sendToContentScript("deleteBalls");
  updateBallCount();
});

document.getElementById('shakeBalls').addEventListener('click', async () => {
  await sendToContentScript("shakeBalls");
});

// Éléments du DOM pour les Sliders
const randomCheckbox = document.getElementById('ballRandomColor');
const colorInput = document.getElementById('ballColor');
const numberInput = document.getElementById('ballNumber');
const addBallButton = document.getElementById('addBall');

const gravitySlider = document.getElementById('gravity');
const gravityValueDisplay = document.getElementById('gravityValue');
const frictionSlider = document.getElementById('friction');
const frictionValueDisplay = document.getElementById('frictionValue');
const bounceSlider = document.getElementById('bounce');
const bounceValueDisplay = document.getElementById('bounceValue');
const shakeSlider = document.getElementById('shake');
const shakeValueDisplay = document.getElementById('shakeValue');

// --- ÉCOUTEURS DES SLIDERS (CORRIGÉS) ---
gravitySlider.addEventListener('input', async () => {
  const val = parseFloat(gravitySlider.value);
  gravityValueDisplay.textContent = val;
  chrome.storage.local.set({ gravity: val });
  await sendToContentScript("updateGravity", { gravity: val });
});

frictionSlider.addEventListener('input', async () => {
  const val = parseFloat(frictionSlider.value);
  frictionValueDisplay.textContent = val;
  chrome.storage.local.set({ friction: val });
  await sendToContentScript("updateFriction", { friction: val });
});

bounceSlider.addEventListener('input', async () => {
  const val = parseFloat(bounceSlider.value);
  bounceValueDisplay.textContent = val;
  chrome.storage.local.set({ bounce: val });
  await sendToContentScript("updateBounce", { bounce: val });
});

shakeSlider.addEventListener('input', async () => {
  const val = parseInt(shakeSlider.value);
  shakeValueDisplay.textContent = val;
  chrome.storage.local.set({ shake: val });
  await sendToContentScript("updateShake", { shake: val });
});

// Récupérer les valeurs sauvegardées à l'OUVERTURE du popup pour positionner les sliders au bon endroit
chrome.storage.local.get(['gravity', 'friction', 'bounce', 'shake'], (data) => {
  if (data.gravity !== undefined) { gravitySlider.value = data.gravity; gravityValueDisplay.textContent = data.gravity; }
  if (data.friction !== undefined) { frictionSlider.value = data.friction; frictionValueDisplay.textContent = data.friction; }
  if (data.bounce !== undefined) { bounceSlider.value = data.bounce; bounceValueDisplay.textContent = data.bounce; }
  if (data.shake !== undefined) { shakeSlider.value = data.shake; shakeValueDisplay.textContent = data.shake; }
});

randomCheckbox.addEventListener('change', () => {
  colorInput.disabled = randomCheckbox.checked;
  colorInput.style.opacity = randomCheckbox.checked ? "0.5" : "1";
});

numberInput.addEventListener('change', () => {
  addBallButton.textContent = `Ajouter ${numberInput.value} balle${numberInput.value > 1 ? 's' : ''}`;
});

// Initialiser le compteur de balles
updateBallCount();

// --- GESTION DES ONGLETS ---
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(targetTab).classList.add('active');
  });
});