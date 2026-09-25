import assert from 'node:assert/strict';
import fase3 from '../fases/fase3.js';
import {Game} from '../js/game.js';
import {Bullet} from '../js/entities.js';

const nodes=new Map();
const node=()=>({classList:{add(){},remove(){},toggle(){}},style:{},textContent:'',innerHTML:''});
globalThis.document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)}};
globalThis.requestAnimationFrame=()=>0;
const input={down:()=>false,tap:()=>false,pollPad(){},end(){}};
const fx={coin(){},boom(){},hurt(){},shoot(){},tone(){}};
const canvas={getContext:()=>({}),animate(){}};
const saveData={upgrades:{health:0,damage:0,grenades:0,armor:0},settings:{screenShake:false},completed:[],coins:0,highScore:0,unlocked:3,lastMission:3,checkpoint:0};
let result=null;
const level={...fase3,enemies:[],checkpoints:[]};
const game=new Game(canvas,input,fx,saveData,r=>{result=r});
game.start(level,'normal');game.intro=0;

assert.ok(game.breach&&!game.breach.dead,'o portão da cidadela deve existir');
game.bullets.push(new Bullet(game.breach.x,410,0,0,'player',game.breach.hp+1));game.resolveCollisions();
assert.equal(game.breach.dead,true,'o portão deve ser destrutível');
assert.equal(game.currentObjective,1,'o portão deve liberar a emboscada');

game.player.x=level.ambush.x;game.update(1);
assert.equal(game.ambush.active,true,'a emboscada deve fechar a arena');
const targets=game.enemies.filter(e=>e.event==='ambush');
assert.equal(targets.length,level.ambush.required,'a tropa completa da emboscada deve aparecer');
game.player.x=level.ambush.right+200;game.update(1);assert.ok(game.player.x<=level.ambush.right,'a arena deve impedir a fuga');
for(const enemy of targets)if(!enemy.dead)game.kill(enemy);
assert.equal(game.ambush.kills,level.ambush.required,'somente a tropa marcada deve contar');
assert.equal(game.currentObjective,2,'vencer a emboscada deve liberar Voss');

game.player.x=level.boss.x-350;game.update(1);
assert.ok(game.boss&&game.boss.entrance>0,'Voss deve entrar na arena');
game.boss.entrance=0;
game.bullets.push(new Bullet(game.boss.x,game.boss.y-95,0,0,'player',game.boss.hp+1));game.resolveCollisions();
assert.equal(game.boss.dead,true,'General Voss deve ser derrotável');
assert.equal(game.currentObjective,3,'a derrota de Voss deve concluir a missão');
for(let i=0;i<75&&game.running;i++)game.update(1);
assert.equal(result?.win,true,'a fase 3 deve terminar em vitória');
clearTimeout(game.toastT);
console.log('phase3-smoke: ok');
