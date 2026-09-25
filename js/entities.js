import {drawAtlas,enemyRows,projectileCols} from './sprites.js';

export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class Particle{
  constructor(x,y,c='#ffb52e',n=1){Object.assign(this,{x,y,c,vx:(Math.random()-.5)*9*n,vy:(Math.random()-.8)*8*n,life:35+Math.random()*25,s:2+Math.random()*5})}
  update(){this.x+=this.vx;this.y+=this.vy;this.vy+=.22;this.life--}
  draw(c,cam){c.globalAlpha=Math.max(0,this.life/55);c.fillStyle=this.c;c.fillRect(this.x-cam,this.y,this.s,this.s);c.globalAlpha=1}
}

export class Bullet{
  constructor(x,y,vx,vy,team='player',damage=12,color='#ffe14a',sprite='rifle'){Object.assign(this,{x,y,vx,vy,team,damage,color,sprite,life:100,r:4})}
  update(){this.x+=this.vx;this.y+=this.vy;this.life--}
  draw(c,cam){
    const x=this.x-cam;c.save();c.translate(x,this.y);if(this.vx<0)c.scale(-1,1);
    if(this.team==='enemy'){
      if(this.sprite==='rocket'){
        c.shadowColor='#ffac42';c.shadowBlur=12;c.fillStyle='#ffba52';c.fillRect(-16,-5,28,10);
        c.fillStyle='#fff2c6';c.beginPath();c.moveTo(16,0);c.lineTo(6,-7);c.lineTo(6,7);c.fill();
      }else{c.shadowColor='#ff3b2f';c.shadowBlur=10;c.fillStyle='#ff5a42';c.fillRect(-10,-3,20,6)}
    }else if(this.team==='grenade'){
      if(!drawAtlas(c,'effects',0,1,5,5,-14,-16,28,28)){c.fillStyle='#9aff53';c.beginPath();c.arc(0,0,8,0,7);c.fill()}
    }else{
      const col=projectileCols[this.sprite]??0;
      const sizes={rifle:[30,16],heavy:[32,16],shotgun:[38,22],laser:[42,20],rocket:[46,24]};
      const [w,h]=sizes[this.sprite]||sizes.rifle;
      if(!drawAtlas(c,'effects',col,0,5,5,-w/2,-h/2,w,h)){c.fillStyle=this.color;c.fillRect(-7,-2,14,4)}
    }
    c.restore();
  }
}

export class Enemy{
  constructor(type,x,y=555){
    const stats={grunt:[45,1.4,10],gunner:[65,.9,14],drone:[35,1.7,10],shield:[120,.55,18],mutant:[90,2.1,20],elite:[130,1.55,24]}[type]||[50,1,10];
    Object.assign(this,{type,x,y:type==='drone'?350+Math.random()*120:y,w:type==='drone'?48:42,h:type==='mutant'?72:60,hp:stats[0],max:stats[0],speed:stats[1],damage:stats[2],cool:60+Math.random()*90,dead:false,death:0,hit:0,attack:0,anim:0,dir:-1});
  }
  update(g){
    this.anim++;if(this.dead){this.death--;return}if(this.hit>0)this.hit--;if(this.attack>0)this.attack--;
    const dx=g.player.x-this.x;
    // Todos os atlas foram desenhados olhando para a direita. O sinal vira a
    // imagem no Canvas: inimigo à direita do jogador olha para a esquerda.
    this.dir=dx>=0?1:-1;
    if(Math.abs(dx)>260)this.x+=this.dir*this.speed;
    this.cool--;if(this.cool<0&&Math.abs(dx)<600){this.cool=70+Math.random()*80;this.attack=14;g.enemyShoot(this)}
    if(Math.abs(dx)<45&&Math.abs(g.player.y-this.y)<60)g.hurt(this.damage);
    if(g.ally?.active&&!g.ally.complete&&!g.ally.dead&&Math.abs(this.x-g.ally.x)<45&&Math.abs(g.ally.y-this.y)<60)g.hurtAlly(this.damage);
  }
  draw(c,cam){
    const x=this.x-cam,y=this.y,row=enemyRows[this.type]??0;
    const col=this.dead?5:this.hit?4:this.attack?3:(Math.floor(this.anim/8)%2?1:2);
    const sizes={grunt:[92,104],gunner:[108,112],drone:[96,88],shield:[104,112],mutant:[112,116],elite:[96,108]};
    const [dw,dh]=sizes[this.type]||sizes.grunt;c.save();c.translate(x,y);c.scale(this.dir,1);
    const sy=this.type==='drone'?-dh/2:-dh;
    if(!drawAtlas(c,'enemies',col,row,6,6,-dw/2,sy,dw,dh)){c.fillStyle=this.type==='elite'?'#b02639':this.type==='mutant'?'#6d9b3c':this.type==='shield'?'#68778a':'#795f45';c.fillRect(-18,-52,36,52);c.fillStyle='#20252d';c.fillRect(-15,-72,30,24)}
    c.restore();
    if(!this.dead){const barY=y-(this.type==='drone'?58:dh+8);c.fillStyle='#151515';c.fillRect(x-20,barY,40,5);c.fillStyle='#e74436';c.fillRect(x-20,barY,40*this.hp/this.max,5)}
  }
}

export class Player{
  constructor(up){this.x=160;this.y=555;this.vx=0;this.vy=0;this.w=38;this.h=62;this.maxHp=100+up.health*20;this.hp=this.maxHp;this.dir=1;this.grounded=true;this.cool=0;this.inv=0;this.grenades=3+up.grenades;this.weapon='rifle';this.ammo=Infinity;this.damage=1+up.damage*.18;this.armor=up.armor*.08;this.dash=0;this.combo=0;this.comboTime=0;this.vehicle=null}
  update(g){const i=g.input;let s=this.vehicle?4.5:3.4;if(this.dash>0){this.x+=this.dir*9;this.dash--}else{this.vx=(i.down('ArrowLeft','KeyA')?-s:0)+(i.down('ArrowRight','KeyD')?s:0);if(this.vx)this.dir=Math.sign(this.vx);this.x+=this.vx}if(i.tap('ArrowUp','KeyW','Space')&&this.grounded){this.vy=-10.5;this.grounded=false;g.fx.tone(260,.05)}this.vy+=.48;this.y+=this.vy;if(this.y>=555){this.y=555;this.vy=0;this.grounded=true}if(i.tap('KeyC','ShiftLeft')&&this.dash<=0){this.dash=12;this.inv=18}if(this.cool>0)this.cool--;if(this.inv>0)this.inv--;if(this.comboTime>0)this.comboTime--;else this.combo=0;if(i.down('KeyZ','KeyJ'))this.shoot(g);if(i.tap('KeyX','KeyK'))this.grenade(g);this.x=clamp(this.x,30,g.level.length-100)}
  shoot(g){
    if(this.cool>0)return;const data={rifle:[10,8,Infinity],heavy:[17,11,80],shotgun:[24,7,36],laser:[14,14,100],rocket:[55,6,18]}[this.weapon];
    if(this.ammo<=0){this.weapon='rifle';this.ammo=Infinity;return}this.cool=this.weapon==='heavy'?6:10;this.ammo!==Infinity&&this.ammo--;
    const spread=this.weapon==='shotgun'?[-.16,0,.16]:[0];spread.forEach(a=>g.bullets.push(new Bullet(this.x+this.dir*30,this.y-38,this.dir*data[1],a*data[1],'player',data[0]*this.damage,this.weapon==='laser'?'#59f5ff':'#ffe14a',this.weapon)));g.fx.shoot();
  }
  grenade(g){if(!this.grenades)return;this.grenades--;const b=new Bullet(this.x,this.y-45,this.dir*7,-8,'grenade',90*this.damage,'#9aff53','grenade');b.r=12;b.life=60;g.bullets.push(b);g.fx.tone(180,.1)}
  draw(c,cam){const x=this.x-cam,y=this.y;c.save();if(this.inv&&Math.floor(this.inv/3)%2)c.globalAlpha=.25;c.translate(x,y);c.scale(this.dir,1);c.fillStyle='#e3bd91';c.fillRect(-11,-58,22,19);c.fillStyle='#2d6f71';c.fillRect(-16,-39,32,37);c.restore()}
}
