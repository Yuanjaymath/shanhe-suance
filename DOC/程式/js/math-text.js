/* 離線數學排版：只轉換顯示，題庫、選項值與判分保留原文。 */
var MathText=(()=>{
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const tag=(name,value)=>'<'+name+'>'+value+'</'+name+'>';
 const row=(...values)=>tag('mrow',values.join(''));
 const operator=value=>tag('mo',escape(value));
 const supers='⁰¹²³⁴⁵⁶⁷⁸⁹',pairs={'(':')','[':']','{':'}','（':'）'};
 function expression(source,start){
  let position=start,depth=0,marked=false;
  const skip=()=>{while(/\s/.test(source[position]||'')&&position<source.length)position++};
  function token(pattern){skip();const match=source.slice(position).match(pattern);if(!match)return null;position+=match[0].length;return match[0]}
  function atom(){
   skip();if(++depth>24){depth--;return null}let result=null;
   const begin=position,number=token(/^\d+(?:\.\d+)?/);
   if(number)result=tag('mn',number);
   else{
    position=begin;const name=token(/^(?:GCD|LCM|[A-Za-z])(?![A-Za-z])/);
    if(name){marked=true;result=name.length===1?tag('mi',name):'<mi mathvariant="normal">'+name+'</mi>'}
    else{
     position=begin;skip();const open=source[position],close=pairs[open];
     if(close){
      position++;const content=relation(),parts=content?[content]:[];
      if(content){skip();while(source[position]===','||source[position]==='，'){position++;const next=relation();if(!next)break;parts.push(operator(','),next);skip()}}
      if(parts.length&&source[position]===close){position++;result=row(operator(open==='（'?'(':open),...parts,operator(close==='）'?')':close));marked=true}
     }else if(open==='√'){
      position++;const value=atom();if(value){result=tag('msqrt',value);marked=true}
     }
    }
   }
   depth--;if(!result)position=begin;return result;
  }
  function power(){
   let value=atom();if(!value)return null;
   const before=position;skip();
   if(source[position]==='^'){
    position++;const exponent=unary();
    if(exponent){value=tag('msup',value+exponent);marked=true}else position=before;
   }else{
    const digits=token(/^[⁰¹²³⁴⁵⁶⁷⁸⁹]+/);
    if(digits){value=tag('msup',value+tag('mn',[...digits].map(d=>supers.indexOf(d)).join('')));marked=true}else position=before;
   }
   return value;
  }
  function unary(){
   const before=position,sign=token(/^[+\-−]/);
   if(sign){const value=unary();if(value){marked=true;return row(operator(sign==='-'?'−':sign),value)}position=before;return null}
   position=before;return power();
  }
  function product(){
   let value=unary();if(!value)return null;
   while(true){
    const before=position,op=token(/^[×*÷/]/);
    if(op){const right=unary();if(!right){position=before;break}value=op==='/'?tag('mfrac',value+right):row(value,operator(op==='*'?'×':op),right);marked=true}
    else{
     position=before;skip();
     // 只允許明確的代數相鄰，不把兩個文字中的數字併成乘法。
     if(!/[A-Za-z(（√]/.test(source[position]||'')){position=before;break}
     const right=power();if(!right){position=before;break}value=row(value,operator('⁢'),right);marked=true;
    }
   }
   return value;
  }
  function sum(){
   let value=product();if(!value)return null;
   while(true){const before=position,op=token(/^[+\-−]/);if(!op){position=before;break}const right=product();if(!right){position=before;break}value=row(value,operator(op==='-'?'−':op),right);marked=true}
   return value;
  }
  function relation(){
   let value=sum();if(!value)return null;
   while(true){
    const before=position,op=token(/^(?:<=|>=|!=|[=<>≤≥≠∣:：])/);if(!op){position=before;break}
    const right=sum();if(!right){position=before;break}
    value=row(value,operator(({'<=':'≤','>=':'≥','!=':'≠','：':':'})[op]||op),right);marked=true;
   }
   return value;
  }
  const math=relation();
  return math&&marked?{end:position,math}:null;
 }
 function segments(value){
  const source=String(value??''),result=[];let plain=0,index=0;
  while(index<source.length){
   if(!/[\dA-Za-z(（[√]/.test(source[index])||/[A-Za-z]/.test(source[index-1]||'')){index++;continue}
   const found=expression(source,index);
   if(!found){index++;continue}
   if(index>plain)result.push({text:source.slice(plain,index),math:false});
   const text=source.slice(index,found.end);
   result.push({text,math:true,html:'<span class="math-formula" data-math-source="'+escape(text)+'"><math xmlns="http://www.w3.org/1998/Math/MathML" display="inline" displaystyle="true">'+found.math+'</math></span>'});
   index=plain=found.end;
  }
  if(plain<source.length)result.push({text:source.slice(plain),math:false});return result;
 }
 const html=value=>segments(value).map(part=>part.math?part.html:escape(part.text)).join('');
 function set(element,value){element.innerHTML=html(value)}
 function chunks(value,limit){
  const pages=[];let page='';
  for(const part of segments(value)){
   const units=part.math?[part.text]:Array.from(part.text);
   for(const unit of units){if(page&&page.length+unit.length>limit){pages.push(page);page=''}page+=unit}
  }
  if(page)pages.push(page);return pages;
 }
 return {html,set,chunks,segments};
})();
