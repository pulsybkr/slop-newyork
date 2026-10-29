import fs from 'fs'; import zlib from 'zlib';
const data=new Uint8Array(zlib.gunzipSync(fs.readFileSync('js/building-geodata.bin.gz')));
const dv=new DataView(data.buffer);
const xStart=12+dv.getUint32(4,true), zStart=xStart+dv.getUint32(8,true);
function stream(start,end){let c=start;return{uint(){let v=0,s=0,b;do{b=data[c++];v|=(b&127)<<s;s+=7;}while(b&128);return v>>>0;}};}
const md=stream(12,xStart), xs=stream(xStart,zStart), zs=stream(zStart,data.length);
const delta=s=>{const v=s.uint();return (v>>>1)^-(v&1);};
const count=md.uint(); let x=0,z=0; const out=[];
for(let i=0;i<count;i++){
  const h=md.uint(), dec=md.uint(); let minX=1e9,maxX=-1e9,minZ=1e9,maxZ=-1e9, pts=0;
  for(let p=md.uint();p>0;p--) for(let r=md.uint();r>0;r--) for(let n=md.uint();n>0;n--){x+=delta(xs);z+=delta(zs);pts++;const px=x*.5,pz=z*.5;if(px<minX)minX=px;if(px>maxX)maxX=px;if(pz<minZ)minZ=pz;if(pz>maxZ)maxZ=pz;}
  out.push({h,year:dec?(dec+159)*10:0,cx:(minX+maxX)/2,cz:(minZ+maxZ)/2,w:maxX-minX,d:maxZ-minZ,pts});
}
const Z=n=>(n), XA=id=>id;
const districts=JSON.parse(fs.readFileSync('.tmp/districts.json','utf8'));
const byD={};
for(const b of out){const d=districts[out.indexOf(b)];b.district=d;(byD[d] ||= []).push(b);}
const stats=a=>{const hs=a.map(b=>b.h).sort((x,y)=>x-y);const q=p=>hs[Math.floor(p*(hs.length-1))];
 return {n:a.length,med:q(.5),p90:q(.9),p99:q(.99),max:hs.at(-1),avgYear:Math.round(a.reduce((s,b)=>s+(b.year||1910),0)/a.length),over50:a.filter(b=>b.h>=50).length,over100:a.filter(b=>b.h>=100).length};};
fs.writeFileSync('.tmp/buildings.json',JSON.stringify(out));
console.log('wrote',out.length);
