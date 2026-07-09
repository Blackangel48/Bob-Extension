// ==========================================
// 1. CONFIGURATION INITIALE & CANVAS
// ==========================================

// Initialisation du Canvas global
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Style du Canvas : invisible aux clics, plein écran et au-dessus de tout
Object.assign(canvas.style, {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100vw',
  height: '100vh',
  zIndex: '10000000',
  pointerEvents: 'none', // Laisse traverser les clics par défaut
  background: 'transparent'
});
document.body.appendChild(canvas);

// Gestion de la haute densité d'écran (Retina/4K) pour éviter le flou
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr); // Ajuste l'échelle du contexte de dessin
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Variables physiques globales
let gravity = 0.5;
let friction = 0.985;
let bounce = 0.8;
let shakeForce = 100;
let closedTop = false;
let ballCollisions = false;
const Balls = [];
let grabbedBall = null; // Stocke la balle en cours de déplacement

// Récupération des paramètres sauvegardés
chrome.storage.local.get(['gravity', 'friction', 'bounce', 'shake', 'closedTop', 'ballCollisions'], (data) => {
  if (data.gravity !== undefined) gravity = data.gravity;
  if (data.friction !== undefined) friction = data.friction;
  if (data.bounce !== undefined) bounce = data.bounce;
  if (data.shake !== undefined) shakeForce = data.shake;
  if (data.closedTop !== undefined) closedTop = data.closedTop;
  if (data.ballCollisions !== undefined) ballCollisions = data.ballCollisions;
});

// ==========================================
// 2. CLASSE BALL (VERSION CANVAS)
// ==========================================
class Ball {
  constructor(size, mass, color, posX, posY) {
    this.size = size;
    this.mass = mass;
    this.color = color;
    this.posX = posX;
    this.posY = posY;
    this.velX = 0;
    this.velY = 0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
  }

  // Secousse aléatoire
  shake() {
    this.velX += (Math.random() - 0.5) * shakeForce;
    this.velY += (Math.random() - 0.5) * shakeForce;
  }

  // Vérifie si un point (coordonnées souris) est à l'intérieur de la balle
  isPointInside(mx, my) {
    const radius = this.size / 2;
    const cx = this.posX + radius;
    const cy = this.posY + radius;
    const dx = mx - cx;
    const dy = my - cy;
    return (dx * dx + dy * dy) < (radius * radius);
  }

  // Calcul du champ gravitationnel exercé par les autres balles
  applyGravityAttraction(otherBall) {
    const r1 = this.size / 2;
    const r2 = otherBall.size / 2;
    const c1x = this.posX + r1;
    const c1y = this.posY + r1;
    const c2x = otherBall.posX + r2;
    const c2y = otherBall.posY + r2;

    const dx = c2x - c1x;
    const dy = c2y - c1y;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared === 0) return;

    const distance = Math.sqrt(distanceSquared);

    /* Loi de Newton adaptée : a = G * m_autre / d^2
       On ajoute un "softening factor" (400) pour éviter que l'accélération 
       ne tende vers l'infini lorsque deux balles se superposent.
    */
    const G = 0.15; 
    const softening = 400;
    const acceleration = (G * otherBall.mass) / (distanceSquared + softening);

    const nx = dx / distance;
    const ny = dy / distance;

    // La modification de vélocité dépend uniquement de la masse de l'AUTRE balle
    this.velX += nx * acceleration;
    this.velY += ny * acceleration;
  }

  // Calculs physiques de déplacement et limites d'écran
  update() {
    if (!this.isDragging) {
      // Appliquer la gravité et la friction
      this.velY += gravity;
      this.velX *= friction;
      this.velY *= friction;

      Balls.forEach((otherBall) => {
        if (otherBall !== this) {
          this.applyGravityAttraction(otherBall);
        }
      });

      this.posX += this.velX;
      this.posY += this.velY;

      // Collisions avec les bords verticaux (Plafond/Sol)
      if (closedTop) {
        if (this.posY + this.size > window.innerHeight || this.posY < 0) {
          this.posY = this.posY < 0 ? 0 : window.innerHeight - this.size;
          this.velY *= -bounce;
        }
      } else {
        if (this.posY + this.size > window.innerHeight) {
          this.posY = window.innerHeight - this.size;
          this.velY *= -bounce;
        }
      }
      // Collisions avec les bords horizontaux (Murs)
      if (this.posX + this.size > window.innerWidth || this.posX < 0) {
        this.velX *= -bounce;
        this.posX = this.posX < 0 ? 0 : window.innerWidth - this.size;
      }
    }
  }

  // Dessin de la balle dans le Canvas
  render(context) {
    const radius = this.size / 2;
    const cx = this.posX + radius;
    const cy = this.posY + radius;

    // 1. EFFET VISUEL : Aura de distorsion gravitationnelle (si la masse est importante)
    if (this.mass > 150) {
      context.beginPath();
      context.arc(cx, cy, radius + Math.min(this.mass * 0.05, 150), 0, Math.PI * 2);
      context.fillStyle = `rgba(116, 125, 136, ${Math.min(this.mass / 25000, 0.12)})`;
      context.fill();
      context.closePath();
    }

    // 2. CALCUL DU CONTOUR EN FONCTION DE LA MASSE
    // Plus la balle est lourde, plus le contour extérieur sombre est épais.
    // On limite l'épaisseur à 80% maximum du rayon pour que le cœur reste visible.
    const borderThickness = Math.max(1, Math.min(this.mass / 40, radius * 1));

    // Dessin du cercle de contour extérieur (Foncé)
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.fillStyle = "#1e272e"; 
    context.fill();
    context.closePath();

    // Dessin du cœur de la balle (Couleur sélectionnée)
    context.beginPath();
    context.arc(cx, cy, radius - borderThickness, 0, Math.PI * 2);
    context.fillStyle = this.color;
    context.fill();
    context.closePath();
  }
}

// ==========================================
// 3. GESTIONNAIRE DES ÉVÉNEMENTS SOURIS (DRAG & DROP)
// ==========================================

// Mode capture (true) pour intercepter le clic avant les éléments du site web
window.addEventListener('mousedown', (e) => {
  // Parcours inversé pour attraper la balle visible au premier plan
  for (let i = Balls.length - 1; i >= 0; i--) {
    if (Balls[i].isPointInside(e.clientX, e.clientY)) {
      grabbedBall = Balls[i];
      grabbedBall.isDragging = true;
      grabbedBall.lastMouseX = e.clientX;
      grabbedBall.lastMouseY = e.clientY;

      // On active les pointer-events pour bloquer les actions du site pendant le drag
      canvas.style.pointerEvents = 'auto';
      canvas.style.cursor = 'grabbing';

      e.preventDefault();
      e.stopPropagation();
      break;
    }
  }
}, true);

window.addEventListener('mousemove', (e) => {
  if (grabbedBall) {
    grabbedBall.velX = e.clientX - grabbedBall.lastMouseX;
    grabbedBall.velY = e.clientY - grabbedBall.lastMouseY;
    grabbedBall.posX = e.clientX - grabbedBall.size / 2;
    grabbedBall.posY = e.clientY - grabbedBall.size / 2;
    grabbedBall.lastMouseX = e.clientX;
    grabbedBall.lastMouseY = e.clientY;
  }
});

window.addEventListener('mouseup', () => {
  if (grabbedBall) {
    grabbedBall.isDragging = false;
    grabbedBall = null;
    
    // On restitue la transparence aux clics pour le site web
    canvas.style.pointerEvents = 'none';
    canvas.style.cursor = 'default';
  }
});

// ==========================================
// 4. MOTEUR DE COLLISION ENTRE BALLES (OPTIMISÉ)
// ==========================================
function handleBallCollisions() {
  for (let i = 0; i < Balls.length; i++) {
    for (let j = i + 1; j < Balls.length; j++) {
      const b1 = Balls[i];
      const b2 = Balls[j];

      // Calcul des centres et des rayons
      const r1 = b1.size / 2;
      const r2 = b2.size / 2;
      const c1x = b1.posX + r1;
      const c1y = b1.posY + r1;
      const c2x = b2.posX + r2;
      const c2y = b2.posY + r2;

      // Calcul de la distance entre les centres
      const dx = c2x - c1x;
      const dy = c2y - c1y;
      
      // Comparaison des distances au carré (évite le Math.sqrt (couteux) si pas de collision)
      const distSquared = dx * dx + dy * dy;
      const minDist = r1 + r2;
      const minDistSquared = minDist * minDist;

      if (distSquared < minDistSquared) {
        // Le calcul lourd de la racine carrée ne se fait QUE si la collision est confirmée
        const distance = Math.sqrt(distSquared);
        const nx = distance === 0 ? 1 : dx / distance;
        const ny = distance === 0 ? 0 : dy / distance;

        // --- ÉTAPE A : SÉPARATION PHYSIQUE (Anti-clipping) ---
        const overlap = minDist - distance;
        
        if (!b1.isDragging && !b2.isDragging) {
          b1.posX -= nx * (overlap / 2);
          b1.posY -= ny * (overlap / 2);
          b2.posX += nx * (overlap / 2);
          b2.posY += ny * (overlap / 2);
        } else if (!b1.isDragging) {
          b1.posX -= nx * overlap;
          b1.posY -= ny * overlap;
        } else if (!b2.isDragging) {
          b2.posX += nx * overlap;
          b2.posY += ny * overlap;
        }

        // --- ÉTAPE B : IMPULSION ÉLASTIQUE (Choc physique) ---
        // Calcul de la vélocité relative le long de la normale
        const kx = b2.velX - b1.velX;
        const ky = b2.velY - b1.velY;
        const velAlongNormal = kx * nx + ky * ny; // Produit scalaire pour obtenir la composante le long de la normale

        if (velAlongNormal < 0) {
          const m1 = b1.mass;
          const m2 = b2.mass;
          const impulse = (-(1 + bounce) * velAlongNormal) / ((1 / m1) + (1 / m2)); // Impulsion totale à appliquer aux deux balles

          // Application de l'impulsion aux vitesses des balles, sauf si elles sont en train d'être déplacées par l'utilisateur
          if (!b1.isDragging) {
            b1.velX -= (impulse / m1) * nx;
            b1.velY -= (impulse / m1) * ny;
          }
          if (!b2.isDragging) {
            b2.velX += (impulse / m2) * nx;
            b2.velY += (impulse / m2) * ny;
          }
        }
      }
    }
  }
}

// ==========================================
// 5. BOUCLE PRINCIPALE D'ANIMATION
// ==========================================
function mainLoop() {
  // Effaçage complet de l'écran avant le nouveau rendu
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Mise à jour des positions et de la gravité
  Balls.forEach(ball => ball.update());
  
  // 2. Traitement des collisions complexes entre balles
  if (ballCollisions) {
    handleBallCollisions();
  }
  
  // 3. Dessin final de l'ensemble des éléments
  Balls.forEach(ball => ball.render(ctx));
  
  requestAnimationFrame(mainLoop);
}

mainLoop();

// ==========================================
// 6. ÉCOUTEUR DE MESSAGES CHROME
// ==========================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "createBall") {
    for (let i = 0; i < request.number; i++) {
      if (request.isRandomColor) {
        request.color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      }
      const newBall = new Ball(
        request.size || 100,
        request.mass > 100000 ? 100000 : request.mass || 100,
        request.color || 'red', 
        Math.floor(Math.random()*window.innerWidth) % (window.innerWidth - (request.size || 100)),
        (window.innerHeight / 2) + (Math.floor(Math.random()*100) - 50)
      );
      Balls.push(newBall);
    }
  }

  if (request.action === "deleteBalls") {
    // Plus besoin d'interagir avec le DOM, vider le tableau suffit !
    Balls.length = 0; 
  }

  if (request.action === "shakeBalls") {
    Balls.forEach((ball) => ball.shake());
  }

  if (request.action === "getBallCount") {
    sendResponse({ count: Balls.length });
    return true;
  }

  // Synchronisation dynamique des sliders d'options
  if (request.action === "updateGravity")        gravity = request.gravity;
  if (request.action === "updateFriction")       friction = request.friction;
  if (request.action === "updateBounce")         bounce = request.bounce;
  if (request.action === "updateShake")          shakeForce = request.shake;
  if (request.action === "updateClosedTop")      closedTop = request.closedTop;
  if (request.action === "updateBallCollisions") ballCollisions = request.ballCollisions;
});