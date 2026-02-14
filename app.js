
const canvas = document.getElementById("flowerCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 400;

let angle = 0;

function drawFlower(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const centerX = canvas.width/2;
    const centerY = canvas.height/2;

    for(let i=0;i<12;i++){
        const petalAngle = (Math.PI*2/12)*i + angle;
        const x = centerX + Math.cos(petalAngle)*80;
        const y = centerY + Math.sin(petalAngle)*80;

        ctx.beginPath();
        ctx.fillStyle = "#ff4d88";
        ctx.arc(x,y,40,0,Math.PI*2);
        ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = "#ff99cc";
    ctx.arc(centerX,centerY,50,0,Math.PI*2);
    ctx.fill();

    angle += 0.01;
    requestAnimationFrame(drawFlower);
}

drawFlower();
