import {INV_DIVISIONS,BATTLE_DIVISIONS} from "./core.mjs";

// Standalone, deterministic import validation: no filesystem, network or state side effects.
export const IMPORT_COLUMNS=["code","name","school","division","group","member1","member2","coach","note","type"];
const ALIASES={
 code:["code","ma","ma doi","team code","team id"],
 name:["name","ten doi","doi","team name","team"],
 school:["school","truong","don vi","truong don vi","organization"],
 division:["division","bang thi","cap do","category","nhom tuoi"],
 group:["group","nhom","nhom thi","bang dau"],
 member1:["member1","hoc sinh 1","thanh vien 1","hs1","student 1"],
 member2:["member2","hoc sinh 2","thanh vien 2","hs2","student 2"],
 coach:["coach","hlv","huan luyen vien","giao vien"],
 note:["note","ghi chu","notes"],
 type:["type","noi dung","noi dung thi","competition"]
};
function key(s){
 return String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
   .replace(/đ/g,"d").replace(/[^a-z0-9]+/g," ").trim();
}
const KEYS=Object.fromEntries(Object.entries(ALIASES).flatMap(([name,aliases])=>aliases.map(a=>[key(a),name])));
export function sniffCsvDelimiter(source){
 const firstLine=String(source??"").replace(/^\uFEFF/,"").split(/\r?\n/)[0]||"";
 const count=(d)=>{let q=false,n=0;for(let i=0;i<firstLine.length;i++){if(firstLine[i]==='"'){if(q&&firstLine[i+1]==='"')i++;else q=!q;}else if(firstLine[i]===d&&!q)n++;}return n;};
 return [",",";","\t"].sort((a,b)=>count(b)-count(a))[0];
}
export function parseCsv(source){
 const raw=String(source??"").replace(/^\uFEFF/,"");
 if(!raw.trim())throw Error("Nội dung CSV đang trống.");
 const sep=sniffCsvDelimiter(raw),rows=[];
 let row=[],cell="",quoted=false;
 for(let i=0;i<raw.length;i++){
  const c=raw[i];
  if(c==='"'){if(quoted&&raw[i+1]==='"'){cell+='"';i++;}else if(quoted){quoted=false;}else if(!cell.trim()){quoted=true;}else {throw Error("Dấu ngoặc kép không hợp lệ ở vị trí "+(i+1));}}
  else if(c===sep&&!quoted){row.push(cell);cell="";}
  else if((c==="\r"||c==="\n")&&!quoted){
   row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell="";
   if(c==="\r"&&raw[i+1]==="\n")i++;
  }else cell+=c;
 }
 if(quoted)throw Error("CSV thiếu dấu ngoặc kép kết thúc.");
 row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 if(rows.length<2)throw Error("CSV cần hàng tiêu đề và ít nhất một đội.");
 const headers=rows.shift().map(v=>KEYS[key(v)]||"");
 if(!headers.includes("name")||!headers.includes("division"))throw Error("CSV phải có cột name (tên đội) và division (bảng thi).");
 if(new Set(headers.filter(Boolean)).size!==headers.filter(Boolean).length)throw Error("CSV có cột trùng tên.");
 return rows.map((row,i)=>{
  if(row.length>headers.length&&row.slice(headers.length).some(x=>x.trim()))throw Error("Dòng "+(i+2)+": số cột vượt quá tiêu đề.");
  return Object.fromEntries(headers.map((h,j)=>[h,row[j]??""]).filter(([k])=>k));
 });
}
export function parseTeamInput(raw,mode){
 if(mode==="csv")return parseCsv(raw);
 if(mode!=="json")throw Error("Chỉ hỗ trợ CSV hoặc JSON.");
 let value;
 try{value=JSON.parse(String(raw??"").replace(/^\uFEFF/,""));}catch{throw Error("JSON không đúng cú pháp. Kiểm tra dấu phẩy, dấu ngoặc và dấu nháy kép.");}
 if(Array.isArray(value))return value;
 if(value&&typeof value==="object"&&Array.isArray(value.teams))return value.teams;
 throw Error('JSON phải là mảng đội hoặc đối tượng {"teams":[...]}');
}
function normalizeDivision(value,type){
 const choices=type==="battle"?BATTLE_DIVISIONS:INV_DIVISIONS;
 const text=key(value);
 const found=choices.find(d=>key(d.id)===text||key(d.label)===text);
 if(found)return found.id;
 const shortcuts=type==="battle"?{"tieu hoc":"primary","thcs":"middle","trung hoc co so":"middle"}:
  {"lop 1 3":"p13","lop 4 6":"p46","lop 7 9":"m79","lop 10 12":"h1012"};
 return shortcuts[text]||"";
}
function normalizeRow(input,type,index){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Dòng "+index+": đội không đúng định dạng.");
 const canonical={};
 for(const [k,v] of Object.entries(input)){
  const field=KEYS[key(k)];
  if(field)canonical[field]=v;
 }
 const read=f=>{
  const v=canonical[f];if(v==null)return "";
  if(typeof v!=="string"&&typeof v!=="number")throw Error("Dòng "+index+": "+f+" phải là văn bản.");
  return String(v).trim();
 };
 const rawType=read("type").toLowerCase();
 const match=rawType==="invention"||rawType==="inven"?"invention":
  rawType==="battle"||rawType==="battle of stars"?"battle":rawType;
 if(match&&match!==type)throw Error("Dòng "+index+": đội "+read("name")+" thuộc "+rawType+", không phải "+type+".");
 const team={
  type,code:read("code"),name:read("name"),school:read("school"),
  division:normalizeDivision(read("division"),type),
  group:type==="battle"?(read("group")||"A").toUpperCase():"",
  member1:read("member1"),member2:read("member2"),coach:read("coach"),
  note:read("note"),members:""
 };
 for(const f of ["name","member1","member2","coach"]){if(!team[f])throw Error("Dòng "+index+": thiếu "+f+".");}
 if(!team.division)throw Error("Dòng "+index+": bảng thi không hợp lệ. Dùng mã "+(type==="battle"?"primary/middle":"p13/p46/m79/h1012")+".");
 if(!/^[\p{L}\p{N} ._-]{1,20}$/u.test(team.group||"A"))throw Error("Dòng "+index+": mã nhóm không hợp lệ.");
 for(const f of ["name","school","member1","member2","coach","note"]){if(team[f].length>180)throw Error("Dòng "+index+": "+f+" dài quá 180 ký tự.");}
 if(team.code.length>60)throw Error("Dòng "+index+": mã đội dài quá 60 ký tự.");
 return team;
}
function isDuplicate(team,other){
 return other.type===team.type&&(
  Boolean(team.code&&other.code&&key(team.code)===key(other.code))||
  (other.division===team.division&&key(other.name)===key(team.name))
 );
}
export function validateTeamImport(raw,mode,type,existing=[]){
 if(!["invention","battle"].includes(type))throw Error("Nội dung thi không hợp lệ.");
 const inputs=parseTeamInput(raw,mode);
 if(inputs.length>500)throw Error("Mỗi lần nhập tối đa 500 đội. Hãy chia tệp CSV/JSON.");
 const accepted=[],skipped=[],errors=[];
 for(let i=0;i<inputs.length;i++){
  try{
   const row=normalizeRow(inputs[i],type,i+1);
   if([...existing,...accepted].some(team=>isDuplicate(row,team))){skipped.push({index:i+1,name:row.name});continue;}
   accepted.push(row);
  }catch(e){errors.push(e.message);}
 }
 return {teams:accepted,skipped,errors,total:inputs.length};
}
export function teamImportTemplate(type,format){
 const isBattle=type==="battle";
 const example={
  code:"VPLUS-001",name:"Đội mẫu 01",school:"Tên trường / đơn vị",
  division:isBattle?"primary":"p13",group:isBattle?"A":"",
  member1:"Học sinh A",member2:"Học sinh B",coach:"Huấn luyện viên",
  note:"Thay toàn bộ dữ liệu mẫu trước khi nhập",type
 };
 if(format==="json")return JSON.stringify([example],null,2);
 if(format!=="csv")throw Error("Template không đúng định dạng.");
 const cells=IMPORT_COLUMNS.map(f=>String(example[f]??""));
 const quote=v=>'"'+v.replace(/"/g,'""')+'"';
 return IMPORT_COLUMNS.map(quote).join(",")+"\r\n"+cells.map(quote).join(",");
}
