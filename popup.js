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
const closedTopCheckbox = document.getElementById('closedTop');

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

closedTopCheckbox.addEventListener('change', async () => {
  const isChecked = closedTopCheckbox.checked;
  chrome.storage.local.set({ closedTop: isChecked });
  await sendToContentScript("updateClosedTop", { closedTop: isChecked });
});

// Récupérer les valeurs sauvegardées à l'OUVERTURE du popup pour positionner les sliders au bon endroit
chrome.storage.local.get(['gravity', 'friction', 'bounce', 'shake', 'closedTop'], (data) => {
  if (data.gravity !== undefined) { gravitySlider.value = data.gravity; gravityValueDisplay.textContent = data.gravity; }
  if (data.friction !== undefined) { frictionSlider.value = data.friction; frictionValueDisplay.textContent = data.friction; }
  if (data.bounce !== undefined) { bounceSlider.value = data.bounce; bounceValueDisplay.textContent = data.bounce; }
  if (data.shake !== undefined) { shakeSlider.value = data.shake; shakeValueDisplay.textContent = data.shake; }
  if (data.closedTop !== undefined) { closedTopCheckbox.checked = data.closedTop; }
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

// --- GESTION DES PRÉRÉGLAGES (PRESETS) ---
const earthBtn = document.getElementById('presetEarth');
const moonBtn = document.getElementById('presetMoon');
const spaceBtn = document.getElementById('presetSpace');

// Fonction globale pour appliquer une configuration d'un coup
async function applyPhysicsPreset(gravityVal, frictionVal, bounceVal, shakeVal) {
  // Mettre à jour graphiquement les sliders et les textes
  gravitySlider.value = gravityVal;
  gravityValueDisplay.textContent = gravityVal;
  
  frictionSlider.value = frictionVal;
  frictionValueDisplay.textContent = frictionVal;
  
  bounceSlider.value = bounceVal;
  bounceValueDisplay.textContent = bounceVal;
  
  shakeSlider.value = shakeVal;
  shakeValueDisplay.textContent = shakeVal;

  // Sauvegarder dans le stockage de l'extension
  chrome.storage.local.set({
    gravity: gravityVal,
    friction: frictionVal,
    bounce: bounceVal,
    shake: shakeVal
  });

  // Envoyer instantanément les nouvelles valeurs au moteur physique
  await sendToContentScript("updateGravity", { gravity: gravityVal });
  await sendToContentScript("updateFriction", { friction: frictionVal });
  await sendToContentScript("updateBounce", { bounce: bounceVal });
  await sendToContentScript("updateShake", { shake: shakeVal });
}

// Clic sur le bouton Terre
earthBtn.addEventListener('click', () => {
  applyPhysicsPreset(0.5, 0.985, 0.7, 100);
});

// Clic sur le bouton Lune
moonBtn.addEventListener('click', () => {
  applyPhysicsPreset(0.15, 0.99, 0.9, 60);
});

// Clic sur le bouton Espace
spaceBtn.addEventListener('click', () => {
  applyPhysicsPreset(0, 1, 1, 10);
});

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