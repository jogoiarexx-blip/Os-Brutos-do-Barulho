import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import level from '../fases/fase6.js';
import {Game} from '../js/game.js';
import {Bullet} from '../js/entities.js';
import {IMPACT_AT,bossAnimationFrame} from '../js/boss-animations.js';

for(const name of ['../assets/bosses/titan-drill-attack-atlas.webp','../assets/levels/abandoned-mines/props-atlas.webp']){
  const data=readFileSync(new URL(name,import.meta.url));
  assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');
  assert.ok(data[20]&0x10,`${name}: atlas precisa de transparência`);
  assert.equal(data.readUIntLE(24,3)+1,1000);assert.equal(data.readUIntLE(27,3)+1,666);
}
const nodes=new Map(),node=()=>({classList:{add(){},remove(){},toggle(){}},style:{},textContent:'',innerHTML:''});
globalThis.document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)}};
globalThis.requestAnimationFrame=()=>0;
const input={down:()=>false,tap:()=>false,pollPad(){},end(){}},fx={coin(){},boom(){},hurt(){},shoot(){},tone(){}};
const save={upgrades:{health:0,damage:0,grenades:0,armor:0},settings:{screenShake:false},completed:[],coins:0,highScore:0,unlocked:6,lastMission:6,checkpoint:0};
let result=null;
const game=new Game({getContext:()=>({}),animate(){}},input,fx,save,r=>result=r);
game.start({...level,enemies:[],checkpoints:[]});game.intro=0;

game.player.x=level.liftGate+100;game.update(1);
assert.ok(game.player.x<=level.liftGate,'os guinchos impedem avançar');
for(const lift of game.lifts){game.bullets.push(new Bullet(lift.x,452,0,0,'player',lift.hp+1));game.resolveCollisions()}
assert.equal(game.currentObjective,1);
game.player.x=level.minersGate+100;game.update(1);
assert.ok(game.player.x<=level.minersGate,'jaulas impedem avançar');
const first=game.hostages[0];game.player.x=first.x;game.update(1);
assert.equal(first.rescued,false,'não resgatar mineiro de jaula fechada');
for(const cage of game.cages){
  game.bullets.push(new Bullet(cage.x,459,0,0,'player',cage.hp+1));game.resolveCollisions();
  game.player.x=cage.x;game.update(1);
  assert.equal(game.hostages.find(h=>h.x===cage.x).rescued,true);
}
assert.equal(game.currentObjective,2,'todos os mineiros liberam a arena');
game.player.x=level.boss.x-350;game.update(1);
assert.ok(game.boss,'Broca Titã deve entrar');
game.boss.x=game.boss.targetX;game.boss.entrance=0;game.boss.cool=-1;game.resolveCollisions();
assert.equal(game.boss.attackKind,'drill');
assert.equal(bossAnimationFrame(6,game.boss).col,1);
assert.equal(game.bullets.filter(b=>b.team==='enemy').length,0,'ataque exige aviso');
game.boss.attack=IMPACT_AT;game.resolveCollisions();
assert.equal(game.bullets.filter(b=>b.team==='enemy').length,3);
assert.deepEqual([bossAnimationFrame(6,game.boss).col,bossAnimationFrame(6,game.boss).row],[0,1]);
game.bullets=[];game.boss.attack=0;game.boss.cool=-1;game.resolveCollisions();
assert.equal(game.boss.attackKind,'quake');
game.boss.attack=IMPACT_AT;game.resolveCollisions();
assert.equal(game.bullets.filter(b=>b.sprite==='rocket').length,3);
assert.deepEqual([bossAnimationFrame(6,game.boss).col,bossAnimationFrame(6,game.boss).row],[1,1]);
game.bullets=[];game.bullets.push(new Bullet(game.boss.x,game.boss.y-95,0,0,'player',game.boss.hp+1));game.resolveCollisions();
assert.equal(game.boss.dead,true);assert.equal(game.currentObjective,3);
for(let i=0;i<75&&game.running;i++)game.update(1);
assert.equal(result?.win,true);assert.ok(save.completed.includes(6));assert.equal(save.unlocked,7);
clearTimeout(game.toastT);console.log('phase6-smoke: ok');
