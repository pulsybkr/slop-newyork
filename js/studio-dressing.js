import * as THREE from 'three/webgpu';
﻿/** Furniture is arranged against room edges; door centres and hallways stay free. */
export function furnishStudioRoom({b,r,place,box,surfaces,H}) {
  const {x,z,w,d,type}=r, left=x-w/2+.65,right=x+w/2-.65,back=z-d/2+.65,front=z+d/2-.65;
  const modern=b.project===41, pi=Math.PI;
  const p=(key,dx,dz,rot=0,y=0,action=null,opts=null)=>place(key,dx,dz,rot,y,action,opts);
  const work=(dx,dz)=>{p('officeDesk',dx,dz);p('monitor',dx,dz,0,.76);p('chair',dx,dz+.85,pi,0,'sit');p('books',dx+.45,dz,.2,.76);};
  const kitchen=(dx,dz,count=3)=>{for(let i=0;i<count;i++)p('kitchen',dx+i,dz);p('fridge',dx+count,dz);box(dx+.5,1.6,dz-.17,2,.65,.35,modern?0xd6d1c2:0x8c9c85);};
  const dining=(dx,dz)=>{p('table',dx,dz);for(const side of [-1,1])for(const offset of [-.55,.55])p('diningChair',dx+offset,dz+side*.95,side>0?pi:0,0,'sit');};
  if(type==='living'||type==='openLiving') {
    const sx=type==='openLiving'?left+1.1:x;
    p('sofa',sx,back+.15,0,0,'sit',{colorway:modern?'oat-wool':'sage-linen',frame:modern?'#9b8b75':'#5b746a',cushion:modern?'#bbaa91':'#718679',seats:2,scatter:2});
    p('rug',sx,z,0);p('coffee',sx,z+.2);p('media',sx,front,pi);p('tv',sx,front,pi,.46);
    p('lamp',sx+1.65,back,.2,.56);p('bedside',sx+1.65,back);
    p('bookcase',left,front-.3,pi/2);p('plant',left,back);
    if(type==='openLiving'){kitchen(right-3.5,back);p('island',right-1.5,z+.5);p('stool',right-2,front,pi,0,'sit');p('stool',right-1,front,pi,0,'sit');}
    else {p('art',x,back-.5,0,1.65);p('books',sx,z+.2,0,.42);}
  } else if(type==='bedroom') {
    p('bed',x-.45,back+1,0,0,'sleep');p('bedside',right,back);p('lamp',right,back,0,.56);
    p('wardrobe',left,front,pi/2);work(right-.5,front);
    p('rug',x,z+.5);p('art',x,back-.5,0,1.6);
  } else if(type==='bath') {
    p('shower',left,back);p('basin',right,back);p('toilet',right,front,pi);
    box(right,1.7,back-.45,.75,.8,.06,0x8eaaae);
    box(left,.65,front,.6,1.3,.4,0xd7d4c8);
  } else if(type==='kitchen') {
    kitchen(left+.2,back,Math.max(2,Math.min(3,Math.floor(w-2))));
    if(d>5.5)dining(x,front-1);else {p('table',x,z+.6);for(const side of [-1,1])p('diningChair',x+side*.95,z+.6,side>0?-pi/2:pi/2,0,'sit');}
    p('plant',left,front);
  } else if(type==='study') {work(x,back);p('filing',right,front);}
  else if(type==='classroom') {
    p('board',x,back-.4);p('desk',right-1,back+1);p('globe',right-1,back+1,0,.8);
    for(let row=0;row<3;row++)for(let col=0;col<4;col++) {
      const dx=left+.6+col*(w-2.5)/3,dz=back+3+row*1.65;
      p('pupilTable',dx,dz);for(const offset of [-.35,.35])p('pupilChair',dx+offset,dz+.65,pi,0,'sit');p('books',dx,dz,0,.73);
    }
    p('bookcase',left,back+1,pi/2);p('plant',right,front);
  } else if(type==='canteen') {
    p('servery',x,back);
    for(let row=0;row<2;row++)for(const dx of [x-w/4,x+w/4]) {
      const dz=back+3+row*3.2;p('dining',dx,dz);
      for(const side of [-1,1])for(const offset of [-.6,.6])p('diningChair',dx+offset,dz+side*.95,side>0?pi:0,0,'sit');
    }
    p('plant',right,back);
  } else if(type==='care') {
    for(const dx of [x-w/4,x+w/4]){p('hospitalBed',dx,back+1.8,0,0,'sleep');p('vital',dx+1.1,back+.7);p('bedside',dx-1,back+.7);}
    p('kitchen',left,front,pi);p('basin',left+1,front,pi);
  } else if(type==='consultation') {
    p('examination',right-.7,back+1.7);work(left+1,back+1);p('waiting',left+1,back+3,pi,0,'sit');p('filing',left,front);p('basin',right,front,pi);
  } else if(type==='waiting') {
    p('reception',x,back+1);p('monitor',x,back+1,0,1.05);p('chair',x,back,0,0,'sit');
    for(let i=0;i<3;i++)p('waiting',left+i*1.2,front,pi,0,'sit');
    p('plant',right,front);p('art',x,back-.5,0,1.8);p('sideboard',right,back+3,-pi/2);
  } else if(type==='cell') {
    p('bench',x,back,0,0,'sit');p('toilet',right,front,pi);
    for(let i=0;i<9;i++)box(x-w/2+.15+i*.45,1.8,back-.45,.045,1.6,.045,0x3f4647);
  } else if(type==='ceremony') {
    box(x,.18,back+1,w-1,.36,2.4,surfaces.wood);box(x,2,back-.4,w-2,2,.12,0x26353c);
    box(left+1,.8,back+1,.65,1.2,.55,0x735340);
    for(let row=0;row<2;row++)for(let col=0;col<4;col++)p('waiting',left+1+col*1.3,back+3.8+row*1.1,pi,0,'sit');
  } else {
    if(type==='interview'){p('table',x,z);p('chair',x,z+1,pi,0,'sit');p('chair',x,z-1,0,0,'sit');}
    else {work(left+1,back);work(right-1,front-1.5);p('filing',right,back);p('bookcase',left,front,pi/2);}
    p('art',x,back-.5,0,1.7);
  }
}

export function dressStudioExterior({b,shell,roof,box,asset,surfaces,treeSites,localToWorld,FLOOR,colliders}) {
  const W=b.w,D=b.d,front=D/2;
  const p=(key,x,z,rot=0)=>{const o=asset(key);o.position.set(x,0,z);o.rotation.y=rot;shell.add(o);o.updateWorldMatrix(true,true);
    const bounds=new THREE.Box3().setFromObject(o);
    colliders.push({minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z,minY:bounds.min.y,maxY:bounds.max.y,studio:b.id});return o;};
  const fence=(x,z,w)=>{box(shell,x,.25,z,w,.5,.24,surfaces.brick);for(let dx=-w/2;dx<=w/2;dx+=.28)box(shell,x+dx,.8,z,.035,.8,.035,0x394540);box(shell,x,1.14,z,w,.055,.055,0x394540);};
  if(b.kind==='house') {
    for(const side of [-1,1]) {
      fence(side*(W/4+1),front+3,W/2);
      box(shell,side*(W/2+.9),.22,front+1,1.1,.4,1.4,surfaces.brick);
      box(shell,side*(W/2+.9),.65,front+1,1,.6,1.3,0x3c6040);
    }
    const pos=localToWorld(b,-W/2-2,-D/2-3);treeSites.push({...pos,y:FLOOR});
    box(shell,1.1,.9,front+2.9,.25,.35,.35,0x344c49);
    box(shell,1.1,.45,front+2.9,.07,.9,.07,0x344c49);
    if(b.project===41)for(const side of [-1,1])for(const dx of [-.55,.55])p('curtain',side*(W/4+1)+dx,front-.22,Math.PI).position.y=.2;
    return;
  }
  // Recognisable entrances: glazed canopy, columns, bollards and landscaped forecourt.
  const accent=b.kind==='school'?0xc1a151:b.kind==='clinic'?0x5f8c83:b.kind==='police'?0x344e66:0x76513e;
  box(roof,0,3.1,front+1.6,6,.18,3.4,accent);
  for(const x of [-2.7,2.7])box(shell,x,1.5,front+2.8,.2,3,.2,surfaces.curb);
  box(shell,0,.015,front+4,W-2,.03,7,surfaces.walk);
  for(const side of [-1,1]) {
    box(shell,side*3,.45,front+6,.16,.9,.16,accent);
    box(shell,side*(W/2-1),.3,front+3,1.5,.6,2,surfaces.brick);
    p('plant',side*(W/2-1),front+3);
  }
  if(b.kind==='school') {
    box(shell,0,.01,front+10,W+8,.02,18,surfaces.walk);
    box(shell,W/2+5,.01,0,4,.02,11,surfaces.road);
    for(const x of [-W/2+2,W/2-2]){fence(x,front+9,4);p('picnic',x,front+5);}
    p('bus',W/2+5,0);p('bikeRack',-W/2+3,front+7);
    box(shell,0,.018,-D/2-10,W,.036,15,surfaces.road);p('hoop',0,-D/2-16);
    for(const x of [-W/2+1,W/2-1])box(shell,x,.043,-D/2-10,.08,.012,13,0xe1dac0);
    for(const z of [-D/2-16,-D/2-4])box(shell,0,.043,z,W-2,.012,.08,0xe1dac0);
  } else if(b.kind==='clinic') {
    box(shell,0,2.4,front+.2,1,.2,.15,0xad4940);box(shell,0,2.4,front+.2,.2,1,.16,0xad4940);
    box(shell,W/2+4,.01,0,3.6,.02,8,surfaces.road);p('ambulance',W/2+4,0);p('bench',-W/2+3,front+4);
  } else if(b.kind==='police') {
    for(const side of [-1,1]){box(shell,side*2,2.4,front+.3,.3,.45,.3,0x417a9b);box(shell,side*2,1,front+.3,.4,1.8,.4,surfaces.curb);}
    box(shell,W/2+4,.01,0,3.6,.02,7,surfaces.road);p('cruiser',W/2+4,0);fence(0,-D/2-2,W);
  } else {
    for(let x=-W/2+1;x<W/2-1;x+=.7)box(roof,x,2.8,front+1.1,.68,.15,2.4,Math.round(x*10)%2?0xa58768:0xe1d2b6);
    for(const side of [-1,1]) {p('picnic',side*5,front+4);p('plant',side*3.5,front+1);}
  }
}
