import { exec } from 'child_process';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { filter, merge, tap } from 'rxjs';
import { getHandledRoutes, handleJobs, Job, routeRenderer } from '..';
import { getPool, green, loadConfig, log, logError, printProgress, registerPlugin, scullyConfig, yellow } from '../../..';
import { findPlugin } from '../../pluginManagement';
import { renderPlugin } from '../handlers/renderPlugin';
import { terminateAllPools } from '../procesmanager/taskPool';
import { readDotProperty } from '../scullydot';
import { Deferred } from './deferred';
import { initSpSPool, SPSRenderer } from './serverPlatformRender';

const workerPath = join(__dirname, 'ps-worker.js');

const tsConfig = {
  extends: '../tsconfig.json',
  compilerOptions: {
    outDir: 'runtime',
    target: 'es2020',
    allowJs: true,
    allow
