async function updateBallCount(){
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "getBallCount"
    });
    document.getElementById('ballCount').textContent = response.count;
  }
};

document.getElementById('addBall').addEventListener('click', async () => {
  const size = document.getElementById('ballSize').value;
  const number = document.getElementById('ballNumber').value;
  const isRandom = document.getElementById('ballRandomColor').checked;
  let color = document.getElementById('ballColor').value;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, {
      action: "createBall",
      size: parseInt(size),
      isRandomColor: isRandom,
      color: color,
      number: parseInt(number)
    });
  }

  updateBallCount();
});

document.getElementById('deleteBalls').addEventListener('click', async () => {

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, {
      action: "deleteBalls"
    });
  }

  updateBallCount();
});

document.getElementById('shakeBalls').addEventListener('click', async () => {

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, {
      action: "shakeBalls"
    });
  }
});

const randomCheckbox = document.getElementById('ballRandomColor');
const colorInput = document.getElementById('ballColor');
const numberInput = document.getElementById('ballNumber');
const addBallButton = document.getElementById('addBall');

randomCheckbox.addEventListener('change', () => {
  colorInput.disabled = randomCheckbox.checked;
  colorInput.style.opacity = randomCheckbox.checked ? "0.5" : "1";
});

numberInput.addEventListener('change', () => {
  addBallButton.textContent = `Ajouter ${numberInput.value} balle${numberInput.value > 1 ? 's' : ''}`;
});

// Charger le nombre de balles dès l'ouverture du popup
updateBallCount();