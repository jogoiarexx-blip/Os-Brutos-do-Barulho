import assert from 'node:assert/strict';
import fase1 from '../fases/fase1.js';
import {Game} from '../js/game.js';
import {Bullet} from '../js/entities.js';

const nodes=new Map();
const node=()=>({
  classList:{add(){},remove(){},toggle(){}},style:{},textContent:'',innerHTML:'',
});
globalThis.document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)}};
globalThis.requestAnimationFrame=()=>0;

const input={down:()=>false,tap:()=>false,pollPad(){},end(){}};
const fx={coin(){},boom(){},hurt(){},shoot(){},tone(){}};
const canvas={getContext:()=>({}),animate(){}};
const saveData={
  upgrades:{health:0,damage:0,grenades:0,armor:0},settings:{screenShake:false},
  completed:[],coins:0,highScore:0,unlocked:1,lastMission:1,checkpoint:0,
};
let result=null;
const level={...fase1,enemies:[],destructibles:[],checkpoints:[]};
const game=new Game(canvas,input,fx,saveData,r=>{result=r});
game.start(level,'normal');
game.intro=0;

assert.equal(game.currentObjective,0,'a fase deve começar no objetivo do posto');
assert.ok(game.outpost&&!game.outpost.dead,'o posto avançado deve existir');

game.bullets.push(new Bullet(game.outpost.x,420,0,0,'player',game.outpost.hp+1));
game.resolveCollisions();
assert.equal(game.outpost.dead,true,'o posto deve ser destrutível');
assert.equal(game.currentObjective,1,'destruir o posto deve liberar o objetivo de resgate');

for(const hostage of game.hostages){game.player.x=hostage.x;game.update(1)}
assert.equal(game.hostages.filter(h=>h.rescued).length,3,'os três prisioneiros devem ser contados');
assert.equal(game.currentObjective,2,'três resgates devem liberar o chefe');

game.player.x=level.boss.x-340;game.update(1);
assert.ok(game.boss,'o chefe deve entrar somente após os resgates');
assert.ok(game.boss.entrance>0,'o trem deve ter uma entrada animada');
game.boss.entrance=0;
game.bullets.push(new Bullet(game.boss.x,game.boss.y-95,0,0,'player',game.boss.hp+1));
game.resolveCollisions();
assert.equal(game.boss.dead,true,'o trem deve poder ser destruído');
assert.equal(game.currentObjective,3,'a morte do chefe deve concluir os objetivos');

for(let i=0;i<75&&game.running;i++)game.update(1);
assert.equal(result?.win,true,'a fase deve terminar em vitória após a animação do chefe');
assert.equal(result?.rescued,3,'o resultado deve preservar os resgates reais');
clearTimeout(game.toastT);
console.log('phase1-smoke: ok');
