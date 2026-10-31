import {useState,useEffect,useContext} from 'react';import {api} from '../api.js';import {Ctx} from '../ctx.js';

// The server embeds JPEGs in the certificate PDF, so any image the organizer picks (PNG, JPG, WebP...) is converted here
// to a JPEG on a white background and scaled down. Transparent PNG signatures therefore work, and the upload stays small.
function toJpeg(file){return new Promise((res,rej)=>{const url=URL.createObjectURL(file),img=new Image();
 img.onload=()=>{const s=Math.min(1,900/img.width,300/img.height),w=Math.max(1,Math.round(img.width*s)),h=Math.max(1,Math.round(img.height*s));
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);URL.revokeObjectURL(url);
  let out='';for(const q of [0.92,0.8,0.65,0.5]){out=c.toDataURL('image/jpeg',q);if(out.length<450000)break}
  out.length<450000?res(out):rej(new Error('That image is too large. Please use a smaller signature image'))};
 img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('That file is not a readable image. Please choose a PNG, JPG or WebP file'))};img.src=url})}

const PLAIN=/^[\x20-\x7e]+$/;

// Organizer Dashboard > Certificate Authority: who signs the certificates of this organizer's events
export default function Authority(){const {toast}=useContext(Ctx);
 const [d,setD]=useState(null),[name,setName]=useState(''),[des,setDes]=useState(''),[sig,setSig]=useState(''),[changed,setChanged]=useState(false),[busy,setBusy]=useState(false),[err,setErr]=useState({});
 const load=()=>api('/organizer/certificate-authority').then(r=>{setD(r);setName(r.authority_name);setDes(r.designation);setSig(r.signature);setChanged(false)}).catch(e=>toast(e.message,1));
 useEffect(()=>{load()},[]);
 const pick=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{setSig(await toJpeg(f));setChanged(true)}catch(x){toast(x.message,1)}};
 const save=async e=>{e.preventDefault();const er={};
  if(!name.trim())er.name='Enter the authority name';else if(name.trim().length>60)er.name='Use at most 60 characters';else if(!PLAIN.test(name.trim()))er.name='Use plain English letters and numbers only';
  if(!des.trim())er.des='Enter the designation';else if(des.trim().length>80)er.des='Use at most 80 characters';else if(!PLAIN.test(des.trim()))er.des='Use plain English letters and numbers only';
  setErr(er);if(Object.keys(er).length)return;
  const body={authority_name:name.trim(),designation:des.trim()};if(changed){if(sig)body.signature=sig;else body.clear_signature=true}
  setBusy(true);try{const r=await api('/organizer/certificate-authority','POST',body);
   toast(r.message+(r.issued?` - ${r.issued} waiting certificate${r.issued>1?'s':''} issued`:''));load()}catch(x){toast(x.message,1)}finally{setBusy(false)}};
 if(!d)return <main><div className="sk"/></main>;
 const note={own:['ok','Active: certificates for your events are signed by this authority.'],
  default:['info','You have not set your own authority yet. The site-wide default is being used for your events. Save the form below to use your own.'],
  none:['warn','Not set up yet. Attendance is recorded, but certificates are on hold until you save an authority here. Waiting certificates are issued automatically when you save.']}[d.source];
 return <main><h2>Certificate Authority</h2>
  <div className={'notice '+note[0]} role="status">{note[1]}</div>
  <div className="authgrid">
   <form className="box" style={{margin:0,maxWidth:'none'}} onSubmit={save} noValidate>
    <label>Authority name<input value={name} maxLength={60} onChange={e=>{setName(e.target.value);setErr(x=>({...x,name:''}))}} placeholder="e.g. Dr. A. Kumar" aria-invalid={!!err.name} aria-describedby="e-name"/></label>
    {err.name&&<small id="e-name" className="ferr">{err.name}</small>}
    <label>Designation<input value={des} maxLength={80} onChange={e=>{setDes(e.target.value);setErr(x=>({...x,des:''}))}} placeholder="e.g. Head of Department, CSE" aria-invalid={!!err.des} aria-describedby="e-des"/></label>
    {err.des&&<small id="e-des" className="ferr">{err.des}</small>}
    <label>Signature image <small>(PNG, JPG or WebP; a transparent or white background works best)</small>
     <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} aria-label="Upload signature image"/></label>
    {sig&&<p><button type="button" className="o" onClick={()=>{setSig('');setChanged(true)}}>Remove signature image</button></p>}
    <p className="meta">Name and designation are printed under the signature line. Without an image, the line is left blank for a hand signature. Certificates already issued keep the signature they were issued with.</p>
    <button disabled={busy}>{busy?'Saving...':'Save certificate authority'}</button>
   </form>
   <div>
    <b>Preview of the signature block</b>
    <div className="sigprev" aria-label="Signature block preview">
     <div className="sigimg">{sig?<img src={sig} alt="Signature preview"/>:<span>No signature image</span>}</div>
     <div className="sigline"/><b>{name.trim()||'Authority name'}</b><div>{des.trim()||'Designation'}</div>
    </div>
   </div>
  </div></main>}
