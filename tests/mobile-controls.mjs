import assert from 'node:assert/strict';
import {Input} from '../js/input.js';

const globalEvents=new Map(),buttons=new Map();
const button=key=>({dataset:{key},events:new Map(),addEventListener(type,fn){this.events.set(type,fn)},setPointerCapture(){}});
for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ShiftLeft','KeyZ','KeyX','KeyC','Escape'])buttons.set(key,button(key));
globalThis.addEventListener=(name,fn)=>globalEvents.set(name,fn);
let hovered=null;
globalThis.document={querySelectorAll:()=>[...buttons.values()],elementFromPoint:()=>hovered};
Object.defineProperty(globalThis,'navigator',{value:{getGamepads:()=>[]},configurable:true});
const input=new Input();
const fire=(key,type,id)=>buttons.get(key).events.get(type)({pointerId:id,clientX:0,clientY:0,preventDefault(){}});

fire('ArrowRight','pointerdown',1);fire('KeyZ','pointerdown',2);
assert.equal(input.down('ArrowRight'),true);assert.equal(input.down('KeyZ'),true,'multitoque deve andar e atirar');
assert.equal(input.tap('KeyZ'),true);input.end();assert.equal(input.down('KeyZ'),true,'tiro deve permanecer pressionado');
hovered={closest:()=>buttons.get('ArrowLeft')};fire('ArrowRight','pointermove',1);
assert.equal(input.down('ArrowRight'),false);assert.equal(input.down('ArrowLeft'),true,'arrastar deve trocar direção');
fire('ArrowRight','pointercancel',1);assert.equal(input.down('ArrowLeft'),false,'cancelamento deve liberar direção');
fire('KeyZ','lostpointercapture',2);assert.equal(input.down('KeyZ'),false,'perda de captura deve liberar tiro');
fire('ArrowUp','pointerdown',3);fire('ArrowUp','pointerup',3);
assert.equal(input.tap('ArrowUp'),true,'toque breve deve produzir pulo');
fire('Escape','pointerdown',4);assert.equal(input.tap('Escape'),true,'pausa deve funcionar no toque');fire('Escape','pointerup',4);
fire('ArrowRight','pointerdown',5);globalEvents.get('blur')();assert.equal(input.down('ArrowRight'),false);
console.log('mobile-controls: ok');
