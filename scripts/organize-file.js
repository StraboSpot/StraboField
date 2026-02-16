// =============================================================================
// organize-file.js
// =============================================================================
//
// Alphabetizes and organizes all JS files in src/.
// Only processes files that have an `export default` of a function/component.
//
// Run from the project root:
//   node scripts/organize-file.js
//
// What this script does:
//
// 1. RETURN OBJECT SORTING
//    Sorts the properties in the main return { ... } object alphabetically.
//    e.g. { zoomToSpot, addSpot } becomes { addSpot, zoomToSpot }
//
// 2. FUNCTION ORGANIZATION (differs for hooks vs components)
//
//    Hooks (filenames starting with "use"):
//    - Functions are split into Internal Functions (not in the return
//      object) and Exported Functions (in the return object).
//    - Internal functions are placed above exported functions.
//    - Block comment headers /* Internal Functions */ and
//      /* Exported Functions */ are always written for each section.
//    - Within each section, functions are sorted alphabetically.
//
//    Components (all other files):
//    - All functions (internal and exported) are grouped together by
//      role into sub-sections:
//      - /* Event Handlers */: functions starting with "handle" or "on"
//      - /* Logic Helpers */: all other functions
//      - /* Render Functions */: functions starting with "render"
//    - Sub-section headers are added when 2+ sub-sections are present.
//    - A /* View */ header is added before the return statement.
//    - Within each sub-section, functions are sorted alphabetically.
//
// 3. ALPHABETICAL ORDERING
//    Comments attached directly above a function (with no blank line
//    separating them) are kept with their function.
//
// 4. HOISTING AND ARROW FUNCTION NORMALIZATION
//    When preamble code (e.g. object literals, variable assignments) calls or
//    references a function at the top level, that function is converted from
//    arrow syntax (const name = () => {}) to a function declaration
//    (function name() {}) so that JavaScript hoisting ensures it is available
//    at definition time. This also applies transitively: if a preamble-
//    referenced function calls another function, that function is also hoisted.
//    Functions only referenced by other functions (not from preamble) are safe
//    as arrow functions since they're only called at runtime, after all const
//    declarations have been reached.
//    References inside arrow function block bodies within preamble code (e.g.
//    useEffect(() => { funcName() })) are excluded from hoisting detection,
//    since those callbacks are deferred and only execute at runtime.
//    Conversely, function declarations that do NOT need hoisting are converted
//    to const arrow functions (const name = () => {}) for consistency.
//    Functions wrapped in useCallback are skipped (cannot be hoisted).
//
// 5. PREAMBLE ORGANIZATION
//    Non-function declarations (hook calls, state, effects, etc.) are organized
//    into sections with block comment headers:
//    - /* Data Hooks */: useDispatch, useSelector, useContext, custom hooks
//    - /* Local State */: useState, useRef, useReducer
//    - /* Derived Variables */: plain variable declarations (no hooks)
//    - /* Derived State */: useMemo, useCallback
//    - /* Side Effects */: useEffect, useLayoutEffect
//    Section headers are only added when 2+ categories are present.
//    Relative order of statements within each category is preserved.
//
// What this script does NOT touch:
//    - Files without `export default` or where the default export is not a
//      function/component.
//
// =============================================================================

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ROOT = path.resolve(__dirname, '..');
const files = glob.sync('src/**/*.js', {cwd: ROOT});

const FUNC_PATTERNS = {
  constArrow: /^const\s+(\w+)\s*=\s*(?:async\s*)?\(/,
  constFunction: /^const\s+(\w+)\s*=\s*function/,
  functionDecl: /^(?:async\s+)?function\s+(\w+)\s*\(/,
  singleParamArrow: /^const\s+(\w+)\s*=\s*(?:async\s+)?\w+\s*=>/,
};

// Count brackets in a line, skipping content inside string literals,
// /* */ block comments, and // line comments so that braces inside
// JSX comments (e.g. {/*{!isEmpty(x)*/}) or strings (e.g. 'file://')
// don't throw off depth tracking.
function countBracketsInLine(line, openCh, closeCh, startCol = 0) {
  let depth = 0;
  let foundOpen = false;
  let i = startCol;
  while (i < line.length) {
    // Skip string literals (must come before // check to avoid
    // treating '//' inside strings as a comment)
    if (line[i] === '\'' || line[i] === '"') {
      const quote = line[i];
      i++;
      while (i < line.length && line[i] !== quote) {
        if (line[i] === '\\') i++;
        i++;
      }
      if (i < line.length) i++;
      continue;
    }
    if (line[i] === '/' && i + 1 < line.length && line[i + 1] === '/') break;
    if (line[i] === '/' && i + 1 < line.length && line[i + 1] === '*') {
      i += 2;
      while (i < line.length) {
        if (line[i] === '*' && i + 1 < line.length && line[i + 1] === '/') { i += 2; break; }
        i++;
      }
      continue;
    }
    if (line[i] === openCh) { depth++; foundOpen = true; }
    if (line[i] === closeCh) depth--;
    i++;
  }
  return {depth, foundOpen};
}

function isFuncLine(trimmedLine) {
  return FUNC_PATTERNS.constArrow.test(trimmedLine)
    || FUNC_PATTERNS.constFunction.test(trimmedLine)
    || FUNC_PATTERNS.functionDecl.test(trimmedLine)
    || FUNC_PATTERNS.singleParamArrow.test(trimmedLine);
}

function getFuncName(trimmedLine) {
  const m = trimmedLine.match(FUNC_PATTERNS.constArrow)
    || trimmedLine.match(FUNC_PATTERNS.constFunction)
    || trimmedLine.match(FUNC_PATTERNS.functionDecl)
    || trimmedLine.match(FUNC_PATTERNS.singleParamArrow);
  return m ? m[1] : null;
}

// Convert a const arrow/expression function chunk to a function declaration
function convertToFunctionDecl(chunk) {
  const lines = [...chunk.lines];

  // Find the first code line (skip comments)
  let codeIdx = 0;
  while (codeIdx < lines.length) {
    const t = lines[codeIdx].trim();
    if (!t.startsWith('//') && !t.startsWith('/*') && !t.startsWith('*')) break;
    codeIdx++;
  }
  if (codeIdx >= lines.length) return lines;

  // Normalize single-param arrow to parenthesized form for uniform handling
  if (FUNC_PATTERNS.singleParamArrow.test(lines[codeIdx].trim())) {
    lines[codeIdx] = lines[codeIdx].replace(
      /=\s*(async\s+)?(\w+)\s*=>/,
      (_, asyncKw, param) => `= ${asyncKw || ''}(${param}) =>`,
    );
  }

  const firstLine = lines[codeIdx];
  const indentStr = firstLine.match(/^(\s*)/)[1];

  // Fix invalid syntax from previous \r\n bug: function name() => expr;
  if (FUNC_PATTERNS.functionDecl.test(firstLine.trim()) && /\)\s*=>/.test(firstLine)) {
    lines[codeIdx] = firstLine.replace(/\)\s*=>\s*(.+);$/, ') { return $1; }');
    lines[codeIdx] = indentStr + lines[codeIdx].trimStart();
    return lines;
  }

  // Already a function declaration or useCallback — skip
  if (FUNC_PATTERNS.functionDecl.test(firstLine.trim())) return lines;
  if (firstLine.includes('useCallback')) return lines;

  // Find the line containing `) =>`
  let arrowIdx = -1;
  for (let j = codeIdx; j < lines.length; j++) {
    if (/\)\s*=>/.test(lines[j])) { arrowIdx = j; break; }
  }
  if (arrowIdx < 0) return lines;

  if (codeIdx === arrowIdx) {
    // Declaration and arrow on the same line
    const hasBlock = firstLine.trim().endsWith('{');
    if (hasBlock) {
      // const name = [async] (params) => {
      lines[codeIdx] = firstLine
        .replace(/const\s+(\w+)\s*=\s*async\s*\(/, 'async function $1(')
        .replace(/const\s+(\w+)\s*=\s*\(/, 'function $1(')
        .replace(/\)\s*=>\s*\{/, ') {');
      // Restore indentation
      lines[codeIdx] = indentStr + lines[codeIdx].trimStart();
      // Fix trailing }; → }
      for (let j = lines.length - 1; j >= 0; j--) {
        if (lines[j].trim() === '};') {
          lines[j] = lines[j].replace('};', '}');
          break;
        }
      }
    } else {
      // Single-line: const name = [async] (params) => expr;
      lines[codeIdx] = firstLine
        .replace(/const\s+(\w+)\s*=\s*async\s*\(/, 'async function $1(')
        .replace(/const\s+(\w+)\s*=\s*\(/, 'function $1(')
        .replace(/\)\s*=>\s*(.+);$/, ') { return $1; }');
      lines[codeIdx] = indentStr + lines[codeIdx].trimStart();
    }
  } else {
    // Multi-line params: const name = [async] ( ... \n ) => {
    lines[codeIdx] = firstLine
      .replace(/const\s+(\w+)\s*=\s*async\s*\(/, 'async function $1(')
      .replace(/const\s+(\w+)\s*=\s*\(/, 'function $1(');
    lines[codeIdx] = indentStr + lines[codeIdx].trimStart();
    lines[arrowIdx] = lines[arrowIdx].replace(/\)\s*=>\s*\{/, ') {');
    // Fix trailing }; → }
    for (let j = lines.length - 1; j >= 0; j--) {
      if (lines[j].trim() === '};') {
        lines[j] = lines[j].replace('};', '}');
        break;
      }
    }
  }

  return lines;
}

// Convert a function declaration chunk to a const arrow function
function convertToArrowFunction(chunk) {
  const lines = [...chunk.lines];

  // Find the first code line (skip comments)
  let codeIdx = 0;
  while (codeIdx < lines.length) {
    const t = lines[codeIdx].trim();
    if (!t.startsWith('//') && !t.startsWith('/*') && !t.startsWith('*')) break;
    codeIdx++;
  }
  if (codeIdx >= lines.length) return lines;

  const firstLine = lines[codeIdx];

  // Only convert function declarations (not already arrow functions)
  if (!FUNC_PATTERNS.functionDecl.test(firstLine.trim())) return lines;

  const indentStr = firstLine.match(/^(\s*)/)[1];

  // Check if the function declaration spans multiple lines (params across lines)
  // by seeing if the opening { is on a different line
  let braceLineIdx = -1;
  for (let j = codeIdx; j < lines.length; j++) {
    if (lines[j].includes('{')) { braceLineIdx = j; break; }
  }

  if (codeIdx === braceLineIdx) {
    // Single-line declaration: [async] function name(params) {
    lines[codeIdx] = firstLine
      .replace(/async\s+function\s+(\w+)\s*\(/, 'const $1 = async (')
      .replace(/function\s+(\w+)\s*\(/, 'const $1 = (');
    // Replace `) {` with `) => {`
    lines[codeIdx] = lines[codeIdx].replace(/\)\s*\{/, ') => {');
    lines[codeIdx] = indentStr + lines[codeIdx].trimStart();
    // Fix trailing } → };
    for (let j = lines.length - 1; j >= 0; j--) {
      if (lines[j].trim() === '}') {
        lines[j] = lines[j].replace('}', '};');
        break;
      }
    }
  } else {
    // Multi-line params: [async] function name( ... \n ) {
    lines[codeIdx] = firstLine
      .replace(/async\s+function\s+(\w+)\s*\(/, 'const $1 = async (')
      .replace(/function\s+(\w+)\s*\(/, 'const $1 = (');
    lines[codeIdx] = indentStr + lines[codeIdx].trimStart();
    if (braceLineIdx >= 0) {
      lines[braceLineIdx] = lines[braceLineIdx].replace(/\)\s*\{/, ') => {');
    }
    // Fix trailing } → };
    for (let j = lines.length - 1; j >= 0; j--) {
      if (lines[j].trim() === '}') {
        lines[j] = lines[j].replace('}', '};');
        break;
      }
    }
  }

  return lines;
}

// Strip arrow function block bodies from text, leaving only the top-level
// code that executes synchronously at definition time. This prevents
// false-positive hoisting of functions only referenced inside deferred
// callbacks (e.g., useEffect(() => { funcName() })).
function stripCallbackBodies(text) {
  let result = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] === '=' && i + 1 < text.length && text[i + 1] === '>') {
      result += '=>';
      i += 2;
      // Skip whitespace after =>
      while (i < text.length && /\s/.test(text[i])) {
        result += text[i];
        i++;
      }
      // If followed by {, skip the entire block body
      if (i < text.length && text[i] === '{') {
        let depth = 1;
        i++;
        while (i < text.length && depth > 0) {
          if (text[i] === '{') depth++;
          else if (text[i] === '}') depth--;
          i++;
        }
        continue;
      }
      continue;
    }
    result += text[i];
    i++;
  }
  return result;
}

const PREAMBLE_CATEGORIES = ['dataHooks', 'localState', 'derivedVars', 'derivedState', 'sideEffects'];
const PREAMBLE_HEADERS = {
  dataHooks: 'Data Hooks',
  localState: 'Local State',
  derivedVars: 'Derived Variables',
  derivedState: 'Derived State',
  sideEffects: 'Side Effects',
};
const PREAMBLE_HEADER_RE = /^\s*\/\*\s*(Data Hooks\s*\/?\s*State|Data Hooks|Local State|Derived Variables|Derived State|Side Effects|Event Handlers|Logic Helpers|Internal Functions|Exported Functions|Render Functions|View)\s*\*\/\s*$/;

// Categorize a preamble statement by the hook it contains
function categorizePreambleStatement(stmtLines) {
  const text = stmtLines.join(' ');
  if (/\buseEffect\b|\buseLayoutEffect\b/.test(text)) return 'sideEffects';
  if (/\buseMemo\b|\buseCallback\b/.test(text)) return 'derivedState';
  if (/\b(useState|useRef|useReducer)\b/.test(text)) return 'localState';
  if (/\buse[A-Z]\w*\b/.test(text)) return 'dataHooks';
  return 'derivedVars';
}

// Assign a tier within the Data Hooks section:
// 0 = external data (useDispatch, useSelector, useContext)
// 1 = custom hooks (useSamples, useServerRequests, useToast, etc.)
function getDataHooksTier(stmtLines) {
  const hookType = getHookType(stmtLines);
  if (!hookType) return 1;
  if (/^(useDispatch|useSelector|useContext)$/.test(hookType)) return 0;
  return 1;
}

// Split preamble chunks into individual statements, attaching comments to the
// next code statement. Multi-line statements are detected via bracket depth.
function parsePreambleStatements(preambleChunks, indent) {
  // Flatten all preamble lines, inserting null as chunk separators
  const allLines = [];
  for (let c = 0; c < preambleChunks.length; c++) {
    if (c > 0) allLines.push(null);
    for (const line of preambleChunks[c].lines) allLines.push(line);
  }

  const statements = [];
  let pending = []; // comment lines waiting to attach to next statement

  let i = 0;
  while (i < allLines.length) {
    if (allLines[i] === null) { i++; continue; }
    const trimmed = allLines[i].trim();
    if (trimmed === '') { i++; continue; }

    // Skip old section headers (will be regenerated)
    if (PREAMBLE_HEADER_RE.test(allLines[i])) { i++; continue; }

    // Collect comment lines to attach to the next code statement
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      pending.push(allLines[i]);
      i++;
      continue;
    }

    // Start of a code statement — include any pending comments
    const stmtLines = [...pending];
    pending = [];
    stmtLines.push(allLines[i]);

    // Track bracket depth to find end of multi-line statement
    let depth = 0;
    for (const pair of [['{', '}'], ['(', ')'], ['[', ']']]) {
      depth += countBracketsInLine(allLines[i], pair[0], pair[1]).depth;
    }
    i++;

    while (depth > 0 && i < allLines.length) {
      if (allLines[i] === null) { i++; continue; }
      stmtLines.push(allLines[i]);
      for (const pair of [['{', '}'], ['(', ')'], ['[', ']']]) {
        depth += countBracketsInLine(allLines[i], pair[0], pair[1]).depth;
      }
      i++;
    }

    statements.push(stmtLines);
  }

  // Trailing comments become their own statement
  if (pending.length > 0) statements.push(pending);

  return statements;
}

// Extract the hook name (e.g. "useSelector") from a statement, or null
function getHookType(stmtLines) {
  for (const line of stmtLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
    const match = trimmed.match(/\b(use[A-Z]\w*)\b/);
    return match ? match[1] : null;
  }
  return null;
}

// Extract a sort key (first variable name) from a preamble statement
function getPreambleSortKey(stmtLines) {
  for (const line of stmtLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
    const m = trimmed.match(/(?:const|let|var)\s+(?:\{\s*(\w+)|\[\s*(\w+)|(\w+))/);
    if (m) return (m[1] || m[2] || m[3]).toLowerCase();
    break;
  }
  return '';
}

// Sub-group statements by hook type, sort groups alphabetically, and sort
// statements within each group by variable name. Returns array of groups.
function subGroupAndSort(statements) {
  const groups = {};
  for (const stmt of statements) {
    const hookType = (getHookType(stmt) || 'zzz_other').toLowerCase();
    if (!groups[hookType]) groups[hookType] = [];
    groups[hookType].push(stmt);
  }
  const sortedTypes = Object.keys(groups).sort();
  for (const type of sortedTypes) {
    groups[type].sort((a, b) => getPreambleSortKey(a).localeCompare(getPreambleSortKey(b)));
  }
  return sortedTypes.map(type => groups[type]);
}

let totalReturnChanges = 0;
let totalFuncChanges = 0;
let changedFiles = [];

for (const file of files) {
  const fullPath = path.join(ROOT, file);
  const content = fs.readFileSync(fullPath, 'utf8').replace(/\r\n/g, '\n');

  if (!/export default\b/.test(content)) continue;

  const exportDefaultMatch = content.match(/export default (\w+)/);
  if (!exportDefaultMatch) continue;
  const exportedName = exportDefaultMatch[1];

  const isFunctionRegex = new RegExp(
    `(?:const|let|var|function)\\s+${exportedName}\\s*(?:=\\s*\\(|=\\s*\\{|\\()`,
  );
  if (!isFunctionRegex.test(content)) continue;

  const basename = path.basename(file);
  const isHook = basename.startsWith('use');

  let lines = content.split('\n');
  let fileReturnChanges = 0;
  let fileFuncChanges = 0;

  // === PART 1: Sort return block properties ===
  let returnBlocks = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^return\s*[\(\{]/.test(trimmed)) {
      let startLine = i;
      let depth = 0;
      let foundOpen = false;
      for (let j = i; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') { depth++; foundOpen = true; }
          if (ch === '}') depth--;
        }
        if (foundOpen && depth === 0) {
          returnBlocks.push({start: startLine, end: j});
          break;
        }
      }
    }
  }

  // Collect exported names from the return block
  let exportedNames = new Set();
  if (returnBlocks.length > 0) {
    const block = returnBlocks[returnBlocks.length - 1];

    let openLine = -1;
    for (let i = block.start; i <= block.end; i++) {
      if (lines[i].includes('{')) { openLine = i; break; }
    }
    let closeLine = block.end;

    if (openLine >= 0 && closeLine > openLine) {
      let propStartLine = lines[openLine].indexOf('{') === lines[openLine].trim().length - 1
        ? openLine + 1 : openLine;
      if (propStartLine === openLine) propStartLine = openLine + 1;
      let propEndLine = lines[closeLine].trim().startsWith('}') ? closeLine - 1 : closeLine;

      if (propStartLine <= propEndLine) {
        let propLines = [];
        for (let i = propStartLine; i <= propEndLine; i++) {
          propLines.push(lines[i]);
        }

        // Collect exported names
        for (const line of propLines) {
          const name = line.trim().replace(/^\.\.\./, '').split(/[^a-zA-Z0-9_]/)[0];
          if (name) exportedNames.add(name);
        }

        // Sort return properties
        const sorted = [...propLines].sort((a, b) => {
          const nameA = a.trim().replace(/^\.\.\./, '').split(/[^a-zA-Z0-9_]/)[0].toLowerCase();
          const nameB = b.trim().replace(/^\.\.\./, '').split(/[^a-zA-Z0-9_]/)[0].toLowerCase();
          return nameA.localeCompare(nameB);
        });

        const changed = propLines.some((line, i) => line !== sorted[i]);
        if (changed) {
          for (let i = 0; i < sorted.length; i++) {
            lines[propStartLine + i] = sorted[i];
          }
          fileReturnChanges++;
        }
      }
    }
  }

  // === PART 2: Separate and sort internal vs exported functions ===
  const varDefRegex = new RegExp(
    `(?:const|let|var)\\s+${exportedName}\\s*=`,
  );
  const funcDefRegex = new RegExp(
    `(?:async\\s+)?function\\s+${exportedName}\\s*\\(`,
  );
  let bodyStart = -1;

  for (let i = 0; i < lines.length; i++) {
    if (varDefRegex.test(lines[i]) || funcDefRegex.test(lines[i])) {
      for (let j = i; j < lines.length; j++) {
        if (lines[j].includes('{')) {
          bodyStart = j + 1;
          break;
        }
      }
      break;
    }
  }

  // Determine body indentation level
  let bodyIndent = '';
  for (let bi = bodyStart; bi < lines.length; bi++) {
    if (lines[bi].trim() !== '') {
      bodyIndent = lines[bi].match(/^(\s*)/)[1];
      break;
    }
  }

  // Find returnStart: last `return` at body indentation level.
  // Using indentation prevents matching `return (` inside nested functions
  // (e.g., renderSubform) which would truncate the body parsing range.
  let returnStart = -1;
  for (let ri = lines.length - 1; ri >= bodyStart; ri--) {
    const lineIndent = lines[ri].match(/^(\s*)/)[1];
    if (lineIndent === bodyIndent && /^return\b/.test(lines[ri].trim())) {
      returnStart = ri;
      break;
    }
  }

  if (bodyStart < 0 || returnStart < 0) continue;

  // Parse the body into chunks
  let chunks = [];
  let i = bodyStart;

  while (i < returnStart) {
    const trimmed = lines[i].trim();

    if (trimmed === '') { i++; continue; }

    // If this is a comment, look ahead to see if it precedes a function.
    // If so, skip it here — the function parser will grab it via backtracking.
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      let lookAhead = i + 1;
      while (lookAhead < returnStart && (lines[lookAhead].trim().startsWith('//')
        || lines[lookAhead].trim().startsWith('/*')
        || lines[lookAhead].trim().startsWith('*')
        || lines[lookAhead].trim() === '')) {
        lookAhead++;
      }
      if (lookAhead < returnStart && isFuncLine(lines[lookAhead].trim())) {
        i++;
        continue;
      }
    }

    if (isFuncLine(trimmed)) {
      const funcName = getFuncName(trimmed);

      // Check for preceding comment lines
      let commentStart = i;
      while (commentStart > bodyStart && lines[commentStart - 1].trim() !== ''
        && (lines[commentStart - 1].trim().startsWith('//')
          || lines[commentStart - 1].trim().startsWith('/*')
          || lines[commentStart - 1].trim().startsWith('*'))) {
        commentStart--;
      }

      // Find the end of the function
      let depth = 0;
      let foundOpen = false;
      let funcEnd = i;

      let singleLine = false;
      if (trimmed.endsWith(';')) {
        const {depth: lineDepth} = countBracketsInLine(trimmed, '{', '}');
        if (lineDepth === 0) {
          singleLine = true;
          funcEnd = i;
        }
      }

      if (!singleLine) {
        // For arrow functions, find => and determine body delimiter.
        // This avoids confusion from destructured params (e.g. ({a, b}) => (...))
        // where brace depth balances before the actual body starts.
        let trackOpen = '{';
        let trackClose = '}';
        let scanStartLine = i;
        let scanStartCol = 0;

        const isArrowFunc = FUNC_PATTERNS.constArrow.test(trimmed)
          || FUNC_PATTERNS.singleParamArrow.test(trimmed);

        if (isArrowFunc) {
          for (let j = i; j < returnStart; j++) {
            const arrowIdx = lines[j].indexOf('=>');
            if (arrowIdx >= 0) {
              scanStartLine = j;
              scanStartCol = arrowIdx + 2;
              const afterArrow = lines[j].substring(arrowIdx + 2).trim();
              if (afterArrow.startsWith('(')) {
                trackOpen = '(';
                trackClose = ')';
              } else if (afterArrow === '') {
                for (let k = j + 1; k < returnStart; k++) {
                  const nt = lines[k].trim();
                  if (nt === '') continue;
                  if (nt.startsWith('(')) {
                    trackOpen = '(';
                    trackClose = ')';
                  }
                  break;
                }
              }
              break;
            }
          }
        }

        for (let j = scanStartLine; j < returnStart; j++) {
          const startCol = (j === scanStartLine) ? scanStartCol : 0;
          const scan = countBracketsInLine(lines[j], trackOpen, trackClose, startCol);
          depth += scan.depth;
          if (scan.foundOpen) foundOpen = true;
          if (foundOpen && depth === 0) {
            funcEnd = j;
            break;
          }
          if (j > i && lines[j].trim().endsWith(';') && !foundOpen) {
            funcEnd = j;
            break;
          }
        }
        if (!foundOpen && depth === 0) {
          for (let j = i; j < returnStart; j++) {
            if (lines[j].trim().endsWith(';')) {
              funcEnd = j;
              break;
            }
          }
        }
      }

      let chunkLines = [];
      for (let j = commentStart; j <= funcEnd; j++) {
        chunkLines.push(lines[j]);
      }

      const isExported = exportedNames.has(funcName);
      chunks.push({type: 'function', name: funcName, isExported, lines: chunkLines});
      i = funcEnd + 1;
    } else {
      let blockStart = i;
      let blockEnd = i;
      while (blockEnd + 1 < returnStart) {
        const nextTrimmed = lines[blockEnd + 1].trim();
        if (nextTrimmed === '') break;
        if (isFuncLine(nextTrimmed)) break;
        if (nextTrimmed.startsWith('//') || nextTrimmed.startsWith('/*')) {
          let lookAhead = blockEnd + 2;
          while (lookAhead < returnStart && (lines[lookAhead].trim().startsWith('//')
            || lines[lookAhead].trim().startsWith('*')
            || lines[lookAhead].trim() === '')) {
            lookAhead++;
          }
          if (lookAhead < returnStart && isFuncLine(lines[lookAhead].trim())) break;
        }
        blockEnd++;
      }

      let chunkLines = [];
      for (let j = blockStart; j <= blockEnd; j++) {
        chunkLines.push(lines[j]);
      }

      chunks.push({type: 'other', name: '', lines: chunkLines});
      i = blockEnd + 1;
    }
  }


  // Detect indentation from existing functions
  const firstFunc = chunks.find(c => c.type === 'function');
  const indent = firstFunc ? firstFunc.lines[0].match(/^(\s*)/)[1] : '  ';

  // Separate into non-function preamble, internal functions, and exported functions
  let preambleChunks = [];
  let internalFuncs = [];
  let exportedFuncs = [];
  let seenFunction = false;

  for (const chunk of chunks) {
    if (chunk.type === 'function') {
      seenFunction = true;
      if (chunk.isExported) {
        exportedFuncs.push(chunk);
      } else {
        internalFuncs.push(chunk);
      }
    } else {
      // Non-function chunks after functions start should stay in preamble
      // (they're typically between declarations and functions)
      preambleChunks.push(chunk);
    }
  }

  // Classify functions into tiers: 0 = event handler, 1 = logic helper, 2 = render
  const funcTier = (name) => {
    if (name.toLowerCase().startsWith('render')) return 2;
    if (/^handle[A-Z]/.test(name) || /^on[A-Z]/.test(name)) return 0;
    return 1;
  };

  // For components, sort by tier then alphabetically: event handlers → logic helpers → render functions
  // For hooks, sort purely alphabetically (no tier grouping)
  const funcSort = (a, b) => {
    if (!isHook) {
      const tierA = funcTier(a.name);
      const tierB = funcTier(b.name);
      if (tierA !== tierB) return tierA - tierB;
    }
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  };
  internalFuncs.sort(funcSort);
  exportedFuncs.sort(funcSort);

  // Only proceed if there are functions to organize
  if (internalFuncs.length === 0 && exportedFuncs.length === 0) continue;

  // === PART 3: Detect functions that need hoisting ===
  // Preamble code (non-function chunks like object literals) runs at definition
  // time, so any functions it references must be hoisted. Functions only referenced
  // by other functions are called at runtime (after all const declarations), so
  // they don't need hoisting — UNLESS they're transitively called from a
  // preamble-referenced function (which executes at definition time).
  const allFuncs = [...internalFuncs, ...exportedFuncs];
  const needsHoisting = new Set();

  // Step 1: Find functions directly referenced by preamble code.
  // Join all preamble chunks and strip arrow function block bodies, since those
  // are deferred callbacks (e.g., useEffect, useCallback) where references are
  // only evaluated at runtime. Joining handles callbacks split across chunks.
  const allPreambleText = stripCallbackBodies(
    preambleChunks.map(c => c.lines.join('\n')).join('\n'),
  );
  for (const func of allFuncs) {
    const regex = new RegExp(`\\b${func.name}\\b`);
    if (regex.test(allPreambleText)) {
      needsHoisting.add(func.name);
    }
  }

  // Step 2: Transitively hoist functions called by already-hoisted functions,
  // since those may execute at definition time via preamble code
  let changed = true;
  while (changed) {
    changed = false;
    for (const func of allFuncs) {
      if (!needsHoisting.has(func.name)) continue;
      const bodyText = func.lines.join('\n');
      for (const other of allFuncs) {
        if (needsHoisting.has(other.name)) continue;
        const regex = new RegExp(`\\b${other.name}\\b`);
        if (regex.test(bodyText)) {
          needsHoisting.add(other.name);
          changed = true;
        }
      }
    }
  }

  // Convert functions that need hoisting to function declaration syntax,
  // and convert functions that don't need hoisting to arrow function syntax
  for (const func of allFuncs) {
    if (needsHoisting.has(func.name)) {
      func.lines = convertToFunctionDecl(func);
    } else {
      func.lines = convertToArrowFunction(func);
    }
  }

  // === PART 4: Organize preamble into sections ===
  const preambleStatements = parsePreambleStatements(preambleChunks, indent);
  const preambleGroups = {};
  for (const cat of PREAMBLE_CATEGORIES) preambleGroups[cat] = [];

  for (const stmt of preambleStatements) {
    const cat = categorizePreambleStatement(stmt);
    preambleGroups[cat].push(stmt);
  }

  // Build new body
  let newBodyLines = [];

  // Preamble sections
  for (const cat of PREAMBLE_CATEGORIES) {
    if (preambleGroups[cat].length === 0) continue;
    if (newBodyLines.length > 0 && newBodyLines[newBodyLines.length - 1].trim() !== '') {
      newBodyLines.push('');
    }
    newBodyLines.push(`${indent}/* ${PREAMBLE_HEADERS[cat]} */`);
    newBodyLines.push('');

    // Data Hooks: sub-group by tier (external → custom hooks),
    // then by hook type within each tier, alphabetized
    if (cat === 'dataHooks') {
      const tiers = [[], []];
      for (const stmt of preambleGroups[cat]) {
        tiers[getDataHooksTier(stmt)].push(stmt);
      }
      let firstGroup = true;
      for (let t = 0; t < tiers.length; t++) {
        if (tiers[t].length === 0) continue;
        const subGroups = subGroupAndSort(tiers[t]);
        for (let g = 0; g < subGroups.length; g++) {
          const needsBlankLine = !firstGroup && (g === 0);
          if (needsBlankLine && newBodyLines.length > 0 && newBodyLines[newBodyLines.length - 1].trim() !== '') {
            newBodyLines.push('');
          }
          firstGroup = false;
          for (const stmt of subGroups[g]) {
            for (const line of stmt) newBodyLines.push(line);
          }
        }
      }
    } else if (cat === 'localState') {
      // Local State: sub-group by hook type, alphabetized
      const subGroups = subGroupAndSort(preambleGroups[cat]);
      let firstGroup = true;
      for (let g = 0; g < subGroups.length; g++) {
        if (!firstGroup && newBodyLines.length > 0 && newBodyLines[newBodyLines.length - 1].trim() !== '') {
          newBodyLines.push('');
        }
        firstGroup = false;
        for (const stmt of subGroups[g]) {
          for (const line of stmt) newBodyLines.push(line);
        }
      }
    } else if (cat === 'derivedVars') {
      // Derived Variables: alphabetize by variable name
      const sorted = [...preambleGroups[cat]].sort((a, b) =>
        getPreambleSortKey(a).localeCompare(getPreambleSortKey(b)),
      );
      for (const stmt of sorted) {
        for (const line of stmt) newBodyLines.push(line);
      }
    } else {
      // Derived State / Side Effects: preserve original order
      for (const stmt of preambleGroups[cat]) {
        const isMultiLine = stmt.filter(l => !l.trim().startsWith('//')).length > 1;
        if (newBodyLines.length > 0 && newBodyLines[newBodyLines.length - 1].trim() !== ''
          && isMultiLine) {
          newBodyLines.push('');
        }
        for (const line of stmt) newBodyLines.push(line);
      }
    }
  }

  // Helper to emit a list of functions with a blank line between each
  const emitFuncs = (funcs) => {
    for (const func of funcs) {
      if (newBodyLines.length === 0 || newBodyLines[newBodyLines.length - 1].trim() !== '') {
        newBodyLines.push('');
      }
      for (const line of func.lines) newBodyLines.push(line);
    }
  };

  // Helper to emit a group of functions with an optional header.
  // For components, splits into Event Handlers / Logic Helpers / Render Functions sub-sections.
  // For hooks, emits all functions together under the single header.
  const emitFuncGroup = (funcs, header) => {
    if (funcs.length === 0) return;
    if (newBodyLines.length > 0 && newBodyLines[newBodyLines.length - 1].trim() !== '') {
      newBodyLines.push('');
    }

    if (isHook) {
      if (header) {
        newBodyLines.push(`${indent}/* ${header} */`);
        newBodyLines.push('');
      }
      emitFuncs(funcs);
    } else {
      const eventHandlers = funcs.filter(f => funcTier(f.name) === 0);
      const logicHelpers = funcs.filter(f => funcTier(f.name) === 1);
      const renderFns = funcs.filter(f => funcTier(f.name) === 2);
      const subSections = [
        {items: eventHandlers, label: 'Event Handlers'},
        {items: logicHelpers, label: 'Logic Helpers'},
        {items: renderFns, label: 'Render Functions'},
      ].filter(s => s.items.length > 0);
      for (const section of subSections) {
        if (newBodyLines.length > 0 && newBodyLines[newBodyLines.length - 1].trim() !== '') {
          newBodyLines.push('');
        }
        newBodyLines.push(`${indent}/* ${section.label} */`);
        newBodyLines.push('');
        emitFuncs(section.items);
      }
    }
  };

  // Internal Functions section
  emitFuncGroup(internalFuncs, isHook ? 'Internal Functions' : null);

  // Exported Functions section
  emitFuncGroup(exportedFuncs, isHook ? 'Exported Functions' : null);

  // Trailing blank line before return
  if (newBodyLines.length > 0 && newBodyLines[newBodyLines.length - 1].trim() !== '') {
    newBodyLines.push('');
  }

  // View section header for components
  if (!isHook) {
    newBodyLines.push(`${indent}/* View */`);
    newBodyLines.push('');
  }

  // Compare with old body
  let oldBodyLines = lines.slice(bodyStart, returnStart);
  while (oldBodyLines.length > 0 && oldBodyLines[oldBodyLines.length - 1].trim() === '') oldBodyLines.pop();
  let newBodyTrimmed = [...newBodyLines];
  while (newBodyTrimmed.length > 0 && newBodyTrimmed[newBodyTrimmed.length - 1].trim() === '') newBodyTrimmed.pop();

  if (oldBodyLines.join('\n') !== newBodyTrimmed.join('\n')) {
    let finalLines = [
      ...lines.slice(0, bodyStart),
      ...newBodyLines,
      ...lines.slice(returnStart),
    ];
    lines = finalLines;
    fileFuncChanges++;
  }

  if (fileReturnChanges > 0 || fileFuncChanges > 0) {
    totalReturnChanges += fileReturnChanges;
    totalFuncChanges += fileFuncChanges;
    changedFiles.push({file, returnChanges: fileReturnChanges, funcChanges: fileFuncChanges});
    fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
  }
}

console.log('Changed files:', changedFiles.length);
console.log('Return prop sorts:', totalReturnChanges);
console.log('Function sorts:', totalFuncChanges);
changedFiles.forEach(f => {
  const parts = [];
  if (f.returnChanges) parts.push('return sorted');
  if (f.funcChanges) parts.push('functions organized');
  console.log('  ' + f.file + ' (' + parts.join(', ') + ')');
});
