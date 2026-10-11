// Coordinates are measured on the user's marked 2048×1137 field image.
// Rotation convention: 0°=right, 90°=down, 180°=left, 270°=up.
// These are APPROACH headings from the field path; not unverified model-actuator orientations.
export const ARENA_SIZE={width:2048,height:1137};
export const SLOTS=[
 {id:"A",label:"Trên trái",x:7.1,y:10.8,approach:90,edge:"straight",path:"vertical"},
 {id:"B",label:"Trên giữa",x:31.8,y:10.8,approach:90,edge:"straight",path:"vertical"},
 {id:"C",label:"Trên phải",x:56.4,y:10.8,approach:90,edge:"straight",path:"vertical"},
 {id:"D",label:"Dưới trái",x:31.8,y:87.2,approach:270,edge:"straight",path:"vertical"},
 {id:"E",label:"Dưới giữa",x:56.4,y:87.2,approach:270,edge:"straight",path:"vertical"},
 {id:"F",label:"Trung tâm oval",x:81.2,y:49.8,approach:180,edge:"oval",path:"horizontal"},
 {id:"G",label:"Góc trên trái oval",x:67.6,y:7.9,approach:45,edge:"diagonal",path:"diagonal"},
 {id:"H",label:"Góc trên phải oval",x:94.7,y:7.9,approach:135,edge:"diagonal",path:"diagonal"},
 {id:"I",label:"Góc dưới trái oval",x:67.6,y:91.4,approach:315,edge:"diagonal",path:"diagonal"},
 {id:"J",label:"Góc dưới phải oval",x:94.7,y:91.4,approach:225,edge:"diagonal",path:"diagonal"}
];
// Original figures from published 2026 rules (the same model illustrations supplied by user).
// CSS crops hide the instructional annotations while preserving the actual model photographs.
const prefix="https://www.enjoyaigreece.gr/wp-content/uploads/2026/02/";
export const MODEL_META={
 compass:{name:"La bàn",image:prefix+"image_2026-02-03_203127205-scaled.png",crop:{width:1000,left:260,top:0,height:300},footprint:"normal",guide:"Kim đỏ và miếng vàng. Kiểm tra phía tác động kim."},
 paper:{name:"Làm giấy",image:prefix+"image_2026-02-03_203318489-scaled.png",crop:{width:1000,left:285,top:0,height:300},footprint:"wide",guide:"Tay gạt phải ở phía có đường robot tiếp cận."},
 gun:{name:"Thuốc súng",image:prefix+"image_2026-02-03_203456015.png",crop:{width:1000,left:156,top:12,height:215},footprint:"wide",guide:"Tay gạt và khung hứng đạn không bị chặn."},
 printing:{name:"In chữ rời",image:prefix+"image_2026-02-03_203627051.png",crop:{width:1000,left:410,top:83,height:222},footprint:"normal",guide:"Hai khối ENJ/YAI và vị trí nam châm phải thao tác được."},
 seismo:{name:"Máy đo địa chấn",image:prefix+"image_2026-02-03_203753210.png",crop:{width:1000,left:168,top:20,height:235},footprint:"normal",guide:"Thanh đẩy cần hướng ra mặt robot có thể tiếp cận."},
 pyramid:{name:"Kim tự tháp",image:prefix+"image_2026-02-03_204028332.png",crop:{width:1000,left:272,top:0,height:300},footprint:"wide",guide:"Có khoảng trống cho robot đẩy lên bục thứ hai."},
 wall:{name:"Vạn Lý Trường Thành",image:prefix+"image_2026-02-03_204308528.png",crop:{width:1000,left:411,top:80,height:255},footprint:"wide",guide:"Bề mặt nhận vật liệu quay về hướng tiếp cận."},
 bonus:{name:"Nhiệm vụ thưởng",image:null,footprint:"normal",guide:"Chỉ áp dụng khi BTC công bố mô hình."}
};
// The large and wide models are conservative: avoid diagonal frames until physically confirmed.
// Approval sets are explicitly editable in later competition configurations.
const DIAGONAL_ONLY=new Set(["printing","compass","seismo"]);
export const APPROACH_RULES=Object.fromEntries(Object.entries(MODEL_META).map(([key,meta])=>[
 key,Object.fromEntries(SLOTS.filter(slot=>
  slot.edge!=="diagonal" || DIAGONAL_ONLY.has(key)
 ).map(slot=>[slot.id,[slot.approach]]))
]));
export const LEVELS=[
 {id:"easy",name:"Cơ bản",division:"Lớp 1–3",tasks:4,obstacles:0},
 {id:"medium",name:"Trung bình",division:"Lớp 4–6",tasks:5,obstacles:1},
 {id:"hard",name:"Khó",division:"Lớp 7–9",tasks:7,obstacles:2},
 {id:"expert",name:"Nâng cao",division:"Lớp 10–12",tasks:7,obstacles:3}
];
export const NORMAL_MODELS=["compass","paper","gun","printing","seismo","pyramid","wall"];
export function hashSeed(seed){let h=2166136261;for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function seeded(seed){let state=hashSeed(seed);return()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function shuffled(arr,rng){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function validPlacement(taskId,slotId,angle,approved={}){
 const angles=APPROACH_RULES[taskId]?.[slotId]||[];
 if(!angles.includes(angle))return false;
 // The host may restrict (but must not broaden) the geometrically safe matrix.
 const key=taskId+":"+slotId+":"+angle;
 return approved[key]!==false;
}
export function buildRandomLayout({level="medium",seed="DEMO",includeBonus=false,taskCount,obstaclesCount,approved={}}={}){
 const preset=LEVELS.find(x=>x.id===level)||LEVELS[1],rng=seeded(seed);
 const requested=Math.max(1,Math.min(7,Math.floor(Number(taskCount??preset.tasks))));
 const selected=shuffled(NORMAL_MODELS,rng).slice(0,requested);
 if(includeBonus)selected.push("bonus");
 const obstacleQty=Math.max(0,Math.floor(Number(obstaclesCount??preset.obstacles)));
 if(selected.length+obstacleQty>SLOTS.length)throw Error("Không đủ khung cho nhiệm vụ và vật cản.");
 // Constraint satisfaction: most-constrained task first, randomized candidates; backtrack if needed.
 const options=selected.map(id=>({
  id,choices:shuffled(SLOTS.flatMap(slot=>(APPROACH_RULES[id]?.[slot.id]||[])
    .filter(angle=>validPlacement(id,slot.id,angle,approved))
    .map(angle=>({slot:slot.id,angle}))),rng)
 })).sort((a,b)=>a.choices.length-b.choices.length);
 const used=new Set(),assignment=new Map();
 const search=(i)=>{
  if(i>=options.length)return true;
  for(const choice of options[i].choices){
   if(used.has(choice.slot))continue;
   used.add(choice.slot);assignment.set(options[i].id,choice);
   if(search(i+1))return true;
   used.delete(choice.slot);assignment.delete(options[i].id);
  }
  return false;
 };
 if(!search(0))throw Error("Không tìm được bố trí thỏa mãn các giới hạn. Hãy giảm số nhiệm vụ hoặc mở lại vị trí đã khóa.");
 const tasks=selected.map(id=>({id,...assignment.get(id)}));
 const obstacles=shuffled(SLOTS.filter(s=>!used.has(s.id)),rng).slice(0,obstacleQty).map(x=>x.id);
 return {id:"layout-"+Date.now().toString(36),level:preset.id,seed:String(seed),tasks,obstacles,created:new Date().toISOString(),official:false,placementStatus:"simulation",note:"Hướng tiếp cận an toàn theo sơ đồ; cần xác nhận mặt thao tác và kích thước mô hình khi lắp thực tế."};
}
