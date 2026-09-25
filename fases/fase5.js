export default {
  id:5,name:'CÂNION DA MORTE',subtitle:'Destrua os ninhos, escolte os demolidores e derrube Goliath',
  length:8500,sky:['#573142','#dd8350'],ground:'#632d28',unlock:4,chapter:2,
  objectives:[{text:'Destrua os 3 ninhos de metralhadora'},{text:'Escolte os demolidores até o paredão'},{text:'Destrua a Fortaleza Móvel Goliath'}],
  checkpoints:[2260,4890,6540],
  enemies:[['gunner',530,13],['shield',2020,10],['drone',3650,11],['elite',5100,10]],
  hostages:[1490,2980,5250],vehicle:{x:5700,type:'tank'},
  nests:[{x:950,hp:180},{x:1780,hp:215},{x:2680,hp:250}],nestGate:3150,
  ally:{start:3480,end:6210,hp:230,name:'DEMOLIDORES'},
  scenery:[['rocks',420,.75],['charge',1320,.65],['rocks',2190,.72],['rocks',3200,.8],['charge',4200,.7],['rocks',4860,.75],['charge',5900,.72],['rocks',6880,.8]],
  boss:{x:7600,type:'fortress',name:'FORTALEZA MÓVEL GOLIATH',hp:1800},weather:'dust'
};
