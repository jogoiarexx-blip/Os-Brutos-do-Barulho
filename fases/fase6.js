export default {
  id:6,name:'MINAS ABANDONADAS',subtitle:'Reative os guinchos, liberte os mineiros e pare a Broca Titã',
  length:8800,sky:['#091524','#315b72'],ground:'#202c3c',unlock:5,chapter:2,
  objectives:[{text:'Destrua os 3 guinchos dos elevadores'},{text:'Abra as jaulas e resgate os 3 mineiros'},{text:'Destrua a Broca Titã'}],
  checkpoints:[2350,4800,6820],
  enemies:[['grunt',520,12],['mutant',1700,10],['shield',3350,10],['elite',4900,9],['drone',5750,5]],
  hostages:[3660,4540,5370],vehicle:{x:6020,type:'mecha'},
  lifts:[{x:920,hp:190},{x:1780,hp:225},{x:2660,hp:255}],liftGate:3050,
  cages:[{x:3660,hp:145},{x:4540,hp:175},{x:5370,hp:195}],minersGate:5890,
  scenery:[['rocks',460,.65],['rocks',1350,.72],['rocks',2230,.66],['rocks',3260,.72],['rocks',4180,.75],['rocks',4990,.64],['rocks',6110,.72],['rocks',7070,.78]],
  boss:{x:7900,type:'drill',name:'BROCA TITÃ',hp:1950},weather:'crystal'
};
