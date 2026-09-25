export default {
  id:4,name:'DESERTO DAS SERPENTES',subtitle:'Sabote os depósitos, capture o comboio e enfrente o Escorpião de Aço',
  length:8200,sky:['#8b3d27','#f1a554'],ground:'#683824',unlock:3,chapter:1,
  objectives:[{text:'Sabote os depósitos de combustível'},{text:'Imobilize e capture o comboio'},{text:'Derrote o Escorpião de Aço'}],
  checkpoints:[2250,4700,6300],
  enemies:[['grunt',470,13],['gunner',2050,11],['drone',3450,7],['elite',4950,8]],
  hostages:[1450,3200,5100],vehicle:{x:5200,type:'jip'},
  depots:[{x:900,hp:150},{x:1710,hp:180},{x:2590,hp:220}],depotGate:3090,
  convoy:{x:4250,hp:550},convoyGate:4930,
  scenery:[['cactus',370,.75],['rocks',1180,.82],['barrier',2070,.7],['cactus',2870,.64],['rocks',3480,.78],['barrier',5280,.72],['cactus',5860,.7],['rocks',6900,.8]],
  boss:{x:7300,type:'scorpion',name:'ESCORPIÃO DE AÇO',hp:1650},weather:'sandstorm'
};
