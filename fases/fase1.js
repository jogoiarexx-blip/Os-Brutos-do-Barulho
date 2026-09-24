export default {
  id:1,name:'PORTO EM CHAMAS',subtitle:'Rompa o bloqueio da Legião Ferro',length:7200,
  sky:['#15283d','#d06d3d'],ground:'#302b28',unlock:0,
  spawnAhead:720,
  objectives:[{x:900,text:'Destrua o posto avançado'},{x:3000,text:'Resgate 3 prisioneiros'},{x:5600,text:'Derrote o Trem Blindado'}],
  checkpoints:[1800,4100],
  enemies:[['grunt',650,5,170],['gunner',1450,3,220],['drone',2050,4,230],['shield',2850,3,260],['grunt',3650,7,180],['gunner',4900,5,210]],
  hostages:[2200,2800,3700],vehicle:{x:4300,type:'jip'},boss:{x:6500,type:'train',name:'COLOSSO FERROVIÁRIO',hp:850},weather:'embers',
  scenery:[
    ['bollard',240,.8],['sandbags',970,.82,true],
    ['lamp',1280,.8],['fence',1510,.86],['scrap',1960,.72],
    ['anchor',2350,.78,true],['pallet',2590,.76],['fire',3360,.76],
    ['barrier',3890,.78,true],['lamp',4210,.84,true],['sandbags',4550,.82],
    ['fence',5180,.88,true],['scrap',5790,.76,true],['fire',6110,.78],
    ['barrier',6360,.82],['bollard',6840,.85,true]
  ],
  destructibles:[
    ['crate',520,.82],['redBarrel',790,.76],['blueBarrel',1740,.72,true],
    ['crate',3130,.8,true],['redBarrel',4830,.76,true],['blueBarrel',5480,.74]
  ]
};
