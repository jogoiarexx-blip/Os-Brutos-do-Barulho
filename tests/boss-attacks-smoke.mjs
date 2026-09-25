import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../js/game.js';
import {bossAnimationFrame,IMPACT_AT} from '../js/boss-animations.js';
import {atlases,drawAtlas} from '../js/sprites.js';
import levels from '../fases/index.js';

const nodes=new Map();
const node=()=>({classList:{add(){},remove(){},toggle(){}},style:{},textContent:'',innerHTML:''});
globalThis.document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)}};
globalThis.requestAnimationFrame=()=>0;
const input={down:()=>false,tap:()=>false,pollPad(){},end(){}};
const fx={coin(){},boom(){},hurt(){},shoot(){},tone(){}};
const canvas={getContext:()=>({}),animate(){}};

// Confere dimensões e transparência real da nova folha (2x2 células iguais).
const asset=readFileSync(new URL('../assets/bosses/steel-scorpion-attack-atlas.webp',import.meta.url));
assert.equal(asset.toString('ascii',0,4),'RIFF');
assert.equal(asset.toString('ascii',8,12),'WEBP');
assert.equal(asset.toString('ascii',12,16),'VP8X');
assert.ok(asset[20]&0x10,'atlas deve manter canal alfa transparente');
assert.equal(asset.readUIntLE(24,3)+1,1000);
assert.equal(asset.readUIntLE(27,3)+1,666);
assert.ok(asset.length>10000,'atlas não pode ser um arquivo vazio');

for(const id of[1,2,3,4]){
  const level={...levels[id-1],enemies:[],checkpoints:[],hostages:[]};
  const save={upgrades:{health:0,damage:0,grenades:0,armor:0},settings:{screenShake:false},completed:[],coins:0,highScore:0,unlocked:id,lastMission:id,checkpoint:0};
  const game=new Game(canvas,input,fx,save,()=>{});
  game.start(level);game.intro=0;game.currentObjective=2;game.spawnBoss();
  game.boss.x=game.boss.targetX;game.boss.entrance=0;game.boss.cool=-1;
  game.resolveCollisions();
  const warmup=bossAnimationFrame(id,game.boss);
  assert.equal(warmup.col,1,`chefe ${id}: quadro de preparo`);
  assert.equal(warmup.row,0);
  assert.equal(game.bullets.length,0,`chefe ${id}: não dispara antes da animação`);
  game.boss.attack=IMPACT_AT+1;game.resolveCollisions();
  assert.equal(game.bullets.length,0,`chefe ${id}: espera até o impacto`);
  game.boss.attack=IMPACT_AT;game.resolveCollisions();
  const strike=bossAnimationFrame(id,game.boss);
  assert.ok(strike.col!==warmup.col||strike.row!==warmup.row,`chefe ${id}: quadro do disparo diferente`);
  assert.ok(game.bullets.length>0,`chefe ${id}: projétil sincronizado com o quadro`);
  const fired=game.bullets.length;game.resolveCollisions();
  assert.equal(game.bullets.length,fired,`chefe ${id}: não dispara duas vezes no mesmo golpe`);
  const atlas=atlases[strike.atlas];atlas.complete=true;atlas.naturalWidth=strike.cols*100;atlas.naturalHeight=strike.rows*100;
  const calls=[];assert.equal(drawAtlas({drawImage(...args){calls.push(args)}},strike.atlas,strike.col,strike.row,strike.cols,strike.rows,0,0,strike.w,strike.h),true);
  assert.equal(calls[0][1],strike.col*100,`chefe ${id}: recorte correto da coluna`);
  assert.equal(calls[0][2],strike.row*100,`chefe ${id}: recorte correto da linha`);
  game.boss.attack=4;game.boss.hit=0;
  const recovery=bossAnimationFrame(id,game.boss);
  assert.ok(recovery.col!==strike.col||recovery.row!==strike.row,`chefe ${id}: quadro de recuperação`);
  clearTimeout(game.toastT);game.running=false;
}

// Voss troca o canhão pela espada no golpe baixo; o Escorpião golpeia com a garra.
const sample={anim:0,hp:50,max:100,hit:0,dead:false,death:0,attack:IMPACT_AT,attackKind:'low'};
assert.deepEqual([bossAnimationFrame(3,sample).row,bossAnimationFrame(3,sample).col],[1,0]);
sample.attackKind='claw';assert.deepEqual([bossAnimationFrame(4,sample).row,bossAnimationFrame(4,sample).col],[1,1]);
sample.attackKind='sting';assert.deepEqual([bossAnimationFrame(4,sample).row,bossAnimationFrame(4,sample).col],[1,0]);
console.log('boss-attacks-smoke: ok (chefes 1–4)');
