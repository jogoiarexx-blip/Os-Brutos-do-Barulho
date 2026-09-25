export default {
  id:7,name:'PÂNTANO TÓXICO',subtitle:'Pegue os filtros, destrua as bombas e enfrente o Leviatã',
  length:9000,sky:['#243320','#a7a24a'],ground:'#313f22',unlock:6,chapter:2,
  objectives:[{text:'Colete os 3 filtros de proteção'},{text:'Destrua as 3 bombas químicas'},{text:'Destrua o Leviatã Tóxico'}],
  checkpoints:[2400,5100,7100],
  enemies:[['mutant',530,13],['drone',1930,10],['gunner',3420,12],['elite',5200,10]],
  hostages:[1380,2920,4800,6400],vehicle:{x:6150,type:'jip'},
  masks:[830,1640,2570],maskGate:3050,
  pumps:[{x:3650,hp:215},{x:4550,hp:245},{x:5450,hp:275}],pumpGate:5900,
  poison:[1180,2240,3900,4930,6300,6940],
  scenery:[['roots',470,.72],['roots',1460,.65],['roots',2800,.76],['roots',3300,.7],['roots',4300,.72],['roots',5100,.67],['roots',6100,.7],['roots',7180,.76]],
  boss:{x:8100,type:'leviathan',name:'LEVIATÃ TÓXICO',hp:2100},weather:'spores'
};
