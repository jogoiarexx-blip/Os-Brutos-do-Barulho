import levels from '../fases/index.js';
import {Input} from './input.js';
import {AudioFX} from './audio.js';
import {Game} from './game.js';
import {load,save} from './storage.js';
import {ROSTER,applyCharacter} from './characters.js';

const canvas=document.querySelector('#game');
const menu=document.querySelector('#menu');
const modal=document.querySelector('#modal');
const input=new Input();
const fx=new AudioFX();
let data=load();
const game=new Game(canvas,input,fx,data,endScreen);
const chapters=['LINHA DE FRENTE','TERRAS SELVAGENS','GUERRA TOTAL','CÍRCULO DE FOGO','QUEDA DO IMPÉRIO'];

function syncCharacters(){
  data.characters||={unlocked:['brutus','nina'],cleared:[],progress:{brutus:1,nina:1}};
  data.characters.unlocked||=['brutus','nina'];data.characters.cleared||=[];data.characters.progress||={brutus:1,nina:1};
  const has=id=>data.characters.cleared.includes(id);
  if(has('brutus')&&has('nina'))for(const id of ['zeca','maya'])if(!data.characters.unlocked.includes(id))data.characters.unlocked.push(id);
  if(has('zeca')&&has('maya'))for(const id of ['tiao','luna'])if(!data.characters.unlocked.includes(id))data.characters.unlocked.push(id);
  for(const id of data.characters.unlocked)if(!data.characters.progress[id])data.characters.progress[id]=1;
  if(!data.characters.unlocked.includes(data.selectedCharacter))data.selectedCharacter='brutus';
}
syncCharacters();

function background(){
  if(game.running)return;
  const c=canvas.getContext('2d'),g=c.createLinearGradient(0,0,0,720);
  g.addColorStop(0,'#121d2b');g.addColorStop(1,'#5f302c');c.fillStyle=g;c.fillRect(0,0,1280,720);
  c.fillStyle='#07090dcc';for(let i=0;i<18;i++)c.fillRect(i*90,350-(i*31)%180,65,380);
  c.fillStyle='#ff9d2118';c.beginPath();c.arc(920,250,220,0,7);c.fill();
}
background();
function show(html){modal.innerHTML=html;modal.classList.remove('hidden');menu.classList.add('hidden')}
function back(){game.running=false;input.resetTouch();document.querySelector('#touch').classList.remove('playing');modal.classList.add('hidden');menu.classList.remove('hidden');document.querySelector('#hud').classList.add('hidden');background()}
function startMission(id){
  game.start(levels[Math.max(0,Math.min(levels.length-1,id-1))],data.settings.difficulty);
  applyCharacter(game.player,data.selectedCharacter);
}
function selectCharacter(next=null){
  syncCharacters();
  show(`<h2>ESCOLHA SEU BRUTUS</h2><p>Herói atual: <b>${ROSTER.find(x=>x.id===data.selectedCharacter)?.name}</b></p><div class="cardgrid roster">${ROSTER.map(h=>{const open=data.characters.unlocked.includes(h.id),done=data.characters.cleared.includes(h.id);const rule=h.tier===2?'Zere com Brutus e Nina':h.tier===3?'Zere com Zeca e Maya':'';return `<button class="card hero-card ${open?'':'locked'}" data-hero="${h.id}" ${open?'':'disabled'} style="border-color:${open?h.color:'#555'}">${open?`<img class="portrait" src="assets/players/${h.id}/portrait.webp" alt="Rosto de ${h.name}">`:'<span class="locked-face">🔒</span>'}<b style="color:${h.accent}">${open?h.name:'PERSONAGEM'}</b><p>${open?h.title:rule}</p><small>${open?h.perk:''}${done?' · CAMPANHA CONCLUÍDA ✓':''}</small></button>`}).join('')}</div><div class="buttons"><button data-back>VOLTAR</button></div>`);
  modal.querySelectorAll('[data-hero]').forEach(b=>b.onclick=()=>{data.selectedCharacter=b.dataset.hero;save(data);if(next)next();else selectCharacter()});
  modal.querySelector('[data-back]').onclick=back;
}
function difficulty(next){
  show(`<h2>DIFICULDADE</h2><div class="buttons">${[['easy','RECRUTA','Mais vida e menos dano'],['normal','SOLDADO','Experiência equilibrada'],['veteran','VETERANO','Inimigos resistentes'],['hardcore','COMANDO','Sem piedade']].map(x=>`<button data-diff="${x[0]}">${x[1]}<small><br>${x[2]}</small></button>`).join('')}<button data-back>VOLTAR</button></div>`);
  modal.querySelectorAll('[data-diff]').forEach(b=>b.onclick=()=>{data.settings.difficulty=b.dataset.diff;save(data);next()});
  modal.querySelector('[data-back]').onclick=back;
}
function selectMission(){
  let body='<h2>CAMPANHA · 20 MISSÕES</h2>';
  const characterProgress=data.characters.progress[data.selectedCharacter]||1;
  for(let chapter=1;chapter<=5;chapter++){
    const group=levels.filter(l=>Math.ceil(l.id/4)===chapter);
    body+=`<h3>CAPÍTULO ${chapter} · ${chapters[chapter-1]}</h3><div class="cardgrid">${group.map(l=>`<button class="card ${l.id>characterProgress?'locked':''}" data-mission="${l.id}" ${l.id>characterProgress?'disabled':''}><b>MISSÃO ${l.id}</b><p>${l.name}</p><small>${l.id>characterProgress?'BLOQUEADA PARA ESTE PERSONAGEM':l.subtitle}</small></button>`).join('')}</div>`;
  }
  show(body+'<div class="buttons"><button data-back>VOLTAR</button></div>');
  modal.querySelectorAll('[data-mission]').forEach(b=>b.onclick=()=>difficulty(()=>startMission(+b.dataset.mission)));
  modal.querySelector('[data-back]').onclick=back;
}
function armory(){
  const defs={health:['COLETE MÉDICO','+20 HP máximo'],damage:['MUNIÇÃO AP','+18% de dano'],grenades:['CINTO TÁTICO','+1 granada'],armor:['BLINDAGEM','-8% dano recebido']};
  show(`<h2>ARSENAL</h2><p>CRÉDITOS: <b>${data.coins}</b></p><div class="cardgrid">${Object.entries(defs).map(([k,v])=>{const n=data.upgrades[k],cost=(n+1)*150;return `<button class="card" data-up="${k}" ${n>=5?'disabled':''}><b>${v[0]} ${n}/5</b><p>${v[1]}</p><small>${n>=5?'MÁXIMO':cost+' CRÉDITOS'}</small></button>`}).join('')}</div><div class="buttons"><button data-back>VOLTAR</button></div>`);
  modal.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const k=b.dataset.up,cost=(data.upgrades[k]+1)*150;if(data.coins>=cost&&data.upgrades[k]<5){data.coins-=cost;data.upgrades[k]++;save(data);armory()}});
  modal.querySelector('[data-back]').onclick=back;
}
function how(){
  show(`<h2>COMO JOGAR</h2><div class="cardgrid"><div class="card"><b>MOVIMENTO</b><p>A/D ou ← →: caminhar<br>Shift: correr<br>W / ↑ / Espaço: pular<br>S / ↓: agachar</p></div><div class="card"><b>COMBATE</b><p>Z/J: atirar<br>X/K: granada<br>C: esquiva</p></div><div class="card"><b>CELULAR</b><p>Na esquerda: andar, correr e agachar. Na direita: pular, esquivar, granada e tiro. Segure o tiro e mova ao mesmo tempo. Pausa no canto superior.</p></div><div class="card"><b>GAMEPAD</b><p>Analógico/D-pad, A atira, B granada, X esquiva e Start pausa.</p></div></div><div class="buttons"><button data-back>VOLTAR</button></div>`);
  modal.querySelector('[data-back]').onclick=back;
}
function endScreen(r){
  if(r.win){
    const next=Math.min(levels.length,game.level.id+1);
    data.unlocked=Math.max(data.unlocked,next);
    data.lastMission=game.level.id<levels.length?game.level.id+1:1;
    const current=data.characters.progress[data.selectedCharacter]||1;
    if(game.level.id<=current)data.characters.progress[data.selectedCharacter]=Math.min(levels.length,Math.max(current,game.level.id+1));
  }
  save(data);input.resetTouch();document.querySelector('#hud').classList.add('hidden');document.querySelector('#touch').classList.remove('playing');
  const campaignDone=r.win&&game.level.id===levels.length&&(data.characters.progress[data.selectedCharacter]||1)>=levels.length;
  let unlockMessage='';
  if(campaignDone){
    if(!data.characters.cleared.includes(data.selectedCharacter))data.characters.cleared.push(data.selectedCharacter);
    const before=data.characters.unlocked.length;syncCharacters();
    if(data.characters.unlocked.length>before){const novos=ROSTER.filter(h=>data.characters.unlocked.includes(h.id)&&h.tier>1&&!data.characters.cleared.includes(h.id)).slice(-2).map(h=>h.name).join(' E ');unlockMessage=`<p><b>NOVOS BRUTUS LIBERADOS: ${novos}!</b></p>`}
    save(data);
  }
  show(`<h2>${campaignDone?'O BARULHO VENCEU!':r.win?'MISSÃO CUMPRIDA':'DEU RUIM!'}</h2>${campaignDone?`<p>${ROSTER.find(h=>h.id===data.selectedCharacter).name} concluiu as 20 missões!</p>${unlockMessage}`:''}<div class="cardgrid"><div class="card"><b>${r.score}</b><p>PONTUAÇÃO</p></div><div class="card"><b>${r.kills}</b><p>INIMIGOS</p></div><div class="card"><b>${r.rescued}</b><p>RESGATADOS</p></div><div class="card"><b>+${r.coins}</b><p>CRÉDITOS</p></div></div><div class="buttons">${r.win&&!campaignDone?'<button data-next>PRÓXIMA MISSÃO</button>':''}<button data-retry>REPETIR</button><button data-heroes>PERSONAGENS</button><button data-map>MAPA DE MISSÕES</button><button data-home>MENU PRINCIPAL</button></div>`);
  modal.querySelector('[data-retry]').onclick=()=>startMission(game.level.id);
  modal.querySelector('[data-home]').onclick=back;
  modal.querySelector('[data-map]').onclick=selectMission;
  modal.querySelector('[data-heroes]').onclick=()=>selectCharacter();
  modal.querySelector('[data-next]')?.addEventListener('click',()=>startMission(game.level.id+1));
}
document.querySelector('[data-action="new"]').onclick=()=>selectCharacter(()=>difficulty(()=>startMission(1)));
document.querySelector('[data-action="continue"]').onclick=()=>selectCharacter(()=>difficulty(()=>startMission(data.characters.progress[data.selectedCharacter]||1)));
document.querySelector('[data-action="missions"]').onclick=selectMission;
document.querySelector('[data-action="characters"]').onclick=()=>selectCharacter();
document.querySelector('[data-action="armory"]').onclick=armory;
document.querySelector('[data-action="how"]').onclick=how;
addEventListener('resize',background);
