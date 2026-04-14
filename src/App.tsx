import { useState, useRef, useCallback } from "react";

const PURPLE = "#6B21A8";
const PURPLE_LIGHT = "#F3E8FF";

// ── Constants ─────────────────────────────────────────────────────────────────
const JURISDICTIONS = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","Washington D.C."];
const ENTITY_TYPES = ["LLC","S-Corp","C-Corp","Sole Proprietorship","Partnership","Non-Profit","Government"];
const INDUSTRIES = ["Technology","Healthcare","Retail","Manufacturing","Finance","Education","Construction","Hospitality","Legal","Real Estate","Logistics","Other"];
const PTO_OPTIONS = ["Set Amount (fixed days/year)","Accrual Based","PTO covers sick leave","Unlimited PTO"];
const MUNICIPALITIES = {"California":["Berkeley","Emeryville","Los Angeles","Oakland","San Diego","San Francisco","San Jose","Santa Monica","West Hollywood"],"Colorado":["Denver"],"Florida":["Miami-Dade County"],"Illinois":["Cook County","Chicago"],"Maryland":["Montgomery County"],"Minnesota":["Minneapolis","St. Paul","Bloomington"],"New Mexico":["Unincorporated Areas of Bernalillo County"],"New York":["New York City","Westchester County"],"Pennsylvania":["Allegheny County","Philadelphia","Pittsburgh"],"Washington":["Seattle","Tacoma"]};
const STATE_MAP = {"AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming","DC":"Washington D.C."};
const CITY_MUN = {"berkeley":"Berkeley","emeryville":"Emeryville","los angeles":"Los Angeles","oakland":"Oakland","san diego":"San Diego","san francisco":"San Francisco","san jose":"San Jose","santa monica":"Santa Monica","west hollywood":"West Hollywood","denver":"Denver","miami":"Miami-Dade County","chicago":"Chicago","evanston":"Cook County","skokie":"Cook County","minneapolis":"Minneapolis","st. paul":"St. Paul","saint paul":"St. Paul","bloomington":"Bloomington","albuquerque":"Unincorporated Areas of Bernalillo County","new york":"New York City","new york city":"New York City","brooklyn":"New York City","queens":"New York City","bronx":"New York City","manhattan":"New York City","yonkers":"Westchester County","philadelphia":"Philadelphia","pittsburgh":"Pittsburgh","seattle":"Seattle","tacoma":"Tacoma"};
const STEP_INFO = [{why:"Used throughout the handbook to personalize all policies.",how:"Enter your full legal or DBA company name."},{why:"Different entity types have different legal obligations.",how:"Choose your registered legal structure."},{why:"Industry affects which compliance policies are required.",how:"Pick your primary business activity."},{why:"Operating years gives context for policy maturity.",how:"How long the business has been operating."},{why:"PTO structure determines how the time-off section is written.",how:"Choose how you currently offer time off."},{why:"Employees need a clear point of contact for handbook questions.",how:"Provide the primary HR person's details."},{why:"Some state laws require a separate harassment complaint contact.",how:"Typically a senior leader or outside counsel."}];
const ORG_STEPS = [
  {question:"Welcome to Sixfifty! 👋 Let's set up your organization. First — what's your company name?",extract:function(a,p){return Object.assign({},p,{companyName:a.trim()});}},
  {question:function(p){return "Great, "+p.companyName+"! What type of legal entity is it?";},chips:ENTITY_TYPES,extract:function(a,p){return Object.assign({},p,{entityType:a.trim()});}},
  {question:function(){return "What industry are you in?";},chips:INDUSTRIES,extract:function(a,p){return Object.assign({},p,{industry:a.trim()});}},
  {question:function(){return "How many years has the company been operating?";},extract:function(a,p){var n=a.match(/\d+/);return Object.assign({},p,{operatingYears:n?n[0]:a});}},
  {question:function(){return "How does your company handle PTO?";},chips:PTO_OPTIONS,extract:function(a,p){var m=PTO_OPTIONS.find(function(o){return a.toLowerCase().includes(o.toLowerCase().split(" ")[0]);});return Object.assign({},p,{ptoPolicy:m||a.trim()});}},
  {question:function(){return "Who is the HR contact for handbook questions?";},contactForm:true,extract:function(a,p){try{var c=JSON.parse(a);return Object.assign({},p,{hrContactName:c.name||"",hrContactEmail:c.email||"",hrContactPhone:c.phone||""});}catch(e){return p;}}},
  {question:function(){return "And who is the backup contact for sexual harassment reports?";},contactForm:true,extract:function(a,p){try{var c=JSON.parse(a);return Object.assign({},p,{backupContactName:c.name||"",backupContactEmail:c.email||"",backupContactPhone:c.phone||""});}catch(e){return p;}}}
];
const EMPTY_PROFILE = {companyName:"",entityType:"",industry:"",operatingYears:"",ptoPolicy:"",hrContactName:"",hrContactEmail:"",hrContactPhone:"",backupContactName:"",backupContactEmail:"",backupContactPhone:""};

const QUICK_ACTIONS = [{icon:"⚡",title:"Ask AI a legal question",desc:"AI-powered Q&A provides legal information in seconds.",btn:"Ask AI",color:"#EDE9FE"},{icon:"📄",title:"Draft a legal doc with AI",desc:"Have our AI-drafting assistant create a first draft.",btn:"Draft a Document",color:"#DCFCE7"},{icon:"📚",title:"Browse legal library",desc:"Smart docs and templates from the best lawyers.",btn:"Browse Templates",color:"#FEF9C3"},{icon:"🗂️",title:"See my legal docs",desc:"Documents you've created and signed.",btn:"Go to Docs",color:"#E0F2FE"}];
const NAV_ITEMS = [{icon:"🏠",label:"Home"},{icon:"📄",label:"Docs"},{icon:"🔬",label:"Research"},{icon:"📝",label:"Live Docs"},{icon:"👥",label:"Contacts"},{icon:"📌",label:"Posters"},{icon:"⚖️",label:"Cases"},{icon:"🎓",label:"Trainings"},{icon:"🌐",label:"Portals"},{icon:"⚙️",label:"Admin"}];

const US_STATES = [{n:"Alabama",d:"M 573 359 L 583 357 L 587 402 L 577 408 L 561 406 L 557 370 L 561 360 Z"},{n:"Alaska",d:"M 138 480 L 172 492 L 184 518 L 164 528 L 136 516 L 116 494 Z"},{n:"Arizona",d:"M 185 318 L 222 322 L 256 326 L 260 386 L 222 392 L 188 388 L 173 350 Z"},{n:"Arkansas",d:"M 526 318 L 568 314 L 572 352 L 568 364 L 526 366 L 516 342 Z"},{n:"California",d:"M 108 242 L 158 232 L 178 270 L 184 322 L 156 334 L 120 312 L 96 278 Z"},{n:"Colorado",d:"M 292 274 L 370 268 L 374 328 L 294 332 Z"},{n:"Connecticut",d:"M 760 196 L 778 192 L 782 210 L 762 214 Z"},{n:"Delaware",d:"M 736 234 L 748 228 L 752 248 L 736 252 Z"},{n:"Florida",d:"M 592 398 L 642 388 L 674 414 L 662 460 L 628 476 L 598 450 L 582 420 Z"},{n:"Georgia",d:"M 590 356 L 632 348 L 640 390 L 628 408 L 592 410 L 582 388 Z"},{n:"Hawaii",d:"M 296 522 L 312 516 L 320 528 L 304 532 Z"},{n:"Idaho",d:"M 194 166 L 232 154 L 250 194 L 242 246 L 210 250 L 193 220 Z"},{n:"Illinois",d:"M 544 258 L 568 252 L 574 304 L 570 322 L 536 324 L 528 290 Z"},{n:"Indiana",d:"M 580 252 L 602 248 L 606 304 L 580 308 L 572 278 Z"},{n:"Iowa",d:"M 486 228 L 544 222 L 550 260 L 488 268 Z"},{n:"Kansas",d:"M 388 296 L 468 290 L 470 338 L 390 342 Z"},{n:"Kentucky",d:"M 582 296 L 632 284 L 646 300 L 632 324 L 580 328 Z"},{n:"Louisiana",d:"M 508 388 L 556 380 L 560 408 L 540 426 L 508 420 Z"},{n:"Maine",d:"M 788 146 L 814 134 L 822 162 L 796 172 Z"},{n:"Maryland",d:"M 714 250 L 750 242 L 754 262 L 716 268 Z"},{n:"Massachusetts",d:"M 760 190 L 800 180 L 808 196 L 766 202 Z"},{n:"Michigan",d:"M 578 192 L 620 182 L 634 212 L 610 228 L 580 222 Z"},{n:"Minnesota",d:"M 458 158 L 512 148 L 524 202 L 488 216 L 458 200 Z"},{n:"Mississippi",d:"M 544 354 L 572 348 L 574 398 L 550 406 L 538 380 Z"},{n:"Missouri",d:"M 486 284 L 544 276 L 550 322 L 528 342 L 488 340 Z"},{n:"Montana",d:"M 216 136 L 324 122 L 332 184 L 218 192 Z"},{n:"Nebraska",d:"M 386 256 L 466 248 L 470 294 L 390 300 Z"},{n:"Nevada",d:"M 148 236 L 190 226 L 202 292 L 180 320 L 146 298 Z"},{n:"New Hampshire",d:"M 770 166 L 786 160 L 792 188 L 774 192 Z"},{n:"New Jersey",d:"M 738 222 L 756 216 L 760 242 L 740 246 Z"},{n:"New Mexico",d:"M 250 332 L 318 326 L 320 392 L 252 396 Z"},{n:"New York",d:"M 698 186 L 760 172 L 768 214 L 718 226 L 698 212 Z"},{n:"North Carolina",d:"M 636 306 L 708 292 L 720 318 L 646 330 L 632 318 Z"},{n:"North Dakota",d:"M 378 154 L 458 146 L 462 198 L 380 204 Z"},{n:"Ohio",d:"M 614 238 L 654 230 L 660 280 L 616 286 L 604 262 Z"},{n:"Oklahoma",d:"M 380 338 L 468 332 L 524 338 L 522 374 L 380 378 Z"},{n:"Oregon",d:"M 116 184 L 196 168 L 204 228 L 126 238 Z"},{n:"Pennsylvania",d:"M 670 216 L 736 204 L 740 238 L 672 248 Z"},{n:"Rhode Island",d:"M 780 198 L 792 194 L 796 208 L 782 212 Z"},{n:"South Carolina",d:"M 636 328 L 680 316 L 692 348 L 656 364 L 632 348 Z"},{n:"South Dakota",d:"M 378 198 L 458 192 L 462 246 L 380 252 Z"},{n:"Tennessee",d:"M 552 318 L 640 304 L 646 326 L 554 340 Z"},{n:"Texas",d:"M 316 338 L 468 332 L 522 376 L 512 442 L 440 472 L 348 442 L 308 392 Z"},{n:"Utah",d:"M 220 266 L 290 260 L 294 330 L 224 334 Z"},{n:"Vermont",d:"M 760 168 L 774 162 L 780 192 L 764 196 Z"},{n:"Virginia",d:"M 658 276 L 724 260 L 738 282 L 700 306 L 654 302 Z"},{n:"Washington",d:"M 116 138 L 196 128 L 202 170 L 120 180 Z"},{n:"West Virginia",d:"M 646 266 L 684 256 L 692 288 L 656 300 L 640 282 Z"},{n:"Wisconsin",d:"M 518 190 L 560 182 L 570 232 L 522 240 Z"},{n:"Wyoming",d:"M 290 208 L 370 200 L 374 262 L 292 268 Z"},{n:"Washington D.C.",d:"M 724 260 L 732 256 L 736 266 L 726 268 Z"}];

// ── Helpers ───────────────────────────────────────────────────────────────────
function validateEmployee(emp) {
  var errors = [];
  if (!emp.first_name) errors.push("Missing first name");
  if (!emp.last_name) errors.push("Missing last name");
  if (!emp.email) errors.push("Missing email");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.email)) errors.push("Invalid email");
  return errors;
}
function normalizeState(raw) {
  if (!raw||typeof raw!=="string") return "";
  var t=raw.trim(); if(!t) return "";
  if (STATE_MAP[t.toUpperCase()]) return STATE_MAP[t.toUpperCase()];
  var f=JURISDICTIONS.find(function(j){return j.toLowerCase()===t.toLowerCase();}); return f||"";
}
function detectMunicipality(city,state) { if(!city||!state||!MUNICIPALITIES[state]) return null; return CITY_MUN[city.trim().toLowerCase()]||null; }
function buildCounts(employees) {
  var sc={},mc={};
  employees.forEach(function(emp){
    if(!emp.state) return;
    sc[emp.state]=(sc[emp.state]||0)+1;
    if(emp._municipality){if(!mc[emp.state])mc[emp.state]={};mc[emp.state][emp._municipality]=(mc[emp.state][emp._municipality]||0)+1;}
  });
  return {stateCounts:sc,munCounts:mc};
}
function parseCSV(text) {
  var lines=text.trim().split(/\r?\n/); if(lines.length<2) return [];
  var headers=lines[0].split(",").map(function(h){return h.trim().toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"");});
  var rows=[];
  for(var li=1;li<lines.length;li++){
    var line=lines[li]; if(!line.trim()) continue;
    var vals=[],cur="",inQ=false;
    for(var ci=0;ci<line.length;ci++){var ch=line[ci];if(ch==='"'){inQ=!inQ;}else if(ch===','&&!inQ){vals.push(cur.trim());cur="";}else{cur+=ch;}}
    vals.push(cur.trim());
    var row={}; for(var hi=0;hi<headers.length;hi++){row[headers[hi]]=(vals[hi]||"").trim();} rows.push(row);
  }
  var jLower=JURISDICTIONS.map(function(j){return j.toLowerCase();}),sLower=Object.keys(STATE_MAP).map(function(k){return k.toLowerCase();});
  var locationCol=null;
  for(var hIdx=0;hIdx<headers.length;hIdx++){
    var h=headers[hIdx],hits=0,total=0;
    for(var rIdx=0;rIdx<rows.length;rIdx++){var val=(rows[rIdx][h]||"").toLowerCase().trim();if(!val)continue;total++;var parts=val.split(",");for(var pIdx=0;pIdx<parts.length;pIdx++){var part=parts[pIdx].trim();if(jLower.indexOf(part)>=0||sLower.indexOf(part)>=0){hits++;}else{var last=part.split(" ").pop();if(sLower.indexOf(last)>=0)hits++;}}}
    if(total>0&&hits/total>=0.3){locationCol=h;break;}
  }
  return rows.map(function(row,idx){
    var emp=Object.assign({_id:idx},row);
    var loc=locationCol?(emp[locationCol]||""):"";
    if(loc&&!emp.state){var lp=loc.split(",");if(lp.length>=2){if(!emp.city)emp.city=(lp[0]||"").trim();emp.state=normalizeState((lp[lp.length-1]||"").trim());}else{var as=normalizeState(loc.trim());if(as)emp.state=as;else if(!emp.city)emp.city=loc.trim();}}
    if(emp.state)emp.state=normalizeState(emp.state);
    emp._municipality=detectMunicipality(emp.city||"",emp.state||"");
    emp._errors=validateEmployee(emp); return emp;
  });
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function InfoTip(props) {
  var info=props.info,open=props.open,onToggle=props.onToggle; if(!info) return null;
  return React.createElement("span",{style:{position:"relative",display:"inline-block"}},
    React.createElement("button",{onClick:onToggle,style:{background:"none",border:"none",padding:"0 0 0 6px",cursor:"pointer",fontSize:11,color:"#bbb",textDecoration:"underline",textUnderlineOffset:2,whiteSpace:"nowrap"}},open?"Close":"More info"),
    open&&React.createElement("div",{style:{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:999,width:240,padding:"10px 12px",background:"#fff",borderRadius:8,border:"1px solid #e8e8e8",boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}},
      React.createElement("div",{style:{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}},"Why we ask"),
      React.createElement("div",{style:{fontSize:12,color:"#666",lineHeight:1.6,marginBottom:8}},info.why),
      React.createElement("div",{style:{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}},"How to answer"),
      React.createElement("div",{style:{fontSize:12,color:"#666",lineHeight:1.6}},info.how)
    )
  );
}
function ProfileField(props) {
  var label=props.label,value=props.value,onChange=props.onChange,type=props.type||"text",options=props.options||[],tipInfo=props.tipInfo,tipOpen=props.tipOpen,onTipToggle=props.onTipToggle;
  var isEmpty=!value; var bc=isEmpty?"#eee":"#d0d0d0",tc=isEmpty?"#bbb":"#111";
  var labelEl=label?React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}},React.createElement("div",{style:{fontSize:11,fontWeight:600,color:"#777",textTransform:"uppercase",letterSpacing:0.5}},label),tipInfo?React.createElement(InfoTip,{info:tipInfo,open:tipOpen,onToggle:onTipToggle}):null):null;
  if(type==="select") return React.createElement("div",{style:{marginBottom:12}},labelEl,React.createElement("select",{value:value,onChange:function(e){onChange(e.target.value);},style:{width:"100%",padding:"7px 10px",borderRadius:6,border:"1px solid "+bc,fontSize:13,color:tc,background:"#fff",boxSizing:"border-box"}},React.createElement("option",{value:""},"— not yet gathered —"),options.map(function(o){return React.createElement("option",{key:o,value:o},o);})));
  return React.createElement("div",{style:{marginBottom:12}},labelEl,React.createElement("input",{type:type,value:value,onChange:function(e){onChange(e.target.value);},placeholder:"— not yet gathered —",style:{width:"100%",padding:"7px 10px",borderRadius:6,border:"1px solid "+bc,fontSize:13,color:tc,background:"#fff",boxSizing:"border-box"}}));
}
function OrgProgressBar(props) {
  var keys=Object.keys(EMPTY_PROFILE),filled=keys.filter(function(k){return !!props.profile[k];}).length,pct=Math.round((filled/keys.length)*100);
  return React.createElement("div",{style:{marginBottom:16}},React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:4}},React.createElement("span",{style:{fontSize:11,fontWeight:500,color:"#888"}},"Profile completion"),React.createElement("span",{style:{fontSize:11,fontWeight:600,color:pct===100?"#0F6E56":PURPLE}},pct+"%")),React.createElement("div",{style:{height:4,background:"#eee",borderRadius:2}},React.createElement("div",{style:{height:"100%",borderRadius:2,background:pct===100?"#1D9E75":PURPLE,width:pct+"%",transition:"width 0.5s"}})));
}

// ── Employee Card ─────────────────────────────────────────────────────────────
function EmployeeCard(props) {
  var emp=props.emp,onResolve=props.onResolve,resolving=props.resolving,onSave=props.onSave,onSetLocation=props.onSetLocation;
  var hasErrors=emp._errors&&emp._errors.length>0,name=[emp.first_name,emp.last_name].filter(Boolean).join(" ")||"Unknown",emailRef=useRef(null);
  return React.createElement("div",{style:{padding:"9px 11px",borderRadius:9,border:"1px solid "+(hasErrors?"#FCA5A5":emp.state?"#d1fae5":"#FDE047"),background:hasErrors?"#FFF5F5":emp.state?"#F0FDF4":"#FEFCE8",marginBottom:7}},
    React.createElement("div",{style:{display:"flex",alignItems:"flex-start",gap:8}},
      React.createElement("div",{style:{width:28,height:28,borderRadius:"50%",background:hasErrors?"#FEE2E2":emp.state?"#D1FAE5":"#FEF9C3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:hasErrors?"#B91C1C":emp.state?"#065F46":"#854D0E",flexShrink:0,marginTop:1}},hasErrors?"!":emp.state?"\u2713":"?"),
      React.createElement("div",{style:{flex:1,minWidth:0}},
        React.createElement("div",{style:{fontSize:12,fontWeight:600,color:"#111",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},name),
        React.createElement("div",{style:{fontSize:11,color:"#666",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},emp.email||"no email"),
        emp.state?React.createElement("div",{style:{fontSize:11,color:"#888"}},emp.state+(emp._municipality?" \xB7 "+emp._municipality:""))
          :React.createElement("div",{style:{marginTop:4}},React.createElement("select",{defaultValue:"",onChange:function(e){var v=e.target.value;if(v)onSetLocation(emp._id,v);},style:{fontSize:11,padding:"3px 6px",borderRadius:6,border:"1px solid #FDE047",background:"#FEF9C3",color:"#854D0E",cursor:"pointer",maxWidth:"100%"}},React.createElement("option",{value:""},"+ assign jurisdiction"),JURISDICTIONS.map(function(j){return React.createElement("option",{key:j,value:j},j);})))
      ),
      hasErrors&&!resolving&&React.createElement("button",{onClick:onResolve,style:{fontSize:11,padding:"3px 9px",borderRadius:6,border:"1px solid #F87171",color:"#B91C1C",background:"#FEE2E2",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}},"Resolve"),
      !hasErrors&&emp.state&&React.createElement("span",{style:{fontSize:11,color:"#065F46",fontWeight:600,flexShrink:0}},"Ready")
    ),
    hasErrors&&!resolving&&React.createElement("div",{style:{marginTop:4,paddingLeft:36}},emp._errors.map(function(e,i){return React.createElement("div",{key:i,style:{fontSize:11,color:"#B91C1C"}},"• "+e);})),
    resolving&&React.createElement("div",{style:{marginTop:9,display:"flex",flexDirection:"column",gap:6}},
      React.createElement("div",{style:{fontSize:11,color:"#666",marginBottom:2}},"Enter a valid email address:"),
      React.createElement("div",{style:{display:"flex",gap:6}},
        React.createElement("input",{ref:emailRef,type:"text",defaultValue:emp.email||"",placeholder:"email@example.com",style:{flex:1,padding:"6px 10px",borderRadius:6,border:"1px solid #ddd",fontSize:12,color:"#111",outline:"none"}}),
        React.createElement("button",{onClick:function(){var v=emailRef.current?emailRef.current.value:"";if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))onSave(v);},style:{padding:"6px 12px",borderRadius:6,border:"none",background:PURPLE,color:"white",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}},"Save")
      )
    )
  );
}

// ── US Map ────────────────────────────────────────────────────────────────────
function USMap(props) {
  var activeStates=props.activeStates||{};
  var [tooltip,setTooltip]=useState(null);
  return React.createElement("div",{style:{position:"relative",background:"#f8f6ff",borderRadius:8,overflow:"hidden"}},
    React.createElement("svg",{viewBox:"0 0 960 600",width:"100%",style:{display:"block"}},
      US_STATES.map(function(s){
        var active=activeStates[s.n];
        return React.createElement("path",{key:s.n,d:s.d,fill:active?PURPLE:"#ddd6f3",stroke:"white",strokeWidth:1.5,style:{cursor:active?"pointer":"default"},onMouseEnter:function(){if(active)setTooltip(s.n);},onMouseLeave:function(){setTooltip(null);}});
      })
    ),
    tooltip&&React.createElement("div",{style:{position:"absolute",top:8,left:8,background:PURPLE,color:"white",fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:6,pointerEvents:"none"}},tooltip+" \xB7 "+activeStates[tooltip].employees+" employees")
  );
}

// ── Jurisdiction Section (Org Profile) ────────────────────────────────────────
function JurisdictionSection(props) {
  var jurisdictions=props.jurisdictions||{};
  var [linked,setLinked]=useState(true);
  var [manual,setManual]=useState({});
  function gc(k,fb){return manual[k]!==undefined?manual[k]:fb;}
  function sc(k,v){setManual(function(p){return Object.assign({},p,{[k]:v});});}
  var states=Object.keys(jurisdictions);
  if(states.length===0) return React.createElement("div",{style:{fontSize:12,color:"#bbb"}},"No jurisdiction data yet. Import employees to populate this section.");
  return React.createElement("div",null,
    React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:8,background:linked?"#F0FDF4":"#FEF9C3",border:"1px solid "+(linked?"#6EE7B7":"#FDE047"),marginBottom:16}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
        React.createElement("div",{style:{width:8,height:8,borderRadius:"50%",background:linked?"#22C55E":"#EAB308"}}),
        linked?React.createElement("span",{style:{fontSize:12,color:"#166534",fontWeight:500}},"Linked to ",React.createElement("a",{href:"#",style:{color:"#166534",fontWeight:700,textDecoration:"underline"}},"Contacts module")," — counts update automatically")
              :React.createElement("span",{style:{fontSize:12,color:"#854D0E",fontWeight:500}},"Manual mode — not synced with Contacts")
      ),
      linked?React.createElement("button",{onClick:function(){setLinked(false);},style:{fontSize:12,color:"#854D0E",background:"#FEF9C3",border:"1px solid #FDE047",borderRadius:6,padding:"4px 12px",cursor:"pointer",fontWeight:500}},"Unlink & edit manually")
            :React.createElement("button",{onClick:function(){setLinked(true);setManual({});},style:{fontSize:12,color:"#166534",background:"#F0FDF4",border:"1px solid #6EE7B7",borderRadius:6,padding:"4px 12px",cursor:"pointer",fontWeight:500}},"Re-link to Contacts")
    ),
    React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
      states.map(function(state){
        var data=jurisdictions[state];
        var detectedMuns=data.municipalities||{};
        var knownMuns=MUNICIPALITIES[state]||[];
        var allMuns=knownMuns.length>0?knownMuns:Object.keys(detectedMuns);
        var sk="state__"+state;
        return React.createElement("div",{key:state,style:{padding:"10px 14px",borderRadius:8,border:"1px solid #eee",background:"#fafaf8"}},
          React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:allMuns.length?8:0}},
            React.createElement("div",{style:{fontSize:13,fontWeight:600,color:"#111"}},state),
            linked?React.createElement("div",{style:{fontSize:12,fontWeight:600,color:PURPLE,background:PURPLE_LIGHT,padding:"2px 10px",borderRadius:10}},data.employees+" employees")
                  :React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},React.createElement("input",{type:"number",min:0,value:gc(sk,data.employees),onChange:function(e){sc(sk,e.target.value);},style:{width:60,padding:"3px 8px",borderRadius:6,border:"1.5px solid "+PURPLE,fontSize:12,color:"#111",textAlign:"center",outline:"none"}}),React.createElement("span",{style:{fontSize:11,color:"#888"}},"employees"))
          ),
          allMuns.length>0&&React.createElement("div",null,
            React.createElement("div",{style:{fontSize:10,color:"#aaa",marginBottom:5,textTransform:"uppercase",letterSpacing:0.5}},"Tracked municipalities"),
            React.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:5}},
              allMuns.map(function(mun){
                var mk="mun__"+state+"__"+mun;
                var count=detectedMuns[mun]||null;
                return linked
                  ?React.createElement("div",{key:mun,style:{fontSize:11,padding:"2px 8px",borderRadius:10,background:count?"#f5f0ff":"#f5f5f5",border:"1px solid "+(count?"#e0d5ff":"#eee"),color:count?PURPLE:"#aaa"}},mun+" \xB7 "+(count||0))
                  :React.createElement("div",{key:mun,style:{display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"3px 8px",borderRadius:10,background:"#fff",border:"1px solid #ddd"}},React.createElement("span",{style:{color:"#555"}},mun),React.createElement("span",{style:{color:"#ccc"}},"\xB7"),React.createElement("input",{type:"number",min:0,value:gc(mk,count||0),onChange:function(e){sc(mk,e.target.value);},style:{width:40,padding:"1px 4px",borderRadius:4,border:"1px solid "+PURPLE,fontSize:11,color:"#111",textAlign:"center",outline:"none"}}));
              })
            )
          )
        );
      })
    )
  );
}

// ── Org Profile Page ──────────────────────────────────────────────────────────
function OrgProfilePage(props) {
  var org=props.org,onBack=props.onBack,jurisdictions=props.jurisdictions||{};
  var [editing,setEditing]=useState({});
  var [orgData,setOrgData]=useState(org);
  function field(label,key){
    var isE=editing[key];
    return React.createElement("div",{style:{marginBottom:20}},
      React.createElement("div",{style:{fontSize:11,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}},label),
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
        isE?React.createElement("input",{autoFocus:true,value:orgData[key],onChange:function(e){var v=e.target.value;setOrgData(function(p){return Object.assign({},p,{[key]:v});});},onBlur:function(){setEditing(function(p){return Object.assign({},p,{[key]:false});});},style:{flex:1,padding:"6px 10px",borderRadius:6,border:"1.5px solid "+PURPLE,fontSize:14,color:"#111",outline:"none"}})
          :React.createElement("div",{style:{flex:1,fontSize:14,color:orgData[key]?"#111":"#bbb"}},orgData[key]||"—"),
        React.createElement("button",{onClick:function(){setEditing(function(p){return Object.assign({},p,{[key]:!p[key]});});},style:{fontSize:11,color:PURPLE,background:"none",border:"none",cursor:"pointer",padding:"2px 6px"}},isE?"Done":"Edit")
      )
    );
  }
  function sec(label){return React.createElement("div",{style:{fontSize:12,fontWeight:700,color:PURPLE,textTransform:"uppercase",letterSpacing:1,marginBottom:12,marginTop:28,paddingBottom:6,borderBottom:"1px solid "+PURPLE_LIGHT}},label);}
  return React.createElement("div",{style:{flex:1,overflowY:"auto",background:"#fafaf8"}},
    React.createElement("div",{style:{background:"#fff",borderBottom:"1px solid #eee",padding:"16px 32px",display:"flex",alignItems:"center",gap:16}},
      React.createElement("button",{onClick:onBack,style:{background:"none",border:"none",cursor:"pointer",color:"#888",fontSize:13}},"\u2190 Back"),
      React.createElement("div",{style:{fontSize:18,fontWeight:700,color:"#111"}},"Org Profile"),
      React.createElement("div",{style:{marginLeft:"auto",fontSize:12,color:"#aaa"}},"Last updated today")
    ),
    React.createElement("div",{style:{maxWidth:900,margin:"0 auto",padding:"32px"}},
      React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:32}},
        React.createElement("div",null,
          React.createElement("div",{style:{background:"#fff",borderRadius:12,padding:"24px 28px",border:"1px solid #eee",marginBottom:24}},
            sec("Company Details"),field("Company Name","companyName"),field("Entity Type","entityType"),field("Industry","industry"),field("Operating Years","operatingYears")),
          React.createElement("div",{style:{background:"#fff",borderRadius:12,padding:"24px 28px",border:"1px solid #eee"}},sec("PTO Policy"),field("PTO Handling","ptoPolicy"))
        ),
        React.createElement("div",null,
          React.createElement("div",{style:{background:"#fff",borderRadius:12,padding:"24px 28px",border:"1px solid #eee",marginBottom:24}},
            sec("HR Contact"),field("Name","hrContactName"),field("Email","hrContactEmail"),field("Phone","hrContactPhone")),
          React.createElement("div",{style:{background:"#fff",borderRadius:12,padding:"24px 28px",border:"1px solid #eee"}},
            sec("Backup Contact"),React.createElement("div",{style:{fontSize:11,color:"#aaa",marginBottom:12,marginTop:-8}},"For sexual harassment reports"),field("Name","backupContactName"),field("Email","backupContactEmail"),field("Phone","backupContactPhone"))
        )
      ),
      React.createElement("div",{style:{background:"#fff",borderRadius:12,padding:"24px 28px",border:"1px solid #eee",marginTop:24}},
        sec("Jurisdictions & Employee Counts"),
        React.createElement(JurisdictionSection,{jurisdictions:jurisdictions})
      )
    )
  );
}

// ── Hosting Setup Panel ──────────────────────────────────────────────────────
var HOSTING_STEPS = [
  {
    id: "name",
    question: "Let's set up your employee portal! 🚀\n\nFirst, what would you like to name this Live Doc campaign?\n\nThis is the internal name you'll use to track it.",
    inputType: "text",
    placeholder: "e.g. 2025 Employee Handbook Rollout",
    field: "campaignName"
  },
  {
    id: "visibility",
    question: function(d) { return "Great name, \"" + d.campaignName + "\"!\n\nShould this portal be Public or Private?\n\n• Public — anyone with the link can view\n• Private — employees must be authenticated"; },
    chips: ["Private (recommended)", "Public"],
    field: "visibility"
  },
  {
    id: "signature",
    question: "Should employees be required to sign/acknowledge the handbook?",
    chips: ["Signature Required", "No Signature Needed"],
    field: "signatureRequired"
  },
  {
    id: "employees",
    question: "How would you like to add employees to this campaign?",
    chips: ["Add Manually", "By Jurisdiction (auto)", "By Groups (auto)"],
    field: "employeeMethod"
  },
  {
    id: "branding",
    question: "Now let's brand your employee portal.\n\nUpload a logo, banner image, and pick a key accent color.",
    inputType: "branding",
    field: "branding"
  },
  {
    id: "email",
    question: "Write the email invite message employees will receive when you send the handbook.",
    inputType: "textarea",
    placeholder: "Hi {first_name},\n\nPlease review and acknowledge our updated Employee Handbook...",
    field: "emailMessage"
  },
  {
    id: "preview",
    question: "Everything looks great! Here's a preview of your employee portal.\n\nReady to save as a draft?",
    inputType: "preview",
    field: null
  },
  {
    id: "send",
    question: null,
    inputType: "send",
    field: null
  }
];

function HostingPanel(props) {
  var org = props.org, employees = props.employees, onClose = props.onClose, onSaved = props.onSaved, onPublished = props.onPublished, startAtSend = props.startAtSend;
  var empCount = employees.length;

  var initStep = startAtSend ? HOSTING_STEPS.length - 1 : 0;
  var [messages, setMessages] = useState(startAtSend
    ? [{from:"ai", text:"Ready to publish and send to employees?", inputType:"send"}]
    : [{from:"ai", text: HOSTING_STEPS[0].question}]
  );
  var [step, setStep] = useState(initStep);
  var [input, setInput] = useState("");
  var [data, setData] = useState({campaignName:"",visibility:"",signatureRequired:"",employeeMethod:"",branding:{logo:"",banner:"",color:"#6B21A8"},emailMessage:""});
  var [loading, setLoading] = useState(false);
  var [accentColor, setAccentColor] = useState("#6B21A8");
  var [sendingNow, setSendingNow] = useState(false);
  var [sendDone, setSendDone] = useState(startAtSend ? false : false);
  var bottomRef = useRef(null);

  function scrollBot() { setTimeout(function(){ if(bottomRef.current) bottomRef.current.scrollIntoView({behavior:"smooth"}); }, 60); }

  function advance(answer, newData) {
    var next = step + 1;
    setStep(next);
    setInput("");
    setLoading(true);
    setTimeout(function() {
      setLoading(false);
      if (next < HOSTING_STEPS.length) {
        var s = HOSTING_STEPS[next];
        var q = typeof s.question === "function" ? s.question(newData) : s.question;
        setMessages(function(p){ return p.concat([{from:"ai", text: q, chips: s.chips||null, inputType: s.inputType||null}]); });
      }
      scrollBot();
    }, 500);
  }

  function send() {
    var t = input.trim(); if (!t) return;
    var s = HOSTING_STEPS[step];
    var nd = Object.assign({}, data, s.field ? {[s.field]: t} : {});
    setData(nd);
    setMessages(function(p){ return p.concat([{from:"user", text: t}]); });
    advance(t, nd);
  }

  function pickChip(chip) {
    var s = HOSTING_STEPS[step];
    var nd = Object.assign({}, data, s.field ? {[s.field]: chip} : {});
    setData(nd);
    setMessages(function(p){ return p.concat([{from:"user", text: chip}]); });
    advance(chip, nd);
  }

  function submitTextarea() {
    var t = input.trim(); if (!t) return;
    var s = HOSTING_STEPS[step];
    var nd = Object.assign({}, data, s.field ? {[s.field]: t} : {});
    setData(nd);
    setMessages(function(p){ return p.concat([{from:"user", text: "✉️ Email message set"}]); });
    advance(t, nd);
  }

  function saveDraft() {
    setMessages(function(p){ return p.concat([{from:"ai", text:"✅ Live Doc saved as draft!\n\nYour employee portal is ready. Head back to the dashboard and click \"Send to Employees\" when you're ready to publish and notify " + empCount + " employees."}]); });
    setTimeout(function(){ onSaved(data); }, 400);
    scrollBot();
  }

  var currentStep = HOSTING_STEPS[step];
  var isLast = step >= HOSTING_STEPS.length - 1;

  function renderBrandingWidget() {
    return React.createElement("div", {style:{background:"#f8f6ff",borderRadius:12,padding:16,display:"flex",flexDirection:"column",gap:12,marginTop:8,maxWidth:320}},
      React.createElement("div", {style:{fontSize:12,fontWeight:600,color:"#555",marginBottom:4}}, "Portal Branding"),
      React.createElement("div", null,
        React.createElement("div", {style:{fontSize:11,color:"#888",marginBottom:6}}, "Logo (click to upload)"),
        React.createElement("div", {style:{width:80,height:80,borderRadius:10,border:"2px dashed #c4b5fd",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:28}},
          data.branding.logo ? React.createElement("img",{src:data.branding.logo,style:{width:"100%",height:"100%",objectFit:"contain",borderRadius:8}}) : "🖼️"
        )
      ),
      React.createElement("div", null,
        React.createElement("div", {style:{fontSize:11,color:"#888",marginBottom:6}}, "Banner Image (click to upload)"),
        React.createElement("div", {style:{width:"100%",height:60,borderRadius:8,border:"2px dashed #c4b5fd",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:13,color:"#aaa"}},
          data.branding.banner ? React.createElement("img",{src:data.branding.banner,style:{width:"100%",height:"100%",objectFit:"cover",borderRadius:6}}) : "Click to upload banner"
        )
      ),
      React.createElement("div", null,
        React.createElement("div", {style:{fontSize:11,color:"#888",marginBottom:6}}, "Accent Color"),
        React.createElement("div", {style:{display:"flex",alignItems:"center",gap:10}},
          React.createElement("input", {type:"color", value:accentColor, onChange:function(e){ setAccentColor(e.target.value); setData(function(d){ return Object.assign({},d,{branding:Object.assign({},d.branding,{color:e.target.value})}); }); }, style:{width:36,height:36,borderRadius:6,border:"1px solid #ddd",cursor:"pointer",padding:2}}),
          React.createElement("span", {style:{fontSize:12,color:"#666"}}, accentColor),
          [PURPLE,"#0EA5E9","#10B981","#F59E0B","#EF4444","#8B5CF6"].map(function(c){
            return React.createElement("div",{key:c,onClick:function(){setAccentColor(c);setData(function(d){return Object.assign({},d,{branding:Object.assign({},d.branding,{color:c})});});},style:{width:20,height:20,borderRadius:"50%",background:c,cursor:"pointer",border:accentColor===c?"2px solid #333":"2px solid transparent"}});
          })
        )
      ),
      React.createElement("button", {onClick:function(){
        setMessages(function(p){ return p.concat([{from:"user",text:"🎨 Branding configured — accent color "+accentColor}]); });
        advance("branding done", data);
      }, style:{padding:"8px 0",borderRadius:8,border:"none",background:PURPLE,color:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}, "Save Branding →")
    );
  }

  function renderPreview() {
    return React.createElement("div", {style:{background:"#f8f6ff",borderRadius:12,padding:16,marginTop:8,maxWidth:320}},
      React.createElement("div", {style:{fontSize:12,fontWeight:700,color:"#555",marginBottom:10}}, "Portal Preview"),
      React.createElement("div", {style:{background:"#fff",borderRadius:10,overflow:"hidden",border:"1px solid #e8e8e8",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}},
        React.createElement("div", {style:{height:48,background:data.branding.color||PURPLE,display:"flex",alignItems:"center",padding:"0 16px"}},
          React.createElement("div", {style:{fontSize:14,fontWeight:700,color:"white"}}, org.companyName||"Your Company")
        ),
        React.createElement("div", {style:{padding:16}},
          React.createElement("div", {style:{fontSize:13,fontWeight:600,color:"#111",marginBottom:4}}, data.campaignName||"Employee Handbook"),
          React.createElement("div", {style:{fontSize:11,color:"#888",marginBottom:12}}, [data.visibility, data.signatureRequired].filter(Boolean).join(" · ")),
          React.createElement("div", {style:{background:"#f4f4f1",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#555",marginBottom:12,fontStyle:"italic"}}, data.emailMessage ? data.emailMessage.slice(0,80)+"..." : "Your email invite will appear here..."),
          React.createElement("button", {style:{width:"100%",padding:"9px 0",borderRadius:8,border:"none",background:data.branding.color||PURPLE,color:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}, data.signatureRequired==="Signature Required"?"Review & Sign":"View Handbook")
        )
      ),
      React.createElement("button", {onClick:saveDraft, style:{marginTop:12,width:"100%",padding:"10px 0",borderRadius:8,border:"none",background:PURPLE,color:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}, "💾 Save as Draft")
    );
  }

  function renderSendWidget() {
    if (sendDone) {
      return React.createElement("div", {style:{paddingLeft:34,marginTop:8}},
        React.createElement("div", {style:{background:"#D1FAE5",borderRadius:12,padding:"16px 18px",maxWidth:340,border:"1px solid #6EE7B7"}},
          React.createElement("div", {style:{fontSize:24,marginBottom:8}}, "📬"),
          React.createElement("div", {style:{fontSize:14,fontWeight:700,color:"#065F46",marginBottom:4}}, empCount+" employees notified!"),
          React.createElement("div", {style:{fontSize:12,color:"#047857",lineHeight:1.6}}, "Invites sent. Track acknowledgments from your dashboard."),
          React.createElement("button", {onClick:onClose, style:{marginTop:12,width:"100%",padding:"9px 0",borderRadius:8,border:"none",background:"#059669",color:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}, "Back to Dashboard")
        )
      );
    }
    return React.createElement("div", {style:{paddingLeft:34,marginTop:8}},
      React.createElement("div", {style:{background:"#f8f6ff",borderRadius:12,padding:"16px 18px",maxWidth:340,border:"1px solid #e0d5ff"}},
        React.createElement("div", {style:{fontSize:11,fontWeight:700,color:PURPLE,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}, "Campaign Summary"),
        [
          {label:"Campaign", value: data.campaignName || org.companyName+" Handbook"},
          {label:"Visibility", value: data.visibility || "Private"},
          {label:"Signature", value: data.signatureRequired || "Not required"},
          {label:"Employees", value: data.employeeMethod || "All employees"},
        ].map(function(row,i){
          return React.createElement("div", {key:i, style:{display:"flex",justifyContent:"space-between",paddingBottom:i<3?"7px":"0",marginBottom:i<3?"7px":"0",borderBottom:i<3?"1px solid #ede8ff":"none"}},
            React.createElement("span", {style:{fontSize:12,color:"#888"}}, row.label),
            React.createElement("span", {style:{fontSize:12,fontWeight:600,color:"#111"}}, row.value)
          );
        }),
        React.createElement("div", {style:{marginTop:12,padding:"10px 12px",background:"#D1FAE5",borderRadius:8,display:"flex",alignItems:"center",gap:10,border:"1px solid #6EE7B7"}},
          React.createElement("span", {style:{fontSize:20}}, "👥"),
          React.createElement("div", null,
            React.createElement("div", {style:{fontSize:15,fontWeight:700,color:"#065F46"}}, empCount+" employees"),
            React.createElement("div", {style:{fontSize:11,color:"#047857"}}, "will receive an invite")
          )
        ),
        React.createElement("div", {style:{marginTop:10,fontSize:11,color:"#92400E",background:"#FFFBEB",borderRadius:6,padding:"8px 10px",border:"1px solid #FDE68A",lineHeight:1.5}},
          "⚠️ Employees will be notified immediately once published."
        ),
        React.createElement("button", {
          onClick: function(){
            setSendingNow(true);
            setTimeout(function(){
              setSendingNow(false);
              setSendDone(true);
              if(onPublished) onPublished();
              setMessages(function(p){ return p.concat([{from:"user",text:"🚀 Publish & Send Now"}]); });
              scrollBot();
            }, 1800);
          },
          disabled: sendingNow,
          style:{marginTop:12,width:"100%",padding:"10px 0",borderRadius:8,border:"none",background:sendingNow?"#a78bfa":PURPLE,color:"white",fontSize:13,fontWeight:700,cursor:sendingNow?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}
        }, sendingNow
          ? React.createElement("span", null, "Sending", React.createElement("span", {style:{opacity:0.7}}, "..."))
          : "🚀 Publish & Send Now"
        )
      )
    );
  }

    return React.createElement("div", {style:{position:"fixed",top:0,right:0,bottom:0,width:420,background:"#fff",borderLeft:"1px solid #eee",display:"flex",flexDirection:"column",boxShadow:"-8px 0 32px rgba(107,33,168,0.18)",zIndex:1000}},
    // Header
    React.createElement("div", {style:{padding:"16px 20px",borderBottom:"1px solid #eee",display:"flex",alignItems:"center",gap:10,flexShrink:0,background:PURPLE_LIGHT}},
      React.createElement("div", {style:{width:28,height:28,borderRadius:8,background:PURPLE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}, "🚀"),
      React.createElement("div", null,
        React.createElement("div", {style:{fontSize:13,fontWeight:700,color:"#111"}}, "Hosting Setup"),
        React.createElement("div", {style:{fontSize:11,color:"#888"}}, "Step "+(Math.min(step+1,HOSTING_STEPS.length))+" of "+HOSTING_STEPS.length)
      ),
      React.createElement("button", {onClick:onClose, style:{marginLeft:"auto",background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#888",lineHeight:1}}, "×")
    ),
    // Progress bar
    React.createElement("div", {style:{height:3,background:"#eee",flexShrink:0}},
      React.createElement("div", {style:{height:"100%",background:PURPLE,width:(Math.min(step,HOSTING_STEPS.length)/HOSTING_STEPS.length*100)+"%",transition:"width 0.4s ease"}})
    ),
    // Messages
    React.createElement("div", {style:{flex:1,overflowY:"auto",padding:"16px 20px 0"}},
      messages.map(function(m,i) {
        var isLastAI = m.from==="ai" && i===messages.length-1;
        return React.createElement("div", {key:i, style:{marginBottom:14}},
          React.createElement("div", {style:{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:8}},
            m.from==="ai" && React.createElement("div", {style:{width:26,height:26,borderRadius:"50%",background:PURPLE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"white",fontWeight:700,flexShrink:0,marginTop:2}}, "AI"),
            React.createElement("div", {style:{maxWidth:"82%",padding:"10px 13px",borderRadius:m.from==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.from==="user"?PURPLE:"#f4f4f1",color:m.from==="user"?"white":"#111",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}}, m.text)
          ),
          isLastAI && m.chips && React.createElement("div", {style:{paddingLeft:34,marginTop:8,display:"flex",flexWrap:"wrap",gap:6}},
            m.chips.map(function(chip){
              return React.createElement("button", {key:chip, onClick:function(){pickChip(chip);}, style:{padding:"6px 13px",borderRadius:20,border:"1.5px solid #d0d0d0",background:"#fff",color:"#333",fontSize:12,cursor:"pointer"}}, chip);
            })
          ),
          isLastAI && m.inputType==="branding" && React.createElement("div",{style:{paddingLeft:34}}, renderBrandingWidget()),
          isLastAI && m.inputType==="preview" && React.createElement("div",{style:{paddingLeft:34}}, renderPreview()),
          (m.inputType==="send") && React.createElement("div",null, renderSendWidget())
        );
      }),
      loading && React.createElement("div", {style:{display:"flex",alignItems:"center",gap:8,marginBottom:14}},
        React.createElement("div", {style:{width:26,height:26,borderRadius:"50%",background:PURPLE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"white",fontWeight:700}}, "AI"),
        React.createElement("div", {style:{padding:"10px 14px",borderRadius:"14px 14px 14px 4px",background:"#f4f4f1",display:"flex",gap:4}},
          [0,1,2].map(function(i){ return React.createElement("div",{key:i,style:{width:5,height:5,borderRadius:"50%",background:"#999",animation:"bounce 1s "+(i*0.2)+"s infinite"}}); })
        )
      ),
      React.createElement("div", {ref:bottomRef})
    ),
    // Input area — only show for text/textarea steps, not chip/branding/preview steps
    currentStep && (currentStep.inputType==="text" || currentStep.inputType==="textarea") && !loading &&
      React.createElement("div", {style:{padding:"12px 16px",borderTop:"1px solid #eee",flexShrink:0}},
        currentStep.inputType==="textarea"
          ? React.createElement("div", {style:{display:"flex",flexDirection:"column",gap:8}},
              React.createElement("textarea", {value:input, onChange:function(e){setInput(e.target.value);}, placeholder:currentStep.placeholder||"Type here...", rows:5, style:{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #ddd",fontSize:13,resize:"vertical",outline:"none",fontFamily:"inherit"}}),
              React.createElement("button", {onClick:submitTextarea, disabled:!input.trim(), style:{padding:"9px 0",borderRadius:8,border:"none",background:input.trim()?PURPLE:"#ddd",color:"white",fontSize:13,fontWeight:600,cursor:input.trim()?"pointer":"default"}}, "Save Email Message →")
            )
          : React.createElement("div", {style:{display:"flex",gap:8}},
              React.createElement("input", {value:input, onChange:function(e){setInput(e.target.value);}, onKeyDown:function(e){if(e.key==="Enter")send();}, placeholder:currentStep.placeholder||"Type your answer...", style:{flex:1,padding:"9px 12px",borderRadius:8,border:"1px solid #ddd",fontSize:13,outline:"none"}}),
              React.createElement("button", {onClick:send, disabled:!input.trim(), style:{padding:"9px 14px",borderRadius:8,border:"none",background:input.trim()?PURPLE:"#ddd",color:"white",fontSize:13,cursor:input.trim()?"pointer":"default"}}, "→")
            )
      )
  );
}

// ── Dashboard Home ────────────────────────────────────────────────────────────
function HomePage(props) {
  var org=props.org, employees=props.employees, jurisdictions=props.jurisdictions;
  var onHostingDone=props.onHostingDone, hostingDone=props.hostingDone;
  var empCount=employees.length;
  var stateCount=Object.keys(jurisdictions).length;
  var [showHosting, setShowHosting] = useState(false);
  var [hostingMode, setHostingMode] = useState("setup"); // "setup" | "send"
  var [published, setPublished] = useState(false);

  var nextSteps = [
    {done:true, title:"Review your handbook", desc:"Check AI-generated policies for accuracy", btn:null, hi:false, action:null},
    {done:true, title:"Approve & finalize", desc:"Lock in the handbook for distribution", btn:null, hi:false, action:null},
    {done:hostingDone, title:"Host your handbook", desc:"Publish to a secure, shareable URL employees can access anytime", btn: hostingDone ? "✓ Hosting Configured" : "Set Up Hosting →", hi:!hostingDone, action: hostingDone ? null : function(){ setHostingMode("setup"); setShowHosting(true); }},
    {done:published, title:"Send to employees", desc:"Email the handbook link to all "+empCount+" employees and collect acknowledgments", btn: published ? "✓ Sent!" : "Send to Employees →", hi:hostingDone&&!published, disabled:!hostingDone||published, action: (hostingDone&&!published) ? function(){ setHostingMode("send"); setShowHosting(true); } : null},
    {done:false, title:"Track acknowledgments", desc:"See who has read and signed off on the handbook", btn:"View Tracker →", hi:false, action:null}
  ];

  return React.createElement("div", {style:{flex:1,overflowY:"auto",position:"relative",transition:"padding-right 0.3s ease",paddingRight:showHosting?420:0}},
    React.createElement("div",{style:{background:"linear-gradient(120deg,"+PURPLE_LIGHT+" 0%,#ede9fe 100%)",padding:"28px 32px",borderBottom:"1px solid #e8e8e8"}},
      React.createElement("div",{style:{fontSize:24,fontWeight:700,color:PURPLE,marginBottom:4}},"Welcome to SixFifty"),
      React.createElement("div",{style:{fontSize:14,color:"#7c3aed"}},"Logged in as "+(org.companyName||"your organization"))
    ),
    React.createElement("div",{style:{padding:"28px 32px"}},
      React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:16,marginBottom:28}},
        QUICK_ACTIONS.map(function(qa){return React.createElement("div",{key:qa.title,style:{background:"#fff",borderRadius:12,padding:"18px 20px",border:"1px solid #eee",display:"flex",flexDirection:"column",gap:8}},React.createElement("div",{style:{width:34,height:34,borderRadius:8,background:qa.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}},qa.icon),React.createElement("div",{style:{fontSize:13,fontWeight:600,color:"#111"}},qa.title),React.createElement("div",{style:{fontSize:12,color:"#888",lineHeight:1.5,flex:1}},qa.desc),React.createElement("button",{style:{marginTop:4,padding:"6px 14px",borderRadius:20,border:"1.5px solid "+PURPLE,background:"transparent",color:PURPLE,fontSize:12,fontWeight:600,cursor:"pointer",alignSelf:"flex-start"}},qa.btn));})
      ),
      React.createElement("div",{style:{background:"#fff",borderRadius:12,border:"1px solid #eee",padding:"20px 24px",marginBottom:28,display:"flex",alignItems:"center",gap:20}},
        React.createElement("div",{style:{width:48,height:48,borderRadius:10,background:PURPLE_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}},"📘"),
        React.createElement("div",{style:{flex:1}},
          React.createElement("div",{style:{fontSize:15,fontWeight:700,color:"#111",marginBottom:2}},(org.companyName||"Your Company")+" Employee Handbook"),
          React.createElement("div",{style:{fontSize:12,color:"#888"}},"Generated today · "+stateCount+" jurisdictions · "+empCount+" employees")
        ),
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12}},
          React.createElement("span",{style:{fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:20,background:"#FEF9C3",color:"#854D0E",border:"1px solid #FDE047"}},"⚠ Needs Review"),
          React.createElement("span",{style:{fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:20,background:"#D1FAE5",color:"#065F46"}},"✓ Complete"),
          React.createElement("button",{style:{padding:"8px 18px",borderRadius:8,border:"none",background:PURPLE,color:"white",fontSize:13,fontWeight:600,cursor:"pointer"}},"Review Handbook →")
        )
      ),
      React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:24}},
        React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:24}},
          React.createElement("div",{style:{background:"#fff",borderRadius:12,border:"1px solid #eee",padding:"20px 24px"}},
            React.createElement("div",{style:{fontSize:14,fontWeight:700,color:"#111",marginBottom:4}},"Your Jurisdictions"),
            React.createElement("div",{style:{fontSize:12,color:"#888",marginBottom:16}},stateCount+" active states · "+empCount+" employees"),
            React.createElement(USMap,{activeStates:jurisdictions}),
            React.createElement("div",{style:{marginTop:12,display:"flex",flexWrap:"wrap",gap:6}},
              Object.keys(jurisdictions).map(function(state){return React.createElement("div",{key:state,style:{fontSize:11,padding:"3px 10px",borderRadius:10,background:PURPLE_LIGHT,color:PURPLE,fontWeight:500}},state+" · "+jurisdictions[state].employees);})
            )
          ),
          React.createElement("div",{style:{background:"#fff",borderRadius:12,border:"1px solid #eee",padding:"20px 24px"}},
            React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}},
              React.createElement("div",null,
                React.createElement("div",{style:{fontSize:14,fontWeight:700,color:"#111"}},"Next Steps"),
                React.createElement("div",{style:{fontSize:12,color:"#888",marginTop:2}},"Get your handbook live and into employees' hands")
              ),
              React.createElement("div",{style:{fontSize:11,color:PURPLE,fontWeight:600}},hostingDone?"3 of 5 complete":"2 of 5 complete")
            ),
            nextSteps.map(function(task,i){
              return React.createElement("div",{key:i,style:{display:"flex",gap:14,padding:"14px 0",borderBottom:i<4?"1px solid #f5f5f5":"none",alignItems:"flex-start"}},
                React.createElement("div",{style:{width:22,height:22,borderRadius:"50%",background:task.done?"#D1FAE5":task.hi?PURPLE_LIGHT:"#f4f4f4",border:"1.5px solid "+(task.done?"#6EE7B7":task.hi?PURPLE:"#e0e0e0"),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}},
                  task.done&&React.createElement("span",{style:{fontSize:11,color:"#065F46"}},"✓")
                ),
                React.createElement("div",{style:{flex:1}},
                  React.createElement("div",{style:{fontSize:13,fontWeight:600,color:task.done?"#aaa":"#111",textDecoration:task.done?"line-through":"none"}},task.title),
                  React.createElement("div",{style:{fontSize:12,color:"#aaa",marginTop:2,lineHeight:1.5}},task.desc)
                ),
                task.btn && React.createElement("button",{
                  disabled: !!task.disabled,
                  onClick: task.action||function(){},
                  style:{
                    padding:"6px 14px",borderRadius:8,border:"none",
                    background: task.disabled ? "#e8e8e8" : task.done ? "#D1FAE5" : task.hi ? PURPLE : "#f0f0f0",
                    color: task.disabled ? "#bbb" : task.done ? "#065F46" : task.hi ? "white" : "#666",
                    fontSize:12,fontWeight:600,
                    cursor: task.disabled||!task.action ? "default" : "pointer",
                    whiteSpace:"nowrap",flexShrink:0
                  }
                }, task.btn)
              );
            })
          )
        ),
        React.createElement("div",null,
          React.createElement("div",{style:{background:"#fff",borderRadius:12,border:"1px solid #eee",padding:"20px 24px"}},
            React.createElement("div",{style:{fontSize:14,fontWeight:700,color:"#111",marginBottom:12}},"Recent Activity"),
            [{time:"Just now",msg:"Onboarding completed",sub:"Org profile & employees set up"},
             {time:"Just now",msg:empCount+" employees imported",sub:"From your CSV upload"},
             {time:"Just now",msg:"Employee handbook generated",sub:"Ready for review"},
             {time:"Just now",msg:stateCount+" jurisdictions activated",sub:Object.keys(jurisdictions).join(", ")||"None yet"}
            ].map(function(item,i){
              return React.createElement("div",{key:i,style:{display:"flex",gap:12,paddingBottom:14,borderBottom:i<3?"1px solid #f5f5f5":"none",marginBottom:i<3?14:0}},
                React.createElement("div",{style:{width:8,height:8,borderRadius:"50%",background:PURPLE,flexShrink:0,marginTop:5}}),
                React.createElement("div",{style:{flex:1}},
                  React.createElement("div",{style:{fontSize:13,color:"#111",fontWeight:500}},item.msg),
                  React.createElement("div",{style:{fontSize:11,color:"#888",marginTop:2}},item.sub),
                  React.createElement("div",{style:{fontSize:10,color:"#bbb",marginTop:2}},item.time)
                )
              );
            })
          )
        )
      )
    ),
    showHosting && React.createElement(HostingPanel, {
      org: org,
      employees: employees,
      onClose: function(){ setShowHosting(false); },
      onSaved: function(d){ if(hostingMode==="setup"){ onHostingDone(d); } },
      startAtSend: hostingMode==="send",
      onPublished: function(){ setPublished(true); setShowHosting(false); }
    }),

  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  var [screen, setScreen] = useState("onboarding"); // onboarding | celebrating | dashboard
  var [orgPhase, setOrgPhase] = useState("org"); // org | employees
  var [profile, setProfile] = useState(EMPTY_PROFILE);
  var [orgComplete, setOrgComplete] = useState(false);
  var [messages, setMessages] = useState([{from:"ai",text:ORG_STEPS[0].question,chips:null,multiChip:false,contactForm:false}]);
  var [input, setInput] = useState("");
  var [loading, setLoading] = useState(false);
  var [multiSelected, setMultiSelected] = useState([]);
  var [contactInputs, setContactInputs] = useState({name:"",email:"",phone:""});
  var [openTips, setOpenTips] = useState({});
  var step = useRef(0);
  var bottomRef = useRef(null);
  var inputRef = useRef(null);

  var [empMessages, setEmpMessages] = useState([{from:"ai",text:"Great work on the org details! \uD83C\uDF89\n\nNow let\u2019s import your employees. Upload a CSV with:\n\nRequired: first_name, last_name, email\nOptional: city, state, location, title, department\n\nEmployee locations will auto-populate your jurisdiction counts."}]);
  var [empInput, setEmpInput] = useState("");
  var [employees, setEmployees] = useState([]);
  var [resolvingId, setResolvingId] = useState(null);
  var [empFilter, setEmpFilter] = useState("all");
  var [empTab, setEmpTab] = useState("contacts");
  var fileInputRef = useRef(null);
  var empBottomRef = useRef(null);

  var [genProgress, setGenProgress] = useState(0);
  var [genDone, setGenDone] = useState(false);
  var [genStatus, setGenStatus] = useState("");

  var [dashPage, setDashPage] = useState("home");
  var [activeNav, setActiveNav] = useState("Home");
  var [dropdownOpen, setDropdownOpen] = useState(false);
  var [hostingDone, setHostingDone] = useState(false);
  var [hostingData, setHostingData] = useState(null);

  var scrollBottom = useCallback(function(){setTimeout(function(){if(bottomRef.current)bottomRef.current.scrollIntoView({behavior:"smooth"});},50);},[]);
  var scrollEmpBottom = useCallback(function(){setTimeout(function(){if(empBottomRef.current)empBottomRef.current.scrollIntoView({behavior:"smooth"});},50);},[]);

  var profileComplete=!!(profile.companyName&&profile.entityType&&profile.industry&&profile.operatingYears&&profile.ptoPolicy&&profile.hrContactName&&profile.hrContactEmail&&profile.backupContactName&&profile.backupContactEmail);

  function advanceStep(ans,cs,cur){
    var np=ORG_STEPS[cs].extract(ans,cur); setProfile(np); step.current=cs+1;
    setMultiSelected([]); setContactInputs({name:"",email:"",phone:""});
    if(step.current>=ORG_STEPS.length){setLoading(true);setTimeout(function(){setMessages(function(p){return p.concat([{from:"ai",text:"Your org profile is complete! \uD83C\uDF89 Click 'Finish Org Details' below to continue.",chips:null,contactForm:false}]);});setOrgComplete(true);setLoading(false);scrollBottom();},600);}
    else{setLoading(true);setTimeout(function(){var s=ORG_STEPS[step.current],q=s.question;setMessages(function(p){return p.concat([{from:"ai",text:typeof q==="function"?q(np):q,chips:s.chips||null,multiChip:s.multiChip||false,contactForm:s.contactForm||false}]);});setLoading(false);if(inputRef.current)inputRef.current.focus();scrollBottom();},600);}
    scrollBottom();
  }
  function send(){var t=input.trim();if(!t||loading||orgComplete)return;setInput("");var cs=step.current;setMessages(function(p){return p.concat([{from:"user",text:t}]);});advanceStep(t,cs,profile);}
  function selectChip(chip){var cs=step.current;if(ORG_STEPS[cs]&&ORG_STEPS[cs].multiChip){setMultiSelected(function(p){return p.includes(chip)?p.filter(function(c){return c!==chip;}):p.concat([chip]);});}else{setMessages(function(p){return p.concat([{from:"user",text:chip}]);});advanceStep(chip,cs,profile);}}
  function confirmMulti(){if(!multiSelected.length)return;var cs=step.current,t=multiSelected.join(", ");setMessages(function(p){return p.concat([{from:"user",text:t}]);});advanceStep(t,cs,profile);}
  function submitContact(){var n=contactInputs.name,e=contactInputs.email,ph=contactInputs.phone;if(!n&&!e&&!ph)return;var cs=step.current;setMessages(function(p){return p.concat([{from:"user",text:[n,e,ph].filter(Boolean).join(" \xB7 ")}]);});setContactInputs({name:"",email:"",phone:""});advanceStep(JSON.stringify({name:n,email:e,phone:ph}),cs,profile);}
  function updateProfile(f,v){setProfile(function(p){return Object.assign({},p,{[f]:v});});}
  function toggleTip(i){setOpenTips(function(p){return Object.assign({},p,{[i]:!p[i]});});}

  function handleCSV(file){
    if(!file)return;
    var reader=new FileReader();
    reader.onload=function(e){
      var emps=parseCSV(e.target.result);
      var idxs=[];while(idxs.length<Math.min(3,emps.length)){var r=Math.floor(Math.random()*emps.length);if(idxs.indexOf(r)===-1)idxs.push(r);}
      emps=emps.map(function(emp,i){if(idxs.indexOf(i)===-1)return emp;var bad=Object.assign({},emp,{email:(emp.first_name||"x").toLowerCase()+(emp.last_name||"x").toLowerCase()+"bademail"});bad._errors=validateEmployee(bad);return bad;});
      setEmployees(emps);setEmpFilter("all");setEmpTab("contacts");
      var good=emps.filter(function(e){return e._errors.length===0;}).length,bad=emps.length-good;
      var statesFound=Object.keys(buildCounts(emps).stateCounts).sort();
      var stateSummary=statesFound.length>0?"\n\nLocations detected: "+statesFound.join(", ")+".":"\n\nNo location data detected.";
      setEmpMessages(function(prev){return prev.concat([{from:"user",text:file.name},{from:"ai",text:"\u2705 "+emps.length+" contacts added to your Contacts module and linked to your org profile.\n\n"+good+" ready"+(bad>0?", "+bad+" need attention.":".")+stateSummary}]);});
      scrollEmpBottom();
    };
    reader.readAsText(file);
  }
  function handleFileDrop(e){e.preventDefault();handleCSV(e.dataTransfer.files[0]);}
  function handleFileChange(e){handleCSV(e.target.files[0]);}
  function sendEmpMsg(){var t=empInput.trim();if(!t)return;setEmpInput("");setEmpMessages(function(p){return p.concat([{from:"user",text:t},{from:"ai",text:"Got it! Upload a CSV to import employees."}]);});scrollEmpBottom();}
  function setEmployeeLocation(id,jur){
    setEmployees(function(prev){
      var updated=prev.map(function(emp){if(emp._id!==id)return emp;var u=Object.assign({},emp,{state:jur});u._municipality=detectMunicipality(u.city||"",jur);u._errors=validateEmployee(u);return u;});
      var ws=updated.filter(function(e){return e.state;}).length;
      setEmpMessages(function(p){return p.concat([{from:"ai",text:"\uD83D\uDCCD Location assigned \u2014 "+ws+" of "+updated.length+" employees now have jurisdiction data."+(ws===updated.length?" All covered!":"")}]);});
      setTimeout(function(){if(empBottomRef.current)empBottomRef.current.scrollIntoView({behavior:"smooth"});},50);
      return updated;
    });
  }
  function saveResolve(id,email){setEmployees(function(prev){return prev.map(function(emp){if(emp._id!==id)return emp;var u=Object.assign({},emp,{email:email});u._errors=validateEmployee(u);return u;});});setResolvingId(null);}

  function startCelebration(){
    setScreen("celebrating");setGenProgress(0);setGenDone(false);setGenStatus("");
    var steps=[{pct:12,msg:"Analyzing your org profile..."},{pct:28,msg:"Applying jurisdiction-specific policies..."},{pct:45,msg:"Generating PTO & leave policies..."},{pct:60,msg:"Building harassment & ethics sections..."},{pct:74,msg:"Customizing for "+profile.industry+"..."},{pct:88,msg:"Applying state & local compliance rules..."},{pct:95,msg:"Finalizing your handbook..."},{pct:100,msg:"Your handbook is ready!"}];
    var i=0;
    function run(){if(i>=steps.length){setGenDone(true);return;}var s=steps[i];setGenProgress(s.pct);setGenStatus(s.msg);i++;setTimeout(run,700+Math.random()*400);}
    setTimeout(run,800);
  }

  var counts=buildCounts(employees);
  var readyCount=employees.filter(function(e){return e._errors.length===0&&e.state;}).length;
  var noStateCount=employees.filter(function(e){return e._errors.length===0&&!e.state;}).length;
  var badCount=employees.filter(function(e){return e._errors.length>0;}).length;
  var filteredEmps=employees.filter(function(emp){if(empFilter==="ready")return emp._errors.length===0&&emp.state;if(empFilter==="errors")return emp._errors.length>0;if(empFilter==="nostate")return emp._errors.length===0&&!emp.state;return true;});

  // Build jurisdiction data structure for dashboard
  var dashJurisdictions={};
  Object.keys(counts.stateCounts).forEach(function(state){dashJurisdictions[state]={employees:counts.stateCounts[state],municipalities:counts.munCounts[state]||{}};});

  function secHead(label){return React.createElement("div",{style:{fontSize:11,fontWeight:700,color:"#222",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8,marginTop:18,paddingBottom:4,borderBottom:"1px solid #f0f0f0"}},label);}

  var wrapStyle={width:"100%",height:"100vh",background:"linear-gradient(135deg,#f5f0ff 0%,#ede8ff 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-sans)",position:"relative"};
  var overlayStyle={position:"absolute",inset:0,background:"rgba(30,10,60,0.4)"};
  var modalStyle={position:"relative",width:"90%",maxWidth:980,height:"84vh",maxHeight:720,background:"#fff",borderRadius:16,boxShadow:"0 24px 80px rgba(0,0,0,0.25)",display:"flex",flexDirection:"column",overflow:"hidden"};

  var modalHeader=React.createElement("div",{style:{padding:"14px 24px",borderBottom:"1px solid #eee",display:"flex",alignItems:"center",gap:10,flexShrink:0}},
    React.createElement("div",{style:{width:30,height:30,borderRadius:8,background:PURPLE,display:"flex",alignItems:"center",justifyContent:"center"}},
      React.createElement("svg",{width:16,height:16,viewBox:"0 0 16 16",fill:"none"},React.createElement("rect",{x:1,y:2,width:10,height:12,rx:1.5,fill:"white",opacity:0.9}),React.createElement("path",{d:"M3 5h6M3 7.5h6M3 10h4",stroke:PURPLE,strokeWidth:1,strokeLinecap:"round"}),React.createElement("circle",{cx:13,cy:11,r:2.5,fill:"white"}),React.createElement("path",{d:"M12 11l.7.7 1.3-1.3",stroke:PURPLE,strokeWidth:0.9,strokeLinecap:"round"}))
    ),
    React.createElement("div",null,React.createElement("div",{style:{fontSize:14,fontWeight:700,color:"#111"}},"Sixfifty Onboarding"),React.createElement("div",{style:{fontSize:11,color:"#999"}},orgPhase==="org"?"Step 1 of 2 \u2014 Organization Details":"Step 2 of 2 \u2014 Employee Import")),
    React.createElement("div",{style:{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}},React.createElement("div",{style:{width:8,height:8,borderRadius:"50%",background:PURPLE}}),React.createElement("div",{style:{width:8,height:8,borderRadius:"50%",background:orgPhase==="employees"?PURPLE:"#e0e0e0"}}))
  );

  function renderMsg(m,i,isLastAI){
    return React.createElement("div",{key:i,style:{marginBottom:14}},
      React.createElement("div",{style:{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start"}},
        m.from==="ai"&&React.createElement("div",{style:{width:28,height:28,borderRadius:"50%",background:PURPLE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"white",fontWeight:700,flexShrink:0,marginRight:8,marginTop:2}},"AI"),
        React.createElement("div",{style:{maxWidth:"75%",padding:"10px 14px",borderRadius:m.from==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.from==="user"?PURPLE:"#f4f4f1",color:m.from==="user"?"white":"#111",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}},m.text)
      ),
      isLastAI&&m.chips&&React.createElement("div",{style:{paddingLeft:36,marginTop:8}},
        React.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:6}},m.chips.map(function(chip){var sel=multiSelected.includes(chip);return React.createElement("button",{key:chip,onClick:function(){selectChip(chip);},style:{padding:"5px 12px",borderRadius:20,border:"1.5px solid "+(sel?PURPLE:"#d0d0d0"),background:sel?PURPLE:"#fff",color:sel?"#fff":"#333",fontSize:12,cursor:"pointer"}},chip);})),
        m.multiChip&&multiSelected.length>0&&React.createElement("button",{onClick:confirmMulti,style:{marginTop:10,padding:"7px 18px",borderRadius:20,border:"none",background:PURPLE,color:"white",fontSize:12,fontWeight:600,cursor:"pointer"}},"Confirm "+multiSelected.length+" selected \u2192")
      ),
      isLastAI&&m.contactForm&&React.createElement("div",{style:{paddingLeft:36,marginTop:10}},
        React.createElement("div",{style:{background:"#f4f4f1",borderRadius:12,padding:14,display:"flex",flexDirection:"column",gap:8,maxWidth:"75%"}},
          ["name","email","phone"].map(function(k){return React.createElement("input",{key:k,type:k==="email"?"email":k==="phone"?"tel":"text",placeholder:k==="name"?"Full name":k==="email"?"Email address":"Phone number",value:contactInputs[k],onChange:function(e){var v=e.target.value;setContactInputs(function(p){return Object.assign({},p,{[k]:v});});},onKeyDown:function(e){if(e.key==="Enter")submitContact();},style:{padding:"8px 12px",borderRadius:8,border:"1px solid #ddd",fontSize:13,color:"#111",background:"#fff",outline:"none"}});}),
          React.createElement("button",{onClick:submitContact,style:{padding:"8px 0",borderRadius:8,border:"none",background:PURPLE,color:"white",fontSize:13,fontWeight:600,cursor:"pointer"}},"Confirm")
        )
      )
    );
  }

  // ── Celebration ──────────────────────────────────────────────────────────────
  if(screen==="celebrating") return React.createElement("div",{style:{width:"100%",height:"100vh",background:"linear-gradient(135deg,#f5f0ff 0%,#ede8ff 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-sans)",position:"relative"}},
    React.createElement("div",{style:{position:"absolute",inset:0,background:"rgba(20,10,40,0.75)"}}),
    React.createElement("div",{style:{position:"relative",width:"90%",maxWidth:520,background:"#fff",borderRadius:20,padding:"48px 40px",textAlign:"center",boxShadow:"0 32px 80px rgba(0,0,0,0.3)"}},
      React.createElement("div",{style:{fontSize:64,marginBottom:16}},"\uD83C\uDF89"),
      React.createElement("div",{style:{fontSize:28,fontWeight:700,color:"#111",marginBottom:10}},"Congratulations!"),
      React.createElement("div",{style:{fontSize:14,color:"#666",lineHeight:1.8,marginBottom:32,whiteSpace:"pre-line"}},"You're all set up and ready to use Sixfifty!\n\nWe're generating your first employee handbook based on the profile information you just gave us."),
      React.createElement("div",{style:{marginBottom:8,textAlign:"left"}},
        React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:8}},React.createElement("span",{style:{fontSize:13,color:"#666"}},genStatus||"Starting..."),React.createElement("span",{style:{fontSize:13,fontWeight:700,color:PURPLE}},genProgress+"%")),
        React.createElement("div",{style:{height:10,background:"#f0e8ff",borderRadius:10,overflow:"hidden"}},React.createElement("div",{style:{height:"100%",borderRadius:10,background:PURPLE,width:genProgress+"%",transition:"width 0.8s ease"}}))
      ),
      !genDone&&React.createElement("div",{style:{fontSize:12,color:"#bbb",marginTop:20}},"This usually takes just a moment..."),
      genDone&&React.createElement("div",{style:{display:"flex",gap:12,marginTop:32,justifyContent:"center"}},
        React.createElement("button",{onClick:function(){setScreen("dashboard");setDashPage("home");},style:{padding:"13px 28px",borderRadius:10,border:"none",background:PURPLE,color:"white",fontSize:14,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 14px rgba(107,33,168,0.35)"}},"View Handbook"),
        React.createElement("button",{onClick:function(){setScreen("dashboard");setDashPage("home");},style:{padding:"13px 28px",borderRadius:10,border:"2px solid "+PURPLE,background:"transparent",color:PURPLE,fontSize:14,fontWeight:600,cursor:"pointer"}},"Start Using Sixfifty")
      )
    ),
    React.createElement("style",null,"@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}")
  );

  // ── Dashboard ────────────────────────────────────────────────────────────────
  if(screen==="dashboard") return React.createElement("div",{style:{display:"flex",height:"100vh",fontFamily:"var(--font-sans)",color:"#111",background:"#fafaf8"},onClick:function(){setDropdownOpen(false);}},
    React.createElement("div",{style:{width:72,background:"#fff",borderRight:"1px solid #eee",display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 0",flexShrink:0}},
      React.createElement("div",{style:{width:36,height:36,borderRadius:8,background:PURPLE,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:24}},
        React.createElement("svg",{width:20,height:20,viewBox:"0 0 20 20",fill:"none"},React.createElement("rect",{x:2,y:2,width:7,height:7,rx:1.5,fill:"white"}),React.createElement("rect",{x:11,y:2,width:7,height:7,rx:1.5,fill:"white",opacity:0.6}),React.createElement("rect",{x:2,y:11,width:7,height:7,rx:1.5,fill:"white",opacity:0.6}),React.createElement("rect",{x:11,y:11,width:7,height:7,rx:1.5,fill:"white",opacity:0.3}))
      ),
      NAV_ITEMS.map(function(item){
        var active=activeNav===item.label;
        return React.createElement("button",{key:item.label,onClick:function(){setActiveNav(item.label);setDashPage("home");},title:item.label,style:{width:48,height:48,borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,border:"none",cursor:"pointer",background:active?PURPLE_LIGHT:"transparent",marginBottom:4}},React.createElement("span",{style:{fontSize:18}},item.icon),React.createElement("span",{style:{fontSize:9,color:active?PURPLE:"#888",fontWeight:active?600:400}},item.label));
      })
    ),
    React.createElement("div",{style:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}},
      React.createElement("div",{style:{height:52,background:"#fff",borderBottom:"1px solid #eee",display:"flex",alignItems:"center",padding:"0 24px",flexShrink:0}},
        React.createElement("div",{style:{flex:1,fontSize:14,fontWeight:600,color:"#111"}},(profile.companyName||"Your Company")+" \u25BE"),
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12}},
          React.createElement("button",{style:{background:"none",border:"none",cursor:"pointer",fontSize:18}},"\uD83D\uDD14"),
          React.createElement("div",{style:{position:"relative"}},
            React.createElement("div",{onClick:function(e){e.stopPropagation();setDropdownOpen(function(p){return !p;});},style:{width:36,height:36,borderRadius:"50%",background:PURPLE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"white",cursor:"pointer"}},profile.companyName?profile.companyName.slice(0,2).toUpperCase():"CH"),
            dropdownOpen&&React.createElement("div",{style:{position:"absolute",right:0,top:"calc(100% + 8px)",width:200,background:"#fff",borderRadius:10,border:"1px solid #eee",boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:999,overflow:"hidden"}},
              React.createElement("div",{style:{padding:"12px 16px",borderBottom:"1px solid #eee"}},React.createElement("div",{style:{fontSize:13,fontWeight:600}},profile.companyName||"Your Company"),React.createElement("div",{style:{fontSize:11,color:"#888"}},profile.hrContactEmail||"")),
              [{label:"Org Profile",action:function(){setDashPage("orgprofile");setDropdownOpen(false);},hi:true},
               {label:"Account Settings",action:function(){setDropdownOpen(false);}},
               {label:"Help & Support",action:function(){setDropdownOpen(false);}},
               {label:"Sign Out / Restart",action:function(){setScreen("onboarding");setOrgPhase("org");setProfile(EMPTY_PROFILE);setOrgComplete(false);setMessages([{from:"ai",text:ORG_STEPS[0].question,chips:null,multiChip:false,contactForm:false}]);setInput("");setLoading(false);setMultiSelected([]);setContactInputs({name:"",email:"",phone:""});setOpenTips({});step.current=0;setEmpMessages([{from:"ai",text:"Great work on the org details! \uD83C\uDF89\n\nNow let\u2019s import your employees. Upload a CSV with:\n\nRequired: first_name, last_name, email\nOptional: city, state, location, title, department\n\nEmployee locations will auto-populate your jurisdiction counts."}]);setEmpInput("");setEmployees([]);setResolvingId(null);setEmpFilter("all");setEmpTab("contacts");setGenProgress(0);setGenDone(false);setGenStatus("");setDashPage("home");setActiveNav("Home");setDropdownOpen(false);setHostingDone(false);setHostingData(null);}}
              ].map(function(item){return React.createElement("button",{key:item.label,onClick:item.action,style:{width:"100%",textAlign:"left",padding:"10px 16px",border:"none",background:"transparent",fontSize:13,color:item.hi?PURPLE:"#333",fontWeight:item.hi?600:400,cursor:"pointer"}},item.label);})
            )
          )
        )
      ),
      dashPage==="home"
        ?React.createElement(HomePage,{org:profile,employees:employees,jurisdictions:dashJurisdictions,hostingDone:hostingDone,hostingData:hostingData,onHostingDone:function(d){setHostingDone(true);setHostingData(d);}})
        :React.createElement(OrgProfilePage,{org:profile,onBack:function(){setDashPage("home");},jurisdictions:dashJurisdictions})
    )
  );

  // ── Onboarding ───────────────────────────────────────────────────────────────
  return React.createElement("div",{style:wrapStyle},
    React.createElement("div",{style:overlayStyle}),
    React.createElement("div",{style:modalStyle},
      modalHeader,
      React.createElement("div",{style:{flex:1,display:"flex",overflow:"hidden"}},
        orgPhase==="org"?React.createElement("div",{style:{flex:1,display:"flex",flexDirection:"column",borderRight:"1px solid #eee"}},
          React.createElement("div",{style:{flex:1,overflowY:"auto",padding:"20px 20px 0"}},
            messages.map(function(m,i){return renderMsg(m,i,m.from==="ai"&&i===messages.length-1&&!orgComplete);}),
            loading&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:14}},React.createElement("div",{style:{width:28,height:28,borderRadius:"50%",background:PURPLE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"white",fontWeight:700}},"AI"),React.createElement("div",{style:{padding:"10px 14px",borderRadius:"14px 14px 14px 4px",background:"#f4f4f1",display:"flex",gap:4,alignItems:"center"}},[0,1,2].map(function(i){return React.createElement("div",{key:i,style:{width:6,height:6,borderRadius:"50%",background:"#999",animation:"bounce 1s "+(i*0.2)+"s infinite"}});}))),
            React.createElement("div",{ref:bottomRef})
          ),
          React.createElement("div",{style:{padding:"12px 16px",borderTop:"1px solid #eee"}},
            React.createElement("div",{style:{display:"flex",gap:8}},
              React.createElement("input",{ref:inputRef,value:input,onChange:function(e){setInput(e.target.value);},onKeyDown:function(e){if(e.key==="Enter"&&!e.shiftKey)send();},placeholder:orgComplete?"Org details complete!":"Type your answer...",disabled:loading||orgComplete,style:{flex:1,padding:"9px 14px",borderRadius:8,border:"1px solid #ddd",fontSize:13,outline:"none",color:"#111",background:(loading||orgComplete)?"#fafafa":"#fff"}}),
              React.createElement("button",{onClick:send,disabled:loading||!input.trim()||orgComplete,style:{padding:"9px 16px",borderRadius:8,border:"none",background:(input.trim()&&!loading&&!orgComplete)?PURPLE:"#ddd",color:"white",fontSize:13,cursor:(input.trim()&&!loading&&!orgComplete)?"pointer":"default"}},"Send")
            )
          )
        ):React.createElement("div",{style:{flex:1,display:"flex",flexDirection:"column",borderRight:"1px solid #eee"}},
          React.createElement("div",{style:{flex:1,overflowY:"auto",padding:"20px 20px 0"}},
            empMessages.map(function(m,i){return renderMsg(m,i,false);}),
            React.createElement("div",{onDragOver:function(e){e.preventDefault();},onDrop:handleFileDrop,onClick:function(){fileInputRef.current&&fileInputRef.current.click();},style:{margin:"8px 0 16px",border:"2px dashed "+PURPLE,borderRadius:12,padding:"24px 20px",textAlign:"center",cursor:"pointer",background:PURPLE_LIGHT}},
              React.createElement("div",{style:{fontSize:26,marginBottom:6}},"\uD83D\uDCC2"),
              React.createElement("div",{style:{fontSize:13,fontWeight:600,color:PURPLE,marginBottom:3}},"Drop your CSV here or click to browse"),
              React.createElement("div",{style:{fontSize:11,color:"#999"}},"Required: first_name, last_name, email  \xB7  Optional: city, state, location, title")
            ),
            React.createElement("input",{ref:fileInputRef,type:"file",accept:".csv",style:{display:"none"},onChange:handleFileChange}),
            React.createElement("div",{ref:empBottomRef})
          ),
          React.createElement("div",{style:{padding:"12px 16px",borderTop:"1px solid #eee"}},
            React.createElement("div",{style:{display:"flex",gap:8}},
              React.createElement("input",{value:empInput,onChange:function(e){setEmpInput(e.target.value);},onKeyDown:function(e){if(e.key==="Enter")sendEmpMsg();},placeholder:"Ask a question about the import...",style:{flex:1,padding:"9px 14px",borderRadius:8,border:"1px solid #ddd",fontSize:13,outline:"none",color:"#111"}}),
              React.createElement("button",{onClick:sendEmpMsg,disabled:!empInput.trim(),style:{padding:"9px 16px",borderRadius:8,border:"none",background:empInput.trim()?PURPLE:"#ddd",color:"white",fontSize:13,cursor:empInput.trim()?"pointer":"default"}},"Send")
            )
          )
        ),
        orgPhase==="org"?React.createElement("div",{style:{width:300,overflowY:"auto",padding:"20px",background:"#fafaf8",flexShrink:0}},
          React.createElement("div",{style:{fontSize:14,fontWeight:700,color:"#111",marginBottom:2}},"Org Profile"),
          React.createElement("div",{style:{fontSize:11,color:"#aaa",marginBottom:14}},"Auto-filled as we chat."),
          React.createElement(OrgProgressBar,{profile:profile}),
          secHead("Company Details"),
          React.createElement(ProfileField,{label:"Company Name",value:profile.companyName,onChange:function(v){updateProfile("companyName",v);},tipInfo:STEP_INFO[0],tipOpen:!!openTips[0],onTipToggle:function(){toggleTip(0);}}),
          React.createElement(ProfileField,{label:"Entity Type",value:profile.entityType,onChange:function(v){updateProfile("entityType",v);},type:"select",options:ENTITY_TYPES,tipInfo:STEP_INFO[1],tipOpen:!!openTips[1],onTipToggle:function(){toggleTip(1);}}),
          React.createElement(ProfileField,{label:"Industry",value:profile.industry,onChange:function(v){updateProfile("industry",v);},type:"select",options:INDUSTRIES,tipInfo:STEP_INFO[2],tipOpen:!!openTips[2],onTipToggle:function(){toggleTip(2);}}),
          React.createElement(ProfileField,{label:"Operating Years",value:profile.operatingYears,onChange:function(v){updateProfile("operatingYears",v);},type:"number",tipInfo:STEP_INFO[3],tipOpen:!!openTips[3],onTipToggle:function(){toggleTip(3);}}),
          secHead("PTO Policy"),
          React.createElement(ProfileField,{label:"PTO Handling",value:profile.ptoPolicy,onChange:function(v){updateProfile("ptoPolicy",v);},type:"select",options:PTO_OPTIONS,tipInfo:STEP_INFO[4],tipOpen:!!openTips[4],onTipToggle:function(){toggleTip(4);}}),
          secHead("HR Contact"),
          React.createElement(ProfileField,{label:"Name",value:profile.hrContactName,onChange:function(v){updateProfile("hrContactName",v);},tipInfo:STEP_INFO[5],tipOpen:!!openTips[5],onTipToggle:function(){toggleTip(5);}}),
          React.createElement(ProfileField,{label:"Email",value:profile.hrContactEmail,onChange:function(v){updateProfile("hrContactEmail",v);},type:"email"}),
          React.createElement(ProfileField,{label:"Phone",value:profile.hrContactPhone,onChange:function(v){updateProfile("hrContactPhone",v);}}),
          secHead("Backup Contact"),
          React.createElement("div",{style:{fontSize:11,color:"#bbb",marginBottom:8,marginTop:-6}},"For sexual harassment reports"),
          React.createElement(ProfileField,{label:"Name",value:profile.backupContactName,onChange:function(v){updateProfile("backupContactName",v);},tipInfo:STEP_INFO[6],tipOpen:!!openTips[6],onTipToggle:function(){toggleTip(6);}}),
          React.createElement(ProfileField,{label:"Email",value:profile.backupContactEmail,onChange:function(v){updateProfile("backupContactEmail",v);},type:"email"}),
          React.createElement(ProfileField,{label:"Phone",value:profile.backupContactPhone,onChange:function(v){updateProfile("backupContactPhone",v);}})
        ):React.createElement("div",{style:{width:320,display:"flex",flexDirection:"column",background:"#fafaf8",flexShrink:0}},
          React.createElement("div",{style:{display:"flex",borderBottom:"1px solid #eee",flexShrink:0}},
            ["contacts","jurisdictions"].map(function(tab){var active=empTab===tab;var lbl=tab==="contacts"?"Contacts"+(employees.length?" ("+employees.length+")":""):"Jurisdictions"+(Object.keys(counts.stateCounts).length?" ("+Object.keys(counts.stateCounts).length+")":"");return React.createElement("button",{key:tab,onClick:function(){setEmpTab(tab);},style:{flex:1,padding:"12px 8px",border:"none",background:"transparent",fontSize:12,fontWeight:active?600:400,color:active?PURPLE:"#888",borderBottom:"2px solid "+(active?PURPLE:"transparent"),cursor:"pointer"}},lbl);})
          ),
          React.createElement("div",{style:{flex:1,overflowY:"auto",padding:"16px"}},
            empTab==="contacts"&&React.createElement("div",null,
              employees.length===0?React.createElement("div",{style:{fontSize:12,color:"#bbb",marginTop:8}},"Upload a CSV to see your employees here.")
              :React.createElement("div",null,
                React.createElement("div",{style:{display:"flex",gap:6,marginBottom:14}},
                  React.createElement("div",{onClick:function(){setEmpFilter(empFilter==="ready"?"all":"ready");},style:{flex:1,padding:"8px 6px",borderRadius:8,background:empFilter==="ready"?"#D1FAE5":"#F0FDF4",textAlign:"center",cursor:"pointer",border:"2px solid "+(empFilter==="ready"?"#065F46":"transparent")}},React.createElement("div",{style:{fontSize:16,fontWeight:700,color:"#065F46"}},readyCount),React.createElement("div",{style:{fontSize:10,color:"#6EE7B7"}},"Ready")),
                  noStateCount>0&&React.createElement("div",{onClick:function(){setEmpFilter(empFilter==="nostate"?"all":"nostate");},style:{flex:1,padding:"8px 6px",borderRadius:8,background:empFilter==="nostate"?"#FEF9C3":"#FEFCE8",textAlign:"center",cursor:"pointer",border:"2px solid "+(empFilter==="nostate"?"#854D0E":"transparent")}},React.createElement("div",{style:{fontSize:16,fontWeight:700,color:"#854D0E"}},noStateCount),React.createElement("div",{style:{fontSize:10,color:"#CA8A04"}},"More info needed")),
                  badCount>0&&React.createElement("div",{onClick:function(){setEmpFilter(empFilter==="errors"?"all":"errors");},style:{flex:1,padding:"8px 6px",borderRadius:8,background:empFilter==="errors"?"#FEE2E2":"#FFF5F5",textAlign:"center",cursor:"pointer",border:"2px solid "+(empFilter==="errors"?"#B91C1C":"transparent")}},React.createElement("div",{style:{fontSize:16,fontWeight:700,color:"#B91C1C"}},badCount),React.createElement("div",{style:{fontSize:10,color:"#FCA5A5"}},"Need fixing"))
                ),
                filteredEmps.map(function(emp){return React.createElement(EmployeeCard,{key:emp._id,emp:emp,onResolve:function(){setResolvingId(emp._id);},resolving:resolvingId===emp._id,onSave:function(email){saveResolve(emp._id,email);},onSetLocation:function(id,j){setEmployeeLocation(id,j);}});})
              )
            ),
            empTab==="jurisdictions"&&React.createElement("div",null,
              React.createElement("div",{style:{fontSize:12,color:"#888",marginBottom:12,lineHeight:1.6}},"Auto-detected from CSV location data. Municipalities shown are tracked compliance areas for each state."),
              Object.keys(counts.stateCounts).length===0?React.createElement("div",{style:{fontSize:12,color:"#bbb"}},"Upload a CSV with location data to see jurisdiction counts.")
              :React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
                Object.keys(counts.stateCounts).sort().map(function(state){
                  var detectedMuns=counts.munCounts[state]||{};
                  var knownMuns=MUNICIPALITIES[state]||[];
                  return React.createElement("div",{key:state,style:{padding:"10px 12px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff"}},
                    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:knownMuns.length?8:0}},
                      React.createElement("div",{style:{fontSize:12,fontWeight:700,color:"#222"}},state),
                      React.createElement("div",{style:{fontSize:12,fontWeight:600,color:PURPLE,background:PURPLE_LIGHT,padding:"2px 10px",borderRadius:10}},counts.stateCounts[state]+" employees")
                    ),
                    knownMuns.length>0&&React.createElement("div",null,
                      React.createElement("div",{style:{fontSize:10,color:"#aaa",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}},"Tracked municipalities"),
                      React.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:4}},
                        knownMuns.map(function(mun){
                          var count=detectedMuns[mun]||null;
                          return React.createElement("div",{key:mun,style:{fontSize:10,padding:"2px 8px",borderRadius:8,background:count?"#f5f0ff":"#f5f5f5",color:count?PURPLE:"#aaa",border:"1px solid "+(count?"#e0d5ff":"#eee")}},
                            mun+" \xB7 "+(count||0)
                          );
                        })
                      )
                    )
                  );
                })
              )
            )
          )
        )
      ),
      orgPhase==="org"
        ?React.createElement("div",{style:{padding:"14px 24px",borderTop:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"#fff"}},
            React.createElement("div",{style:{fontSize:12,color:"#aaa"}},(orgComplete||profileComplete)?"Org details complete \u2014 proceed to employee import.":"Answer all questions or fill in the profile to continue."),
            React.createElement("button",{disabled:!orgComplete&&!profileComplete,onClick:function(){setOrgPhase("employees");},style:{padding:"10px 28px",borderRadius:8,border:"none",fontSize:14,fontWeight:600,cursor:(orgComplete||profileComplete)?"pointer":"default",background:(orgComplete||profileComplete)?PURPLE:"#e8e8e8",color:(orgComplete||profileComplete)?"white":"#bbb",transition:"all 0.3s",boxShadow:(orgComplete||profileComplete)?"0 4px 14px rgba(107,33,168,0.35)":"none"}},"Finish Org Details \u2192")
          )
        :React.createElement("div",{style:{padding:"14px 24px",borderTop:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"#fff"}},
            React.createElement("button",{onClick:function(){setOrgPhase("org");},style:{padding:"10px 20px",borderRadius:8,border:"1px solid #e0e0e0",fontSize:13,fontWeight:500,cursor:"pointer",background:"transparent",color:"#666"}},"\u2190 Back"),
            React.createElement("div",{style:{fontSize:12,color:"#aaa"}},employees.length>0?employees.length+" employees imported.":"Upload a CSV to continue."),
            React.createElement("button",{onClick:function(){startCelebration();},style:{padding:"10px 28px",borderRadius:8,border:"none",fontSize:14,fontWeight:600,cursor:"pointer",background:PURPLE,color:"white",transition:"all 0.3s",boxShadow:"0 4px 14px rgba(107,33,168,0.35)"}},"Finish Onboarding \u2192")
          )
    ),
    React.createElement("style",null,"@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}")
  );
}
