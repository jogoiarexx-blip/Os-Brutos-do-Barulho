import assert from 'node:assert/strict';
import fase4 from '../fases/fase4.js';
import {Game} from '../js/game.js';
import {Bullet} from '../js/entities.js';

const nodes=new Map();
const node=()=>({classList:{add(){},remove(){},toggle(){}},style:{},textContent:'',innerHTML:''});
globalThis.document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)}};
globalThis.requestAnimationFrame=()=>0;
const input={down:()=>false,tap:()=>false,pollPad(){},end(){}};
const fx={coin(){},boom(){},hurt(){},shoot(){},tone(){}};
const canvas={getContext:()=>({}),animate(){}};
const saveData={upgrades:{health:0,damage:0,grenades:0,armor:0},settings:{screenShake:false},completed:[],coins:0,highScore:0,unlocked:4,lastMission:4,checkpoint:0};
let result=null;
const level={...fase4,enemies:[],checkpoints:[],hostages:[]};
const game=new Game(canvas,input,fx,saveData,r=>{result=r});
game.start(level);game.intro=0;

game.player.x=level.depotGate+250;game.update(1);
assert.ok(game.player.x<=level.depotGate,'não pode atravessar o setor sem sabotar os depósitos');
for(const depot of game.depots){
  game.bullets.push(new Bullet(depot.x,450,0,0,'player',depot.hp+1));game.resolveCollisions();
}
assert.equal(game.depots.filter(d=>d.dead).length,3);
assert.equal(game.currentObjective,1,'três depósitos devem liberar o comboio');

game.player.x=game.convoy.x+100;game.update(1);
assert.ok(game.player.x<=game.convoy.x-185,'comboio armado bloqueia a passagem');
game.bullets.push(new Bullet(game.convoy.x,465,0,0,'player',game.convoy.hp+1));game.resolveCollisions();
assert.equal(game.convoy.disabled,true,'comboio precisa ser imobilizado');
assert.equal(game.currentObjective,1,'danificar comboio não equivale a capturá-lo');
game.player.x=game.convoy.x-110;game.update(1);
assert.equal(game.convoy.captured,true);
assert.equal(game.currentObjective,2,'aproximação captura o comboio');

game.player.x=level.boss.x-350;game.update(1);
assert.ok(game.boss,'Escorpião de Aço deve chegar à arena');
game.boss.entrance=0;game.boss.cool=-1;game.resolveCollisions();
assert.equal(game.boss.pattern,1,'o primeiro padrão do chefe deve disparar o ferrão');
assert.ok(game.bullets.some(b=>b.team==='enemy'&&b.color==='#5af3ff'));
game.bullets=[];game.boss.cool=-1;game.resolveCollisions();
game.bullets=[];game.boss.cool=-1;game.resolveCollisions();
assert.ok(game.bullets.some(b=>b.team==='enemy'&&b.color==='#ffbc4a'),'terceiro padrão deve disparar a garra rasteira');
game.bullets=[];
game.bullets.push(new Bullet(game.boss.x,game.boss.y-95,0,0,'player',game.boss.hp+1));game.resolveCollisions();
assert.equal(game.boss.dead,true);
assert.equal(game.currentObjective,3);
for(let i=0;i<75&&game.running;i++)game.update(1);
assert.equal(result?.win,true,'fase 4 deve liberar vitória');
assert.ok(saveData.completed.includes(4));
assert.equal(saveData.unlocked,5);
clearTimeout(game.toastT);
console.log('phase4-smoke: ok');
