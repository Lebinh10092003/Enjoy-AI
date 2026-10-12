// Robot running time: accept . or , decimal separators, optional "s", "sec", "giây" suffix.
export function parseSeconds(input,max=150){
 if(input==null||String(input).trim()==="")return null;
 if(typeof input!=="string"&&typeof input!=="number")throw Error("Thời gian phải là số.");
 const raw=String(input).trim().replace(/\s+/gu," ").toLowerCase();
 const match=/^(\d{1,3}(?:[.,]\d{1,3})?)\s*(?:s|sec|seconds?|giây)?$/iu.exec(raw);
 if(!match)throw Error("Nhập thời gian như 13.5, 13,5 hoặc 13,5s (tối đa 3 chữ số thập phân).");
 const value=Number(match[1].replace(",","."));
 if(!Number.isFinite(value)||value<=0||value>max)throw Error("Thời gian phải lớn hơn 0 và không vượt quá "+max+" giây.");
 return value;
}
export function displaySeconds(value){
 if(value==null||value===""||!Number.isFinite(Number(value)))return "—";
 return new Intl.NumberFormat("vi-VN",{minimumFractionDigits:0,maximumFractionDigits:3}).format(Number(value));
}
