(function (root) {
  var R = 4, W = 2, X = 1;
  function parseOctal(s) {
    if (typeof s !== 'string') return null;
    var t = s.trim();
    if (!/^[0-7]{1,4}$/.test(t)) return null;
    return parseInt(t, 8);
  }
  function octal(m, pad) { var s = (m & 4095).toString(8); while (s.length < (pad || 3)) s = '0' + s; return s; }
  function triad(bits, special, ch, upper) {
    return ((bits & 4) ? 'r' : '-') + ((bits & 2) ? 'w' : '-') + (special ? ((bits & 1) ? ch : upper) : ((bits & 1) ? 'x' : '-'));
  }
  // ls -l style 9 characters
  function symbolic(m) {
    return triad((m >> 6) & 7, m & 2048, 's', 'S') + triad((m >> 3) & 7, m & 1024, 's', 'S') + triad(m & 7, m & 512, 't', 'T');
  }
  // 9 characters (as printed by ls -l, without the type character) -> mode
  function fromSymbolic(s) {
    if (typeof s !== 'string') return null;
    var t = s.trim().replace(/^[-dlcbps]/, function (c, i) { return s.trim().length === 10 ? '' : c; });
    if (t.length !== 9) return null;
    var m = 0, i, c;
    var ok = [['r-', 4], ['w-', 2]];
    for (var g = 0; g < 3; g++) {
      var r = t.charAt(g * 3), w = t.charAt(g * 3 + 1), x = t.charAt(g * 3 + 2), bits = 0;
      if (r === 'r') bits |= 4; else if (r !== '-') return null;
      if (w === 'w') bits |= 2; else if (w !== '-') return null;
      if (x === 'x') bits |= 1;
      else if (x === '-') { }
      else if (g < 2 && (x === 's' || x === 'S')) { m |= g === 0 ? 2048 : 1024; if (x === 's') bits |= 1; }
      else if (g === 2 && (x === 't' || x === 'T')) { m |= 512; if (x === 't') bits |= 1; }
      else return null;
      m |= bits << (6 - g * 3);
    }
    return m;
  }
  // apply a GNU-style symbolic mode ("u+x,go-w", "a=rx", "g=u", "+t") to mode m. isDir affects X. umask: number.
  function apply(m, expr, isDir, umask) {
    if (typeof expr !== 'string' || expr.trim() === '') return { error: 'Enter a mode such as u+x,g-w or 755.' };
    var oct = parseOctal(expr);
    if (oct !== null) return { mode: oct };
    var cur = m, clauses = expr.trim().split(',');
    umask = umask || 0;
    for (var ci = 0; ci < clauses.length; ci++) {
      var cl = clauses[ci], mm = /^([ugoa]*)(([-+=])([rwxXstugo]*))+$/.exec(cl);
      if (!mm) return { error: 'Cannot read "' + cl + '". Use who (u g o a), an operator (+ - =) and permissions (r w x X s t).' };
      var who = /^[ugoa]*/.exec(cl)[0], rest = cl.slice(who.length), explicitWho = who !== '';
      var affected = 0;
      if (!explicitWho) affected = 4095 & ~(umask & 511); else for (var wi = 0; wi < who.length; wi++) { var w = who.charAt(wi); affected |= w === 'u' ? (2048 | 448) : w === 'g' ? (1024 | 56) : w === 'o' ? 7 : 4095; }
      var re = /([-+=])([rwxXstugo]*)/g, op;
      while ((op = re.exec(rest)) !== null) {
        var oper = op[1], perms = op[2], bits = 0, copy = false;
        for (var pi = 0; pi < perms.length; pi++) {
          var p = perms.charAt(pi);
          if (p === 'u' || p === 'g' || p === 'o') {
            if (perms.length !== 1) return { error: 'A copy like g=u must be the only permission in its part.' };
            copy = true; var src = p === 'u' ? (cur >> 6) & 7 : p === 'g' ? (cur >> 3) & 7 : cur & 7; bits = src * 73;
          } else if (p === 'r') bits |= 292; else if (p === 'w') bits |= 146; else if (p === 'x') bits |= 73;
          else if (p === 'X') { if (isDir || (cur & 73)) bits |= 73; }
          else if (p === 's') bits |= 3072; else if (p === 't') bits |= 512;
        }
        var aff = affected;
        if (explicitWho && /[oa]/.test(who)) aff |= 512;
        var mask = copy ? aff & 511 : aff;
        var applied = bits & mask;
        if (oper === '+') cur |= applied; else if (oper === '-') cur &= ~applied; else {
          var clr = explicitWho ? aff : 4095;
          if (isDir && perms.indexOf('s') < 0) clr &= ~3072;
          cur = (cur & ~clr) | applied;
        }
      }
    }
    return { mode: cur & 4095 };
  }
  function umaskResult(um) { return { file: 438 & ~um & 511, dir: 511 & ~um & 511 }; }
  var api = { parseOctal: parseOctal, octal: octal, symbolic: symbolic, fromSymbolic: fromSymbolic, apply: apply, umaskResult: umaskResult };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ChmodLens = api;
})(typeof window !== 'undefined' ? window : this);
