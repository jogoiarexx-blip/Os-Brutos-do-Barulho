import {Player,Enemy,Bullet,Particle,clamp} from './entities.js';
import {drawAtlas,vehicleRows,pickupCols} from './sprites.js';
import {drawLevelScenery,drawSceneryProp} from './scenery.js';

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
    this.destructibles=(level.destructibles||[]).map(([type,x,scale=1,flip=false])=>({
      type,x,y:555,scale,flip,hp:type==='crate'?42:34,max:type==='crate'?42:34,dead:false
    }));
    this.outpost=level.outpost?{...level.outpost,y:555,max:level.outpost.hp,dead:false,death:0,hit:0,attack:0,cool:55,anim:0}:null;
    this.hostages=level.hostages.map(x=>({x,y:555,rescued:false,celebrate:0}));
    this.spawned=new Set;this.cam=0;this.score=0;this.coins=0;this.kills=0;
    this.currentObjective=0;this.boss=null;this.vehicleTaken=false;this.checkpoint=0;this.gateToast=0;
    this.time=0;this.intro=96;this.running=true;this.paused=false;this.last=performance.now();
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
    this.time+=dt;
    if(this.intro>0){this.intro-=dt;this.updateHud();return}
    this.player.update(this);this.cam=clamp(this.player.x-320,0,this.level.length-1280);
    if(this.outpost&&!this.outpost.dead){
      this.player.x=Math.min(this.player.x,this.outpost.x-185);
      this.outpost.anim+=dt;if(this.outpost.hit>0)this.outpost.hit-=dt;if(this.outpost.attack>0)this.outpost.attack-=dt;
      const distance=this.player.x-this.outpost.x;
      this.outpost.cool-=dt;
      if(this.outpost.cool<=0&&Math.abs(distance)<760){
        this.outpost.cool=58+Math.random()*30;this.outpost.attack=12;
        const sx=this.outpost.x-120,sy=397,dx=this.player.x-sx,dy=(this.player.y-35)-sy,len=Math.hypot(dx,dy)||1;
        this.bullets.push(new Bullet(sx,sy,dx/len*6.2,dy/len*6.2,'enemy',11*this.mult,'#ff6045','heavy'));
      }
    }
    if(this.currentObjective<2&&this.player.x>this.level.boss.x-430){
      this.player.x=this.level.boss.x-430;
      if(this.gateToast<=0){const missing=3-this.hostages.filter(h=>h.rescued).length;this.toast(`PORTÃO TRAVADO · FALTAM ${missing} PRISIONEIRO${missing===1?'':'S'}`);this.gateToast=100}
    }
    if(this.gateToast>0)this.gateToast-=dt;
    if(this.boss&&!this.boss.dead){this.player.x=clamp(this.player.x,this.level.boss.x-360,this.level.length-80)}
    this.cam=clamp(this.player.x-320,0,this.level.length-1280);
    for(const[type,start,count,spacing=120]of this.level.enemies){
      for(let n=0;n<count;n++){
        const key=`${type}-${start}-${n}`,x=start+n*spacing;
        if(!this.spawned.has(key)&&x<this.player.x+(this.level.spawnAhead||1000)){
          this.spawned.add(key);const e=new Enemy(type,x);e.hp*=this.mult;e.max=e.hp;this.enemies.push(e);
        }
      }
    }
    if(!this.boss&&this.currentObjective>=2&&this.player.x>this.level.boss.x-360)this.spawnBoss();
    this.enemies.forEach(e=>e.update(this));
    this.bullets.forEach(b=>{b.update();if(b.team==='grenade')b.vy+=.35});
    this.resolveCollisions();
    this.enemies=this.enemies.filter(e=>(!e.dead||e.death>0)&&e.x>this.cam-250);
    this.bullets=this.bullets.filter(b=>b.life>0&&b.y<680);
    this.particles.forEach(p=>p.update());this.particles=this.particles.filter(p=>p.life>0);
    this.spriteFx.forEach(f=>f.life--);this.spriteFx=this.spriteFx.filter(f=>f.life>0);
    if(this.boss){
      this.boss.anim+=dt;
      if(this.boss.entrance>0){this.boss.entrance-=dt;this.boss.x=Math.max(this.boss.targetX,this.boss.x-5.5*dt)}
      if(this.boss.hit>0)this.boss.hit-=dt;
      if(this.boss.attack>0)this.boss.attack-=dt;
      if(this.boss.dead){this.boss.death-=dt;if(this.boss.death<=0)this.victory()}
    }
    this.hostages.forEach(h=>{
      if(h.celebrate>0)h.celebrate--;
      if(!h.rescued&&Math.abs(this.player.x-h.x)<50){
        h.rescued=true;h.celebrate=55;this.score+=1000;this.coins+=25;this.fx.coin();
        this.toast('PRISIONEIRO RESGATADO +1000');
        if(this.level.id===1&&this.hostages.filter(x=>x.rescued).length>=3&&this.currentObjective===1)this.completeObjective(1,'TODOS OS PRISIONEIROS FORAM SALVOS');
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
    if(!this.outpost){
      const ob=this.level.objectives[this.currentObjective];
      if(ob&&Number.isFinite(ob.x)&&this.player.x>ob.x){this.currentObjective++;this.toast('OBJETIVO ATUALIZADO')}
    }
    this.updateHud();
  }

  resolveCollisions(){
    for(const b of this.bullets){
      if(b.team==='player'||b.team==='grenade'){
        if(this.outpost&&!this.outpost.dead&&b.life>0&&Math.abs(b.x-this.outpost.x)<175&&Math.abs(b.y-420)<150){
          this.outpost.hp-=b.damage;this.outpost.hit=7;b.life=0;this.burst(b.x,b.y,b.color,4);
          if(this.outpost.hp<=0){
            this.outpost.hp=0;this.outpost.dead=true;this.outpost.death=62;this.score+=1800;this.coins+=35;
            this.burst(this.outpost.x,this.outpost.y-105,'#ff672d',34);this.fx.boom();
            this.completeObjective(0,'POSTO AVANÇADO DESTRUÍDO');
          }
        }
        for(const d of this.destructibles){
          if(b.life<=0||d.dead)continue;
          const size=d.type==='crate'?42:32;
          if(Math.abs(b.x-d.x)<size&&Math.abs(b.y-(d.y-42))<52){
            d.hp-=b.damage;b.life=0;this.burst(b.x,b.y,b.color,3);
            if(d.hp<=0)this.breakProp(d);
          }
        }
        for(const e of this.enemies){
          if(b.life<=0)break;
          if(!e.dead&&Math.abs(b.x-e.x)<e.w/2+12&&Math.abs(b.y-(e.y-e.h/2))<e.h/2+15){
            e.hp-=b.damage;e.hit=8;b.life=0;this.burst(b.x,b.y,b.color,3);
            if(e.hp<=0)this.kill(e);
          }
        }
        if(this.boss&&!this.boss.dead&&b.life>0&&Math.abs(b.x-this.boss.x)<185&&Math.abs(b.y-(this.boss.y-95))<105){
          this.boss.hp-=b.damage;this.boss.hit=7;b.life=0;this.burst(b.x,b.y,'#ff712e',4);
          if(this.boss.hp<=0){
            this.boss.hp=0;this.boss.dead=true;this.boss.death=70;this.boss.attack=0;
            if(this.level.id===1)this.completeObjective(2,'COLOSSO FERROVIÁRIO DESTRUÍDO');
            this.burst(this.boss.x,this.boss.y-90,'#ff5a20',28);this.fx.boom();
          }
        }
      }else if(b.team==='enemy'&&Math.abs(b.x-this.player.x)<26&&Math.abs(b.y-(this.player.y-30))<38){
        b.life=0;this.hurt(b.damage);
      }
    }
    if(this.boss&&!this.boss.dead&&this.boss.entrance<=0){
      this.boss.cool--;
      if(this.boss.cool<0){
        const enraged=this.boss.hp<this.boss.max*.5;
        this.boss.cool=enraged?34:48;this.boss.attack=14;
        const sx=this.boss.x-180,sy=this.boss.y-205;
        const dx=this.player.x-sx,dy=(this.player.y-35)-sy,len=Math.hypot(dx,dy)||1,angle=Math.atan2(dy,dx);
        for(const spread of[-.13,0,.13]){
          const a=angle+spread,speed=enraged?7.4:6.6;
          this.bullets.push(new Bullet(sx,sy,Math.cos(a)*speed,Math.sin(a)*speed,'enemy',12*this.mult,'#ff6045','heavy'));
        }
      }
    }
  }

  breakProp(d){
    d.dead=true;this.score+=150;this.coins+=3;this.fx.boom();
    this.burst(d.x,d.y-38,d.type==='redBarrel'?'#ff542e':'#e9a348',d.type==='redBarrel'?22:10);
    for(let i=0;i<8;i++)this.particles.push(new Particle(d.x+(Math.random()-.5)*30,d.y-45,i%2?'#5c3b28':'#b77a3c',1.7));
    if(d.type==='redBarrel'){
      for(const e of this.enemies){
        if(!e.dead&&Math.abs(e.x-d.x)<155){e.hp-=85;e.hit=8;if(e.hp<=0)this.kill(e)}
      }
      if(Math.abs(this.player.x-d.x)<115)this.hurt(22);
    }else if(Math.random()<.65)this.drop(d.x,d.y-35);
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
    this.boss={x:b.x+780,targetX:b.x+330,y:555,hp:b.hp*this.mult,max:b.hp*this.mult,cool:55,name:b.name,anim:0,hit:0,attack:0,dead:false,death:0,entrance:82};
    this.player.x=Math.max(this.player.x,b.x-330);this.toast(`⚠ ARENA BLOQUEADA ⚠<br>${b.name} ESTÁ CHEGANDO`,2500);this.fx.boom();
  }

  completeObjective(index,message){
    if(this.currentObjective!==index)return;
    this.currentObjective=index+1;this.score+=500;this.toast(`${message}<br><small>OBJETIVO CONCLUÍDO</small>`,1800);
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
    let objective=this.level.objectives[this.currentObjective]?.text||'MISSÃO CONCLUÍDA';
    if(this.currentObjective===1)objective+=` · ${this.hostages.filter(h=>h.rescued).length}/3`;
    document.querySelector('#objective').textContent=objective;
    document.querySelector('#score').textContent=String(Math.floor(this.score)).padStart(6,'0');
    document.querySelector('#grenades').textContent=`GRANADAS ×${this.player.grenades}`;
    const bh=document.querySelector('#bossHud');bh.classList.toggle('hidden',!this.boss);
    if(this.boss){document.querySelector('#bossName').textContent=this.boss.name;document.querySelector('#bossBar').style.width=`${Math.max(0,this.boss.hp/this.boss.max*100)}%`}
  }

  draw(){
    const c=this.ctx,l=this.level,cam=this.cam,g=c.createLinearGradient(0,0,0,600);
    if(!drawLevelScenery(c,l,cam,this.time)){
      g.addColorStop(0,l.sky[0]);g.addColorStop(1,l.sky[1]);c.fillStyle=g;c.fillRect(0,0,1280,720);
      c.fillStyle='#ffffff12';
      for(let i=0;i<20;i++){const x=((i*173-cam*.15)%1500+1500)%1500;c.beginPath();c.arc(x,100+(i*47)%300,40+(i%4)*25,0,7);c.fill()}
      c.fillStyle='#0c1218aa';
      for(let i=0;i<30;i++){const x=i*180-(cam*.45%180),h=90+(i*53)%210;c.fillRect(x,555-h,130,h)}
      c.fillStyle=l.ground;c.fillRect(0,555,1280,165);c.fillStyle='#ffffff0d';
      for(let x=-(cam%90);x<1280;x+=90)c.fillRect(x,600,55,8);
    }

    this.hostages.forEach(h=>{
      if(h.rescued&&h.celebrate<=0)return;
      const x=h.x-cam,col=h.rescued?1:0;
      if(!drawAtlas(c,'support',col,3,4,4,x-43,458,86,98)){
        c.fillStyle='#d7b38f';c.fillRect(x-9,493,18,18);c.fillStyle='#eee';c.fillRect(x-14,511,28,44);
      }
    });

    // Bandeiras deixam o retorno ao checkpoint legível durante o combate.
    for(const cp of this.level.checkpoints){
      const x=cp-cam;if(x<-80||x>1360)continue;
      const active=this.checkpoint>=cp;c.fillStyle='#242b31';c.fillRect(x-4,430,8,125);
      c.fillStyle=active?'#5dff9b':'#ffcf47';c.beginPath();c.moveTo(x,438);c.lineTo(x+52,454);c.lineTo(x,474);c.fill();
      if(active){c.fillStyle='#5dff9b55';c.beginPath();c.arc(x,500,48+Math.sin(this.time*.08)*4,0,7);c.fill()}
    }

    if(this.outpost){
      const o=this.outpost,x=o.x-cam;let row=0,col=Math.floor(o.anim/12)%2;
      if(o.attack>0)col=1;if(o.hit>0)col=2;
      if(!o.dead&&o.hp<o.max*.45)col=3;
      if(o.dead){row=1;col=o.death>42?0:o.death>24?1:o.death>8?2:3;if(o.death>0)o.death--}
      drawAtlas(c,'outpost',col,row,4,2,x-205,248,410,307);
      if(!o.dead){c.fillStyle='#101317';c.fillRect(x-115,226,230,13);c.fillStyle='#ff5b3f';c.fillRect(x-112,229,224*Math.max(0,o.hp/o.max),7)}
    }

    if(this.level.vehicle&&!this.vehicleTaken){
      const x=this.level.vehicle.x-cam,type=this.level.vehicle.type,row=vehicleRows[type]??0;
      const col=Math.floor(this.time/12)%2,sizes={jip:[150,94],tank:[170,112],mecha:[142,150]};
      const [w,h]=sizes[type]||sizes.jip;
      if(!drawAtlas(c,'support',col,row,4,4,x-w/2,563-h,w,h)){
        c.fillStyle='#65745d';c.fillRect(x-50,515,100,40);
      }
    }

    for(const d of this.destructibles){
      if(d.dead)continue;
      const x=d.x-cam;
      if(x>-150&&x<1430)drawSceneryProp(c,d.type,x,d.y,d.scale,d.flip,this.time,(d.max-d.hp)/d.max);
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
      const b=this.boss,x=b.x-cam,damaged=b.hp<b.max*.5;
      let row=damaged?1:0,col=Math.floor(b.anim/10)%2;
      if(b.hit>0){row=0;col=3}
      if(b.attack>0){col=damaged?1:2}
      if(b.dead){row=1;col=b.death>34?2:3}
      if(!drawAtlas(c,'bossTrain',col,row,4,2,x-205,255,410,300)){
        c.fillStyle='#7e3443';c.fillRect(x-105,385,210,170);
      }
    }
    this.bullets.forEach(b=>b.draw(c,cam));this.particles.forEach(p=>p.draw(c,cam));
    this.spriteFx.forEach(f=>{
      const age=f.max-f.life,col=1+Math.min(2,Math.floor(age/6));
      drawAtlas(c,'effects',col,1,5,5,f.x-cam-50,f.y-50,100,100);
    });
    this.player.draw(c,cam);
    if(this.boss&&!this.boss.dead){
      const gx=this.level.boss.x-380-cam;c.fillStyle='#242b31';c.fillRect(gx-12,402,24,153);c.fillRect(1260,402,20,153);
      c.fillStyle='#ffcc31';for(let y=414;y<548;y+=28){c.save();c.translate(gx,y);c.rotate(-.55);c.fillRect(-18,-5,36,10);c.restore()}
    }
    if(this.intro>0){
      c.fillStyle=`rgba(0,0,0,${Math.min(.55,this.intro/90)})`;c.fillRect(0,0,1280,720);
      c.textAlign='center';c.fillStyle='#ffd348';c.font='25px Black Ops One';c.fillText('MISSÃO 1',640,286);
      c.fillStyle='white';c.font='52px Black Ops One';c.fillText(this.level.name,640,345);
      c.font='21px Rajdhani';c.fillText('A Legião Ferro fechou o porto. Abra caminho e tire todo mundo de lá!',640,387);
    }
    if(this.player.combo>1){c.fillStyle='#ffe048';c.font='34px Black Ops One';c.textAlign='left';c.fillText(`${this.player.combo}× COMBO`,30,150)}
  }
}
