document.getElementById('addBall').addEventListener('click', async () => {
  const size = document.getElementById('ballSize').value;
  const isRandom = document.getElementById('ballRandomColor').checked;
  let color = document.getElementById('ballColor').value;

  if (isRandom) {
    // Génère une couleur aléatoire
    color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, {
      action: "createBall",
      size: parseInt(size),
      color: color 
    });
  }
});

document.getElementById('deleteBalls').addEventListener('click', async () => {

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, {
      action: "deleteBalls"
    });
  }
});

const randomCheckbox = document.getElementById('ballRandomColor');
const colorInput = document.getElementById('ballColor');

randomCheckbox.addEventListener('change', () => {
  colorInput.disabled = randomCheckbox.checked;
  colorInput.style.opacity = randomCheckbox.checked ? "0.5" : "1";
});
