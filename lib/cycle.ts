export const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export const parse = (s: string) => new Date(s+"T12:00:00");
export const add = (s: string, n: number) => {const d=parse(s);d.setDate(d.getDate()+n);return dateKey(d)};
export const diff = (a: string,b: string) => Math.round((Date.UTC(parse(a).getFullYear(),parse(a).getMonth(),parse(a).getDate())-Date.UTC(parse(b).getFullYear(),parse(b).getMonth(),parse(b).getDate()))/86400000);
export const validDate = (s: unknown): s is string => typeof s==="string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parse(s).getTime()) && dateKey(parse(s))===s;
export const formatDate = (s: string, locale: string, opts: Intl.DateTimeFormatOptions={month:"short",day:"numeric"}) => parse(s).toLocaleDateString(locale,opts);
export type Period = {id: string; start: string; end: string | null; autoEnd?: boolean; autoEndCap?: string};
export const estimatedEnd = (start: string, length: number) => add(start,length-1);
export const periodEnd = (p: Period, length: number) => {
 if(p.end!==null&&!p.autoEnd)return p.end;
 const estimated=estimatedEnd(p.start,length);
 return p.autoEndCap&&p.autoEndCap<estimated?p.autoEndCap:estimated;
};
export const includesDate = (p: Period, date: string, length: number) => date >= p.start && date <= periodEnd(p,length);
export const periodDays = (p: Period, length: number) => diff(periodEnd(p,length),p.start)+1;
export const normalizePeriods = (periods: Period[], length: number): Period[] => {
 const starts=[...new Set(periods.map(p=>p.start))].sort();
 const nextByStart=new Map(starts.map((start,i)=>[start,starts[i+1]]));
 return periods.map(p=>{
  if(p.end!==null&&!p.autoEnd)return p;
  const next=nextByStart.get(p.start);
  const {autoEndCap:oldCap,...clean}=p;
  const cap=next?add(next,-1):undefined;
  const estimated=estimatedEnd(p.start,length);
  return {...clean,end:cap&&cap<estimated?cap:estimated,autoEnd:true,...(cap?{autoEndCap:cap}:{})};
 });
};
export const validPeriod = (p: unknown): p is Period => {
 if (!p || typeof p!=="object") return false;
 const v=p as Period;
 return typeof v.id==="string" && validDate(v.start) && (v.end===null || (validDate(v.end) && v.end>=v.start)) && (v.autoEnd===undefined || typeof v.autoEnd==="boolean") && (v.autoEndCap===undefined || (validDate(v.autoEndCap)&&v.autoEndCap>=v.start));
};
export const hasOverlap = (periods: Period[], length: number) => {
 const sorted=[...periods].sort((a,b)=>a.start.localeCompare(b.start));
 return sorted.some((p,i)=>i>0 && p.start<=periodEnd(sorted[i-1],length));
};
export function periodError(start: string, length: number, today: string, periods: Period[], editing: string|null): "invalidStart"|"periodOverlap"|null {
 if (!validDate(start) || start>today || !Number.isInteger(length) || length<1 || length>31) return "invalidStart";
 const end=estimatedEnd(start,length);
 if (periods.some(p=>p.id!==editing && start<=periodEnd(p,length) && end>=p.start)) return "periodOverlap";
 return null;
}

export type CyclePhase = "period"|"fertile"|"ovulation"|"lower"|"unknown";
export type CycleProjection = {
 start:string; end:string; nextStart:string; length:number; periodEnd:string;
 ovulationDate:string|null; fertileStart:string|null; fertileEnd:string|null; available:boolean;
};
// Calendar estimates only: cycle day (length - 14), then five days before
// through one day after. Never use this projection as a contraceptive method.
export function variableHistory(periods:Period[]):boolean {
 const starts=[...periods].sort((a,b)=>b.start.localeCompare(a.start)).slice(0,7).map(p=>p.start);
 const intervals=starts.slice(1).map((s,i)=>diff(starts[i],s));
 return intervals.some(n=>n<21||n>35)||(intervals.length>=2&&Math.max(...intervals)-Math.min(...intervals)>7);
}
export function projectCycle(period:Period,length:number,duration:number,nextRecordedStart?:string,limited=false):CycleProjection {
 const actualLength=nextRecordedStart?diff(nextRecordedStart,period.start):null;
 const span=actualLength!==null&&actualLength>0&&actualLength<=90?actualLength:length;
 const available=!limited&&span>=21&&span<=35&&duration<=span;
 const ovulationDay=span-14;
 const ovulationDate=available?add(period.start,ovulationDay-1):null;
 // Widen the highlighted range to include CDC days 8–19 for 26–32-day
 // cycles. This is a conservative display, not a validated contraceptive tool.
 const broadRange=span>=26&&span<=32;
 const fertileFirst=broadRange?Math.min(ovulationDay-5,8):ovulationDay-5;
 const fertileLast=broadRange?Math.max(ovulationDay+1,19):ovulationDay+1;
 return {start:period.start,end:add(period.start,span-1),nextStart:add(period.start,span),length:span,periodEnd:periodEnd(period,duration),available,
  ovulationDate,fertileStart:ovulationDate?add(period.start,fertileFirst-1):null,fertileEnd:ovulationDate?add(period.start,fertileLast-1):null};
}
export function phaseAt(model:CycleProjection|null,date:string):{phase:CyclePhase;day:number|null;menstruating:boolean;fertile:boolean} {
 if(!model||date<model.start||date>model.end)return {phase:"unknown",day:null,menstruating:false,fertile:false};
 const menstruating=date<=model.periodEnd;
 const fertile=!!model.fertileStart&&!!model.fertileEnd&&date>=model.fertileStart&&date<=model.fertileEnd;
 const phase:CyclePhase=date===model.ovulationDate?"ovulation":fertile?"fertile":menstruating?"period":model.available?"lower":"unknown";
 return {phase,day:diff(date,model.start)+1,menstruating,fertile};
}
export function projectionForDate(periods:Period[],date:string,length:number,duration:number,limited=false):CycleProjection|null {
 const sorted=[...periods].sort((a,b)=>a.start.localeCompare(b.start));
 const i=sorted.findLastIndex(p=>p.start<=date);
 if(i<0)return null;
 const model=projectCycle(sorted[i],length,duration,sorted[i+1]?.start,limited);
 return date<=model.end?model:null;
}

export type TrackingMode = "auto"|"manual";
export const DEFAULT_CYCLE_LENGTH=28;
export const DEFAULT_PERIOD_LENGTH=5;
export type TrackingInput={trackingMode?:TrackingMode;cycleLength:number;periodLength:number;periods:Period[]};
export function resolveTracking(data:TrackingInput,today:string){
 const mode:TrackingMode=data.trackingMode==="manual"?"manual":"auto";
 const sorted=[...data.periods].filter(p=>p.start<=today).sort((a,b)=>b.start.localeCompare(a.start));
 const unique=sorted.filter((p,i)=>i===0||p.start!==sorted[i-1].start);
 const intervals=unique.slice(1).map((p,i)=>diff(unique[i].start,p.start));
 const cycleSamples=intervals.filter(n=>n>=15&&n<=90).slice(0,6);
 // Only explicitly recorded actual ends are observations. Generated or
 // ambiguous legacy end dates must not train their own future estimates.
 const periodSamples=unique.filter(p=>p.autoEnd===false&&p.end!==null&&p.end<=today).map(p=>diff(p.end!,p.start)+1).filter(n=>n>=1&&n<=31).slice(0,6);
 const average=(values:number[],fallback:number)=>values.length?Math.round(values.reduce((sum,n)=>sum+n,0)/values.length):fallback;
 return {mode,cycleLength:mode==="manual"?data.cycleLength:average(cycleSamples,DEFAULT_CYCLE_LENGTH),periodLength:mode==="manual"?data.periodLength:average(periodSamples,DEFAULT_PERIOD_LENGTH),cycleSamples:cycleSamples.length,periodSamples:periodSamples.length,ignoredIntervals:intervals.filter(n=>n<15||n>90).length};
}
