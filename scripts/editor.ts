import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const procs = [
  spawn(process.execPath,['--import','tsx','tools/editor/server.ts'],{cwd:root,stdio:'inherit'}),
  spawn(process.execPath,['node_modules/astro/astro.js','dev','--host','127.0.0.1','--port','4321'],{cwd:root,stdio:'inherit'}),
  spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','tools/editor/vite.config.ts'],{cwd:root,stdio:'inherit'}),
];
for(const p of procs) p.on('exit',(code)=>{ if(code && code!==0) process.exitCode=code; for(const child of procs) if(child!==p) child.kill('SIGTERM'); });
for(const sig of ['SIGINT','SIGTERM']) process.on(sig,()=>{for(const p of procs)p.kill(sig as NodeJS.Signals);});
console.log('听我说 · 创作台： http://127.0.0.1:4310');
