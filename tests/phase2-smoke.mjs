import assert from 'node:assert/strict';
import fase2 from '../fases/fase2.js';
import {Game} from '../js/game.js';
import {Bullet} from '../js/entities.js';

const nodes=new Map();
const node=()=>({classList:{add(){},remove(){},toggle(){}},style:{},textContent:'',innerHTML:''});
globalThis.document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)}};
globalThis.requestAnimationFrame=()=>0;

const input={down:()=>false,tap:()=>false,pollPad(){},end(){}};
const fx={coin(){},boom(){},hurt(){},shoot(){},tone(){}};
const canvas={getContext:()=>({}),animate(){}};
const saveData={upgrades:{health:0,damage:0,grenades:0,armor:0},settings:{screenShake:false},completed:[],coins:0,highScore:0,unlocked:2,lastMission:2,checkpoint:0};
let result=null;
const level={...fase2,enemies:[],checkpoints:[]};
const game=new Game(canvas,input,fx,saveData,r=>{result=r});
game.start(level,'normal');game.intro=0;

assert.equal(game.radios.length,3,'a fase deve criar três torres');
assert.equal(game.currentObjective,0,'a missão começa nas torres');
for(const radio of game.radios){game.bullets.push(new Bullet(radio.x,410,0,0,'player',radio.hp+1));game.resolveCollisions()}
assert.ok(game.radios.every(r=>r.dead),'as três torres devem ser destrutíveis');
assert.equal(game.currentObjective,1,'as torres devem liberar a escolta');

game.player.x=level.ally.start;game.update(1);
assert.equal(game.ally.active,true,'o aliado deve entrar na escolta');
const hp=game.ally.hp;game.hurtAlly(20);assert.ok(game.ally.hp<hp,'o aliado deve receber dano real');
game.ally.inv=0;
for(let i=0;i<900&&game.currentObjective===1;i++){game.player.x=game.ally.x+380;game.update(1)}
assert.equal(game.ally.complete,true,'o aliado deve alcançar o laboratório');
assert.equal(game.currentObjective,2,'a escolta deve liberar o chefe');

game.player.x=level.boss.x-350;game.update(1);
assert.ok(game.boss&&game.boss.entrance>0,'o Mamute deve entrar animado');
game.boss.entrance=0;
game.bullets.push(new Bullet(game.boss.x,game.boss.y-95,0,0,'player',game.boss.hp+1));game.resolveCollisions();
assert.equal(game.boss.dead,true,'o Mamute Ômega deve ser destrutível');
assert.equal(game.currentObjective,3,'o chefe deve concluir a missão');
for(let i=0;i<75&&game.running;i++)game.update(1);
assert.equal(result?.win,true,'a fase 2 deve terminar em vitória');
clearTimeout(game.toastT);
console.log('phase2-smoke: ok');
