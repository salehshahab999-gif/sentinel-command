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
const permissionModel=spec.permission_model;
assert.ok(permissionModel,'Missing documented TeamSpeak permission-combination model');
assert.equal(permissionModel.server_group_value_resolution,'highest_value_unless_negate_then_lowest_negated');
assert.equal(permissionModel.default_server_group_replaced_on_assignment,true);
assert.equal(permissionModel.channel_group_layer,'overrides_server_group_unless_skip');
assert.equal(permissionModel.join_and_talk_need_channel_threshold,true);
assert.equal(permissionModel.built_in_server_groups_untouched,true);
assert.deepEqual(permissionModel.server_group_power_skip,{i_channel_join_power:1,i_client_talk_power:1,rationale:"Rank-based join/talk power is protected from channel-layer overrides; channel thresholds still decide access and speaking."});
assert.deepEqual(permissionModel.additive_specialist_profiles.sort(),[
  'AIRSPACE / ADS-B','ENERGY / MARKETS / DATA LAB','MARITIME / AIS','OSINT / GEOINT','SATELLITE / SAR'
].sort());
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
const getPermissionFromRole=function(role,name){const p=role.permissions.find(x=>x.name===name);return p ? p.value : undefined;};
const baselineServerPermissions = [
  'b_channel_info_view',
  'b_channel_join_permanent',
  'b_channel_join_semi_permanent',
  'b_channel_join_temporary',
  'b_client_channel_textmessage_send',
  'b_client_info_view',
  'b_client_request_talker',
  'b_client_permissionoverview_own',
  'b_virtualserver_channel_list',
  'b_virtualserver_client_list',
  'b_virtualserver_connectioninfo_view',
  'b_virtualserver_info_view',
  'b_virtualserver_servergroup_list',
  'b_virtualserver_servergroup_client_list',
  'b_virtualserver_channelgroup_list',
  'b_virtualserver_channelgroup_client_list'
];
for (const role of roles.filter(r=>r.kind==='server_group')) {
  for (const name of baselineServerPermissions) {
    assert.equal(getPermissionFromRole(role,name),1,'Missing base member permission '+name+' in '+role.name);
  }
}
const byName=new Map(roles.map(r=>[r.name,r]));
const get=function(role,name){return role.permissions.find(p=>p.name===name);};
for(const role of roles.filter(r=>r.kind==='server_group')) {
  for(const name of ['i_channel_join_power','i_client_talk_power']) {
    const p=get(role,name);
    if(p) assert.equal(p.skip,1,'Hierarchy Join/Talk permission must be protected from channel-layer overrides: '+role.name+'/'+name);
  }
}
for(const role of roles.filter(r=>r.kind==='channel_group')) {
  assert.equal(get(role,'i_channel_join_power'),undefined,'Channel Group must not bypass rank-based room entry: '+role.name);
  assert.equal(get(role,'i_client_talk_power'),undefined,'Channel Group must not bypass rank-based talk tiers: '+role.name);
}
const channelPolicy=JSON.parse(fs.readFileSync(path.join(__dirname,'channel-thresholds-v1.json'),'utf8'));
assert.equal(channelPolicy.schema_version,1);
assert.equal(channelPolicy.policy,'hierarchical');
assert.equal(channelPolicy.channels.length,33,'Expected policy for all 33 audited channels');
assert.equal(channelPolicy.expected_channels,33);
assert.equal(new Set(channelPolicy.channels.map(c=>c.path)).size,33,'Channel paths must be unique');
for(const c of channelPolicy.channels) {
  assert.ok(typeof c.path==='string' && c.path.length>0,'Channel path required');
  assert.ok(Number.isInteger(c.join_power) && c.join_power>=0,'Invalid join threshold: '+c.path);
  assert.ok(Number.isInteger(c.talk_power) && c.talk_power>=0,'Invalid talk threshold: '+c.path);
}
const policyByPath=new Map(channelPolicy.channels.map(c=>[c.path,c]));
assert.deepEqual([policyByPath.get('SENTINEL LOBBY').join_power,policyByPath.get('SENTINEL LOBBY').talk_power],[0,0]);
assert.deepEqual([policyByPath.get('02 SATELLITE INTELLIGENCE').join_power,policyByPath.get('02 SATELLITE INTELLIGENCE').talk_power],[10,10]);
assert.deepEqual([policyByPath.get('03 OSINT AND GEOPOLITICS').join_power,policyByPath.get('03 OSINT AND GEOPOLITICS').talk_power],[15,14]);
assert.deepEqual([policyByPath.get('04 MARITIME INTELLIGENCE').join_power,policyByPath.get('04 MARITIME INTELLIGENCE').talk_power],[20,16]);
assert.deepEqual([policyByPath.get('05 AIRSPACE AND ADS-B').join_power,policyByPath.get('05 AIRSPACE AND ADS-B').talk_power],[25,18]);
assert.deepEqual([policyByPath.get('06 ENERGY AND MARKETS').join_power,policyByPath.get('06 ENERGY AND MARKETS').talk_power],[30,20]);

function resolveServerGroupEntries(entries) {
  if(entries.length===0) return 0;
  const negated=entries.filter(p=>p.negate===1);
  if(negated.length) return Math.min(...negated.map(p=>p.value));
  return Math.max(...entries.map(p=>p.value));
}
function resolveServerGroupPermission(roleNames,permissionName) {
  const entries=roleNames.map(name=>get(byName.get(name),permissionName)).filter(Boolean);
  return resolveServerGroupEntries(entries);
}
function resolveChannelScopedPermission(serverRoleNames,channelRoleName,permissionName) {
  const serverEntries=serverRoleNames.map(name=>get(byName.get(name),permissionName)).filter(Boolean);
  const serverValue=resolveServerGroupEntries(serverEntries);
  if(serverEntries.some(p=>p.skip===1)) return serverValue;
  const channelPermission=get(byName.get(channelRoleName),permissionName);
  return channelPermission ? channelPermission.value : serverValue;
}
assert.equal(resolveServerGroupEntries([{value:30,negate:0},{value:50,negate:0}]),50,
  'Server Groups combine to the highest explicit value');
assert.equal(resolveServerGroupEntries([{value:50,negate:0},{value:-1,negate:1}]),-1,
  'A negated Server Group permission must use the lowest negated value');
assert.equal(resolveServerGroupPermission(['REGISTERED MEMBER','ENERGY / MARKETS / DATA LAB'],'i_channel_join_power'),30,
  'Specialist role stacking is additive; it does not lower the main role');
assert.equal(resolveServerGroupPermission(['SYSTEM ADMIN','ENERGY / MARKETS / DATA LAB'],'i_channel_join_power'),50,
  'A secondary specialist group must not lower an existing higher group power');
assert.equal(resolveChannelScopedPermission(['REGISTERED MEMBER'],'SENTINEL CHANNEL ADMIN','i_client_talk_power'),0,
  'Hierarchy design intentionally keeps Channel Group from overriding server-rank talk power');
assert.equal(resolveChannelScopedPermission(['REGISTERED MEMBER'],'SENTINEL CHANNEL ADMIN','i_channel_join_power'),0,
  'Hierarchy design intentionally keeps Channel Group from overriding server-rank join power');
assert.equal(resolveChannelScopedPermission(['REGISTERED MEMBER','NO-KICK PROTECTED'],'SENTINEL CHANNEL MODERATOR','i_client_needed_kick_from_channel_power'),101,
  'Server Group skip flag must protect the No-Kick threshold from Channel Group override');
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
for(const role of roles.filter(r=>r.name!=='SENTINEL OWNER')) {
  const permEdit=get(role,'i_permission_modify_power');
  if(permEdit) assert.equal(permEdit.value,-1,'Non-owner custom profile must not edit permissions: '+role.name);
  assert.equal(role.permissions.some(p=>p.name.startsWith('i_needed_modify_power_')),false,
    'Non-owner custom profile must not grant permission changes: '+role.name);
}
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
console.log('PASS: 33-channel hierarchy map, protected rank Join/Talk powers, power pairs, overlays, and permission-edit boundaries.');
console.log('NOTE: offline validation only; existing built-in Server Admin privileges and live server behavior are not changed or verified.');