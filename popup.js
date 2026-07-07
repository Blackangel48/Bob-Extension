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
});

document.getElementById('deleteBalls').addEventListener('click', async () => {

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, {
      action: "deleteBalls"
    });
  }
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

randomCheckbox.addEventListener('change', () => {
  colorInput.disabled = randomCheckbox.checked;
  colorInput.style.opacity = randomCheckbox.checked ? "0.5" : "1";
});
