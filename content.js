// 1. Création de la balle
const ball = document.createElement('div');

// Style de la balle
ball.style.width = '50px';
ball.style.height = '50px';
ball.style.backgroundColor = '#ff4757';
ball.style.borderRadius = '50%';
ball.style.position = 'fixed'; // Reste visible même si on scroll
ball.style.top = '100px';
ball.style.left = '100px';
ball.style.cursor = 'grab';
ball.style.zIndex = '1000000';
ball.style.boxShadow = '0 4px 5px rgba(0,0,0,0.3)';
ball.style.transition = 'transform 0.1s ease'; // Petit effet fluide

document.body.appendChild(ball);

let isDragging = false;
let offsetX, offsetY;

// 2. Événement : Début du drag (clic enfoncé)
ball.addEventListener('mousedown', (e) => {
  e.preventDefault();
  isDragging = true;
  ball.style.cursor = 'grabbing';
  
  // Calculer la position relative de la souris dans la balle
  // pour éviter que la balle ne "saute" au centre de la souris
  offsetX = e.clientX - ball.getBoundingClientRect().left;
  offsetY = e.clientY - ball.getBoundingClientRect().top;
});

// 3. Événement : Déplacement (mouvement de souris)
window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  // Calculer les nouvelles coordonnées
  let x = e.clientX - offsetX;
  let y = e.clientY - offsetY;

  // Appliquer la position
  ball.style.left = `${x}px`;
  ball.style.top = `${y}px`;
});

// 4. Événement : Fin du drag (clic relâché)
window.addEventListener('mouseup', () => {
  isDragging = false;
  ball.style.cursor = 'grab';
});
