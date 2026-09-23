import {Player,clamp} from './entities.js';

export const ROSTER=[
  {id:'brutus',name:'BRUTUS',title:'O TANQUE DA TURMA',color:'#2d8b78',accent:'#f0bb3d',perk:'+30 de vida',tier:1},
  {id:'nina',name:'NINA',title:'A RAINHA DO GATILHO',color:'#a93f65',accent:'#60dbff',perk:'+20% de dano',tier:1},
  {id:'zeca',name:'ZECA',title:'MESTRE DAS GAMBIARRAS',color:'#d26a2e',accent:'#ffe04b',perk:'+2 granadas',tier:2},
  {id:'maya',name:'MAYA',title:'A SOMBRA DO BARULHO',color:'#674db2',accent:'#5dff9b',perk:'+16% de armadura',tier:2},
  {id:'tiao',name:'TIÃO',title:'O MURO COM BIGODE',color:'#4b668e',accent:'#ff7659',perk:'+50 de vida e +10% dano',tier:3},
  {id:'luna',name:'LUNA',title:'A TEMPESTADE',color:'#b7343e',accent:'#fff16a',perk:'+30% de dano e +1 granada',tier:3}
];

const sheets={};
const makeImage=()=>typeof Image!=='undefined'?new Image():{complete:false,naturalWidth:0,naturalHeight:0};
for(const hero of ROSTER){
  const movement=makeImage();
  const weapons=makeImage();
  if(typeof Image!=='undefined'){
    movement.src=`assets/players/${hero.id}/movement.webp`;
    weapons.src=`assets/players/${hero.id}/weapons.webp`;
  }
  sheets[hero.id]={movement,weapons};
}

export function applyCharacter(player,id){
  const hero=ROSTER.find(x=>x.id===id)||ROSTER[0];
  player.character=hero;
  player.animTime=0;
  player.actionTime=0;
  player.crouching=false;
  player.running=false;
  if(id==='brutus'){player.maxHp+=30;player.hp+=30}
  if(id==='nina')player.damage*=1.2;
  if(id==='zeca')player.grenades+=2;
  if(id==='maya')player.armor=Math.min(.65,player.armor+.16);
  if(id==='tiao'){player.maxHp+=50;player.hp+=50;player.damage*=1.1}
  if(id==='luna'){player.damage*=1.3;player.grenades+=1}
}

const originalGrenade=Player.prototype.grenade;
Player.prototype.grenade=function(g){
  const before=this.grenades;
  originalGrenade.call(this,g);
  if(this.grenades<before){this.action='grenade';this.actionTime=18}
};

Player.prototype.update=function(g){
  const i=g.input;
  this.animTime=(this.animTime||0)+1;
  if(this.actionTime>0)this.actionTime--;
  this.crouching=this.grounded&&i.down('ArrowDown','KeyS');
  this.running=!this.crouching&&i.down('ShiftLeft','ShiftRight');
  const speed=this.vehicle?4.5:(this.running?5.2:2.7);
  if(this.dash>0){this.x+=this.dir*9;this.dash--}
  else if(!this.crouching){
    this.vx=(i.down('ArrowLeft','KeyA')?-speed:0)+(i.down('ArrowRight','KeyD')?speed:0);
    if(this.vx)this.dir=Math.sign(this.vx);
    this.x+=this.vx;
  }else this.vx=0;
  if(i.tap('ArrowUp','KeyW','Space')&&this.grounded&&!this.crouching){this.vy=-10.5;this.grounded=false;g.fx.tone(260,.05)}
  this.vy+=.48;this.y+=this.vy;
  if(this.y>=555){this.y=555;this.vy=0;this.grounded=true}
  if(i.tap('KeyC')&&this.dash<=0){this.dash=12;this.inv=18}
  if(this.cool>0)this.cool--;
  if(this.inv>0)this.inv--;
  if(this.comboTime>0)this.comboTime--;else this.combo=0;
  if(i.down('KeyZ','KeyJ'))this.shoot(g);
  if(i.tap('KeyX','KeyK'))this.grenade(g);
  this.x=clamp(this.x,30,g.level.length-100);
};

function movementFrame(p){
  if(p.inv>45)return [4,2];
  if(p.actionTime>0&&p.action==='grenade')return [4,1];
  if(!p.grounded){
    if(p.vy<-5)return [3,0];
    if(p.vy<-1)return [3,1];
    if(p.vy<2)return [3,2];
    return [3,3];
  }
  if(p.crouching)return [3,5];
  if(Math.abs(p.vx)>.1){
    const row=p.running||p.dash>0?2:1;
    const rate=row===2?4:7;
    return [row,Math.floor(p.animTime/rate)%6];
  }
  return [0,Math.floor(p.animTime/12)%6];
}

Player.prototype.draw=function(c,cam){
  const x=this.x-cam,y=this.y,hero=this.character||ROSTER[0],set=sheets[hero.id];
  c.save();
  if(this.inv&&Math.floor(this.inv/3)%2)c.globalAlpha=.3;
  c.translate(x,y);
  c.scale(this.dir,1);
  if(this.vehicle){
    c.fillStyle=this.vehicle==='tank'?'#52694a':'#58616b';c.fillRect(-48,-35,96,38);
    c.fillStyle='#15191e';c.beginPath();c.arc(-29,3,18,0,7);c.arc(29,3,18,0,7);c.fill();
  }
  const firing=this.cool>0&&set.weapons.complete;
  const img=firing?set.weapons:set.movement;
  if(img.complete&&img.naturalWidth){
    let row,col,cols,rows;
    if(firing){
      const weaponIndex={rifle:0,heavy:1,shotgun:2,laser:3,rocket:4}[this.weapon]??0;
      row=this.crouching?4:3;col=weaponIndex;cols=5;rows=5;
    }else{
      [row,col]=movementFrame(this);cols=6;rows=5;
    }
    const sw=img.naturalWidth/cols,sh=img.naturalHeight/rows;
    const size=hero.id==='tiao'?126:116;
    c.drawImage(img,col*sw,row*sh,sw,sh,-size/2,-size+10,size,size);
  }else{
    c.fillStyle=hero.color;c.fillRect(-16,-55,32,55);
    c.fillStyle=hero.accent;c.fillRect(-14,-65,28,10);
  }
  c.restore();
};
