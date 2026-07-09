class Ball {
  constructor(size, color, posX, posY) {
    this.size = size;
    this.color = color;
    this.posX = posX;
    this.posY = posY;
    this.velX = 0;
    this.velY = 0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Création de l'élément
    this.ball = document.createElement('div');
    this.applyStyle();
    document.body.appendChild(this.ball);

    // Initialisation des événements
    this.initEvents();
  }

  shake() {
    this.velX += (Math.random() - 0.5) * shakeForce;
    this.velY += (Math.random() - 0.5) * shakeForce;
  }

  destroy() {
    if (this.ball && this.ball.parentNode) {
      this.ball.parentNode.removeChild(this.ball);
    }
    window.removeEventListener('mousemove', this.mouseMoveHandler);
    window.removeEventListener('mouseup', this.mouseUpHandler);
    this.ball.removeEventListener('mousedown', this.mouseDownHandler);
    this.isDragging = false;
  }

  applyStyle() {
    Object.assign(this.ball.style, {
      width: `${this.size}px`,
      height: `${this.size}px`,
      backgroundColor: this.color,
      borderRadius: '50%',
      position: 'fixed',
      cursor: 'grab',
      zIndex: '1000000',
      boxShadow: '0 4px 5px rgba(0,0,0,0.3)',
    });
  }

  initEvents() {
    this.mouseMoveHandler = (e) => {
      if (this.isDragging) {
        this.velX = e.clientX - this.lastMouseX;
        this.velY = e.clientY - this.lastMouseY;
        this.posX = e.clientX - this.size / 2;
        this.posY = e.clientY - this.size / 2;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    };

    this.mouseUpHandler = () => {
      this.isDragging = false;
      this.ball.style.cursor = 'grab';
    };

    this.mouseDownHandler = (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.ball.style.cursor = 'grabbing';
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    };

    window.addEventListener('mousemove', this.mouseMoveHandler);
    window.addEventListener('mouseup', this.mouseUpHandler);
    this.ball.addEventListener('mousedown', this.mouseDownHandler);
  }

  update() {
    if (!this.isDragging) {
      this.velY += gravity;
      this.velX *= friction;
      this.velY *= friction;

      this.posX += this.velX;
      this.posY += this.velY;

      // Collisions avec les murs
      if (closedTop){
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
      if (this.posX + this.size > window.innerWidth || this.posX < 0) {
        this.velX *= -bounce;
        this.posX = this.posX < 0 ? 0 : window.innerWidth - this.size;
      }
    }
  }

  // Le rendu visuel est isolé pour éviter les micro-saccades pendant les calculs de collision
  render() {
    this.ball.style.left = `${this.posX}px`;
    this.ball.style.top = `${this.posY}px`;
  }
}

let gravity = 0.5;
let friction = 0.985;
let bounce = 0.8;
let shakeForce = 100;
let closedTop = false;
let ballCollisions = false;
const Balls = [];

chrome.storage.local.get(['gravity', 'friction', 'bounce', 'shake'], (data) => {
  if (data.gravity !== undefined) gravity = data.gravity;
  if (data.friction !== undefined) friction = data.friction;
  if (data.bounce !== undefined) bounce = data.bounce;
  if (data.shake !== undefined) shakeForce = data.shake;
});

// --- LE MOTEUR DE COLLISION ENTRE BALLES ---
function handleBallCollisions() {
  for (let i = 0; i < Balls.length; i++) {
    for (let j = i + 1; j < Balls.length; j++) {
      const b1 = Balls[i];
      const b2 = Balls[j];

      // 1. Calcul des centres et rayons
      const r1 = b1.size / 2;
      const r2 = b2.size / 2;
      const c1x = b1.posX + r1;
      const c1y = b1.posY + r1;
      const c2x = b2.posX + r2;
      const c2y = b2.posY + r2;

      // Distance vectorielle entre les deux centres
      const dx = c2x - c1x;
      const dy = c2y - c1y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDist = r1 + r2;

      // S'il y a collision réelle (intersection des cercles)
      if (distance < minDist) {
        // Vecteur normal unitaire (direction de la collision)
        const nx = distance === 0 ? 1 : dx / distance;
        const ny = distance === 0 ? 0 : dy / distance;

        // --- ÉTAPE A : SÉPARATION PHYSIQUE (Anti-clipping) ---
        const overlap = minDist - distance;
        
        // Si aucune des deux n'est tenue par la souris, on partage la séparation
        if (!b1.isDragging && !b2.isDragging) {
          b1.posX -= nx * (overlap / 2);
          b1.posY -= ny * (overlap / 2);
          b2.posX += nx * (overlap / 2);
          b2.posY += ny * (overlap / 2);
        } else if (!b1.isDragging) { // b2 est tenue, seule b1 est repoussée
          b1.posX -= nx * overlap;
          b1.posY -= ny * overlap;
        } else if (!b2.isDragging) { // b1 est tenue, seule b2 est repoussée
          b2.posX += nx * overlap;
          b2.posY += ny * overlap;
        }

        // --- ÉTAPE B : IMPULSION ÉLASTIQUE (Choc physique) ---
        // Vitesse relative
        const kx = b2.velX - b1.velX;
        const ky = b2.velY - b1.velY;
        const velAlongNormal = kx * nx + ky * ny;

        // On résout le choc uniquement si elles se dirigent l'une vers l'autre
        if (velAlongNormal < 0) {
          // On utilise la taille du composant comme indicateur de Masse (m = size)
          const m1 = b1.size;
          const m2 = b2.size;

          // Formule de l'impulsion de restitution (Choc élastique)
          const impulse = (-(1 + bounce) * velAlongNormal) / ((1 / m1) + (1 / m2));

          // Application des nouvelles vitesses vectorielles
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

// Boucle d'animation unique synchronisée
function mainLoop() {
  // 1. On applique la physique de base (murs, gravité)
  Balls.forEach(ball => ball.update());
  
  // 2. On résout les collisions complexes entre les balles
  if (ballCollisions) {
    handleBallCollisions();
  }
  
  // 3. On affiche la position finale calculée de chaque élément
  Balls.forEach(ball => ball.render());
  
  requestAnimationFrame(mainLoop);
}

mainLoop();

// Chrome message listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "createBall") {
    for (let i = 0; i < request.number; i++) {
      if (request.isRandomColor) {
        request.color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      }
      const newBall = new Ball(
        request.size || 100, 
        request.color || 'red', 
        Math.floor(Math.random()*16777215) % (window.innerWidth - request.size || 100),
        (window.innerHeight / 2) + (Math.floor(Math.random()*16777215) % 100)
      );
      Balls.push(newBall);
    }
  }

  if (request.action === "deleteBalls") {
    Balls.forEach((ball) => ball.destroy());
    Balls.length = 0;
  }

  if (request.action === "shakeBalls") {
    Balls.forEach((ball) => ball.shake());
  }

  if (request.action === "getBallCount") {
    sendResponse({ count: Balls.length });
    return true;
  }

  if (request.action === "updateGravity")    gravity = request.gravity;
  if (request.action === "updateFriction")   friction = request.friction;
  if (request.action === "updateBounce")     bounce = request.bounce;
  if (request.action === "updateShake")      shakeForce = request.shake;
  if (request.action === "updateClosedTop")  closedTop = request.closedTop;
  if (request.action === "updateBallCollisions")  ballCollisions = request.ballCollisions;
});