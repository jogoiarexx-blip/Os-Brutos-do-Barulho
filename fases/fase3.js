export default {
  id:3,name:'CIDADELA FINAL',subtitle:'Abra a muralha e acabe com o discurso do General Voss',length:8400,
  sky:['#140f26','#812e38'],ground:'#24212c',unlock:2,spawnAhead:760,
  objectives:[{text:'Destrua o portão da muralha'},{text:'Sobreviva à emboscada imperial'},{text:'Elimine o General Voss'}],
  checkpoints:[2500,5650],breach:{x:1420,hp:520,name:'PORTÃO DA CIDADELA'},
  ambush:{x:3920,required:8,left:3600,right:4520},
  enemies:[['elite',560,3,230],['gunner',1880,4,230],['drone',2550,4,250],['shield',3100,3,290],['mutant',4750,3,300],['elite',5350,5,220],['gunner',6250,4,230]],
  hostages:[2200,3250,5050,6400],vehicle:{x:5750,type:'tank'},boss:{x:7480,type:'voss',name:'GENERAL VOSS',hp:1500},weather:'ash',
  scenery:[
    ['rubble',380,.8],['sandbags',820,.76],['ammo',1760,.72],['searchlight',2440,.68],
    ['statue',3060,.72],['rubble',3500,.76,true],['checkpoint',2500,.66],['sandbags',4700,.78,true],
    ['searchlight',5400,.7,true],['ammo',6100,.74],['statue',6880,.7,true],['rubble',7900,.82]
  ]
};
