export default {
  id:2,name:'SELVA DO TROVÃO',subtitle:'Corte o sinal e invada o laboratório oculto',length:7800,
  sky:['#092e2a','#376436'],ground:'#17291c',unlock:1,spawnAhead:760,
  objectives:[{text:'Destrua as 3 torres de rádio'},{text:'Escolte o Dr. Trovão até o laboratório'},{text:'Destrua o Mamute Ômega'}],
  checkpoints:[3150,5480],radioGate:3070,
  radios:[{x:1050,hp:145},{x:1880,hp:175},{x:2700,hp:205}],
  ally:{start:3420,end:5350,hp:240,name:'DR. TROVÃO'},
  enemies:[['grunt',520,4,190],['drone',1300,4,240],['gunner',2050,4,230],['shield',3300,3,310],['grunt',3950,6,190],['mutant',4700,3,280],['drone',5550,5,230],['gunner',6150,3,240]],
  hostages:[1550,2480,5850],vehicle:{x:5650,type:'mecha'},boss:{x:6880,type:'biotank',name:'MAMUTE ÔMEGA',hp:1100},weather:'storm',
  scenery:[
    ['fern',420,.86],['barrier',820,.72],['generator',1480,.72],['crates',2260,.72],
    ['fern',3040,.9,true],['checkpoint',3150,.7],['bridge',3900,.9],['generator',4650,.74,true],
    ['fern',5900,.86],['barrier',6460,.76,true],['crates',7300,.74]
  ]
};
