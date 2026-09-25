import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import fase5 from '../fases/fase5.js';
import {Game} from '../js/game.js';
import {Bullet} from '../js/entities.js';
import {bossAnimationFrame,IMPACT_AT} from '../js/boss-animations.js';

for(const assetName of['../assets/bosses/goliath-attack-atlas.webp','../assets/levels/death-canyon/props-atlas.webp']){
  const asset=readFileSync(new URL(assetName,import.meta.url));
  assert.equal(asset.toString('ascii',0,4),'RIFF');
  assert.equal(asset.toString('ascii',8,12),'WEBP');
  assert.equal(asset.toString('ascii',12,16),'VP8X');
  assert.ok(asset[20]&0x10,`${assetName}: transparência obrigatória`);
}
const bossAsset=readFileSync(new URL('../assets/bosses/goliath-attack-atlas.webp',import.meta.url));
assert.equal(bossAsset.readUIntLE(24,3)+1,1000);
assert.equal(bossAsset.readUIntLE(27,3)+1,666);

const nodes=new Map();
const node=()=>({classList:{add(){},remove(){},toggle(){}},style:{},textContent:'',innerHTML:''});
globalThis.document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)}};
globalThis.requestAnimationFrame=()=>0;
const input={down:()=>false,tap:()=>false,pollPad(){},end(){}};
const fx={coin(){},boom(){},hurt(){},shoot(){},tone(){}};
const canvas={getContext:()=>({}),animate(){}};
const save={upgrades:{health:0,damage:0,grenades:0,armor:0},settings:{screenShake:false},completed:[],coins:0,highScore:0,unlocked:5,lastMission:5,checkpoint:0};
let result=null;
const level={...fase5,enemies:[],checkpoints:[],hostages:[]};
const game=new Game(canvas,input,fx,save,r=>result=r);
game.start(level);game.intro=0;

game.player.x=level.nestGate+150;game.update(1);
assert.ok(game.player.x<=level.nestGate,'ninhos armados bloqueiam a passagem');
for(const nest of game.nests){
  game.bullets.push(new Bullet(nest.x,460,0,0,'player',nest.hp+1));game.resolveCollisions();
}
assert.equal(game.nests.filter(n=>n.dead).length,3);
assert.equal(game.currentObjective,1,'três ninhos destruídos liberam a escolta');

game.player.x=level.ally.start;game.update(1);
assert.equal(game.ally.active,true,'demolidores devem entrar na missão');
const hp=game.ally.hp;
game.player.x=game.ally.x+180;
game.bullets.push(new Bullet(game.ally.x,game.ally.y-32,0,0,'enemy',15));game.resolveCollisions();
assert.ok(game.ally.hp<hp,'demolidores devem receber dano');
game.player.x=game.ally.x+900;game.update(1);
assert.ok(game.player.x<=game.ally.x+390,'jogador não pode abandonar a escolta');
game.ally.x=game.ally.end-3;game.player.x=game.ally.end+120;game.update(1);game.update(1);
assert.equal(game.ally.complete,true);
assert.equal(game.currentObjective,2,'escolta viva libera a arena');

game.player.x=level.boss.x-350;game.update(1);
assert.ok(game.boss,'Goliath deve aparecer na arena');
game.boss.x=game.boss.targetX;game.boss.entrance=0;game.boss.cool=-1;game.resolveCollisions();
assert.equal(game.boss.attackKind,'cannon');
assert.deepEqual([bossAnimationFrame(5,game.boss).col,bossAnimationFrame(5,game.boss).row],[1,0]);
assert.equal(game.bullets.filter(b=>b.team==='enemy').length,0,'canhão precisa de aviso');
game.boss.attack=IMPACT_AT;game.resolveCollisions();
assert.deepEqual([bossAnimationFrame(5,game.boss).col,bossAnimationFrame(5,game.boss).row],[0,1]);
assert.equal(game.bullets.filter(b=>b.team==='enemy').length,3);
game.bullets=[];game.boss.attack=0;game.boss.cool=-1;game.resolveCollisions();
assert.equal(game.boss.attackKind,'missiles');
game.boss.attack=IMPACT_AT;game.resolveCollisions();
assert.deepEqual([bossAnimationFrame(5,game.boss).col,bossAnimationFrame(5,game.boss).row],[1,1]);
assert.equal(game.bullets.filter(b=>b.sprite==='rocket').length,3);

game.bullets=[];game.bullets.push(new Bullet(game.boss.x,game.boss.y-95,0,0,'player',game.boss.hp+1));game.resolveCollisions();
assert.equal(game.boss.dead,true);
assert.equal(game.currentObjective,3);
for(let i=0;i<75&&game.running;i++)game.update(1);
assert.equal(result?.win,true);
assert.ok(save.completed.includes(5));
assert.equal(save.unlocked,6);
clearTimeout(game.toastT);
console.log('phase5-smoke: ok');
