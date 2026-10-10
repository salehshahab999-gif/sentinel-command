#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const SERVER_CORE = [
  'i_client_kick_from_server_power','i_client_kick_from_channel_power','i_client_ban_power','i_client_move_power','i_client_poke_power',
  'i_client_needed_kick_from_server_power','i_client_needed_kick_from_channel_power','i_client_needed_ban_power','i_client_needed_move_power','i_client_needed_poke_power',
  'i_client_talk_power','i_channel_join_power','i_channel_subscribe_power','i_group_modify_power','i_group_needed_modify_power',
  'i_group_member_add_power','i_group_member_remove_power','i_group_needed_member_add_power','i_group_needed_member_remove_power',
  'i_permission_modify_power','i_client_permission_modify_power','i_channel_permission_modify_power','i_client_needed_permission_modify_power'
];
const CHANNEL_CORE = [
  'i_client_talk_power','i_channel_join_power','i_channel_subscribe_power','i_client_kick_from_channel_power','i_client_needed_kick_from_channel_power',
  'i_client_move_power','i_client_needed_move_power','i_client_poke_power','i_client_needed_poke_power','i_channel_modify_power','i_channel_needed_modify_power'
];
function buildManifest(spec) {
  if (spec.v !== 2 || !Array.isArray(spec.profiles)) throw new Error('Unsupported or malformed roles spec.');
  const roles = spec.profiles.map(function (r) {
    if (r.k !== 'server_group' && r.k !== 'channel_group') throw new Error('Unsupported role kind for ' + r.n);
    const order = r.k === 'server_group' ? SERVER_CORE : CHANNEL_CORE;
    if (!Array.isArray(r.core) || r.core.length !== order.length) throw new Error(r.n + ': wrong core permission vector length');
    const permissions = [];
    function add(name, value, skip, negate) {
      permissions.push({name:name,value:Number(value),skip:Number(skip || 0),negate:Number(negate || 0)});
    }
    for (let i=0;i<order.length;i++) {
      const p=r.core[i];
      if (p === null) continue;
      if (typeof p === 'object') add(order[i],p.v,p.s,p.n);
      else add(order[i],p,0,0);
    }
    for (const x of (r.x || [])) add(x[0],x[1],x[2],x[3]);
    if (r.g === 1) {
      const base=permissions.slice();
      for (const p of base) {
        if (p.name.startsWith('i_needed_modify_power_')) continue;
        const suffix=(p.name.startsWith('b_') || p.name.startsWith('i_')) ? p.name.slice(2) : null;
        if (suffix) add('i_needed_modify_power_' + suffix,100,0,0);
      }
    }
    return {name:r.n,kind:r.k,category:r.c,risk:r.r,purpose:r.p,icon_suggestion:r.i,permissions:permissions};
  });
  return {
    schema_version:2,product:spec.product,target:spec.target,mode:spec.mode,
    profile_count_expected:spec.expected,safety:spec.safety,permission_model:spec.permission_model || null,roles:roles,references:spec.references || []
  };
}
function main() {
  let specPath=path.join(__dirname,'roles-v2.spec.json');
  let outPath=path.join(__dirname,'roles-v2.expanded.json');
  const args=process.argv.slice(2);
  for(let i=0;i<args.length;i++) {
    if(args[i]==='--spec' && args[i+1]) specPath=path.resolve(args[++i]);
    else if(args[i]==='--out' && args[i+1]) outPath=path.resolve(args[++i]);
    else if(args[i]==='--stdout') outPath='-';
    else throw new Error('Unknown or incomplete argument: ' + args[i]);
  }
  const manifest=buildManifest(JSON.parse(fs.readFileSync(specPath,'utf8')));
  const output=JSON.stringify(manifest,null,2)+'\n';
  if(outPath==='-') process.stdout.write(output);
  else {fs.writeFileSync(outPath,output,'utf8');console.log('Built '+manifest.roles.length+' profiles with '+manifest.roles.reduce((n,r)=>n+r.permissions.length,0)+' explicit permissions.');}
}
if(require.main===module) {try{main();}catch(e){console.error(e.message || e);process.exitCode=1;}}
module.exports={buildManifest:buildManifest,SERVER_CORE:SERVER_CORE,CHANNEL_CORE:CHANNEL_CORE};