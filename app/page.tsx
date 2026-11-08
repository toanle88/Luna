"use client";
import { useEffect, useRef, useState, type CSSProperties, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ArrowUpRight, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Droplet, Heart, History, Leaf, LockKeyhole, Plus, Settings2, Sparkles, Trash2, Pencil, X, Download, Upload, FileJson, LoaderCircle, Info } from "lucide-react";
import { dateKey, parse, add, diff, validDate, formatDate, periodDays, periodEnd, includesDate, validPeriod, estimatedEnd, resolveTracking, type TrackingMode, hasOverlap, variableHistory, projectionForDate, phaseAt, type Period } from "../lib/cycle";
import { translations, type Locale } from "../lib/i18n";
import { usePwa } from "../lib/use-pwa";
import { CycleChart, phaseLabel } from "../components/cycle-chart";
import { BackupError, prepareData, decodeBackup, encodeBackup, MAX_BACKUP_BYTES, type BackupPreview, type BackupErrorCode, type LunaData as Data, type Entry } from "../lib/backup";
import { InstallPanel } from "../components/luna-install";

const KEY="luna-cycle-v1";
const fresh=():Data=>({version:1,locale:"vi",trackingMode:"auto",cycleLength:28,periodLength:5,periods:[],entries:{}});
function Flower({className=""}:{className?:string}) {
 return <svg viewBox="0 0 100 100" className={className} aria-hidden="true"><g fill="currentColor"><ellipse cx="50" cy="30" rx="15" ry="28"/><ellipse cx="50" cy="70" rx="15" ry="28"/><ellipse cx="30" cy="50" rx="28" ry="15"/><ellipse cx="70" cy="50" rx="28" ry="15"/><ellipse cx="36" cy="36" rx="15" ry="26" transform="rotate(-45 36 36)"/><ellipse cx="64" cy="64" rx="15" ry="26" transform="rotate(-45 64 64)"/><ellipse cx="36" cy="64" rx="15" ry="26" transform="rotate(45 36 64)"/><ellipse cx="64" cy="36" rx="15" ry="26" transform="rotate(45 64 36)"/></g><circle cx="50" cy="50" r="11" fill="#f3dfb2"/></svg>;
}
function Modal({title,children,close,closeLabel}:{title:string;children:ReactNode;close:()=>void;closeLabel:string}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close()},[]);
 return <dialog ref={ref} onCancel={close} onClick={e=>{if(e.target===e.currentTarget)close()}}><div className="modal-head"><h2>{title}</h2><button className="icon-btn" aria-label={closeLabel} onClick={close}><X size={20}/></button></div>{children}</dialog>;
}
export default function Home() {
 const [data,setData]=useState<Data>(fresh);
 const [ready,setReady]=useState(false);
 const [storageError,setStorageError]=useState<""|"loadError"|"saveError">("");
 const [today,setToday]=useState(dateKey(new Date()));
 const [selected,setSelected]=useState(dateKey(new Date()));
 const [month,setMonth]=useState(new Date(new Date().getFullYear(),new Date().getMonth(),1));
 const [tab,setTab]=useState("Overview");
 const [modal,setModal]=useState<"period"|"settings"|"reset"|"install"|"import"|null>(null);
 const [editing,setEditing]=useState<string|null>(null);
 const [start,setStart]=useState("");
 const [error,setError]=useState<""|"invalidStart"|"periodOverlap">("");
 const [settingsError,setSettingsError]=useState(false);
 const [toast,setToast]=useState("");
 const [mode,setMode]=useState<TrackingMode>("auto");
 const [cycle,setCycle]=useState(28);
 const [length,setLength]=useState(5);
 const fileInput=useRef<HTMLInputElement>(null);
 const [importPreview,setImportPreview]=useState<BackupPreview|null>(null);
 const [importName,setImportName]=useState("");
 const [importError,setImportError]=useState<BackupErrorCode|"">("");
 const [importBusy,setImportBusy]=useState(false);
 const pwa=usePwa();
 const locale:Locale=data.locale==="en"?"en":"vi";
 const t=translations[locale];
 const effective=resolveTracking(data,today);
 const draftEffective=resolveTracking({...data,trackingMode:mode,cycleLength:cycle,periodLength:length},today);
 const fmt=(s:string,opts?:Intl.DateTimeFormatOptions)=>formatDate(s,t.locale,opts);
 useEffect(()=>{
  try{
   const raw=localStorage.getItem(KEY);
   if(raw){
    const d=JSON.parse(raw);
    if(d.version!==1||!Array.isArray(d.periods)||!d.entries||typeof d.entries!=="object"||Array.isArray(d.entries)||!Number.isInteger(d.cycleLength)||d.cycleLength<15||d.cycleLength>90||!Number.isInteger(d.periodLength)||d.periodLength<1||d.periodLength>31||!d.periods.every(validPeriod)||(d.trackingMode!==undefined&&d.trackingMode!=="auto"&&d.trackingMode!=="manual")||!Object.entries(d.entries).every(([key,e])=>validDate(key)&&!!e&&typeof e==="object"&&typeof (e as Entry).mood==="string"&&Array.isArray((e as Entry).symptoms)&&(e as Entry).symptoms.every(x=>typeof x==="string")&&typeof (e as Entry).note==="string"))throw Error();
    setData(prepareData({...d,locale:d.locale==="en"?"en":"vi"},dateKey(new Date())));
   }
  }catch{setStorageError("loadError")}
  const localToday=dateKey(new Date());setToday(localToday);setSelected(localToday);setMonth(new Date(parse(localToday).getFullYear(),parse(localToday).getMonth(),1));setReady(true);
 },[]);
 useEffect(()=>{document.documentElement.lang=locale;document.title=locale==="vi"?"Luna — Theo dõi chu kỳ của bạn":"Luna — Your cycle, at your pace"},[locale]);
 useEffect(()=>{const id=setInterval(()=>setToday(dateKey(new Date())),60000);return()=>clearInterval(id)},[]);
 useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(""),3500);return()=>clearTimeout(id)},[toast]);
 function save(next:Data,message?:string){
  try{const prepared=prepareData(next,today);localStorage.setItem(KEY,JSON.stringify(prepared));setData(prepared);setStorageError("");if(message)setToast(message);return true}
  catch{setStorageError("saveError");return false}
 }
 const periods=[...data.periods].sort((a,b)=>b.start.localeCompare(a.start));
 const last=periods.find(p=>p.start<=today);
 const next=last?add(last.start,effective.cycleLength):null;
 const until=next?diff(next,today):null;
 const current=periods.find(p=>includesDate(p,today,effective.periodLength));
 const limited=variableHistory(periods);
 const chartPeriod=periods.find(p=>p.start<=selected)||last||periods[0];
 const selectedModel=projectionForDate(periods,selected,effective.cycleLength,effective.periodLength,limited);
 const selectedPhase=phaseAt(selectedModel,selected);
 function selectDate(date:string){setSelected(date);setMonth(new Date(parse(date).getFullYear(),parse(date).getMonth(),1))}
 const loggingEffective=resolveTracking({...data,periods:data.periods.filter(p=>p.id!==editing)},today);
 const nextLoggedStart=periods.map(p=>p.start).filter(date=>date>start).sort()[0];
 const draftEnd=validDate(start)?estimatedEnd(start,loggingEffective.periodLength):null;
 const calculatedEnd=draftEnd&&nextLoggedStart&&add(nextLoggedStart,-1)<draftEnd?add(nextLoggedStart,-1):draftEnd;
 function openSettings(){setMode(effective.mode);setCycle(data.cycleLength);setLength(data.periodLength);setSettingsError(false);setModal("settings")}
 function openPeriod(date=selected){setEditing(null);setStart(date>today?today:date);setError("");setModal("period")}
 function editPeriod(p:Period){setEditing(p.id);setStart(p.start);setError("");setModal("period")}
 function logPeriod(e:FormEvent){
  e.preventDefault();
  if(!validDate(start)||start>today){setError("invalidStart");return}
  const others=data.periods.filter(p=>p.id!==editing);
  if(others.some(p=>p.start===start)){setError("periodOverlap");return}
  const period:Period={id:editing||crypto.randomUUID(),start,end:estimatedEnd(start,effective.periodLength),autoEnd:true};
  const candidate=prepareData({...data,periods:[...others,period]},today);
  if(hasOverlap(candidate.periods,resolveTracking(candidate,today).periodLength)){setError("periodOverlap");return}
  if(save(candidate,t.savedPeriod))setModal(null);
 }
 function saveSettings(e:FormEvent){
  e.preventDefault();
  const candidate=prepareData({...data,trackingMode:mode,cycleLength:mode==="manual"?cycle:data.cycleLength,periodLength:mode==="manual"?length:data.periodLength},today);
  if(hasOverlap(candidate.periods,resolveTracking(candidate,today).periodLength)){setSettingsError(true);return}
  if(save(candidate,t.preferencesSaved))setModal(null);
 }
 function exportData(){
  let text=encodeBackup(data);
  if(storageError==="loadError"){try{text=localStorage.getItem(KEY)||text}catch{}}
  const blob=new Blob([text],{type:"application/json"});const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`luna-backup-${dateKey(new Date())}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setToast(t.exported);
 }
 function chooseImport(){fileInput.current?.click()}
 async function readImport(e:ChangeEvent<HTMLInputElement>){
  const file=e.currentTarget.files?.[0];e.currentTarget.value="";
  if(!file)return;
  setImportBusy(true);setImportError("");setImportPreview(null);setImportName(file.name);setModal("import");
  try{
   if(file.size>MAX_BACKUP_BYTES)throw new BackupError("importTooLarge");
   const preview=decodeBackup(await file.text(),dateKey(new Date()),locale);
   setImportPreview(preview);
  }catch(error){setImportError(error instanceof BackupError?error.code:"importReadError")}
  finally{setImportBusy(false)}
 }
 function confirmImport(){
  if(!importPreview)return;
  const restored=importPreview.data;
  if(save(restored,translations[restored.locale??locale].imported)){
   setMode(restored.trackingMode??"auto");setCycle(restored.cycleLength);setLength(restored.periodLength);setSettingsError(false);
   setImportPreview(null);setImportError("");selectDate(today);setTab("Overview");setModal(null);
  }
 }
 const first=(new Date(month.getFullYear(),month.getMonth(),1).getDay()+6)%7;
 const days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 const calendar=<section className="card calendar-card">
  <div className="card-heading"><div><span className="eyebrow">{t.yourCalendar}</span><h2>{month.toLocaleDateString(t.locale,{month:"long",year:"numeric"})}</h2></div><div className="month-arrows"><button className="icon-btn" aria-label={t.previousMonth} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft size={18}/></button><button className="icon-btn" aria-label={t.nextMonth} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight size={18}/></button></div></div>
  <div className="weekdays">{t.weekdays.map((s,i)=><span key={i}>{s}</span>)}</div>
  <div className="days">{Array.from({length:first},(_,i)=><span key={"blank"+i}/>)}{Array.from({length:days},(_,i)=>{
   const d=dateKey(new Date(month.getFullYear(),month.getMonth(),i+1));
   const withinPeriod=periods.some(p=>includesDate(p,d,effective.periodLength));
   const state=phaseAt(projectionForDate(periods,d,effective.cycleLength,effective.periodLength,limited),d);
   const logged=withinPeriod&&d<=today;
   const predicted=!logged&&((withinPeriod&&d>today)||(next&&d>=next&&d<=add(next,effective.periodLength-1)&&d>=today));
   return <button key={d} aria-label={`${fmt(d,{month:"long",day:"numeric",year:"numeric"})}${logged?`, ${t.period}`:predicted?`, ${t.estimatedPeriod}`:` · ${phaseLabel(t,state.phase)}`}`} aria-pressed={selected===d} className={`date calendar-phase-${state.phase} ${logged?"logged":""} ${predicted?"predicted":""} ${today===d?"today":""} ${selected===d?"selected":""}`} onClick={()=>setSelected(d)}><span>{i+1}</span>{state.phase==="ovulation"&&<i className="calendar-ovulation" aria-hidden="true">✦</i>}</button>;
  })}</div>
  <div className="legend"><span><i className="legend-dot period-dot"/>{t.period}</span><span><i className="legend-dot predicted-dot"/>{t.estimated}</span><span><i className="legend-dot phase-fertile"/>{t.chartFertile}</span><span><i className="legend-dot phase-ovulation"/>{t.chartOvulation}</span></div>
  <div className="calendar-bottom"><span>{selected===today?t.today:fmt(selected)} <span className="muted">· {phaseLabel(t,selectedPhase.phase)}</span></span><button className="text-btn" onClick={()=>{setSelected(today);setMonth(new Date(parse(today).getFullYear(),parse(today).getMonth(),1))}}>{t.goToday}</button></div>
 </section>;
 if(!ready)return <div className="loading"><Flower/><p>{t.opening}</p></div>;
 return <div className={`app locale-${locale}`}>
  <header className="header"><a href="/" className="brand" aria-label={t.home}><Flower/><span>luna<span className="brand-dot">.</span></span></a><nav aria-label={t.navigation}>{[{name:"Overview",label:t.overview,Icon:Leaf},{name:"Calendar",label:t.calendar,Icon:CalendarDays},{name:"History",label:t.history,Icon:History}].map(({name,label,Icon})=><button key={name} className={tab===name?"active":""} onClick={()=>setTab(name)}><Icon size={16}/>{label}</button>)}</nav><div className="header-right"><span className="device"><span/>{t.justYou}</span>{!pwa.installed&&<button className="icon-btn install-header" title={t.install} aria-label={t.install} onClick={()=>setModal("install")}><Download size={18}/></button>}<button className="icon-btn settings" title={t.settings} aria-label={t.settings} onClick={openSettings}><Settings2 size={20}/></button></div></header>
  <main>{storageError&&<div className="error" role="alert">{t[storageError]}</div>}
   <div className="page-heading"><div><div className="eyebrow heading-date"><span className="tiny-star">✦</span>{fmt(today,{weekday:"long",month:"long",day:"numeric"})}</div><h1>{tab==="Overview"?<>{t.headingA} <em>{t.headingB}</em></>:tab==="Calendar"?<>{t.calendarA} <em>{t.calendarB}</em></>:<>{t.historyA} <em>{t.historyB}</em></>}</h1><p>{tab==="History"?t.historySubtitle:t.subtitle}</p></div><button className="primary" onClick={()=>openPeriod()}><Plus size={18}/>{t.logPeriod}</button></div>
   {current?.autoEnd&&<section className="ongoing-banner"><div><Droplet size={18}/><span><strong>{t.currentEstimate}</strong><small>{t.currentEstimateText(fmt(periodEnd(current,effective.periodLength)))}</small></span></div><button className="secondary" onClick={openSettings}>{t.adjust}<Settings2 size={15}/></button></section>}
   {tab!=="History"?<>
    <div className={`top-grid ${tab==="Calendar"?"calendar-view":""}`}>
     {tab==="Overview"&&<section className={`cycle-card hero-phase-${selectedPhase.phase}`}>
      <div className="cycle-top"><span className="eyebrow">{t.atGlance}</span><span className="pill"><span/>{t.heroBadges[selectedPhase.phase]}</span></div>
      <div className="cycle-content">
       <div className={`cycle-ring ${selectedPhase.day!==null?"has-data":""}`} style={{"--progress":`${selectedPhase.day&&selectedModel?Math.min(selectedPhase.day/selectedModel.length,1)*100:0}%`} as CSSProperties}>
        <div className="ring-inner"><span className="ring-label">{t.cycleDay}</span><strong>{selectedPhase.day??"—"}</strong><span className="ring-sub">{selectedModel?t.ofDays(selectedModel.length):t.chartUnknown}</span></div><span className="ring-spark">✦</span>
       </div>
       <div className="cycle-description hero-day-status" aria-live="polite">
        <span className="small-label">{selected===today?t.today:fmt(selected,{day:"numeric",month:"short"})} · {t.chartEstimated}</span>
        <h2>{t.heroPhases[selectedPhase.phase]}</h2>
        <p>{t.heroNotes[selectedPhase.phase]}</p>
        {selectedPhase.menstruating&&selectedPhase.phase!=="period"&&<span className="hero-overlap"><Droplet size={11}/>{t.chartAlsoPeriod}</span>}
        <button className="cycle-link" onClick={()=>openPeriod()}>{last?t.addPeriod:t.getStarted}<ArrowRight size={17}/></button>
       </div>
      </div><div className="cycle-stats"><div><Droplet size={17}/><span>{t.days(last?periodDays(last,effective.periodLength):"—")}<small>{t.lastPeriod}</small></span></div><div><CalendarDays size={17}/><span>{next?fmt(next):t.notYet}<small>{t.nextPeriod}</small></span></div><div><Sparkles size={17}/><span>{t.days(effective.cycleLength)}<small>{t.cycleLengthLabel}</small></span></div></div></section>}
     {calendar}
    </div>
    <CycleChart periods={periods} period={chartPeriod} length={effective.cycleLength} duration={effective.periodLength} limited={limited} selected={selected} today={today} locale={locale} onSelect={selectDate} onLog={()=>openPeriod()} onSettings={openSettings}/>
    <div className="summary-grid"><aside className="side-stack"><section className="rhythm-card"><div className="eyebrow"><Sparkles size={13}/>{t.lookingAhead}</div><h2>{next?(until??0)>0?<>{t.nextInA}<br/><em>{t.nextInB(until!)}</em></>:<>{t.expectedA}<br/><em>{t.expectedB}</em></>:<>{t.momentsA}<br/><em>{t.momentsB}</em></>}</h2><p>{next?t.prediction(fmt(next,{month:"long",day:"numeric"}),effective.cycleLength):t.personalCalendar}</p><div className="rhythm-footer">{next?t.estimateDisclaimer:t.noRush}</div><Flower className="decor-flower"/></section><section className="privacy-card"><span className="privacy-icon"><LockKeyhole size={20}/></span><div><h3>{t.yourData}</h3><p>{t.browserOnly}<br/>{t.noAccount}</p><button className="text-btn" onClick={openSettings}>{t.manageData}<ArrowUpRight size={13}/></button></div></section></aside></div>
   </>:<section className="card history-card"><div className="card-heading"><div><div className="eyebrow">{t.story}</div><h2>{t.periodHistory}</h2></div><span className="soft-label">{t.entries(periods.length)}</span></div>{periods.length?periods.map(p=><div className="history-row" key={p.id}><span className="history-icon"><Droplet size={20}/></span><div><strong>{fmt(p.start,{month:"short",day:"numeric",year:"numeric"})} – {fmt(periodEnd(p,effective.periodLength),{month:"short",day:"numeric",year:"numeric"})}</strong><p>{t.days(periodDays(p,effective.periodLength))}{p.autoEnd?` · ${t.autoLabel}`:""}</p></div><button className="icon-btn" aria-label={`${t.edit}: ${fmt(p.start)}`} onClick={()=>editPeriod(p)}><Pencil size={17}/></button><button className="icon-btn" aria-label={`${t.remove}: ${fmt(p.start)}`} onClick={()=>save({...data,periods:data.periods.filter(x=>x.id!==p.id)},t.removedPeriod)}><Trash2 size={17}/></button></div>):<div className="empty"><Flower/><h2>{t.emptyTitle}</h2><p>{t.emptyText}</p><button className="primary" onClick={()=>openPeriod()}><Plus size={17}/>{t.logFirst}</button></div>}</section>}
   <footer><span className="footer-brand"><Flower/>{t.footer}</span><span>{t.madeForYou}<Heart size={12}/></span></footer>
  </main>
  {toast&&<div role="status" className="toast"><Check size={17}/>{toast}</div>}
  {modal==="period"&&<Modal title={editing?t.editPeriod:t.logPeriod} close={()=>setModal(null)} closeLabel={t.close}><p className="modal-intro">{t.formIntro}</p><form onSubmit={logPeriod}><label>{t.startDate}<input required type="date" value={start} max={today} onChange={e=>setStart(e.target.value)}/></label><div className="calculated-date"><CalendarDays size={18}/><div><span>{t.estimatedEnd}</span><output>{calculatedEnd?fmt(calculatedEnd,{weekday:"short",day:"numeric",month:"long",year:"numeric"}):"—"}</output></div><Sparkles size={15}/></div><p className="subtle">{effective.mode==="auto"?t.autoEndHelpAuto(loggingEffective.periodLength):t.autoEndHelp(loggingEffective.periodLength)}</p>{error&&<p className="error" role="alert">{t[error]}</p>}<div className="form-note"><LockKeyhole size={14}/>{t.privacyNote}</div><button className="primary full" type="submit"><Check size={17}/>{t.savePeriod}</button></form></Modal>}
  {modal==="settings"&&<Modal title={t.preferences} close={()=>setModal(null)} closeLabel={t.close}><p className="modal-intro">{t.preferencesIntro}</p><input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={readImport}/><label className="language-label">{t.language}<select value={locale} onChange={e=>save({...data,locale:e.target.value as Locale})}><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label><form onSubmit={saveSettings}>
   <fieldset className="tracking-modes"><legend>{t.trackingMode}</legend>{(["auto","manual"] as const).map(value=><label className={mode===value?"is-active":""} key={value}><input type="radio" name="tracking-mode" value={value} checked={mode===value} onChange={()=>{setMode(value);setSettingsError(false)}}/><span><strong>{value==="auto"?t.autoMode:t.manualMode}</strong><small>{value==="auto"?t.autoModeHint:t.manualModeHint}</small></span>{mode===value&&<Check size={15}/>}</label>)}</fieldset>
   {mode==="auto"?<div className="auto-values"><div><span>{t.cycleLength}</span><strong>{t.days(draftEffective.cycleLength)}</strong><small>{draftEffective.cycleSamples?t.autoLearned(draftEffective.cycleSamples):t.autoCycleFallback}</small></div><div><span>{t.periodLength}</span><strong>{t.days(draftEffective.periodLength)}</strong><small>{draftEffective.periodSamples?t.autoPeriodLearned(draftEffective.periodSamples):t.autoPeriodFallback}</small></div></div>:<div className="settings-fields"><label>{t.cycleLength}<span className="optional">{t.dayUnit}</span><input required type="number" min={15} max={90} value={cycle} onChange={e=>{setCycle(Number(e.target.value));setSettingsError(false)}}/></label><label>{t.periodLength}<span className="optional">{t.dayUnit}</span><input required type="number" min={1} max={31} value={length} onChange={e=>{setLength(Number(e.target.value));setSettingsError(false)}}/></label></div>}
   <p className="subtle">{mode==="auto"?t.manualSavedHint:t.preferencesHint}</p>
   {mode==="auto"&&<details className="auto-method"><summary>{t.autoMethodTitle}</summary><p>{t.autoMethod}</p>{draftEffective.ignoredIntervals>0&&<p>{t.autoIgnored(draftEffective.ignoredIntervals)}</p>}</details>}
   {settingsError&&<p className="error" role="alert">{t.settingsOverlap}</p>}<button type="submit" className="primary full">{t.savePreferences}</button></form><div className="data-settings backup-settings"><h3>{t.backupHeading}</h3><p>{t.backupHint}</p><div className="backup-actions"><button className="secondary" onClick={exportData}><Download size={16}/>{t.exportJson}</button><button className="secondary" disabled={importBusy} onClick={chooseImport}><Upload size={16}/>{t.importData}</button></div>{!data.periods.length&&<p className="backup-empty-hint">{t.backupEmpty}</p>}<p>{t.dataHint}</p><button className="delete-btn" onClick={()=>setModal("reset")}><Trash2 size={14}/>{t.deleteAll}</button></div><InstallPanel locale={locale} pwa={pwa}/></Modal>}
  {modal==="reset"&&<Modal title={t.resetTitle} close={()=>setModal(null)} closeLabel={t.close}><p className="modal-intro">{t.resetText}</p><button className="secondary full" onClick={exportData}><Download size={16}/>{t.export}</button><div className="confirm-actions"><button className="secondary" onClick={()=>setModal("settings")}>{t.keepData}</button><button className="primary danger" onClick={()=>{if(save(fresh(),t.cleared))setModal(null)}}>{t.deleteEverything}</button></div></Modal>}
  {modal==="import"&&<Modal title={t.importTitle} close={()=>setModal(null)} closeLabel={t.close}>
   <p className="modal-intro">{t.importIntro}</p><input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={readImport}/>
   <div className="backup-file"><FileJson size={24}/><div><span>{t.importFile}</span><strong>{importName}</strong></div></div>
   {importBusy&&<p className="import-loading" role="status"><LoaderCircle size={18}/>{t.importReading}</p>}
   {importError&&<p className="error" role="alert">{t[importError]}</p>}
   {importPreview&&<>
    <dl className="backup-preview"><div className="preview-wide"><dt>{t.trackingMode}</dt><dd>{importPreview.data.trackingMode==="manual"?t.manualMode:t.autoMode}</dd></div><div><dt>{t.importPeriodCount}</dt><dd>{importPreview.data.periods.length}</dd></div><div><dt>{t.cycleLength}</dt><dd>{t.days(resolveTracking(importPreview.data,today).cycleLength)}</dd></div><div><dt>{t.periodLength}</dt><dd>{t.days(resolveTracking(importPreview.data,today).periodLength)}</dd></div><div><dt>{t.language}</dt><dd>{importPreview.data.locale==="en"?"English":"Tiếng Việt"}</dd></div><div className="preview-wide"><dt>{t.importDateRange}</dt><dd>{importPreview.data.periods.length?(()=>{const dates=importPreview.data.periods.map(p=>p.start).sort();return `${fmt(dates[0],{day:"numeric",month:"short",year:"numeric"})} – ${fmt(dates[dates.length-1],{day:"numeric",month:"short",year:"numeric"})}`})():t.importNoPeriods}</dd></div>{importPreview.exportedAt&&<div className="preview-wide"><dt>{t.importSavedAt}</dt><dd>{new Date(importPreview.exportedAt).toLocaleString(t.locale,{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</dd></div>}</dl>
    <p className="import-replace-note"><Info size={16}/><span>{t.importReplaceInfo(data.periods.length)}</span></p>
    <button className="secondary full" onClick={exportData}><Download size={16}/>{t.export}</button>
    {storageError==="saveError"&&<p className="error" role="alert">{t.saveError}</p>}
    <button className="primary full import-confirm" onClick={confirmImport}><Check size={16}/>{t.importConfirm}</button>
   </>}
   <div className="import-footer-actions"><button className="text-btn" disabled={importBusy} onClick={chooseImport}><Upload size={13}/>{t.importChoose}</button><button className="text-btn" onClick={openSettings}>{t.importCancel}</button></div>
   <div className="form-note"><LockKeyhole size={13}/>{t.importLocal}</div>
  </Modal>}
  {modal==="install"&&<Modal title={t.install} close={()=>setModal(null)} closeLabel={t.close}><InstallPanel locale={locale} pwa={pwa}/></Modal>}
 </div>;
}
