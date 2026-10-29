import fs from 'fs';
const out = JSON.parse(fs.readFileSync('.tmp/buildings.json','utf8'));
// replicate mulberry32
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const names=['Pre-War Limestone/Buff','Red Terracotta Brick','Blue-Teal Curtain Wall','Dark Bronze Miesian','Silver Supertall'];
for(const b of out){const rand=mulberry32(Math.round(b.cx*31+b.cz*17));const tone=rand();
 b.mat = b.year&&b.year<1945?(tone<0.8?0:1):b.year&&b.year<1980?(tone<0.55?0:3):(tone<0.6?2:4);}
fs.writeFileSync('.tmp/buildings2.json',JSON.stringify(out));
const c={};for(const b of out)c[b.mat]=(c[b.mat]||0)+1;
console.log(names.map((n,i)=>`${n}: ${c[i]} (${(100*c[i]/out.length).toFixed(1)}%)`).join('\n'));
// by district cross-tab top
const g={};for(const b of out){(g[b.district] ||= [0,0,0,0,0])[b.mat]++;}
