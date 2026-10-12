import {INV_DIVISIONS,BATTLE_DIVISIONS,invRank,battleRanking,battleOutcome,battleSideScore,escapeHtml} from "./core.mjs";
const E=escapeHtml;
const fmt=v=>Number.isFinite(Number(v))?new Intl.NumberFormat("vi-VN",{maximumFractionDigits:3}).format(Number(v)):"—";
const nameOf=(t)=>E(t.name||"");
const shortDivision=(id)=>({p13:"Lớp 1–3",p46:"Lớp 4–6",m79:"Lớp 7–9",h1012:"Lớp 10–12",primary:"Tiểu học",middle:"THCS"})[id]||id;
function emblem(kind){
 const trophy='<path d="M7 4h10v6a5 5 0 0 1-10 0V4ZM7 6H4v3a4 4 0 0 0 4 4m9-7h3v3a4 4 0 0 1-4 4M12 15v5m-4 1h8"/>';
 const sword='<path d="M2 3l14 14m-7 3 4-4M2 3v5h5M22 3L8 17m7 3-4-4M22 3v5h-5"/>';
 return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(kind==="battle"?sword:trophy)+'</svg>';
}
function tabs(choices,selected,attr){
 return '<nav class="leaderboard-tabs" role="tablist" aria-label="Lọc bảng thi">'+choices.map(x=>
 '<button type="button" role="tab" aria-selected="'+(x.id===selected)+'" class="lb-tab'+(x.id===selected?" is-selected":"")+'" '+attr+'="'+E(x.id)+'"><span class="lb-tab-label">'+E(x.label)+'</span></button>'
 ).join("")+'</nav>';
}
function hero(kind,subtitle){
 return '<header class="scoreboard-header"><div class="scoreboard-title-block"><div class="scoreboard-eyebrow"><span class="scoreboard-live-dot"></span> V+ STEAM LAB <span>/</span> ENJOY AI 2026</div>'+
  '<h2>'+ (kind==="battle"?"Battle of Stars":"Inventions Trail") +'</h2>'+
  '<p>'+E(subtitle)+'</p><div class="scoreboard-header-tags"><span>SEASON 2026</span><span>XẾP HẠNG THEO BẢNG THI</span></div></div>'+
  '<div class="scoreboard-graphic" aria-hidden="true"><div class="scoreboard-graphic-ring ring-one"></div><div class="scoreboard-graphic-ring ring-two"></div><div class="scoreboard-graphic-medal">'+emblem(kind)+'</div><span class="scoreboard-graphic-word">V+</span></div></header>';
}
function summaryCards(items,kind,active,data){
 const total=items.length,competing=items.filter(t=>(kind==="battle"?t.played:t.finished)>0).length;
 const completed=kind==="battle"?
  data.battles.filter(m=>m.status==="done"&&m.stage==="group"&&items.some(t=>t.id===m.redId||t.id===m.blueId)).length:
  items.reduce((a,t)=>a+t.finished,0);
 return '<div class="scoreboard-kpis">'+
   [['TỔNG SỐ ĐỘI',total,'users'],['ĐÃ THI ĐẤU',competing,'check'],[kind==="battle"?'TRẬN ĐÃ CHẤM':'LƯỢT ĐÃ CHẤM',completed,'flag'],['BẢNG ĐANG XEM',active,'tag']].map(([label,value,icon])=>
   '<div class="scoreboard-kpi"><small>'+E(label)+'</small><strong class="'+(icon==="tag"?"scoreboard-kpi-label":"")+'">'+E(value)+'</strong><span class="scoreboard-kpi-symbol '+icon+'" aria-hidden="true">'+({users:"◎",check:"✓",flag:"▣",tag:"⌁"})[icon]+'</span></div>'
 ).join("")+'</div>';
}
function searchBar(){
 return '<div class="scoreboard-toolbar"><div class="scoreboard-search"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>'+
 '<input type="search" id="scoreboard-search" placeholder="Tìm tên đội, trường, mã đội..." aria-label="Tìm đội trong bảng xếp hạng" autocomplete="off"></div>'+
 '<span class="scoreboard-toolbar-hint">Kết quả đã chấm · Không xếp hạng chéo bảng</span><span id="scoreboard-search-status" role="status" aria-live="polite"></span></div>';
}
function statusTag(done,total,label){
 return '<span class="scoreboard-status '+(done===0?"status-pending":done>=total?"status-done":"status-progress")+'">'+(done===0?"Chưa thi":done>=total?"Hoàn thành":label)+'</span>';
}
function rankBadge(rank){
 if(rank==null)return '<span class="scoreboard-rank rank-unranked">—</span>';
 return '<span class="scoreboard-rank'+(rank<=3?" rank-top-"+rank:"")+'">'+rank+'</span>';
}
const keys=t=>E([t.name,t.school,t.code,t.group].filter(Boolean).join(" ").toLocaleLowerCase("vi"));
function divisionOverviewCard(items,div,kind){
 const ranked=items.filter(t=>t.rank!=null).sort((a,b)=>a.rank-b.rank);
 const leader=ranked[0];
 const groups=[...new Set(items.map(t=>t.group||"A"))];
 return '<article class="scoreboard-division-card"><div class="scoreboard-division-card-head"><span class="scoreboard-category">'+E(shortDivision(div.id))+'</span><span>'+items.length+' đội</span></div>'+
   '<h3>'+E(div.label)+'</h3>'+
   (kind==="battle"?
 '<div class="scoreboard-division-best"><div class="scoreboard-first-icon" aria-hidden="true">≡</div><div class="scoreboard-first-data"><small>NHÓM THI ĐẤU</small><strong>'+groups.length+' nhóm đã đăng ký</strong><span>Thứ hạng tính riêng từng nhóm</span></div><b>'+ranked.length+' <small>đội đã có hạng</small></b></div>':
 leader?'<div class="scoreboard-division-best"><div class="scoreboard-first-icon" aria-hidden="true">Ⅰ</div><div class="scoreboard-first-data"><small>ĐANG DẪN ĐẦU</small><strong>'+nameOf(leader)+'</strong><span>'+E(leader.school||leader.group||"")+'</span></div><b>'+fmt(leader.points)+' <small>điểm</small></b></div>':
 '<div class="scoreboard-division-noresults">Chưa có kết quả thi đấu để xếp hạng.</div>')+
   '<div class="scoreboard-division-footer"><span>'+ranked.length+' đội có thứ hạng</span><button type="button" '+(kind==="battle"?"data-battle-tab":"data-inv-tab")+'="'+E(div.id)+'">Xem bảng <span aria-hidden="true">→</span></button></div></article>';
}
function podium(items){
 const leaders=items.filter(t=>t.rank!=null).sort((a,b)=>a.rank-b.rank).slice(0,3);
 if(!leaders.length)return '<div class="scoreboard-empty"><span class="scoreboard-empty-icon" aria-hidden="true">☆</span><strong>Chưa có Top 3</strong><p>Thành tích sẽ xuất hiện ngay khi các đội có kết quả chấm hợp lệ.</p></div>';
 const layout=[leaders[1],leaders[0],leaders[2]];
 return '<div class="scoreboard-podium" aria-label="Ba đội dẫn đầu">'+layout.map((t,i)=>{
  if(!t)return '<div class="scoreboard-podium-slot placeholder" aria-hidden="true"></div>';
  const first=i===1;
  return '<div class="scoreboard-podium-slot'+(first?" is-champion":"")+'">'+
   '<div class="scoreboard-podium-crown" aria-hidden="true">'+(first?'♛':'✦')+'</div>'+
   '<div class="scoreboard-podium-name">'+nameOf(t)+'</div><div class="scoreboard-podium-school">'+E(t.school||t.group||"")+'</div>'+
   '<div class="scoreboard-podium-score">'+fmt(t.points)+' <small>điểm</small></div>'+
   '<div class="scoreboard-podium-step step-'+t.rank+'"><span>HẠNG</span><strong>'+t.rank+'</strong></div></div>';
 }).join("")+'</div>';
}
function invTable(items,rounds){
 return '<div class="scoreboard-table-wrap"><table class="scoreboard-table"><thead><tr><th>Hạng</th><th>Đội thi</th><th>Bảng thi</th>'+
  Array.from({length:rounds},(_,i)=>'<th class="num">L'+(i+1)+'</th>').join("")+
  '<th class="num">Tổng điểm</th><th class="num">Thời gian</th><th class="num">Retry</th><th>Trạng thái</th></tr></thead><tbody>'+
  items.map(t=>'<tr class="scoreboard-searchable'+(t.rank===1?" scoreboard-leading-row":"")+'" data-search="'+keys(t)+'"><td>'+rankBadge(t.rank)+'</td>'+
  '<td><div class="scoreboard-team-cell"><span class="scoreboard-team-monogram">'+E((t.name||"?").trim().slice(0,1).toLocaleUpperCase("vi"))+'</span><span><strong>'+nameOf(t)+'</strong><small>'+E(t.school||t.code||"—")+'</small></span></div></td>'+
  '<td><span class="scoreboard-category">'+E(shortDivision(t.division))+'</span></td>'+
  t.byRound.map(v=>'<td class="num">'+(v===null||v===undefined?"—":fmt(v))+'</td>').join("")+
  '<td class="num scoreboard-score-value">'+fmt(t.points)+'</td><td class="num">'+(t.finished?fmt(t.time)+'s':"—")+'</td><td class="num">'+t.retries+'</td>'+
  '<td>'+statusTag(t.finished,rounds,t.finished+'/'+rounds+' lượt')+'</td></tr>').join("")+'</tbody></table></div>';
}
function invMobile(items,rounds){
 return '<div class="scoreboard-mobile-list">'+items.map(t=>
  '<article class="scoreboard-mobile-row scoreboard-searchable" data-search="'+keys(t)+'"><div class="scoreboard-mobile-rank">'+rankBadge(t.rank)+'</div>'+
  '<div class="scoreboard-mobile-main"><strong>'+nameOf(t)+'</strong><small>'+E(t.school||shortDivision(t.division))+'</small>'+
  '<span>'+statusTag(t.finished,rounds,t.finished+'/'+rounds+' lượt')+'</span></div><div class="scoreboard-mobile-value"><strong>'+fmt(t.points)+'</strong><small>điểm</small></div></article>'
 ).join("")+'</div>';
}
function battleTable(items){
 return '<div class="scoreboard-table-wrap"><table class="scoreboard-table"><thead><tr><th>Hạng</th><th>Đội thi</th><th>Nhóm</th><th class="num">Trận</th><th class="num">Thắng–Hòa–Thua</th><th class="num">Điểm trận</th><th class="num">Điểm nhiệm vụ</th><th class="num">Tháp</th><th class="num">Retry</th></tr></thead><tbody>'+
 items.map(t=>'<tr class="scoreboard-searchable'+(t.rank===1?" scoreboard-leading-row":"")+'" data-search="'+keys(t)+'"><td>'+rankBadge(t.rank)+'</td>'+
 '<td><div class="scoreboard-team-cell"><span class="scoreboard-team-monogram">'+E((t.name||"?").trim().slice(0,1).toLocaleUpperCase("vi"))+'</span><span><strong>'+nameOf(t)+'</strong><small>'+E(t.school||t.code||"—")+'</small></span></div></td>'+
 '<td><span class="scoreboard-category">'+E(t.group||"A")+'</span></td><td class="num">'+t.played+'</td>'+
 '<td class="num">'+t.wins+' / '+t.draws+' / '+t.losses+'</td>'+
 '<td class="num scoreboard-score-value">'+fmt(t.points)+'</td><td class="num">'+fmt(t.total)+'</td><td class="num">'+t.towers+'</td><td class="num">'+t.retries+'</td></tr>').join("")+'</tbody></table></div>';
}
function battleMobile(items){
 return '<div class="scoreboard-mobile-list">'+items.map(t=>
 '<article class="scoreboard-mobile-row scoreboard-searchable" data-search="'+keys(t)+'"><div class="scoreboard-mobile-rank">'+rankBadge(t.rank)+'</div>'+
 '<div class="scoreboard-mobile-main"><strong>'+nameOf(t)+'</strong><small>'+E(t.school||"Nhóm "+(t.group||"A"))+'</small><span class="scoreboard-mobile-results">'+t.wins+' thắng · '+t.draws+' hòa · '+t.losses+' thua</span></div>'+
 '<div class="scoreboard-mobile-value"><strong>'+fmt(t.points)+'</strong><small>điểm trận</small></div></article>'
 ).join("")+'</div>';
}
function rankingSection(items,label,kind,rounds,showPodium){
 const played=items.filter(t=>(kind==="battle"?t.played:t.finished)>0).length;
 return '<section class="scoreboard-ranking-section"><div class="scoreboard-ranking-heading"><div><span class="scoreboard-kicker">'+(kind==="battle"?"BẢNG ĐỐI KHÁNG":"BẢNG THÀNH TÍCH")+'</span><h3>'+E(label)+'</h3>'+
 '<p>'+items.length+' đội tham gia · '+played+' đội đã thi</p></div><span class="scoreboard-section-count">'+played+'/'+items.length+'</span></div>'+
 (showPodium?podium(items):"")+
 '<div class="scoreboard-table-caption"><div><span class="scoreboard-table-marker"></span><strong>Thứ hạng chi tiết</strong></div><span>'+items.length+' đội</span></div>'+
 (kind==="battle"?battleTable(items)+battleMobile(items):invTable(items,rounds)+invMobile(items,rounds))+
 (!items.length?'<p class="scoreboard-no-entries">Chưa có đội tham gia bảng này.</p>':"")+'</section>';
}
function battleKnockout(matches,teams){
 const finals=matches.filter(m=>m.stage==="final");
 if(!finals.length)return '<section class="scoreboard-ranking-section knockout-section"><div class="scoreboard-ranking-heading"><div><span class="scoreboard-kicker">VÒNG ĐẤU</span><h3>Vòng loại trực tiếp</h3></div></div><div class="scoreboard-no-entries">Chưa có trận loại trực tiếp.</div></section>';
 return '<section class="scoreboard-ranking-section knockout-section"><div class="scoreboard-ranking-heading"><div><span class="scoreboard-kicker">VÒNG ĐẤU</span><h3>Vòng loại trực tiếp</h3></div><span class="scoreboard-section-count">'+finals.length+' trận</span></div>'+
 '<div class="scoreboard-table-wrap"><table class="scoreboard-table"><thead><tr><th>Trận</th><th>Đỏ</th><th>Xanh</th><th class="num">Điểm</th><th>Kết quả</th></tr></thead><tbody>'+
 finals.map((m,i)=>{const x=battleOutcome(m);return '<tr><td>#'+(i+1)+'</td><td>'+E(teams.find(t=>t.id===m.redId)?.name||"—")+'</td><td>'+E(teams.find(t=>t.id===m.blueId)?.name||"—")+'</td>'+
 '<td class="num">'+fmt(battleSideScore(m.red))+' : '+fmt(battleSideScore(m.blue))+'</td><td>'+E(m.status!=="done"?"Chưa hoàn tất":x.winner?(teams.find(t=>t.id===x.winner)?.name||"Thắng"):"Cần phân định")+'</td></tr>';}).join("")+'</tbody></table></div></section>';
}
export function renderInventionLeaderboard(data,selected="all"){
 const all=invRank(data.teams,data.invention,data.rounds,data.bonusEnabled);
 const valid=selected==="all"||INV_DIVISIONS.some(d=>d.id===selected)?selected:"all";
 const displayed=valid==="all"?all:all.filter(t=>t.division===valid);
 const title=INV_DIVISIONS.find(d=>d.id===valid)?.label||"Tất cả bảng thi";
 return '<div class="scoreboard-shell">'+hero("invention","Thành tích thi đấu, tổng điểm và thứ hạng từng bảng học sinh.")+
 summaryCards(displayed,"invention",title,data)+tabs([{id:"all",label:"Chung · tất cả"},...INV_DIVISIONS],valid,"data-inv-tab")+
 searchBar()+'<div class="scoreboard-results">'+
 (valid==="all"?'<div class="scoreboard-overview-head"><div><span class="scoreboard-kicker">TỔNG QUAN KẾT QUẢ</span><h3>Thành tích từng bảng thi</h3><p>Xếp hạng độc lập; không so sánh điểm giữa các cấp lớp.</p></div></div>'+
 '<div class="scoreboard-division-grid">'+INV_DIVISIONS.map(d=>divisionOverviewCard(all.filter(t=>t.division===d.id),d,"invention")).join("")+'</div>'+
 INV_DIVISIONS.map(d=>rankingSection(all.filter(t=>t.division===d.id),d.label,"invention",data.rounds,false)).join(""):
 rankingSection(displayed,title,"invention",data.rounds,true))+
 '</div></div>';
}
export function renderBattleLeaderboard(data,selected="all",group="all"){
 const all=battleRanking(data.teams,data.battles);
 const valid=selected==="all"||BATTLE_DIVISIONS.some(d=>d.id===selected)?selected:"all";
 const byDiv=valid==="all"?all:all.filter(t=>t.division===valid);
 const allGroups=[...new Set(byDiv.map(t=>t.group||"A"))].sort((a,b)=>a.localeCompare(b,"vi"));
 const validGroup=group==="all"||allGroups.includes(group)?group:"all";
 const filtered=validGroup==="all"?byDiv:byDiv.filter(t=>(t.group||"A")===validGroup);
 const title=BATTLE_DIVISIONS.find(d=>d.id===valid)?.label||"Tất cả bảng thi";
 const groupChoices=valid==="all"?[]:allGroups;
 return '<div class="scoreboard-shell">'+hero("battle","Bảng đấu, điểm trận và kết quả đối kháng theo từng nhóm.")+
 summaryCards(filtered,"battle",title,data)+tabs([{id:"all",label:"Chung · tất cả"},...BATTLE_DIVISIONS],valid,"data-battle-tab")+
 (groupChoices.length>1?'<div class="scoreboard-group-filters"><span>NHÓM</span>'+
  [{id:"all",label:"Tất cả"},...groupChoices.map(id=>({id,label:"Nhóm "+id}))].map(x=>'<button type="button" data-battle-group="'+E(x.id)+'" aria-pressed="'+(validGroup===x.id)+'">'+E(x.label)+'</button>').join("")+'</div>':"")+
 searchBar()+'<div class="scoreboard-results">'+
 (valid==="all"?'<div class="scoreboard-overview-head"><div><span class="scoreboard-kicker">TỔNG QUAN KẾT QUẢ</span><h3>Bảng thi & nhóm thi đấu</h3><p>Điểm vòng bảng được tính độc lập theo từng nhóm; thắng 3 điểm, hòa 1 điểm và thua 0 điểm.</p></div></div>'+
 '<div class="scoreboard-division-grid">'+BATTLE_DIVISIONS.map(d=>divisionOverviewCard(all.filter(t=>t.division===d.id),d,"battle")).join("")+'</div>':"")+
 ([...new Set(filtered.map(t=>t.division+"|"+(t.group||"A")))].sort().map(id=>{
  const [division,groupId]=id.split("|");
  return rankingSection(filtered.filter(t=>t.division===division&&(t.group||"A")===groupId),
    (BATTLE_DIVISIONS.find(d=>d.id===division)?.label||division)+" · Nhóm "+groupId,"battle",0,valid!=="all");
 }).join("")||'<div class="scoreboard-no-entries">Chưa có đội thi cho lựa chọn này.</div>')+
 battleKnockout(data.battles.filter(m=>valid==="all"||m.division===valid),data.teams)+'</div></div>';
}
