import test from 'node:test';
import assert from 'node:assert/strict';

test('launcher keeps the selected instance and real lifecycle data across page changes', async () => {
  let instances = [{id:'one',name:'PvP'}, {id:'two',name:'Survival'}];
  const ok = data => Promise.resolve({ok:true,data:structuredClone(data)});
  globalThis.window = {eternal:{
    accounts:{list:()=>ok({accounts:[],activeId:null})}, instances:{list:()=>ok(instances)},
    servers:{list:()=>ok([])}, settings:{get:()=>ok({ramMb:6144})}, app:{state:()=>ok({version:'1.2.0',running:[]})}
  }};
  try {
    const {useEternalStore} = await import('../src/store/useEternalStore.js');
    await useEternalStore.getState().bootstrap();
    useEternalStore.getState().selectInstance('two');
    await useEternalStore.getState().refreshInstances();
    assert.equal(useEternalStore.getState().selectedInstanceId, 'two');
    useEternalStore.getState().selectInstance('missing');
    assert.equal(useEternalStore.getState().selectedInstanceId, 'two');

    const push = useEternalStore.getState().pushLaunchEvent;
    push({instanceId:'two',state:'RUNNING',pid:42,startedAt:'2026-10-01T12:00:00.000Z'});
    push({instanceId:'two',state:'LOG',message:'Loading world'});
    assert.equal(useEternalStore.getState().launchEvents.two.state, 'RUNNING');
    assert.equal(useEternalStore.getState().instances[1].lastPlayedAt, '2026-10-01T12:00:00.000Z');
    push({instanceId:'two',state:'STOPPED',pid:42,playtimeSeconds:180});
    assert.equal(useEternalStore.getState().instances[1].playtimeSeconds, 180);
    assert.deepEqual(useEternalStore.getState().running, []);
    push({instanceId:'one',state:'DOWNLOADING',progress:{type:'assets',current:1,total:2}});
    push({instanceId:'one',state:'DOWNLOADING',progress:{type:'assets',current:2,total:2}});
    const downloads = useEternalStore.getState().downloadEvents;
    assert.equal(downloads[0].id, downloads[1].id);
    instances = [instances[0]];
    await useEternalStore.getState().refreshInstances();
    assert.equal(useEternalStore.getState().selectedInstanceId, 'one');
  } finally { delete globalThis.window; }
});
