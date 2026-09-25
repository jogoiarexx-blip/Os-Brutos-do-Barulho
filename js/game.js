import {Player,Enemy,Bullet,Particle,clamp} from './entities.js';
import {drawAtlas,vehicleRows,pickupCols} from './sprites.js';
import {ATTACK_DURATION,IMPACT_AT,bossAnimationFrame} from './boss-animations.js';
import {drawLevelScenery,drawSceneryProp,drawJungleProp,drawCitadelProp,drawDesertProp,drawCanyonProp,drawMineProp,drawSwampProp} from './scenery.js';

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
    this.radios=(level.radios||[]).map(r=>({...r,y:555,max:r.hp,dead:false,hit:0,anim:0}));
    this.ally=level.ally?{...level.ally,x:level.ally.start,y:555,max:level.ally.hp,active:false,complete:false,dead:false,inv:0,anim:0,dir:1}:null;
    this.breach=level.breach?{...level.breach,y:555,max:level.breach.hp,dead:false,hit:0,death:0}:null;
    this.ambush=level.ambush?{...level.ambush,active:false,complete:false,kills:0}:null;
    this.depots=(level.depots||[]).map(d=>({...d,max:d.hp,dead:false,hit:0}));
    this.convoy=level.convoy?{...level.convoy,max:level.convoy.hp,disabled:false,captured:false,hit:0,cool:75}:null;
    this.nests=(level.nests||[]).map(n=>({...n,max:n.hp,dead:false,hit:0,cool:65}));
    this.lifts=(level.lifts||[]).map(l=>({...l,max:l.hp,dead:false,hit:0}));
    this.cages=(level.cages||[]).map(l=>({...l,max:l.hp,open:false,hit:0}));
    this.masks=(level.masks||[]).map(x=>({x,collected:false}));
    this.pumps=(level.pumps||[]).map(p=>({...p,max:p.hp,dead:false,hit:0}));
    this.hostages=level.hostages.map(x=>({x,y:555,rescued:false,celebrate:0}));
    this.spawned=new Set;this.cam=0;this.score=0;this.coins=0;this.kills=0;
    this.currentObjective=0;this.boss=null;this.vehicleTaken=false;this.checkpoint=0;this.gateToast=0;
    this.time=0;this.poisonTime=0;this.intro=96;this.running=true;this.paused=false;this.last=performance.now();
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
    if(this.radios.length&&this.currentObjective===0)this.player.x=Math.min(this.player.x,this.level.radioGate||3100);
    if(this.ally&&this.currentObjective===1){
      if(!this.ally.active&&this.player.x>this.ally.start-160){this.ally.active=true;this.toast(`${this.ally.name}: NÃO ME DEIXA PRA TRÁS!`,1800)}
      if(this.ally.active&&!this.ally.dead){
        this.ally.anim+=dt;if(this.ally.inv>0)this.ally.inv-=dt;
        const target=Math.min(this.player.x-105,this.ally.end),dx=target-this.ally.x;
        if(Math.abs(dx)>8){this.ally.dir=Math.sign(dx);this.ally.x+=this.ally.dir*Math.min(2.55*dt,Math.abs(dx))}else this.ally.x=target;
        this.player.x=Math.min(this.player.x,this.ally.x+390);
        if(this.ally.x>=this.ally.end-5){this.ally.complete=true;this.completeObjective(1,this.level.id===5?'DEMOLIDORES CHEGARAM AO PAREDÃO':`${this.ally.name} CHEGOU AO LABORATÓRIO`)}
      }
    }
    if(this.breach&&!this.breach.dead){this.player.x=Math.min(this.player.x,this.breach.x-190);if(this.breach.hit>0)this.breach.hit-=dt}
    if(this.ambush&&this.currentObjective===1){
      if(!this.ambush.active&&this.player.x>=this.ambush.x-80)this.startAmbush();
      if(this.ambush.active)this.player.x=clamp(this.player.x,this.ambush.left,this.ambush.right);
    }
    if(this.depots.length&&this.currentObjective===0)this.player.x=Math.min(this.player.x,this.level.depotGate);
    if(this.convoy&&!this.convoy.captured&&this.currentObjective===1){
      if(!this.convoy.disabled)this.player.x=Math.min(this.player.x,this.convoy.x-185);
      else if(Math.abs(this.player.x-this.convoy.x)<165){
        this.convoy.captured=true;this.completeObjective(1,'COMBOIO CAPTURADO');this.score+=1500;this.coins+=35;
      }
      this.player.x=Math.min(this.player.x,this.level.convoyGate);
      if(!this.convoy.disabled&&Math.abs(this.player.x-this.convoy.x)<720){
        this.convoy.cool-=dt;
        if(this.convoy.cool<=0){
          this.convoy.cool=65+Math.random()*25;
          const sx=this.convoy.x-125,sy=385,dx=this.player.x-sx,dy=this.player.y-35-sy,len=Math.hypot(dx,dy)||1;
          this.bullets.push(new Bullet(sx,sy,dx/len*6.5,dy/len*6.5,'enemy',12*this.mult,'#ffc256','heavy'));
        }
      }
    }
    this.depots.forEach(d=>{if(d.hit>0)d.hit-=dt});if(this.convoy?.hit>0)this.convoy.hit-=dt;
    if(this.nests.length&&this.currentObjective===0)this.player.x=Math.min(this.player.x,this.level.nestGate);
    if(this.lifts.length&&this.currentObjective===0)this.player.x=Math.min(this.player.x,this.level.liftGate);
    if(this.cages.length&&this.currentObjective===1)this.player.x=Math.min(this.player.x,this.level.minersGate);
    if(this.masks.length&&this.currentObjective===0)this.player.x=Math.min(this.player.x,this.level.maskGate);
    if(this.pumps.length&&this.currentObjective===1)this.player.x=Math.min(this.player.x,this.level.pumpGate);
    for(const nest of this.nests){
      if(nest.dead)continue;if(nest.hit>0)nest.hit-=dt;
      if(Math.abs(this.player.x-nest.x)>690)continue;
      nest.cool-=dt;
      if(nest.cool<=0){
        nest.cool=67+Math.random()*25;
        const sx=nest.x-110,sy=417,dx=this.player.x-sx,dy=this.player.y-35-sy,len=Math.hypot(dx,dy)||1;
        this.bullets.push(new Bullet(sx,sy,dx/len*6.1,dy/len*6.1,'enemy',11*this.mult,'#ff9352','heavy'));
      }
    }
    this.lifts.forEach(l=>{if(l.hit>0)l.hit-=dt});
    this.cages.forEach(l=>{if(l.hit>0)l.hit-=dt});
    this.pumps.forEach(p=>{if(p.hit>0)p.hit-=dt});
    for(const mask of this.masks){
      if(!mask.collected&&Math.abs(this.player.x-mask.x)<57){
        mask.collected=true;this.fx.coin();this.score+=400;this.toast(`FILTRO COLETADO · ${this.masks.filter(m=>m.collected).length}/${this.masks.length}`);
        if(this.masks.every(m=>m.collected))this.completeObjective(0,'EQUIPE PROTEGIDA DO GÁS');
      }
    }
    if(this.level.id===7&&this.player.grounded&&(this.level.poison||[]).some(x=>Math.abs(this.player.x-x)<150)){
      this.poisonTime+=dt;
      if(this.poisonTime>=65){this.poisonTime=0;this.hurt(10-this.masks.filter(m=>m.collected).length*2)}
    }else this.poisonTime=0;
    if(this.currentObjective<2&&this.player.x>this.level.boss.x-430){
      this.player.x=this.level.boss.x-430;
      if(this.gateToast<=0){
        if(this.level.id===1){const missing=3-this.hostages.filter(h=>h.rescued).length;this.toast(`PORTÃO TRAVADO · FALTAM ${missing} PRISIONEIRO${missing===1?'':'S'}`)}
        else this.toast('PORTÃO TRAVADO · CONCLUA O OBJETIVO');
        this.gateToast=100;
      }
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
      if(!h.rescued&&Math.abs(this.player.x-h.x)<50&&(!this.cages.length||this.cages.find(c=>c.x===h.x)?.open)){
        h.rescued=true;h.celebrate=55;this.score+=1000;this.coins+=25;this.fx.coin();
        this.toast('PRISIONEIRO RESGATADO +1000');
        if(this.level.id===1&&this.hostages.filter(x=>x.rescued).length>=3&&this.currentObjective===1)this.completeObjective(1,'TODOS OS PRISIONEIROS FORAM SALVOS');
        if(this.level.id===6&&this.hostages.every(x=>x.rescued)&&this.currentObjective===1)this.completeObjective(1,'TODOS OS MINEIROS ESTÃO LIVRES');
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
        for(const radio of this.radios){
          if(b.life<=0||radio.dead)continue;
          if(Math.abs(b.x-radio.x)<92&&Math.abs(b.y-410)<155){
            radio.hp-=b.damage;radio.hit=7;b.life=0;this.burst(b.x,b.y,'#65f4ff',5);
            if(radio.hp<=0){
              radio.hp=0;radio.dead=true;this.score+=700;this.coins+=12;this.burst(radio.x,radio.y-115,'#63efff',22);this.fx.boom();
              if(this.radios.every(r=>r.dead))this.completeObjective(0,'SINAL DA LEGIÃO CORTADO');
            }
          }
        }
        for(const depot of this.depots){
          if(b.life<=0||depot.dead)continue;
          if(Math.abs(b.x-depot.x)<125&&Math.abs(b.y-450)<108){
            depot.hp-=b.damage;depot.hit=7;b.life=0;this.burst(b.x,b.y,'#ffc257',4);
            if(depot.hp<=0){
              depot.hp=0;depot.dead=true;this.score+=900;this.coins+=16;this.burst(depot.x,475,'#ff863c',26);this.fx.boom();
              for(const e of this.enemies)if(!e.dead&&Math.abs(e.x-depot.x)<180){e.hp-=100;if(e.hp<=0)this.kill(e)}
              if(Math.abs(this.player.x-depot.x)<130)this.hurt(18);
              if(this.depots.every(d=>d.dead))this.completeObjective(0,'DEPÓSITOS SABOTADOS');
            }
          }
        }
        for(const nest of this.nests){
          if(b.life<=0||nest.dead)continue;
          if(Math.abs(b.x-nest.x)<125&&Math.abs(b.y-460)<104){
            nest.hp-=b.damage;nest.hit=7;b.life=0;this.burst(b.x,b.y,'#ffb36c',4);
            if(nest.hp<=0){
              nest.hp=0;nest.dead=true;this.score+=850;this.coins+=15;
              this.burst(nest.x,470,'#ff7b3e',25);this.fx.boom();
              if(this.nests.every(n=>n.dead))this.completeObjective(0,'NINHOS DE METRALHADORA DESTRUÍDOS');
            }
          }
        }
        for(const lift of this.lifts){
          if(b.life<=0||lift.dead)continue;
          if(Math.abs(b.x-lift.x)<130&&Math.abs(b.y-452)<105){
            lift.hp-=b.damage;lift.hit=7;b.life=0;this.burst(b.x,b.y,'#61e9ff',4);
            if(lift.hp<=0){lift.hp=0;lift.dead=true;this.score+=850;this.coins+=15;this.burst(lift.x,455,'#71efff',22);this.fx.boom();if(this.lifts.every(l=>l.dead))this.completeObjective(0,'GUINCHOS DESATIVADOS')}
          }
        }
        for(const cage of this.cages){
          if(b.life<=0||cage.open)continue;
          if(Math.abs(b.x-cage.x)<105&&Math.abs(b.y-459)<103){
            cage.hp-=b.damage;cage.hit=7;b.life=0;this.burst(b.x,b.y,'#ffc46b',4);
            if(cage.hp<=0){cage.hp=0;cage.open=true;this.burst(cage.x,485,'#7eebff',18);this.fx.boom();this.toast('JAULA ABERTA · ALCANCE OS MINEIROS')}
          }
        }
        for(const pump of this.pumps){
          if(b.life<=0||pump.dead)continue;
          if(Math.abs(b.x-pump.x)<135&&Math.abs(b.y-458)<113){
            pump.hp-=b.damage;pump.hit=7;b.life=0;this.burst(b.x,b.y,'#b8ff62',5);
            if(pump.hp<=0){
              pump.hp=0;pump.dead=true;this.score+=950;this.coins+=18;this.burst(pump.x,465,'#9df23d',25);this.fx.boom();
              if(this.pumps.every(p=>p.dead))this.completeObjective(1,'BOMBAS QUÍMICAS DESLIGADAS');
            }
          }
        }
        if(this.convoy&&!this.convoy.disabled&&b.life>0&&Math.abs(b.x-this.convoy.x)<170&&Math.abs(b.y-465)<94){
          this.convoy.hp-=b.damage;this.convoy.hit=7;b.life=0;this.burst(b.x,b.y,'#ffae56',4);
          if(this.convoy.hp<=0){this.convoy.hp=0;this.convoy.disabled=true;this.burst(this.convoy.x,475,'#ffa349',22);this.fx.boom();this.toast('COMBOIO IMOBILIZADO · APROXIME-SE PARA CAPTURAR')}
        }
        if(this.breach&&!this.breach.dead&&b.life>0&&Math.abs(b.x-this.breach.x)<150&&Math.abs(b.y-410)<155){
          this.breach.hp-=b.damage;this.breach.hit=7;b.life=0;this.burst(b.x,b.y,'#ff9a43',5);
          if(this.breach.hp<=0){
            this.breach.hp=0;this.breach.dead=true;this.breach.death=55;this.score+=1600;this.coins+=30;
            this.burst(this.breach.x,this.breach.y-110,'#ff6b32',32);this.fx.boom();this.completeObjective(0,'MURALHA INVADIDA');
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
        const bossHalfW=this.level.id===3?105:[5,6,7].includes(this.level.id)?210:185,bossHalfH=this.level.id===3?135:[4,5,6,7].includes(this.level.id)?145:105;
        if(this.boss&&!this.boss.dead&&b.life>0&&Math.abs(b.x-this.boss.x)<bossHalfW&&Math.abs(b.y-(this.boss.y-95))<bossHalfH){
          this.boss.hp-=b.damage;this.boss.hit=7;b.life=0;this.burst(b.x,b.y,'#ff712e',4);
          if(this.boss.hp<=0){
            this.boss.hp=0;this.boss.dead=true;this.boss.death=70;this.boss.attack=0;
            if(this.level.id===1)this.completeObjective(2,'COLOSSO FERROVIÁRIO DESTRUÍDO');
            if(this.level.id===2)this.completeObjective(2,'MAMUTE ÔMEGA DESTRUÍDO');
            if(this.level.id===3)this.completeObjective(2,'GENERAL VOSS DERROTADO');
            if(this.level.id===4)this.completeObjective(2,'ESCORPIÃO DE AÇO DERROTADO');
            if(this.level.id===5)this.completeObjective(2,'FORTALEZA GOLIATH DESTRUÍDA');
            if(this.level.id===6)this.completeObjective(2,'BROCA TITÃ DESLIGADA');
            if(this.level.id===7)this.completeObjective(2,'LEVIATÃ TÓXICO DERROTADO');
            this.burst(this.boss.x,this.boss.y-90,'#ff5a20',28);this.fx.boom();
          }
        }
      }else if(b.team==='enemy'&&Math.abs(b.x-this.player.x)<26&&Math.abs(b.y-(this.player.y-30))<38){
        b.life=0;this.hurt(b.damage);
      }
      if(b.team==='enemy'&&b.life>0&&this.ally?.active&&!this.ally.complete&&!this.ally.dead&&Math.abs(b.x-this.ally.x)<25&&Math.abs(b.y-(this.ally.y-32))<40){b.life=0;this.hurtAlly(b.damage)}
    }
    if(this.boss&&!this.boss.dead&&this.boss.entrance<=0){
      const boss=this.boss;
      if(boss.attack>0){
        if(!boss.fired&&boss.attack<=IMPACT_AT){boss.fired=true;this.fireBossAttack()}
      }else if(--boss.cool<0){
        boss.pattern++;boss.fired=false;boss.attack=ATTACK_DURATION;
        boss.attackKind=this.level.id===3&&boss.pattern%2===0?'low':this.level.id===4&&boss.pattern%3===0?'claw':this.level.id===4&&boss.pattern%3===1?'sting':this.level.id===5?(boss.pattern%2?'cannon':'missiles'):this.level.id===6?(boss.pattern%2?'drill':'quake'):this.level.id===7?(boss.pattern%2?'venom':'surge'):'volley';
        boss.cool=boss.hp<boss.max*.5?34:48;
      }
    }
  }

  fireBossAttack(){
    const boss=this.boss,enraged=boss.hp<boss.max*.5;
    const sx=boss.x-(this.level.id===3?115:180),sy=boss.y-205;
    const dx=this.player.x-sx,dy=this.player.y-35-sy,angle=Math.atan2(dy,dx);
    if(boss.attackKind==='venom'){
      const px=boss.x-245,py=boss.y-205,a=Math.atan2(this.player.y-35-py,this.player.x-px);
      for(const offset of[-.16,0,.16])this.bullets.push(new Bullet(px,py,Math.cos(a+offset)*6.7,Math.sin(a+offset)*6.7,'enemy',13*this.mult,'#a2f02f','heavy'));
    }else if(boss.attackKind==='surge'){
      for(const speed of[6.7,8.2,9.7])this.bullets.push(new Bullet(boss.x-205,boss.y-37,-speed,0,'enemy',15*this.mult,'#a8ee3c','heavy'));
      this.burst(boss.x-220,boss.y-40,'#a8ee3c',18);
    }else if(boss.attackKind==='drill'){
      for(const speed of[6.3,7.8,9.2])this.bullets.push(new Bullet(boss.x-225,boss.y-36,-speed,0,'enemy',14*this.mult,'#60efff','heavy'));
      this.burst(boss.x-240,boss.y-45,'#71eeff',15);
    }else if(boss.attackKind==='quake'){
      for(const offset of[-140,0,140])this.bullets.push(new Bullet(this.player.x+offset,185,0,5.9,'enemy',13*this.mult,'#61e8ff','rocket'));
      this.burst(this.player.x,185,'#6eeeff',12);
    }else if(boss.attackKind==='cannon'){
      const px=boss.x-205,py=boss.y-185,a=Math.atan2(this.player.y-35-py,this.player.x-px);
      for(const offset of[-.12,0,.12])this.bullets.push(new Bullet(px,py,Math.cos(a+offset)*7.3,Math.sin(a+offset)*7.3,'enemy',15*this.mult,'#ff9c43','heavy'));
    }else if(boss.attackKind==='missiles'){
      for(const offset of[-100,0,100]){
        const px=boss.x-115,py=boss.y-275,a=Math.atan2(this.player.y-35-py,this.player.x+offset-px);
        this.bullets.push(new Bullet(px,py,Math.cos(a)*5.8,Math.sin(a)*5.8,'enemy',12*this.mult,'#ffad51','rocket'));
      }
    }else if(boss.attackKind==='low'){
      for(const speed of[6.4,8.2])this.bullets.push(new Bullet(sx,boss.y-22,-speed,0,'enemy',14*this.mult,'#ff8b35','heavy'));
    }else if(boss.attackKind==='claw'){
      for(const speed of[6.8,8.3,9.8])this.bullets.push(new Bullet(sx,boss.y-28,-speed,0,'enemy',13*this.mult,'#ffbc4a','heavy'));
    }else if(boss.attackKind==='sting'){
      for(const offset of[-100,0,100]){
        const tx=this.player.x+offset,px=boss.x-105,py=boss.y-275,a=Math.atan2(535-py,tx-px);
        this.bullets.push(new Bullet(px,py,Math.cos(a)*6.1,Math.sin(a)*6.1,'enemy',12*this.mult,'#5af3ff','laser'));
      }
    }else{
      const spreads=this.level.id===3?[-.24,-.12,0,.12,.24]:[-.13,0,.13];
      for(const spread of spreads){const a=angle+spread,speed=enraged?7.4:6.6,color=this.level.id===2?'#55efff':'#ff6045';this.bullets.push(new Bullet(sx,sy,Math.cos(a)*speed,Math.sin(a)*speed,'enemy',12*this.mult,color,'heavy'))}
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
    if(e.event==='ambush'&&this.ambush?.active){
      this.ambush.kills++;
      if(this.ambush.kills>=this.ambush.required){this.ambush.active=false;this.ambush.complete=true;this.completeObjective(1,'EMBOSCADA IMPERIAL ELIMINADA')}
    }
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

  hurtAlly(amount){
    if(!this.ally||this.ally.inv>0||this.ally.dead)return;
    this.ally.hp-=amount;this.ally.inv=34;this.burst(this.ally.x,this.ally.y-35,'#66e8ff',6);
    if(this.ally.hp<=0){
      this.ally.hp=0;this.ally.dead=true;this.toast(`${this.ally.name} CAIU!`,1200);
      setTimeout(()=>this.running&&this.fail(),700);
    }
  }

  enemyShoot(e){
    const target=this.ally?.active&&!this.ally.complete&&!this.ally.dead&&Math.abs(this.ally.x-e.x)<Math.abs(this.player.x-e.x)?this.ally:this.player;
    const dx=target.x-e.x,dy=(target.y-35)-(e.y-35),d=Math.hypot(dx,dy)||1;
    this.bullets.push(new Bullet(e.x,e.y-40,dx/d*5,dy/d*5,'enemy',e.damage*this.mult,'#ff5545',e.type==='gunner'?'heavy':'rifle'));
  }

  spawnBoss(){
    this.enemies=[];const b=this.level.boss;
    this.boss={x:b.x+780,targetX:b.x+330,y:555,hp:b.hp*this.mult,max:b.hp*this.mult,cool:55,name:b.name,anim:0,hit:0,attack:0,attackKind:'volley',fired:false,dead:false,death:0,entrance:82,pattern:0};
    this.player.x=Math.max(this.player.x,b.x-330);this.toast(`⚠ ARENA BLOQUEADA ⚠<br>${b.name} ESTÁ CHEGANDO`,2500);this.fx.boom();
  }

  startAmbush(){
    if(!this.ambush||this.ambush.active)return;
    this.ambush.active=true;this.toast('⚠ EMBOSCADA IMPERIAL ⚠<br>NÃO DEIXE NINGUÉM DE PÉ!',2200);this.fx.boom();
    const types=['elite','shield','gunner','elite','drone','gunner','shield','elite'];
    for(let i=0;i<this.ambush.required;i++){
      const side=i%2?-1:1,x=side>0?this.ambush.x+300+(i%4)*85:this.ambush.x-260-(i%4)*75;
      const e=new Enemy(types[i%types.length],x);e.hp*=this.mult;e.max=e.hp;e.event='ambush';this.enemies.push(e);
    }
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
    if(this.level.id===1&&this.currentObjective===1)objective+=` · ${this.hostages.filter(h=>h.rescued).length}/3`;
    if(this.level.id===2&&this.currentObjective===0)objective+=` · ${this.radios.filter(r=>r.dead).length}/3`;
    if(this.level.id===2&&this.currentObjective===1&&this.ally)objective+=` · HP ${Math.max(0,Math.ceil(this.ally.hp))}`;
    if(this.level.id===3&&this.currentObjective===0&&this.breach)objective+=` · ${Math.max(0,Math.ceil(this.breach.hp))} HP`;
    if(this.level.id===3&&this.currentObjective===1&&this.ambush)objective+=` · ${this.ambush.kills}/${this.ambush.required}`;
    if(this.level.id===4&&this.currentObjective===0)objective+=` · ${this.depots.filter(d=>d.dead).length}/${this.depots.length}`;
    if(this.level.id===4&&this.currentObjective===1&&this.convoy)objective+=this.convoy.disabled?' · APROXIME-SE':` · ${Math.max(0,Math.ceil(this.convoy.hp))} HP`;
    if(this.level.id===5&&this.currentObjective===0)objective+=` · ${this.nests.filter(n=>n.dead).length}/${this.nests.length}`;
    if(this.level.id===5&&this.currentObjective===1&&this.ally)objective+=` · HP ${Math.max(0,Math.ceil(this.ally.hp))}`;
    if(this.level.id===6&&this.currentObjective===0)objective+=` · ${this.lifts.filter(l=>l.dead).length}/${this.lifts.length}`;
    if(this.level.id===6&&this.currentObjective===1)objective+=` · ${this.hostages.filter(h=>h.rescued).length}/${this.hostages.length}`;
    if(this.level.id===7&&this.currentObjective===0)objective+=` · ${this.masks.filter(m=>m.collected).length}/${this.masks.length}`;
    if(this.level.id===7&&this.currentObjective===1)objective+=` · ${this.pumps.filter(p=>p.dead).length}/${this.pumps.length}`;
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
      if(this.level.id===6&&this.cages.find(c=>c.x===h.x&&!c.open)&&!h.rescued)return;
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

    for(const radio of this.radios){
      const x=radio.x-cam;if(x<-180||x>1460)continue;
      if(radio.hit>0)radio.hit--;
      const col=radio.dead?3:radio.hit>0?1:radio.hp<radio.max*.45?2:0;
      drawAtlas(c,'jungleProps',col,0,4,3,x-112,305,224,250);
      if(!radio.dead){c.fillStyle='#0b1518';c.fillRect(x-52,292,104,8);c.fillStyle='#4feeff';c.fillRect(x-50,294,100*Math.max(0,radio.hp/radio.max),4)}
    }
    if(this.level.id===2){
      const gateWorld=this.currentObjective===0?this.level.radioGate:this.ally?.end;
      if(Number.isFinite(gateWorld)){const open=this.currentObjective>=2;drawJungleProp(c,open?'gateOpen':'gateClosed',gateWorld-cam,555,.9,false,this.time)}
    }
    if(this.ally?.active&&!this.ally.complete&&!this.ally.dead){
      const a=this.ally,x=a.x-cam;c.save();if(a.inv&&Math.floor(a.inv/3)%2)c.globalAlpha=.35;c.translate(x,a.y);c.scale(a.dir,1);
      if(this.level.id===5){c.restore();c.save();if(a.inv&&Math.floor(a.inv/3)%2)c.globalAlpha=.35;drawCanyonProp(c,'demolishers',x,a.y,.85,a.dir<0)}
      else drawAtlas(c,'support',2+Math.floor(a.anim/10)%2,3,4,4,-43,-98,86,98);
      c.restore();
      c.fillStyle='#111';c.fillRect(x-35,438,70,7);c.fillStyle='#55e7ff';c.fillRect(x-33,440,66*Math.max(0,a.hp/a.max),3);
    }
    if(this.breach){
      const b=this.breach,x=b.x-cam,col=b.dead?3:b.hit>0?1:b.hp<b.max*.45?2:0;
      if(x>-260&&x<1540)drawAtlas(c,'citadelProps',col,0,4,3,x-155,285,310,270);
      if(!b.dead){c.fillStyle='#120f17';c.fillRect(x-90,270,180,10);c.fillStyle='#ff793c';c.fillRect(x-87,273,174*Math.max(0,b.hp/b.max),4)}
    }
    if(this.ambush&&(this.ambush.active||this.ambush.complete)){
      const type=this.ambush.active?'arenaClosed':'arenaOpen';
      drawCitadelProp(c,type,this.ambush.left-cam,555,.82,false,this.time);drawCitadelProp(c,type,this.ambush.right-cam,555,.82,true,this.time);
    }
    for(const depot of this.depots){
      const x=depot.x-cam;if(x<-200||x>1480)continue;
      if(!depot.dead){
        drawDesertProp(c,'depot',x,555,.9);
        if(depot.hit>0){c.fillStyle='#fff2a055';c.fillRect(x-155,345,310,210)}
        c.fillStyle='#211910';c.fillRect(x-55,335,110,8);c.fillStyle='#ffc351';c.fillRect(x-53,337,106*depot.hp/depot.max,4);
      }else{c.fillStyle='#332a26';c.fillRect(x-73,532,146,22);c.fillStyle='#ff994455';c.fillRect(x-50,528,100,5)}
    }
    if(this.convoy){
      const v=this.convoy,x=v.x-cam;
      if(x>-260&&x<1540){
        c.save();if(v.captured)c.globalAlpha=.62;
        drawDesertProp(c,'convoy',x,555,.82,false);c.restore();
        if(v.hit>0){c.fillStyle='#fff1ae55';c.fillRect(x-165,375,330,180)}
        if(v.disabled&&!v.captured){c.fillStyle='#fda553';c.font='18px Rajdhani';c.textAlign='center';c.fillText('APROXIME-SE PARA CAPTURAR',x,326)}
        if(!v.disabled){c.fillStyle='#211910';c.fillRect(x-85,340,170,9);c.fillStyle='#ffc351';c.fillRect(x-82,343,164*v.hp/v.max,4)}
      }
    }
    for(const nest of this.nests){
      const x=nest.x-cam;if(x<-200||x>1480)continue;
      if(!nest.dead){
        drawCanyonProp(c,'nest',x,555,.9);
        if(nest.hit>0){c.fillStyle='#ffdd9150';c.fillRect(x-145,355,290,200)}
        c.fillStyle='#251512';c.fillRect(x-61,337,122,9);c.fillStyle='#ffb05b';c.fillRect(x-59,340,118*nest.hp/nest.max,4);
      }else{c.fillStyle='#45302b';c.fillRect(x-86,531,172,24);c.fillStyle='#ff824455';c.fillRect(x-55,526,110,5)}
    }
    for(const lift of this.lifts){
      const x=lift.x-cam;if(x<-210||x>1490)continue;
      if(!lift.dead){drawMineProp(c,'lift',x,555,.9);if(lift.hit>0){c.fillStyle='#77e9ff45';c.fillRect(x-150,348,300,207)}
        c.fillStyle='#0a1c27';c.fillRect(x-64,331,128,8);c.fillStyle='#73eaff';c.fillRect(x-62,333,124*lift.hp/lift.max,4);
      }else{c.fillStyle='#2f4854';c.fillRect(x-76,529,152,26);c.fillStyle='#5dcde977';c.fillRect(x-43,522,86,6)}
    }
    for(const cage of this.cages){
      const x=cage.x-cam;if(x<-180||x>1460)continue;
      if(!cage.open){drawMineProp(c,'cage',x,555,.87);if(cage.hit>0){c.fillStyle='#ffe5a344';c.fillRect(x-115,380,230,175)}
        c.fillStyle='#101c23';c.fillRect(x-52,369,104,8);c.fillStyle='#f7c66b';c.fillRect(x-50,371,100*cage.hp/cage.max,4);
      }else if(!this.hostages.find(h=>h.x===cage.x)?.rescued){c.fillStyle='#79efff';c.font='18px Rajdhani';c.textAlign='center';c.fillText('MINEIROS LIVRES · APROXIME-SE',x,393)}
    }
    for(const mask of this.masks){
      if(mask.collected)continue;const x=mask.x-cam;if(x<-170||x>1450)continue;
      drawSwampProp(c,'mask',x,555,.65);
      c.fillStyle='#d8ff7c';c.font='17px Rajdhani';c.textAlign='center';c.fillText('FILTRO',x,408);
    }
    for(const pump of this.pumps){
      const x=pump.x-cam;if(x<-210||x>1490)continue;
      if(!pump.dead){drawSwampProp(c,'pump',x,555,.85);
        if(pump.hit>0){c.fillStyle='#dcff6a44';c.fillRect(x-150,340,300,215)}
        c.fillStyle='#182516';c.fillRect(x-58,329,116,8);c.fillStyle='#b7ef56';c.fillRect(x-56,331,112*pump.hp/pump.max,4);
      }else{c.fillStyle='#364929';c.fillRect(x-72,531,144,24);c.fillStyle='#aef14566';c.fillRect(x-46,527,92,5)}
    }
    if(this.level.id===7&&this.currentObjective<2){
      const gateX=(this.currentObjective===0?this.level.maskGate:this.level.pumpGate)-cam;
      if(gateX>-190&&gateX<1470)drawSwampProp(c,'gate',gateX,555,.86);
    }
    if(this.level.id===6&&this.currentObjective<2){
      const gateX=(this.currentObjective===0?this.level.liftGate:this.level.minersGate)-cam;
      if(gateX>-180&&gateX<1460)drawMineProp(c,'gate',gateX,555,.9);
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
      const b=this.boss,x=b.x-cam,frame=bossAnimationFrame(this.level.id,b);
      c.save();
      if([4,5,6,7].includes(this.level.id)&&b.dead)c.globalAlpha=Math.max(0,b.death/70);
      if(this.level.id===4&&b.hit>0&&Math.floor(b.hit/2)%2)c.globalAlpha*=.55;
      const bob=this.level.id===4&&!b.dead?Math.sin(b.anim*.11)*3:0;
      const drawn=drawAtlas(c,frame.atlas,frame.col,frame.row,frame.cols,frame.rows,x-frame.w/2,555-frame.h+bob,frame.w,frame.h);
      c.restore();
      if(!drawn){
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
      const gx=this.level.boss.x-380-cam;
      if(this.level.id===2)drawJungleProp(c,'gateClosed',gx,555,.78,false,this.time);
      else if(this.level.id===3)drawCitadelProp(c,'arenaClosed',gx,555,.8,false,this.time);
      else if(this.level.id===4)drawDesertProp(c,'barrier',gx,555,.8,false);
      else if(this.level.id===5)drawCanyonProp(c,'rocks',gx,555,.8,false);
      else if(this.level.id===6)drawMineProp(c,'gate',gx,555,.84);
      else if(this.level.id===7)drawSwampProp(c,'gate',gx,555,.84);
      else{c.fillStyle='#242b31';c.fillRect(gx-12,402,24,153);c.fillRect(1260,402,20,153);c.fillStyle='#ffcc31';for(let y=414;y<548;y+=28){c.save();c.translate(gx,y);c.rotate(-.55);c.fillRect(-18,-5,36,10);c.restore()}}
    }
    if(this.intro>0){
      c.fillStyle=`rgba(0,0,0,${Math.min(.55,this.intro/90)})`;c.fillRect(0,0,1280,720);
      c.textAlign='center';c.fillStyle='#ffd348';c.font='25px Black Ops One';c.fillText(`MISSÃO ${this.level.id}`,640,286);
      c.fillStyle='white';c.font='52px Black Ops One';c.fillText(this.level.name,640,345);
      const briefing=this.level.id===2?'Derrube o sinal inimigo e leve o Dr. Trovão vivo até o laboratório!':this.level.id===3?'Abra a muralha, sobreviva à armadilha e cale o General Voss!':this.level.id===4?'Exploda os depósitos, pare o comboio e desmonte o escorpião!':this.level.id===5?'Limpe os ninhos, proteja os demolidores e pare Goliath!':this.level.id===6?'Quebre os guinchos, abra as jaulas e desligue a Broca Titã!':this.level.id===7?'Pegue os filtros, quebre as bombas químicas e abata o Leviatã!':'A Legião Ferro fechou o porto. Abra caminho e tire todo mundo de lá!';
      c.font='21px Rajdhani';c.fillText(briefing,640,387);
    }
    if(this.player.combo>1){c.fillStyle='#ffe048';c.font='34px Black Ops One';c.textAlign='left';c.fillText(`${this.player.combo}× COMBO`,30,150)}
  }
}
