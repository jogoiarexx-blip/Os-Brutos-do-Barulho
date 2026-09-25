// Ataques têm 30 quadros: preparo (30..18), impacto (17..9) e recuperação (8..1).
// O disparo acontece na transição para o quadro de impacto, nunca antes da pose.
export const ATTACK_DURATION=30;
export const IMPACT_AT=17;

export function bossAnimationFrame(levelId,boss){
  if(levelId===6){
    let col=0,row=0;
    if(boss.attack>0){
      if(boss.attack>IMPACT_AT){col=1;row=0}
      else if(boss.attack>8){col=boss.attackKind==='quake'?1:0;row=1}
      else{col=1;row=0}
    }
    return {atlas:'bossDrill',col,row,cols:2,rows:2,w:500,h:333};
  }
  if(levelId===5){
    let col=0,row=0;
    if(boss.attack>0){
      if(boss.attack>IMPACT_AT){col=1;row=0}
      else if(boss.attack>8){col=boss.attackKind==='missiles'?1:0;row=1}
      else{col=1;row=0}
    }
    return {atlas:'bossGoliath',col,row,cols:2,rows:2,w:500,h:333};
  }
  if(levelId===4){
    let col=0,row=0;
    if(boss.attack>0){
      if(boss.attack>IMPACT_AT){col=1;row=0}
      else if(boss.attack>8){col=boss.attackKind==='claw'?1:0;row=1}
      else{col=1;row=0}
    }
    if(boss.hit>0&&boss.attack<=0){col=0;row=0}
    return {atlas:'bossScorpion',col,row,cols:2,rows:2,w:500,h:333};
  }
  const atlas={1:'bossTrain',2:'bossMammoth',3:'bossVoss'}[levelId]||'bossTrain';
  const w=levelId===3?300:410,h=levelId===3?310:300;
  let row=boss.hp<boss.max*.5?1:0,col=Math.floor(boss.anim/10)%2;
  if(boss.attack>0){
    row=0;col=boss.attack>IMPACT_AT?1:boss.attack>8?2:0;
    // O golpe rasteiro de Voss usa o quadro da espada, não o canhão.
    if(levelId===3&&boss.attackKind==='low'&&boss.attack<=IMPACT_AT&&boss.attack>8){row=1;col=0}
  }
  if(boss.hit>0&&boss.attack<=0){row=0;col=3}
  if(boss.dead){row=1;col=boss.death>34?2:3}
  return {atlas,col,row,cols:4,rows:2,w,h};
}
