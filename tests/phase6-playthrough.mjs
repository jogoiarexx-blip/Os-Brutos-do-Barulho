import assert from 'node:assert/strict';
import level from '../fases/fase6.js';
import {Game} from '../js/game.js';
import {applyCharacter} from '../js/characters.js';

const nodes=new Map(),node=()=>({classList:{add(){},remove(){},toggle(){}},style:{},textContent:'',innerHTML:''});
globalThis.document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)}};
globalThis.requestAnimationFrame=()=>0;
let direction=0;
const input={down(...keys){return keys.includes('KeyZ')||direction>0&&keys.some(k=>k==='ArrowRight'||k==='KeyD')||direction<0&&keys.some(k=>k==='ArrowLeft'||k==='KeyA')},tap(){return false},pollPad(){},end(){}};
const fx={coin(){},boom(){},hurt(){},shoot(){},tone(){}};
const save={upgrades:{health:3,damage:4,grenades:0,armor:3},settings:{screenShake:false},completed:[1,2,3,4,5],coins:0,highScore:0,unlocked:6,lastMission:6,checkpoint:0};
let result=null;
const game=new Game({getContext:()=>({}),animate(){}},input,fx,save,r=>result=r);
game.start(level,'easy');applyCharacter(game.player,'brutus');game.intro=0;
const events=[];let previous=0;
for(let tick=0;tick<11000&&game.running;tick++){
  const p=game.player;
  if(game.currentObjective===0){const lift=game.lifts.find(l=>!l.dead);direction=lift&&p.x<lift.x-240?1:0}
  else if(game.currentObjective===1){
    const cage=game.cages.find(c=>!game.hostages.find(h=>h.x===c.x)?.rescued);
    direction=cage&&p.x<(cage.open?cage.x:cage.x-230)?1:0;
  }else direction=p.x<level.boss.x-270?1:0;
  game.update(1);
  if(game.currentObjective!==previous){events.push({tick,objective:game.currentObjective,x:Math.round(p.x),rescued:game.hostages.filter(h=>h.rescued).length});previous=game.currentObjective}
}
clearTimeout(game.toastT);
assert.equal(result?.win,true,'a fase 6 deve terminar com uma vitória jogável');
assert.equal(game.currentObjective,3);assert.equal(game.lifts.filter(l=>l.dead).length,3);
assert.equal(game.cages.filter(c=>c.open).length,3);assert.equal(result.rescued,3);
assert.equal(game.boss.hp,0);
console.log(JSON.stringify({events,result,hp:Math.round(game.player.hp),bossHp:game.boss.hp}));
