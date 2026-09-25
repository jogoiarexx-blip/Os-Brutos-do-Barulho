import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import level from '../fases/fase7.js';
import {Game} from '../js/game.js';
import {Bullet} from '../js/entities.js';
import {bossAnimationFrame,IMPACT_AT} from '../js/boss-animations.js';

for(const name of ['../assets/bosses/toxic-leviathan-attack-atlas.webp','../assets/levels/toxic-swamp/props-atlas.webp']){
  const d=readFileSync(new URL(name,import.meta.url));assert.equal(d.toString('ascii',0,4),'RIFF');
  assert.equal(d.toString('ascii',8,12),'WEBP');assert.ok(d[20]&0x10,`${name}: atlas transparente`);
  assert.equal(d.readUIntLE(24,3)+1,1000);assert.equal(d.readUIntLE(27,3)+1,666);
}
const nodes=new Map(),node=()=>({classList:{add(){},remove(){},toggle(){}},style:{},textContent:'',innerHTML:''});
globalThis.document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)}};
globalThis.requestAnimationFrame=()=>0;
const input={down:()=>false,tap:()=>false,pollPad(){},end(){}},fx={coin(){},boom(){},hurt(){},shoot(){},tone(){}};
const save={upgrades:{health:0,damage:0,grenades:0,armor:0},settings:{screenShake:false},completed:[],coins:0,highScore:0,unlocked:7,lastMission:7,checkpoint:0};
let result=null;
const game=new Game({getContext:()=>({}),animate(){}},input,fx,save,r=>result=r);
game.start({...level,enemies:[],checkpoints:[],hostages:[]});game.intro=0;

game.player.x=level.maskGate+100;game.update(1);assert.ok(game.player.x<=level.maskGate);
game.player.x=level.poison[0];game.player.inv=0;game.poisonTime=64;
let hp=game.player.hp;game.update(1);assert.equal(hp-game.player.hp,10,'gás sem filtro deve causar dano');
for(const mask of game.masks){game.player.x=mask.x;game.update(1);assert.equal(mask.collected,true)}
assert.equal(game.currentObjective,1);
game.player.x=level.poison[0];game.player.inv=0;game.poisonTime=64;
hp=game.player.hp;game.update(1);assert.equal(hp-game.player.hp,4,'três filtros devem reduzir o dano do gás');
game.player.x=level.pumpGate+100;game.update(1);assert.ok(game.player.x<=level.pumpGate);
for(const pump of game.pumps){game.bullets.push(new Bullet(pump.x,458,0,0,'player',pump.hp+1));game.resolveCollisions()}
assert.equal(game.currentObjective,2);
game.player.x=level.boss.x-350;game.update(1);assert.ok(game.boss);
game.boss.x=game.boss.targetX;game.boss.entrance=0;game.boss.cool=-1;game.resolveCollisions();
assert.equal(game.boss.attackKind,'venom');assert.equal(bossAnimationFrame(7,game.boss).col,1);
assert.equal(game.bullets.filter(b=>b.team==='enemy').length,0,'pose antes do disparo');
game.boss.attack=IMPACT_AT;game.resolveCollisions();
assert.equal(game.bullets.filter(b=>b.team==='enemy').length,3);
assert.deepEqual([bossAnimationFrame(7,game.boss).col,bossAnimationFrame(7,game.boss).row],[0,1]);
game.bullets=[];game.boss.attack=0;game.boss.cool=-1;game.resolveCollisions();
assert.equal(game.boss.attackKind,'surge');game.boss.attack=IMPACT_AT;game.resolveCollisions();
assert.equal(game.bullets.filter(b=>b.team==='enemy').length,3);
assert.deepEqual([bossAnimationFrame(7,game.boss).col,bossAnimationFrame(7,game.boss).row],[1,1]);
game.bullets=[];game.bullets.push(new Bullet(game.boss.x,game.boss.y-95,0,0,'player',game.boss.hp+1));game.resolveCollisions();
assert.equal(game.boss.dead,true);assert.equal(game.currentObjective,3);
for(let i=0;i<75&&game.running;i++)game.update(1);
assert.equal(result?.win,true);assert.ok(save.completed.includes(7));assert.equal(save.unlocked,8);
clearTimeout(game.toastT);console.log('phase7-smoke: ok');
