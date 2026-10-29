import fs from 'fs'; import zlib from 'zlib';
const { districtAt } = await import('../js/city-config.js');
const data=new Uint8Array(zlib.gunzipSync(fs.readFileSync('js/building-geodata.bin.gz')));
const dv=new DataView(data.buffer);
const xStart=12+dv.getUint32(4,true), zStart=xStart+dv.getUint32(8,true);
function stream(start,end){let c=start;return{uint(){let v=0,s=0,b;do{b=data[c++];v|=(b&127)<<s;s+=7;}while(b&128);return v>>>0;}};}
const md=stream(12,xStart), xs=stream(xStart,zStart), zs=stream(zStart,data.length);
const delta=s=>{const v=s.uint();return (v>>>1)^-(v&1);};
const count=md.uint(); let x=0,z=0; const out=[];
for(let i=0;i<count;i++){
  const h=md.uint(), dec=md.uint(); let minX=1e9,maxX=-1e9,minZ=1e9,maxZ=-1e9;
  for(let p=md.uint();p>0;p--) for(let r=md.uint();r>0;r--) for(let n=md.uint();n>0;n--){x+=delta(xs);z+=delta(zs);const px=x*.5,pz=z*.5;if(px<minX)minX=px;if(px>maxX)maxX=px;if(pz<minZ)minZ=pz;if(pz>maxZ)maxZ=pz;}
  const cx=(minX+maxX)/2, cz=(minZ+maxZ)/2;
  const year = dec ? (dec+159)*10 : 0;
  out.push({h,year,cx,cz,w:maxX-minX,d:maxZ-minZ,district:districtAt(cx,cz)});
}
fs.writeFileSync('.tmp/buildings.json',JSON.stringify(out));
console.log('wrote',out.length);
