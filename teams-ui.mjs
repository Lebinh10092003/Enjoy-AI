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
 view+='<div class="panel"><div class="panel-top"><h3>Danh sách đội '+(isBattle?"Battle":"Invention")+' ('+list.length+')</h3></div>'+
  '<div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Tên đội</th><th>Trường</th><th>Bảng thi</th>'+(isBattle?"<th>Nhóm</th>":"")+'<th>Học sinh 1</th><th>Học sinh 2</th><th>HLV</th><th>Thao tác</th></tr></thead><tbody>'+
  list.map(t=>{const legacy=(t.members||"").split(/[,;\n]/).map(s=>s.trim());return '<tr><td>'+E(t.code||"—")+'</td><td><strong>'+E(t.name)+'</strong></td><td>'+E(t.school||"—")+'</td><td>'+E(divisionOptions.find(d=>d.id===t.division)?.label||t.division)+'</td>'+
    (isBattle?'<td>'+E(t.group||"A")+'</td>':"")+'<td>'+E(t.member1||legacy[0]||"Chưa nhập")+'</td><td>'+E(t.member2||legacy[1]||"Chưa nhập")+'</td><td>'+E(t.coach||"Chưa nhập")+'</td><td><button class="btn btn-outline btn-small" data-edit-team="'+E(t.id)+'">Sửa</button> <button class="btn btn-danger btn-small" data-delete-team="'+E(t.id)+'">Xóa</button></td></tr>';}).join("")+
  '</tbody></table>'+(list.length?"":'<div class="empty"><strong>Chưa có đội thi.</strong>Thêm đội bằng biểu mẫu phía trên.</div>')+'</div></div>';
 return view;
}
export function readTeamFields(type,existing={}){
 const get=id=>document.getElementById("team-"+id)?.value?.trim()||"";
 const isBattle=type==="battle";
 return {...existing,type,code:get("code"),name:get("name"),school:get("school"),division:get("division"),
 group:isBattle?(get("group")||"A").toUpperCase():"",member1:get("member1"),member2:get("member2"),coach:get("coach"),note:get("note"),members:""};
}
