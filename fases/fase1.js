export default {
  id:1,name:'PORTO EM CHAMAS',subtitle:'Rompa o bloqueio da Legião Ferro',length:7200,
  sky:['#15283d','#d06d3d'],ground:'#302b28',unlock:0,
  objectives:[{x:900,text:'Destrua o posto avançado'},{x:3000,text:'Resgate 3 prisioneiros'},{x:5600,text:'Derrote o Trem Blindado'}],
  checkpoints:[1800,4100],
  enemies:[['grunt',500,12],['gunner',1000,7],['drone',1500,6],['shield',2500,5],['grunt',3400,18],['gunner',4400,10]],
  hostages:[2200,2800,3700],vehicle:{x:4300,type:'jip'},boss:{x:6500,type:'train',name:'COLOSSO FERROVIÁRIO',hp:850},weather:'embers',
  scenery:[
    ['bollard',240,.8],['crate',520,.82],['redBarrel',790,.76],['sandbags',970,.82,true],
    ['lamp',1280,.8],['fence',1510,.86],['blueBarrel',1740,.72,true],['scrap',1960,.72],
    ['anchor',2350,.78,true],['pallet',2590,.76],['crate',3130,.8,true],['fire',3360,.76],
    ['barrier',3890,.78,true],['lamp',4210,.84,true],['sandbags',4550,.82],['redBarrel',4830,.76,true],
    ['fence',5180,.88,true],['blueBarrel',5480,.74],['scrap',5790,.76,true],['fire',6110,.78],
    ['barrier',6360,.82],['bollard',6840,.85,true]
  ]
};
