import {MODEL_META,WALL_MODES} from "./placement.mjs?v=20261012-wall-modes-v1";
import {teamUi,readTeamFields} from "./teams-ui.mjs";
import {renderArena,modelPicture,angleName,modelPopup} from "./arena-ui.mjs?v=20261012-wall-modes-v1";
import {INV_DIVISIONS,BATTLE_DIVISIONS,TASKS,LAYOUT_NAMES,SLOTS,LEVELS,initialData,normInt,invScore,invRank,battleSideScore,battleEligible,validateBattleSide,battleOutcome,battleRanking,generateLayout,escapeHtml,normalizeData} from "./core.mjs?v=20261012-wall-modes-v1";

const KEY="enjoy-ai-2026-competition-desk-v1";
const V=escapeHtml;
let data=readData();
let page="overview";
let autoSeedSequence=0;
const ui={editTeam:"",invTeam:"",invRound:1,invDivision:"all",battleId:"",layoutId:"",layoutLevel:"medium",layoutSeed:"",layoutBonus:false,wallMode:"normal"};
const names={overview:"Tổng quan giải đấu",teams:"Đội Invention","teams-invention":"Đội Inventions Trail","teams-battle":"Đội Battle of Stars",invention:"Chấm điểm · Inventions Trail",ranking:"Xếp hạng · Inventions Trail",random:"Random đề Invention",battle:"Chấm điểm · Battle of Stars","battle-ranking":"Xếp hạng · Battle of Stars",settings:"Dữ liệu & hướng dẫn"};
const $=s=>document.querySelector(s);
const all=s=>Array.from(document.querySelectorAll(s));
const el=$('#content');
function readData(){try{const saved=localStorage.getItem(KEY);return saved?normalizeData(JSON.parse(saved)):initialData();}catch(e){console.warn("Cannot load stored data",e);return initialData();}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){notify("Không thể lưu dữ liệu trên trình duyệt. Hãy xuất JSON và kiểm tra bộ nhớ.",true);}}
function notify(message,error=false){$('#alert').innerHTML='<div class="toast'+(error?' error':'')+'">'+V(message)+'</div>';window.scrollTo({top:0,behavior:"smooth"});}
function field(id,label,value,kind="text",attrs=""){return '<div class="field"><label for="'+V(id)+'">'+V(label)+'</label><input id="'+V(id)+'" type="'+V(kind)+'" value="'+V(value??"")+'" '+attrs+'></div>';}
function selectField(id,label,choices,selected,attrs=""){return '<div class="field"><label for="'+V(id)+'">'+V(label)+'</label><select id="'+V(id)+'" '+attrs+'>'+choices.map(c=>'<option value="'+V(c.id)+'"'+(String(c.id)===String(selected)?' selected':'')+'>'+V(c.label)+'</option>').join("")+'</select></div>';}
function taskLabel(id){const t=TASKS.find(t=>t.id===id);return t?t.name:LAYOUT_NAMES[id]||id;}
function findTeam(id){return data.teams.find(t=>t.id===id);}
function displayTeam(id){const t=findTeam(id);return t?V(t.name):"—";}
function badge(text,variant=""){return '<span class="tag '+variant+'">'+V(text)+'</span>';}
function title(name,desc,actions=""){return '<div class="section-heading"><div><h2>'+V(name)+'</h2><p class="muted">'+desc+'</p></div><div class="action-row">'+actions+'</div></div>';}
function prettyStatus(status){return status==="done"?badge("Đã chấm","green"):status==="draft"?badge("Đang chấm","amber"):status==="invalid"?badge("Hủy điểm","red"):status==="withdrawn"?badge("Bỏ cuộc","red"):badge("Chưa chấm");}
function download(name,content,type="text/plain;charset=utf-8"){const a=document.createElement("a");const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function exportJson(){download("enjoy-ai-2026-backup-"+new Date().toISOString().slice(0,10)+".json",JSON.stringify(data,null,2),"application/json");}
function csvValue(s){const v=String(s??"");return '"'+v.replaceAll('"','""')+'"';}
function exportCsv(rows,filename){download(filename,"\ufeff"+rows.map(row=>row.map(csvValue).join(",")).join("\r\n"),"text/csv;charset=utf-8");}
function uid(prefix){return prefix+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);}
function safeNumber(value,max){if(value===""||value==null)return 0;return normInt(value,0,max);}
function go(next){page=next;all(".nav-button").forEach(n=>n.classList.toggle("selected",n.dataset.page===page));$('#page-title').textContent=names[page];$('#alert').innerHTML="";render();window.scrollTo(0,0);}
function render(){
  const views={overview:renderOverview,teams:()=>renderTeams("invention"),"teams-invention":()=>renderTeams("invention"),"teams-battle":()=>renderTeams("battle"),invention:renderInvention,ranking:renderRanking,random:renderRandom,battle:renderBattle,"battle-ranking":renderBattleRanking,settings:renderSettings};
  el.innerHTML=(views[page]||renderOverview)();
  bindDynamic();
}
function renderOverview(){
  const invs=data.invention.filter(e=>e.status==="done");
  const battles=data.battles.filter(m=>m.status==="done");
  const leading=invRank(data.teams,data.invention,data.rounds,data.bonusEnabled).filter(x=>x.points>0).slice(0,5);
  return '<div class="kpi-grid">'+
    '<div class="kpi purple"><span class="kpi-label">Tổng đội thi</span><strong>'+data.teams.length+'</strong><small>Cả Invention và Battle</small></div>'+
    '<div class="kpi"><span class="kpi-label">Lượt Invention đã chấm</span><strong>'+invs.length+'</strong><small>'+data.rounds+' lượt/đội được cấu hình</small></div>'+
    '<div class="kpi"><span class="kpi-label">Trận Battle đã chấm</span><strong>'+battles.length+'</strong><small>'+data.battles.length+' trận đã tạo</small></div>'+
    '<div class="kpi"><span class="kpi-label">Đề Invention đã tạo</span><strong>'+data.layouts.length+'</strong><small>Có thể tái tạo bằng seed</small></div></div>'+
    '<div class="grid-2"><div class="panel"><div class="panel-top"><h3>Bảng xếp hạng Invention</h3><button class="btn btn-outline btn-small" data-go="ranking">Xem tất cả →</button></div>'+
    (leading.length?'<div class="table-wrap"><table class="table"><thead><tr><th>Đội</th><th>Bảng thi</th><th class="num">Tổng điểm</th></tr></thead><tbody>'+leading.map(t=>'<tr><td><strong>'+V(t.name)+'</strong></td><td>'+V((INV_DIVISIONS.find(d=>d.id===t.division)||{}).label||t.division)+'</td><td class="num max">'+t.points+'</td></tr>').join("")+'</tbody></table></div>':'<div class="empty"><strong>Chưa có kết quả</strong>Thêm đội và chấm ít nhất một lượt để hiển thị.</div>')+
    '</div><div class="panel"><h3>Thao tác nhanh</h3><p class="muted">Toàn bộ dữ liệu được tự động lưu trên trình duyệt này. Các thiết bị khác không tự đồng bộ.</p><div class="action-row"><button class="btn" data-go="invention">Chấm Invention</button><button class="btn btn-soft" data-go="battle">Chấm Battle</button><button class="btn btn-outline" data-go="random">Tạo đề ngẫu nhiên</button></div><div class="panel-note">Invention: 150 giây/lượt. Battle: 180 giây/trận. Nhiệm vụ để trống = không đạt; thời gian phải có khi hoàn tất chấm.</div></div></div>'+
    '<div class="grid-equal"><div class="panel"><h3>Inventions Trail</h3><p class="muted">7 mô hình nhiệm vụ, trong đó In chữ rời chấm riêng hai khối ENJ và YAI. Tổng điểm tối đa 430 điểm khi chưa áp dụng Bonus; mức thưởng chạy lại được tính tự động.</p><a href="https://www.enjoyaigreece.gr/en/enjoy-ai-2026-inventions-trail/" target="_blank" rel="noopener">Xem luật tham khảo ↗</a></div><div class="panel"><h3>Battle of Stars</h3><p class="muted">Hai đội tranh tài. Hệ thống tính điểm từng bên, kiểm tra điều kiện thắng tức thì và phân định vòng bảng/vòng loại trực tiếp theo đúng thứ tự tiêu chí.</p><a href="https://www.enjoyaigreece.gr/en/enjoy-ai-2026-battle-of-stars/" target="_blank" rel="noopener">Xem luật Battle ↗</a></div></div>';
}
function renderTeams(type="invention"){return teamUi(data.teams,type,ui.editTeam);}
function invDefault(team,round){return {id:uid("inv"),teamId:team,round,tasks:{},retries:0,smooth:false,time:"",status:"draft",note:""};}
function getInv(team,round){return data.invention.find(e=>e.teamId===team&&e.round===round)||invDefault(team,round);}
function ensureInv(team,round){let x=data.invention.find(e=>e.teamId===team&&e.round===round);if(!x){x=invDefault(team,round);data.invention.push(x);}return x;}
function renderInvention(){
  const teams=data.teams.filter(t=>t.type==="invention");
  if(teams.length&&!teams.some(t=>t.id===ui.invTeam))ui.invTeam=teams[0].id;
  const t=findTeam(ui.invTeam);
  const e=t?getInv(ui.invTeam,ui.invRound):null;
  let s=title("Phiếu chấm Invention","Mỗi đội có từ 1 đến 20 lượt. Lưu nháp tự động; không nhập nhiệm vụ tức là 0 điểm.",'<button class="btn btn-outline" data-go="ranking">Bảng xếp hạng →</button>');
  s+='<div class="panel"><div class="form-grid">'+selectField("inv-team","Chọn đội",teams.map(x=>({id:x.id,label:x.name})),ui.invTeam)+selectField("inv-round","Lượt thi",Array.from({length:data.rounds},(_,i)=>({id:i+1,label:"Lượt "+(i+1)})),ui.invRound)+field("round-count","Số lượt thi (1–20)",data.rounds,"number","min=1 max=20")+'<div class="field"><label>Trạng thái</label><div style="padding-top:11px">'+(e?prettyStatus(data.invention.find(x=>x.teamId===e.teamId&&x.round===e.round)?.status):badge("Chưa chấm"))+'</div></div></div></div>';
  if(!t)return s+'<div class="panel empty"><strong>Chưa có đội Invention</strong>Thêm đội tại Quản lý đội thi trước khi chấm.<p><button class="btn" data-go="teams-invention">Thêm đội</button></p></div>';
  s+='<div class="panel"><div class="panel-top"><h3>Kiểm tra nhiệm vụ – '+V(t.name)+'</h3>'+badge("Tối đa "+(data.bonusEnabled?"530":"430")+" điểm")+'</div>'+
   '<div class="task-grid">'+TASKS.filter(task=>!task.optional||data.bonusEnabled).map(task=>'<label class="check-pill"><input type="checkbox" data-inv-task="'+task.id+'" '+(e.tasks[task.id]?"checked":"")+'><span><strong>'+V(task.name)+'</strong><small>'+V(task.detail)+'</small></span><b>+'+task.points+'</b></label>').join("")+'</div>'+
   '<div class="form-grid">'+field("inv-retries","Số lần chạy lại (trống = 0)",e.retries,"number","min=0 max=999 step=1")+field("inv-time","Thời gian thực tế (giây) *",e.time,"number","min=1 max=150 step=1")+
   '<div class="field"><label>Thưởng 0 lần chạy lại</label><label class="check-pill" style="min-height:41px;padding:8px 12px"><input id="inv-smooth" type="checkbox" '+(e.smooth?"checked":"")+'><span><strong>Robot chạy trơn tru, liên tục</strong></span></label></div>'+
   '<div class="field"><label>Thưởng chạy lại tự động</label><strong style="font-size:23px;color:#7452c7;padding:8px">'+(e.retries===0?(e.smooth?40:0):Math.max(0,40-10*e.retries))+' điểm</strong></div></div>'+
   '<div class="field"><label for="inv-note">Ghi chú trọng tài</label><textarea id="inv-note" rows="2">'+V(e.note||"")+'</textarea></div>'+
   '<div class="score-summary"><div><small>Tổng điểm tạm tính</small><strong>'+invScore(e,data.bonusEnabled)+' <span style="font-size:14px">điểm</span></strong></div><div><small>'+V(t.name)+'</small><strong style="font-size:15px">Lượt '+e.round+' / '+data.rounds+'</strong></div></div>'+
   '<div class="action-row"><button class="btn" data-final-inv="done">HOÀN TẤT CHẤM</button><button class="btn btn-outline" data-final-inv="draft">Lưu nháp</button><button class="btn btn-danger" data-final-inv="invalid">Hủy điểm lượt</button><button class="btn btn-outline" data-final-inv="withdrawn">Bỏ cuộc</button><button class="btn btn-outline" data-print>In phiếu</button></div>'+'<div class="print-signatures"><h3>XÁC NHẬN ĐIỂM / SCORE CONFIRMATION</h3><p>Tôi xác nhận các điểm số ghi trên là chính xác, hợp lệ và phản ánh đúng kết quả của trận đấu.</p><div class="signature-grid"><div>Thành viên đội thi / Team members<br><br><br>Ký tên: ____________________</div><div>Trọng tài / Referee<br><br><br>Ký tên: ____________________</div><div>Trọng tài trưởng / Chief referee<br><br><br>Ký tên: ____________________</div><div>Thư ký / Scorekeeper<br><br><br>Ký tên: ____________________</div></div></div>'+'<div class="panel-note">Theo Mục 6.3: không chạy lại và hoạt động trơn tru = 40 điểm; 1/2/3 lần chạy lại = 30/20/10 điểm; từ 4 lần = 0 điểm. Dù không hoàn thành nhiệm vụ, vẫn cần thời gian để xác nhận một lượt đã chấm.</div></div>';
  return s;
}
function renderRanking(){
  const ranked=invRank(data.teams,data.invention,data.rounds,data.bonusEnabled).filter(x=>ui.invDivision==="all"||x.division===ui.invDivision);
  const rows=ranked.map(t=>'<tr><td>'+(t.rank??"—")+'</td><td><strong>'+V(t.name)+'</strong></td><td>'+V(INV_DIVISIONS.find(d=>d.id===t.division)?.label||t.division)+'</td>'+t.byRound.map(v=>'<td class="num">'+(v??"—")+'</td>').join("")+'<td class="num max">'+t.points+'</td><td class="num">'+(t.finished?t.time:"—")+'</td><td class="num">'+t.retries+'</td><td class="num">'+t.best+'</td><td>'+t.finished+"/"+data.rounds+'</td></tr>').join("");
  return title("Bảng xếp hạng Invention","Ưu tiên: tổng điểm ↓, tổng thời gian ↑, tổng số lần chạy lại ↑, điểm cao nhất một lượt ↓. Đội 0 điểm không xếp hạng.",'<button class="btn btn-outline" data-export-ranking>↓ CSV</button>')+
    '<div class="panel"><div class="form-grid two">'+selectField("inv-division","Lọc bảng thi",[{id:"all",label:"Tất cả bảng"},...INV_DIVISIONS],ui.invDivision)+'<div class="field"><label>Số lượt đang áp dụng</label><strong style="padding:11px">'+data.rounds+' lượt / đội</strong></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Hạng</th><th>Đội</th><th>Bảng thi</th>'+Array.from({length:data.rounds},(_,i)=>'<th class="num">L'+(i+1)+'</th>').join("")+'<th class="num">Tổng</th><th class="num">Giây</th><th class="num">Retry</th><th class="num">Lượt tốt nhất</th><th>Đã chấm</th></tr></thead><tbody>'+rows+'</tbody></table>'+(rows?"":'<div class="empty">Chưa có dữ liệu đội thi.</div>')+'</div></div>';
}
function renderMap(layout){return renderArena(layout,data.mapImage||"https://d2ol7oe51mr4n9.cloudfront.net/user_3JNDYQ5PZuMnwdk0qFlQVt5Q5Hf/ed5dc29c-27c0-4906-8c95-36ab419c033d.jpg");}
function renderRandom(){
  const layout=data.layouts.find(l=>l.id===ui.layoutId)||data.layouts[0];
  if(layout){ui.layoutId=layout.id;ui.wallMode=layout.wallMode||"normal";}
  let s=title("Tạo đề Invention ngẫu nhiên","Các cấp độ là mẫu luyện tập do hệ thống đề xuất, không phải số lượng nhiệm vụ bắt buộc của BTC.",'<button class="btn btn-outline" data-print>In sơ đồ</button>');
  s+='<div class="panel"><div class="form-grid">'+selectField("layout-level","Cấp độ luyện tập",LEVELS.map(l=>({id:l.id,label:l.name+' · '+l.division})),ui.layoutLevel)+field("layout-seed","Seed cố định (tùy chọn)",ui.layoutSeed,"text","placeholder='Dùng nút Tạo lại theo seed'")+'<div class="field"><label>Nhiệm vụ chính</label><strong class="fixed-layout-count">7 nhiệm vụ</strong></div><div class="field"><label>Vật cản</label><strong class="fixed-layout-count">3 vật cản</strong></div>'+'</div><div class="wall-mode-row">'+selectField("layout-wall-mode","Vạn Lý Trường Thành – hướng lắp",WALL_MODES,ui.wallMode)+'<p class="muted">Giữ nguyên, đảo 180° hoặc random hai hướng. Chỉ áp dụng Tường Thành; 6 nhiệm vụ khác và vật cản hoạt động bình thường.</p></div><label class="check-pill" style="max-width:430px;min-height:47px"><input type="checkbox" id="layout-bonus" '+(ui.layoutBonus?"checked":"")+(!data.bonusEnabled?" disabled":"")+'><span><strong>Thêm nhiệm vụ Bonus</strong><small>'+(data.bonusEnabled?"Đã được bật trong phần Dữ liệu & hướng dẫn":"BTC chưa xác nhận nhiệm vụ thưởng")+'</small></span></label>'+
    '<p class="muted">Nút “Tạo đề ngẫu nhiên mới” luôn tạo một mã seed mới. Để tái tạo bố trí, hãy nhập seed rồi chọn “Tạo lại theo seed”.</p><div class="action-row" style="margin-top:15px"><button class="btn" data-generate>⟳ Tạo đề ngẫu nhiên mới</button><button class="btn btn-soft" data-generate-seed>Tạo lại theo seed</button><button class="btn btn-outline" data-copy-layout '+(layout?"":"disabled")+'>Sao chép đề hiện tại</button><button class="btn btn-outline" data-export-layout '+(layout?"":"disabled")+'>↓ Xuất JSON đề</button><label class="btn btn-outline" style="cursor:pointer">↑ Tải ảnh sa bàn<input type="file" id="upload-map" accept="image/png,image/jpeg,image/webp" style="display:none"></label>'+(data.mapImage?'<button class="btn btn-outline" data-clear-map>Đổi về sơ đồ</button>':'')+'</div><div id="random-status" class="random-inline-status" role="status" aria-live="polite"></div></div>';
  return s+'<div id="random-results">'+renderRandomResults(layout)+'</div>';
}
function renderRandomResults(layout){
  let s='';
  if(!layout)return '<div class="panel"><div class="empty"><strong>Chưa có đề</strong>Chọn cấp độ, bấm “Tạo đề ngẫu nhiên mới” để sinh đủ 7 nhiệm vụ và 3 vật cản.</div>'+renderMap(null)+'</div>';
  if(![2,3].includes(layout.version))s+='<div class="panel-note warning">Đề cũ được lưu theo quy tắc trước đây, có thể chỉ có 5 nhiệm vụ và sử dụng sai vị trí vật cản. Hãy chọn “Tạo đề mới” để áp dụng chuẩn 7 nhiệm vụ + 3 vật cản tại O1–O9. Dữ liệu đề cũ không bị xóa.</div>';
  s+='<div class="panel"><div class="panel-top"><h3>Sa bàn ngẫu nhiên · '+V(LEVELS.find(x=>x.id===layout.level)?.name||layout.level)+'</h3><div class="action-row">'+badge("Seed: "+layout.seed)+badge("Tường Thành: "+(layout.tasks.find(t=>t.id==="wall")?.reversed?"Đảo 180°":"Không đảo"))+'<button class="btn btn-soft btn-small no-print" data-generate-board type="button" title="Random lại và giữ nguyên vị trí xem sa bàn">⟳ Random lại</button></div></div>'+renderMap(layout)+
     '<div class="panel-note warning">7 nhiệm vụ chính được đặt tại các khung nhiệm vụ A–J; 3 vật cản chỉ xuất hiện trong 9 ô chữ nhật nhỏ O1–O9 mà bạn đã đánh dấu. Mũi tên thể hiện hướng robot tiếp cận. Đây là phương án hình học bảo thủ; cần thử mô hình thật để xác nhận hướng tay gạt, vùng thao tác và khoảng trống. Luật chỉ quy định BTC công bố vị trí/hướng mô hình và vật cản trước thời gian chạy thử, không ấn định thuật toán phân cấp độ.</div></div>';
  s+='<div class="grid-2"><div class="panel"><h3>Phân bố mô hình</h3><div class="layout-list">'+layout.tasks.map(t=>'<div class="layout-model-item">'+modelPicture(t.id,false,Boolean(t.reversed))+'<span><b>'+t.slot+' · '+V(LAYOUT_NAMES[t.id])+'</b><br>Hướng tiếp cận: <b>'+t.angle+'° · '+V(angleName(t.angle))+'</b>'+(t.id==="wall"?'<br><strong class="wall-rotation-label">Hướng lắp: '+(t.reversed?"Đảo 180°":"Giữ nguyên")+'</strong>':"")+'<br><small>'+V(MODEL_META[t.id]?.guide||"")+'</small></span></div>').join("")+'</div><p class="muted" style="margin-top:15px">3 vị trí vật cản nhỏ: '+V(layout.obstacles.join(", ")||"Chưa có")+'</p></div>'+
    '<div class="panel"><h3>Đề đã tạo</h3><div class="field"><label for="selected-layout">Chọn lại đề đã lưu</label><select id="selected-layout">'+data.layouts.map((l,i)=>'<option value="'+V(l.id)+'"'+(l.id===layout.id?' selected':'')+'>#'+(data.layouts.length-i)+' · '+V(l.seed)+' · '+V(LEVELS.find(x=>x.id===l.level)?.name||l.level)+'</option>').join("")+'</select></div><p class="muted">Đề được lưu tự động trong trình duyệt và trong bản sao lưu JSON.</p><button class="btn btn-danger btn-small" data-delete-layout="'+V(layout.id)+'">Xóa đề này</button></div></div>';
  return s;
}
// Change the sa bàn and generated model list without rebuilding the controls or scrolling.
function refreshRandomResults(message="",error=false){
  const region=$('#random-results');
  if(!region){render();return;}
  const layout=data.layouts.find(l=>l.id===ui.layoutId)||data.layouts[0]||null;
  const fragment=document.createElement("div");
  fragment.innerHTML=renderRandomResults(layout);
  const oldArena=region.querySelector(".arena-board");
  const newArena=fragment.querySelector(".arena-board");
  if(oldArena&&newArena){
    const oldBackground=oldArena.querySelector(".arena-background");
    const newBackground=newArena.querySelector(".arena-background");
    if(oldBackground&&newBackground){
      if(oldBackground.getAttribute("src")!==newBackground.getAttribute("src"))oldBackground.setAttribute("src",newBackground.getAttribute("src"));
      for(const child of [...oldArena.children])if(child!==oldBackground)child.remove();
      for(const child of [...newArena.children])if(child!==newBackground)oldArena.appendChild(child);
      newArena.replaceWith(oldArena);
    }
  }
  region.replaceChildren(...fragment.childNodes);
  for(const selector of ["[data-copy-layout]","[data-export-layout]"]){
    const control=$(selector);
    if(control)control.disabled=!layout;
  }
  const wallSelect=$('#layout-wall-mode');
  if(wallSelect)wallSelect.value=ui.wallMode;
  const seedInput=$('#layout-seed');
  if(seedInput)seedInput.value=ui.layoutSeed;
  const status=$('#random-status');
  if(status){status.textContent=message;status.classList.toggle("error",error);}
}
function defaultSide(){return {tower:false,blocks:0,bins:[0,0,0,0],retries:0,fouls:0,smooth:false,instant:false,status:"draft"};}
function getBattle(id){return data.battles.find(m=>m.id===id);}
function battleTeamOptions(div){return data.teams.filter(t=>t.type==="battle"&&t.division===div).map(t=>({id:t.id,label:t.name+" · Nhóm "+(t.group||"A")}));}
function renderBattleSide(m,key,color){
  const side=m[key]||defaultSide(),label=color==="red"?"Đội Đỏ":"Đội Xanh";
  const team=color==="red"?m.redId:m.blueId;
  return '<div class="battle-team-card '+color+'"><h3><span class="label-'+color+'">'+label+'</span>'+badge(displayTeam(team))+'</h3>'+
   '<label class="check-pill" style="min-height:65px"><input type="checkbox" data-battle-field="'+key+'.tower" '+(side.tower?"checked":"")+'><span><strong>Thiên thạch · Meteorite Tower</strong><small>3 trụ xếp đúng thứ tự; nhiệm vụ tự động.</small></span><b>+100</b></label>'+
   '<div class="form-grid">'+field(key+"-blocks","Khối phòng thủ (0–8)",side.blocks,"number",'min=0 max=8 data-battle-field="'+key+'.blocks"')+
   field(key+"-retry","Lần chạy lại (gồm vi phạm)",side.retries,"number",'min=0 max=999 data-battle-field="'+key+'.retries"')+
   field(key+"-fouls","Lỗi 7.4: trừ 10đ/lỗi",side.fouls,"number",'min=0 max=999 data-battle-field="'+key+'.fouls"')+
   '<div class="field"><label>Thưởng 0 lần chạy lại</label><label class="check-pill" style="min-height:41px;padding:8px"><input type="checkbox" data-battle-field="'+key+'.smooth" '+(side.smooth?"checked":"")+'><span><strong>Chạy liên tục</strong></span></label></div></div>'+
   '<p class="muted" style="margin-bottom:3px">Full Firepower: số bóng đội đưa vào từng hộp giữa sân (tổng tối đa 8).</p>'+
   '<div class="bins">'+[0,1,2,3].map(i=>field(key+"-bin-"+i,"Hộp "+(i+1),side.bins?.[i]??0,"number",'min=0 max=8 data-battle-field="'+key+'.bins.'+i+'"')).join("")+'</div>'+
   '<div class="panel-note">'+(battleEligible(side)?'<span class="success">Đã đạt ba điều kiện để lấy bóng vàng.</span>':'Chưa đủ điều kiện lấy bóng vàng (cần tháp + ≥5 khối + ≥2 hộp, mỗi hộp ≥2 bóng của đội).')+'</div>'+
   '<label class="check-pill" style="min-height:58px"><input type="checkbox" data-battle-field="'+key+'.instant" '+(side.instant?"checked":"")+'><span><strong>Đã lấy bóng vàng hợp lệ → thắng ngay</strong><small>Chỉ đánh dấu sau khi trọng tài xác nhận.</small></span></label>'+
   '<div class="score-summary"><div><small>Tổng điểm '+label+'</small><strong>'+battleSideScore(side)+'</strong></div><div><small>Điểm Firepower</small><strong style="font-size:20px">'+side.bins.reduce((a,b)=>a+normInt(b),0)*15+'</strong></div></div></div>';
}
function renderBattle(){
  const battleTeams=data.teams.filter(t=>t.type==="battle");
  let m=getBattle(ui.battleId)||data.battles[0];if(m)ui.battleId=m.id;
  let s=title("Trọng tài Battle of Stars","Chấm song song đội Đỏ và Xanh. Vòng bảng: thắng 3đ, hòa 1đ, thua 0đ.",'<button class="btn btn-outline" data-go="battle-ranking">Xếp hạng Battle →</button>');
  s+='<div class="panel"><h3>Tạo trận đấu</h3><div class="form-grid">'+
    selectField("match-division","Bảng thi",BATTLE_DIVISIONS,ui.matchDivision||"primary")+
    selectField("match-stage","Giai đoạn",[{id:"group",label:"Vòng bảng"},{id:"final",label:"Vòng loại trực tiếp"}],"group")+
    selectField("match-red","Đội Đỏ",battleTeamOptions(ui.matchDivision||"primary"),"")+
    selectField("match-blue","Đội Xanh",battleTeamOptions(ui.matchDivision||"primary"),"")+
    '</div><div class="action-row"><button class="btn" data-create-match>+ Tạo trận</button><button class="btn btn-outline" data-create-roundrobin>Tạo lịch vòng tròn theo nhóm</button></div><p class="muted" style="margin-top:10px">Tạo lịch vòng tròn cho từng nhóm trong bảng thi đã chọn, tránh lặp những cặp đấu đã tồn tại.</p></div>';
  if(data.battles.length){
    s+='<div class="panel"><div class="form-grid two">'+selectField("selected-match","Trận đang chấm",data.battles.map((b,i)=>({id:b.id,label:"#"+(i+1)+" · "+(findTeam(b.redId)?.name||"?")+" vs "+(findTeam(b.blueId)?.name||"?")})),ui.battleId)+'<div class="field"><label>Trạng thái</label><div style="padding:11px">'+prettyStatus(m?.status)+'</div></div></div></div>';
  }
  if(!m)return s+'<div class="panel empty"><strong>Chưa có trận Battle</strong>Thêm tối thiểu hai đội Battle để tạo trận. <p><button class="btn" data-go="teams-battle">Quản lý đội</button></p></div>';
  s+='<div class="panel"><div class="panel-top"><h3>Trận · '+V(m.stage==="group"?"Vòng bảng":"Loại trực tiếp")+'</h3>'+badge("180 giây", "amber")+'</div>'+
    '<div class="battle-grid">'+renderBattleSide(m,"red","red")+renderBattleSide(m,"blue","blue")+'</div>'+
    '<div class="form-grid two">'+field("battle-time","Thời gian thi thực tế (giây) *",m.time,"number","min=1 max=180")+
    '<div class="field"><label for="battle-note">Ghi chú / Biên bản trọng tài</label><input id="battle-note" value="'+V(m.note||"")+'" placeholder="Lỗi, xử lý tranh chấp..."></div></div>'+
    '<div class="result-band">'+battleResultText(m)+'</div>'+
    '<div class="action-row" style="margin-top:15px"><button class="btn" data-final-battle="done">HOÀN TẤT CHẤM</button><button class="btn btn-outline" data-final-battle="draft">Lưu nháp</button><button class="btn btn-danger" data-final-battle="invalid">Hủy điểm trận</button><button class="btn btn-outline" data-print>In phiếu</button><button class="btn btn-danger btn-small" data-delete-battle="'+V(m.id)+'">Xóa trận</button></div>'+'<div class="print-signatures"><h3>XÁC NHẬN ĐIỂM / SCORE CONFIRMATION</h3><p>Tôi xác nhận các điểm số ghi trên là chính xác, hợp lệ và phản ánh đúng kết quả của trận đấu.</p><div class="signature-grid"><div>Thành viên đội thi / Team members<br><br><br>Ký tên: ____________________</div><div>Trọng tài / Referee<br><br><br>Ký tên: ____________________</div><div>Trọng tài trưởng / Chief referee<br><br><br>Ký tên: ____________________</div><div>Thư ký / Scorekeeper<br><br><br>Ký tên: ____________________</div></div></div>'+
    '<div class="panel-note warning">Lỗi 7.4: trừ 10 điểm và tính một lần retry. Nhập tổng retry bao gồm lần do vi phạm. Nếu loại trực tiếp vẫn hòa theo toàn bộ tiêu chí, cần trận phân định; hệ thống không tự chọn thắng thua.</div></div>';
  return s;
}
function battleResultText(m){
  const hypothetical={...m,status:"done"};
  const x=battleOutcome(hypothetical);
  if(x.kind==="error")return '<span class="danger">Cả hai đội cùng được đánh dấu thắng ngay: cần kiểm tra!</span>';
  if(x.winner)return '<span class="success">'+displayTeam(x.winner)+' đang thắng</span> · '+V(x.kind==="instant"?"Thắng ngay (Final Fortress)":x.kind==="tower"?"Phân định Thiên thạch":x.kind==="firepower"?"Phân định Firepower":x.kind==="retry"?"Ít retry hơn":"Điểm cao hơn");
  return x.kind==="draw"?"HÒA · Mỗi đội 1 điểm vòng bảng":x.kind==="tiebreak"?"Chưa phân thắng bại · Cần thi đấu phân định":"Chưa có kết quả";
}
function renderBattleRanking(){
  const ranks=battleRanking(data.teams,data.battles);
  const groups=[...new Set(ranks.map(t=>t.division+"|"+t.group))].sort();
  let s=title("Bảng xếp hạng Battle","Vòng bảng tính điểm trận 3–1–0; xếp hạng theo thắng đối đầu, tổng điểm nhiệm vụ, số lần hoàn thành tháp và tổng retry.",'<button class="btn btn-outline" data-export-battle-ranking>↓ CSV</button>');
  for(const group of groups){
    const [division,groupName]=group.split("|");
    const rows=ranks.filter(t=>t.division===division&&t.group===groupName).map(t=>'<tr><td>'+(t.rank??"—")+'</td><td><strong>'+V(t.name)+'</strong></td><td class="num">'+t.played+'</td><td class="num">'+t.wins+' / '+t.draws+' / '+t.losses+'</td><td class="num max">'+t.points+'</td><td class="num">'+t.directWins+'</td><td class="num">'+t.total+'</td><td class="num">'+t.towers+'</td><td class="num">'+t.retries+'</td></tr>').join("");
    s+='<div class="panel"><h3>'+V(BATTLE_DIVISIONS.find(d=>d.id===division)?.label||division)+' · Nhóm '+V(groupName)+'</h3><div class="table-wrap"><table class="table"><thead><tr><th>Hạng</th><th>Đội</th><th class="num">Trận</th><th class="num">T / H / B</th><th class="num">Điểm trận</th><th class="num">Thắng đối đầu</th><th class="num">Điểm nhiệm vụ</th><th class="num">Tháp</th><th class="num">Retry</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  }
  if(!groups.length)s+='<div class="panel empty">Chưa có đội Battle.</div>';
  const finals=data.battles.filter(m=>m.stage==="final");
  s+='<div class="panel"><h3>Vòng loại trực tiếp ('+finals.length+')</h3><div class="table-wrap"><table class="table"><thead><tr><th>Trận</th><th>Đỏ</th><th>Xanh</th><th class="num">Điểm Đỏ / Xanh</th><th>Kết quả</th></tr></thead><tbody>'+
     finals.map((m,i)=>{const o=battleOutcome(m);return '<tr><td>#'+(i+1)+'</td><td>'+displayTeam(m.redId)+'</td><td>'+displayTeam(m.blueId)+'</td><td class="num">'+battleSideScore(m.red)+' / '+battleSideScore(m.blue)+'</td><td>'+(m.status!=="done"?prettyStatus(m.status):o.winner?displayTeam(o.winner):badge("Cần phân định","amber"))+'</td></tr>';}).join("")+'</tbody></table>'+(finals.length?"":'<div class="empty">Chưa có trận loại trực tiếp.</div>')+'</div></div>';
  return s;
}
function renderSettings(){
  return title("Dữ liệu & quy định","Chấm điểm trên GitHub Pages chạy ở phía trình duyệt, không có tài khoản trọng tài hoặc đồng bộ liên thiết bị.")+
   '<div class="grid-equal"><div class="panel"><h3>Sao lưu và khôi phục</h3><p class="muted">Tự lưu dữ liệu sau mỗi thay đổi bằng localStorage trên máy hiện tại. Hãy sao lưu JSON định kỳ, đặc biệt trước khi xóa lịch sử trình duyệt.</p><div class="action-row"><button class="btn" data-backup>↓ Xuất dữ liệu JSON</button><label class="btn btn-outline" style="cursor:pointer">↑ Nhập JSON<input type="file" id="import-json" accept=".json,application/json" style="display:none"></label></div><div class="panel-note warning">Không sử dụng cùng lúc nhiều thiết bị/trọng tài để chấm chính thức nếu chưa có hệ thống đồng bộ máy chủ. Nhập JSON sẽ thay thế toàn bộ dữ liệu đang có (cần xác nhận).</div></div>'+
   '<div class="panel"><h3>Nhiệm vụ thưởng Invention</h3><label class="check-pill"><input id="bonus-enabled" type="checkbox" '+(data.bonusEnabled?"checked":"")+'><span><strong>BTC đã công bố nhiệm vụ thưởng</strong><small>100 điểm nếu hoàn thành, không bật mặc định.</small></span></label><div class="field" style="margin-top:12px"><label for="bonus-description">Nội dung / điều kiện nhiệm vụ Bonus</label><textarea id="bonus-description" placeholder="Chỉ ghi quy định BTC đã công bố">'+V(data.bonusDescription||"")+'</textarea></div></div></div>'+
   '<div class="panel"><h3>Cơ sở tính điểm</h3><div class="table-wrap"><table class="table"><thead><tr><th>Invention</th><th class="num">Điểm</th><th>Battle</th><th>Điều kiện</th></tr></thead><tbody>'+
   [['La bàn','50','Meteorite Tower','100 / tháp hợp lệ'],['Làm giấy','60','Energy Defense','10 / khối (≤8)'],['Thuốc súng','40','Full Firepower','15 / bóng (≤8)'],['In chữ rời','40 + 40','Final Fortress','Thắng ngay nếu đạt 3 điều kiện'],['Máy đo địa chấn','40','Bonus không retry','0–40 tùy điều kiện'],['Kim tự tháp','60','Lỗi 7.4','−10 / lỗi, tính retry'],['Vạn Lý Trường Thành','60','Thời gian','180 giây / trận'],['Bonus (nếu áp dụng)','100','Thể thức','Vòng bảng + loại trực tiếp']].map(row=>'<tr>'+row.map((cell,i)=>'<td'+(i===1?' class="num"':'')+'>'+V(cell)+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></div>'+
   '<div class="panel"><h3>Tham khảo</h3><p class="muted">Luật Invention: PDF tiếng Việt/Anh do người dùng cung cấp; Battle: tài liệu Battle of Stars 2026 từ trang Enjoy AI Greece. Khi BTC tại Việt Nam ban hành sửa đổi, cần đối chiếu và cập nhật cấu hình hệ thống.</p><p><a target="_blank" rel="noopener" href="https://www.enjoyaiglobal.org/resources">ENJOY AI Global 2026 ↗</a> · <a target="_blank" rel="noopener" href="https://www.enjoyaigreece.gr/en/enjoy-ai-2026-battle-of-stars/">Battle of Stars · Luật ↗</a> · <a target="_blank" rel="noopener" href="https://www.enjoyaigreece.gr/en/enjoy-ai-2026-inventions-trail/">Inventions Trail · Luật ↗</a></p></div>';
}
function bindDynamic(){
 const add=$('#add-team');
 if(add)add.addEventListener("submit",e=>{
  e.preventDefault();
  const type=page==="teams-battle"?"battle":"invention";
  const old=data.teams.find(t=>t.id===ui.editTeam&&t.type===type);
  const t=readTeamFields(type,old||{id:uid("team")});
  if(!t.name||!t.member1||!t.member2||!t.coach)return notify("Cần nhập đủ tên đội, 2 học sinh và huấn luyện viên.",true);
  if(data.teams.some(x=>x.id!==t.id&&x.type===t.type&&x.division===t.division&&x.name.toLowerCase()===t.name.toLowerCase()))return notify("Tên đội bị trùng trong cùng bảng.",true);
  if(old)Object.assign(old,t);else data.teams.push(t);
  ui.editTeam="";persist();render();notify("Đã lưu đội "+t.name+".");
 });
 const bdiv=$('#match-division');if(bdiv)bdiv.addEventListener("change",()=>{
  ui.matchDivision=bdiv.value;const options=battleTeamOptions(bdiv.value);
  for(const id of ["match-red","match-blue"]){const box=$('#'+id);box.innerHTML=options.map(x=>'<option value="'+V(x.id)+'">'+V(x.label)+'</option>').join("");}
  if(options.length>1)$('#match-blue').value=options[1].id;
 });
 if($('#match-blue')&&$('#match-blue').options.length>1&&$('#match-blue').value===$('#match-red').value)$('#match-blue').selectedIndex=1;
}
function updateInvFromControl(target){
  const e=ensureInv(ui.invTeam,ui.invRound);
  if(target.dataset.invTask)e.tasks[target.dataset.invTask]=target.checked;
  if(target.id==="inv-retries")e.retries=safeNumber(target.value,999);
  if(target.id==="inv-time")e.time=target.value===""?"":safeNumber(target.value,150);
  if(target.id==="inv-smooth")e.smooth=target.checked;
  if(target.id==="inv-note")e.note=target.value;
  e.status="draft";persist();render();
}
function updateBattleFromControl(target){
  const m=getBattle(ui.battleId);if(!m)return;
  const parts=target.dataset.battleField?.split(".");
  if(parts){
    const [side,property,index]=parts;
    if(property==="bins")m[side].bins[Number(index)]=safeNumber(target.value,8);
    else if(["tower","smooth","instant"].includes(property))m[side][property]=target.checked;
    else m[side][property]=safeNumber(target.value,property==="blocks"?8:999);
    if(property==="fouls"&&m[side].fouls>m[side].retries)m[side].retries=m[side].fouls;
  }
  if(target.id==="battle-time")m.time=target.value===""?"":safeNumber(target.value,180);
  if(target.id==="battle-note")m.note=target.value;
  m.status="draft";persist();render();
}
function addMatch(redId,blueId,stage,division){
  const red=findTeam(redId),blue=findTeam(blueId);
  if(!red||!blue||red.id===blue.id||red.division!==blue.division||red.type!=="battle"||blue.type!=="battle")throw Error("Chọn hai đội Battle khác nhau và cùng bảng thi.");
  if(stage==="group"&&red.group!==blue.group)throw Error("Trận vòng bảng yêu cầu hai đội cùng nhóm.");
  const match={id:uid("match"),redId,blueId,stage,division:division||red.division,group:red.group,time:"",note:"",red:defaultSide(),blue:defaultSide(),status:"draft"};
  data.battles.push(match);return match;
}
function showConfirm(question,action){
  const modal=$('#modal');modal.classList.remove("hidden");modal.innerHTML='<div class="modal-box" role="dialog" aria-modal="true"><h3>Xác nhận thao tác</h3><p>'+V(question)+'</p><div class="modal-actions"><button class="btn btn-outline" id="modal-cancel">Hủy</button><button class="btn btn-danger" id="modal-confirm">Tiếp tục</button></div></div>';
  $('#modal-cancel').onclick=()=>{modal.classList.add("hidden");modal.innerHTML="";};
  $('#modal-confirm').onclick=()=>{modal.classList.add("hidden");modal.innerHTML="";action();};
}
function nextRandomSeed(){
  // The counter ensures two clicks inside the same millisecond still create different seeds.
  autoSeedSequence++;
  return "VPLUS-"+Date.now().toString(36).toUpperCase()+"-"+autoSeedSequence.toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
}
function layoutSignature(layout){
  return JSON.stringify({tasks:layout.tasks.map(t=>[t.id,t.slot,t.angle,!!t.reversed]),obstacles:[...layout.obstacles].sort()});
}
function makeLayout(mode="random"){
  const level=$('#layout-level')?.value||ui.layoutLevel;
  const typedSeed=$('#layout-seed')?.value.trim()||"";
  const bonus=Boolean($('#layout-bonus')?.checked)&&data.bonusEnabled;
  const wallMode=$('#layout-wall-mode')?.value||ui.wallMode;
  if(mode==="seed"&&!typedSeed){refreshRandomResults("Nhập mã seed trước khi bấm “Tạo lại theo seed”.",true);return;}
  const previous=data.layouts.find(l=>l.id===ui.layoutId)||data.layouts[0];
  try{
    let seed=mode==="seed"?typedSeed:nextRandomSeed();
    let layout=generateLayout({level,seed,includeBonus:bonus,wallMode});
    // A new random request should not accidentally repeat the last visible arrangement.
    if(mode==="random"&&previous&&[2,3].includes(previous.version)){
      const oldSignature=layoutSignature(previous);
      for(let attempt=0;attempt<20&&layoutSignature(layout)===oldSignature;attempt++){
        seed=nextRandomSeed();
        layout=generateLayout({level,seed,includeBonus:bonus});
      }
      if(layoutSignature(layout)===oldSignature)throw Error("Không tìm được bố trí khác với giới hạn hiện tại. Hãy kiểm tra danh sách hướng/vị trí hợp lệ.");
    }
    layout.id=uid("layout");
    ui.layoutId=layout.id;
    ui.layoutLevel=level;
    ui.wallMode=wallMode;
    // An auto-generated seed must not persist in the editable input, otherwise every click repeats it.
    ui.layoutSeed=mode==="seed"?typedSeed:"";
    data.layouts.unshift(layout);
    persist();
    refreshRandomResults((mode==="seed"?"Đã tái tạo đề":"Đã random đề mới")+" với 7 nhiệm vụ, 3 vật cản. Seed: "+seed+".");
  }catch(error){refreshRandomResults(error?.message||"Không thể tạo đề hợp lệ.",true);}
}
function exportLayout(){const l=data.layouts.find(x=>x.id===ui.layoutId);if(l)download("invention-layout-"+l.seed+".json",JSON.stringify(l,null,2),"application/json");}
function copyLayout(){const l=data.layouts.find(x=>x.id===ui.layoutId);if(!l)return;const content="INVENTIONS TRAIL 2026\nSeed: "+l.seed+"\nCấp độ: "+l.level+"\nChế độ Tường Thành: "+(l.wallMode||"normal")+"\n"+l.tasks.map(t=>t.slot+": "+LAYOUT_NAMES[t.id]+" — "+t.angle+"°"+(t.id==="wall"?" — "+(t.reversed?"đảo 180°":"giữ nguyên"):"")).join("\n")+"\nVật cản: "+(l.obstacles.join(", ")||"Không");navigator.clipboard?.writeText(content).then(()=>notify("Đã sao chép đề."),()=>notify("Trình duyệt không cho phép sao chép; hãy xuất JSON.",true));}
el.addEventListener("change",e=>{
 const t=e.target;
 if(t.id==="inv-team"){ui.invTeam=t.value;render();return;}
 if(t.id==="inv-round"){ui.invRound=normInt(t.value,1,data.rounds);render();return;}
 if(t.id==="round-count"){
   const next=normInt(t.value,1,20),old=data.rounds;
   if(next===old)return;
   const affected=data.invention.filter(x=>x.round>next);
   if(next<old&&affected.length)return showConfirm("Giảm từ "+old+" xuống "+next+" lượt sẽ XÓA "+affected.length+" bản ghi thuộc các lượt bị bỏ. Bạn có muốn tiếp tục?",()=>{data.invention=data.invention.filter(x=>x.round<=next);data.rounds=next;ui.invRound=Math.min(ui.invRound,next);persist();render();});
   data.rounds=next;ui.invRound=Math.min(ui.invRound,next);persist();render();return;
 }
 if(t.dataset.invTask||["inv-retries","inv-time","inv-smooth","inv-note"].includes(t.id)){updateInvFromControl(t);return;}
 if(t.id==="inv-division"){ui.invDivision=t.value;render();return;}
 if(t.id==="layout-level"){ui.layoutLevel=t.value;return;}
 if(t.id==="layout-seed"){ui.layoutSeed=t.value;return;}
 if(t.id==="layout-bonus"){ui.layoutBonus=t.checked;return;}
 if(t.id==="layout-wall-mode"){ui.wallMode=t.value;return;}
 if(t.id==="selected-layout"){ui.layoutId=t.value;ui.wallMode=data.layouts.find(l=>l.id===t.value)?.wallMode||"normal";refreshRandomResults();return;}
 if(t.id==="selected-match"){ui.battleId=t.value;render();return;}
 if(t.dataset.battleField||["battle-time","battle-note"].includes(t.id)){updateBattleFromControl(t);return;}
 if(t.id==="bonus-enabled"){data.bonusEnabled=t.checked;persist();render();notify("Đã cập nhật trạng thái nhiệm vụ thưởng.");return;}
 if(t.id==="bonus-description"){data.bonusDescription=t.value;persist();return;}
 if(t.id==="upload-map"){const file=t.files?.[0];if(!file)return;if(file.size>2*1024*1024)return notify("Ảnh tối đa 2 MB để không vượt giới hạn bộ nhớ trình duyệt.",true);const reader=new FileReader();reader.onload=()=>{data.mapImage=reader.result;persist();refreshRandomResults("Đã cập nhật ảnh sa bàn.");};reader.onerror=()=>notify("Không đọc được ảnh.",true);reader.readAsDataURL(file);return;}
 if(t.id==="import-json"){
   const file=t.files?.[0];if(!file)return;
   file.text().then(raw=>{const imported=normalizeData(JSON.parse(raw));showConfirm("Nhập dữ liệu sẽ GHI ĐÈ toàn bộ đội thi, điểm số, đề và các trận đang lưu trên thiết bị. Bạn đã sao lưu dữ liệu hiện tại?",()=>{data=imported;ui.invTeam="";ui.battleId="";ui.layoutId="";persist();go("overview");notify("Khôi phục dữ liệu JSON thành công.");});}).catch(err=>notify(err.message,true));
 }
});
el.addEventListener("click",e=>{
 const t=e.target.closest("button");if(!t)return;
 if(t.dataset.go){ui.editTeam="";return go(t.dataset.go);}
 if(t.hasAttribute("data-export-teams"))return exportCsv([["Mã","Tên đội","Nội dung","Trường","Bảng thi","Nhóm","Học sinh 1","Học sinh 2","HLV","Ghi chú"],...data.teams.filter(x=>x.type===(page==="teams-battle"?"battle":"invention")).map(x=>[x.code,x.name,x.type,x.school,x.division,x.group,x.member1,x.member2,x.coach,x.note])],"enjoy-ai-teams.csv");
 if(t.hasAttribute("data-export-ranking"))return exportCsv([["Hạng","Đội","Bảng",...Array.from({length:data.rounds},(_,i)=>"Lượt "+(i+1)),"Tổng điểm","Tổng thời gian","Retry","Điểm tốt nhất"],...invRank(data.teams,data.invention,data.rounds,data.bonusEnabled).map(x=>[x.rank||"",x.name,x.division,...x.byRound.map(x=>x??""),x.points,x.time,x.retries,x.best])],"invention-ranking.csv");
 if(t.hasAttribute("data-export-battle-ranking"))return exportCsv([["Hạng","Đội","Bảng","Nhóm","Trận","Thắng","Hòa","Thua","Điểm trận","Thắng đối đầu","Tổng điểm nhiệm vụ","Tháp","Retry"],...battleRanking(data.teams,data.battles).map(x=>[x.rank||"",x.name,x.division,x.group,x.played,x.wins,x.draws,x.losses,x.points,x.directWins,x.total,x.towers,x.retries])],"battle-ranking.csv");
 if(t.hasAttribute("data-edit-team")){ui.editTeam=t.dataset.editTeam;render();window.scrollTo(0,0);return;}
 if(t.hasAttribute("data-cancel-edit")){ui.editTeam="";render();return;}
 if(t.hasAttribute("data-delete-team"))return showConfirm("Xóa đội này sẽ đồng thời xóa tất cả lượt chấm/trận Battle liên quan. Thao tác không thể hoàn tác nếu chưa sao lưu.",()=>{const id=t.dataset.deleteTeam;data.teams=data.teams.filter(x=>x.id!==id);data.invention=data.invention.filter(x=>x.teamId!==id);data.battles=data.battles.filter(x=>x.redId!==id&&x.blueId!==id);persist();render();});
 if(t.dataset.finalInv){
   if(!ui.invTeam)return;
   const entry=ensureInv(ui.invTeam,ui.invRound);
   if(t.dataset.finalInv==="done"&&(!Number(entry.time)||entry.time<1||entry.time>150))return notify("Phải nhập thời gian hợp lệ từ 1 đến 150 giây trước khi hoàn tất chấm.",true);
   const finish=()=>{entry.status=t.dataset.finalInv;persist();render();notify("Đã cập nhật trạng thái lượt thi.");};
   if(["invalid","withdrawn"].includes(t.dataset.finalInv))return showConfirm("Hủy kết quả hoặc bỏ cuộc sẽ không tính điểm lượt này. Tiếp tục?",finish);
   return finish();
 }
 if(t.hasAttribute("data-clear-map")){delete data.mapImage;persist();refreshRandomResults("Đã quay về ảnh sa bàn mặc định.");return;}
 if(t.dataset.mapSlot){
  const layout=data.layouts.find(x=>x.id===ui.layoutId)||data.layouts[0],p=layout?.tasks.find(x=>x.slot===t.dataset.mapSlot);
  if(!p)return;
  const modal=$('#modal');modal.classList.remove("hidden");modal.innerHTML=modelPopup(p);
  $('#close-model-popup').onclick=()=>{modal.classList.add("hidden");modal.innerHTML="";};
  return;
 }
 if(t.hasAttribute("data-generate")||t.hasAttribute("data-generate-board"))return makeLayout("random");
 if(t.hasAttribute("data-generate-seed"))return makeLayout("seed");
 if(t.hasAttribute("data-copy-layout"))return copyLayout();
 if(t.hasAttribute("data-export-layout"))return exportLayout();
 if(t.dataset.deleteLayout)return showConfirm("Xóa đề Invention đã lưu?",()=>{data.layouts=data.layouts.filter(l=>l.id!==t.dataset.deleteLayout);ui.layoutId=data.layouts[0]?.id||"";persist();refreshRandomResults("Đã xóa đề.");});
 if(t.hasAttribute("data-create-match")){
   try{const m=addMatch($('#match-red').value,$('#match-blue').value,$('#match-stage').value,$('#match-division').value);ui.battleId=m.id;persist();render();notify("Đã tạo trận đấu.");}catch(err){notify(err.message,true);}return;
 }
 if(t.hasAttribute("data-create-roundrobin")){
   const division=$('#match-division').value;let added=0;
   const groupNames=[...new Set(data.teams.filter(x=>x.type==="battle"&&x.division===division).map(x=>x.group||"A"))];
   for(const group of groupNames){const teams=data.teams.filter(x=>x.type==="battle"&&x.division===division&&(x.group||"A")===group);for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++){
     if(data.battles.some(m=>m.stage==="group"&&((m.redId===teams[i].id&&m.blueId===teams[j].id)||(m.redId===teams[j].id&&m.blueId===teams[i].id))))continue;
     addMatch(teams[i].id,teams[j].id,"group",division);added++;
   }}
   if(added){ui.battleId=data.battles[data.battles.length-1].id;persist();render();}
   notify("Đã thêm "+added+" cặp đấu vòng tròn (không tạo trùng).");return;
 }
 if(t.dataset.finalBattle){
   const m=getBattle(ui.battleId);if(!m)return;
   if(t.dataset.finalBattle==="done"){
     if(!Number(m.time)||m.time<1||m.time>180)return notify("Phải nhập thời gian hợp lệ từ 1 đến 180 giây.",true);
     for(const side of [m.red,m.blue]){const err=validateBattleSide(side);if(err)return notify(err,true);}
     const out=battleOutcome({...m,status:"done"});
     if(["error","tiebreak"].includes(out.kind))return notify(out.kind==="error"?"Hai đội không thể cùng thắng ngay.":"Trận loại trực tiếp vẫn hòa: cần thi đấu phân định trước khi hoàn tất.",true);
   }
   const finish=()=>{m.status=t.dataset.finalBattle;persist();render();notify("Đã lưu kết quả trận đấu.");};
   if(t.dataset.finalBattle==="invalid")return showConfirm("Hủy điểm cả trận Battle này?",finish);
   return finish();
 }
 if(t.dataset.deleteBattle)return showConfirm("Xóa vĩnh viễn trận Battle đã chọn?",()=>{data.battles=data.battles.filter(m=>m.id!==t.dataset.deleteBattle);ui.battleId=data.battles[0]?.id||"";persist();render();});
 if(t.hasAttribute("data-print"))return window.print();
 if(t.hasAttribute("data-backup"))return exportJson();
});
$('#navigation').addEventListener("click",e=>{const t=e.target.closest("[data-page]");if(t)go(t.dataset.page);});
$('#export-top').addEventListener("click",exportJson);
render();