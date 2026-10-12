import {INV_DIVISIONS,BATTLE_DIVISIONS,escapeHtml} from "./core.mjs";
const E=escapeHtml;
const fld=(name,label,value="",required=false,options="")=>'<div class="field"><label for="team-'+name+'">'+E(label)+'</label><input id="team-'+name+'" value="'+E(value)+'" '+(required?"required":"")+' maxlength="180" '+options+'></div>';
const sel=(name,label,values,current)=>'<div class="field"><label for="team-'+name+'">'+E(label)+'</label><select id="team-'+name+'">'+values.map(x=>'<option value="'+E(x.id)+'"'+(x.id===current?' selected':'')+'>'+E(x.label)+'</option>').join("")+'</select></div>';
export function teamUi(teams,type,editingId){
 const isBattle=type==="battle",list=teams.filter(x=>x.type===type),old=list.find(x=>x.id===editingId);
 const participants=(old?.members||"").split(/[,;\n]/).map(s=>s.trim()).filter(Boolean);
 const names=[old?.member1||participants[0]||"",old?.member2||participants[1]||""];
 const divisionOptions=isBattle?BATTLE_DIVISIONS:INV_DIVISIONS;
 let view='<div class="section-heading"><div><h2>'+E(isBattle?"Đội Battle of Stars":"Đội Inventions Trail")+'</h2><p class="muted">Quản lý '+(isBattle?"đội đối kháng, nhóm vòng bảng":"đội thi theo cấp lớp")+', mỗi đội gồm <strong>2 học sinh và 1 huấn luyện viên</strong> theo luật năm 2026.</p></div><button class="btn btn-outline" data-export-teams>↓ Xuất CSV</button></div>';
 view+='<div class="panel"><div class="panel-top"><h3>'+(old?"Chỉnh sửa đội "+E(old.name):"Đăng ký đội "+(isBattle?"Battle":"Invention"))+'</h3>'+(old?'<button class="btn btn-outline btn-small" data-cancel-edit>Hủy chỉnh sửa</button>':"")+'</div>';
 view+='<form id="add-team" class="form-grid team-form">'+
   fld("code","Mã đội",old?.code||"")+fld("name","Tên đội *",old?.name||"",true)+fld("school","Trường / đơn vị",old?.school||"")+
   sel("division","Bảng thi",divisionOptions,old?.division||divisionOptions[0].id)+
   (isBattle?fld("group","Nhóm vòng bảng (A, B, C...)",old?.group||"A",true):"")+
   fld("member1","Học sinh 1 *",names[0],true)+fld("member2","Học sinh 2 *",names[1],true)+
   fld("coach","Huấn luyện viên *",old?.coach||"",true)+fld("note","Ghi chú",old?.note||"")+
   '<div class="field"><label>&nbsp;</label><button type="submit" class="btn">'+(old?"Lưu thay đổi":"+ Thêm đội")+'</button></div></form></div>';
 view+='<div class="roster-shortcuts"><div class="roster-shortcuts-copy"><span class="roster-shortcuts-label">QUẢN LÝ DANH SÁCH</span><strong>'+list.length+' đội '+(isBattle?"Battle of Stars":"Inventions Trail")+'</strong><small>Nhập CSV / JSON không ghi đè đội cũ</small></div><button type="button" class="btn roster-import-cta" data-open-team-import><span aria-hidden="true">↥</span> Nhập đội hàng loạt <span aria-hidden="true">↗</span></button></div>';
 view+='<div class="panel"><div class="panel-top"><h3>Danh sách đội '+(isBattle?"Battle":"Invention")+' ('+list.length+')</h3></div>'+
  '<div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Tên đội</th><th>Trường</th><th>Bảng thi</th>'+(isBattle?"<th>Nhóm</th>":"")+'<th>Học sinh 1</th><th>Học sinh 2</th><th>HLV</th><th>Thao tác</th></tr></thead><tbody>'+
  list.map(t=>{const legacy=(t.members||"").split(/[,;\n]/).map(s=>s.trim());return '<tr><td>'+E(t.code||"—")+'</td><td><strong>'+E(t.name)+'</strong></td><td>'+E(t.school||"—")+'</td><td>'+E(divisionOptions.find(d=>d.id===t.division)?.label||t.division)+'</td>'+
    (isBattle?'<td>'+E(t.group||"A")+'</td>':"")+'<td>'+E(t.member1||legacy[0]||"Chưa nhập")+'</td><td>'+E(t.member2||legacy[1]||"Chưa nhập")+'</td><td>'+E(t.coach||"Chưa nhập")+'</td><td><button class="btn btn-outline btn-small" data-edit-team="'+E(t.id)+'">Sửa</button> <button class="btn btn-danger btn-small" data-delete-team="'+E(t.id)+'">Xóa</button></td></tr>';}).join("")+
  '</tbody></table>'+(list.length?"":'<div class="empty"><strong>Chưa có đội thi.</strong>Thêm đội bằng biểu mẫu phía trên.</div>')+'</div></div>';
 view+='<div class="bulk-import-overlay hidden" id="bulk-import-overlay" aria-hidden="true"><div class="bulk-import-dialog" role="dialog" aria-modal="true" aria-labelledby="bulk-import-title" tabindex="-1"><div class="bulk-import-heading"><span class="bulk-import-eyebrow">V+ STEAM LAB / QUẢN LÝ ĐỘI</span><button type="button" class="bulk-import-close" data-close-team-import aria-label="Đóng cửa sổ nhập đội">×</button></div><div class="bulk-import-intro"><span class="bulk-import-symbol" aria-hidden="true">↥</span><div><h3 id="bulk-import-title">Nhập danh sách đội hàng loạt</h3><p>Tải CSV hoặc dán JSON, xem kết quả kiểm tra trước khi nhập.</p></div></div><div class="team-import-panel"><div class="panel-top"><div><h3>Nhập danh sách đội hàng loạt</h3><p class="muted">Tải CSV hoặc dán JSON. Kiểm tra dữ liệu trước khi nhập; đội trùng sẽ được bỏ qua, điểm số cũ được giữ nguyên.</p></div><span class="tag">CSV / JSON</span></div>'+
 '<div class="bulk-import-steps"><span><b>01</b> Chuẩn bị dữ liệu</span><span><b>02</b> Kiểm tra</span><span><b>03</b> Xác nhận nhập</span></div><div class="team-import-toolbar"><div class="field"><label for="team-import-format">Định dạng dữ liệu</label><select id="team-import-format"><option value="csv">CSV (Excel, Google Sheets)</option><option value="json">JSON (copy / paste)</option></select></div>'+
 '<label class="btn btn-outline team-import-file">↑ Chọn file CSV / JSON<input type="file" id="team-import-file" accept=".csv,.json,text/csv,application/json" hidden></label>'+
 '<button type="button" class="btn btn-outline" data-copy-team-template="csv">Sao chép mẫu CSV</button>'+
 '<button type="button" class="btn btn-outline" data-copy-team-template="json">Sao chép mẫu JSON</button></div>'+
 '<div class="field"><label for="team-import-text">Nội dung danh sách đội</label>'+
 '<textarea id="team-import-text" rows="7" spellcheck="false" placeholder="Dán nội dung CSV có tiêu đề hoặc JSON là một mảng các đội..."></textarea></div>'+
 '<div class="action-row"><button type="button" class="btn btn-soft" data-preview-teams>Kiểm tra danh sách</button>'+
 '<button type="button" class="btn" data-import-teams>Nhập đội hợp lệ</button></div>'+
 '<div id="team-import-status" class="team-import-status" role="status" aria-live="polite">Tối đa 500 đội/lần. Mã bảng Invention: p13, p46, m79, h1012; Battle: primary, middle.</div>'+
 '</div></div></div>';
 return view;
}
export function readTeamFields(type,existing={}){
 const get=id=>document.getElementById("team-"+id)?.value?.trim()||"";
 const isBattle=type==="battle";
 return {...existing,type,code:get("code"),name:get("name"),school:get("school"),division:get("division"),
 group:isBattle?(get("group")||"A").toUpperCase():"",member1:get("member1"),member2:get("member2"),coach:get("coach"),note:get("note"),members:""};
}
