const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const dir=path.join(__dirname,'source');
function harness() {
 const nodes=new Map(), observers=new Set(), prefs=new Map([['extensions.shortdoi.autoretrieve','none']]);
 function node(name) { return {name,children:[],attrs:{},listeners:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,v){this.listeners[k]=v},appendChild(n){this.children.push(n);nodes.set(n.id,n)},remove(){nodes.delete(this.id)}}; }
 nodes.set('zotero-itemmenu',node('popup'));nodes.set('menu_ToolsPopup',node('popup'));
 const win={ZoteroPane:{},document:{createXULElement:node,getElementById:id=>nodes.get(id)},addEventListener(){}};
 const calls={panes:[],requests:[],destruct:0};
 const Z={platformMajorVersion:140,initializationPromise:Promise.resolve(),debug(){},logError(e){throw e},getMainWindows:()=>[win],getMainWindow:()=>win,getActiveZoteroPane:()=>({getSelectedItems:()=>[]}),Prefs:{get:k=>prefs.get(k),set:(k,v)=>prefs.set(k,v)},Notifier:{registerObserver(o){observers.add(o);return o},unregisterObserver(o){observers.delete(o)}},PreferencePanes:{register(p){calls.panes.push(p)}},Utilities:{cleanDOI:s=>s.replace(/^https:\/\/doi.org\//,'').replace(/^doi:\s*/,'')},ItemTypes:{getID:t=>t==='journalArticle'?1:2},OpenURL:{createContextObject:()=>''}};
 const ctx=vm.createContext({Zotero:Z,console,Promise,encodeURIComponent,XMLHttpRequest:class {open(m,u){this.url=u}send(){calls.requests.push(this)}},Services:{io:{newURI:s=>s},strings:{createBundle:()=>({GetStringFromName:k=>k})},scriptloader:{loadSubScript(uri){vm.runInContext(fs.readFileSync(path.join(dir,uri.split('/').pop()),'utf8'),ctx)}}},Cc:{'@mozilla.org/addons/addon-manager-startup;1':{getService:()=>({registerChrome:()=>({destruct(){calls.destruct++}})})}},Ci:{amIAddonManagerStartup:{}},ChromeUtils:{import(){throw Error('Removed ChromeUtils.import called')}}});
 vm.runInContext(fs.readFileSync(path.join(dir,'bootstrap.js'),'utf8'),ctx);
 return {ctx,Z,win,nodes,observers,calls,prefs};
}
async function start(h){await h.ctx.startup({id:'zoteroshortdoi@wiernik.org',version:'1.5.0.10',rootURI:'file:///test/',resourceURI:{spec:'file:///test/'}})}
test('manifest accepts Zotero 10.0.6 without upstream update overwrites',()=>{const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));assert.equal(m.applications.zotero.strict_max_version,'10.0.*');assert.equal(m.applications.zotero.strict_min_version,'10.0');assert.equal(m.applications.zotero.update_url,undefined)});
test('startup uses Zotero 10 globals and real preference resource',async()=>{const h=harness();await start(h);assert.ok(h.nodes.has('zotero-itemmenu-shortdoi-menu'));assert.equal(h.observers.size,1);const src=h.calls.panes[0].src;assert.ok(fs.existsSync(path.join(dir,src.replace('file:///test/',''))),src)});
test('window unload keeps observer; shutdown removes menus and observer; restart works',async()=>{const h=harness();await start(h);h.ctx.onMainWindowUnload({window:h.win});assert.equal(h.observers.size,1);assert.equal(h.nodes.has('zotero-itemmenu-shortdoi-menu'),false);h.ctx.onMainWindowLoad({window:h.win});h.ctx.shutdown();assert.equal(h.observers.size,0);assert.equal(h.nodes.has('menu_Tools-shortdoi-menu'),false);assert.equal(h.calls.destruct,1);await start(h);assert.equal(h.observers.size,1);h.ctx.shutdown()});
test('DOI cleaning and short DOI request route',async()=>{const h=harness();await start(h);const item={getField:()=> 'https://doi.org/10.1038/nphys1170'};assert.equal(h.ctx.ShortDOI.generateItemUrl(item,'check'),'https://doi.org/api/handles/10.1038%2Fnphys1170');assert.equal(h.ctx.ShortDOI.generateItemUrl(item,'short'),'https://shortdoi.org/10.1038%2Fnphys1170?format=json')});
test('verify response cleans DOI and persists item',async()=>{const h=harness();await start(h);let doi='https://doi.org/10.1038/nphys1170',saves=0,next=0;const item={getField:()=>doi,setField:(k,v)=>doi=v,removeTag(){},hasTag:()=>false,saveTx(){saves++;return Promise.resolve()}};h.ctx.ShortDOI.updateNextItem=()=>next++;h.ctx.ShortDOI.updateItem(item,'check');const req=h.calls.requests[0];Object.assign(req,{readyState:4,status:200,response:{responseCode:1,handle:'10.1038/nphys1170'}});req.onreadystatechange();assert.equal(doi,'10.1038/nphys1170');assert.equal(saves,1);assert.equal(next,1)});
test('verify automatic mode stores same value read by notifier',async()=>{const h=harness();await start(h);let operation;h.ctx.ShortDOI.changePref('check');h.ctx.ShortDOI.updateItems=(items,op)=>operation=op;h.Z.Items={get:()=>[]};h.ctx.ShortDOI.notifierCallback.notify('add','item',[1]);assert.equal(operation,'check')});
