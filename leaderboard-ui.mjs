import {INV_DIVISIONS,BATTLE_DIVISIONS,invRank,battleRanking,battleOutcome,battleSideScore,escapeHtml} from "./core.mjs";
const E=escapeHtml;
const escapeNum=(v)=>Number.isFinite(Number(v))?new Intl.NumberFormat("vi-VN",{maximumFractionDigits:3}).format(Number(v)):"—";
const pill=(text,type="")=>'<span class="lb-tag '+type+'">'+E(text)+'</span>';
function tabs(choices,selected,attr){
 return '<div class="leaderboard-tabs" role="tablist" aria-label="Chọn bảng thi">'+
  choices.map(x=>'<button type="button" role="tab" aria-selected="'+(x.id===selected)+'" class="lb-tab'+(x.id===selected?" is-selected":"")+'" '+attr+'="'+E(x.id)+'">'+E(x.label)+'</button>').join("")+
  '</div>';
}
function stats(items,active,kind){
 const total=items.length;
 const finished=kind==="invention"?items.filter(t=>t.finished>0).length:items.filter(t=>t.played>0).length;
 const sum=kind==="invention"?items.reduce((a,b)=>a+b.finished,0):items.reduce((a,b)=>a+b.played,0);
 return '<div class="lb-stats"><div><small>Tổng đội</small><strong>'+total+'</strong></div>'+
 '<div><small>Đã thi</small><strong>'+finished+'</strong></div>'+
 '<div><small>'+(kind==="invention"?"Lượt đã chấm":"Trận đã ghi nhận")+'</small><strong>'+sum+'</strong></div>'+
 '<div><small>Đang xem</small><strong class="lb-stat-label">'+E(active)+'</strong></div></div>';
}
function podium(items,mode){
 const top=items.filter(t=>t.rank!=null).sort((a,b)=>a.rank-b.rank).slice(0,3);
 if(!top.length)return '<div class="lb-empty">Chưa có kết quả chính thức để hiển thị Top 3.</div>';
 return '<div class="lb-podium" aria-label="Ba đội dẫn đầu">'+top.map((t,i)=>
  '<div class="lb-podium-card lb-podium-'+(i+1)+'">'+
    '<span class="lb-medal">'+["Ⅰ","Ⅱ","Ⅲ"][i]+'</span><small>Hạng '+t.rank+'</small>'+
    '<strong>'+E(t.name)+'</strong><span class="lb-podium-school">'+E(t.school||t.group||"")+'</span>'+
    '<b>'+escapeNum(mode==="invention"?t.points:t.points)+' <small>điểm</small></b></div>'
 ).join("")+'</div>';
}
function invTable(items,rounds){
 return '<div class="table-wrap lb-table-wrap"><table class="table lb-table"><thead><tr>'+
  '<th>Hạng</th><th>Đội thi</th><th>Bảng thi</th>'+
  Array.from({length:rounds},(_,i)=>'<th class="num">L'+(i+1)+'</th>').join("")+
  '<th class="num">Tổng điểm</th><th class="num">Thời gian (s)</th><th class="num">Retry</th><th>Tiến độ</th></tr></thead><tbody>'+
  items.map(t=>'<tr class="'+(t.rank&&t.rank<=3?"lb-top-row":"")+'">'+
   '<td>'+rankCell(t.rank)+'</td>'+
   '<td><div class="lb-team-name">'+E(t.name)+'</div><small>'+E(t.school||t.code||"")+'</small></td>'+
   '<td>'+pill(INV_DIVISIONS.find(d=>d.id===t.division)?.label||t.division)+'</td>'+
   t.byRound.map(v=>'<td class="num">'+(v??"—")+'</td>').join("")+
   '<td class="num lb-points">'+escapeNum(t.points)+'</td>'+
   '<td class="num">'+(t.finished?escapeNum(t.time):"—")+'</td>'+
   '<td class="num">'+t.retries+'</td>'+
   '<td>'+pill(t.finished+"/"+rounds+" lượt",t.finished>=rounds?"complete":"")+'</td></tr>').join("")+
 '</tbody></table>'+(items.length?"":'<div class="lb-empty">Chưa có đội thi ở bảng này.</div>')+'</div>';
}
function rankCell(rank){
 if(rank==null)return '<span class="lb-rank-muted">—</span>';
 return '<span class="lb-rank'+(rank<=3?" lb-rank-"+rank:"")+'">'+rank+'</span>';
}
function invSection(items,division,rounds,showPodium){
 return '<section class="lb-division"><div class="lb-section-header"><div><h3>'+E(division.label)+'</h3>'+
 '<p>'+items.length+' đội · '+items.filter(t=>t.finished>0).length+' đội đã thi</p></div>'+pill("Xếp hạng độc lập")+'</div>'+
 (showPodium?podium(items,"invention"):"")+invTable(items,rounds)+'</section>';
}
export function renderInventionLeaderboard(data,selected="all"){
 const all=invRank(data.teams,data.invention,data.rounds,data.bonusEnabled);
 const valid=selected==="all"||INV_DIVISIONS.some(d=>d.id===selected)?selected:"all";
 const filter=valid==="all"?all:all.filter(t=>t.division===valid);
 const label=INV_DIVISIONS.find(d=>d.id===valid)?.label||"Tổng quan";
 return '<div class="lb-shell"><div class="lb-hero"><div><span class="lb-eyebrow">V+ STEAM LAB · ENJOY AI 2026</span>'+
 '<h2>Bảng xếp hạng Invention</h2><p>Theo dõi điểm từng lượt, thứ hạng và tiến độ của từng bảng thi.</p></div>'+
 '<span class="lb-hero-symbol" aria-hidden="true">V+</span></div>'+
 stats(filter,label,"invention")+tabs([{id:"all",label:"Chung · tất cả"},...INV_DIVISIONS],valid,"data-inv-tab")+
 '<div class="lb-content">'+(valid==="all"?
 '<p class="lb-note">Mỗi bảng thi được xếp hạng <strong>độc lập</strong>; không so sánh điểm số giữa các cấp lớp.</p>'+
 INV_DIVISIONS.map(d=>invSection(all.filter(t=>t.division===d.id),d,data.rounds,false)).join("") :
 invSection(filter,INV_DIVISIONS.find(d=>d.id===valid),data.rounds,true))+
 '</div></div>';
}
function battleTable(items){
 return '<div class="table-wrap lb-table-wrap"><table class="table lb-table"><thead><tr><th>Hạng</th><th>Đội</th>'+
 '<th>Nhóm</th><th class="num">Trận</th><th class="num">Thắng/Hòa/Thua</th>'+
 '<th class="num">Điểm trận</th><th class="num">Điểm nhiệm vụ</th><th class="num">Tháp</th><th class="num">Retry</th></tr></thead><tbody>'+
 items.map(t=>'<tr class="'+(t.rank&&t.rank<=3?"lb-top-row":"")+'"><td>'+rankCell(t.rank)+'</td>'+
 '<td><div class="lb-team-name">'+E(t.name)+'</div><small>'+E(t.school||t.code||"")+'</small></td>'+
 '<td>'+pill(t.group||"A")+'</td><td class="num">'+t.played+'</td>'+
 '<td class="num">'+t.wins+' / '+t.draws+' / '+t.losses+'</td>'+
 '<td class="num lb-points">'+t.points+'</td><td class="num">'+t.total+'</td>'+
 '<td class="num">'+t.towers+'</td><td class="num">'+t.retries+'</td></tr>').join("")+
 '</tbody></table>'+(items.length?"":'<div class="lb-empty">Chưa có đội thi.</div>')+'</div>';
}
function battleSections(items,divisionLabel){
 const groups=[...new Set(items.map(t=>t.group||"A"))].sort((a,b)=>a.localeCompare(b,"vi"));
 return groups.map(g=>{
  const selected=items.filter(t=>(t.group||"A")===g);
  return '<section class="lb-division"><div class="lb-section-header"><div><h3>'+E(divisionLabel)+' · Nhóm '+E(g)+'</h3>'+
  '<p>'+selected.length+' đội · '+selected.reduce((a,b)=>a+b.played,0)/2+' trận đã hoàn thành</p></div>'+
  pill("3 – 1 – 0")+'</div>'+podium(selected,"battle")+battleTable(selected)+'</section>';
 }).join("");
}
function knockout(matches,teams){
 const finals=matches.filter(m=>m.stage==="final");
 return '<section class="lb-division"><div class="lb-section-header"><h3>Vòng loại trực tiếp</h3>'+pill(finals.length+" trận")+'</div>'+
 '<div class="table-wrap lb-table-wrap"><table class="table lb-table"><thead><tr><th>#</th><th>Đội Đỏ</th><th>Đội Xanh</th><th class="num">Điểm Đỏ / Xanh</th><th>Kết quả</th></tr></thead><tbody>'+
 finals.map((m,i)=>{const o=battleOutcome(m);return '<tr><td>#'+(i+1)+'</td><td>'+E(teams.find(t=>t.id===m.redId)?.name||"—")+'</td>'+
 '<td>'+E(teams.find(t=>t.id===m.blueId)?.name||"—")+'</td><td class="num">'+battleSideScore(m.red)+' / '+battleSideScore(m.blue)+'</td>'+
 '<td>'+pill(m.status!=="done"?"Chưa hoàn tất":o.winner?(teams.find(t=>t.id===o.winner)?.name||"Thắng"):"Cần phân định",o.winner?"complete":"")+'</td></tr>';}).join("")+
 '</tbody></table>'+(finals.length?"":'<div class="lb-empty">Chưa có trận loại trực tiếp.</div>')+'</div></section>';
}
export function renderBattleLeaderboard(data,selected="all"){
 const all=battleRanking(data.teams,data.battles);
 const valid=selected==="all"||BATTLE_DIVISIONS.some(d=>d.id===selected)?selected:"all";
 const filtered=valid==="all"?all:all.filter(t=>t.division===valid);
 const label=BATTLE_DIVISIONS.find(d=>d.id===valid)?.label||"Tổng quan";
 return '<div class="lb-shell"><div class="lb-hero"><div><span class="lb-eyebrow">V+ STEAM LAB · ENJOY AI 2026</span>'+
 '<h2>Bảng xếp hạng Battle</h2><p>Điểm trận, bảng đấu và vòng loại trực tiếp cập nhật theo kết quả đã chấm.</p></div>'+
 '<span class="lb-hero-symbol" aria-hidden="true">V+</span></div>'+
 stats(filtered,label,"battle")+tabs([{id:"all",label:"Chung · tất cả"},...BATTLE_DIVISIONS],valid,"data-battle-tab")+
 '<div class="lb-content"><p class="lb-note">Mỗi nhóm vòng bảng xếp hạng độc lập; thắng 3 điểm, hòa 1 điểm và thua 0 điểm.</p>'+
 (valid==="all"?BATTLE_DIVISIONS.map(d=>battleSections(all.filter(t=>t.division===d.id),d.label)).join("") :
 battleSections(filtered,BATTLE_DIVISIONS.find(d=>d.id===valid)?.label||valid))+
 knockout(data.battles.filter(m=>valid==="all"||m.division===valid),data.teams)+'</div></div>';
}
