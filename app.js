(() => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: true });

  const DPR = Math.min(2, window.devicePixelRatio || 1);

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);

  // Palette (soft, valentine vibe)
  const petals = [
    '#ff2f67', '#ff5b8a', '#ff86a6', '#ffb3c7',
    '#ffb86b', '#ffd3a0',
    '#7dd3ff', '#bde7ff',
    '#b7ffcf', '#e8ffd6'
  ];

  const stems = ['#2f7a56', '#2b6b4e', '#2a5f46', '#3a8a64'];

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr){ return arr[(Math.random()*arr.length)|0]; }

  // flower object
  class Flower {
    constructor(x, y, s) {
      this.x = x;
      this.y = y;
      this.s = s;
      this.rot = rand(0, Math.PI * 2);
      this.open = 0;        // 0..1
      this.openVel = rand(0.006, 0.014);
      this.wob = rand(0, Math.PI * 2);
      this.petals = 6 + ((Math.random()*4)|0); // 6..9
      this.petalCol = pick(petals);
      this.petalCol2 = pick(petals);
      this.center = 'rgba(255,255,255,.92)';
      this.stem = pick(stems);
      this.life = 1;
      this.fade = rand(0.0005, 0.0015);
    }

    step() {
      this.open = Math.min(1, this.open + this.openVel);
      this.wob += 0.02;
      this.life = Math.max(0, this.life - this.fade);
    }

    draw() {
      const ox = Math.sin(this.wob) * 0.6;
      const oy = Math.cos(this.wob*0.9) * 0.6;

      // stem
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.globalAlpha = 0.9 * this.life;
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.stem;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(ox*6, 16, ox*2, 34);
      ctx.stroke();
      ctx.restore();

      // bloom at top of stem
      const bx = this.x + ox*2;
      const by = this.y + oy*1;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(this.rot);
      ctx.globalAlpha = 0.95 * this.life;

      const t = this.open;                 // bloom progress
      const baseR = this.s * (0.6 + t*0.55);
      const petalR = this.s * (0.9 + t*0.9);

      // petals
      for (let i=0;i<this.petals;i++){
        const a = (i / this.petals) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        ctx.translate(baseR, 0);

        const wob2 = 1 + Math.sin(this.wob + i) * 0.06;
        const w = petalR * 0.78 * wob2;
        const h = petalR * 0.42 * wob2;

        const grad = ctx.createRadialGradient(0,0, 2, 0,0, w);
        grad.addColorStop(0, this.petalCol2);
        grad.addColorStop(1, this.petalCol);

        ctx.fillStyle = grad;

        // petal shape
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(w*0.75, -h, w, 0);
        ctx.quadraticCurveTo(w*0.75, h, 0, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // center
      ctx.globalAlpha = 0.95 * this.life;
      ctx.fillStyle = this.center;
      ctx.beginPath();
      ctx.arc(0, 0, this.s*0.22*(0.6+t*0.9), 0, Math.PI*2);
      ctx.fill();

      // tiny sparkles
      const sparkleN = 2 + ((t*5)|0);
      ctx.globalAlpha = 0.35 * this.life;
      for (let k=0;k<sparkleN;k++){
        const sa = rand(0, Math.PI*2);
        const sr = rand(this.s*0.5, this.s*1.3) * t;
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.fillRect(Math.cos(sa)*sr, Math.sin(sa)*sr, 1, 1);
      }

      ctx.restore();
    }
  }

  // floating petals (confetti-like)
  class Petal {
    constructor(w, h){
      this.x = rand(0, w);
      this.y = rand(-h*0.2, h);
      this.vy = rand(0.3, 1.1);
      this.vx = rand(-0.25, 0.25);
      this.r = rand(2, 4.8);
      this.rot = rand(0, Math.PI*2);
      this.spin = rand(-0.03, 0.03);
      this.col = pick(petals);
      this.alpha = rand(0.25, 0.55);
    }
    step(w,h){
      this.x += this.vx;
      this.y += this.vy;
      this.rot += this.spin;
      if(this.y > h + 20){
        this.y = -20;
        this.x = rand(0, w);
      }
      if(this.x < -20) this.x = w+20;
      if(this.x > w+20) this.x = -20;
    }
    draw(){
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.col;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.r*1.2, this.r*0.7, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }

  let flowers = [];
  let petalsFloat = [];

  function seed() {
    const { width, height } = canvas.getBoundingClientRect();
    flowers = [];
    petalsFloat = [];

    // floating petals
    for (let i=0;i<48;i++){
      petalsFloat.push(new Petal(width, height));
    }

    // flower field: clustered near bottom half
    const n = 26;
    for (let i=0;i<n;i++){
      const x = rand(width*0.08, width*0.92);
      const y = rand(height*0.42, height*0.88);
      const s = rand(18, 44) * (0.75 + (y/height)*0.7);
      flowers.push(new Flower(x, y, s));
    }

    // big bouquet center
    for (let i=0;i<10;i++){
      const x = width*0.5 + rand(-110,110);
      const y = height*0.60 + rand(-70,110);
      const s = rand(34, 62);
      flowers.push(new Flower(x, y, s));
    }
  }

  function bloomMore() {
    const { width, height } = canvas.getBoundingClientRect();
    for (let i=0;i<14;i++){
      const x = rand(width*0.12, width*0.88);
      const y = rand(height*0.35, height*0.85);
      const s = rand(22, 58);
      flowers.push(new Flower(x, y, s));
    }
    // keep reasonable amount
    if(flowers.length > 80) flowers.splice(0, flowers.length - 80);
  }

  function background(w,h){
    // soft vignette
    const g = ctx.createRadialGradient(w*0.5, h*0.6, 30, w*0.5, h*0.6, Math.max(w,h)*0.75);
    g.addColorStop(0, 'rgba(255,255,255,0.0)');
    g.addColorStop(1, 'rgba(0,0,0,0.06)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    // subtle bokeh
    for(let i=0;i<6;i++){
      const x = rand(0,w), y = rand(0,h);
      const r = rand(40,120);
      const gg = ctx.createRadialGradient(x,y, 1, x,y, r);
      gg.addColorStop(0, 'rgba(255,255,255,0.20)');
      gg.addColorStop(1, 'rgba(255,255,255,0.0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fill();
    }
  }

  function loop(){
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0,0,width,height);

    // sky wash
    const sky = ctx.createLinearGradient(0,0,0,height);
    sky.addColorStop(0,'rgba(255,255,255,0.0)');
    sky.addColorStop(1,'rgba(255,255,255,0.35)');
    ctx.fillStyle = sky;
    ctx.fillRect(0,0,width,height);

    // float petals behind
    for(const p of petalsFloat){ p.step(width,height); p.draw(); }

    // flowers
    for(const f of flowers){
      f.step();
      f.draw();
    }
    // remove faded
    flowers = flowers.filter(f => f.life > 0.02);

    background(width,height);

    requestAnimationFrame(loop);
  }

  // Buttons
  document.getElementById('btnBloom').addEventListener('click', bloomMore);

  // "Save" tip button: trigger built-in share if possible, else show hint
  document.getElementById('btnSave').addEventListener('click', async () => {
    // We can't truly save a file here without user interaction & browser support,
    // so we just prompt tips.
    const text = "想保存：手机直接截图；电脑可用浏览器截图/打印为 PDF。";
    try{
      if (navigator.share) {
        await navigator.share({ title: '情人节快乐 💐', text });
      } else {
        alert(text);
      }
    }catch(e){
      // user cancelled share
    }
  });

  // Init
  resize();
  seed();
  loop();

  // Auto bloom a bit
  setTimeout(bloomMore, 900);
})();