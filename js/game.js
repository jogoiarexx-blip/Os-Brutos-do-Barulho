import {Player,Enemy,Bullet,Particle,clamp} from './entities.js';
import {drawAtlas,vehicleRows,pickupCols} from './sprites.js';

export class Game{
  constructor(canvas,input,fx,saveData,onEnd){
    this.c=canvas;this.ctx=canvas.getContext('2d');this.input=input;this.fx=fx;
    this.saveData=saveData;this.onEnd=onEnd;this.running=false;this.paused=false;
    this.loop=this.loop.bind(this);
  }

  start(level,difficulty='normal'){
    this.level=level;this.difficulty=difficulty;
    this.mult={easy:.75,normal:1,veteran:1.35,hardcore:1.65}[difficulty];
    this.player=new Player(this.saveData.upgrades);this.bullets=[];this.enemies=[];
    this.particles=[];this.spriteFx=[];this.pickups=[];
    this.hostages=level.hostages.map(x=>({x,y:555,rescued:false,celebrate:0}));
    this.spawned=new Set;this.cam=0;this.score=0;this.coins=0;this.kills=0;
    this.currentObjective=0;this.boss=null;this.vehicleTaken=false;this.checkpoint=0;
    this.time=0;this.running=true;this.paused=false;this.last=performance.now();
    document.querySelector('#menu').classList.add('hidden');
    document.querySelector('#modal').classList.add('hidden');
    document.querySelector('#hud').classList.remove('hidden');
    document.querySelector('#touch').classList.add('playing');
    this.toast(`${level.name}<br><small>${level.subtitle}</small>`,2200);
    requestAnimationFrame(this.loop);
  }

  loop(t){
    if(!this.running)return;
    const dt=Math.min(2,(t-this.last)/16.67);this.last=t;this.input.pollPad();
    if(this.input.tap('Escape'))this.paused=!this.paused;
    if(!this.paused){this.update(dt);this.draw()}
    else{
      this.draw();this.ctx.fillStyle='#000b';this.ctx.fillRect(0,0,1280,720);
      this.ctx.textAlign='center';this.ctx.fillStyle='white';this.ctx.font='48px Black Ops One';
      this.ctx.fillText('PAUSADO',640,330);this.ctx.font='22px Rajdhani';
      this.ctx.fillText('ESC / START para continuar',640,375);
    }
    this.input.end();requestAnimationFrame(this.loop);
  }

  update(dt){
    this.time+=dt;this.player.update(this);this.cam=clamp(this.player.x-320,0,this.level.length-1280);
    for(const[type,start,count]of this.level.enemies){
      for(let n=0;n<count;n++){
        const key=`${type}-${start}-${n}`,x=start+n*120;
        if(!this.spawned.has(key)&&x<this.player.x+1000){
          this.spawned.add(key);const e=new Enemy(type,x);e.hp*=this.mult;e.max=e.hp;this.enemies.push(e);
        }
      }
    }
    if(!this.boss&&this.player.x>this.level.boss.x)this.spawnBoss();
    this.enemies.forEach(e=>e.update(this));
    this.bullets.forEach(b=>{b.update();if(b.team==='grenade')b.vy+=.35});
    this.resolveCollisions();
    this.enemies=this.enemies.filter(e=>(!e.dead||e.death>0)&&e.x>this.cam-250);
    this.bullets=this.bullets.filter(b=>b.life>0&&b.y<680);
    this.particles.forEach(p=>p.update());this.particles=this.particles.filter(p=>p.life>0);
    this.spriteFx.forEach(f=>f.life--);this.spriteFx=this.spriteFx.filter(f=>f.life>0);
    this.hostages.forEach(h=>{
      if(h.celebrate>0)h.celebrate--;
      if(!h.rescued&&Math.abs(this.player.x-h.x)<50){
        h.rescued=true;h.celebrate=55;this.score+=1000;this.coins+=25;this.fx.coin();
        this.toast('PRISIONEIRO RESGATADO +1000');
      }
    });
    if(!this.vehicleTaken&&this.level.vehicle&&Math.abs(this.player.x-this.level.vehicle.x)<65){
      this.vehicleTaken=true;this.player.vehicle=this.level.vehicle.type;
      this.player.hp=Math.min(this.player.maxHp,this.player.hp+35);
      this.toast(`${this.level.vehicle.type.toUpperCase()} CAPTURADO`);
    }
    this.level.checkpoints.forEach(x=>{
      if(this.player.x>x&&x>this.checkpoint){
        this.checkpoint=x;this.toast('CHECKPOINT');this.saveData.lastMission=this.level.id;this.saveData.checkpoint=x;
      }
    });
    const ob=this.level.objectives[this.currentObjective];
    if(ob&&this.player.x>ob.x){this.currentObjective++;this.toast('OBJETIVO ATUALIZADO')}
    this.updateHud();
  }

  resolveCollisions(){
    for(const b of this.bullets){
      if(b.team==='player'||b.team==='grenade'){
        for(const e of this.enemies){
          if(!e.dead&&Math.abs(b.x-e.x)<e.w/2+12&&Math.abs(b.y-(e.y-e.h/2))<e.h/2+15){
            e.hp-=b.damage;e.hit=8;b.life=0;this.burst(b.x,b.y,b.color,3);
            if(e.hp<=0)this.kill(e);
          }
        }
        if(this.boss&&Math.abs(b.x-this.boss.x)<90&&Math.abs(b.y-(this.boss.y-70))<80){
          this.boss.hp-=b.damage;b.life=0;this.burst(b.x,b.y,'#ff712e',4);
          if(this.boss.hp<=0)this.victory();
        }
      }else if(b.team==='enemy'&&Math.abs(b.x-this.player.x)<26&&Math.abs(b.y-(this.player.y-30))<38){
        b.life=0;this.hurt(b.damage);
      }
    }
    if(this.boss){
      this.boss.cool--;
      if(this.boss.cool<0){
        this.boss.cool=28;
        for(let a=-2;a<=2;a++)this.bullets.push(new Bullet(this.boss.x-70,this.boss.y-80,-6,a*1.15,'enemy',12*this.mult,'#ff6045','heavy'));
      }
    }
  }

  kill(e){
    e.dead=true;e.death=24;this.kills++;this.score+=100*(1+this.player.combo);this.coins+=5;
    this.player.combo++;this.player.comboTime=150;this.burst(e.x,e.y-25,'#ff8a26',12);this.fx.boom();
    if(Math.random()<.16)this.drop(e.x,e.y);
  }

  drop(x,y){
    const types=['heavy','shotgun','laser','rocket','health'];
    this.pickups.push({x,y,type:types[Math.floor(Math.random()*types.length)],life:650});
  }

  hurt(amount){
    if(this.player.inv)return;this.player.hp-=amount*(1-this.player.armor);this.player.inv=55;this.fx.hurt();
    if(this.saveData.settings.screenShake)this.c.animate([{transform:'translate(6px,-3px)'},{transform:'none'}],{duration:120});
    if(this.player.hp<=0){
      if(this.checkpoint){this.player.x=this.checkpoint;this.player.hp=this.player.maxHp*.6;this.player.vehicle=null;this.toast('RETORNO AO CHECKPOINT')}
      else this.fail();
    }
  }

  enemyShoot(e){
    const dx=this.player.x-e.x,dy=(this.player.y-35)-(e.y-35),d=Math.hypot(dx,dy)||1;
    this.bullets.push(new Bullet(e.x,e.y-40,dx/d*5,dy/d*5,'enemy',e.damage*this.mult,'#ff5545',e.type==='gunner'?'heavy':'rifle'));
  }

  spawnBoss(){
    this.enemies=[];const b=this.level.boss;
    this.boss={x:b.x+380,y:555,hp:b.hp*this.mult,max:b.hp*this.mult,cool:40,name:b.name};
    this.player.x=Math.max(this.player.x,b.x);this.toast(`⚠ ALERTA ⚠<br>${b.name}`,2500);this.fx.boom();
  }

  burst(x,y,c,n){
    for(let i=0;i<n;i++)this.particles.push(new Particle(x,y,c,n>5?1.3:1));
    if(n>5)this.spriteFx.push({x,y,life:18,max:18});
  }

  victory(){
    if(!this.running)return;this.running=false;this.score+=5000+this.player.hp*20;
    this.saveData.coins+=this.coins+100;this.saveData.highScore=Math.max(this.saveData.highScore,Math.floor(this.score));
    if(!this.saveData.completed.includes(this.level.id))this.saveData.completed.push(this.level.id);
    this.saveData.unlocked=Math.max(this.saveData.unlocked,Math.min(20,this.level.id+1));
    this.saveData.lastMission=this.level.id<20?this.level.id+1:1;
    this.onEnd({win:true,score:Math.floor(this.score),coins:this.coins+100,kills:this.kills,rescued:this.hostages.filter(h=>h.rescued).length});
  }

  fail(){this.running=false;this.onEnd({win:false,score:Math.floor(this.score),coins:this.coins,kills:this.kills,rescued:this.hostages.filter(h=>h.rescued).length})}

  toast(txt,ms=1100){
    const e=document.querySelector('#toast');e.innerHTML=txt;e.style.opacity=1;
    clearTimeout(this.toastT);this.toastT=setTimeout(()=>e.style.opacity=0,ms);
  }

  updateHud(){
    document.querySelector('#hpLabel').textContent=`HP ${Math.max(0,Math.ceil(this.player.hp))}`;
    document.querySelector('#hpBar').style.width=`${Math.max(0,this.player.hp/this.player.maxHp*100)}%`;
    document.querySelector('#weapon').textContent=`${this.player.weapon.toUpperCase()} · ${this.player.ammo===Infinity?'∞':this.player.ammo}`;
    document.querySelector('#mission').textContent=`MISSÃO ${this.level.id} · ${this.level.name}`;
    document.querySelector('#objective').textContent=this.level.objectives[this.currentObjective]?.text||'ELIMINE O CHEFE';
    document.querySelector('#score').textContent=String(Math.floor(this.score)).padStart(6,'0');
    document.querySelector('#grenades').textContent=`GRANADAS ×${this.player.grenades}`;
    const bh=document.querySelector('#bossHud');bh.classList.toggle('hidden',!this.boss);
    if(this.boss){document.querySelector('#bossName').textContent=this.boss.name;document.querySelector('#bossBar').style.width=`${Math.max(0,this.boss.hp/this.boss.max*100)}%`}
  }

  draw(){
    const c=this.ctx,l=this.level,cam=this.cam,g=c.createLinearGradient(0,0,0,600);
    g.addColorStop(0,l.sky[0]);g.addColorStop(1,l.sky[1]);c.fillStyle=g;c.fillRect(0,0,1280,720);
    c.fillStyle='#ffffff12';
    for(let i=0;i<20;i++){const x=((i*173-cam*.15)%1500+1500)%1500;c.beginPath();c.arc(x,100+(i*47)%300,40+(i%4)*25,0,7);c.fill()}
    c.fillStyle='#0c1218aa';
    for(let i=0;i<30;i++){const x=i*180-(cam*.45%180),h=90+(i*53)%210;c.fillRect(x,555-h,130,h)}
    c.fillStyle=l.ground;c.fillRect(0,555,1280,165);c.fillStyle='#ffffff0d';
    for(let x=-(cam%90);x<1280;x+=90)c.fillRect(x,600,55,8);

    this.hostages.forEach(h=>{
      if(h.rescued&&h.celebrate<=0)return;
      const x=h.x-cam,col=h.rescued?1:0;
      if(!drawAtlas(c,'support',col,3,4,4,x-43,458,86,98)){
        c.fillStyle='#d7b38f';c.fillRect(x-9,493,18,18);c.fillStyle='#eee';c.fillRect(x-14,511,28,44);
      }
    });

    if(this.level.vehicle&&!this.vehicleTaken){
      const x=this.level.vehicle.x-cam,type=this.level.vehicle.type,row=vehicleRows[type]??0;
      const col=Math.floor(this.time/12)%2,sizes={jip:[150,94],tank:[170,112],mecha:[142,150]};
      const [w,h]=sizes[type]||sizes.jip;
      if(!drawAtlas(c,'support',col,row,4,4,x-w/2,563-h,w,h)){
        c.fillStyle='#65745d';c.fillRect(x-50,515,100,40);
      }
    }

    for(const p of this.pickups){
      p.life--;const x=p.x-cam;p.y=520+Math.sin(this.time*.08)*7;
      const col=pickupCols[p.type]??0;
      if(!drawAtlas(c,'effects',col,2,5,5,x-30,p.y-30,60,60)){c.fillStyle=p.type==='health'?'#55e67c':'#ffd447';c.fillRect(x-16,p.y-16,32,32)}
      if(Math.abs(this.player.x-p.x)<35){
        if(p.type==='health')this.player.hp=Math.min(this.player.maxHp,this.player.hp+40);
        else{this.player.weapon=p.type;this.player.ammo={heavy:80,shotgun:36,laser:100,rocket:18}[p.type]}
        p.life=0;this.fx.coin();
      }
    }
    this.pickups=this.pickups.filter(p=>p.life>0);
    this.enemies.forEach(e=>e.draw(c,cam));

    if(this.boss){
      const x=this.boss.x-cam;c.fillStyle='#491f2b';c.fillRect(x-85,405,170,150);
      c.fillStyle='#7e3443';c.fillRect(x-60,360,120,70);c.fillStyle='#ffb128';c.fillRect(x-14,388,28,18);
      c.fillStyle='#1b1820';c.fillRect(x-120,430,90,24);
    }
    this.bullets.forEach(b=>b.draw(c,cam));this.particles.forEach(p=>p.draw(c,cam));
    this.spriteFx.forEach(f=>{
      const age=f.max-f.life,col=1+Math.min(2,Math.floor(age/6));
      drawAtlas(c,'effects',col,1,5,5,f.x-cam-50,f.y-50,100,100);
    });
    this.player.draw(c,cam);
    if(this.player.combo>1){c.fillStyle='#ffe048';c.font='34px Black Ops One';c.textAlign='left';c.fillText(`${this.player.combo}× COMBO`,30,150)}
  }
}
