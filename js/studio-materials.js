import * as THREE from 'three/webgpu';
import { createRoadSurfaceMaterial, createSidewalkMaterial, createCurbMaterial, createParkLawnMaterial } from './tsl-materials.js';

// Repeatable, metre-scaled surface maps; no stretched single colour on a whole facade.
function surface(kind, color) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const ctx = c.getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0,0,512,512);
  let seed = 741;
  const random = () => ((seed = (Math.imul(seed,1664525)+1013904223) >>> 0) / 4294967296);
  if (kind === 'brick' || kind === 'slate' || kind === 'tile') {
    const rows = kind === 'brick' ? 8 : kind === 'slate' ? 10 : 4;
    const height = 512/rows, width = kind === 'brick' ? 128 : kind === 'slate' ? 64 : 128;
    ctx.fillStyle = kind === 'brick' ? '#aaa18e' : '#555b57'; ctx.fillRect(0,0,512,512);
    for(let row=0;row<rows;row++) for(let x=-width;x<512;x+=width) {
      ctx.fillStyle=color; ctx.fillRect(x+(row%2)*width/2+2,row*height+2,width-4,height-4);
      ctx.fillStyle=`rgba(${random()>.5?'255,244,220':'30,24,18'},${random()*.16})`;
      ctx.fillRect(x+(row%2)*width/2+2,row*height+2,width-4,height-4);
    }
  } else if(kind === 'wood') {
    for(let x=0;x<512;x+=64) {
      ctx.fillStyle='rgba(40,30,20,.25)'; ctx.fillRect(x,0,2,512);
      for(let i=0;i<25;i++) {ctx.strokeStyle=`rgba(70,45,20,${random()*.16})`;ctx.beginPath();ctx.moveTo(x+random()*64,0);ctx.bezierCurveTo(x+32,180,x+random()*64,350,x+random()*64,512);ctx.stroke();}
    }
  }
  for(let i=0;i<26000;i++){ctx.fillStyle=`rgba(${random()>.5?'255,255,240':'20,18,15'},${random()*.09})`;ctx.fillRect(random()*512,random()*512,1+random()*3,1);}
  const map = new THREE.CanvasTexture(c); map.wrapS=map.wrapT=THREE.RepeatWrapping; map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
  return new THREE.MeshStandardMaterial({map,roughness:kind==='tile'?.55:.88,bumpMap:map,bumpScale:kind==='brick'?.035:.012});
}
export function studioMaterials() {
  return { road:createRoadSurfaceMaterial(), walk:createSidewalkMaterial(), curb:createCurbMaterial(), lawn:createParkLawnMaterial(),
    brick:surface('brick','#8e6651'), paleBrick:surface('brick','#b4a58d'), slate:surface('slate','#4c5558'),
    wood:surface('wood','#b39a73'), lightWood:surface('wood','#c6b799'), tile:surface('tile','#b5c4bb'), plaster:surface('plaster','#ded7c7') };
}
