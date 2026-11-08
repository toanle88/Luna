import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
function load(file){const source=readFileSync(new URL(file,import.meta.url),'utf8');const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});const context={exports:{}};vm.createContext(context);vm.runInContext(outputText,context);return context.exports}
const {periodError,includesDate,periodDays,periodEnd,validPeriod,estimatedEnd,normalizePeriods,hasOverlap,formatDate,add,diff}=load('../lib/cycle.ts');
const {translations}=load('../lib/i18n.ts');
const today='2026-11-08';
const auto={id:'auto',start:'2026-11-06',end:'2026-11-10',autoEnd:true};
const historical={id:'old',start:'2026-10-09',end:'2026-10-13'};
test('only a start date is needed; a five-day period includes the start date',()=>{
 assert.equal(periodError(auto.start,5,today,[historical],null),null);
 assert.equal(estimatedEnd(auto.start,5),'2026-11-10');
 assert.equal(estimatedEnd(auto.start,1),auto.start);
 assert.equal(periodDays(auto,5),5);
 assert.equal(periodEnd(auto,5),'2026-11-10');
 assert.ok(validPeriod(auto));
});
test('automatically calculated end dates may extend beyond today',()=>{
 assert.equal(periodError(today,5,today,[],null),null);
 assert.equal(estimatedEnd(today,5),'2026-11-12');
 assert.equal(includesDate(auto,'2026-11-10',5),true);
 assert.equal(includesDate(auto,'2026-11-11',5),false);
});
test('old open-ended entries become estimated periods; completed records keep their dates',()=>{
 const migrated=normalizePeriods([historical,{id:'active',start:'2026-11-06',end:null}],5);
 assert.equal(migrated[0].end,historical.end);
 assert.equal(migrated[0].autoEnd,undefined);
 assert.equal(migrated[1].end,'2026-11-10');
 assert.equal(migrated[1].autoEnd,true);
 const restored=JSON.parse(JSON.stringify({version:1,locale:'vi',periodLength:5,periods:migrated}));
 assert.ok(restored.periods.every(validPeriod));
 assert.equal(restored.locale,'vi');
 assert.equal(periodEnd(restored.periods[1],5),'2026-11-10');
});
test('changing the duration recalculates only automatic end dates',()=>{
 const adjusted=normalizePeriods([historical,auto],7);
 assert.equal(adjusted[0].end,'2026-10-13');
 assert.equal(adjusted[1].end,'2026-11-12');
 assert.equal(periodDays(adjusted[1],7),7);
});
test('editing a start date excludes its own previous entry but rejects other overlaps',()=>{
 assert.equal(periodError('2026-11-05',5,today,[historical,auto],auto.id),null);
 assert.equal(periodError('2026-11-07',5,today,[auto],null),'periodOverlap');
 assert.equal(periodError('2026-10-12',5,today,[historical],null),'periodOverlap');
 assert.equal(periodError('2026-10-01',5,today,[historical],null),null);
});
test('generated end dates stop before a subsequently logged start',()=>{
 const second={id:'second',start:'2026-11-12',end:'2026-11-16',autoEnd:true};
 assert.equal(hasOverlap([auto,second],5),false);
 const updated=normalizePeriods([auto,second],7);
 assert.equal(hasOverlap(updated,7),false);
 assert.equal(periodEnd(updated[0],7),'2026-11-11');
 assert.equal(updated[1].end,'2026-11-18');
});
test('invalid starts, future starts, and invalid durations are rejected',()=>{
 for(const start of ['', '2026-02-30','2026-11-09','invalid'])assert.equal(periodError(start,5,today,[],null),'invalidStart');
 for(const n of [0,32,2.5,NaN])assert.equal(periodError(today,n,today,[],null),'invalidStart');
 assert.equal(validPeriod({...auto,end:'invalid'}),false);
 assert.equal(validPeriod({...auto,end:'2026-11-05'}),false);
 assert.equal(validPeriod(null),false);
});
test('calendar calculations handle month, leap-year and daylight-saving boundaries',()=>{
 const oldTZ=process.env.TZ;
 try{for(const tz of ['UTC','Asia/Ho_Chi_Minh','America/New_York']){process.env.TZ=tz;
 for(const [start,count,expected] of [['2026-11-08',28,'2026-12-06'],['2026-12-31',1,'2027-01-01'],['2028-02-28',1,'2028-02-29'],['2026-03-07',2,'2026-03-09'],['2026-10-31',2,'2026-11-02']]){assert.equal(add(start,count),expected);assert.equal(diff(expected,start),count)}
 assert.equal(estimatedEnd('2026-11-29',5),'2026-12-03');
 }}finally{if(oldTZ===undefined)delete process.env.TZ;else process.env.TZ=oldTZ}
});
test('both languages cover the same interface and preserve stable symptom/mood identifiers',()=>{
 assert.deepEqual(Object.keys(translations.vi).sort(),Object.keys(translations.en).sort());
 assert.deepEqual(Object.keys(translations.vi.symptoms).sort(),Object.keys(translations.en.symptoms).sort());
 assert.equal(translations.vi.moods.Great,'Rất tốt');
 assert.equal(translations.vi.symptoms.Cramps,'Đau bụng');
 assert.equal(translations.vi.days(5),'5 ngày');
 assert.equal(translations.en.days(5),'5 days');
 const date=formatDate('2026-11-08','vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});
 assert.equal(date,'08/11/2026');
});

const {projectCycle,phaseAt,projectionForDate,variableHistory}=load('../lib/cycle.ts');
const startPeriod={id:'current',start:'2026-11-01',end:'2026-11-05',autoEnd:true};
test('28-day chart estimates ovulation on cycle day 14 and highlights the broad fertile range',()=>{
 const model=projectCycle(startPeriod,28,5);
 assert.equal(model.ovulationDate,'2026-11-14');
 assert.equal(model.fertileStart,'2026-11-08');
 assert.equal(model.fertileEnd,'2026-11-19');
 assert.equal(phaseAt(model,'2026-11-01').phase,'period');
 assert.equal(phaseAt(model,'2026-11-06').phase,'lower');
 assert.equal(phaseAt(model,'2026-11-08').phase,'fertile');
 assert.equal(phaseAt(model,'2026-11-14').phase,'ovulation');
 assert.equal(phaseAt(model,'2026-11-19').phase,'fertile');
 assert.equal(phaseAt(model,'2026-11-20').phase,'lower');
});
test('no fertility status is invented before the first log or after an unlogged next cycle',()=>{
 const model=projectCycle(startPeriod,28,5);
 assert.equal(phaseAt(model,'2026-10-31').phase,'unknown');
 assert.equal(phaseAt(model,'2026-11-29').phase,'unknown');
 assert.equal(projectionForDate([],'2026-11-08',28,5),null);
 assert.equal(projectionForDate([startPeriod],'2027-03-01',28,5),null);
 assert.equal(projectionForDate([startPeriod],'2026-10-31',28,5),null);
});
test('estimates and calendar day numbers agree across month and year boundaries',()=>{
 const model=projectCycle({...startPeriod,start:'2026-12-25'},28,5);
 assert.equal(model.ovulationDate,'2027-01-07');
 assert.equal(phaseAt(model,'2027-01-07').day,14);
 assert.equal(phaseAt(model,'2027-01-07').phase,'ovulation');
 assert.equal(model.end,'2027-01-21');
});
test('out-of-range and variable cycles hide lower-likelihood and ovulation claims',()=>{
 for(const length of [15,20,36,90]){
  const model=projectCycle(startPeriod,length,5);
  assert.equal(model.available,false);assert.equal(model.ovulationDate,null);
  assert.equal(phaseAt(model,'2026-11-06').phase,'unknown');
 }
 const model=projectCycle(startPeriod,28,5,undefined,true);
 assert.equal(model.available,false);
 assert.equal(phaseAt(model,'2026-11-14').phase,'unknown');
 assert.equal(phaseAt(model,'2026-11-02').phase,'period');
 assert.equal(variableHistory([{...startPeriod,start:'2026-11-01'},{...startPeriod,id:'previous',start:'2026-09-15'}]),true);
 assert.equal(variableHistory([startPeriod]),false);
});
test('historical cycle lengths use logged next starts, and a new log resets cycle day 1',()=>{
 const nextPeriod={...startPeriod,id:'next',start:'2026-11-27',end:'2026-12-01'};
 const first=projectCycle(startPeriod,28,5,nextPeriod.start);
 assert.equal(first.length,26);assert.equal(first.ovulationDate,'2026-11-12');
 const next=projectionForDate([startPeriod,nextPeriod],'2026-11-27',28,5);
 assert.equal(next.start,'2026-11-27');assert.equal(phaseAt(next,'2026-11-27').day,1);
});
test('overlapping period and fertility predictions retain both labels',()=>{
 const model=projectCycle(startPeriod,28,14);
 const state=phaseAt(model,'2026-11-14');
 assert.equal(state.phase,'ovulation');assert.equal(state.menstruating,true);assert.equal(state.fertile,true);
});
test('a long gap between records never stretches the chart into hundreds of projected days',()=>{
 const model=projectCycle(startPeriod,28,5,'2027-11-01');
 assert.equal(model.length,28);assert.equal(phaseAt(model,'2027-01-01').phase,'unknown');
});

const {resolveTracking}=load('../lib/cycle.ts');
function loggedHistory(intervals){let start='2025-01-01';const periods=[{id:'p0',start,end:add(start,4),autoEnd:true}];for(const [i,n] of intervals.entries()){start=add(start,n);periods.push({id:`p${i+1}`,start,end:add(start,4),autoEnd:true})}return periods}
const autoInput=periods=>({cycleLength:33,periodLength:8,periods});
test('automatic mode is the default and falls back independently to 28 and 5',()=>{
 for(const periods of [[],loggedHistory([])]){
  const result=resolveTracking(autoInput(periods),'2027-01-01');
  assert.equal(result.mode,'auto');assert.equal(result.cycleLength,28);assert.equal(result.periodLength,5);
  assert.equal(result.cycleSamples,0);assert.equal(result.periodSamples,0);
 }
});
test('cycle length learns the rounded average of recent start-to-start intervals',()=>{
 const result=resolveTracking(autoInput(loggedHistory([28,30,29])),'2027-01-01');
 assert.equal(result.cycleLength,29);assert.equal(result.cycleSamples,3);
 assert.equal(result.periodLength,5);assert.equal(result.periodSamples,0);
});
test('only the six most recent valid intervals contribute, irrespective of record order',()=>{
 const records=loggedHistory([20,21,22,23,24,25,26,27]).reverse();
 const result=resolveTracking(autoInput(records),'2027-01-01');
 assert.equal(result.cycleLength,25);assert.equal(result.cycleSamples,6);
});
test('actual period durations can train the estimate, generated and ambiguous ends cannot',()=>{
 const actual=[{id:'a',start:'2026-01-01',end:'2026-01-04',autoEnd:false},{id:'b',start:'2026-02-01',end:'2026-02-06',autoEnd:false},{id:'c',start:'2026-03-01',end:'2026-03-14',autoEnd:true},{id:'d',start:'2026-04-01',end:'2026-04-15'}];
 const result=resolveTracking(autoInput(actual),today);
 assert.equal(result.periodLength,5);assert.equal(result.periodSamples,2);
 const one=resolveTracking(autoInput([{...actual[0],end:'2026-01-07'}]),today);
 assert.equal(one.periodLength,7);assert.equal(one.cycleLength,28);
});
test('auto-generated period ends never reinforce their own estimated duration',()=>{
 const predicted=loggedHistory([29,29,29]).map(p=>({...p,end:add(p.start,11)}));
 const result=resolveTracking(autoInput(predicted),'2027-01-01');
 assert.equal(result.cycleLength,29);assert.equal(result.periodLength,5);assert.equal(result.periodSamples,0);
});
test('manual preferences survive auto/manual mode changes without being overwritten',()=>{
 const input={trackingMode:'manual',cycleLength:33,periodLength:8,periods:loggedHistory([29,29])};
 const before=JSON.stringify(input);
 assert.equal(resolveTracking(input,'2027-01-01').cycleLength,33);
 assert.equal(resolveTracking(input,'2027-01-01').periodLength,8);
 assert.equal(resolveTracking({...input,trackingMode:'auto'},'2027-01-01').cycleLength,29);
 assert.equal(resolveTracking({...input,trackingMode:'auto'},'2027-01-01').periodLength,5);
 assert.equal(JSON.stringify(input),before);
});
test('invalid gaps and future or unfinished actual observations are not training samples',()=>{
 const records=loggedHistory([28,120,14,30]);
 records.push({id:'future',start:'2028-01-01',end:'2028-01-07',autoEnd:false});
 const result=resolveTracking(autoInput(records),'2027-01-01');
 assert.equal(result.cycleLength,29);assert.equal(result.cycleSamples,2);assert.equal(result.ignoredIntervals,2);
 const unfinished=resolveTracking(autoInput([{id:'ongoing',start:'2026-11-06',end:'2026-11-12',autoEnd:false}]),today);
 assert.equal(unfinished.periodLength,5);assert.equal(unfinished.periodSamples,0);
});
test('real period end dates are preserved while generated ends are shortened by a new start',()=>{
 const records=[{id:'actual',start:'2026-01-01',end:'2026-01-04',autoEnd:false},{id:'generated',start:'2026-02-01',end:'2026-02-10',autoEnd:true},{id:'new',start:'2026-02-07',end:'2026-02-16',autoEnd:true}];
 const normalized=normalizePeriods(records,10);
 assert.equal(normalized[0].end,'2026-01-04');assert.equal(normalized[0].autoEnd,false);
 assert.equal(normalized[1].end,'2026-02-06');assert.equal(periodEnd(normalized[1],10),'2026-02-06');
 assert.equal(hasOverlap(normalized,10),false);
});
