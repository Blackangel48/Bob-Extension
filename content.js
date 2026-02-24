// 1. Création de la balle
const ball = document.createElement('div');

// Attributs de la balle
let ballSize = 50;

// Style de la balle
ball.style.width = ballSize + 'px';
ball.style.height = ballSize + 'px';
ball.style.backgroundColor = '#ff4757';
ball.style.borderRadius = '50%';
ball.style.position = 'fixed';
ball.style.top = '100px';
ball.style.left = '100px';
ball.style.cursor = 'grab';
ball.style.zIndex = '1000000';
ball.style.boxShadow = '0 4px 5px rgba(0,0,0,0.3)';
ball.style.transition = 'transform 0.1s ease';

document.body.appendChild(ball);

// --- Variables de physique ---
let posX = 100, posY = 100;      // Position
let vx = 0, vy = 0;              // Vitesse (Velocity)
const gravity = 0.5;             // Force de pesanteur
const friction = 0.985;           // Perte d'énergie à chaque mouvement (air)
const bounce = 0.8;              // Perte d'énergie au rebond (sol/murs)
let isDragging = false;
let lastMouseX, lastMouseY;

// --- Boucle d'animation ---
function update() {
  if (!isDragging) {
    // 1. Appliquer la gravité
    vy += gravity;

    // 2. Appliquer la friction (résistance de l'air)
    vx *= friction;
    vy *= friction;

    // 3. Mettre à jour la position
    posX += vx;
    posY += vy;

    // 4. Gestion des collisions (rebonds)
    // Sol
    if (posY + ballSize > window.innerHeight) {
      posY = window.innerHeight - ballSize;
      vy *= -bounce; // Inverser la vitesse et réduire
    }
    // Murs
    if (posX + ballSize > window.innerWidth || posX < 0) {
      vx *= -bounce;
      posX = posX < 0 ? 0 : window.innerWidth - ballSize;
    }
  }

  // Appliquer les changements visuels
  ball.style.left = posX + 'px';
  ball.style.top = posY + 'px';

  requestAnimationFrame(update); // Relancer la boucle au prochain rafraîchissement d'écran
}

// --- Interaction souris ---
ball.addEventListener('mousedown', (e) => {
  e.preventDefault();
  isDragging = true;
  vx = 0; vy = 0; // On arrête la physique pendant qu'on tient la balle
});

window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    // Calcul de l'impulsion (pour pouvoir "lancer" la balle)
    vx = e.clientX - lastMouseX;
    vy = e.clientY - lastMouseY;
    
    posX = e.clientX - (ballSize/2);
    posY = e.clientY - (ballSize/2);
    
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

// Lancer la boucle
update();