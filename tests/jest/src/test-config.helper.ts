import { TestBed } from '@angular/core/testing';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import sanitizeHtml from 'sanitize-html';

const SCULLY_STATE_START = `/** ___SCULLY_STATE_START___ */`;
const SCULLY_STATE_END = `/** ___SCULLY_STATE_END___ */`;

type CompilerOptions = Partial<{
  providers: any[];
  useJit: boolean;
  preserveWhitespaces: boolean;
}>;
export type ConfigureFn = (testBed: typeof TestBed) => void;

export const configureTests = (configure: ConfigureFn, compilerOptions: CompilerOptions = {}) => {
  const compilerConfig: CompilerOptions = {
    preserveWhitespaces: false,
    ...compilerOptions,
  };

  const configuredTestBed = TestBed.configureCompiler(compilerConfig);
  configure(configuredTestBed);

  return configuredTestBed.compileComponents().then(() => configuredTestBed);
};

export const replaceIndexNG = (index: string) => {

  return sanitizeHtml(index, {
    allowedTags: sanitizeHtml.defaults.allowedTags.filter(tag => tag !== 'script'),
    allowedAttributes: {
      '*': ['content', 'scully-version', '_ngcontent', '_nghost', 'ng-version']
    },
    disallowedTagsMode: 'discard'
  });

  const cleanIndex = sanitizeHtml(index, {
    allowedTags: sanitizeHtml.defaults.allowedTags.filter(tag => tag !== 'script' && tag !== 'style'),
    allowedAttributes: {
      '*': ['!ng-*', '!scully-version', '!ng-version']
    },
    allowedSchemes: sanitizeHtml.defaults.allowedSchemes.concat(['data'])
  });
  return cleanIndex;

};

export const extractTransferState = (index: string) => {
  try {
    const result = index.split(SCULLY_STATE_START)[1].split(SCULLY_STATE_END)[0];
    return JSON.parse(unescapeHtml(result));
  } catch (e) {
    return `Error during transferstate parse "${e.message}"`;
  }
};

export const removeTransferState = (index: string) => {
  return separateTransferFromHtml(index)[0];
};

export const separateTransferFromHtml = (index) => {
  if (index.indexOf(SCULLY_STATE_START) === -1) {
    return [index, null];
  }

  // Remove transfer state
  const [start, remaining] = index.split(SCULLY_STATE_START);
  const [transferStateBlob, end] = remaining.split(SCULLY_STATE_END);
  const indexWithoutTransferState = start + end;
  const transferState = JSON.parse(unescapeHtml(transferStateBlob));

  return [indexWithoutTransferState, transferState];
};

export const cl = (something: string) => {
  console.log(something);
};

export function readPage(name: string, project = 'sample-blog'): string {
  const path = join(__dirname, `../../../dist/static/${project}/${name}/index.html`);
  if (!existsSync(path)) {
    throw new Error(`page "${name}" not found at location "${path}"`);
  }
  return readFileSync(path, 'utf-8').toString();
}

export function readRoutes(project = 'doc-sites') {
  const path = join(__dirname, `../../../dist/static/${project}/assets/scully-routes.json`);
  if (!existsSync(path)) {
    throw new Error(`routes file not found at location "${path}"`);
  }
  return JSON.parse(readFileSync(path, 'utf-8').toString()) as { route: string; [key: string]: unknown }[];
}

/**
 * Unescape our custom escaped texts
 * @param text
 */
export function unescapeHtml(text: string): string {
  const unescapedText: { [k: string]: string } = {
    '_~q~': "'",
    '_~b~': '`',
    '_~o~': '$',
    '_~s~': '/',
    '_~l~': '<',
    '_~g~': '>',
  };

  return (
    text
      /** put back escaped double quotes to make valid json again */
      .replace(/_~d~/g, `\\"`)
      /** replace the custom escapes */
      .replace(/_~[^]~/g, (s) => unescapedText[s])
      /** restore newlines+cr */
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
  );
}
