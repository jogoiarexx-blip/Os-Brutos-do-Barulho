const makeImage=()=>typeof Image!=='undefined'?new Image():{complete:false,naturalWidth:0,naturalHeight:0};

const port={backdrop:makeImage(),midground:makeImage(),ground:makeImage(),props:makeImage()};

if(typeof Image!=='undefined'){
  port.backdrop.src='assets/levels/port-fire/backdrop.webp';
  port.midground.src='assets/levels/port-fire/midground.webp';
  port.ground.src='assets/levels/port-fire/ground.webp';
  port.props.src='assets/levels/port-fire/props-atlas.webp';
}

const propCells={
  crate:[0,0,92,88],redBarrel:[1,0,62,86],blueBarrel:[2,0,62,86],sandbags:[3,0,130,72],
  lamp:[0,1,68,172],fence:[1,1,138,112],anchor:[2,1,112,94],pallet:[3,1,118,82],
  fire:[0,2,98,88],barrier:[1,2,124,72],bollard:[2,2,76,72],scrap:[3,2,128,86]
};

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

export function drawLevelScenery(c,level,cam,time){
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
