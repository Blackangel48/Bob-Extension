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

  destroy() {
    // Supprime l'élément de la page web
    if (this.ball && this.ball.parentNode) {
      this.ball.parentNode.removeChild(this.ball);
    }

    // Nettoie les listeners
    window.removeEventListener('mousemove', this.mouseMoveHandler);
    window.removeEventListener('mouseup', this.mouseUpHandler);
    this.ball.removeEventListener('mousedown', this.mouseDownHandler);

    // Nettoie les références
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
      // On retire la transition CSS pour la physique car elle ralentit les calculs
    });
  }

  initEvents() {
    this.mouseMoveHandler = (e) => {
      if (this.isDragging) {
        // Calcul de la vitesse par l'écart de position
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

      // Collisions
      if (this.posY + this.size > window.innerHeight) {
        this.posY = window.innerHeight - this.size;
        this.velY *= -bounce;
      }
      if (this.posX + this.size > window.innerWidth || this.posX < 0) {
        this.velX *= -bounce;
        this.posX = this.posX < 0 ? 0 : window.innerWidth - this.size;
      }
    }

    // Rendu visuel
    this.ball.style.left = `${this.posX}px`;
    this.ball.style.top = `${this.posY}px`;
  }
}

const gravity = 0.5;
const friction = 0.985;
const bounce = 0.8;
const Balls = [];

// Boucle d'animation unique
function mainLoop() {
  Balls.forEach(ball => ball.update());
  requestAnimationFrame(mainLoop);
}

mainLoop();

// Chrome message listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "createBall") {
    // On crée une balle au centre de l'écran avec les données du popup
    const newBall = new Ball(
      request.size || 50, 
      request.color || 'red', 
      window.innerWidth / 2, 
      window.innerHeight / 2
    );
    Balls.push(newBall);
  }

  if (request.action === "deleteBalls") {
    // On supprime les balles
    Balls.forEach((ball) => {
      ball.destroy();
    });
    Balls.length = 0;
  }
});