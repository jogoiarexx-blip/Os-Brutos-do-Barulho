import assert from 'node:assert/strict';
import level from '../fases/fase7.js';
import {Game} from '../js/game.js';
import {applyCharacter} from '../js/characters.js';

const nodes=new Map(),node=()=>({classList:{add(){},remove(){},toggle(){}},style:{},textContent:'',innerHTML:''});
globalThis.document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)}};
globalThis.requestAnimationFrame=()=>0;
let move=0;
const input={down(...keys){return keys.includes('KeyZ')||move>0&&keys.some(k=>k==='ArrowRight'||k==='KeyD')||move<0&&keys.some(k=>k==='ArrowLeft'||k==='KeyA')},tap(){return false},pollPad(){},end(){}};
const fx={coin(){},boom(){},hurt(){},shoot(){},tone(){}};
const save={upgrades:{health:3,damage:4,grenades:0,armor:3},settings:{screenShake:false},completed:[1,2,3,4,5,6],coins:0,highScore:0,unlocked:7,lastMission:7,checkpoint:0};
let result=null;
const game=new Game({getContext:()=>({}),animate(){}},input,fx,save,r=>result=r);
game.start(level,'easy');applyCharacter(game.player,'brutus');game.intro=0;
const events=[];let previous=0;
for(let tick=0;tick<11000&&game.running;tick++){
  const p=game.player;
  if(game.currentObjective===0){const mask=game.masks.find(m=>!m.collected);move=mask&&p.x<mask.x?1:0}
  else if(game.currentObjective===1){const pump=game.pumps.find(x=>!x.dead);move=pump&&p.x<pump.x-235?1:0}
  else move=p.x<level.boss.x-270?1:0;
  game.update(1);
  if(game.currentObjective!==previous){events.push({tick,objective:game.currentObjective,x:Math.round(p.x),masks:game.masks.filter(m=>m.collected).length,pumps:game.pumps.filter(x=>x.dead).length});previous=game.currentObjective}
}
clearTimeout(game.toastT);
assert.equal(result?.win,true,'a fase 7 deve terminar em vitória jogável');
assert.equal(game.currentObjective,3);assert.equal(game.masks.filter(m=>m.collected).length,3);
assert.equal(game.pumps.filter(p=>p.dead).length,3);assert.equal(game.boss.hp,0);
console.log(JSON.stringify({events,result,hp:Math.round(game.player.hp),bossHp:game.boss.hp}));
