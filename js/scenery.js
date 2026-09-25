const makeImage=()=>typeof Image!=='undefined'?new Image():{complete:false,naturalWidth:0,naturalHeight:0};

const port={backdrop:makeImage(),midground:makeImage(),ground:makeImage(),props:makeImage()};
const jungle={backdrop:makeImage(),midground:makeImage(),ground:makeImage(),props:makeImage()};
const citadel={backdrop:makeImage(),midground:makeImage(),ground:makeImage(),props:makeImage()};
const desert={backdrop:makeImage(),midground:makeImage(),ground:makeImage(),props:makeImage()};

if(typeof Image!=='undefined'){
  port.backdrop.src='assets/levels/port-fire/backdrop.webp';
  port.midground.src='assets/levels/port-fire/midground.webp';
  port.ground.src='assets/levels/port-fire/ground.webp';
  port.props.src='assets/levels/port-fire/props-atlas.webp';
  jungle.backdrop.src='assets/levels/jungle-storm/backdrop.webp';
  jungle.midground.src='assets/levels/jungle-storm/midground.webp';
  jungle.ground.src='assets/levels/jungle-storm/ground.webp';
  jungle.props.src='assets/levels/jungle-storm/props-atlas.webp';
  citadel.backdrop.src='assets/levels/iron-citadel/backdrop.webp';
  citadel.midground.src='assets/levels/iron-citadel/midground.webp';
  citadel.ground.src='assets/levels/iron-citadel/ground.webp';
  citadel.props.src='assets/levels/iron-citadel/props-atlas.webp';
  desert.backdrop.src='assets/levels/serpent-desert/backdrop.webp';
  desert.midground.src='assets/levels/serpent-desert/midground.webp';
  desert.ground.src='assets/levels/serpent-desert/ground.webp';
  desert.props.src='assets/levels/serpent-desert/props-atlas.webp';
}

const propCells={
  crate:[0,0,92,88],redBarrel:[1,0,62,86],blueBarrel:[2,0,62,86],sandbags:[3,0,130,72],
  lamp:[0,1,68,172],fence:[1,1,138,112],anchor:[2,1,112,94],pallet:[3,1,118,82],
  fire:[0,2,98,88],barrier:[1,2,124,72],bollard:[2,2,76,72],scrap:[3,2,128,86]
};
const jungleCells={gateClosed:[0,1,190,150],gateOpen:[1,1,190,150],checkpoint:[2,1,110,155],bridge:[3,1,230,130],fern:[0,2,150,105],barrier:[1,2,150,94],generator:[2,2,155,110],crates:[3,2,145,104]};
const citadelCells={arenaClosed:[0,1,175,150],arenaOpen:[1,1,175,150],checkpoint:[2,1,105,150],searchlight:[3,1,145,190],rubble:[0,2,160,112],sandbags:[1,2,160,100],statue:[2,2,145,175],ammo:[3,2,155,110]};

function loaded(img){return img.complete&&img.naturalWidth>0}

function repeatImage(c,img,offset,y,w,h){
  if(!loaded(img))return false;
  const start=-((offset%w)+w)%w;
  for(let x=start-w;x<1280+w;x+=w)c.drawImage(img,x,y,w,h);
  return true;
}

export function drawSceneryProp(c,type,x,y,scale=1,flip=false,time=0,damage=0){
  const spec=propCells[type];
  if(!spec||!loaded(port.props))return;
  const [col,row,w,h]=spec,sw=port.props.naturalWidth/4,sh=port.props.naturalHeight/3;
  const pulse=type==='fire'?1+Math.sin(time*.25+x)*.035:1;
  c.save();c.translate(x,y);c.scale((flip?-1:1)*scale*pulse,scale/pulse);
  c.drawImage(port.props,col*sw,row*sh,sw,sh,-w/2,-h,w,h);
  if(type==='fire'){
    const glow=c.createRadialGradient(0,-42,5,0,-42,72);
    glow.addColorStop(0,'#ffb22e70');glow.addColorStop(1,'#ff5a1200');
    c.globalCompositeOperation='screen';c.fillStyle=glow;c.beginPath();c.arc(0,-42,72,0,Math.PI*2);c.fill();
  }
  if(damage>0){
    c.strokeStyle=`rgba(255,170,80,${Math.min(.9,.3+damage*.55)})`;c.lineWidth=2/scale;
    c.beginPath();c.moveTo(-w*.2,-h*.72);c.lineTo(0,-h*.52);c.lineTo(-w*.08,-h*.32);
    c.moveTo(w*.2,-h*.62);c.lineTo(w*.04,-h*.45);c.lineTo(w*.16,-h*.2);c.stroke();
  }
  c.restore();
}

export function drawJungleProp(c,type,x,y,scale=1,flip=false,time=0){
  const spec=jungleCells[type];if(!spec||!loaded(jungle.props))return;
  const [col,row,w,h]=spec,sw=jungle.props.naturalWidth/4,sh=jungle.props.naturalHeight/3;
  const pulse=type==='checkpoint'?1+Math.sin(time*.12)*.035:1;
  c.save();c.translate(x,y);c.scale((flip?-1:1)*scale*pulse,scale/pulse);
  c.drawImage(jungle.props,col*sw,row*sh,sw,sh,-w/2,-h,w,h);c.restore();
}

export function drawCitadelProp(c,type,x,y,scale=1,flip=false,time=0){
  const spec=citadelCells[type];if(!spec||!loaded(citadel.props))return;
  const [col,row,w,h]=spec,sw=citadel.props.naturalWidth/4,sh=citadel.props.naturalHeight/3;
  const pulse=type==='checkpoint'?1+Math.sin(time*.12)*.035:1;
  c.save();c.translate(x,y);c.scale((flip?-1:1)*scale*pulse,scale/pulse);
  c.drawImage(citadel.props,col*sw,row*sh,sw,sh,-w/2,-h,w,h);c.restore();
}

export function drawDesertProp(c,type,x,y,scale=1,flip=false){
  const cells={depot:[0,0,345,235],convoy:[1,0,395,224],cactus:[0,1,270,182],rocks:[0,1,270,182],barrier:[1,1,285,155]};
  const spec=cells[type];if(!spec||!loaded(desert.props))return;
  const [col,row,w,h]=spec,sw=desert.props.naturalWidth/2,sh=desert.props.naturalHeight/2;
  c.save();c.translate(x,y);c.scale((flip?-1:1)*scale,scale);
  c.drawImage(desert.props,col*sw,row*sh,sw,sh,-w/2,-h,w,h);c.restore();
}

export function drawLevelScenery(c,level,cam,time){
  if(level.id===4){
    c.fillStyle='#b85333';c.fillRect(0,0,1280,720);
    repeatImage(c,desert.backdrop,cam*.055,0,1665,555);
    repeatImage(c,desert.midground,cam*.2,202,1065,355);
    const haze=c.createLinearGradient(0,280,0,555);haze.addColorStop(0,'#fcb66600');haze.addColorStop(1,'#f8b05333');c.fillStyle=haze;c.fillRect(0,280,1280,275);
    if(!repeatImage(c,desert.ground,cam,555,495,165)){c.fillStyle=level.ground;c.fillRect(0,555,1280,165)}
    for(const[type,worldX,scale=1,flip=false]of level.scenery||[]){const x=worldX-cam;if(x>-230&&x<1510)drawDesertProp(c,type,x,555,scale,flip)}
    c.fillStyle='#ffd49b';for(let i=0;i<34;i++){const x=((i*91-cam*.3-time*(1.2+i%3*.4))%1430+1430)%1430,y=140+(i*73+time*(.35+i%2*.2))%415;c.globalAlpha=.08+(i%3)*.06;c.fillRect(x,y,3+i%3,1+i%2)}c.globalAlpha=1;
    return true;
  }
  if(level.id===3){
    c.fillStyle='#160d1c';c.fillRect(0,0,1280,720);
    repeatImage(c,citadel.backdrop,cam*.05,0,1665,555);
    repeatImage(c,citadel.midground,cam*.2,202,1065,355);
    const smoke=c.createLinearGradient(0,260,0,560);smoke.addColorStop(0,'#7b3e6900');smoke.addColorStop(1,'#3b243f40');c.fillStyle=smoke;c.fillRect(0,260,1280,300);
    if(!repeatImage(c,citadel.ground,cam,555,495,165)){c.fillStyle=level.ground;c.fillRect(0,555,1280,165)}
    for(const item of level.scenery||[]){const[type,worldX,scale=1,flip=false]=item,x=worldX-cam;if(x>-220&&x<1500)drawCitadelProp(c,type,x,555,scale,flip,time)}
    c.fillStyle='#ff9b46';for(let i=0;i<28;i++){const x=((i*127-cam*.28+time*(.3+i%3*.15))%1450+1450)%1450,y=520-((i*61+time*(.8+i%2))%410);c.globalAlpha=.15+(i%4)*.08;c.fillRect(x,y,2+i%2,2+i%2)}c.globalAlpha=1;
    return true;
  }
  if(level.id===2){
    c.fillStyle='#071a1c';c.fillRect(0,0,1280,720);
    repeatImage(c,jungle.backdrop,cam*.055,0,1525,555);
    repeatImage(c,jungle.midground,cam*.22,202,1065,355);
    const mist=c.createLinearGradient(0,300,0,570);mist.addColorStop(0,'#49d9d000');mist.addColorStop(1,'#49d9d022');c.fillStyle=mist;c.fillRect(0,300,1280,270);
    if(!repeatImage(c,jungle.ground,cam,555,495,165)){c.fillStyle=level.ground;c.fillRect(0,555,1280,165)}
    for(const item of level.scenery||[]){const[type,worldX,scale=1,flip=false]=item,x=worldX-cam;if(x>-220&&x<1500)drawJungleProp(c,type,x,555,scale,flip,time)}
    c.strokeStyle='#a8efff55';c.lineWidth=2;
    for(let i=0;i<42;i++){const x=((i*83-cam*.12+time*9)%1450+1450)%1450,y=(i*47+time*15)%610;c.beginPath();c.moveTo(x,y);c.lineTo(x-9,y+25);c.stroke()}
    if(Math.floor(time/170)%4===1&&time%170<8){c.fillStyle='#d9ffff28';c.fillRect(0,0,1280,555)}
    return true;
  }
  if(level.id!==1)return false;

  c.fillStyle='#14273b';c.fillRect(0,0,1280,720);
  if(!repeatImage(c,port.backdrop,cam*.055,0,1665,555)){
    const g=c.createLinearGradient(0,0,0,555);g.addColorStop(0,'#15283d');g.addColorStop(1,'#d06d3d');
    c.fillStyle=g;c.fillRect(0,0,1280,555);
  }

  repeatImage(c,port.midground,cam*.2,202,1065,355);

  const haze=c.createLinearGradient(0,250,0,555);
  haze.addColorStop(0,'#ff873000');haze.addColorStop(1,'#ff71301f');
  c.fillStyle=haze;c.fillRect(0,250,1280,305);

  if(!repeatImage(c,port.ground,cam,555,495,165)){
    c.fillStyle=level.ground;c.fillRect(0,555,1280,165);
  }

  // O trecho final é uma ferrovia de verdade, não apenas um piso genérico.
  if(level.boss){
    const railStart=level.boss.x-420-cam;
    if(railStart<1280){
      c.fillStyle='#171b1f';c.fillRect(Math.max(0,railStart),602,1280-Math.max(0,railStart),14);
      c.fillStyle='#87909a';c.fillRect(Math.max(0,railStart),599,1280-Math.max(0,railStart),4);
      c.fillRect(Math.max(0,railStart),642,1280-Math.max(0,railStart),4);
      c.fillStyle='#49372c';
      for(let x=railStart-(railStart%54);x<1320;x+=54)c.fillRect(x,592,14,66);
    }
  }

  for(const item of level.scenery||[]){
    const [type,worldX,scale=1,flip=false]=item,x=worldX-cam;
    if(x>-180&&x<1460)drawSceneryProp(c,type,x,555,scale,flip,time);
  }

  c.fillStyle='#ffb02b';
  for(let i=0;i<18;i++){
    const x=((i*191-cam*.32+time*(.45+i%3*.2))%1500+1500)%1500;
    const y=510-((i*71+time*(1+i%2))%390);
    c.globalAlpha=.18+(i%4)*.08;c.fillRect(x,y,2+i%2,2+i%2);
  }
  c.globalAlpha=1;
  return true;
}
