const screens = document.querySelectorAll(".screen");

function showScreen(id){
  screens.forEach(s => s.classList.toggle("active", s.id === id));
  if(id === "traffic") Traffic.init();
  if(id === "cards") Cards.init();
  if(id === "attention") Attention.init();
}
document.querySelectorAll("[data-screen]").forEach(btn => {
  btn.addEventListener("click", () => showScreen(btn.dataset.screen));
});

/* -----------------------------------------------------------
   SEMÁFORO
   Avaliação de atenção por 60 segundos.
   Carro no verde = acerto/ponto.
   Carro chegando no vermelho = falha e perde vida.
   O desafio continua até o tempo acabar mesmo com 0 vidas.
----------------------------------------------------------- */
const Traffic = (() => {
  let score=0, running=false, timeLeft=60, axis="horizontal";
  let frame=null, spawnTimer=null, countdown=null, cars=[];
  const directions=["left","right","top","bottom"];
  const board=()=>document.getElementById("traffic-board");

  function init(){
    stop();
    score=0; timeLeft=60; axis="horizontal"; cars=[];
    const b=board();
    if(b) b.querySelectorAll(".car").forEach(c=>c.remove());
    update(); setLight();
    document.getElementById("traffic-time").textContent="Tempo: 60s";
    document.getElementById("traffic-message").textContent="HORIZONTAL liberada. Clique no semáforo para liberar a VERTICAL.";
  }

  function update(){
    const s=document.getElementById("traffic-score");
    const t=document.getElementById("traffic-time");
    if(s) s.textContent=score;
    if(t) t.textContent=`Tempo: ${timeLeft}s`;
  }

  function setLight(){
    document.querySelectorAll(".lamp").forEach(x=>x.classList.remove("active"));
    const lamp=document.querySelector(".lamp."+(axis==="horizontal"?"green":"red"));
    if(lamp) lamp.classList.add("active");

    const status=document.getElementById("axis-status");
    if(status) status.textContent=axis.toUpperCase();

    document.querySelectorAll(".axis-tag").forEach(el=>{
      const a=(el.dataset.axis||"").toLowerCase();
      el.classList.toggle("active",a===axis);
    });
  }

  function toggleAxis(){
    if(!running)return;
    axis=axis==="horizontal"?"vertical":"horizontal";
    setLight();
    document.getElementById("traffic-message").textContent =
      axis==="horizontal"
      ? "HORIZONTAL liberada. VERTICAL está parada."
      : "VERTICAL liberada. HORIZONTAL está parada.";
  }

  function start(){
    stop();
    running=true; score=0; timeLeft=60; axis="horizontal"; cars=[];
    const b=board();
    if(b) b.querySelectorAll(".car").forEach(c=>c.remove());
    update(); setLight();

    spawnTimer=setInterval(spawn,650);
    frame=setInterval(step,16);
    countdown=setInterval(()=>{
      timeLeft--; update();
      if(timeLeft<=0) finish();
    },1000);
  }

  function stop(){
    running=false;
    clearInterval(spawnTimer); clearInterval(frame); clearInterval(countdown);
    spawnTimer=frame=countdown=null;
  }

  function spawn(){
    if(!running)return;
    const b=board(); if(!b)return;
    const dir=directions[Math.floor(Math.random()*directions.length)];
    const car=document.createElement("div");
    car.className="car "+dir;
    b.appendChild(car);

    // Posiciona imediatamente o carro na entrada correta da pista.
    const w=b.clientWidth, h=b.clientHeight;
    if(dir==="left") {
      car.style.left="-45px";
      car.style.top=(h/2)+"px";
    } else if(dir==="right") {
      car.style.left=(w+45)+"px";
      car.style.top=(h/2)+"px";
    } else if(dir==="top") {
      car.style.left=(w/2)+"px";
      car.style.top="-45px";
    } else {
      car.style.left=(w/2)+"px";
      car.style.top=(h+45)+"px";
    }

    cars.push({el:car,dir,p:0,scored:false,speed:.0045+Math.random()*.002});
  }

  function isOpen(dir){
    const horizontal=dir==="left"||dir==="right";
    return horizontal ? axis==="horizontal" : axis==="vertical";
  }

  function step(){
    if(!running)return;
    const b=board(); if(!b)return;
    const w=b.clientWidth,h=b.clientHeight,cx=w/2,cy=h/2,stopPoint=.39;

    for(let i=cars.length-1;i>=0;i--){
      const c=cars[i],open=isOpen(c.dir);

      // Closed axis stops before the intersection; open axis continues through it.
      if(!open && c.p>=stopPoint)c.p=stopPoint;
      else c.p+=c.speed;

      let x=cx,y=cy;
      if(c.dir==="left")x=-45+(w+90)*c.p;
      if(c.dir==="right")x=w+45-(w+90)*c.p;
      if(c.dir==="top")y=-45+(h+90)*c.p;
      if(c.dir==="bottom")y=h+45-(h+90)*c.p;
      c.el.style.left=x+"px";
      c.el.style.top=y+"px";

      if(open && !c.scored && c.p>=.52){
        c.scored=true; score++; update();
      }

      if(c.p>1.05){
        c.el.remove(); cars.splice(i,1);
      }
    }
  }

  function finish(){
    if(!running)return;
    stop();
    const final=document.getElementById("traffic-final-score");
    const max=document.getElementById("traffic-max-score");
    if(final)final.textContent=score;
    // The theoretical maximum is the number of cars that appeared.
    if(max)max.textContent=score;
    showScreen("traffic-result");
  }

  document.getElementById("traffic-start").addEventListener("click",start);
  document.getElementById("traffic-light").addEventListener("click",toggleAxis);

  return {init};
})();

const Cards = (() => {
  const pairs=[["🍇","🍑"],["🍎","🍌"],["🐶","🐱"],["⭐","🌙"],["🌹","🌻"],["🍉","🍓"],["⚽","🏀"],["🐟","🐠"]];
  let score=0,round=0,current=null,dragging=false,startX=0;

  function init(){
    score=0;round=0;current=null;
    update();document.getElementById("cards-message").textContent="";
    next();
  }

  function update(){
    const s=document.getElementById("cards-score");
    const r=document.getElementById("cards-round");
    if(s)s.textContent=score;
    if(r)r.textContent=`Rodada: ${Math.min(round,20)}/20`;
  }

  function makeItems(icon,n){return icon.repeat(n);}

  function next(){
    round++;
    const pair=pairs[Math.floor(Math.random()*pairs.length)];
    let left=2+Math.floor(Math.random()*7),right=2+Math.floor(Math.random()*7);
    while(left===right)right=2+Math.floor(Math.random()*7);
    current={left,right};

    const inner=document.querySelector(".card-inner");
    inner.innerHTML=`<div class="card-column">${makeItems(pair[0],left)}<span class="card-label">Esquerda</span></div>
      <div class="card-divider"></div>
      <div class="card-column">${makeItems(pair[1],right)}<span class="card-label">Direita</span></div>`;

    const card=document.getElementById("choice-card");
    card.style.transform="translateX(0) rotate(0deg)";
    card.style.opacity="1"; update();
  }

  function choose(side){
    if(!current)return;
    const correct=(side==="left"&&current.left>current.right)||(side==="right"&&current.right>current.left);
    const card=document.getElementById("choice-card");
    card.style.transform=`translateX(${side==="left"?-110:110}%) rotate(${side==="left"?-12:12}deg)`;
    card.style.opacity=".15";

    if(correct)score++;
    document.getElementById("cards-message").textContent="";
    update();

    setTimeout(()=>{
      if(round>=20)finish(); else next();
    },260);
  }

  function finish(){
    current=null;
    document.getElementById("cards-result-content").innerHTML=`
      <div class="result-stats">
        <div class="stat"><b>${score}</b><span>pontuação</span></div>
        <div class="stat"><b>20</b><span>pontuação máxima</span></div>
      </div>`;
    showScreen("cards-result");
  }

  const card=document.getElementById("choice-card");
  card.addEventListener("pointerdown",e=>{
    if(!current)return;
    dragging=true;startX=e.clientX;card.setPointerCapture(e.pointerId);
  });
  card.addEventListener("pointermove",e=>{
    if(!dragging||!current)return;
    const dx=e.clientX-startX;
    card.style.transform=`translateX(${dx}px) rotate(${dx/18}deg)`;
  });
  card.addEventListener("pointerup",e=>{
    if(!dragging||!current)return;
    dragging=false;
    const dx=e.clientX-startX;
    if(Math.abs(dx)>80)choose(dx<0?"left":"right");
    else card.style.transform="translateX(0) rotate(0deg)";
  });
  card.addEventListener("pointercancel",()=>{dragging=false;card.style.transform="translateX(0) rotate(0deg)"});
  document.getElementById("choose-left").addEventListener("click",()=>choose("left"));
  document.getElementById("choose-right").addEventListener("click",()=>choose("right"));
  return {init};
})();

showScreen("home");




/* ===== DESAFIO 3: ONDE ESTÁ? ===== */
const Attention = (() => {
  const targetOptions=["⭐","🔑","🍎","🎈","🐱","🌙"];
  let score=0,round=0,running=false,targetIndex=-1,previewTimer=null,moveTimer=null;
  let objects=[], phase="idle";

  const board=()=>document.getElementById("attention-board");

  function init(){
    stop();
    score=0;round=0;phase="idle";
    document.getElementById("attention-score").textContent="0";
    document.getElementById("attention-round").textContent="Rodada: 1/8";
    document.getElementById("attention-target-name").textContent="—";
    document.getElementById("attention-instruction").textContent="Clique em Começar para iniciar.";
    document.getElementById("attention-message").textContent="";
    const b=board(); if(b)b.innerHTML="";
  }

  function start(){
    stop();
    score=0;round=0;running=true;
    nextRound();
  }

  function stop(){
    clearTimeout(previewTimer);clearInterval(moveTimer);
    previewTimer=moveTimer=null;running=false;
  }

  function nextRound(){
    if(!running)return;
    if(round>=8){finish();return;}
    round++;
    phase="preview";
    objects=[];
    const b=board();b.innerHTML="";
    const target=targetOptions[Math.floor(Math.random()*targetOptions.length)];
    document.getElementById("attention-target-name").textContent=target;
    document.getElementById("attention-round").textContent=`Rodada: ${round}/8`;
    document.getElementById("attention-instruction").textContent=`Observe o alvo ${target}. Ele ficará escondido em instantes.`;

    const count=10;
    targetIndex=Math.floor(Math.random()*count);

    for(let i=0;i<count;i++){
      const el=document.createElement("button");
      el.type="button";el.className="attention-object";
      el.textContent=i===targetIndex?target:"●";
      el.setAttribute("aria-label",i===targetIndex?"Alvo":"Objeto");
      b.appendChild(el);
      const item={
        el,
        x:8+Math.random()*84,
        y:12+Math.random()*72,
        vx:(Math.random()>.5?1:-1)*(0.26+Math.random()*.16),
        vy:(Math.random()>.5?1:-1)*(0.21+Math.random()*.14),
        isTarget:i===targetIndex
      };
      objects.push(item);
      el.style.left=item.x+"%";el.style.top=item.y+"%";
      el.addEventListener("click",()=>select(item));
    }

    previewTimer=setTimeout(hideTarget,2200);
  }

  function hideTarget(){
    if(!running)return;
    phase="shuffle";
    document.getElementById("attention-instruction").textContent="Agora acompanhe o movimento. Clique onde você acha que o alvo ficou.";
    objects.forEach(o=>{
      o.el.textContent="●";
      o.el.classList.remove("target-visible");
    });

    moveTimer=setInterval(()=>{
      const b=board();if(!b)return;
      objects.forEach(o=>{
        o.x+=o.vx;o.y+=o.vy;
        if(o.x<5||o.x>95)o.vx*=-1;
        if(o.y<8||o.y>90)o.vy*=-1;
        o.el.style.left=o.x+"%";o.el.style.top=o.y+"%";
      });
    },45);

    setTimeout(()=>{
      if(!running)return;
      clearInterval(moveTimer);moveTimer=null;
      phase="select";
      document.getElementById("attention-instruction").textContent="Escolha a posição onde você acredita que o alvo está.";
    },2600);
  }

  function select(item){
    if(!running||phase!=="select")return;
    phase="result";
    if(item.isTarget)score++;
    document.getElementById("attention-score").textContent=score;
    objects.forEach(o=>o.el.disabled=true);
    item.el.classList.add(item.isTarget?"chosen-correct":"chosen-other");
    setTimeout(nextRound,650);
  }

  function finish(){
    stop();
    document.getElementById("attention-final-score").textContent=score;
    document.getElementById("attention-max-score").textContent="8";
    showScreen("attention-result");
  }

  document.getElementById("attention-start").addEventListener("click",start);
  return {init};
})();
