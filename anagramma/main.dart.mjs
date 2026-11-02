// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      AD: x0 => x0.tabIndex,
      AE: (x0,x1) => x0.getComputedStyle(x1),
      AF: x0 => x0.pressure,
      AG: (x0,x1) => x0.go(x1),
      AH: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      AI: () => new WeakMap(),
      AJ: (x0,x1) => { x0.min = x1 },
      B: s => printToConsole(s),
      BB: x0 => new Uint16Array(x0),
      BC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      BD: (x0,x1) => x0.contains(x1),
      BE: x0 => x0.documentElement,
      BF: x0 => x0.tiltY,
      BG: x0 => x0.parentElement,
      BH: x0 => x0.readText(),
      BI: x0 => new WeakRef(x0),
      BJ: (x0,x1) => { x0.max = x1 },
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: x0 => new Int32Array(x0),
      CC: (x0,x1) => x0.querySelector(x1),
      CD: x0 => x0.activeElement,
      CE: x0 => x0.computedStyleMap(),
      CF: x0 => x0.tiltX,
      CG: (x0,x1) => x0.querySelectorAll(x1),
      CH: x0 => x0.clipboard,
      CI: x0 => x0.deref(),
      CJ: (x0,x1) => { x0.disabled = x1 },
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      DC: (x0,x1) => x0.item(x1),
      DD: x0 => x0.parentNode,
      DE: (x0,x1) => x0.get(x1),
      DF: x0 => x0.pointerType,
      DG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      DH: (x0,x1) => x0.writeText(x1),
      DI: () => globalThis.WeakRef,
      DJ: (x0,x1) => { x0.scrollLeft = x1 },
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: x0 => new Uint32Array(x0),
      EC: x0 => x0.length,
      ED: x0 => x0.tagName,
      EE: (o, p) => p in o,
      EF: x0 => x0.pointerId,
      EG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      EH: x0 => x0.unlock(),
      EI: (a, i) => a.splice(i, 1),
      EJ: (x0,x1) => { x0.spellcheck = x1 },
      F: () => new Error().stack,
      FB: x0 => new Float32Array(x0),
      FC: (x0,x1) => x0.querySelectorAll(x1),
      FD: x0 => x0.target,
      FE: (x0,x1) => { x0.textContent = x1 },
      FF: x0 => x0.getCoalescedEvents(),
      FG: (x0,x1) => x0.requestAnimationFrame(x1),
      FH: (x0,x1) => x0.lock(x1),
      FI: a => a.pop(),
      FJ: (x0,x1) => { x0.disabled = x1 },
      G: s => JSON.stringify(s),
      GB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      GC: (x0,x1) => x0.getAttribute(x1),
      GD: x0 => x0.clientY,
      GE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      GF: (x0,x1) => x0.getModifierState(x1),
      GG: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      GH: x0 => x0.orientation,
      GI: (map, o, v) => map.set(o, v),
      GJ: (x0,x1) => x0.transferFromImageBitmap(x1),
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: x0 => new Float64Array(x0),
      HC: x0 => x0.remove(),
      HD: x0 => x0.clientX,
      HE: x0 => x0.matches,
      HF: s => s.trimLeft(),
      HG: x0 => x0.now(),
      HH: (x0,x1) => x0.querySelector(x1),
      HI: (x0,x1) => x0.vibrate(x1),
      HJ: (x0,x1) => x0.getContext(x1),
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      IC: (x0,x1) => x0.appendChild(x1),
      ID: (x0,x1,x2) => x0.setAttribute(x1,x2),
      IE: (x0,x1) => x0.matchMedia(x1),
      IF: s => s.toUpperCase(),
      IG: x0 => x0.performance,
      IH: (x0,x1) => { x0.title = x1 },
      II: x0 => x0.navigator,
      IJ: (x0,x1) => { x0.height = x1 },
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: x0 => new ArrayBuffer(x0),
      JC: (x0,x1) => x0.append(x1),
      JD: x0 => x0.getBoundingClientRect(),
      JE: x0 => x0.matches,
      JF: (x0,x1) => x0.test(x1),
      JG: (d, digits) => d.toFixed(digits),
      JH: (x0,x1) => x0.vibrate(x1),
      JI: () => globalThis.window,
      JJ: (x0,x1) => { x0.width = x1 },
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      KC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      KD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      KE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      KF: (x0,x1) => x0[x1],
      KG: x0 => x0.maxHeight,
      KH: x0 => x0.arrayBuffer(),
      KI: x0 => x0.resume(),
      KJ: x0 => x0.height,
      L: o => o === undefined,
      LB: (x0,x1,x2) => new DataView(x0,x1,x2),
      LC: x0 => x0.style,
      LD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      LE: f => f.dartFunction,
      LF: x0 => x0.index,
      LG: x0 => x0.maxWidth,
      LH: x0 => x0.status,
      LI: x0 => x0.createBufferSource(),
      LJ: x0 => x0.width,
      M: o => String(o),
      MB: (o, p) => o[p],
      MC: x0 => x0.debugShowSemanticsNodes,
      MD: Date.now,
      ME: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      MF: x0 => x0.pop(),
      MG: x0 => x0.minHeight,
      MH: (x0,x1) => x0.fetch(x1),
      MI: (x0,x1) => x0.connect(x1),
      MJ: x0 => x0.rasterEndMilliseconds,
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      NC: o => o,
      ND: (handle) => clearTimeout(handle),
      NE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      NF: x0 => x0.flags,
      NG: x0 => x0.minWidth,
      NH: x0 => x0.content,
      NI: x0 => x0.start(),
      NJ: x0 => x0.rasterStartMilliseconds,
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      OC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      OD: (x0,x1) => x0.closest(x1),
      OE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      OF: (a, s) => a.join(s),
      OG: (x0,x1) => x0.removeProperty(x1),
      OH: x0 => x0.document,
      OI: x0 => x0.destination,
      OJ: x0 => x0.imageBitmaps,
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: o => o.byteOffset,
      PC: (x0,x1) => x0.warn(x1),
      PD: x0 => x0.bottom,
      PE: (o, i) => o[i],
      PF: (x0,x1) => x0.error(x1),
      PG: (x0,x1) => x0.add(x1),
      PH: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      PI: (x0,x1) => { x0.value = x1 },
      PJ: x0 => x0.canvasKitMaximumSurfaces,
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.buffer,
      QC: x0 => x0.console,
      QD: x0 => x0.top,
      QE: o => o.length,
      QF: () => globalThis.console,
      QG: x0 => x0.data,
      QH: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      QI: x0 => x0.playbackRate,
      QJ: x0 => x0.hostElement,
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: Function.prototype.call.bind(DataView.prototype.getUint8),
      RC: () => globalThis.window,
      RD: x0 => x0.right,
      RE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      RF: s => s.trimRight(),
      RG: (x0,x1) => { x0.scrollTop = x1 },
      RH: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      RI: (x0,x1) => { x0.buffer = x1 },
      RJ: x0 => x0.location,
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: (b, o) => new DataView(b, o),
      SC: (o, c) => o instanceof c,
      SD: x0 => x0.left,
      SE: x0 => x0.language,
      SF: x0 => x0.blur(),
      SG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      SH: () => typeof dartUseDateNowForTicks !== "undefined",
      SI: x0 => x0.state,
      SJ: (x0,x1) => x0.getModifierState(x1),
      T: x0 => new Promise(x0),
      TB: (b, o, l) => new DataView(b, o, l),
      TC: (x0,x1) => x0.exec(x1),
      TD: x0 => x0.clientY,
      TE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      TF: x0 => x0.button,
      TG: (x0,x1) => { x0.value = x1 },
      TH: () => Date.now(),
      TI: (x0,x1) => x0.fetch(x1),
      TJ: x0 => x0.metaKey,
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      UC: x0 => x0.length,
      UD: x0 => x0.clientX,
      UE: () => globalThis.window.FinalizationRegistry,
      UF: x0 => x0.innerHeight,
      UG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      UH: () => 1000 * performance.now(),
      UI: x0 => x0.text(),
      UJ: x0 => x0.altKey,
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      VC: (x0,x1) => { x0.lastIndex = x1 },
      VD: x0 => x0.changedTouches,
      VE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      VF: x0 => x0.innerWidth,
      VG: (x0,x1) => { x0.value = x1 },
      VH: x0 => new Uint8Array(x0),
      VI: x0 => x0.status,
      VJ: x0 => x0.ctrlKey,
      W: x0 => new Array(x0),
      WB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      WC: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      WD: x0 => x0.offsetY,
      WE: x0 => new window.FinalizationRegistry(x0),
      WF: x0 => x0.height,
      WG: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      WH: (x0,x1,x2) => x0.slice(x1,x2),
      WI: x0 => x0.ok,
      WJ: x0 => x0.isComposing,
      X: o => [o],
      XB: (t, s) => t.set(s),
      XC: o => o instanceof RegExp,
      XD: x0 => x0.offsetX,
      XE: (x0,x1) => x0.unregister(x1),
      XF: x0 => x0.width,
      XG: x0 => x0.value,
      XH: (x0,x1) => x0.decode(x1),
      XI: x0 => ({text: x0}),
      XJ: x0 => x0.code,
      Y: (o0, o1) => [o0, o1],
      YB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      YC: (string, times) => string.repeat(times),
      YD: x0 => x0.type,
      YE: (x0,x1) => x0.contains(x1),
      YF: x0 => x0.clientHeight,
      YG: x0 => x0.selectionDirection,
      YH: (x0,x1) => x0.adoptText(x1),
      YI: (x0,x1) => x0.share(x1),
      YJ: x0 => x0.repeat,
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      ZC: x0 => x0.dotAll,
      ZD: x0 => x0.maxTouchPoints,
      ZE: (s) => +s,
      ZF: x0 => x0.clientWidth,
      ZG: x0 => x0.selectionStart,
      ZH: x0 => x0.first(),
      ZI: x0 => x0.now(),
      ZJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      aC: x0 => x0.unicode,
      aD: x0 => x0.platform,
      aE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      aF: (x0,x1) => { x0.content = x1 },
      aG: x0 => x0.selectionEnd,
      aH: x0 => x0.next(),
      aI: x0 => x0.performance,
      aJ: x0 => x0.userAgent,
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: Function.prototype.call.bind(DataView.prototype.getUint32),
      bC: x0 => x0.ignoreCase,
      bD: x0 => x0.body,
      bE: s => s.trim(),
      bF: (x0,x1) => { x0.name = x1 },
      bG: x0 => x0.value,
      bH: x0 => x0.current(),
      bI: (x0,x1) => x0.getElementById(x1),
      bJ: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      c: o => o,
      cB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      cC: x0 => x0.multiline,
      cD: () => globalThis.document,
      cE: x0 => x0.classList,
      cF: x0 => x0.head,
      cG: x0 => x0.selectionDirection,
      cH: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      cI: x0 => x0.remove(),
      cJ: (x0,x1) => x0.removeItem(x1),
      d: (o, p) => o[p],
      dB: Function.prototype.call.bind(DataView.prototype.getInt32),
      dC: (string, token) => string.split(token),
      dD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      dE: x0 => x0.preventDefault(),
      dF: (x0,x1) => x0.removeChild(x1),
      dG: x0 => x0.selectionStart,
      dH: x0 => x0.v8BreakIterator,
      dI: () => globalThis.document,
      dJ: x0 => x0.localStorage,
      e: () => globalThis,
      eB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      eC: o => o instanceof Array,
      eD: x0 => x0.hasFocus(),
      eE: x0 => x0.parent,
      eF: x0 => x0.firstChild,
      eG: x0 => x0.selectionEnd,
      eH: () => globalThis.Intl,
      eI: x0 => x0.reload(),
      eJ: (x0,x1) => x0.getItem(x1),
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => o instanceof Uint16Array,
      fC: (a, i) => a[i],
      fD: x0 => x0.relatedTarget,
      fE: x0 => x0.timeStamp,
      fF: x0 => x0.viewConstraints,
      fG: x0 => x0.keyCode,
      fH: (x0,x1) => x0.segment(x1),
      fI: x0 => x0.location,
      fJ: (x0,x1) => x0.key(x1),
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: Function.prototype.call.bind(DataView.prototype.getUint16),
      gC: a => a.length,
      gD: x0 => x0.shiftKey,
      gE: (x0,x1) => x0.hasAttribute(x1),
      gF: x0 => x0.hostElement,
      gG: (x0,x1) => x0.scrollIntoView(x1),
      gH: x0 => x0.index,
      gI: x0 => x0.abort(),
      gJ: x0 => x0.length,
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: o => o instanceof Int16Array,
      hC: x0 => x0.userAgent,
      hD: (decoder, codeUnits) => decoder.decode(codeUnits),
      hE: x0 => x0.buttons,
      hF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      hG: x0 => x0.multiViewEnabled,
      hH: x0 => x0.next(),
      hI: x0 => ({steal: x0}),
      hJ: (x0,x1,x2) => x0.setItem(x1,x2),
      i: (l, r) => l === r,
      iB: Function.prototype.call.bind(DataView.prototype.getInt16),
      iC: x0 => x0.navigator,
      iD: () => new TextDecoder("utf-8", {fatal: true}),
      iE: x0 => x0.ctrlKey,
      iF: x0 => ({runApp: x0}),
      iG: (x0,x1) => x0.replaceWith(x1),
      iH: x0 => x0.value,
      iI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      iJ: x0 => x0.length,
      j: x0 => x0.random(),
      jB: o => o instanceof Uint8ClampedArray,
      jC: Function.prototype.call.bind(String.prototype.toLowerCase),
      jD: () => new TextDecoder("utf-8", {fatal: false}),
      jE: x0 => x0.y,
      jF: x0 => ({latencyHint: x0}),
      jG: (x0,x1) => { x0.type = x1 },
      jH: x0 => x0.done,
      jI: (x0,x1,x2,x3) => x0.request(x1,x2,x3),
      jJ: x0 => x0.getReader(),
      k: o => o,
      kB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      kC: Object.is,
      kD: (a, i, v) => a[i] = v,
      kE: x0 => x0.x,
      kF: x0 => new AudioContext(x0),
      kG: (x0,x1) => { x0.className = x1 },
      kH: (o, m, a) => o[m].apply(o, a),
      kI: () => new AbortController(),
      kJ: x0 => x0.value,
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: Function.prototype.call.bind(DataView.prototype.setInt32),
      lC: x0 => x0.vendor,
      lD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      lE: x0 => x0.scrollTop,
      lF: (x0,x1) => x0.decodeAudioData(x1),
      lG: (x0,x1) => { x0.tabIndex = x1 },
      lH: x0 => x0.iterator,
      lI: x0 => ({signal: x0}),
      lJ: x0 => x0.done,
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setUint32),
      mC: (x0,x1) => x0.createTextNode(x1),
      mD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      mE: x0 => x0.offsetTop,
      mF: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      mG: (x0,x1) => { x0.name = x1 },
      mH: () => globalThis.Symbol,
      mI: x0 => x0.signal,
      mJ: x0 => x0.read(),
      n: (x0,x1) => x0.prepend(x1),
      nB: Function.prototype.call.bind(DataView.prototype.setInt16),
      nC: (x0,x1) => { x0.id = x1 },
      nD: x0 => x0.visibilityState,
      nE: x0 => x0.scrollLeft,
      nF: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      nG: (x0,x1) => { x0.placeholder = x1 },
      nH: (x0,x1) => new Intl.Segmenter(x0,x1),
      nI: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      nJ: x0 => x0.body,
      o: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      oB: Function.prototype.call.bind(DataView.prototype.setUint16),
      oC: (x0,x1) => { x0.nonce = x1 },
      oD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      oE: x0 => x0.offsetLeft,
      oF: (a, s, e) => a.slice(s, e),
      oG: (x0,x1) => { x0.autocomplete = x1 },
      oH: x0 => x0.Segmenter,
      oI: (o, p, v) => o[p] = v,
      oJ: (x0,x1) => new OffscreenCanvas(x0,x1),
      p: b => !!b,
      pB: Function.prototype.call.bind(DataView.prototype.setUint8),
      pC: x0 => x0.nonce,
      pD: x0 => x0.disconnect(),
      pE: x0 => x0.offsetParent,
      pF: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      pG: (x0,x1) => { x0.name = x1 },
      pH: x0 => x0.buffer,
      pI: (o,s,v) => o[s] = v,
      pJ: x0 => x0.assetBase,
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setInt8),
      qC: () => globalThis.window.flutterConfiguration,
      qD: x0 => new Intl.Locale(x0),
      qE: (o, p, r) => o.replace(p, () => r),
      qF: x0 => x0.history,
      qG: (x0,x1) => { x0.placeholder = x1 },
      qH: x0 => x0.wasmMemory,
      qI: () => Symbol("jsBoxedDartObjectProperty"),
      qJ: x0 => x0.loader,
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.getInt8),
      rC: (x0,x1) => x0.attachShadow(x1),
      rD: x0 => x0.region,
      rE: (o, p, r) => o.replaceAll(p, () => r),
      rF: x0 => x0.search,
      rG: (x0,x1) => { x0.action = x1 },
      rH: () => globalThis.window._flutter_skwasmInstance,
      rI: (x0,x1) => x0.call(x1),
      rJ: () => globalThis._flutter,
      s: () => ({}),
      sB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      sC: (x0,x1) => x0.createElement(x1),
      sD: x0 => x0.script,
      sE: x0 => x0.deltaMode,
      sF: x0 => x0.location,
      sG: (x0,x1) => { x0.method = x1 },
      sH: () => new TextDecoder(),
      sI: x0 => x0.locks,
      t: (o, p, v) => o[p] = v,
      tB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      tC: x0 => x0.scale,
      tD: x0 => x0.language,
      tE: x0 => x0.deltaY,
      tF: x0 => x0.pathname,
      tG: (x0,x1) => { x0.noValidate = x1 },
      tH: x0 => x0.debugSkipFontRetryDelay,
      tI: x0 => ({ifAvailable: x0}),
      u: () => [],
      uB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      uC: x0 => x0.visualViewport,
      uD: x0 => x0.languages,
      uE: x0 => x0.deltaX,
      uF: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      uG: (x0,x1) => x0.removeAttribute(x1),
      uH: (x0,x1,x2) => x0.set(x1,x2),
      uI: (x0,x1,x2) => x0.insertBefore(x1,x2),
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.devicePixelRatio,
      vD: (x0,x1) => x0.observe(x1),
      vE: x0 => x0.wheelDeltaY,
      vF: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      vG: x0 => x0.isConnected,
      vH: x0 => x0.fontFallbackBaseUrl,
      vI: x0 => x0.id,
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.height,
      wD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      wE: x0 => x0.wheelDeltaX,
      wF: o => Object.keys(o),
      wG: x0 => x0.click(),
      wH: (handle) => clearInterval(handle),
      wI: x0 => x0.offsetHeight,
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.width,
      xD: x0 => new ResizeObserver(x0),
      xE: x0 => x0.key,
      xF: x0 => x0.state,
      xG: (x0,x1) => x0.getElementsByClassName(x1),
      xH: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      xI: x0 => x0.offsetWidth,
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.screen,
      yD: (x0,x1) => x0.getPropertyValue(x1),
      yE: x0 => x0.identifier,
      yF: x0 => x0.hash,
      yG: (x0,x1) => x0.dispatchEvent(x1),
      yH: () => Date.now(),
      yI: x0 => x0.stopPropagation(),
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      zC: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      zD: x0 => globalThis.parseFloat(x0),
      zE: x0 => x0.touches,
      zF: x0 => x0.state,
      zG: (x0,x1) => x0.createEvent(x1),
      zH: (map, o) => map.get(o),
      zI: x0 => x0.disabled,

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
