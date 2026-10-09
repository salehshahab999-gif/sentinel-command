'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const spec = JSON.parse(fs.readFileSync(path.join(__dirname,'roles-v2.spec.json'),'utf8'));
const manifest = require('./build-roles.cjs').buildManifest(spec);
const roles = manifest.roles;
assert.equal(manifest.schema_version,2,'Unexpected schema version');
assert.equal(manifest.mode,'declarative-explicit-permissions-no-template-copy');
assert.equal(roles.length,29,'Expected 29 profiles');
assert.equal(new Set(roles.map(r=>r.name)).size,roles.length,'Role names must be unique');
assert.deepEqual(new Set(roles.map(r=>r.kind)),new Set(['server_group','channel_group']));
const builtIns = new Set(['Server Admin','Normal','Guest','Channel Admin','Operator','Voice']);
for (const role of roles) {
  assert.ok(!builtIns.has(role.name),'Built-in group name used: '+role.name);
  assert.ok(Array.isArray(role.permissions) && role.permissions.length>0,'Empty permissions: '+role.name);
  const names=role.permissions.map(p=>p.name);
  assert.equal(new Set(names).size,names.length,'Duplicate permissions: '+role.name);
  for (const p of role.permissions) {
    assert.match(p.name,/^[bi]_[a-z0-9_]+$/,'Invalid permission identifier: '+p.name);
    assert.ok(!p.name.startsWith('b_virtualserver_ban_'),'Unsupported virtualserver ban permission: '+p.name);
    assert.notEqual(p.name,'b_virtualserver_modify_default_channeladmin_group','Malformed default channel-admin permission');
    assert.ok(Number.isInteger(p.value),'Non-integer permission value: '+role.name+'/'+p.name);
    assert.ok([0,1].includes(p.skip) && [0,1].includes(p.negate),'Invalid permission flags: '+role.name+'/'+p.name);
    if(role.kind==='channel_group') assert.ok(p.skip===0 && p.negate===0,'Channel groups cannot set server-group flags');
    assert.notEqual(p.name,'i_group_auto_update_type','Custom role must not auto-update as built-in template');
  }
}
const byName=new Map(roles.map(r=>[r.name,r]));
const get=function(role,name){return role.permissions.find(p=>p.name===name);};
const existing=['SENTINEL OWNER','SYSTEM ADMIN','SECURITY MODERATOR','OPERATIONS LEAD','SENIOR ANALYST','ANALYST','RESEARCHER','REGISTERED MEMBER'];
for(const name of existing) assert.equal(byName.get(name).kind,'server_group','Existing Sentinel role is not server-scoped: '+name);
const pairs=[
 ['i_client_kick_from_server_power','i_client_needed_kick_from_server_power'],
 ['i_client_kick_from_channel_power','i_client_needed_kick_from_channel_power'],
 ['i_client_ban_power','i_client_needed_ban_power'],
 ['i_client_move_power','i_client_needed_move_power'],
 ['i_client_poke_power','i_client_needed_poke_power']
];
const overlays=new Set(['NO-KICK PROTECTED','NO-BAN PROTECTED','NO-MOVE PROTECTED']);
for(const role of roles.filter(r=>r.kind==='server_group' && !overlays.has(r.name))) {
 for(const pair of pairs) {
   const action=get(role,pair[0]), needed=get(role,pair[1]);
   assert.ok(action && needed,'Missing explicit action/threshold pair: '+role.name+' '+pair.join('/'));
   if(action.value>=0) assert.ok(needed.value>action.value,'Peer-tier action not blocked: '+role.name+' '+pair[0]);
 }
}
for(const entry of [
 ['NO-KICK PROTECTED','i_client_needed_kick_from_server_power'],['NO-KICK PROTECTED','i_client_needed_kick_from_channel_power'],
 ['NO-BAN PROTECTED','i_client_needed_ban_power'],['NO-MOVE PROTECTED','i_client_needed_move_power']
]) {
 const p=get(byName.get(entry[0]),entry[1]);
 assert.ok(p && p.value===101 && p.skip===1,'Protection overlay threshold incorrect: '+entry.join('/'));
}
const owner=byName.get('SENTINEL OWNER');
assert.equal(get(owner,'i_group_modify_power').value,100);
assert.equal(get(owner,'i_permission_modify_power').value,100);
assert.equal(get(owner,'i_group_needed_modify_power').value,100);
assert.equal(get(owner,'i_group_needed_member_add_power').value,100);
assert.equal(get(owner,'i_group_needed_member_remove_power').value,100);
assert.ok(owner.permissions.filter(p=>p.name.startsWith('i_needed_modify_power_')).length>0);
assert.ok(owner.permissions.filter(p=>p.name.startsWith('i_needed_modify_power_')).every(p=>p.value===100));
assert.equal(manifest.safety.uses_servergroupcopy,false);
assert.equal(manifest.safety.built_in_groups_touched,false);
assert.equal(manifest.safety.existing_client_memberships_changed,false);
assert.equal(manifest.safety.does_not_assign_owner_automatically,true);
const sys=byName.get('SYSTEM ADMIN');
for(const name of ['i_group_modify_power','i_permission_modify_power','i_channel_permission_modify_power']) assert.equal(get(sys,name).value,-1,'SYSTEM ADMIN received forbidden role/ACL edit power: '+name);
assert.equal(get(sys,'i_group_member_add_power').value,90,'SYSTEM ADMIN should assign roles below its own tier');
assert.equal(get(sys,'i_group_member_remove_power').value,90,'SYSTEM ADMIN should remove roles below its own tier');
assert.equal(get(sys,'i_group_needed_member_add_power').value,91,'SYSTEM ADMIN must be protected from peer-tier assignment');
assert.equal(get(sys,'i_group_needed_member_remove_power').value,91,'SYSTEM ADMIN must be protected from peer-tier removal');
assert.equal(get(sys,'i_client_permission_modify_power').value,90,'SYSTEM ADMIN needs controlled member assignment power');
assert.equal(get(sys,'i_client_needed_permission_modify_power').value,91,'SYSTEM ADMIN target protection must exceed its own power');

const auditor=byName.get('PERMISSION AUDITOR');
for(const name of ['i_client_kick_from_server_power','i_client_kick_from_channel_power','i_client_ban_power','i_client_move_power','i_client_poke_power','i_group_modify_power','i_group_member_add_power','i_group_member_remove_power','i_permission_modify_power','i_client_permission_modify_power','i_channel_permission_modify_power']) {
  assert.equal(get(auditor,name).value,-1,'PERMISSION AUDITOR must be read-only: '+name);
}
assert.equal(auditor.permissions.filter(p=>p.name.startsWith('i_needed_modify_power_')).length,0,'PERMISSION AUDITOR must not grant permission-edit authority');
for(const name of ['SENTINEL CHANNEL ADMIN','SENTINEL CHANNEL MODERATOR','SENTINEL EVENT HOST','SENTINEL PRESENTER']) {
  const role=byName.get(name);
  assert.equal(get(role,'i_group_needed_modify_power').value,100,'Channel-group definition is not protected: '+name);
}
assert.equal(get(byName.get('SENTINEL CHANNEL ADMIN'),'i_group_needed_member_add_power').value,100);
assert.equal(get(byName.get('SENTINEL CHANNEL MODERATOR'),'i_group_needed_member_add_power').value,60);
assert.equal(get(byName.get('SENTINEL EVENT HOST'),'i_group_needed_member_add_power').value,30);
assert.equal(get(byName.get('SENTINEL PRESENTER'),'i_group_needed_member_add_power').value,20);

const cm=byName.get('CHANNEL MANAGER');
for(const name of ['i_client_kick_from_server_power','i_client_kick_from_channel_power','i_client_ban_power','i_client_move_power','i_client_poke_power']) assert.equal(get(cm,name).value,-1,'CHANNEL MANAGER has moderation power: '+name);
const banCreators=roles.filter(r=>get(r,'b_client_ban_create') && get(r,'b_client_ban_create').value===1).map(r=>r.name).sort();
assert.deepEqual(banCreators,['BAN-ONLY','HEAD MODERATOR','SECURITY MODERATOR','SENTINEL OWNER','SYSTEM ADMIN'].sort());
const signatures=roles.map(r=>JSON.stringify({kind:r.kind,permissions:r.permissions.slice().sort((a,b)=>a.name.localeCompare(b.name))}));
assert.equal(new Set(signatures).size,signatures.length,'Duplicate role permission maps detected');
console.log('PASS: '+roles.length+' distinct profiles; '+roles.reduce((n,r)=>n+r.permissions.length,0)+' explicit permission entries.');
console.log('PASS: power pairs, protection overlays, owner-only permission editing, server/channel scope and built-in safety.');
console.log('NOTE: offline validation only; no live TeamSpeak ServerQuery was contacted.');