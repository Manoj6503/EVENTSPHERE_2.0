import {useState,useEffect,useRef,useContext} from 'react';import {Html5Qrcode} from 'html5-qrcode';
import {api} from '../api.js';import {Ctx} from '../ctx.js';

// The organizer's live attendance QR encodes  <site>/#in=<eventId>.<token>  (a bare "<eventId>.<token>" is accepted too).
export function parseCheckin(text){const s=String(text||'').trim();const m=s.match(/#in=(\d+)\.([0-9a-f]+)/i)||s.match(/^(\d+)\.([0-9a-f]+)$/i);return m?{event_id:+m[1],token:m[2].toLowerCase()}:null}

function Camera({onText,onError}){const cb=useRef(onText);cb.current=onText;
 useEffect(()=>{let dead=false,busy=false;const s=new Html5Qrcode('stud-cam');
  const started=s.start({facingMode:'environment'},{fps:10,qrbox:{width:240,height:240}},t=>{if(dead||busy)return;busy=true;Promise.resolve(cb.current(t)).finally(()=>setTimeout(()=>{busy=false},2500))},()=>{})
   .catch(e=>{if(!dead)onError(e)});
  return()=>{dead=true;started.then(()=>s.stop()).then(()=>s.clear()).catch(()=>{})}},[]);
 return <div id="stud-cam" className="camview"/>}

// Student Dashboard scanner: point the camera at the organizer's QR and attendance is marked (and the certificate issued) straight away.
export default function StudentScan({onDone}){const {toast}=useContext(Ctx);
 const [open,setOpen]=useState(false),[hint,setHint]=useState(null),[res,setRes]=useState(null),[busy,setBusy]=useState(false);
 const submit=async text=>{const p=parseCheckin(text);
  if(!p){setHint('That QR code is not an attendance QR. Scan the QR the organizer is showing for this event.');return false}
  setOpen(false);setHint(null);setBusy(true);
  try{const j=await api('/attendance/self','POST',p);setRes({ok:true,j});onDone&&onDone()}catch(e){setRes({ok:false,text:e.message})}finally{setBusy(false)}
  return true};
 const camError=e=>{setOpen(false);const m=String(e&&e.message||e);
  setHint(/permission|denied|NotAllowed/i.test(m)?'Camera permission was blocked. Allow camera access for this site in your browser settings, then try again.'
   :'The camera could not start. Browsers only allow it on HTTPS (or localhost), so open the https:// link of this site. You can also upload a photo of the QR below.')};
 const fromFile=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;setHint(null);
  const s=new Html5Qrcode('stud-file');try{const t=await s.scanFile(f,false);await submit(t)}catch{setHint('No QR code was found in that photo. Try a clearer, closer picture of the organizer\'s QR.')}finally{try{s.clear()}catch{}}};
 const j=res&&res.j;
 return <div className="panel scanpanel" style={{maxWidth:'none',marginBottom:22}}>
  <h3 style={{marginTop:0}}>Scan attendance QR</h3>
  <p className="meta">On the day of the event, scan the QR shown by the organizer to mark your attendance. Your certificate is issued automatically.</p>
  {res&&<div className={'res '+(res.ok?(j.result==='ok'?'rok':'rwarn'):'rerr')} role="status">
   {res.ok?<>{j.result==='ok'?'✅ Attendance marked':'⚠️ Attendance was already marked'}{j.event&&<> for {j.event}</>}
    <div style={{fontWeight:500,marginTop:4}}>{j.name} ({j.reg_code})</div>
    {j.certificate_pending&&<div style={{fontWeight:500,marginTop:4}}>Your certificate will be issued as soon as the organizer sets the certificate authority.</div>}
    {j.certificate&&<div style={{marginTop:8}}><a className="btn" style={{textDecoration:'none',display:'inline-block'}} href={`/api/certificates/${j.certificate}/download`}>Download certificate</a></div>}</>
   :<>❌ {res.text}</>}</div>}
  {hint&&<div className="notice warn" role="alert">{hint}</div>}
  {open?<><Camera onText={submit} onError={camError}/><p className="meta" style={{textAlign:'center'}}>Point the camera at the organizer's QR code.</p>
    <p style={{textAlign:'center'}}><button className="o" onClick={()=>setOpen(false)}>Stop camera</button></p></>
   :<div className="row" style={{justifyContent:'flex-start',flexWrap:'wrap'}}>
    <button disabled={busy} onClick={()=>{setRes(null);setHint(null);setOpen(true)}}>{busy?'Marking attendance...':res?'📷 Scan again':'📷 Scan attendance QR'}</button>
    <label className="btn o" style={{boxShadow:'none',margin:0}}>Upload a photo of the QR<input type="file" accept="image/*" hidden onChange={fromFile} aria-label="Upload a photo of the attendance QR"/></label></div>}
  <div id="stud-file" hidden/></div>}
