import assert from 'node:assert/strict';
import level from '../fases/fase5.js';
import {Game} from '../js/game.js';
import {applyCharacter} from '../js/characters.js';

const nodes=new Map();
const node=()=>({classList:{add(){},remove(){},toggle(){}},style:{},textContent:'',innerHTML:''});
globalThis.document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)}};
globalThis.requestAnimationFrame=()=>0;
let move=0;
const input={down(...codes){return codes.includes('KeyZ')||move>0&&codes.some(x=>x==='ArrowRight'||x==='KeyD')||move<0&&codes.some(x=>x==='ArrowLeft'||x==='KeyA')},tap(){return false},pollPad(){},end(){}};
const fx={coin(){},boom(){},hurt(){},shoot(){},tone(){}};
const canvas={getContext:()=>({}),animate(){}};
const save={upgrades:{health:3,damage:4,grenades:0,armor:3},settings:{screenShake:false},completed:[1,2,3,4],coins:0,highScore:0,unlocked:5,lastMission:5,checkpoint:0};
let result=null;
const game=new Game(canvas,input,fx,save,r=>result=r);
game.start(level,'easy');applyCharacter(game.player,'brutus');game.intro=0;
const events=[];let previousObjective=0,previousDeaths=0;
for(let frame=0;frame<10000&&game.running;frame++){
  const p=game.player;
  if(game.currentObjective===0){
    const nest=game.nests.find(n=>!n.dead);
    move=nest&&p.x<nest.x-245?1:0;
  }else if(game.currentObjective===1){
    // Fica à frente dos demolidores, sem pular a seção de escolta.
    const target=game.ally.x+245;
    move=p.x<target-15?1:p.x>target+15?-1:0;
  }else move=p.x<game.level.boss.x-275?1:0;
  game.update(1);
  if(game.currentObjective!==previousObjective){events.push({frame,objective:game.currentObjective,x:Math.round(p.x),allyHp:Math.round(game.ally.hp)});previousObjective=game.currentObjective}
  if(game.checkpoint>previousDeaths&&p.hp<p.maxHp*.65){events.push({frame,checkpoint:game.checkpoint,hp:Math.round(p.hp)});previousDeaths=game.checkpoint}
}
clearTimeout(game.toastT);
console.log(JSON.stringify({events,result,playerX:Math.round(game.player.x),hp:Math.round(game.player.hp),allyHp:Math.round(game.ally.hp),nests:game.nests.map(n=>n.hp),bossHp:game.boss?.hp},null,2));
assert.equal(result?.win,true,'a partida inteira deve terminar em vitória');
assert.equal(game.currentObjective,3);
assert.ok(game.ally.hp>0);
