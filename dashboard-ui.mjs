import {INV_DIVISIONS,BATTLE_DIVISIONS,invRank,escapeHtml} from "./core.mjs";
const V=escapeHtml;
const paths={
 shuffle:'<path d="m17 3 4 4-4 4M3 17h3c6 0 7-10 13-10h2M17 21l4-4-4-4M3 7h3c2.3 0 4 1.4 5.5 3.4M15 15c1 1.2 2.4 2 4 2h2"/>',
 clipboard:'<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4.5h6M9 11h6m-6 4h6"/><path d="m9 19 1.5 1 3-3"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 6a3 3 0 0 1 0 6M17 15a5 5 0 0 1 4 5"/>',
 flag:'<path d="M5 22V4m0 0c7-5 9 5 16 0v12c-7 5-9-5-16 0"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 chart:'<path d="M4 20h16M7 15V9m5 6V4m5 11V7"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 trophy:'<path d="M8 21h8m-4-4v4M7 4h10v6a5 5 0 0 1-10 0V4ZM7 6H4v3a4 4 0 0 0 4 4m9-7h3v3a4 4 0 0 1-4 4"/>',
 shield:'<path d="m12 22-8-4V6l8-4 8 4v12z"/><path d="m9 12 2 2 4-4"/>'
};
function ico(name,cls=""){
 return '<svg class="'+cls+'" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[name]+'</svg>';
}
const pct=(done,total)=>Math.max(0,Math.min(100,total?Math.round(100*done/total):0));
function metric(label,value,sub,icon,tone){
 return '<div class="dashboard-metric metric-'+tone+'"><div class="metric-top"><span>'+V(label)+'</span>'+
  '<span class="metric-icon">'+ico(icon)+'</span></div><strong>'+V(value)+'</strong><small>'+V(sub)+'</small></div>';
}
function progress(label,value,max,note){
 return '<div class="dash-progress-item"><div class="dash-progress-top"><strong>'+V(label)+'</strong><span>'+value+'/'+max+'</span></div>'+
  '<div class="dash-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="'+Math.max(0,max)+'" aria-valuenow="'+value+'" aria-label="'+V(label)+'"><span style="width:'+pct(value,max)+'%"></span></div>'+
  '<small>'+V(note)+'</small></div>';
}
function divisionSummary(rank){
 return INV_DIVISIONS.map(div=>{
  const entries=rank.filter(t=>t.division===div.id),done=entries.filter(t=>t.finished>0);
  const leader=done.length?done[0]:null;
  return '<div class="dash-division-row"><span class="dash-division-label">'+V(div.label)+'</span>'+
   '<span class="dash-division-leader">'+(leader?V(leader.name):'<span class="muted">Chưa có kết quả</span>')+'</span>'+
   '<span class="dash-division-score">'+(leader?leader.points+' điểm':'—')+'</span></div>';
 }).join("");
}
export function renderDashboard(data){
 const invention=data.teams.filter(t=>t.type==="invention");
 const battle=data.teams.filter(t=>t.type==="battle");
 const invDone=data.invention.filter(e=>e.status==="done").length;
 const battlesDone=data.battles.filter(e=>e.status==="done").length;
 const rank=invRank(data.teams,data.invention,data.rounds,data.bonusEnabled);
 const totalInvSlots=invention.length*data.rounds;
 const verification=Object.values(data.placementApprovals||{}).filter(Boolean).length;
 return '<div class="dashboard">'+
 '<section class="dashboard-hero">'+
  '<div class="dashboard-hero-inner"><div class="dashboard-hero-label"><span class="live-indicator"></span> COMPETITION CONTROL CENTER <span class="hero-separator">/</span> 2026</div>'+
  '<h2>Quản lý cuộc thi.<br><span>Chính xác trong từng lượt chạy.</span></h2>'+
  '<p>Tạo đề Inventions Trail, chấm điểm Battle of Stars và theo dõi toàn bộ kết quả từ một không gian làm việc.</p>'+
  '<div class="dashboard-hero-actions"><button class="btn btn-hero" data-go="random">'+ico("shuffle")+' Tạo đề mới '+ico("arrow","button-arrow")+'</button>'+
  '<button class="btn btn-hero-outline" data-go="invention">'+ico("clipboard")+' Chấm điểm Invention</button></div></div>'+
  '<div class="dashboard-hero-art" aria-hidden="true"><div class="hero-orbit outer-orbit"></div><div class="hero-orbit inner-orbit"></div><div class="hero-robot"><span class="robot-antenna"></span><span class="robot-face"><i></i><i></i></span><span class="robot-smile"></span></div><div class="hero-float float-1">07 <small>MISSIONS</small></div><div class="hero-float float-2">03 <small>OBSTACLES</small></div></div>'+
 '</section>'+
 '<section class="dashboard-metrics" aria-label="Chỉ số cuộc thi">'+
 metric("Đội tham gia",data.teams.length,invention.length+" Invention · "+battle.length+" Battle","users","blue")+
 metric("Lượt Invention",invDone,totalInvSlots+" lượt dự kiến","flag","cyan")+
 metric("Trận Battle",battlesDone,data.battles.length+" trận đã tạo","trophy","green")+
 metric("Đề ngẫu nhiên",data.layouts.length,verification+" hướng đặt đã kiểm tra","shuffle","violet")+
 '</section>'+
 '<div class="dashboard-section-heading"><div><span class="dash-kicker">TRUNG TÂM THAO TÁC</span><h3>Chọn khu vực làm việc</h3></div></div>'+
 '<section class="dashboard-workflows">'+
  '<div class="dashboard-workflow workflow-invention"><div class="workflow-type">'+ico("shuffle")+' INVENTIONS TRAIL</div><h3>Random đề & chấm điểm</h3>'+
  '<p>7 mô hình, 3 vật cản và hướng đặt được xác minh theo cấu hình luyện tập.</p>'+
  '<div class="workflow-bottom"><button class="workflow-link" data-go="random">Mở Random đề '+ico("arrow")+'</button><button class="workflow-secondary" data-go="teams-invention">Quản lý đội</button></div>'+
  '<div class="workflow-decoration" aria-hidden="true">01</div></div>'+
  '<div class="dashboard-workflow workflow-battle"><div class="workflow-type">'+ico("shield")+' BATTLE OF STARS</div><h3>Đối kháng & xếp hạng</h3>'+
  '<p>Chấm hai đội cùng lúc, xử lý trận đấu và theo dõi thành tích từng bảng.</p>'+
  '<div class="workflow-bottom"><button class="workflow-link" data-go="battle">Vào bàn chấm '+ico("arrow")+'</button><button class="workflow-secondary" data-go="battle-ranking">Xem xếp hạng</button></div>'+
  '<div class="workflow-decoration" aria-hidden="true">02</div></div></section>'+
 '<section class="dashboard-bottom-grid">'+
  '<div class="dashboard-surface"><div class="dashboard-card-head"><div><span class="dash-kicker">THÀNH TÍCH</span><h3>Dẫn đầu theo từng bảng Invention</h3></div><button class="text-link" data-go="ranking">Xem xếp hạng '+ico("arrow")+'</button></div>'+
   '<div class="dash-division-list">'+divisionSummary(rank)+'</div></div>'+
  '<div class="dashboard-surface"><div class="dashboard-card-head"><div><span class="dash-kicker">TIẾN ĐỘ</span><h3>Tình trạng chấm điểm</h3></div>'+ico("chart")+'</div>'+
  '<div class="dash-progress-list">'+
    progress("Inventions Trail",invDone,totalInvSlots,"Lượt đã hoàn tất trên tổng lượt dự kiến")+
    progress("Battle of Stars",battlesDone,data.battles.length,"Trận đã hoàn tất trên tổng trận tạo")+
    '<p class="dash-storage-note">'+ico("clock")+' Dữ liệu tự lưu trên trình duyệt này. Chưa đồng bộ giữa các thiết bị.</p></div></div>'+
 '</section></div>';
}
