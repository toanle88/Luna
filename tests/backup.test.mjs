import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
const loaded=new Map();
function load(file){
 if(loaded.has(file))return loaded.get(file);
 const source=readFileSync(new URL(file,import.meta.url),'utf8');
 const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const context={exports:{},TextEncoder,require:(name)=>{if(name==='./cycle')return load('../lib/cycle.ts');throw Error(name)}};
 vm.createContext(context);vm.runInContext(outputText,context);loaded.set(file,context.exports);return context.exports;
}
const {decodeBackup,encodeBackup,prepareData,BackupError,MAX_BACKUP_BYTES}=load('../lib/backup.ts');
const {resolveTracking}=load('../lib/cycle.ts');
const today='2026-11-08';
const data={version:1,locale:'vi',trackingMode:'auto',cycleLength:28,periodLength:5,periods:[{id:'old',start:'2026-10-09',end:'2026-10-13'},{id:'new',start:'2026-11-06',end:'2026-11-10',autoEnd:true}],entries:{'2026-10-09':{mood:'Good',symptoms:['Cramps'],note:'Ghi chú tiếng Việt 🌷'}}};
const clone=()=>JSON.parse(JSON.stringify(data));
const plain=value=>JSON.parse(JSON.stringify(value));
const fails=(text,code)=>assert.throws(()=>decodeBackup(text,today),error=>error instanceof BackupError&&error.code===code);

test('export/import restores every period, setting, stable ID and old private note',()=>{
 const timestamp='2026-11-08T01:00:00.000Z';
 const text=encodeBackup(data,timestamp);
 const document=JSON.parse(text);
 assert.equal(document.format,'luna-backup');assert.equal(document.backupVersion,1);
 const preview=decodeBackup(text,today);
 assert.deepEqual(plain(preview.data),data);assert.equal(preview.exportedAt,timestamp);
});
test('legacy flat JSON backups from previous Luna versions remain importable',()=>{
 const preview=decodeBackup(JSON.stringify(data),today);
 assert.deepEqual(plain(preview.data),data);assert.equal(preview.exportedAt,null);
});
test('old ongoing entries migrate to an automatically calculated end without changing the input',()=>{
 const old=clone();old.periods[1].end=null;delete old.periods[1].autoEnd;
 const before=JSON.stringify(old);const preview=decodeBackup(before,today);
 assert.equal(preview.data.periods[1].end,'2026-11-10');assert.equal(preview.data.periods[1].autoEnd,true);
 assert.equal(JSON.stringify(old),before);
});
test('empty and settings-only backups are valid, with a sensible fallback language',()=>{
 const empty={version:1,cycleLength:30,periodLength:6,periods:[]};
 const preview=decodeBackup(JSON.stringify(empty),today,'en');
 assert.equal(preview.data.locale,'en');assert.equal(preview.data.cycleLength,30);
 assert.equal(preview.data.periods.length,0);assert.deepEqual(plain(preview.data.entries),{});
 assert.deepEqual(plain(decodeBackup(encodeBackup(preview.data),today).data),plain(preview.data));
});
test('parsing a preview has no browser storage access or data mutation',()=>{
 const before=JSON.stringify(data);decodeBackup(encodeBackup(data),today);
 assert.equal(JSON.stringify(data),before);
});
test('malformed JSON and unrelated JSON documents do not become backup data',()=>{
 fails('not-json','importInvalidJson');fails('{"a":','importInvalidJson');
 for(const text of ['null','[]','{}','"hello"','{"format":"another-app"}'])fails(text,'importInvalidData');
});
test('newer schema versions are rejected before any restore',()=>{
 fails(JSON.stringify({...data,version:2}),'importUnsupportedVersion');
 const envelope=JSON.parse(encodeBackup(data));envelope.backupVersion=2;fails(JSON.stringify(envelope),'importUnsupportedVersion');
});
test('invalid settings, locales and impossible calendar dates are rejected',()=>{
 for(const [key,value] of [['cycleLength',0],['cycleLength',91],['cycleLength','28'],['periodLength',0],['periodLength',32],['locale','fr']])fails(JSON.stringify({...data,[key]:value}),'importInvalidData');
 const invalid=clone();invalid.periods[0].start='2026-02-30';fails(JSON.stringify(invalid),'importInvalidData');
 const reversed=clone();reversed.periods[0].end='2026-10-08';fails(JSON.stringify(reversed),'importInvalidData');
});
test('duplicate IDs, duplicate starts and overlapping estimates are rejected',()=>{
 const ids=clone();ids.periods[1].id='old';fails(JSON.stringify(ids),'importDuplicate');
 const starts=clone();starts.periods[1].start=starts.periods[0].start;fails(JSON.stringify(starts),'importDuplicate');
 const overlap=clone();overlap.periods[1].start='2026-10-12';fails(JSON.stringify(overlap),'importOverlap');
});
test('future logged starts are rejected but future automatic end dates are accepted',()=>{
 assert.equal(decodeBackup(JSON.stringify(data),today).data.periods[1].end,'2026-11-10');
 const future=clone();future.periods[1].start='2026-11-09';fails(JSON.stringify(future),'importFutureDate');
});
test('oversized files and corrupt hidden legacy entries fail without losing current data',()=>{
 fails(' '.repeat(MAX_BACKUP_BYTES+1),'importTooLarge');
 const corrupt=clone();corrupt.entries['2026-10-09'].symptoms='Cramps';fails(JSON.stringify(corrupt),'importInvalidData');
});
test('unknown root and period properties are stripped while Unicode notes are preserved',()=>{
 const extra=clone();extra.extra='discard';extra.periods[0].unexpected={payload:true};
 const preview=decodeBackup(JSON.stringify(extra),today);
 assert.equal('extra' in preview.data,false);assert.equal('unexpected' in preview.data.periods[0],false);
 assert.equal(preview.data.entries['2026-10-09'].note,data.entries['2026-10-09'].note);
});
test('UTF-8 BOM files are supported; dangerous entry keys cannot enter restored data',()=>{
 assert.equal(decodeBackup('\uFEFF'+JSON.stringify(data),today).data.periods.length,2);
 const bad=JSON.parse(JSON.stringify(data));bad.entries=JSON.parse('{"__proto__":{"mood":"Good","symptoms":[],"note":""}}');
 fails(JSON.stringify(bad),'importInvalidData');
});

test('old backups without a mode now default to auto while preserving saved manual values',()=>{
 const old=clone();delete old.trackingMode;old.cycleLength=34;old.periodLength=9;
 const preview=decodeBackup(JSON.stringify(old),today);
 assert.equal(preview.data.trackingMode,'auto');assert.equal(preview.data.cycleLength,34);assert.equal(preview.data.periodLength,9);
 assert.equal(resolveTracking(preview.data,today).cycleLength,28);assert.equal(resolveTracking(preview.data,today).periodLength,5);
});
test('mode and actual-end provenance round-trip through backup files',()=>{
 const manual=clone();manual.trackingMode='manual';manual.periods[0].autoEnd=false;
 const restored=decodeBackup(encodeBackup(manual),today).data;
 assert.equal(restored.trackingMode,'manual');assert.equal(restored.periods[0].autoEnd,false);
 assert.equal(resolveTracking(restored,today).cycleLength,manual.cycleLength);
 fails(JSON.stringify({...data,trackingMode:'something-else'}),'importInvalidData');
});
test('adding, removing, or correcting history refreshes auto estimates without altering manual values',()=>{
 const original={...clone(),cycleLength:34,periodLength:9,periods:[{id:'a',start:'2026-09-01',end:'2026-09-05',autoEnd:true},{id:'b',start:'2026-09-30',end:'2026-10-04',autoEnd:true}]};
 const prepared=prepareData(original,today);
 assert.equal(resolveTracking(prepared,today).cycleLength,29);assert.equal(prepared.cycleLength,34);
 const removed=prepareData({...prepared,periods:[prepared.periods[0]]},today);
 assert.equal(resolveTracking(removed,today).cycleLength,28);
 const added=prepareData({...prepared,periods:[...prepared.periods,{id:'c',start:'2026-10-31',end:'2026-11-04',autoEnd:true}]},today);
 assert.equal(resolveTracking(added,today).cycleLength,30);assert.equal(added.periodLength,9);
 assert.equal(added.periods[2].end,'2026-11-04');
});
