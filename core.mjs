// ENJOY AI 2026 — quy tắc tính điểm và lưu trữ độc lập với giao diện.
export const VERSION = 1;
export const INV_DIVISIONS = [
  {id:"p13",label:"Tiểu học khối nhỏ (lớp 1–3)"},
  {id:"p46",label:"Tiểu học khối lớn (lớp 4–6)"},
  {id:"m79",label:"THCS (lớp 7–9)"},
  {id:"h1012",label:"THPT (lớp 10–12)"}
];
export const BATTLE_DIVISIONS = [
  {id:"primary",label:"Tiểu học"},{id:"middle",label:"THCS"}
];
export const TASKS = [
  {id:"compass",name:"La bàn",english:"Compass",points:50,detail:"Kim đỏ hướng về vùng vàng."},
  {id:"paper",name:"Làm giấy",english:"Paper Making",points:60,detail:"Giấy rời bảng trên và nằm trên bảng dưới."},
  {id:"gun",name:"Thuốc súng",english:"Gunpowder",points:40,detail:"Đạn nằm trong khung vuông và chạm đế."},
  {id:"enj",name:"In chữ rời – ENJ",english:"Movable Type ENJ",points:40,detail:"ENJ gắn đúng vị trí nam châm phía trên."},
  {id:"yai",name:"In chữ rời – YAI",english:"Movable Type YAI",points:40,detail:"YAI gắn đúng vị trí nam châm phía dưới."},
  {id:"seismo",name:"Máy đo địa chấn",english:"Seismoscope",points:40,detail:"Bi trong khung dưới, không chạm đế/sân."},
  {id:"pyramid",name:"Kim tự tháp",english:"Pyramid",points:60,detail:"Đáy chỉ tiếp xúc bục thứ hai."},
  {id:"wall",name:"Vạn Lý Trường Thành",english:"Great Wall",points:60,detail:"Vật liệu chỉ tiếp xúc với mô hình tường."},
  {id:"bonus",name:"Nhiệm vụ thưởng (BTC)",english:"Bonus",points:100,detail:"Chỉ có hiệu lực khi BTC công bố nội dung và xác nhận áp dụng.",optional:true}
];
export const LAYOUT_MODELS = ["compass","paper","gun","printing","seismo","pyramid","wall","bonus"];
export const LAYOUT_NAMES = {compass:"La bàn",paper:"Làm giấy",gun:"Thuốc súng",printing:"In chữ rời",seismo:"Địa chấn",pyramid:"Kim tự tháp",wall:"Vạn lý trường thành",bonus:"Nhiệm vụ thưởng"};
// Các mốc minh họa trên sa bàn, không phải tọa độ lắp đặt do BTC chứng nhận.
export const SLOTS = [
  {id:"A",x:11,y:12},{id:"B",x:32,y:12},{id:"C",x:57,y:12},
  {id:"D",x:68,y:9},{id:"E",x:95,y:11},{id:"F",x:81,y:50},
  {id:"G",x:95,y:87},{id:"H",x:67,y:88},{id:"I",x:56,y:88},
  {id:"J",x:32,y:88}
];
export const LEVELS = [
  {id:"easy",name:"Cơ bản",division:"Lớp 1–3",tasks:4,obstacles:0},
  {id:"medium",name:"Trung bình",division:"Lớp 4–6",tasks:5,obstacles:1},
  {id:"hard",name:"Khó",division:"Lớp 7–9",tasks:7,obstacles:2},
  {id:"expert",name:"Nâng cao",division:"Lớp 10–12",tasks:7,obstacles:3}
];
export function initialData(){return {version:VERSION,rounds:2,teams:[],invention:[],battles:[],layouts:[],bonusEnabled:false,bonusDescription:""};}
export function normInt(value,min=0,max=99999){const v=Number(value);return Number.isFinite(v)?Math.max(min,Math.min(max,Math.floor(v))):min;}
export function scoreRetry(retries,smooth=true){
  const r=normInt(retries,0,1000);
  return r===0 ? (smooth?40:0) : Math.max(0,40-r*10);
}
export function invScore(entry,bonusEnabled=false){
  if(!entry || entry.status==="invalid" || entry.status==="withdrawn") return 0;
  const done=entry.tasks||{};
  const tasks=TASKS.reduce((total,t)=>total+((!t.optional||bonusEnabled)&&Boolean(done[t.id])?t.points:0),0);
  return tasks+scoreRetry(entry.retries,entry.smooth===true);
}
export function invRank(teams,entries,rounds,bonusEnabled){
  const values=teams.filter(t=>t.type==="invention").map(t=>{
    const attempts=entries.filter(e=>e.teamId===t.id&&e.round<=rounds&&e.status==="done");
    const points=attempts.reduce((sum,e)=>sum+invScore(e,bonusEnabled),0);
    const time=attempts.reduce((sum,e)=>sum+Number(e.time||0),0);
    const retries=attempts.reduce((sum,e)=>sum+normInt(e.retries),0);
    const best=Math.max(0,...attempts.map(e=>invScore(e,bonusEnabled)));
    return {...t,points,time,retries,best,finished:attempts.length,byRound:Array.from({length:rounds},(_,i)=>{const e=attempts.find(a=>a.round===i+1);return e?invScore(e,bonusEnabled):null;})};
  });
  values.sort((a,b)=>a.division.localeCompare(b.division)||b.points-a.points||a.time-b.time||a.retries-b.retries||b.best-a.best||a.name.localeCompare(b.name,"vi"));
  let previous=null; let rank=0;let position=0;let currentDivision=null;
  for(const t of values){
    if(t.division!==currentDivision){currentDivision=t.division;previous=null;rank=0;position=0;}
    if(t.points<=0||t.finished===0){t.rank=null;continue;}
    position++;
    const key=[t.division,t.points,t.time,t.retries,t.best].join("/");
    if(key!==previous)rank=position;
    t.rank=rank;previous=key;
  }
  return values;
}
export function battleSideScore(side){
  if(!side||side.status==="invalid"||side.status==="withdrawn")return 0;
  const balls=(side.bins||[]).reduce((a,b)=>a+normInt(b,0,8),0);
  const base=(side.tower?100:0)+10*normInt(side.blocks,0,8)+15*balls;
  return base+scoreRetry(side.retries,side.smooth===true)-10*normInt(side.fouls,0,1000);
}
export function battleEligible(side){
  if(!side||!side.tower||normInt(side.blocks)<5)return false;
  return (side.bins||[]).filter(v=>normInt(v)>=2).length>=2;
}
export function validateBattleSide(side){
  if(!side)return "Thiếu dữ liệu đội.";
  if(normInt(side.blocks)>8)return "Mỗi đội tối đa 8 khối phòng thủ.";
  if((side.bins||[]).reduce((a,b)=>a+normInt(b),0)>8)return "Mỗi đội tối đa 8 bóng năng lượng.";
  if(normInt(side.fouls)>normInt(side.retries))return "Số lần chạy lại phải bao gồm cả lần do vi phạm.";
  if(side.instant&&!battleEligible(side))return "Chưa đủ 3 điều kiện để giành chiến thắng ngay.";
  return "";
}
export function battleOutcome(match){
  if(!match||match.status!=="done")return {winner:null,kind:"pending"};
  const r=match.red||{},b=match.blue||{};
  if(r.instant&&b.instant)return {winner:null,kind:"error"};
  if(r.instant)return {winner:match.redId,kind:"instant"};
  if(b.instant)return {winner:match.blueId,kind:"instant"};
  const x=battleSideScore(r),y=battleSideScore(b);
  if(x!==y)return {winner:x>y?match.redId:match.blueId,kind:"score"};
  if(match.stage==="group"){
    if(!!r.tower!==!!b.tower)return {winner:r.tower?match.redId:match.blueId,kind:"tower"};
    return {winner:null,kind:"draw"};
  }
  const balls=(s)=>(s.bins||[]).reduce((a,b)=>a+normInt(b),0);
  if(balls(r)!==balls(b))return {winner:balls(r)>balls(b)?match.redId:match.blueId,kind:"firepower"};
  if(!!r.tower!==!!b.tower)return {winner:r.tower?match.redId:match.blueId,kind:"tower"};
  if(normInt(r.retries)!==normInt(b.retries))return {winner:r.retries<b.retries?match.redId:match.blueId,kind:"retry"};
  return {winner:null,kind:"tiebreak"};
}
export function battleRanking(teams,matches){
  const ranks=teams.filter(t=>t.type==="battle").map(t=>{
    const games=matches.filter(m=>m.status==="done"&&m.stage==="group"&&(m.redId===t.id||m.blueId===t.id));
    let wins=0,draws=0,losses=0,points=0,total=0,towers=0,retries=0;
    games.forEach(m=>{
      const mine=m.redId===t.id?m.red:m.blue;
      const outcome=battleOutcome(m);
      total+=battleSideScore(mine);
      towers+=mine.tower?1:0;
      retries+=normInt(mine.retries);
      if(outcome.winner===t.id){wins++;points+=3;}
      else if(outcome.winner===null&&outcome.kind==="draw"){draws++;points++;}
      else losses++;
    });
    return {...t,wins,draws,losses,points,total,towers,retries,played:games.length};
  });
  // "Thắng đối đầu": xét các trận giữa các đội bằng điểm trong cùng bảng.
  for(const t of ranks){
    const tied=ranks.filter(x=>x.division===t.division&&x.group===t.group&&x.points===t.points&&x.played>0);
    const ids=new Set(tied.map(x=>x.id));
    t.directWins=matches.filter(m=>m.status==="done"&&m.stage==="group"&&ids.has(m.redId)&&ids.has(m.blueId)&&battleOutcome(m).winner===t.id).length;
  }
  ranks.sort((a,b)=>a.division.localeCompare(b.division)||a.group.localeCompare(b.group)||b.points-a.points||b.directWins-a.directWins||b.total-a.total||b.towers-a.towers||a.retries-b.retries||a.name.localeCompare(b.name,"vi"));
  let key=null,place=0,index=0;
  for(const t of ranks){
    const groupKey=t.division+"/"+t.group;
    if(groupKey!==key){index=0;place=0;key=groupKey;}
    if(t.played===0){t.rank=null;continue;}
    index++;
    const prev=ranks.filter(x=>x.division===t.division&&x.group===t.group&&x.played>0).find(x=>x!==t&&x.rank!==undefined&&x.rank!==null&&x.points===t.points&&x.directWins===t.directWins&&x.total===t.total&&x.towers===t.towers&&x.retries===t.retries);
    t.rank=prev?prev.rank:index;
  }
  return ranks;
}
export function seedToNumber(seed){let h=2166136261;for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function randomFactory(seed){let state=seedToNumber(seed);return ()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function shuffled(items,rng){let arr=[...items];for(let i=arr.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
export function generateLayout({level="medium",seed,includeBonus=false,taskCount,obstaclesCount}={}){
  const preset=LEVELS.find(x=>x.id===level)||LEVELS[1];
  const rng=randomFactory(seed||"DEMO");
  const models=shuffled(LAYOUT_MODELS.filter(id=>id!=="bonus"),rng).slice(0,normInt(taskCount??preset.tasks,1,7));
  if(includeBonus)models.push("bonus");
  const slots=shuffled(SLOTS,rng);
  if(models.length>SLOTS.length)throw Error("Không đủ vị trí cho các mô hình.");
  const tasks=models.map((id,i)=>({id,slot:slots[i].id,angle:[0,90,180,270][Math.floor(rng()*4)]}));
  const used=new Set(tasks.map(t=>t.slot));
  const obstacles=slots.filter(s=>!used.has(s.id)).slice(0,normInt(obstaclesCount??preset.obstacles,0,SLOTS.length-models.length)).map(s=>s.id);
  return {id:"layout-"+Date.now().toString(36),level:preset.id,seed:String(seed||"DEMO"),tasks,obstacles,created:new Date().toISOString(),official:false};
}
export function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
export function normalizeData(data){
  if(!data||typeof data!=="object"||data.version!==VERSION||!Array.isArray(data.teams)||!Array.isArray(data.invention)||!Array.isArray(data.battles)||!Array.isArray(data.layouts))throw Error("File JSON không đúng định dạng dữ liệu ENJOY AI v1.");
  return {...initialData(),...data,rounds:normInt(data.rounds,1,20),bonusEnabled:!!data.bonusEnabled};
}