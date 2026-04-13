import React from "react";
import { useState, useRef, useCallback } from "react";

const PURPLE = "#6B21A8";
const PURPLE_LIGHT = "#F3E8FF";

const JURISDICTIONS = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","Washington D.C."];
const ENTITY_TYPES = ["LLC","S-Corp","C-Corp","Sole Proprietorship","Partnership","Non-Profit","Government"];
const INDUSTRIES = ["Technology","Healthcare","Retail","Manufacturing","Finance","Education","Construction","Hospitality","Legal","Real Estate","Logistics","Other"];
const PTO_OPTIONS = ["Set Amount (fixed days/year)","Accrual Based","PTO covers sick leave","Unlimited PTO"];

const MUNICIPALITIES = {
  "California":["Berkeley","Emeryville","Los Angeles","Oakland","San Diego","San Francisco","San Jose","Santa Monica","West Hollywood"],
  "Colorado":["Denver"],"Florida":["Miami-Dade County"],"Illinois":["Cook County","Chicago"],
  "Maryland":["Montgomery County"],"Minnesota":["Minneapolis","St. Paul","Bloomington"],
  "New Mexico":["Unincorporated Areas of Bernalillo County"],"New York":["New York City","Westchester County"],
  "Pennsylvania":["Allegheny County","Philadelphia","Pittsburgh"],"Washington":["Seattle","Tacoma"]
};

const STATE_MAP = {"AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming","DC":"Washington D.C."};

const CITY_MUN = {"berkeley":"Berkeley","emeryville":"Emeryville","los angeles":"Los Angeles","oakland":"Oakland","san diego":"San Diego","san francisco":"San Francisco","san jose":"San Jose","santa monica":"Santa Monica","west hollywood":"West Hollywood","denver":"Denver","miami":"Miami-Dade County","chicago":"Chicago","evanston":"Cook County","skokie":"Cook County","minneapolis":"Minneapolis","st. paul":"St. Paul","saint paul":"St. Paul","bloomington":"Bloomington","albuquerque":"Unincorporated Areas of Bernalillo County","new york":"New York City","new york city":"New York City","brooklyn":"New York City","queens":"New York City","bronx":"New York City","manhattan":"New York City","yonkers":"Westchester County","philadelphia":"Philadelphia","pittsburgh":"Pittsburgh","seattle":"Seattle","tacoma":"Tacoma"};

const STEP_INFO = [
  {why:"Used throughout the handbook to personalize all policies.",how:"Enter your full legal or DBA company name."},
  {why:"Different entity types have different legal obligations.",how:"Choose your registered legal structure."},
  {why:"Industry affects which compliance policies are required.",how:"Pick your primary business activity."},
  {why:"Operating years gives context for policy maturity.",how:"How long the business has been operating."},
  {why:"PTO structure determines how the time-off section is written.",how:"Choose how you currently offer time off."},
  {why:"Employees need a clear point of contact for handbook questions.",how:"Provide the primary HR person's details."},
  {why:"Some state laws require a separate harassment complaint contact.",how:"Typically a senior leader or outside counsel."}
];

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

function validateEmployee(emp) {
  var errors = [];
  if (!emp.first_name) errors.push("Missing first name");
  if (!emp.last_name) errors.push("Missing last name");
  if (!emp.email) errors.push("Missing email");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.email)) errors.push("Invalid email");
  return errors;
}

function normalizeState(raw) {
  if (!raw || typeof raw !== "string") return "";
  var t = raw.trim();
  if (!t) return "";
  if (STATE_MAP[t.toUpperCase()]) return STATE_MAP[t.toUpperCase()];
  var found = JURISDICTIONS.find(function(j) { return j.toLowerCase() === t.toLowerCase(); });
  return found || "";
}

function detectMunicipality(city, state) {
  if (!city || !state || !MUNICIPALITIES[state]) return null;
  return CITY_MUN[city.trim().toLowerCase()] || null;
}

function buildCounts(employees) {
  var sc = {}, mc = {};
  employees.forEach(function(emp) {
    if (!emp.state) return;
    sc[emp.state] = (sc[emp.state] || 0) + 1;
    if (emp._municipality) {
      if (!mc[emp.state]) mc[emp.state] = {};
      mc[emp.state][emp._municipality] = (mc[emp.state][emp._municipality] || 0) + 1;
    }
  });
  return {stateCounts:sc, munCounts:mc};
}

function parseCSV(text) {
  var lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  var headers = lines[0].split(",").map(function(h) {
    return h.trim().toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"");
  });
  var rows = [];
  for (var li = 1; li < lines.length; li++) {
    var line = lines[li];
    if (!line.trim()) continue;
    var vals = [], cur = "", inQ = false;
    for (var ci = 0; ci < line.length; ci++) {
      var ch = line[ci];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    vals.push(cur.trim());
    var row = {};
    for (var hi = 0; hi < headers.length; hi++) { row[headers[hi]] = (vals[hi] || "").trim(); }
    rows.push(row);
  }
  var jLower = JURISDICTIONS.map(function(j) { return j.toLowerCase(); });
  var sLower = Object.keys(STATE_MAP).map(function(k) { return k.toLowerCase(); });
  var locationCol = null;
  for (var hIdx = 0; hIdx < headers.length; hIdx++) {
    var h = headers[hIdx];
    var hits = 0, total = 0;
    for (var rIdx = 0; rIdx < rows.length; rIdx++) {
      var val = (rows[rIdx][h] || "").toLowerCase().trim();
      if (!val) continue;
      total++;
      var parts = val.split(",");
      for (var pIdx = 0; pIdx < parts.length; pIdx++) {
        var part = parts[pIdx].trim();
        if (jLower.indexOf(part) >= 0 || sLower.indexOf(part) >= 0) { hits++; }
        else { var last = part.split(" ").pop(); if (sLower.indexOf(last) >= 0) hits++; }
      }
    }
    if (total > 0 && hits / total >= 0.3) { locationCol = h; break; }
  }
  return rows.map(function(row, idx) {
    var emp = Object.assign({_id:idx}, row);
    var loc = locationCol ? (emp[locationCol] || "") : "";
    if (loc && !emp.state) {
      var lp = loc.split(",");
      if (lp.length >= 2) {
        if (!emp.city) emp.city = (lp[0] || "").trim();
        emp.state = normalizeState((lp[lp.length-1] || "").trim());
      } else {
        var as = normalizeState(loc.trim());
        if (as) emp.state = as;
        else if (!emp.city) emp.city = loc.trim();
      }
    }
    if (emp.state) emp.state = normalizeState(emp.state);
    emp._municipality = detectMunicipality(emp.city || "", emp.state || "");
    emp._errors = validateEmployee(emp);
    return emp;
  });
}

function InfoTip(props) {
  var info=props.info, open=props.open, onToggle=props.onToggle;
  if (!info) return null;
  return React.createElement("span", {style:{position:"relative",display:"inline-block"}},
    React.createElement("button", {onClick:onToggle, style:{background:"none",border:"none",padding:"0 0 0 6px",cursor:"pointer",fontSize:11,color:"#bbb",textDecoration:"underline",textUnderlineOffset:2,whiteSpace:"nowrap"}}, open?"Close":"More info"),
    open && React.createElement("div", {style:{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:999,width:240,padding:"10px 12px",background:"#fff",borderRadius:8,border:"1px solid #e8e8e8",boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}},
      React.createElement("div", {style:{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}, "Why we ask"),
      React.createElement("div", {style:{fontSize:12,color:"#666",lineHeight:1.6,marginBottom:8}}, info.why),
      React.createElement("div", {style:{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}, "How to answer"),
      React.createElement("div", {style:{fontSize:12,color:"#666",lineHeight:1.6}}, info.how)
    )
  );
}

function ProfileField(props) {
  var label=props.label, value=props.value, onChange=props.onChange;
  var type=props.type||"text", options=props.options||[];
  var tipInfo=props.tipInfo, tipOpen=props.tipOpen, onTipToggle=props.onTipToggle;
  var isEmpty = !value;
  var bc = isEmpty ? "#eee" : "#d0d0d0", tc = isEmpty ? "#bbb" : "#111";
  var labelEl = label ? React.createElement("div", {style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}},
    React.createElement("div", {style:{fontSize:11,fontWeight:600,color:"#777",textTransform:"uppercase",letterSpacing:0.5}}, label),
    tipInfo ? React.createElement(InfoTip, {info:tipInfo,open:tipOpen,onToggle:onTipToggle}) : null
  ) : null;
  if (type === "select") return React.createElement("div", {style:{marginBottom:12}}, labelEl,
    React.createElement("select", {value:value, onChange:function(e){onChange(e.target.value);}, style:{width:"100%",padding:"7px 10px",borderRadius:6,border:"1px solid "+bc,fontSize:13,color:tc,background:"#fff",boxSizing:"border-box"}},
      React.createElement("option", {value:""}, "— not yet gathered —"),
      options.map(function(o) { return React.createElement("option", {key:o,value:o}, o); })
    )
  );
  return React.createElement("div", {style:{marginBottom:12}}, labelEl,
    React.createElement("input", {type:type, value:value, onChange:function(e){onChange(e.target.value);}, placeholder:"— not yet gathered —", style:{width:"100%",padding:"7px 10px",borderRadius:6,border:"1px solid "+bc,fontSize:13,color:tc,background:"#fff",boxSizing:"border-box"}})
  );
}

function ProgressBar(props) {
  var keys = Object.keys(EMPTY_PROFILE);
  var filled = keys.filter(function(k) { return !!props.profile[k]; }).length;
  var pct = Math.round((filled / keys.length) * 100);
  return React.createElement("div", {style:{marginBottom:16}},
    React.createElement("div", {style:{display:"flex",justifyContent:"space-between",marginBottom:4}},
      React.createElement("span", {style:{fontSize:11,fontWeight:500,color:"#888"}}, "Profile completion"),
      React.createElement("span", {style:{fontSize:11,fontWeight:600,color:pct===100?"#0F6E56":PURPLE}}, pct+"%")
    ),
    React.createElement("div", {style:{height:4,background:"#eee",borderRadius:2}},
      React.createElement("div", {style:{height:"100%",borderRadius:2,background:pct===100?"#1D9E75":PURPLE,width:pct+"%",transition:"width 0.5s"}})
    )
  );
}

function EmployeeCard(props) {
  var emp=props.emp, onResolve=props.onResolve, resolving=props.resolving, onSave=props.onSave, onSetLocation=props.onSetLocation;
  var hasErrors = emp._errors && emp._errors.length > 0;
  var name = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || "Unknown";
  var emailRef = useRef(null);
  return React.createElement("div", {style:{padding:"9px 11px",borderRadius:9,border:"1px solid "+(hasErrors?"#FCA5A5":emp.state?"#d1fae5":"#FDE047"),background:hasErrors?"#FFF5F5":emp.state?"#F0FDF4":"#FEFCE8",marginBottom:7}},
    React.createElement("div", {style:{display:"flex",alignItems:"flex-start",gap:8}},
      React.createElement("div", {style:{width:28,height:28,borderRadius:"50%",background:hasErrors?"#FEE2E2":emp.state?"#D1FAE5":"#FEF9C3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:hasErrors?"#B91C1C":emp.state?"#065F46":"#854D0E",flexShrink:0,marginTop:1}}, hasErrors?"!":emp.state?"✓":"?"),
      React.createElement("div", {style:{flex:1,minWidth:0}},
        React.createElement("div", {style:{fontSize:12,fontWeight:600,color:"#111",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}, name),
        React.createElement("div", {style:{fontSize:11,color:"#666",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}, emp.email||"no email"),
        emp.state
          ? React.createElement("div", {style:{fontSize:11,color:"#888"}}, emp.state+(emp._municipality?" · "+emp._municipality:""))
          : React.createElement("div", {style:{marginTop:4}},
              React.createElement("select", {defaultValue:"", onChange:function(e){var v=e.target.value; if(v) onSetLocation(emp._id,v);}, style:{fontSize:11,padding:"3px 6px",borderRadius:6,border:"1px solid #FDE047",background:"#FEF9C3",color:"#854D0E",cursor:"pointer",maxWidth:"100%"}},
                React.createElement("option", {value:""}, "+ assign jurisdiction"),
                JURISDICTIONS.map(function(j) { return React.createElement("option", {key:j,value:j}, j); })
              )
            )
      ),
      hasErrors && !resolving && React.createElement("button", {onClick:onResolve, style:{fontSize:11,padding:"3px 9px",borderRadius:6,border:"1px solid #F87171",color:"#B91C1C",background:"#FEE2E2",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}, "Resolve"),
      !hasErrors && emp.state && React.createElement("span", {style:{fontSize:11,color:"#065F46",fontWeight:600,flexShrink:0}}, "Ready")
    ),
    hasErrors && !resolving && React.createElement("div", {style:{marginTop:4,paddingLeft:36}},
      emp._errors.map(function(e,i) { return React.createElement("div", {key:i,style:{fontSize:11,color:"#B91C1C"}}, "• "+e); })
    ),
    resolving && React.createElement("div", {style:{marginTop:9,display:"flex",flexDirection:"column",gap:6}},
      React.createElement("div", {style:{fontSize:11,color:"#666",marginBottom:2}}, "Enter a valid email address:"),
      React.createElement("div", {style:{display:"flex",gap:6}},
        React.createElement("input", {ref:emailRef, type:"text", defaultValue:emp.email||"", placeholder:"email@example.com", style:{flex:1,padding:"6px 10px",borderRadius:6,border:"1px solid #ddd",fontSize:12,color:"#111",outline:"none"}}),
        React.createElement("button", {onClick:function(){var v=emailRef.current?emailRef.current.value:""; if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) onSave(v);}, style:{padding:"6px 12px",borderRadius:6,border:"none",background:PURPLE,color:"white",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}, "Save")
      )
    )
  );
}

function JurisdictionPanel(props) {
  var sc=props.stateCounts, mc=props.munCounts, manual=props.manualCounts, onChange=props.onChange;
  var states = Object.keys(sc).sort();
  if (states.length === 0) return React.createElement("div", {style:{fontSize:12,color:"#bbb",marginTop:8}}, "Jurisdiction counts will appear here after CSV upload.");
  return React.createElement("div", null,
    states.map(function(state) {
      var muns = MUNICIPALITIES[state] || [];
      var sk = "state__"+state;
      return React.createElement("div", {key:state, style:{marginBottom:12,padding:"10px 12px",borderRadius:9,border:"1px solid #e8e8e8",background:"#fff"}},
        React.createElement("div", {style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:muns.length?8:0}},
          React.createElement("div", {style:{fontSize:12,fontWeight:700,color:"#222"}}, state),
          React.createElement("div", {style:{display:"flex",alignItems:"center",gap:6}},
            React.createElement("span", {style:{fontSize:11,color:"#888"}}, (sc[state]||0)+" from CSV"),
            React.createElement("input", {type:"number",min:0, value:manual[sk]!==undefined?manual[sk]:(sc[state]||0), onChange:function(e){onChange(sk,e.target.value);}, style:{width:52,padding:"3px 6px",borderRadius:5,border:"1px solid #ddd",fontSize:12,color:"#111",textAlign:"center"}})
          )
        ),
        muns.length > 0 && React.createElement("div", {style:{display:"flex",flexDirection:"column",gap:5}},
          muns.map(function(mun) {
            var mk = "mun__"+state+"__"+mun;
            var csvC = (mc[state] && mc[state][mun]) || 0;
            return React.createElement("div", {key:mun, style:{display:"flex",alignItems:"center",justifyContent:"space-between",paddingLeft:10,borderLeft:"2px solid "+PURPLE_LIGHT}},
              React.createElement("div", {style:{fontSize:11,color:"#555"}}, mun),
              React.createElement("div", {style:{display:"flex",alignItems:"center",gap:6}},
                React.createElement("span", {style:{fontSize:10,color:"#bbb"}}, csvC+" detected"),
                React.createElement("input", {type:"number",min:0, value:manual[mk]!==undefined?manual[mk]:csvC, onChange:function(e){onChange(mk,e.target.value);}, style:{width:52,padding:"3px 6px",borderRadius:5,border:"1px solid #ddd",fontSize:12,color:"#111",textAlign:"center"}})
              )
            );
          })
        )
      );
    })
  );
}

export default function App() {
  var [phase, setPhase] = useState("org");
  var [celebrating, setCelebrating] = useState(false);
  var [genProgress, setGenProgress] = useState(0);
  var [genDone, setGenDone] = useState(false);
  var [genStatus, setGenStatus] = useState("");

  var [messages, setMessages] = useState([{from:"ai",text:ORG_STEPS[0].question,chips:null,multiChip:false,contactForm:false}]);
  var [input, setInput] = useState("");
  var [loading, setLoading] = useState(false);
  var [profile, setProfile] = useState(EMPTY_PROFILE);
  var [orgComplete, setOrgComplete] = useState(false);
  var [multiSelected, setMultiSelected] = useState([]);
  var [contactInputs, setContactInputs] = useState({name:"",email:"",phone:""});
  var [openTips, setOpenTips] = useState({});
  var step = useRef(0);
  var bottomRef = useRef(null);
  var inputRef = useRef(null);

  var [empMessages, setEmpMessages] = useState([{from:"ai",text:"Great work on the org details! 🎉\n\nNow let's import your employees. Upload a CSV with these columns:\n\nRequired: first_name, last_name, email\nOptional: city, state, location, title, department, phone\n\nEmployee location data will auto-populate your jurisdiction counts."}]);
  var [empInput, setEmpInput] = useState("");
  var [employees, setEmployees] = useState([]);
  var [resolvingId, setResolvingId] = useState(null);
  var [manualCounts, setManualCounts] = useState({});
  var [empFilter, setEmpFilter] = useState("all");
  var [empTab, setEmpTab] = useState("contacts");
  var fileInputRef = useRef(null);
  var empBottomRef = useRef(null);

  var scrollBottom = useCallback(function() { setTimeout(function() { if (bottomRef.current) bottomRef.current.scrollIntoView({behavior:"smooth"}); }, 50); }, []);
  var scrollEmpBottom = useCallback(function() { setTimeout(function() { if (empBottomRef.current) empBottomRef.current.scrollIntoView({behavior:"smooth"}); }, 50); }, []);

  function advanceStep(ans, cs, curProfile) {
    var np = ORG_STEPS[cs].extract(ans, curProfile);
    setProfile(np); step.current = cs + 1;
    setMultiSelected([]); setContactInputs({name:"",email:"",phone:""});
    if (step.current >= ORG_STEPS.length) {
      setLoading(true);
      setTimeout(function() { setMessages(function(p) { return p.concat([{from:"ai",text:"Your org profile is complete! 🎉 Click 'Finish Org Details' below to continue.",chips:null,contactForm:false}]); }); setOrgComplete(true); setLoading(false); scrollBottom(); }, 600);
    } else {
      setLoading(true);
      setTimeout(function() { var s=ORG_STEPS[step.current]; var q=s.question; setMessages(function(p) { return p.concat([{from:"ai",text:typeof q==="function"?q(np):q,chips:s.chips||null,multiChip:s.multiChip||false,contactForm:s.contactForm||false}]); }); setLoading(false); if(inputRef.current)inputRef.current.focus(); scrollBottom(); }, 600);
    }
    scrollBottom();
  }

  function send() { var t=input.trim(); if(!t||loading||orgComplete)return; setInput(""); var cs=step.current; setMessages(function(p){return p.concat([{from:"user",text:t}]);}); advanceStep(t,cs,profile); }
  function selectChip(chip) { var cs=step.current; if(ORG_STEPS[cs]&&ORG_STEPS[cs].multiChip){setMultiSelected(function(p){return p.includes(chip)?p.filter(function(c){return c!==chip;}):p.concat([chip]);});}else{setMessages(function(p){return p.concat([{from:"user",text:chip}]);});advanceStep(chip,cs,profile);} }
  function confirmMulti() { if(!multiSelected.length)return; var cs=step.current,t=multiSelected.join(", "); setMessages(function(p){return p.concat([{from:"user",text:t}]);}); advanceStep(t,cs,profile); }
  function submitContact() { var n=contactInputs.name,e=contactInputs.email,ph=contactInputs.phone; if(!n&&!e&&!ph)return; var cs=step.current; setMessages(function(p){return p.concat([{from:"user",text:[n,e,ph].filter(Boolean).join(" · ")}]);}); setContactInputs({name:"",email:"",phone:""}); advanceStep(JSON.stringify({name:n,email:e,phone:ph}),cs,profile); }
  function updateProfile(f,v) { setProfile(function(p){return Object.assign({},p,{[f]:v});}); }
  function toggleTip(i) { setOpenTips(function(p){return Object.assign({},p,{[i]:!p[i]});}); }

  var profileComplete = !!(profile.companyName&&profile.entityType&&profile.industry&&profile.operatingYears&&profile.ptoPolicy&&profile.hrContactName&&profile.hrContactEmail&&profile.backupContactName&&profile.backupContactEmail);

  function handleCSV(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      var emps = parseCSV(e.target.result);
      var idxs = [];
      while (idxs.length < Math.min(3, emps.length)) { var r=Math.floor(Math.random()*emps.length); if(idxs.indexOf(r)===-1)idxs.push(r); }
      emps = emps.map(function(emp,i) { if(idxs.indexOf(i)===-1)return emp; var bad=Object.assign({},emp,{email:(emp.first_name||"x").toLowerCase()+(emp.last_name||"x").toLowerCase()+"bademail"}); bad._errors=validateEmployee(bad); return bad; });
      setEmployees(emps); setManualCounts({}); setEmpFilter("all"); setEmpTab("contacts");
      var good=emps.filter(function(e){return e._errors.length===0;}).length;
      var bad=emps.length-good;
      var statesFound=Object.keys(buildCounts(emps).stateCounts).sort();
      var stateSummary=statesFound.length>0?"\n\nLocations detected: "+statesFound.join(", ")+".":"\n\nNo location data detected — use the '+ assign jurisdiction' dropdown on each contact.";
      setEmpMessages(function(prev){return prev.concat([{from:"user",text:file.name},{from:"ai",text:"✅ "+emps.length+" contacts added to your Contacts module and linked to your org profile.\n\nAny changes in the Contacts module will automatically sync here.\n\n"+good+" ready"+(bad>0?", "+bad+" need attention.":".")+stateSummary}]);});
      scrollEmpBottom();
    };
    reader.readAsText(file);
  }

  function handleFileDrop(e) { e.preventDefault(); handleCSV(e.dataTransfer.files[0]); }
  function handleFileChange(e) { handleCSV(e.target.files[0]); }

  function sendEmpMsg() { var t=empInput.trim(); if(!t)return; setEmpInput(""); setEmpMessages(function(p){return p.concat([{from:"user",text:t},{from:"ai",text:"Got it! Upload a CSV to import employees — their location data will auto-populate the Jurisdictions tab."}]);}); scrollEmpBottom(); }

  function setEmployeeLocation(id, jurisdiction) {
    setEmployees(function(prev) {
      var updated = prev.map(function(emp) { if(emp._id!==id)return emp; var u=Object.assign({},emp,{state:jurisdiction}); u._municipality=detectMunicipality(u.city||"",jurisdiction); u._errors=validateEmployee(u); return u; });
      var withState = updated.filter(function(e){return e.state;}).length;
      setEmpMessages(function(p){return p.concat([{from:"ai",text:"📍 Location assigned — "+withState+" of "+updated.length+" employees now have jurisdiction data."+(withState===updated.length?" All covered!":"")}]);});
      setTimeout(function(){if(empBottomRef.current)empBottomRef.current.scrollIntoView({behavior:"smooth"});},50);
      return updated;
    });
  }

  function saveResolve(id, newEmail) { setEmployees(function(prev){return prev.map(function(emp){if(emp._id!==id)return emp;var u=Object.assign({},emp,{email:newEmail});u._errors=validateEmployee(u);return u;});}); setResolvingId(null); }

  function startCelebration() {
    setCelebrating(true); setGenProgress(0); setGenDone(false); setGenStatus("");
    var steps = [{pct:12,msg:"Analyzing your org profile..."},{pct:28,msg:"Applying jurisdiction-specific policies..."},{pct:45,msg:"Generating PTO & leave policies..."},{pct:60,msg:"Building harassment & ethics sections..."},{pct:74,msg:"Customizing for your industry..."},{pct:88,msg:"Applying state & local compliance rules..."},{pct:95,msg:"Finalizing your handbook..."},{pct:100,msg:"Your handbook is ready!"}];
    var i = 0;
    function runStep() { if(i>=steps.length){setGenDone(true);return;} var s=steps[i]; setGenProgress(s.pct); setGenStatus(s.msg); i++; setTimeout(runStep, 700+Math.random()*400); }
    setTimeout(runStep, 800);
  }

  var counts = buildCounts(employees);
  var readyCount = employees.filter(function(e){return e._errors.length===0&&e.state;}).length;
  var noJurisdictionCount = employees.filter(function(e){return e._errors.length===0&&!e.state;}).length;
  var badCount = employees.filter(function(e){return e._errors.length>0;}).length;

  var filteredEmps = employees.filter(function(emp) {
    if (empFilter==="ready") return emp._errors.length===0 && emp.state;
    if (empFilter==="errors") return emp._errors.length>0;
    if (empFilter==="nostate") return emp._errors.length===0 && !emp.state;
    return true;
  });

  function secHead(label) { return React.createElement("div", {style:{fontSize:11,fontWeight:700,color:"#222",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8,marginTop:18,paddingBottom:4,borderBottom:"1px solid #f0f0f0"}}, label); }

  var wrapStyle = {width:"100%",height:"100vh",background:"linear-gradient(135deg,#f5f0ff 0%,#ede8ff 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-sans)",position:"relative"};
  var overlayStyle = {position:"absolute",inset:0,background:"rgba(30,10,60,0.4)"};
  var modalStyle = {position:"relative",width:"90%",maxWidth:980,height:"84vh",maxHeight:720,background:"#fff",borderRadius:16,boxShadow:"0 24px 80px rgba(0,0,0,0.25)",display:"flex",flexDirection:"column",overflow:"hidden"};

  var modalHeader = React.createElement("div", {style:{padding:"14px 24px",borderBottom:"1px solid #eee",display:"flex",alignItems:"center",gap:10,flexShrink:0}},
    React.createElement("div", {style:{width:30,height:30,borderRadius:8,background:PURPLE,display:"flex",alignItems:"center",justifyContent:"center"}},
      React.createElement("svg", {width:16,height:16,viewBox:"0 0 16 16",fill:"none"},
        React.createElement("rect", {x:1,y:2,width:10,height:12,rx:1.5,fill:"white",opacity:0.9}),
        React.createElement("path", {d:"M3 5h6M3 7.5h6M3 10h4",stroke:PURPLE,strokeWidth:1,strokeLinecap:"round"}),
        React.createElement("circle", {cx:13,cy:11,r:2.5,fill:"white"}),
        React.createElement("path", {d:"M12 11l.7.7 1.3-1.3",stroke:PURPLE,strokeWidth:0.9,strokeLinecap:"round"})
      )
    ),
    React.createElement("div", null,
      React.createElement("div", {style:{fontSize:14,fontWeight:700,color:"#111"}}, "Sixfifty Onboarding"),
      React.createElement("div", {style:{fontSize:11,color:"#999"}}, phase==="org"?"Step 1 of 2 — Organization Details":"Step 2 of 2 — Employee Import")
    ),
    React.createElement("div", {style:{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}},
      React.createElement("div", {style:{width:8,height:8,borderRadius:"50%",background:PURPLE}}),
      React.createElement("div", {style:{width:8,height:8,borderRadius:"50%",background:phase==="employees"?PURPLE:"#e0e0e0"}})
    )
  );

  function renderMsg(m, i, isLastAI) {
    return React.createElement("div", {key:i,style:{marginBottom:14}},
      React.createElement("div", {style:{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start"}},
        m.from==="ai" && React.createElement("div", {style:{width:28,height:28,borderRadius:"50%",background:PURPLE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"white",fontWeight:700,flexShrink:0,marginRight:8,marginTop:2}}, "AI"),
        React.createElement("div", {style:{maxWidth:"75%",padding:"10px 14px",borderRadius:m.from==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.from==="user"?PURPLE:"#f4f4f1",color:m.from==="user"?"white":"#111",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}}, m.text)
      ),
      isLastAI && m.chips && React.createElement("div", {style:{paddingLeft:36,marginTop:8}},
        React.createElement("div", {style:{display:"flex",flexWrap:"wrap",gap:6}},
          m.chips.map(function(chip) { var sel=multiSelected.includes(chip); return React.createElement("button", {key:chip,onClick:function(){selectChip(chip);},style:{padding:"5px 12px",borderRadius:20,border:"1.5px solid "+(sel?PURPLE:"#d0d0d0"),background:sel?PURPLE:"#fff",color:sel?"#fff":"#333",fontSize:12,cursor:"pointer"}}, chip); })
        ),
        m.multiChip && multiSelected.length>0 && React.createElement("button", {onClick:confirmMulti,style:{marginTop:10,padding:"7px 18px",borderRadius:20,border:"none",background:PURPLE,color:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}, "Confirm "+multiSelected.length+" selected →")
      ),
      isLastAI && m.contactForm && React.createElement("div", {style:{paddingLeft:36,marginTop:10}},
        React.createElement("div", {style:{background:"#f4f4f1",borderRadius:12,padding:14,display:"flex",flexDirection:"column",gap:8,maxWidth:"75%"}},
          ["name","email","phone"].map(function(k) {
            return React.createElement("input", {key:k,type:k==="email"?"email":k==="phone"?"tel":"text",placeholder:k==="name"?"Full name":k==="email"?"Email address":"Phone number",value:contactInputs[k],onChange:function(e){var v=e.target.value;setContactInputs(function(p){return Object.assign({},p,{[k]:v});});},onKeyDown:function(e){if(e.key==="Enter")submitContact();},style:{padding:"8px 12px",borderRadius:8,border:"1px solid #ddd",fontSize:13,color:"#111",background:"#fff",outline:"none"}});
          }),
          React.createElement("button", {onClick:submitContact,style:{padding:"8px 0",borderRadius:8,border:"none",background:PURPLE,color:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}, "Confirm")
        )
      )
    );
  }

  // ── Celebration screen ────────────────────────────────────────────
  if (celebrating) return React.createElement("div", {style:{width:"100%",height:"100vh",background:"linear-gradient(135deg,#f5f0ff 0%,#ede8ff 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-sans)",position:"relative"}},
    React.createElement("div", {style:{position:"absolute",inset:0,background:"rgba(20,10,40,0.75)"}}),
    React.createElement("div", {style:{position:"relative",width:"90%",maxWidth:520,background:"#fff",borderRadius:20,padding:"48px 40px",textAlign:"center",boxShadow:"0 32px 80px rgba(0,0,0,0.3)"}},
      React.createElement("div", {style:{fontSize:64,marginBottom:16}}, "🎉"),
      React.createElement("div", {style:{fontSize:28,fontWeight:700,color:"#111",marginBottom:10}}, "Congratulations!"),
      React.createElement("div", {style:{fontSize:14,color:"#666",lineHeight:1.8,marginBottom:32,whiteSpace:"pre-line"}}, "You're all set up and ready to use Sixfifty!\n\nWe're generating your first employee handbook based on the profile information you just gave us."),
      React.createElement("div", {style:{marginBottom:8,textAlign:"left"}},
        React.createElement("div", {style:{display:"flex",justifyContent:"space-between",marginBottom:8}},
          React.createElement("span", {style:{fontSize:13,color:"#666"}}, genStatus||"Starting..."),
          React.createElement("span", {style:{fontSize:13,fontWeight:700,color:PURPLE}}, genProgress+"%")
        ),
        React.createElement("div", {style:{height:10,background:"#f0e8ff",borderRadius:10,overflow:"hidden"}},
          React.createElement("div", {style:{height:"100%",borderRadius:10,background:PURPLE,width:genProgress+"%",transition:"width 0.8s ease"}})
        )
      ),
      !genDone && React.createElement("div", {style:{fontSize:12,color:"#bbb",marginTop:20}}, "This usually takes just a moment..."),
      genDone && React.createElement("div", {style:{display:"flex",gap:12,marginTop:32,justifyContent:"center"}},
        React.createElement("button", {style:{padding:"13px 28px",borderRadius:10,border:"none",background:PURPLE,color:"white",fontSize:14,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 14px rgba(107,33,168,0.35)"}}, "View Handbook"),
        React.createElement("button", {style:{padding:"13px 28px",borderRadius:10,border:"2px solid "+PURPLE,background:"transparent",color:PURPLE,fontSize:14,fontWeight:600,cursor:"pointer"}}, "Start Using Sixfifty")
      )
    ),
    React.createElement("style", null, "@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}")
  );

  // ── Phase 1: Org ──────────────────────────────────────────────────
  if (phase === "org") return React.createElement("div", {style:wrapStyle},
    React.createElement("div", {style:overlayStyle}),
    React.createElement("div", {style:modalStyle},
      modalHeader,
      React.createElement("div", {style:{flex:1,display:"flex",overflow:"hidden"}},
        React.createElement("div", {style:{flex:1,display:"flex",flexDirection:"column",borderRight:"1px solid #eee"}},
          React.createElement("div", {style:{flex:1,overflowY:"auto",padding:"20px 20px 0"}},
            messages.map(function(m,i){return renderMsg(m,i,m.from==="ai"&&i===messages.length-1&&!orgComplete);}),
            loading && React.createElement("div", {style:{display:"flex",alignItems:"center",gap:8,marginBottom:14}},
              React.createElement("div", {style:{width:28,height:28,borderRadius:"50%",background:PURPLE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"white",fontWeight:700}}, "AI"),
              React.createElement("div", {style:{padding:"10px 14px",borderRadius:"14px 14px 14px 4px",background:"#f4f4f1",display:"flex",gap:4,alignItems:"center"}},
                [0,1,2].map(function(i){return React.createElement("div",{key:i,style:{width:6,height:6,borderRadius:"50%",background:"#999",animation:"bounce 1s "+(i*0.2)+"s infinite"}});})
              )
            ),
            React.createElement("div", {ref:bottomRef})
          ),
          React.createElement("div", {style:{padding:"12px 16px",borderTop:"1px solid #eee"}},
            React.createElement("div", {style:{display:"flex",gap:8}},
              React.createElement("input", {ref:inputRef,value:input,onChange:function(e){setInput(e.target.value);},onKeyDown:function(e){if(e.key==="Enter"&&!e.shiftKey)send();},placeholder:orgComplete?"Org details complete!":"Type your answer...",disabled:loading||orgComplete,style:{flex:1,padding:"9px 14px",borderRadius:8,border:"1px solid #ddd",fontSize:13,outline:"none",color:"#111",background:(loading||orgComplete)?"#fafafa":"#fff"}}),
              React.createElement("button", {onClick:send,disabled:loading||!input.trim()||orgComplete,style:{padding:"9px 16px",borderRadius:8,border:"none",background:(input.trim()&&!loading&&!orgComplete)?PURPLE:"#ddd",color:"white",fontSize:13,cursor:(input.trim()&&!loading&&!orgComplete)?"pointer":"default"}}, "Send")
            )
          )
        ),
        React.createElement("div", {style:{width:300,overflowY:"auto",padding:"20px",background:"#fafaf8",flexShrink:0}},
          React.createElement("div", {style:{fontSize:14,fontWeight:700,color:"#111",marginBottom:2}}, "Org Profile"),
          React.createElement("div", {style:{fontSize:11,color:"#aaa",marginBottom:14}}, "Auto-filled as we chat."),
          React.createElement(ProgressBar, {profile:profile}),
          secHead("Company Details"),
          React.createElement(ProfileField, {label:"Company Name",value:profile.companyName,onChange:function(v){updateProfile("companyName",v);},tipInfo:STEP_INFO[0],tipOpen:!!openTips[0],onTipToggle:function(){toggleTip(0);}}),
          React.createElement(ProfileField, {label:"Entity Type",value:profile.entityType,onChange:function(v){updateProfile("entityType",v);},type:"select",options:ENTITY_TYPES,tipInfo:STEP_INFO[1],tipOpen:!!openTips[1],onTipToggle:function(){toggleTip(1);}}),
          React.createElement(ProfileField, {label:"Industry",value:profile.industry,onChange:function(v){updateProfile("industry",v);},type:"select",options:INDUSTRIES,tipInfo:STEP_INFO[2],tipOpen:!!openTips[2],onTipToggle:function(){toggleTip(2);}}),
          React.createElement(ProfileField, {label:"Operating Years",value:profile.operatingYears,onChange:function(v){updateProfile("operatingYears",v);},type:"number",tipInfo:STEP_INFO[3],tipOpen:!!openTips[3],onTipToggle:function(){toggleTip(3);}}),
          secHead("PTO Policy"),
          React.createElement(ProfileField, {label:"PTO Handling",value:profile.ptoPolicy,onChange:function(v){updateProfile("ptoPolicy",v);},type:"select",options:PTO_OPTIONS,tipInfo:STEP_INFO[4],tipOpen:!!openTips[4],onTipToggle:function(){toggleTip(4);}}),
          secHead("HR Contact"),
          React.createElement(ProfileField, {label:"Name",value:profile.hrContactName,onChange:function(v){updateProfile("hrContactName",v);},tipInfo:STEP_INFO[5],tipOpen:!!openTips[5],onTipToggle:function(){toggleTip(5);}}),
          React.createElement(ProfileField, {label:"Email",value:profile.hrContactEmail,onChange:function(v){updateProfile("hrContactEmail",v);},type:"email"}),
          React.createElement(ProfileField, {label:"Phone",value:profile.hrContactPhone,onChange:function(v){updateProfile("hrContactPhone",v);}}),
          secHead("Backup Contact"),
          React.createElement("div", {style:{fontSize:11,color:"#bbb",marginBottom:8,marginTop:-6}}, "For sexual harassment reports"),
          React.createElement(ProfileField, {label:"Name",value:profile.backupContactName,onChange:function(v){updateProfile("backupContactName",v);},tipInfo:STEP_INFO[6],tipOpen:!!openTips[6],onTipToggle:function(){toggleTip(6);}}),
          React.createElement(ProfileField, {label:"Email",value:profile.backupContactEmail,onChange:function(v){updateProfile("backupContactEmail",v);},type:"email"}),
          React.createElement(ProfileField, {label:"Phone",value:profile.backupContactPhone,onChange:function(v){updateProfile("backupContactPhone",v);}})
        )
      ),
      React.createElement("div", {style:{padding:"14px 24px",borderTop:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"#fff"}},
        React.createElement("div", {style:{fontSize:12,color:"#aaa"}}, (orgComplete||profileComplete)?"Org details complete — proceed to employee import.":"Answer all questions or fill in the profile to continue."),
        React.createElement("button", {disabled:!orgComplete&&!profileComplete,onClick:function(){setPhase("employees");},style:{padding:"10px 28px",borderRadius:8,border:"none",fontSize:14,fontWeight:600,cursor:(orgComplete||profileComplete)?"pointer":"default",background:(orgComplete||profileComplete)?PURPLE:"#e8e8e8",color:(orgComplete||profileComplete)?"white":"#bbb",transition:"all 0.3s",boxShadow:(orgComplete||profileComplete)?"0 4px 14px rgba(107,33,168,0.35)":"none"}}, "Finish Org Details →")
      )
    ),
    React.createElement("style", null, "@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}")
  );

  // ── Phase 2: Employees ────────────────────────────────────────────
  return React.createElement("div", {style:wrapStyle},
    React.createElement("div", {style:overlayStyle}),
    React.createElement("div", {style:modalStyle},
      modalHeader,
      React.createElement("div", {style:{flex:1,display:"flex",overflow:"hidden"}},
        React.createElement("div", {style:{flex:1,display:"flex",flexDirection:"column",borderRight:"1px solid #eee"}},
          React.createElement("div", {style:{flex:1,overflowY:"auto",padding:"20px 20px 0"}},
            empMessages.map(function(m,i){return renderMsg(m,i,false);}),
            React.createElement("div", {onDragOver:function(e){e.preventDefault();},onDrop:handleFileDrop,onClick:function(){fileInputRef.current&&fileInputRef.current.click();},style:{margin:"8px 0 16px",border:"2px dashed "+PURPLE,borderRadius:12,padding:"24px 20px",textAlign:"center",cursor:"pointer",background:PURPLE_LIGHT}},
              React.createElement("div", {style:{fontSize:26,marginBottom:6}}, "📂"),
              React.createElement("div", {style:{fontSize:13,fontWeight:600,color:PURPLE,marginBottom:3}}, "Drop your CSV here or click to browse"),
              React.createElement("div", {style:{fontSize:11,color:"#999"}}, "Required: first_name, last_name, email  ·  Optional: city, state, location, title, department")
            ),
            React.createElement("input", {ref:fileInputRef,type:"file",accept:".csv",style:{display:"none"},onChange:handleFileChange}),
            React.createElement("div", {ref:empBottomRef})
          ),
          React.createElement("div", {style:{padding:"12px 16px",borderTop:"1px solid #eee"}},
            React.createElement("div", {style:{display:"flex",gap:8}},
              React.createElement("input", {value:empInput,onChange:function(e){setEmpInput(e.target.value);},onKeyDown:function(e){if(e.key==="Enter")sendEmpMsg();},placeholder:"Ask a question about the import...",style:{flex:1,padding:"9px 14px",borderRadius:8,border:"1px solid #ddd",fontSize:13,outline:"none",color:"#111"}}),
              React.createElement("button", {onClick:sendEmpMsg,disabled:!empInput.trim(),style:{padding:"9px 16px",borderRadius:8,border:"none",background:empInput.trim()?PURPLE:"#ddd",color:"white",fontSize:13,cursor:empInput.trim()?"pointer":"default"}}, "Send")
            )
          )
        ),
        React.createElement("div", {style:{width:320,display:"flex",flexDirection:"column",background:"#fafaf8",flexShrink:0}},
          React.createElement("div", {style:{display:"flex",borderBottom:"1px solid #eee",flexShrink:0}},
            ["contacts","jurisdictions"].map(function(tab) {
              var active = empTab===tab;
              var lbl = tab==="contacts" ? ("Contacts"+(employees.length?" ("+employees.length+")":"")) : ("Jurisdictions"+(Object.keys(counts.stateCounts).length?" ("+Object.keys(counts.stateCounts).length+")":""));
              return React.createElement("button", {key:tab,onClick:function(){setEmpTab(tab);},style:{flex:1,padding:"12px 8px",border:"none",background:"transparent",fontSize:12,fontWeight:active?600:400,color:active?PURPLE:"#888",borderBottom:"2px solid "+(active?PURPLE:"transparent"),cursor:"pointer"}}, lbl);
            })
          ),
          React.createElement("div", {style:{flex:1,overflowY:"auto",padding:"16px"}},
            empTab==="contacts" && React.createElement("div", null,
              employees.length===0
                ? React.createElement("div", {style:{fontSize:12,color:"#bbb",marginTop:8}}, "Upload a CSV to see your employees here.")
                : React.createElement("div", null,
                    React.createElement("div", {style:{display:"flex",gap:6,marginBottom:14}},
                      React.createElement("div", {onClick:function(){setEmpFilter(empFilter==="ready"?"all":"ready");},style:{flex:1,padding:"8px 6px",borderRadius:8,background:empFilter==="ready"?"#D1FAE5":"#F0FDF4",textAlign:"center",cursor:"pointer",border:"2px solid "+(empFilter==="ready"?"#065F46":"transparent"),transition:"all 0.15s"}},
                        React.createElement("div", {style:{fontSize:16,fontWeight:700,color:"#065F46"}}, readyCount),
                        React.createElement("div", {style:{fontSize:10,color:"#6EE7B7"}}, "Ready")
                      ),
                      noJurisdictionCount>0 && React.createElement("div", {onClick:function(){setEmpFilter(empFilter==="nostate"?"all":"nostate");},style:{flex:1,padding:"8px 6px",borderRadius:8,background:empFilter==="nostate"?"#FEF9C3":"#FEFCE8",textAlign:"center",cursor:"pointer",border:"2px solid "+(empFilter==="nostate"?"#854D0E":"transparent"),transition:"all 0.15s"}},
                        React.createElement("div", {style:{fontSize:16,fontWeight:700,color:"#854D0E"}}, noJurisdictionCount),
                        React.createElement("div", {style:{fontSize:10,color:"#CA8A04"}}, "More info needed")
                      ),
                      badCount>0 && React.createElement("div", {onClick:function(){setEmpFilter(empFilter==="errors"?"all":"errors");},style:{flex:1,padding:"8px 6px",borderRadius:8,background:empFilter==="errors"?"#FEE2E2":"#FFF5F5",textAlign:"center",cursor:"pointer",border:"2px solid "+(empFilter==="errors"?"#B91C1C":"transparent"),transition:"all 0.15s"}},
                        React.createElement("div", {style:{fontSize:16,fontWeight:700,color:"#B91C1C"}}, badCount),
                        React.createElement("div", {style:{fontSize:10,color:"#FCA5A5"}}, "Need fixing")
                      )
                    ),
                    filteredEmps.map(function(emp) {
                      return React.createElement(EmployeeCard, {key:emp._id,emp:emp,onResolve:function(){setResolvingId(emp._id);},resolving:resolvingId===emp._id,onSave:function(email){saveResolve(emp._id,email);},onSetLocation:function(id,j){setEmployeeLocation(id,j);}});
                    })
                  )
            ),
            empTab==="jurisdictions" && React.createElement("div", null,
              React.createElement("div", {style:{fontSize:12,color:"#888",marginBottom:12,lineHeight:1.6}}, "Auto-detected from CSV location data. Adjust any count manually."),
              React.createElement(JurisdictionPanel, {stateCounts:counts.stateCounts,munCounts:counts.munCounts,manualCounts:manualCounts,onChange:function(k,v){setManualCounts(function(p){return Object.assign({},p,{[k]:v});}); }})
            )
          )
        )
      ),
      React.createElement("div", {style:{padding:"14px 24px",borderTop:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"#fff"}},
        React.createElement("button", {onClick:function(){setPhase("org");},style:{padding:"10px 20px",borderRadius:8,border:"1px solid #e0e0e0",fontSize:13,fontWeight:500,cursor:"pointer",background:"transparent",color:"#666"}}, "← Back"),
        React.createElement("div", {style:{fontSize:12,color:"#aaa"}}, employees.length>0?(readyCount+noJurisdictionCount+badCount)+" employees imported.":"Upload a CSV to continue."),
        React.createElement("button", {onClick:function(){startCelebration();},style:{padding:"10px 28px",borderRadius:8,border:"none",fontSize:14,fontWeight:600,cursor:"pointer",background:PURPLE,color:"white",transition:"all 0.3s",boxShadow:"0 4px 14px rgba(107,33,168,0.35)"}}, "Finish Onboarding →")
      )
    ),
    React.createElement("style", null, "@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}")
  );
}
