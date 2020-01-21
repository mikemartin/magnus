/* 
 * Titan - Javascript Web Framework
 * Version 1.1
 * Copyright 2009 Valio, Inc.
 * 
 * Visit the Titan website for more information and documentation:
 * http://www.titanproject.org
 *
 * ---------------------------------------------------------------------------
 *
 * CREDITS:
 *
 * Mike Osuna, Will Wilson, Drew Wilson
 *
 * ---------------------------------------------------------------------------
 *
 * LICENCE:
 *
 * Released under a MIT Licence: http://www.opensource.org/licenses/mit-license.php
 *
 */
(function($){var willChangeStack=[];var didChangeStack=[];function makeChain(target,keys,fn,origTarget,origPath){var key=keys.shift();if(keys.length>0){var nextTarget=$(target).attr(key);var reobserveOriginal=function(){$(origTarget).unobserve(origPath,fn);$(origTarget).observe(origPath,fn);fn();};var undoChainLink=function(){$(target).unbind(key+"-changed",reobserveOriginal);};if(nextTarget){$(target).bind(key+"-changed",reobserveOriginal);return[undoChainLink].concat(makeChain(nextTarget,keys,fn,origTarget,origPath));}}else{$(target).bind(key+"-changed",fn);}
return[];}
$.extend({willChangeValueForKey:function(obj,key){willChangeStack.push({obj:obj,key:key,val:$(obj).valueForKey(key)});},didChangeValueForKey:function(obj,key){var changed=willChangeStack.pop();if(changed.key!=key){console.log("Expected didChangeValueForKey: "+
changed.key+" but got "+key);}
didChangeStack.push(changed);if(willChangeStack.length==0){var changes=didChangeStack;didChangeStack=[];$(changes).each(function(){if($(this.obj).valueForKey(this.key)!==this.val){$(this.obj).trigger(this.key+"-changed",{oldValue:this.val,newValue:$(this.obj).valueForKey(this.key)});}});}},valueForKey:function(obj,key,value){if((value!=undefined)&&(obj.automaticallyNotifiesObserversForKey===undefined||obj.automaticallyNotifiesObserversForKey(key))){$.willChangeValueForKey(obj,key);}
var val;if($.isFunction(obj[key])){val=obj[key].call(obj,key,value);}else{if(value!=undefined){obj[key]=value;}
val=obj[key];}
if((value!=undefined)&&(obj.automaticallyNotifiesObserversForKey===undefined||obj.automaticallyNotifiesObserversForKey(key))){$.didChangeValueForKey(obj,key);}
return val;},valueForKeyPath:function(obj,path,value){var keys=path.split(".");var key;while(keys.length>1){key=keys.shift();obj=$(obj).valueForKey(key);if(obj==undefined){return undefined;}}
key=keys.shift();return $(obj).valueForKey(key,value);},observe:function(obj,path,fn){var keys=path.split(".");var chainKey=path.replace(/\./g,"_");chain=$(obj).data(chainKey,{});if(keys.length>1){var chain=$(obj).data(chainKey);var tmp=makeChain(obj,keys.slice(),fn,obj,path);chain[$.data(fn)]=tmp;}else{$(obj).bind(path+"-changed",fn);}
return fn;},unobserve:function(obj,path,fn){var keys=path.split(".");if(keys.length>1){var chainKey=path.replace(/\./g,"_");var chain=$(obj).data(chainKey);$(chain[$.data(fn)]).each(function(){this();});}else{$(obj).unbind(path+"-changed",fn);}
return fn;},connect:function(from,fromAttr,to,toAttr){var binding={from:from,to:to,fromAttr:fromAttr,toAttr:toAttr,updateTo:true,updateFrom:true};$(from).data(fromAttr+$.data(to)+toAttr,binding);binding.fromFn=$(from).observe(fromAttr,function(){if(binding.updateTo==false){binding.updateTo=true;binding.updateFrom=true;return;}
binding.updateFrom=false;$(to).valueForKeyPath(toAttr,$(from).valueForKeyPath(fromAttr));});binding.toFn=$(to).observe(toAttr,function(){if(binding.updateFrom==false){binding.updateTo=true;binding.updateFrom=true;return;}
binding.updateTo=false;$(from).valueForKeyPath(fromAttr,$(to).valueForKeyPath(toAttr));});binding.updateTo=false;$(from).valueForKeyPath(fromAttr,$(to).valueForKeyPath(toAttr));},disconnect:function(obj,fromAttr,to,toAttr){var binding=$(obj).data(fromAttr+$.data(to)+toAttr);binding.to.unobserve(toAttr,binding.toFn);binding.from.unobserve(fromAttr,binding.fromFn);}});$.fn.extend({valueForKey:function(key,value){if(value===undefined){return $.valueForKey(this[0],key);}
return this.each(function(){$.valueForKey(this,key,value);});},valueForKeyPath:function(path,value){if(value===undefined){return $.valueForKeyPath(this[0],path);}
return this.each(function(){$.valueForKeyPath(this,path,value);});},observe:function(path,fn){return this.each(function(){$.observe(this,path,fn);});},unobserve:function(path,fn){return this.each(function(){$.unobserve(this,path,fn);});},connect:function(attr,to,toAttr){return this.each(function(){$.connect(this,attr,to,toAttr);});},disconnect:function(attr,to,toAttr){return this.each(function(){$.disconnect(this,attr,to,toAttr);});}});})(jQuery);(function($){$.serialize=function(object){var values=[];var prefix='';values=$.serialize.recursive_serialize(object,values,prefix);param_string=values.join('&');return param_string;};$.serialize.recursive_serialize=function(object,values,prefix){var key;for(key in object){if(typeof object[key]=='object'){if(prefix.length>0){prefix+='['+key+']';}else{prefix+=key;}
values=$.serialize.recursive_serialize(object[key],values,prefix);prefixes=prefix.split('[');if(prefixes.length>1){prefix=prefixes.slice(0,prefixes.length-1).join('[');}else{prefix=prefixes[0];}}else{value=encodeURIComponent(object[key]);if(prefix.length>0){prefixed_key=prefix+'['+key+']';}else{prefixed_key=key;}
prefixed_key=encodeURIComponent(prefixed_key);if(value)values.push(prefixed_key+'='+value);}}
return values;};})(jQuery);(function($){$.controller={defaults:{},array:function(model,conditions,options){if(this.constructor==$.controller.array){var that=this;this.model=model;if(conditions){this.conditions=conditions;if(conditions.noRetrieve){var noRetrieve=conditions.noRetrieve;delete conditions.noRetrieve;}
if(conditions.master){this.master=conditions.master[0];this.attr=conditions.master[1];if(this.master){delete this.conditions.master;$(this.master).observe("selection",function(){if(!conditions.noRetrieve){if(options&&options.success){that.retrieve({},{success:options.success});}else{that.retrieve();}}});}}
if(conditions.paginate){var defaults={perPage:10,numberLimit:10,overlap:false,startPage:1}
var opts=$.extend(defaults,conditions.paginate);this.paginating=true;this.paginate=conditions.paginate;this.perPage=opts.perPage;this.numberLimit=opts.numberLimit;this._page=opts.startPage;(opts.overlap!==false)?this.overlap=opts.overlap:this.overlap=0;delete this.conditions.paginate;}}
if(!noRetrieve){if(options&&options.success){this.retrieve({},{success:options.success});}else{this.retrieve();}}}else{return new $.controller.array(model,conditions,options);}},object:function(){if(this.constructor==$.controller.object){}else{return new $.controller.object();}},create:function(model,obj,options){var that=this;var data={};if(model){data=obj;data=$.serialize(data);}else{data=obj;}
$.ajaxq("titan",$.extend({url:$.controller.defaults.url+"/"+model,data:data,type:"POST"},options));},destroy:function(model,id,options){var data={};data={id:id};$.ajaxq("titan",$.extend({url:$.controller.defaults.url+"/"+model+"?"+$.serialize(data),type:"DELETE"},options));},update:function(model,obj,options){var data={};data=obj;$.ajaxq("titan",$.extend({url:$.controller.defaults.url+"/"+model,data:$.serialize(data),contentType:"application/json",type:"PUT"},options));},retrieve:function(model,conditions,options){var that=this;var data={};if(conditions&&conditions!={}){data=$.serialize(conditions);}
$.ajaxq("titan",$.extend({url:$.controller.defaults.url+"/"+model,contentType:"application/json",dataType:"json",type:"GET",data:data},options));},count:0};$.extend($.controller.array.prototype,{root:"",page:function(value){if(value!==undefined){this._page=value;this.retrieve();}
return this._page;},create:function(obj){var that=this;var defaults={autoRetrieve:true,complete:function(){},retrieveComplete:function(){},templateComplete:function(){}};options=$.extend(defaults,options);$.controller.create(that.model,obj,{success:function(data){var tpl_complete=function(){options.templateComplete.call(this,data);};that.templateComplete=tpl_complete;if(options.autoRetrieve){that.retrieve({},{success:options.retrieveComplete});}
options.complete.call(this,data);}});},destroy:function(id,options){var that=this;var defaults={autoRetrieve:true,complete:function(){},retrieveComplete:function(){},templateComplete:function(){}};options=$.extend(defaults,options);$.controller.destroy(that.model,id,{success:function(data){var tpl_complete=function(){options.templateComplete.call(this,data);};that.templateComplete=tpl_complete;if(options.autoRetrieve){that.retrieve({},{success:options.retrieveComplete});}
options.complete.call(this,data);}});},update:function(obj,options){var that=this;var defaults={autoRetrieve:true,complete:function(){},retrieveComplete:function(){},templateComplete:function(){}};options=$.extend(defaults,options);$.controller.update(that.model,obj,{success:function(data){var tpl_complete=function(){options.templateComplete.call(this,data);};that.templateComplete=tpl_complete;if(options.autoRetrieve){that.retrieve({},{success:options.retrieveComplete});}
options.complete.call(this,data);}});},retrieve:function(conditions,opts){var that=this;if(!conditions){conditions={};}
if(!opts){opts={};}
function onSuccess(data){if(opts.success){opts.success.call(this,data);}
that.count=parseInt(data.count);data=data.items;that._last_id=undefined;var found=false;if(that._last_id){$(data).each(function(){if(that._last_id==this.id){found=true;$(that).valueForKey("selection",this);return false;}});if(!found&&data.length>0){$(that).valueForKey("selection",data[0]);}}else{$.willChangeValueForKey(that,"selection");that.selection=undefined;$.didChangeValueForKey(that,"selection");}
if(that.paginating){var extra=that.overlap*(that.count/that.perPage);var total=that.count+extra;that.pages=Math.round((total/that.perPage)+0.5);if(((that.pages-1)*that.perPage)-(that.overlap*(that.pages-2))==that.count&&that.pages>1){that.pages=that.pages-1;}
that.offset=(that._page-1)*(that.perPage-that.overlap);$.fn.rearrange.offset=that.offset;$(that.paginate.selector).pager(that);}
$(that).valueForKey("contents",data);}
if(that.master){var selection=$(that.master).valueForKey("selection");if(selection){if(that.master_last_id!=$(selection).valueForKey("id")){that._page=1;}
conditions[that.attr]=$(selection).valueForKey("id");that.master_last_id=$(selection).valueForKey("id");}else{$(that).valueForKey("contents",[]);return;}}
if($(that).valueForKey("selection")!==undefined){that._last_id=$(that).valueForKeyPath("selection.id");}
conditions=$.extend(this.conditions,conditions);if(this.paginating){that.offset=(that._page-1)*(that.perPage-that.overlap);conditions['limit']=that.perPage;conditions['offset']=that.offset;$.controller.retrieve(that.model,conditions,{success:onSuccess});}else{$.controller.retrieve(that.model,conditions,{success:onSuccess});}}});})(jQuery);(function($){$.template=function(root,controller,options){var tpl=this;var defaults={};tpl.root=root;tpl.pristine=$(root).cloneTemplate(true)[0];tpl.contents=[];tpl.controller=controller;this.options=$.extend(defaults,options);$(tpl).observe("contents",function(){tpl.render();});$(this).connect("contents",controller,"contents");}
$.template.prefix="ti_";$.template.defaultRender=function(elem,data){$(elem).data("data",data);if($(elem).data("format")&&!$(elem).data("formatExtend")){return $(elem).data("format").call(this,elem,data);}else{if($(elem).data("formatExtend")){$(elem).data("formatExtend").call(this,elem,data);}
var classes=elem.className.split(/\s+/);var prefix=new RegExp("^"+$.template.prefix);for(var i=0;i<classes.length;i++){if(prefix.test(classes[i])){var curData=data[classes[i].replace(prefix,"")];if(curData!=undefined){if(curData.constructor==Array){var tmp=$("<div></div>");$(curData).each(function(){$(tmp).append($.visit($(elem).cloneTemplate(true)[0],this,$.template.defaultRender));});$(elem).empty();$(elem).append($(tmp).contents());return false;}else{var content=curData;if(/opt_truncate_/.test(classes)){var flat=classes.toString();var truncLimit=flat.match(/opt_truncate_\d+/i);truncLimit=truncLimit[0].replace(/opt_truncate_/i,"");content=content.trunc(truncLimit);}
if(/opt_text/.test(classes)){$(elem).text(content);}else if(/opt_append/.test(classes)){$(elem).append(content);}else if(/opt_prepend/.test(classes)){$(elem).prepend(content);}else if(!/opt_no_html/.test(classes)){$(elem).html(content);}
return true;}}}}
return true;}},$.template.prototype={deactivate:function(root){if(this.children){$(this.children).each(function(){this.deactivate(false);});}
if(!root){$(this).disconnect("contents",this.controller,"contents");delete this.controller;}},render:function(){var tpl=this;var contents=$(tpl).valueForKey("contents");if(contents){$(tpl.root).empty();$(contents).each(function(i){$(tpl.root).append($.visit($(tpl.pristine).cloneTemplate(true)[0],this,$.template.defaultRender));});}
if(this.options.success){this.options.success();}
if(tpl.controller.templateComplete){tpl.controller.templateComplete.call(this);}}}
$.visit=function(root,data,fn){var func,start,current,next=null;current=start=root;do{if(current.nodeType==1){if(fn.call(this,current,data)){next=current.firstChild||current.nextSibling;}else{next=current.nextSibling;}}else{next=current.firstChild||current.nextSibling;}
var tmp=current;if(!next){var tmp=current;do{next=tmp.parentNode||start;if(next==start)break;tmp=next;next=next.nextSibling;}while(!next);}
current=next;}while(current!=start);return $(start).contents();}
$.fn.cloneTemplate=function(events){var ret=$(this).clone(events);var clone=ret.find("*").andSelf();$(this).find("*").andSelf().each(function(i){if(this.nodeType==3)
return;var format=$.data(this,"format");if(format){$.data(clone[i],"format",format);}
var formatExtend=$.data(this,"formatExtend");if(formatExtend){$.data(clone[i],"formatExtend",formatExtend);}});return ret;}
$.fn.format=function(fn){return $(this).data("format",fn);}
$.fn.formatExtend=function(fn){return $(this).data("formatExtend",fn);}
$.fn.template=function(controller,options){return this.each(function(){$(this).data("template",new $.template(this,controller,options))});}})(jQuery);(function($){$.fillIn=function(obj,data){obj=$.extend({},obj);for(attr in obj){if(obj[attr].constructor==Array){$(obj[attr]).each(function(){obj[attr]=$.fillIn(obj[attr],data);});}else if(typeof obj[attr]=="object"){obj[attr]=$.fillIn(obj[attr],data);}else if(typeof obj[attr]=="string"){obj[attr]=obj[attr].replace(/{([^{}]*)}/g,function(tag,name){var value=data[name];return typeof value==='string'||typeof value==='number'?value:tag;});}}
return obj;}})(jQuery);(function($){$.fn.hasData=function(key,value){var returnVal=false;var curData=$(this).data("data");if(curData){$.each(curData,function(objKey,objVal){if(value){if(key==objKey&&value==objVal){returnVal=true;}}else{if(key==objKey&&objVal!=""){returnVal=true;}}});}
return returnVal;}})(jQuery);function date(format,timestamp){var a,jsdate=((typeof(timestamp)=='undefined')?new Date():(typeof(timestamp)=='number')?new Date(timestamp*1000):new Date(timestamp));var pad=function(n,c){if((n=n+"").length<c){return new Array(++c-n.length).join("0")+n;}else{return n;}};var txt_weekdays=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];var txt_ordin={1:"st",2:"nd",3:"rd",21:"st",22:"nd",23:"rd",31:"st"};var txt_months=["","January","February","March","April","May","June","July","August","September","October","November","December"];var f={d:function(){return pad(f.j(),2);},D:function(){var t=f.l();return t.substr(0,3);},j:function(){return jsdate.getDate();},l:function(){return txt_weekdays[f.w()];},N:function(){return f.w()+1;},S:function(){return txt_ordin[f.j()]?txt_ordin[f.j()]:'th';},w:function(){return jsdate.getDay();},z:function(){return(jsdate-new Date(jsdate.getFullYear()+"/1/1"))/864e5>>0;},W:function(){var a=f.z(),b=364+f.L()-a;var nd2,nd=(new Date(jsdate.getFullYear()+"/1/1").getDay()||7)-1;if(b<=2&&((jsdate.getDay()||7)-1)<=2-b){return 1;}else{if(a<=2&&nd>=4&&a>=(6-nd)){nd2=new Date(jsdate.getFullYear()-1+"/12/31");return date("W",Math.round(nd2.getTime()/1000));}else{return(1+(nd<=3?((a+nd)/7):(a-(7-nd))/7)>>0);}}},F:function(){return txt_months[f.n()];},m:function(){return pad(f.n(),2);},M:function(){t=f.F();return t.substr(0,3);},n:function(){return jsdate.getMonth()+1;},t:function(){var n;if((n=jsdate.getMonth()+1)==2){return 28+f.L();}else{if(n&1&&n<8||!(n&1)&&n>7){return 31;}else{return 30;}}},L:function(){var y=f.Y();return(!(y&3)&&(y%1e2||!(y%4e2)))?1:0;},o:function(){if(f.n()===12&&f.W()===1){return jsdate.getFullYear()+1;}
if(f.n()===1&&f.W()>=52){return jsdate.getFullYear()-1;}
return jsdate.getFullYear();},Y:function(){return jsdate.getFullYear();},y:function(){return(jsdate.getFullYear()+"").slice(2);},a:function(){return jsdate.getHours()>11?"pm":"am";},A:function(){return f.a().toUpperCase();},B:function(){var off=(jsdate.getTimezoneOffset()+60)*60;var theSeconds=(jsdate.getHours()*3600)+
(jsdate.getMinutes()*60)+
jsdate.getSeconds()+off;var beat=Math.floor(theSeconds/86.4);if(beat>1000)beat-=1000;if(beat<0)beat+=1000;if((String(beat)).length==1)beat="00"+beat;if((String(beat)).length==2)beat="0"+beat;return beat;},g:function(){return jsdate.getHours()%12||12;},G:function(){return jsdate.getHours();},h:function(){return pad(f.g(),2);},H:function(){return pad(jsdate.getHours(),2);},i:function(){return pad(jsdate.getMinutes(),2);},s:function(){return pad(jsdate.getSeconds(),2);},u:function(){return pad(jsdate.getMilliseconds()*1000,6);},I:function(){var DST=(new Date(jsdate.getFullYear(),6,1,0,0,0));DST=DST.getHours()-DST.getUTCHours();var ref=jsdate.getHours()-jsdate.getUTCHours();return ref!=DST?1:0;},O:function(){var t=pad(Math.abs(jsdate.getTimezoneOffset()/60*100),4);if(jsdate.getTimezoneOffset()>0)t="-"+t;else t="+"+t;return t;},P:function(){var O=f.O();return(O.substr(0,3)+":"+O.substr(3,2));},Z:function(){var t=-jsdate.getTimezoneOffset()*60;return t;},c:function(){return f.Y()+"-"+f.m()+"-"+f.d()+"T"+f.h()+":"+f.i()+":"+f.s()+f.P();},r:function(){return f.D()+', '+f.d()+' '+f.M()+' '+f.Y()+' '+f.H()+':'+f.i()+':'+f.s()+' '+f.O();},U:function(){return Math.round(jsdate.getTime()/1000);}};return format.replace(/[\\]?([a-zA-Z])/g,function(t,s){if(t!=s){ret=s;}else if(f[s]){ret=f[s]();}else{ret=s;}
return ret;});}
function relative_time(time_value){time_value=new Date(time_value*1000);var parsed_date=Date.parse(time_value);var relative_to=(arguments.length>1)?arguments[1]:new Date();var delta=parseInt((relative_to.getTime()-parsed_date)/1000);if(delta<60){return'less than a minute ago';}else if(delta<120){return'about a minute ago';}else if(delta<(45*60)){return(parseInt(delta/60)).toString()+' minutes ago';}else if(delta<(90*60)){return'about an hour ago';}else if(delta<(24*60*60)){return'about '+(parseInt(delta/3600)).toString()+' hours ago';}else if(delta<(48*60*60)){return'1 day ago';}else{return(parseInt(delta/86400)).toString()+' days ago';}}
(function($){$.formatDate=function(format,prop,tzoffset){return function(elem,data){var ca=$(data).valueForKey(prop);if(ca==undefined||ca==""){$(elem).html("");}else{var m=ca.match(/(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)/);var t=new Date(m[1],m[2]-1,m[3],m[4],m[5],m[6]);var tz=0;if(tzoffset){tz=t.getTimezoneOffset()*60;}
t=(t.getTime()*0.001)-tz;if(format=="relative"){$(elem).html(relative_time(t));}else{$(elem).html(date(format,t));}}}}
$.fn.formatDate=function(format,prop,tzoffset){return $(this).format($.formatDate(format,prop,tzoffset));}
function number_format(number,decimals,dec_point,thousands_sep){var n=number,prec=decimals,dec=dec_point,sep=thousands_sep;n=!isFinite(+n)?0:+n;prec=!isFinite(+prec)?0:Math.abs(prec);sep=sep==undefined?',':sep;var s=n.toFixed(prec),abs=Math.abs(n).toFixed(prec),_,i;if(abs>1000){_=abs.split(/\D/);i=_[0].length%3||3;_[0]=s.slice(0,i+(n<0))+
_[0].slice(i).replace(/(\d{3})/g,sep+'$1');s=_.join(dec||'.');}else{s=abs.replace('.',dec_point);}
return s;}
$.fn.formatNumber=function(number,options){var defaults={decimals:0,decPoint:".",thousandsSep:""};var opts=$.extend(defaults,options);return $(this).format(function(elem,data){var val=$(data).valueForKey(number);decimals=opts.decimals;decPoint=opts.decPoint;thousandsSep=opts.thousandsSep;if(val==undefined||val==""){$(elem).html("");}else{$(elem).html(number_format(val,decimals,decPoint,thousandsSep));}});}
$.fn.formatLink=function(text,href,options){var defaults={title:"",className:"",target:""};return $(this).format(function(elem,data){var opts=$.extend(defaults,{text:text,href:href},options);opts=$.fillIn(opts,data);$(elem).text(opts.text);$(elem).attr("href",opts.href);if(opts.title!=""){$(elem).attr("title",opts.title);}
if(opts.className!=""){$(elem).addClass(opts.className);}
if(opts.target!=""){$(elem).attr("target",opts.target);}});}
$.fn.formatForm=function(controller,options){return $(this).format(function(elem,data){$(elem).submit(function(event){event.preventDefault();var data=$(elem).serialize();if(options){data=data+"&"+$.serialize(options);}
$.controller.create(false,data,{success:function(){controller.retrieve();}});});});}
$.objCount=function(obj){var count=0;for(k in obj)if(obj.hasOwnProperty(k))count++;return count;}
$.fn.objCount=function(obj){return $.objCount($(this));}
$.ajaxq=function(queue,options){if(typeof document.ajaxq=="undefined")document.ajaxq={q:{},r:null};if(typeof document.ajaxq.q[queue]=="undefined")document.ajaxq.q[queue]=[];if(typeof options!="undefined"){var optionsCopy={};for(var o in options)optionsCopy[o]=options[o];options=optionsCopy;var originalCompleteCallback=options.complete;options.complete=function(request,status){document.ajaxq.q[queue].shift();document.ajaxq.r=null;if(originalCompleteCallback)originalCompleteCallback(request,status);if(document.ajaxq.q[queue].length>0)document.ajaxq.r=jQuery.ajax(document.ajaxq.q[queue][0]);};document.ajaxq.q[queue].push(options);if(document.ajaxq.q[queue].length==1)document.ajaxq.r=jQuery.ajax(options);}else{if(document.ajaxq.r){document.ajaxq.r.abort();document.ajaxq.r=null;}document.ajaxq.q[queue]=[];}}
$.template.prefix="fr_";})(jQuery);function truncate(limit,post){if(!limit){post=10;}
if(!post){post="...";}
var s=this.toString();if(s.length>limit){var newS=s.slice(0,limit);var newLimit=newS.lastIndexOf(" ");if(newLimit==-1){newLimit=limit;}
s=s.slice(0,newLimit)+post;}
return s;}
String.prototype.trunc=truncate;

/* 
 * Titan UI - Javascript Web Framework
 * Version 1.0
 * 
 * Visit the Titan website for more information and documentation:
 * http://www.titanproject.org
 *
 * ---------------------------------------------------------------------------
 *
 * CREDITS:
 *
 * Mike Osuna, Will Wilson, Drew Wilson
 *
 * ---------------------------------------------------------------------------
 *
 * LICENCE:
 *
 * Released under a MIT Licence: http://www.opensource.org/licenses/mit-license.php
 *
 */
(function($){$.fn.rearrange=function(controller,options){return $(this).each(function(){var items;var container=this;var user_update;var autoRetrieve=true;var complete=function(){};var start=function(){};if(typeof controller=="string"){return $(this).sortable(controller,options);}
if(options){user_update=options.update;if(options.autoRetrieve!==undefined){autoRetrieve=options.autoRetrieve;delete options.autoRetrieve;}
if(options.complete!==undefined){complete=options.complete;delete options.complete;}
if(options.start!==undefined){start=options.start;delete options.start;}}
$(this).sortable($.extend(options,{update:function(event,ui){if(start){start.call(this);}
items=$(container).sortable('option','items');$(container).find(items).each(function(idx){if(this===ui.item[0]){controller.update({id:$(this).data("data").id,position:$.fn.rearrange.offset+idx},{autoRetrieve:autoRetrieve,complete:complete});}});if(user_update){user_update(event,ui);}}}));});}
$.fn.rearrange.offset=0;$.fn.pager=function(cntrl){var prefix=$.template.prefix;var that=this;$(cntrl).observe("contents",function(){var cntr=this;var curPage=cntr._page;$(that).find("."+prefix+"next").unbind();$(that).find("."+prefix+"prev").unbind();if(cntr._page<cntr.pages){$(that).find("."+prefix+"next").click(function(){cntr.page(parseInt(curPage)+1);return false;}).removeClass("disabled");}else{$(that).find("."+prefix+"next").click(function(){return false;}).addClass("disabled");}
if(cntr._page>1){$(that).find("."+prefix+"prev").click(function(){cntr.page(parseInt(cntr._page)-1);return false;}).removeClass("disabled");}else{$(that).find("."+prefix+"prev").click(function(){return false;}).addClass("disabled");}
if($(that).data(prefix+"numbers")==undefined){$(that).data(prefix+"numbers",$.trim($(that).find("."+prefix+"numbers").html()));}
var template=$($(that).data(prefix+"numbers"));var ti_num=(template.hasClass(prefix+"number")||template.find("."+prefix+"number").length);$(that).find("."+prefix+"numbers").html("");var start=1;if(cntr.pages>cntr.numberLimit){start=parseInt(cntr.numberLimit/2);if(start>cntr._page){start=1;}else{start=cntr._page-start;}}
var numLimit=parseInt(cntr.numberLimit)+start;for(var i,i=1;i<=cntr.pages;i++){if(i>=start-1&&numLimit>=i){var link=template.clone();if(!ti_num){link=link.find("."+prefix+"number");}
if((start>1&&i==(start-1))||numLimit==i){if(link.find("."+prefix+"number").length){var place=link.find("."+prefix+"number");if(place.attr("href")!=undefined){place.parent().html('<span class="'+prefix+'number_dots">...</span>');place.remove();}else{place.html('<span class="'+prefix+'number_dots">...</span>');}}else{link='<span class="'+prefix+'number_dots">...</span>';}}else{if(cntr._page==i){if(link.find("."+prefix+"number").length){var place=link.find("."+prefix+"number");if(place.attr("href")!=undefined){place.parent().html('<span class="'+prefix+'number_current">'+i+'</span>');place.remove();}else{place.html('<span class="'+prefix+'number_current">'+i+'</span>');}}else{link='<span class="'+prefix+'number_current">'+i+'</span>';}}else{if(link.find("."+prefix+"number").length){link.find("."+prefix+"number").text(i);}else{link.text(i);}
link.click((function(i2){return function(){cntr.page(i2);return false;}})(i));}}
$(that).find("."+prefix+"numbers").append(link);}}
var firstItem=(cntr.count==0)?0:cntr.offset+1
$(that).find("."+prefix+"item_start").text(firstItem)
var lastItem=((cntr.offset+cntr.perPage)<=cntr.count)?cntr.offset+cntr.perPage:cntr.count;$(that).find("."+prefix+"item_end").text(lastItem);$(that).find("."+prefix+"item_total").text(cntr.count);});}})(jQuery);

/* ===========================================================================
 *
 * JQuery URL Parser
 * Version 1.0
 * Parses URLs and provides easy access to information within them.
 *
 * Author: Mark Perkins
 * Author email: mark@allmarkedup.com
 *
 * For full documentation and more go to http://projects.allmarkedup.com/jquery_url_parser/
 *
 * ---------------------------------------------------------------------------
 *
 * CREDITS:
 *
 * Parser based on the Regex-based URI parser by Stephen Levithian.
 * For more information (including a detailed explaination of the differences
 * between the 'loose' and 'strict' pasing modes) visit http://blog.stevenlevithan.com/archives/parseuri
 *
 * ---------------------------------------------------------------------------
 *
 * LICENCE:
 *
 * Released under a MIT Licence. See licence.txt that should have been supplied with this file,
 * or visit http://projects.allmarkedup.com/jquery_url_parser/licence.txt
 *
 * ---------------------------------------------------------------------------
 *
 */
jQuery.url=function()
{var segments={};var parsed={};var options={url:window.location,strictMode:false,key:["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],q:{name:"queryKey",parser:/(?:^|&)([^&=]*)=?([^&]*)/g},parser:{strict:/^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,loose:/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/}};var parseUri=function()
{str=decodeURI(options.url);var m=options.parser[options.strictMode?"strict":"loose"].exec(str);var uri={};var i=14;while(i--){uri[options.key[i]]=m[i]||"";}
uri[options.q.name]={};uri[options.key[12]].replace(options.q.parser,function($0,$1,$2){if($1){uri[options.q.name][$1]=$2;}});return uri;};var key=function(key)
{if(!parsed.length)
{setUp();}
if(key=="base")
{if(parsed.port!==null&&parsed.port!=="")
{return parsed.protocol+"://"+parsed.host+":"+parsed.port+"/";}
else
{return parsed.protocol+"://"+parsed.host+"/";}}
return(parsed[key]==="")?null:parsed[key];};var param=function(item)
{if(!parsed.length)
{setUp();}
return(parsed.queryKey[item]===null)?null:parsed.queryKey[item];};var setUp=function()
{parsed=parseUri();getSegments();};var getSegments=function()
{var p=parsed.path;segments=[];segments=parsed.path.length==1?{}:(p.charAt(p.length-1)=="/"?p.substring(1,p.length-1):path=p.substring(1)).split("/");};return{setMode:function(mode)
{strictMode=mode=="strict"?true:false;return this;},setUrl:function(newUri)
{options.url=newUri===undefined?window.location:newUri;setUp();return this;},segment:function(pos)
{if(!parsed.length)
{setUp();}
if(pos===undefined)
{return segments.length;}
return(segments[pos]===""||segments[pos]===undefined)?null:segments[pos];},attr:key,param:param};}();

/*
 * Firerift Titan Extension
 * Version 1.1
 * Copyright 2009 Valio, Inc.
*/
frSuccess=function(){};$(function(){var controllers={blogs:{controller:"blog/blog_categories",include:"blog_categories",parent_id:""},entries:{controller:"blog/blog_entries",include:"blog_entries",parent_id:"blog_category_id"},blog_entry_comments:{controller:"blog/blog_entry_comments",include:"blog_entry_comments",parent_id:"blog_entry_id"},gallery_categories:{controller:"gallery/gallery_categories",include:"gallery_categories",parent_id:""},galleries:{controller:"gallery/galleries",include:"galleries",parent_id:"gallery_category_id"},media_items:{controller:"gallery/media_items",include:"media_items",parent_id:""},galleries_media_items:{controller:"gallery/galleries_media_items",include:"galleries_media_items",parent_id:"gallery_id"},media_item_comments:{controller:"gallery/media_item_comments",include:"media_item_comments",parent_id:"galleries_media_item_id"},geotags:{controller:"geotag/geotags",include:"geotags",parent_id:"media_item_id"},lifestream:{controller:"lifestream",include:"lifestream_stream_items",parent_id:""},page_categories:{controller:"page/page_categories",include:"page_categories",parent_id:""},pages:{controller:"page/pages",include:"pages",parent_id:"page_category_id"},tags:{controller:"tag/tags",include:"tags",parent_id:""},taggings:{controller:"tag/taggings",include:"taggings",parent_id:"tag_id"},data:{controller:"data",include:"data",parent_id:""},blog:{controller:"blog/blog_categories",include:"blog_category",parent_id:""},entry:{controller:"blog/blog_entries",include:"blog_entry",parent_id:"blog_category_id"},blog_entry_comment:{controller:"blog/blog_entry_comments",include:"blog_entry_comment",parent_id:"blog_entry_id"},gallery_category:{controller:"gallery/gallery_categories",include:"gallery_category",parent_id:""},gallery:{controller:"gallery/galleries",include:"gallery",parent_id:"gallery_category_id"},lifestream_item:{controller:"lifestream/lifestream_items",include:"lifestream_items",parent_id:""},lifestream_item_comments:{controller:"lifestream/lifestream_item_comments",include:"lifestream_item_comments",parent_id:""},media_item:{controller:"gallery/media_items",include:"media_item",parent_id:""},galleries_media_item:{controller:"gallery/galleries_media_items",include:"galleries_media_item",parent_id:"gallery_id"},media_item_comment:{controller:"gallery/media_item_comments",include:"media_item_comment",parent_id:"galleries_media_item_id"},geotag:{controller:"geotag/geotags",include:"geotag",parent_id:"media_item_id"},page_category:{controller:"page/page_categories",include:"page_category",parent_id:""},page:{controller:"page/pages",include:"page",parent_id:"page_category_id"},tag:{controller:"tag/tags",include:"tag",parent_id:""},tagging:{controller:"tag/taggings",include:"tagging",parent_id:"tag_id"},comments:{}};$.controller.defaults.url="{{base_url}}api";$.fn.frConnect=function(controller,options){var that=$(this);that.addClass("fr_loading");var opts={};if(!options){options={}}
if(!options.success){opts.success=function(){that.removeClass("fr_loading").children(".fr_loading:first").removeClass("fr_loading");}}else{var success=options.success;opts.success=function(){that.removeClass("fr_loading").children(".fr_loading:first").removeClass("fr_loading");if($.url.attr("anchor")){window.location.hash=$.url.attr("anchor");}
success.call(this);}
delete options.success;}
if(controllers[controller]){var controller_url=controllers[controller].controller;}else{if(/^lifestream_/i.test(controller)){if(/^lifestream_\d+/i.test(controller)){controller=controller.replace(/^lifestream_/i,"");}
var controller_url="lifestream/"+controller;controller="lifestream";}else{var controller_url="data/"+controller;controller="data";}}
if(options.include){controller_url=controller_url+options.include;delete options.include;}
if(options.parent_id){if(controllers[controller].parent_id!=""){options[controllers[controller].parent_id]=options.parent_id;}
delete options.parent_id;}
if(/opt_paginate/i.test(that.attr("class"))){var pageLimit=10;if(/opt_perpage_/i.test(that.attr("class"))){var pageLimit=elemClasses.match(/opt_perpage_\d+/i);pageLimit=pageLimit[0].replace(/opt_perpage_/i,"");}
options.paginate={object:that,perPage:pageLimit};}
var cntrl=$.controller.array(controller_url,options);var website_title="{{website_title}}";$(".fr_title, .fr_name").format(function(elem,data){var element=$(elem);if(/fr_title/i.test(elem.className)){var nameTitle=data.title;}else{var nameTitle=data.name;}
if(element.attr("href")!=undefined){if(data.sef_title){element.attr("href",element.attr("href")+data.sef_title);}else{element.attr("href",element.attr("href")+nameTitle);}}
if(!element.hasClass("opt_no_html")){var title=nameTitle;if(/opt_truncate_/i.test(elem.className)){var truncLimit=elem.className.toString().match(/opt_truncate_\d+/i);title=title.trunc(truncLimit[0].replace(/opt_truncate_/i,""));}
if(/opt_prepend/i.test(elem.className)){element.prepend(title);}else if(/opt_append/i.test(elem.className)){element.append(title);}else{element.html(title);}}
if(element.hasClass("opt_website_title")){document.title=nameTitle+" | "+website_title;}});$(".fr_sef_title").format(function(elem,data){var element=$(elem);var theLink=data.sef_title;if(/opt_category/i.test(elem.className)){if(data._model=="blog_entry"){theLink=data.blog_category_sef_title+"/"+data.sef_title;}else if(data._model=="gallery"){theLink=data.gallery_category_sef_title+"/"+data.sef_title;}else if(data._model=="media_item"){theLink=data.gallery_sef_title+"/"+data.sef_title;}else if(data._model=="page"){theLink=data.page_category_sef_title+"/"+data.sef_title;}else if(data._model=="data"){theLink=data.data_set_sef_title+"/"+data.sef_title;}}
if(/opt_anchor/i.test(elem.className)){element.attr("name",theLink);}else{if(element.attr("href")!=undefined){element.attr("href",element.attr("href")+theLink);}
if(!element.hasClass("opt_no_html")){var sef=data.sef_title;if(/opt_truncate_/i.test(elem.className)){var truncLimit=elem.className.toString().match(/opt_truncate_\d+/i);sef=sef.trunc(truncLimit[0].replace(/opt_truncate_/i,""));}
if(/opt_prepend/i.test(elem.className)){element.prepend(sef);}else if(/opt_append/i.test(elem.className)){element.append(sef);}else{element.html(sef);}}
if(element.find(".fr_title").length){var title=data.title;var tClasses=element.find(".fr_title").attr("class");if(/opt_truncate_/i.test(tClasses)){var truncLimit=tClasses.match(/opt_truncate_\d+/i);title=title.trunc(truncLimit[0].replace(/opt_truncate_/i,""));}
element.find(".fr_title").html(title);}
if(element.find(".fr_name").length){var name=data.name;var nClasses=element.find(".fr_name").attr("class");if(/opt_truncate_/i.test(nClasses)){var truncLimit=nClasses.match(/opt_truncate_\d+/i);name=name.trunc(truncLimit[0].replace(/opt_truncate_/i,""));}
element.find(".fr_name").html(name);}}});$(".fr_parent_cateogry").format(function(elem,data){var element=$(elem);var theLink="";var parentName="";if(data._model=="blog_entry"){theLink=data.blog_category_sef_title;parentName=data.blog_category_name;}else if(data._model=="gallery"){theLink=data.gallery_category_sef_title;parentName=data.gallery_category_name;}else if(data._model=="media_item"){theLink=data.gallery_sef_title;parentName=data.gallery_title;}else if(data._model=="page"){theLink=data.page_category_sef_title;parentName=data.page_category_name;}else if(data._model=="data"){theLink=data.data_set_sef_title;parentName=data.data_set_name;}
if(element.attr("href")!=undefined){element.attr("href",element.attr("href")+theLink);}
if(!element.hasClass("opt_no_html")){element.html(parentName);}});$(".fr_date").format(function(elem,data){var element=$(elem);var classes=element.attr("class");var format="M j";var time="created_at";if(/opt_full_month/i.test(classes)){format="F j";}
if(/opt_year/i.test(classes)){format=format+", Y";}
if(/opt_time/i.test(classes)){format=format+" | g:i A";}
if(/opt_modified/i.test(classes)){time="modified_at";}
if(/opt_taken/i.test(classes)){time="taken_at";}
if(/opt_relative/i.test(classes)){format="relative";}
var fn=$.formatDate(format,time,true);fn(elem,data);});$(".opt_rss").formatExtend(function(elem,data){if(data.sef_title){if(data._model=="blog_category"){$("head").append('<link rel="alternate" title="'+data.name+'" type="application/rss+xml" href="{{base_url}}feed/blog/'+data.sef_title+'">');}
if(data._model=="gallery"){$("head").append('<link rel="alternate" title="'+data.title+'" type="application/rss+xml" href="{{base_url}}feed/gallery/'+data.sef_title+'">');}
if(data._model=="blog_entry"){$("head").append('<link rel="alternate" title="'+data.blog_category_name+'" type="application/rss+xml" href="{{base_url}}feed/blog/'+data.blog_category_sef_title+'">');}}});$(".fr_prev_item, .fr_next_item").format(function(elem,data){var element=$(elem);if(/fr_prev/i.test(elem.className)){var title=data.prev_title;var sef=data.prev_sef_title;}else{var title=data.next_title;var sef=data.next_sef_title;}
if(element.attr("href")!=undefined){if(sef){element.attr("href",element.attr("href")+sef);}else{element.attr("href",element.attr("href")+title);}}
if(!element.hasClass("opt_no_html")){if(/opt_truncate_/i.test(elem.className)){var truncLimit=elem.className.toString().match(/opt_truncate_\d+/i);title=title.trunc(truncLimit[0].replace(/opt_truncate_/i,""));}
if(/opt_prepend/i.test(elem.className)){element.prepend(title);}else if(/opt_append/i.test(elem.className)){element.append(title);}else{element.html(title);}}});$(".fr_entry_title").format(function(elem,data){var element=$(elem);if(data.use_title_link=="YES"){var theLink="{{blogs_url}}"+data.sef_title;if(/opt_category/i.test(elem.className)){theLink="{{blogs_url}}"+data.blog_category_sef_title+"/"+data.sef_title;}
if(data.custom_linked=="YES"){theLink=data.title_link;}
if(element.attr("href")!=undefined){element.attr("href",theLink).text(data.title);}else{element.html("<a href='"+theLink+"'>"+data.title+"</a>");}}else{if(element.attr("href")!=undefined){element.parent().addClass(element.attr("class")).append(data.title);element.hide();}else{element.html(data.title);}}
if(element.hasClass("opt_website_title")){document.title=data.title+" | "+website_title;}});var month_names=new Array("January","February","March","April","May","June","July","August","September","October","November","December");var last;var cur_dir=$.url.attr("directory");cur_dir=cur_dir.split("/");var cur_url=cur_dir.pop();if(cur_url==""){cur_url=cur_dir.pop();}
if(cur_url!=""){var cur_date=cur_url;var cur_year=cur_date.substr(3,4);var cur_month=cur_date.substr(0,2);}
$(".fr_archives_entries").formatExtend(function(elem,data){var element=$(elem);var the_date=data.created_at;var year=the_date.substr(0,4);var month=the_date.substr(5,2);if((cur_dir.indexOf("archives")!=-1&&cur_month+cur_year!=""&&cur_month+cur_year==month+year)||(cur_dir.indexOf("archives")!=-1&&cur_month+cur_year=="")||cur_dir.indexOf("archives")==-1)
{if(last!=year+" "+month){if(element.find(".fr_archives_date").attr("href")!=undefined){element.find(".fr_archives_date").attr("href","{{base_url}}archives/"+month+"_"+year);if(!element.find(".fr_archives_date").hasClass("opt_no_html")){element.find(".fr_archives_date").html(month_names[month-1]+" "+year);}}else if(!element.find(".fr_archives_date").hasClass("opt_no_html")){element.find(".fr_archives_date").html(month_names[month-1]+' '+year);}}else{element.find(".fr_archives_date").remove();}}else{$(elem).html("");}
last=year+" "+month;});$(".fr_cover_pic").format(function(elem,data){if(data.cover_pic){if(/img/i.test(elem.tagName)){if(/opt_original/i.test(elem.className)){$(elem).attr("src","{{base_url}}upload/media/"+data.cover_pic);}else{var str=data.cover_pic;var resized=str.replace(/\.jpg|\.jpeg|\.gif|\.png/i,"");var extension=str.replace(resized,"");$(elem).attr("src","{{base_url}}upload/media/"+resized+"~"+data.max_width+"x"+data.max_height+extension);}
if(/opt_fullsize/i.test(elem.className)){$(elem).attr("longdesc","{{base_url}}upload/media/"+data.cover_pic);}}else{$(elem).html(data.cover_pic);}}});$(".fr_gallery_title").format(function(elem,data){var element=$(elem);var theLink="{{galleries_url}}"+data.sef_title;if(/opt_category/i.test(elem.className)){theLink=data.gallery_category_sef_title+"/"+data.sef_title;}
if(element.attr("href")!=undefined){element.attr("href",theLink).html(data.title);}else{element.html("<a href='"+theLink+"'>"+data.title+"</a>");}
if(element.hasClass("opt_website_title")){document.title=data.title+" | "+website_title;}});$(".opt_rel").formatExtend(function(elem,data){$(elem).find(".fr_media, .fr_media_item").attr("rel",data.id);});$(".fr_media").format(function(elem,data){var element=$(elem);if(element.hasClass("opt_text")){if(element.attr("href")!=undefined&&element.attr("href")==""&&!/embed/i.test(data.type)){element.attr("href","{{base_url}}upload/media/"+data.original).text(data.name);}else if(element.attr("href")!=undefined){element.attr("href",element.attr("href")+data.original).text(data.name);}else{element.text(data.name);}}else{var url="{{base_url}}upload/media/"+data.original;if(!/jpg|gif|png/i.test(data.type)&&element.attr("href")!=undefined){element=$(elem).parent();element.addClass("fr_media");element.remove();}
if(/jpg|gif|png/i.test(data.type)){var rel="";if(/\d+/.test($(elem).attr("rel"))){rel=' rel="'+$(elem).attr("rel")+'"';}
var mediaSize=data.resized;if(/opt_thumb/i.test(elem.className)){mediaSize=data.thumb;}
var fullsize="";if(/opt_fullsize/i.test(elem.className)){fullsize=' longdesc="{{base_url}}upload/media/'+data.original+'"';}
var title="";if(/opt_title/i.test(elem.className)){title=' title="'+data.name+'"';}
if(/img/i.test(element[0].tagName)){element.attr("src","{{base_url}}upload/media/"+mediaSize).attr("alt",data.name);if(rel!=""){element.attr("longdesc",rel);}
if(fullsize!=""){element.attr("longdesc","{{base_url}}upload/media/"+data.original);}
if(title!=""){element.attr("title",data.name);}}else if(element.attr("href")!=undefined&&element.attr("href")==""){element.attr("href","{{base_url}}upload/media/"+data.original).html('<img src="{{base_url}}upload/media/'+mediaSize+'" alt="'+data.name+'"'+title+fullsize+rel+' />');}else if(element.attr("href")!=undefined){element.attr("href",element.attr("href")+data.original).html('<img src="{{base_url}}upload/media/'+mediaSize+'" alt="'+data.name+'"'+title+fullsize+rel+' />');}else{element.html('<img src="{{base_url}}upload/media/'+mediaSize+'"'+title+fullsize+rel+' />');}}else if(/mov/i.test(data.type)){element.html('<OBJECT CLASSID=\"clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B\" CODEBASE=\"http://www.apple.com/qtactivex/qtplugin.cab\" HEIGHT=\"'+(parseInt(data.height)+16)+'\" WIDTH=\"'+data.width+'\">'
+'<PARAM NAME=\"src\" VALUE=\"'+url+'\" />'
+'<PARAM NAME=\"CONTROLLER\" VALUE=\"true\" />'
+'<PARAM NAME=\"AutoPlay\" VALUE=\"false\" />'
+'<PARAM NAME=\"Loop\" VALUE=\"false\" />'
+'<PARAM NAME=\"TARGET\" VALUE=\"myself\" />'
+'<EMBED SRC=\"'+url+'\" HEIGHT=\"'+(parseInt(data.height)+16)+'\" WIDTH=\"'+data.width+'\" TYPE=\"video/quicktime\" PLUGINSPAGE=\"http://www.apple.com/quicktime/download/\" CONTROLLER=\"true\" AUTOPLAY=\"false\" LOOP=\"false\" TARGET=\"myself\" />'
+'</OBJECT>');}else if(/mpeg|mpg/i.test(data.type)){element.html('<object classid=\"clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B\" type=\"video/quicktime\" width=\"'+data.width+'\" height=\"'+(parseInt(data.height)+16)+'\" data=\"'+url+'\" standby=\"Loading MPEG video...\">'
+'<param name=\"src\" value=\"'+url+'\" />'
+'<param name=\"autoplay\" value=\"false\" />'
+'<param name=\"controller\" value=\"true\" />'
+'<param name=\"scale\" value=\"tofit\" />'
+'</object>');}else if(/avi/i.test(data.type)){element.html('<object CLASSID=\"CLSID:22d6f312-b0f6-11d0-94ab-0080c74c7e95\" codebase=\"http://activex.microsoft.com/activex/controls/mplayer/en/nsmp2inf.cab#Version=5,1,52,701\" standby=\"Loading Microsoft Windows Media Player components...\" type=\"application/x-oleobject\" width=\"'+data.width+'\" height=\"'+(parseInt(data.height)+16)+'\">'
+'<param name=\"fileName\" value=\"'+url+'\" />'
+'<param name=\"animationatStart\" value=\"true\" />'
+'<param name=\"transparentatStart\" value=\"true\" />'
+'<param name=\"autoStart\" value=\"false\" />'
+'<param name=\"showControls\" value=\"true\" />'
+'<param name=\"Volume\" value=\"-450\" />'
+'<embed type=\"application/x-mplayer2\" pluginspage=\"http://www.microsoft.com/Windows/MediaPlayer/\" src=\"'+url+'\" width='+data.width+' height='+(parseInt(data.height)+16)+' autostart=1 showcontrols=1 volume=-450>'
+'</object>');}else if(/wmv/i.test(data.type)){element.html('<object classid=\"CLSID:6BF52A52-394A-11d3-B153-00C04F79FAA6\" id=\"player\" width=\"'+data.width+'\" height=\"'+data.height+'\">'
+'<param name=\"url\" value=\"'+url+'\" />'
+'<param name=\"src\" value=\"'+url+'\" />'
+'<param name=\"showcontrols\" value=\"true\" />'
+'<param name=\"autostart\" value=\"false\" />'
+'<!--[if !IE]>-->'
+'<object type=\"video/x-ms-wmv\" data=\"'+url+'\" width=\"'+data.width+'\" height=\"'+data.height+'\">'
+'<param name=\"src" value=\"'+url+'\" />'
+'<param name=\"autostart\" value=\"false\" />'
+'<param name=\"controller\" value=\"true\" />'
+'</object>'
+'<!--<![endif]-->'
+'</object>');}else if(/embed/i.test(data.type)){element.html(data.embed);}}});$(".fr_comments").formatExtend(function(elem,data){if(data._model=="blog_enty_comment"){if($.objCount(data.blog_entry_comments)<=0){$(elem).hide();}}else if(data._model=="media_item_comment"){if($.objCount(data.media_item_comments)<=0){$(elem).hide();}}else if(data._model=="lifestream_item_comment"){if($.objCount(data.lifestream_item_comments)<=0){$(elem).hide();}}
if(data.parent_user_id==data.user_id){$(elem).find(":first").addClass("user");}});$(".fr_guest_name").format(function(elem,data){var element=$(elem);if(data.guest_website){if(element.attr("href")!=undefined){element.attr("href",data.guest_website).html(data.guest_name);}else{element.html('<a href="'+data.guest_website+'">'+data.guest_name+'</a>');}}else{element.html(data.guest_name);}});$(".fr_comments_link").format(function(elem,data){var element=$(elem);if(data._model=="blog_entry"){var theLink="{{blogs_url}}"+data.sef_title;if(/opt_category/i.test(elem.className)){theLink="{{blogs_url}}"+data.blog_category_sef_title+"/"+data.sef_title;}
var c_count=data.blog_entry_comments_count;}else if(data._model=="media_item"){var theLink="{{galleries_url}}"+data.sef_title;if(/opt_category/i.test(elem.className)){theLink="{{galleries_url}}"+data.gallery_sef_title+"/"+data.sef_title;}
var c_count=data.media_item_comments_count;}else if(data._model=="lifestream_item"){var theLink=element.attr("href")+data.sef_title;var c_count=data.lifestream_item_comments_count;}
if(element.attr("href")!=undefined){if(element.find(".fr_comments_count").length){element.attr("href",theLink+"#comments").find(".fr_comments_count").html(c_count+" Comments");}else{element.attr("href",theLink+"#comments").html("<span>"+c_count+"</span> Comments");}}else{if(element.find(".fr_comments_count").length){element.find(".fr_comments_count").html('<a href="'+theLink+'#comments"><span>'+c_count+'</span> Comments</a>');}else{element.html('<a href="'+theLink+'#comments"><span>'+c_count+'</span> Comments</a>');}}});$(".fr_comments_count").format(function(elem,data){if(data._model=="blog_entry"){$(elem).html($.objCount(data.blog_entry_comments));}else if(data._model=="media_item"){$(elem).html($.objCount(data.media_item_comments));}else if(data._model=="lifestream_item"){$(elem).html($.objCount(data.lifestream_item_comments));}});$(".fr_gravatar").format(function(elem,data){if(data.guest_email){var element=$(elem);var o_size="80",o_default="identicon",o_rating="g";var cnames=element.attr("class");cnames=cnames.split(" ");if(/opt_size_/i.test(element[0].className)){for(x in cnames){if(/opt_size_/i.test(cnames[x])){o_size=cnames[x].split("_").pop();}}}
if(/opt_default_/i.test(element[0].className)){for(x in cnames){if(/opt_default_/i.test(cnames[x])){o_default=cnames[x].split("_").pop();}}}
if(/opt_rating_/i.test(element[0].className)){for(x in cnames){if(/opt_rating_/i.test(cnames[x])){o_rating=cnames[x].split("_").pop();}}}
if(/img/i.test(element[0].tagName)){element.attr("src","http://www.gravatar.com/avatar/"+hex_md5(data.guest_email)+"?s="+o_size+"&d="+o_default+"&r="+o_rating);}else{element.html($('<img src="http://www.gravatar.com/avatar/'+hex_md5(data.guest_email)+'?s='+o_size+'&d='+o_default+'&r='+o_rating+'" />'));}}});$(".fr_comment_form").format(function(elem,data){if(data.allow_comments=="YES"||data._model=="gallery"||data._model=="media_item"||data._model=="lifestream_item"){var element=$(elem);if("{{captcha}}"=="YES"){if(element.find(".fr_comment_form_captcha_image").length){var captcha=element.find(".fr_comment_form_captcha_image");if(/img/i.test(captcha[0].tagName)){captcha.attr("src","{{base_url}}api/system/captcha?r="+Math.floor(Math.random()*100001)).attr("alt","CAPTCHA");}else{captcha.html('<img src="{{base_url}}api/system/captcha?r='+Math.floor(Math.random()*100001)+'" alt="CAPTCHA" />');}}}
element.submit(function(event){event.preventDefault();var formEmail="";var formWebsite="";var formName=element.find(".fr_comment_form_name");var formText=element.find(".fr_comment_form_text");if(element.find(".fr_comment_form_email").length){formEmail=element.find(".fr_comment_form_email").val();}
if(element.find(".fr_comment_form_website").length){formWebsite=element.find(".fr_comment_form_website").val();}
var formError=element.find(".fr_comment_form_error");var formSuccess=element.find(".fr_comment_form_success");formError.html("");formName.removeClass("error");formText.removeClass("error");element.find(".fr_comment_form_email").removeClass("error");element.find(".fr_comment_form_website").removeClass("error");element.find(".fr_comment_form_captcha_input").removeClass("error");if((formName.val()==""&&formText.val()=="")||(formName.val()=="Your Name"&&formText.val()=="Your Comment")||(formName.val()==""&&formText.val()=="Your Comment")||(formName.val()=="Your Name"&&formText.val()=="")){formName.addClass("error");formText.addClass("error");formError.html("You must enter your Name and a Comment.");return false;}else if(formName.val()==""||formName.val()=="Your Name"){formName.addClass("error");formError.html("You must enter your Name.");return false;}else if(formText.val()==""||formText.val()=="Your Comment"){formText.addClass("error");formError.html("You must enter a Comment.");return false;}else if(formEmail!=""){var filter=/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;if(formEmail=="Your Email"){formEmail="";}else if(!filter.test(formEmail)){element.find(".fr_comment_form_email").addClass("error");formError.html("You must enter a valid Email.");return false;}}
if(formWebsite=="Your Website"){formWebsite="";}else if(formWebsite!=""&&formWebsite.substring(0,7)!="http://"){formWebsite="http://"+formWebsite;}
var captcha_val="";if("{{captcha}}"=="YES"){if(element.find(".fr_comment_form_captcha_input").length){captcha_val=element.find(".fr_comment_form_captcha_input").val();if(captcha_val==""){element.find(".fr_comment_form_captcha_input").addClass("error");formError.html("You must enter the CAPTCHA letters.");return false;}}}
if(data._model=="blog_entry"){var formController="blog/blog_entry_comments";var extraData={blog_entry_id:data.id};}else if(data._model=="media_item"){var formController="gallery/media_item_comments";var extraData={galleries_media_item_id:data.id};}else if(data._model=="lifestream_item"){var formController="lifestream/lifestream_item_comments";var extraData={lifestream_item_id:data.id};}
var formData={guest_name:formName.val(),comment:formText.val(),guest_email:formEmail,guest_website:formWebsite,captcha:captcha_val}
$.ajax({type:"POST",url:"{{base_url}}api/"+formController,data:$.extend(formData,extraData),error:function(){formError.html("The was an error while submitting your comment. Please try again.");if("{{captcha}}"=="YES"){element.find(".fr_comment_form_captcha_input").val("");var captcha=element.find(".fr_comment_form_captcha_image");if(/img/i.test(captcha[0].tagName)){captcha.attr("src","{{base_url}}api/system/captcha?r="+Math.floor(Math.random()*100001)).attr("alt","CAPTCHA");}else{captcha.html('<img src="{{base_url}}api/system/captcha?r='+Math.floor(Math.random()*100001)+'" alt="CAPTCHA" />');}}},success:function(msg){if(msg=="CAPTCHA ERROR"){formError.html("The CAPTCHA letters are incorrect. Please try again.");}else{formSuccess.html("Your Comment has been added!");element.find(".fr_comment_form_name,.fr_comment_form_text,.fr_comment_form_email,.fr_comment_form_website").val("");}
if("{{captcha}}"=="YES"){element.find(".fr_comment_form_captcha_input").val("");var captcha=element.find(".fr_comment_form_captcha_image");if(/img/i.test(captcha[0].tagName)){captcha.attr("src","{{base_url}}api/system/captcha?r="+Math.floor(Math.random()*100001)).attr("alt","CAPTCHA");}else{captcha.html('<img src="{{base_url}}api/system/captcha?r='+Math.floor(Math.random()*100001)+'" alt="CAPTCHA" />');}}}});});}else{$(elem).remove();}});$(".fr_tags_as_classes").formatExtend(function(elem,data){var tag_count=$.objCount(data.tags);if(tag_count>0){var element=$(elem);element.removeClass("fr_tags_as_classes");for(var i=0;i<tag_count;i++){element.addClass(data.tags[i].name);}}});$(".fr_image, .fr_photo").format(function(elem,data){var element=$(elem);if(/fr_image/i.test(elem.className)){var image=data.image;}else{var image=data.photo;}
if(/img/i.test(element[0].tagName)){element.attr("src","{{base_url}}upload/data/"+data.data_set_id+"/"+image);if(data.title){element.attr("alt",data.title);}}else if(!element.hasClass("opt_no_html")){element.html(image);}});$(".fr_url").formatExtend(function(elem,data){var element=$(elem);if(element.attr("href")!=undefined){if(element.html()!=""){element.attr("href",element.attr("href")+data.url);}else{element.attr("href",element.attr("href")+data.url).html(data.url);}}else{element.html(data.url);}});$(".fr_lifestream_items").formatExtend(function(elem,data){$(elem).find(":first").addClass(data.service);});$(".fr_lifestream_items .fr_thumbnail, .fr_lifestream_items .fr_original, .fr_lifestream_items_dynamic .fr_thumbnail, .fr_lifestream_items_dynamic .fr_original").format(function(elem,data){var element=$(elem);if(/fr_thumbnail/i.test(elem.className)){var image=data.thumbnail;}else{var image=data.original;}
if(/img/i.test(element[0].tagName)){element.attr("src",element.attr("src")+image);if(data.title){element.attr("alt",data.title);}}else{element.html(image);}});$(".fr_lifestream_items .fr_title_origin, .fr_lifestream_items_dynamic .fr_title_origin").formatExtend(function(elem,data){var element=$(elem);if(element.attr("href")!=undefined){if(element.attr("href")==""){element.attr("href",data.title_link);}else{element.attr("href",element.attr("href")+data.sef_title);}}
if(!element.hasClass("opt_no_html")){element.html(data.title);}
if(element.hasClass("opt_website_title")){document.title=data.title+" | "+website_title;}});$.template.prefix="fr_";$(this).template(cntrl,opts);}
var frElements=$("*[class*='fr_']");var totalFrElements=frElements.length;var elementObj={};function gatherElements(index,counter){var ind=index;frElements.filter(function(){if(frElements.index($(this))>=ind){return true;}else{return false;}}).eq(0).each(function(){var topElem=$(this);var topClasses=topElem.attr("class").match(/fr_[^\s]+/);var tables=createObject({},topClasses[0],topElem,"","");var topFind=topElem.find(".fr_entries,.fr_galleries,.fr_pages,.fr_comments,.fr_media_items,.fr_tags,.fr_lifestream_items");if(topFind.length>0){topFind.each(function(i){var elem=$(this);if(!elem.hasClass("fr_ran")){var elemClasses=elem.attr("class").match(/fr_[^\s]+/);tables=createObject(tables,elemClasses[0],elem,topClasses[0],"");if(tables[topClasses[0]].include){var elemFind=elem.find(".fr_comments,.fr_media_items,.fr_tags,.fr_lifestream_items");if(elemFind.length>0){elemFind.each(function(x){var subElem=$(this);var subClasses=subElem.attr("class").match(/fr_[^\s]+/);tables=createObject(tables,subClasses[0],subElem,topClasses[0],"YES");});}}}
if(i==(topFind.length-1)){if($.objCount(tables)>0){elementObj[counter]=tables;counter++;}
ind=frElements.index(elem);}});}else{if(!topElem.hasClass("fr_ran")&&$.objCount(tables)>0){elementObj[counter]=tables;counter++;}
ind++;}});if(ind<=totalFrElements&&ind!=index){if(ind==totalFrElements){elementRender(elementObj);}else{gatherElements(ind,counter);}}}
gatherElements(0,0);function createObject(parentObj,classname,elem,parentClass,isSub){var tables=parentObj;var child=false;if(parentClass!=""){child=true;}
var table=classname.replace(/^fr_/,"");if(/^.*_\d*$/.test(table)){if(/^lifestream_/i.test(table)){table=table;}else{var id=table.split("_").pop();table=table.replace(/_\d+/,"");}}
if(/^.*_dynamic/i.test(table)&&!/^.*_tag_/.test(table)){var dir=$.url.attr("directory");dir=dir.split("/");var sef_title=dir.pop();if(sef_title==""){sef_title=dir.pop();}
table=table.replace(/_dynamic/,"");}
if(/^.*_tag_/i.test(table)){if(/^.*_dynamic/i.test(table)){var dir=$.url.attr("directory");dir=dir.split("/");var name=dir.pop();if(name==""){name=dir.pop();}}else{var name=table.split("_").pop();}
var type=table.split("_");type=type[0];if(type=="entries"){type="blog_entry";}
if(type=="galleries"){type="gallery";}
if(type=="pages"){type="page";}
table="taggings";}
if(/^.*archives_/i.test(table)){var newTable=table.split("_").pop();table=newTable;}
if(table&&!id&&!sef_title){var sef=table.split("_").pop();var original=table.replace(sef,"");if(original=="entry_"||original=="blog_"||original=="blog_category_"||original=="page_"||original=="page_category_"||original=="gallery_"||original=="gallery_category_")
{var sef_title=sef;}
delete sef;delete original;}
if(/^data_/i.test(table)||/^lifestream_/.test(table)||controllers[table]){if(!/^data_field/.test(table)&&!/^data_set/.test(table)){table=table.replace(/^data_/i,"");}
if(!child){tables[classname]={table:table};if(id){tables[classname].id=id;}
if(type){tables[classname].type=type;}
if(name){tables[classname].name=name;}
if(sef_title){tables[classname].sef_title=sef_title;}
var elemClasses=elem.attr("class");if(/opt_category_/i.test(elemClasses)){var name=elemClasses.match(/opt_category_\d+/i);var category=name[0].split("_").pop();if(table=="entries"||type=="blog_entry"||type=="entry"){tables[classname].blog_category_id=category;}else if(table=="galleries"||type=="gallery"){tables[classname].gallery_category_id=category;}else if(table=="pages"||type=="page"){tables[classname].page_category_id=category;}else if(table=="data"||type=="data"){tables[classname].data_set_id=category;}}
if(table=="comments"){if(/opt_entries/i.test(elemClasses)){tables[classname].table="blog_entry_comments";}else if(/opt_media/i.test(elemClasses)){tables[classname].table="media_item_comments";}else if(/opt_lifestream/i.test(elemClasses)){tables[classname].table="lifestream_item_comments";}}
if(/opt_limit/i.test(elemClasses)){var name=elemClasses.match(/opt_limit_\d+/i);tables[classname].limit=name[0].replace(/opt_limit_/i,"");}
if(/opt_popular/i.test(elemClasses)){if(table=="entries"||type=="blog_entry"){tables[classname].order="blog_entry_comments_count";}else if(table=="galleries"||type=="gallery"){tables[classname].order="media_item_comments_count";}else if(table=="lifestream_items"||type=="lifestream_item"){tables[classname].order="lifestream_item_comments_count";}}
if(/opt_desc/i.test(elemClasses)){if(tables[classname].order==undefined||tables[classname].order==""){if(/fr_tags/i.test(elemClasses)){tables[classname].order="name DESC";}else{tables[classname].order="created_at DESC";}}else{tables[classname].order=tables[classname].order+" DESC";}}else if(/opt_asc/i.test(elemClasses)){if(tables[classname].order==undefined||tables[classname].order==""){if(/fr_tags/i.test(elemClasses)){tables[classname].order="name ASC";}else{tables[classname].order="created_at ASC";}}else{tables[classname].order=tables[classname].order+" ASC";}}else if(/opt_random/i.test(elemClasses)){if(tables[classname].order==undefined||tables[classname].order==""){tables[classname].order="RAND()";}else{tables[classname].order=tables[classname].order+" RAND()";}}}else if(tables[parentClass].table){var elemClasses=elem.attr("class");var table_opts="";if(table=="comments"){var table_parent=tables[parentClass].table;if(table_parent=="entries"||table_parent=="entry"||table_parent=="blog"||table_parent=="blogs"){table="blog_entry_comments";}else if(table_parent=="media_items"||table_parent=="media"||table_parent=="gallery"||table_parent=="galleries"){table="media_item_comments";}else if(table_parent=="lifestream_items"||table_parent=="lifestream_item"){table="lifestream_item_comments";}}
var inc_order="";if(/opt_popular/i.test(elemClasses)){if(/entries/i.test(elemClasses)){inc_order="blog_entry_comments_count DESC";}else if(/media_items/i.test(elemClasses)){inc_order="media_item_comments_count DESC";}else if(/lifestream_items/i.test(elemClasses)){inc_order="lifestream_item_comments_count DESC";}}
if(/opt_desc/i.test(elemClasses)){if(/opt_popular/i.test(elemClasses)){if(/entries/i.test(elemClasses)){inc_order="blog_entry_comments_count DESC";}else if(/media_items/i.test(elemClasses)){inc_order="media_item_comments_count DESC";}else if(/lifestream_items/i.test(elemClasses)){inc_order="lifestream_item_comments_count DESC";}}else{inc_order="created_at DESC";}}else if(/opt_asc/i.test(elemClasses)){if(/opt_popular/i.test(elemClasses)){if(/entries/i.test(elemClasses)){inc_order="blog_entry_comments_count ASC";}else if(/media_items/i.test(elemClasses)){inc_order="media_item_comments_count ASC";}else if(/lifestream_items/i.test(elemClasses)){inc_order="lifestream_item_comments_count ASC";}}else{inc_order="created_at ASC";}}
if(inc_order!=""){inc_order="order:"+inc_order+",";table_opts=inc_order;}
var inc_limit="";if(/opt_limit/i.test(elemClasses)){inc_limit=elemClasses.replace(/.*opt_limit_/i,"");}
if(inc_limit!=""){inc_limit="limit:"+inc_limit+",";table_opts=inc_limit;}
if(inc_order!=""&&inc_limit!=""){table_opts=inc_order+inc_limit;}
if(isSub=="YES"){var incl=tables[parentClass].include.substr(0,(tables[parentClass].include.length-1));tables[parentClass].include=incl+",include:"+controllers[table].include+"["+table_opts+"]}";}else if(tables[parentClass].include){tables[parentClass].include=tables[parentClass].include+"&include["+controllers[table].include+"]={"+table_opts+"}";}else{tables[parentClass].include="?include["+controllers[table].include+"]={"+table_opts+"}";}
elem.addClass("fr_ran fr_"+controllers[table].include);}
return tables;}}
function elementRender(tables){var counter=$.objCount(tables);var tableCount=0;for(x=0;x<=counter;x++){for(var prop in tables[x]){tableCount++;var table=tables[x][prop].table;delete tables[x][prop].table;if(tableCount==counter){if(frSuccess){tables[x][prop].success=frSuccess;}}
$("."+prop).frConnect(table,tables[x][prop]);delete tables[x][prop].success;}}}
$.fn.frSearch=function(options){var defaults={category:"ALL",limit:10,noResults:function(){},success:function(){}};var conditions=$.extend(defaults,options);var success=conditions.success;var noResults=conditions.noResults;delete conditions.success;delete conditions.noResults;delete conditions.controller.conditions['noRetrieve'];var cntrl=conditions.controller;delete conditions.controller;cntrl.conditions=$.extend(conditions,cntrl.conditions);cntrl.conditions.search=options.search;if(conditions.category!="ALL"&&conditions.category!="all"){if(cntrl['model']=="blog/blog_entries"){cntrl.conditions.blog_category_id=conditions.category;}else if(cntrl['model']=="gallery/galleries"){cntrl.conditions.gallery_category_id=conditions.category;}else if(cntrl['model']=="data/data_sets"){cntrl.conditions.data_set_id=conditions.category;}}
delete conditions.category;var completed=function(data){if(data.count==0){noResults.call(this,data);}else{success.call(this,data);}}
cntrl.retrieve({success:completed});}
$(".fr_search").each(function(){var element=$(this);var limit=1000;var category="ALL";var classes=element[0].className.split(/\s+/);for(var i=0;i<classes.length;i++){if(/^opt_limit_/i.test(classes[i])){limit=classes[i].split("_").pop();}
if(/^opt_category_/i.test(classes[i])){category=classes[i].split("_").pop();}}
var type,published,include;if(element.hasClass("opt_entries")){type="blog/blog_entries";}else if(element.hasClass("opt_galleries")){type="gallery/galleries";include="media_items";}else if(element.hasClass("opt_data")){type="data/data_sets";}
var cntrl=$.controller.array(type,{noRetrieve:true});$(".fr_search_results").template(cntrl);element.submit(function(event){event.preventDefault();var query=element.find(".fr_search_text").val();if(query!=""){$(".fr_search_loading").show();element.frSearch({search:query,controller:cntrl,category:category,published:published,include:include,limit:limit,success:function(){$(".fr_search_error_holder, .fr_hide_on_search, .fr_search_loading").hide();$(".fr_search_query").html(element.find(".fr_search_text").val());$(".fr_search_results_holder").show();$(".fr_search_close").live("click",function(){$(".fr_search_results_holder, .fr_search_error_holder").hide();$(".fr_hide_on_search").show();return false;});},noResults:function(){$(".fr_search_results_holder, .fr_hide_on_search, .fr_search_loading").hide();$(".fr_search_query").html(element.find(".fr_search_text").val());$(".fr_search_error_holder").show();$(".fr_search_close").live("click",function(){$(".fr_search_results_holder, .fr_search_error_holder").hide();$(".fr_hide_on_search").show();return false;});}});}});});});if(!Array.prototype.indexOf)
{Array.prototype.indexOf=function(elt)
{var len=this.length>>>0;var from=Number(arguments[1])||0;from=(from<0)?Math.ceil(from):Math.floor(from);if(from<0)
from+=len;for(;from<len;from++)
{if(from in this&&this[from]===elt)
return from;}
return-1;};}