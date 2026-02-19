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
//    - /* Local State */: useState, useRef, useReducer, useSharedValue, useAnimatedStyle
//    - /* Derived Variables */: plain variable declarations (no hooks)
//    - /* Derived State */: useMemo, useCallback
//    - /* Side Effects */: useEffect, useLayoutEffect
//    Section headers are only added when 2+ categories are present.
//    Relative order of statements within each category is preserved.
//
// 6. HELPER FILE ORGANIZATION
//    Files without `export default` (helper/utility files) are also processed:
//    - Functions are separated into internal (non-exported) and exported groups.
//    - Within each group, functions are sorted alphabetically.
//    - Block comment headers /* Internal Functions */ and /* Exported Functions */
//      are added only when both groups are present.
//    - Non-function preamble (constants, requires) is preserved above functions.
//
// What this script does NOT touch:
//    - Files where the default export is not a function/component.
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
function countBracketsInLine(line, openCh, closeCh, startCol = 0, inTemplate = false) {
  let depth = 0;
  let foundOpen = false;
  let i = startCol;
  while (i < line.length) {
    // Inside a template literal — skip content until closing backtick or ${
    if (inTemplate) {
      if (line[i] === '\\') { i += 2; continue; }
      if (line[i] === '$' && i + 1 < line.length && line[i + 1] === '{') {
        // Template expression — track its own brace depth without affecting outer depth
        i += 2;
        let exprDepth = 1;
        while (i < line.length && exprDepth > 0) {
          if (line[i] === '\'' || line[i] === '"') {
            const q = line[i]; i++;
            while (i < line.length && line[i] !== q) { if (line[i] === '\\') i++; i++; }
            if (i < line.length) i++;
            continue;
          }
          if (line[i] === '`') {
            // Nested template literal inside expression
            i++;
            while (i < line.length && line[i] !== '`') {
              if (line[i] === '\\') i++;
              i++;
            }
            if (i < line.length) i++;
            continue;
          }
          if (line[i] === '{') exprDepth++;
          if (line[i] === '}') exprDepth--;
          if (exprDepth > 0) i++;
        }
        if (i < line.length) i++; // skip closing }
        continue;
      }
      if (line[i] === '`') { inTemplate = false; i++; continue; }
      i++;
      continue;
    }
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
    // Template literal start
    if (line[i] === '`') { inTemplate = true; i++; continue; }
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
  return {depth, foundOpen, inTemplate};
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

// Verify that `=>` follows the closing `)` of the parameter list at paren depth 0,
// distinguishing real arrow functions from parenthesized expressions like `const X = (\n expr \n);`
function isArrowAfterParams(allLines, startIdx) {
  const line = allLines[startIdx];
  const openIdx = line.indexOf('(', line.indexOf('='));
  if (openIdx < 0) return true;
  let parenDepth = 0;
  for (let j = startIdx; j < allLines.length; j++) {
    const startCol = (j === startIdx) ? openIdx : 0;
    for (let ci = startCol; ci < allLines[j].length; ci++) {
      const ch = allLines[j][ci];
      if (ch === '\'' || ch === '"' || ch === '`') {
        ci++;
        while (ci < allLines[j].length && allLines[j][ci] !== ch) {
          if (allLines[j][ci] === '\\') ci++;
          ci++;
        }
        continue;
      }
      if (ch === '/' && ci + 1 < allLines[j].length && allLines[j][ci + 1] === '/') break;
      if (ch === '(') parenDepth++;
      if (ch === ')') {
        parenDepth--;
        if (parenDepth === 0) {
          const rest = allLines[j].substring(ci + 1).trimStart();
          if (rest.startsWith('=>')) return true;
          if (rest === '' || rest.startsWith('//')) {
            for (let k = j + 1; k < allLines.length; k++) {
              const nt = allLines[k].trim();
              if (nt === '') continue;
              return nt.startsWith('=>');
            }
          }
          return false;
        }
      }
    }
  }
  return false;
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
    const hasParenBody = /\)\s*=>\s*\(/.test(firstLine);
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
    } else if (hasParenBody) {
      // Multi-line expression body: const name = [async] (params) => (\n  expr\n);
      lines[codeIdx] = firstLine
        .replace(/const\s+(\w+)\s*=\s*async\s*\(/, 'async function $1(')
        .replace(/const\s+(\w+)\s*=\s*\(/, 'function $1(')
        .replace(/\)\s*=>\s*\(/, ') { return (');
      lines[codeIdx] = indentStr + lines[codeIdx].trimStart();
      for (let j = lines.length - 1; j >= 0; j--) {
        const t = lines[j].trim();
        if (t === ');') {
          lines[j] = lines[j].replace(');', '); }');
          break;
        }
        if (t === '};') {
          lines[j] = lines[j].replace('};', '); }');
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
    // Multi-line params: const name = [async] ( ... \n ) => ...
    lines[codeIdx] = firstLine
      .replace(/const\s+(\w+)\s*=\s*async\s*\(/, 'async function $1(')
      .replace(/const\s+(\w+)\s*=\s*\(/, 'function $1(');
    lines[codeIdx] = indentStr + lines[codeIdx].trimStart();
    const hasParenBodyMulti = /\)\s*=>\s*\(/.test(lines[arrowIdx]);
    if (hasParenBodyMulti) {
      lines[arrowIdx] = lines[arrowIdx].replace(/\)\s*=>\s*\(/, ') { return (');
      for (let j = lines.length - 1; j >= 0; j--) {
        const t = lines[j].trim();
        if (t === ');') {
          lines[j] = lines[j].replace(');', '); }');
          break;
        }
        if (t === '};') {
          lines[j] = lines[j].replace('};', '); }');
          break;
        }
      }
    } else {
      lines[arrowIdx] = lines[arrowIdx].replace(/\)\s*=>\s*\{/, ') {');
      // Fix trailing }; → }
      for (let j = lines.length - 1; j >= 0; j--) {
        if (lines[j].trim() === '};') {
          lines[j] = lines[j].replace('};', '}');
          break;
        }
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

// Preserve original blank line spacing around unmoved content using LCS matching.
// For lines that stayed in the same relative order (in the LCS), use original blank
// line counts. For moved/added lines, use the script's new blank line counts.
function mergeBlankLines(oldLines, newLines) {
  function extractContent(lines) {
    const result = [];
    let blanks = 0;
    for (const line of lines) {
      if (line.trim() === '') {
        blanks++;
      } else {
        result.push({text: line, blanksBefore: blanks});
        blanks = 0;
      }
    }
    return result;
  }
  const oldContent = extractContent(oldLines);
  const newContent = extractContent(newLines);
  const m = oldContent.length;
  const n = newContent.length;
  const dp = Array.from({length: m + 1}, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldContent[i - 1].text === newContent[j - 1].text) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  const lcsMap = new Map();
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (oldContent[i - 1].text === newContent[j - 1].text) {
      lcsMap.set(j - 1, i - 1);
      i--; j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  const result = [];
  for (let k = 0; k < newContent.length; k++) {
    const blanks = lcsMap.has(k)
      ? oldContent[lcsMap.get(k)].blanksBefore
      : newContent[k].blanksBefore;
    for (let b = 0; b < blanks; b++) result.push('');
    result.push(newContent[k].text);
  }
  return result;
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

// Categorize a preamble statement by the hook it contains.
function categorizePreambleStatement(stmtLines) {
  const text = stmtLines.join(' ');
  if (/\buseEffect\b|\buseLayoutEffect\b/.test(text)) return 'sideEffects';
  if (/\buseMemo\b|\buseCallback\b/.test(text)) return 'derivedState';
  if (/\b(useState|useRef|useReducer|useSharedValue|useAnimatedStyle)\b/.test(text)) return 'localState';
  // Generic hook pattern — require call syntax (followed by `(`) or assignment
  // (preceded by `= `) to avoid matching hook-like names in string literals.
  if (/\buse[A-Z]\w*\s*\(/.test(text) || /=\s*use[A-Z]\w*\b/.test(text)) return 'dataHooks';
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
  const topOfBodyConsoleLogs = []; // console.logs at very top of body with no surrounding code
  let pending = []; // comment lines waiting to attach to next statement
  let seenChunkSeparator = false; // have we passed a null (chunk boundary)?
  let i = 0;
  while (i < allLines.length) {
    if (allLines[i] === null) { seenChunkSeparator = true; i++; continue; }
    const trimmed = allLines[i].trim();
    if (trimmed === '') { i++; continue; }

    // Skip old section headers (will be regenerated)
    if (PREAMBLE_HEADER_RE.test(allLines[i])) { i++; continue; }

    // Console.log (active or commented-out) — attach to the following statement
    // so it only moves when the line below it moves. But only if the very next
    // line is code (not a blank line, section header, or chunk separator).
    // If the next line is NOT code, attach to the preceding statement instead
    // so the console.log stays near its original position.
    if (/^\s*(\/\/\s*)?console\.(log|count|warn|error)\b/.test(allLines[i])) {
      const nextLine = i + 1 < allLines.length ? allLines[i + 1] : null;
      const nextIsCode = nextLine !== null && nextLine !== undefined
        && nextLine.trim() !== '' && !PREAMBLE_HEADER_RE.test(nextLine);
      if (nextIsCode) {
        pending.push(allLines[i]);
      } else if (statements.length > 0) {
        // Attach to preceding statement (from any chunk) so it stays in the same section.
        // Also flush any pending console.logs that were waiting for a following line.
        for (const p of pending) statements[statements.length - 1].push(p);
        pending = [];
        statements[statements.length - 1].push(allLines[i]);
      } else if (!seenChunkSeparator) {
        // At very top of body (first chunk, no code seen yet) — keep at top
        // Pending console.logs also stay at top (they were waiting for this line)
        for (const p of pending) topOfBodyConsoleLogs.push([p]);
        pending = [];
        topOfBodyConsoleLogs.push([allLines[i]]);
      } else {
        // In a later section with no preceding statements — treat as regular statement
        if (pending.length > 0) { statements.push(pending); pending = []; }
        statements.push([allLines[i]]);
      }
      i++;
      continue;
    }

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

    // Track bracket depth and backtick state to find end of multi-line statement
    let depth = 0;
    let backtickCount = 0;
    for (const pair of [['{', '}'], ['(', ')'], ['[', ']']]) {
      depth += countBracketsInLine(allLines[i], pair[0], pair[1]).depth;
    }
    for (let ci = 0; ci < allLines[i].length; ci++) {
      if (allLines[i][ci] === '`' && (ci === 0 || allLines[i][ci - 1] !== '\\')) backtickCount++;
    }
    i++;

    while (i < allLines.length) {
      if (allLines[i] === null) break; // Don't span across chunk boundaries
      // Inside unclosed template literal — keep accumulating
      if (backtickCount % 2 !== 0) {
        stmtLines.push(allLines[i]);
        for (const pair of [['{', '}'], ['(', ')'], ['[', ']']]) {
          depth += countBracketsInLine(allLines[i], pair[0], pair[1]).depth;
        }
        for (let ci = 0; ci < allLines[i].length; ci++) {
          if (allLines[i][ci] === '`' && (ci === 0 || allLines[i][ci - 1] !== '\\')) backtickCount++;
        }
        i++;
        continue;
      }
      // Continue if brackets are still open
      if (depth > 0) {
        stmtLines.push(allLines[i]);
        for (const pair of [['{', '}'], ['(', ')'], ['[', ']']]) {
          depth += countBracketsInLine(allLines[i], pair[0], pair[1]).depth;
        }
        for (let ci = 0; ci < allLines[i].length; ci++) {
          if (allLines[i][ci] === '`' && (ci === 0 || allLines[i][ci - 1] !== '\\')) backtickCount++;
        }
        i++;
        continue;
      }
      // Continue if next line starts with a continuation operator (&&, ||, ?., ?, :, ., +, -)
      const nextTrimmed = allLines[i].trim();
      if (/^(&&|\|\||[?.:]|\+\s|-)/.test(nextTrimmed)) {
        stmtLines.push(allLines[i]);
        for (const pair of [['{', '}'], ['(', ')'], ['[', ']']]) {
          depth += countBracketsInLine(allLines[i], pair[0], pair[1]).depth;
        }
        for (let ci = 0; ci < allLines[i].length; ci++) {
          if (allLines[i][ci] === '`' && (ci === 0 || allLines[i][ci - 1] !== '\\')) backtickCount++;
        }
        i++;
        continue;
      }
      break;
    }

    statements.push(stmtLines);
  }

  // Trailing comments become their own statement
  if (pending.length > 0) statements.push(pending);

  return {statements, topOfBodyConsoleLogs};
}

// Extract the hook name (e.g. "useSelector") from a statement, or null
function getHookType(stmtLines) {
  for (const line of stmtLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
    const match = trimmed.match(/\b(use[A-Z]\w*)\b/);
    if (match) return match[1];
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

// Extract all variable names declared by a preamble statement
function getDeclaredVars(stmtLines) {
  const vars = [];
  // Only extract declarations from the top-level indent of the statement,
  // not from inside nested callbacks/arrow functions.
  const firstCodeLine = stmtLines.find(l => {
    const t = l.trim();
    return t && !t.startsWith('//') && !t.startsWith('/*') && !t.startsWith('*');
  });
  const topIndent = firstCodeLine ? firstCodeLine.match(/^(\s*)/)[1].length : 0;
  for (const line of stmtLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
    const lineIndent = line.match(/^(\s*)/)[1].length;
    if (lineIndent > topIndent + 2) continue; // Skip deeply nested lines (inside callbacks)
    // Destructured: const {a, b} = ... or const [a, b] = ...
    const destructM = trimmed.match(/(?:const|let|var)\s+[\[{]([^}\]]+)[}\]]/);
    if (destructM) {
      destructM[1].split(',').forEach(v => {
        const name = v.trim().split(/\s*[:=]\s*/)[0].replace(/\.\.\./g, '').trim();
        if (name && /^\w+$/.test(name)) vars.push(name);
      });
      continue;
    }
    // Simple: const foo = ...
    const simpleM = trimmed.match(/(?:const|let|var)\s+(\w+)/);
    if (simpleM) vars.push(simpleM[1]);
  }
  return vars;
}

// Get the right-hand side text of a statement (everything after the = sign on declaration lines),
// excluding comments. Used to detect references to other variables.
function getRhsText(stmtLines) {
  // Scan ALL lines for references (including inside callbacks) to detect
  // dependencies on variables used in nested scopes.
  const parts = [];
  for (const line of stmtLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
    parts.push(trimmed);
  }
  const text = parts.join(' ');
  // For non-declaration statements (if, for, etc.), use the full text
  // so that all variable references are detected for dependency ordering
  if (!/^\s*(?:const|let|var)\s/.test(text)) return text;
  // Remove everything up to and including the first = (the declaration part)
  const eqIdx = text.indexOf('=');
  return eqIdx !== -1 ? text.slice(eqIdx + 1) : text;
}

// Sort statements alphabetically but ensure declarations come before their usages.
// If statement B references a variable declared in statement A, A must come before B.
function dependencyAwareSort(statements) {
  // First, sort alphabetically
  const sorted = [...statements].sort((a, b) =>
    getPreambleSortKey(a).localeCompare(getPreambleSortKey(b)),
  );
  // Build a map of variable name -> index in sorted array
  const declMap = new Map(); // varName -> stmt index
  for (let i = 0; i < sorted.length; i++) {
    for (const v of getDeclaredVars(sorted[i])) {
      declMap.set(v, i);
    }
  }
  // Repeatedly scan and move dependencies upward until stable
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 100) {
    changed = false;
    iterations++;
    // Rebuild declMap after any reorder
    declMap.clear();
    for (let i = 0; i < sorted.length; i++) {
      for (const v of getDeclaredVars(sorted[i])) {
        declMap.set(v, i);
      }
    }
    for (let i = 0; i < sorted.length; i++) {
      const rhs = getRhsText(sorted[i]);
      for (const [varName, declIdx] of declMap) {
        // If this statement references a variable declared later, move the declaration before this one
        if (declIdx > i && new RegExp('(?<!\\w\\.)\\b' + varName + '\\b').test(rhs)) {
          const [moved] = sorted.splice(declIdx, 1);
          sorted.splice(i, 0, moved);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }
  return sorted;
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
    groups[type] = dependencyAwareSort(groups[type]);
  }
  return sortedTypes.map(type => groups[type]);
}

// Check if a trimmed line starts a top-level function (with or without `export`)
function isTopLevelFuncLine(trimmedLine) {
  const withoutExport = trimmedLine.replace(/^export\s+/, '');
  return isFuncLine(withoutExport);
}

// Get the function name from a top-level line (with or without `export`)
function getTopLevelFuncName(trimmedLine) {
  const withoutExport = trimmedLine.replace(/^export\s+/, '');
  return getFuncName(withoutExport);
}

// Process helper files (files without `export default`) — alphabetize functions
// and ensure all functions are exported as named exports.
function processHelperFile(fullPath, content, file) {
  let lines = content.split('\n');

  // 1. Find where the import/require section ends
  let importEnd = 0;
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*')
      || trimmed.startsWith('*')) {
      i++;
      continue;
    }
    if (trimmed.startsWith('import ') || trimmed.startsWith('import{')) {
      // Track multi-line imports via bracket depth
      let depth = 0;
      for (let j = i; j < lines.length; j++) {
        for (const pair of [['{', '}'], ['(', ')']]) {
          depth += countBracketsInLine(lines[j], pair[0], pair[1]).depth;
        }
        if (lines[j].trim().endsWith(';') || (depth <= 0 && j > i)) {
          importEnd = j + 1;
          i = j + 1;
          break;
        }
      }
      continue;
    }
    if (/^(const|let|var)\s+\w+\s*=\s*require\b/.test(trimmed)) {
      importEnd = i + 1;
      i++;
      continue;
    }
    break;
  }

  // Include trailing blank lines after imports
  while (importEnd < lines.length && lines[importEnd].trim() === '') importEnd++;

  // 2. Parse the rest into preamble chunks and function chunks
  let preambleLines = [];
  let funcChunks = [];
  i = importEnd;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed === '') { i++; continue; }

    // Skip old section headers
    if (PREAMBLE_HEADER_RE.test(lines[i])) { i++; continue; }

    // Check if this line starts a function (with or without `export`)
    const withoutExportTrimmed = trimmed.replace(/^export\s+/, '');
    if (isTopLevelFuncLine(trimmed)
      && !(FUNC_PATTERNS.constArrow.test(withoutExportTrimmed) && !isArrowAfterParams(lines, i))) {
      // Collect preceding comment lines
      let commentStart = i;
      while (commentStart > importEnd
        && commentStart > 0
        && lines[commentStart - 1].trim() !== ''
        && (lines[commentStart - 1].trim().startsWith('//')
          || lines[commentStart - 1].trim().startsWith('/*')
          || lines[commentStart - 1].trim().startsWith('*'))) {
        commentStart--;
      }
      // Remove those comment lines from preamble if they were added there
      while (preambleLines.length > 0
        && (preambleLines[preambleLines.length - 1].trim().startsWith('//')
          || preambleLines[preambleLines.length - 1].trim().startsWith('/*')
          || preambleLines[preambleLines.length - 1].trim().startsWith('*'))) {
        preambleLines.pop();
      }

      const funcName = getTopLevelFuncName(trimmed);
      const hasExport = trimmed.startsWith('export ');

      // Find the end of the function via bracket tracking
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
        let trackOpen = '{';
        let trackClose = '}';
        let scanStartLine = i;
        let scanStartCol = 0;

        const lineWithoutExport = trimmed.replace(/^export\s+/, '');
        const isArrowFunc = FUNC_PATTERNS.constArrow.test(lineWithoutExport)
          || FUNC_PATTERNS.singleParamArrow.test(lineWithoutExport);

        let isExpressionBody = false;
        if (isArrowFunc) {
          for (let j = i; j < lines.length; j++) {
            const arrowIdx = lines[j].indexOf('=>');
            if (arrowIdx >= 0) {
              scanStartLine = j;
              scanStartCol = arrowIdx + 2;
              const afterArrow = lines[j].substring(arrowIdx + 2).trim();
              if (afterArrow.startsWith('(')) {
                trackOpen = '(';
                trackClose = ')';
              } else if (afterArrow.startsWith('{')) {
                // block body, use default { } tracking
              } else if (afterArrow === '') {
                for (let k = j + 1; k < lines.length; k++) {
                  const nt = lines[k].trim();
                  if (nt === '') continue;
                  if (nt.startsWith('(')) {
                    trackOpen = '(';
                    trackClose = ')';
                  } else if (!nt.startsWith('{')) {
                    isExpressionBody = true;
                  }
                  break;
                }
              } else {
                isExpressionBody = true;
              }
              break;
            }
          }
        }

        if (isExpressionBody) {
          for (let j = i; j < lines.length; j++) {
            if (lines[j].trim().endsWith(';')) {
              funcEnd = j;
              break;
            }
          }
        } else {
          let depth = 0;
          let foundOpen = false;
          let templateState = false;
          for (let j = scanStartLine; j < lines.length; j++) {
            const startCol = (j === scanStartLine) ? scanStartCol : 0;
            const scan = countBracketsInLine(lines[j], trackOpen, trackClose, startCol, templateState);
            depth += scan.depth;
            templateState = scan.inTemplate;
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
            for (let j = i; j < lines.length; j++) {
              if (lines[j].trim().endsWith(';')) {
                funcEnd = j;
                break;
              }
            }
          }
        }
      }

      let chunkLines = [];
      for (let j = commentStart; j <= funcEnd; j++) {
        chunkLines.push(lines[j]);
      }

      funcChunks.push({name: funcName, lines: chunkLines, hasExport});
      i = funcEnd + 1;
    } else {
      // Check if this is a comment that precedes a function (look ahead)
      if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        let lookAhead = i + 1;
        while (lookAhead < lines.length && (lines[lookAhead].trim().startsWith('//')
          || lines[lookAhead].trim().startsWith('/*')
          || lines[lookAhead].trim().startsWith('*')
          || lines[lookAhead].trim() === '')) {
          lookAhead++;
        }
        const laWithoutExport = lookAhead < lines.length ? lines[lookAhead].trim().replace(/^export\s+/, '') : '';
        if (lookAhead < lines.length && isTopLevelFuncLine(lines[lookAhead].trim())
          && !(FUNC_PATTERNS.constArrow.test(laWithoutExport) && !isArrowAfterParams(lines, lookAhead))) {
          // This comment belongs to a function; skip and let the function parser grab it
          preambleLines.push(lines[i]);
          i++;
          continue;
        }
      }

      // Non-function line — add to preamble
      preambleLines.push(lines[i]);
      i++;
    }
  }

  if (funcChunks.length === 0) return false;

  // 3. Move functions referenced by preamble code back into preamble
  // (e.g. `const persistedReducer = persistReducer(persistConfig, rootReducer);`
  // needs rootReducer to be defined before it)
  const preambleText = preambleLines.join('\n');
  for (let fi = funcChunks.length - 1; fi >= 0; fi--) {
    const funcName = funcChunks[fi].name;
    if (funcName && new RegExp('\\b' + funcName + '\\b').test(preambleText)) {
      for (const line of funcChunks[fi].lines) preambleLines.push(line);
      preambleLines.push('');
      funcChunks.splice(fi, 1);
    }
  }
  if (funcChunks.length === 0) return false;

  // 4. Separate into internal (non-exported) and exported function groups
  const internalFuncs = funcChunks.filter(c => !c.hasExport);
  const exportedFuncs = funcChunks.filter(c => c.hasExport);

  // Sort each group alphabetically
  internalFuncs.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  exportedFuncs.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  const hasBothGroups = internalFuncs.length > 0 && exportedFuncs.length > 0;

  // 4. Reassemble the file
  let newLines = lines.slice(0, importEnd);

  // Add preamble (non-function declarations)
  // Strip trailing blank lines from preamble
  while (preambleLines.length > 0 && preambleLines[preambleLines.length - 1].trim() === '') {
    preambleLines.pop();
  }
  if (preambleLines.length > 0) {
    for (const line of preambleLines) newLines.push(line);
    newLines.push('');
  }

  // Add internal functions
  if (internalFuncs.length > 0) {
    if (hasBothGroups) {
      newLines.push('/* Internal Functions */');
      newLines.push('');
    }
    for (let f = 0; f < internalFuncs.length; f++) {
      if (f > 0) newLines.push('');
      for (const line of internalFuncs[f].lines) newLines.push(line);
    }
  }

  // Add exported functions
  if (exportedFuncs.length > 0) {
    if (hasBothGroups) {
      if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') newLines.push('');
      newLines.push('/* Exported Functions */');
      newLines.push('');
    }
    for (let f = 0; f < exportedFuncs.length; f++) {
      if (f > 0) newLines.push('');
      for (const line of exportedFuncs[f].lines) newLines.push(line);
    }
  }

  // Ensure file ends with newline
  if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
    newLines.push('');
  }

  // Merge blank lines: preserve original spacing around unmoved content
  const oldPostImport = lines.slice(importEnd);
  const newPostImport = newLines.slice(importEnd);
  const mergedPostImport = mergeBlankLines(oldPostImport, newPostImport);
  newLines = [...lines.slice(0, importEnd), ...mergedPostImport];
  // Ensure trailing newline
  if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
    newLines.push('');
  }

  const newContent = newLines.join('\n');
  if (newContent !== content) {
    // Skip if the only difference is blank line spacing
    const oldNonBlank = content.split('\n').filter(l => l.trim() !== '').join('\n');
    const newNonBlank = newContent.split('\n').filter(l => l.trim() !== '').join('\n');
    if (oldNonBlank !== newNonBlank) {
      fs.writeFileSync(fullPath, newContent, 'utf8');
      return true;
    }
  }
  return false;
}

let totalReturnChanges = 0;
let totalFuncChanges = 0;
let changedFiles = [];

for (const file of files) {
  const fullPath = path.join(ROOT, file);
  const content = fs.readFileSync(fullPath, 'utf8').replace(/\r\n/g, '\n');

  if (!/export default\b/.test(content)) {
    if (processHelperFile(fullPath, content, file)) {
      changedFiles.push({file, returnChanges: 0, funcChanges: 1});
      totalFuncChanges++;
    }
    continue;
  }

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

  // === PART 1: Sort return block properties (hooks only) ===
  // Components return JSX, not plain objects, so skip return-block sorting for them.
  let returnBlocks = [];
  if (isHook) for (let i = 0; i < lines.length; i++) {
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

        // Group continuation lines with their property line.
        // A new property starts with an identifier (e.g. `propName,` or `propName:`)
        // or a spread (`...`). Lines that don't match are continuations of the
        // previous property (e.g. the second line of a ternary).
        const propGroups = []; // each entry is an array of lines
        for (const line of propLines) {
          const t = line.trim();
          const isNewProp = /^[a-zA-Z_$]/.test(t) || t.startsWith('...');
          if (isNewProp || propGroups.length === 0) {
            propGroups.push([line]);
          } else {
            propGroups[propGroups.length - 1].push(line);
          }
        }

        // Sort groups by the property name on the first line
        const sortedGroups = [...propGroups].sort((a, b) => {
          const nameA = a[0].trim().replace(/^\.\.\./, '').split(/[^a-zA-Z0-9_]/)[0].toLowerCase();
          const nameB = b[0].trim().replace(/^\.\.\./, '').split(/[^a-zA-Z0-9_]/)[0].toLowerCase();
          return nameA.localeCompare(nameB);
        });

        // Flatten back to lines
        const sorted = sortedGroups.flat();

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
      // Skip past the parameter list before looking for the body `{`.
      // This avoids matching `{` inside destructured params like ({prop1, prop2}).
      let parenDepth = 0;
      let pastParams = false;
      for (let j = i; j < lines.length; j++) {
        for (let ci = 0; ci < lines[j].length; ci++) {
          if (lines[j][ci] === '(') parenDepth++;
          if (lines[j][ci] === ')') {
            parenDepth--;
            if (parenDepth === 0) pastParams = true;
          }
          // Only match body `{` after we've closed the parameter list
          if (pastParams && lines[j][ci] === '{') {
            bodyStart = j + 1;
            break;
          }
        }
        if (bodyStart >= 0) break;
      }
      break;
    }
  }

  if (bodyStart < 0) continue;

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
      if (lookAhead < returnStart && isFuncLine(lines[lookAhead].trim())
        && !(FUNC_PATTERNS.constArrow.test(lines[lookAhead].trim()) && !isArrowAfterParams(lines, lookAhead))) {
        i++;
        continue;
      }
    }

    if (isFuncLine(trimmed)
      && !(FUNC_PATTERNS.constArrow.test(trimmed) && !isArrowAfterParams(lines, i))) {
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

        let isExpressionBody = false;
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
              } else if (afterArrow.startsWith('{')) {
                // block body, use default { } tracking
              } else if (afterArrow === '') {
                for (let k = j + 1; k < returnStart; k++) {
                  const nt = lines[k].trim();
                  if (nt === '') continue;
                  if (nt.startsWith('(')) {
                    trackOpen = '(';
                    trackClose = ')';
                  } else if (!nt.startsWith('{')) {
                    isExpressionBody = true;
                  }
                  break;
                }
              } else {
                isExpressionBody = true;
              }
              break;
            }
          }
        }

        if (isExpressionBody) {
          for (let j = i; j < returnStart; j++) {
            if (lines[j].trim().endsWith(';')) {
              funcEnd = j;
              break;
            }
          }
        } else {
          let templateState2 = false;
          for (let j = scanStartLine; j < returnStart; j++) {
            const startCol = (j === scanStartLine) ? scanStartCol : 0;
            const scan = countBracketsInLine(lines[j], trackOpen, trackClose, startCol, templateState2);
            depth += scan.depth;
            templateState2 = scan.inTemplate;
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
      // Track bracket depth so blank lines inside nested blocks don't break the statement
      let blockDepth = 0;
      for (const pair of [['{', '}'], ['(', ')'], ['[', ']']]) {
        blockDepth += countBracketsInLine(lines[i], pair[0], pair[1]).depth;
      }
      while (blockEnd + 1 < returnStart) {
        const nextTrimmed = lines[blockEnd + 1].trim();
        if (nextTrimmed === '' && blockDepth <= 0) break;
        if (isFuncLine(nextTrimmed)
          && !(FUNC_PATTERNS.constArrow.test(nextTrimmed) && !isArrowAfterParams(lines, blockEnd + 1))) break;
        if (nextTrimmed.startsWith('//') || nextTrimmed.startsWith('/*')) {
          let lookAhead = blockEnd + 2;
          while (lookAhead < returnStart && (lines[lookAhead].trim().startsWith('//')
            || lines[lookAhead].trim().startsWith('*')
            || lines[lookAhead].trim() === '')) {
            lookAhead++;
          }
          if (lookAhead < returnStart && isFuncLine(lines[lookAhead].trim())
            && !(FUNC_PATTERNS.constArrow.test(lines[lookAhead].trim()) && !isArrowAfterParams(lines, lookAhead))) break;
        }
        blockEnd++;
        for (const pair of [['{', '}'], ['(', ')'], ['[', ']']]) {
          blockDepth += countBracketsInLine(lines[blockEnd], pair[0], pair[1]).depth;
        }
      }

      let chunkLines = [];
      for (let j = blockStart; j <= blockEnd; j++) {
        chunkLines.push(lines[j]);
      }

      // Classify: control flow at body indent level → preReturn (stays near View/return)
      const firstCodeLine = chunkLines.find(l => {
        const t = l.trim();
        return t && !t.startsWith('//') && !t.startsWith('/*') && !t.startsWith('*');
      });
      const firstCodeIndent = firstCodeLine ? firstCodeLine.match(/^(\s*)/)[1] : '';
      const isControlFlow = firstCodeLine
        && firstCodeIndent === bodyIndent
        && /^(if|switch|for|while|throw|try|return)\b/.test(firstCodeLine.trim());
      chunks.push({type: isControlFlow ? 'preReturn' : 'other', name: '', lines: chunkLines});
      i = blockEnd + 1;
    }
  }


  // Detect indentation from existing functions
  const firstFunc = chunks.find(c => c.type === 'function');
  const indent = firstFunc ? firstFunc.lines[0].match(/^(\s*)/)[1] : '  ';

  // Separate into non-function preamble, internal functions, exported functions, and preReturn
  let preambleChunks = [];
  let internalFuncs = [];
  let exportedFuncs = [];
  let preReturnChunks = [];
  let seenFunction = false;

  for (const chunk of chunks) {
    if (chunk.type === 'function') {
      seenFunction = true;
      if (chunk.isExported) {
        exportedFuncs.push(chunk);
      } else {
        internalFuncs.push(chunk);
      }
    } else if (chunk.type === 'preReturn') {
      preReturnChunks.push(chunk);
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

  // Only skip if there's nothing to organize (no functions and no preamble)
  if (internalFuncs.length === 0 && exportedFuncs.length === 0 && preambleChunks.length === 0) continue;

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
  const {statements: preambleStatements, topOfBodyConsoleLogs} = parsePreambleStatements(preambleChunks, indent);
  const preambleGroups = {};
  for (const cat of PREAMBLE_CATEGORIES) preambleGroups[cat] = [];

  for (const stmt of preambleStatements) {
    const cat = categorizePreambleStatement(stmt);
    preambleGroups[cat].push(stmt);
  }

  // Cross-category dependency resolution: if a statement in an earlier category
  // references a variable declared in a later category, move that declaration up.
  for (let ci = 0; ci < PREAMBLE_CATEGORIES.length; ci++) {
    const cat = PREAMBLE_CATEGORIES[ci];
    for (const stmt of preambleGroups[cat]) {
      const rhs = getRhsText(stmt);
      for (let cj = ci + 1; cj < PREAMBLE_CATEGORIES.length; cj++) {
        const laterCat = PREAMBLE_CATEGORIES[cj];
        for (let si = preambleGroups[laterCat].length - 1; si >= 0; si--) {
          const laterStmt = preambleGroups[laterCat][si];
          const declVars = getDeclaredVars(laterStmt);
          if (declVars.some(v => new RegExp('(?<!\\w\\.)\\b' + v + '\\b').test(rhs))) {
            preambleGroups[laterCat].splice(si, 1);
            preambleGroups[cat].push(laterStmt);
          }
        }
      }
    }
  }

  // Build new body
  let newBodyLines = [];

  // Console.logs that were at the very top of the body (before any sections/code)
  // stay at the top — they are not moved into any preamble section.
  if (topOfBodyConsoleLogs.length > 0) {
    for (const stmt of topOfBodyConsoleLogs) {
      for (const line of stmt) newBodyLines.push(line);
    }
  }

  // Preamble sections
  for (const cat of PREAMBLE_CATEGORIES) {
    if (preambleGroups[cat].length === 0) continue;
    if (newBodyLines.length > 0 && newBodyLines[newBodyLines.length - 1].trim() !== '') {
      newBodyLines.push('');
    }
    newBodyLines.push(`${indent}/* ${PREAMBLE_HEADERS[cat]} */`);
    newBodyLines.push('');

    // Data Hooks: sub-group by tier (external → custom hooks),
    // then by hook type within each tier, alphabetized, then fix cross-group dependencies
    if (cat === 'dataHooks') {
      const tiers = [[], []];
      for (const stmt of preambleGroups[cat]) {
        tiers[getDataHooksTier(stmt)].push(stmt);
      }
      // Flatten tiers into ordered list
      const flatOrdered = [];
      for (let t = 0; t < tiers.length; t++) {
        if (tiers[t].length === 0) continue;
        const subGroups = subGroupAndSort(tiers[t]);
        for (const group of subGroups) flatOrdered.push(...group);
      }
      // Fix cross-group dependencies
      let moved = true;
      while (moved) {
        moved = false;
        const declPositions = new Map();
        for (let i = 0; i < flatOrdered.length; i++) {
          for (const v of getDeclaredVars(flatOrdered[i])) declPositions.set(v, i);
        }
        for (let i = 0; i < flatOrdered.length; i++) {
          const rhs = getRhsText(flatOrdered[i]);
          for (const [varName, declIdx] of declPositions) {
            if (declIdx > i && new RegExp('(?<!\\w\\.)\\b' + varName + '\\b').test(rhs)) {
              const [dep] = flatOrdered.splice(declIdx, 1);
              flatOrdered.splice(i, 0, dep);
              moved = true;
              break;
            }
          }
          if (moved) break;
        }
      }
      // Re-detect group boundaries for blank line insertion (tier change or hook type change)
      let prevTier = null;
      for (const stmt of flatOrdered) {
        const tier = getDataHooksTier(stmt);
        if (prevTier !== null && tier !== prevTier
          && newBodyLines.length > 0 && newBodyLines[newBodyLines.length - 1].trim() !== '') {
          newBodyLines.push('');
        }
        prevTier = tier;
        for (const line of stmt) newBodyLines.push(line);
      }
    } else if (cat === 'localState') {
      // Local State: sub-group by hook type, alphabetized, then fix cross-group dependencies
      const subGroups = subGroupAndSort(preambleGroups[cat]);
      // Check for cross-group dependencies: if a statement in an earlier group
      // references a variable declared in a later group, move that declaration
      // before the referencing group.
      const flatOrdered = [];
      for (const group of subGroups) flatOrdered.push(...group);
      // Build declaration map
      const declPositions = new Map();
      for (let i = 0; i < flatOrdered.length; i++) {
        for (const v of getDeclaredVars(flatOrdered[i])) declPositions.set(v, i);
      }
      // Move dependencies: scan for references to later-declared variables
      let moved = true;
      while (moved) {
        moved = false;
        declPositions.clear();
        for (let i = 0; i < flatOrdered.length; i++) {
          for (const v of getDeclaredVars(flatOrdered[i])) declPositions.set(v, i);
        }
        for (let i = 0; i < flatOrdered.length; i++) {
          const rhs = getRhsText(flatOrdered[i]);
          for (const [varName, declIdx] of declPositions) {
            if (declIdx > i && new RegExp('(?<!\\w\\.)\\b' + varName + '\\b').test(rhs)) {
              const [dep] = flatOrdered.splice(declIdx, 1);
              flatOrdered.splice(i, 0, dep);
              moved = true;
              break;
            }
          }
          if (moved) break;
        }
      }
      // Re-build sub-groups from the reordered list
      const reGrouped = [];
      let currentGroup = [];
      let currentHookType = null;
      for (const stmt of flatOrdered) {
        const hookType = (getHookType(stmt) || 'zzz_other').toLowerCase();
        if (currentHookType !== null && hookType !== currentHookType) {
          if (currentGroup.length > 0) reGrouped.push(currentGroup);
          currentGroup = [];
        }
        currentHookType = hookType;
        currentGroup.push(stmt);
      }
      if (currentGroup.length > 0) reGrouped.push(currentGroup);
      let firstGroup = true;
      for (let g = 0; g < reGrouped.length; g++) {
        if (!firstGroup && newBodyLines.length > 0 && newBodyLines[newBodyLines.length - 1].trim() !== '') {
          newBodyLines.push('');
        }
        firstGroup = false;
        for (const stmt of reGrouped[g]) {
          for (const line of stmt) newBodyLines.push(line);
        }
      }
    } else if (cat === 'derivedVars') {
      // Derived Variables: alphabetize by variable name, keeping declarations before usages
      const sorted = dependencyAwareSort(preambleGroups[cat]);
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

  // Emit preReturn chunks (control flow at body indent level) before the return
  for (const chunk of preReturnChunks) {
    for (const line of chunk.lines) newBodyLines.push(line);
    if (newBodyLines.length > 0 && newBodyLines[newBodyLines.length - 1].trim() !== '') {
      newBodyLines.push('');
    }
  }

  // Compare with old body
  let oldBodyLines = lines.slice(bodyStart, returnStart);
  while (oldBodyLines.length > 0 && oldBodyLines[oldBodyLines.length - 1].trim() === '') oldBodyLines.pop();
  let newBodyTrimmed = [...newBodyLines];
  while (newBodyTrimmed.length > 0 && newBodyTrimmed[newBodyTrimmed.length - 1].trim() === '') newBodyTrimmed.pop();

  if (oldBodyLines.join('\n') !== newBodyTrimmed.join('\n')) {
    // Skip if the only difference is blank line spacing
    const oldNonBlank = oldBodyLines.filter(l => l.trim() !== '').join('\n');
    const newNonBlank = newBodyTrimmed.filter(l => l.trim() !== '').join('\n');
    if (oldNonBlank !== newNonBlank) {
      const mergedBody = mergeBlankLines(oldBodyLines, newBodyTrimmed);
      // Ensure trailing blank line before return
      if (mergedBody.length > 0 && mergedBody[mergedBody.length - 1].trim() !== '') {
        mergedBody.push('');
      }
      let finalLines = [
        ...lines.slice(0, bodyStart),
        ...mergedBody,
        ...lines.slice(returnStart),
      ];
      lines = finalLines;
      fileFuncChanges++;
    }
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
