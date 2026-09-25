const makeImage=()=>typeof Image!=='undefined'?new Image():{complete:false,naturalWidth:0,naturalHeight:0};

export const atlases={enemies:makeImage(),support:makeImage(),effects:makeImage(),bossTrain:makeImage(),bossMammoth:makeImage(),bossVoss:makeImage(),outpost:makeImage(),jungleProps:makeImage(),citadelProps:makeImage()};

if(typeof Image!=='undefined'){
  atlases.enemies.src='assets/enemies/legion-atlas.webp';
  atlases.support.src='assets/support/vehicles-hostage-atlas.webp';
  atlases.effects.src='assets/effects/combat-items-atlas.webp';
  atlases.bossTrain.src='assets/bosses/train-colossus-atlas.webp';
  atlases.bossMammoth.src='assets/bosses/mammoth-omega-atlas.webp';
  atlases.bossVoss.src='assets/bosses/general-voss-atlas.webp';
  atlases.outpost.src='assets/structures/harbor-outpost-atlas.webp';
  atlases.jungleProps.src='assets/levels/jungle-storm/props-atlas.webp';
  atlases.citadelProps.src='assets/levels/iron-citadel/props-atlas.webp';
}

export function drawAtlas(ctx,name,col,row,cols,rows,x,y,w,h){
  const img=atlases[name];
  if(!img?.complete||!img.naturalWidth)return false;
  const sw=img.naturalWidth/cols,sh=img.naturalHeight/rows;
  ctx.drawImage(img,col*sw,row*sh,sw,sh,x,y,w,h);
  return true;
}

export const enemyRows={grunt:0,gunner:1,drone:2,shield:3,mutant:4,elite:5};
export const vehicleRows={jip:0,tank:1,mecha:2};
export const pickupCols={heavy:0,shotgun:1,laser:2,rocket:3,health:4};
export const projectileCols={rifle:0,heavy:1,shotgun:2,laser:3,rocket:4};
