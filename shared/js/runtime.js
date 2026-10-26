/* Steady runtime: renders a compiled artboard template with Preact from the shared core logic.
   Adds keyed conditionals (so screen transitions re-animate), lazy-loaded fading images and mount hooks. */
(function (global) {
  'use strict';
  var P = global.preact; var h = P.h;
  var BOOL = { disabled: 1, checked: 1, selected: 1, readonly: 1, required: 1, hidden: 1, multiple: 1, autofocus: 1, open: 1 };
  var EVENTS = { onClick: 1, onChange: 1, onKeyDown: 1, onKeyUp: 1, onInput: 1, onSubmit: 1, onFocus: 1, onBlur: 1, onMouseEnter: 1, onMouseLeave: 1 };

  function lookup(path, scope, vals) {
    var parts = path.split('.'); var root = parts[0]; var cur;
    if (root === '$index') return scope.$index;
    if (root === 'true') return true; if (root === 'false') return false;
    cur = (root in scope) ? scope[root] : vals[root];
    for (var i = 1; i < parts.length; i++) { if (cur == null) return undefined; cur = cur[parts[i]]; }
    return cur;
  }
  function str(v) { return v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v)); }
  function evalAttr(raw, scope, vals) {
    if (typeof raw === 'string') return raw;
    if (!Array.isArray(raw)) return lookup(raw.$, scope, vals);
    var s = ''; for (var i = 0; i < raw.length; i++) { var p = raw[i]; s += typeof p === 'string' ? p : str(lookup(p.$, scope, vals)); }
    return s;
  }
  function textual(tag, attrs) {
    if (tag === 'textarea') return true;
    if (tag !== 'input') return false;
    var t = attrs.type; t = typeof t === 'string' ? t : '';
    return !(t === 'checkbox' || t === 'radio' || t === 'file');
  }

  /* Images: lazy by default, decoded off the main thread, faded in once loaded. data-* survives re-renders. */
  function markLoaded(el) { if (el && !el.dataset.loaded) el.dataset.loaded = '1'; }
  function imgRef(el) { if (el && el.complete && el.naturalWidth > 0) markLoaded(el); }
  function onImgLoad(e) { markLoaded(e.currentTarget || e.target); }
  function imageProps(props) {
    if (props.loading == null) props.loading = 'lazy';
    if (props.decoding == null) props.decoding = 'async';
    props.onLoad = onImgLoad; props.onError = onImgLoad; props.ref = imgRef;
    props['data-lazy'] = '1';
    return props;
  }

  function buildEl(n, scope, vals, key) {
    var tag = n[0], attrs = n[1], children = n[2]; var props = {}; if (key != null) props.key = key;
    for (var name in attrs) {
      var raw = attrs[name];
      if (EVENTS[name]) {
        var fn = evalAttr(raw, scope, vals);
        if (typeof fn === 'function') { if (name === 'onChange' && textual(tag, attrs)) props.onInput = fn; else props[name] = fn; }
        continue;
      }
      if (name === 'ref') { var rf = evalAttr(raw, scope, vals); if (typeof rf === 'function') props.ref = rf; continue; }
      var v = evalAttr(raw, scope, vals);
      if (BOOL[name]) { props[name] = !!(v && v !== 'false'); continue; }
      if (typeof v === 'boolean') v = v ? 'true' : 'false';
      if (v == null) v = '';
      if (name === 'value' && tag !== 'option') { props.value = str(v); continue; }
      props[name] = typeof v === 'string' ? v : str(v);
    }
    if (tag === 'img') imageProps(props);
    var kids = []; buildList(children, scope, vals, kids);
    return h(tag, props, kids);
  }
  function buildList(list, scope, vals, out) {
    for (var i = 0; i < list.length; i++) build(list[i], scope, vals, out, null, i);
  }
  function keyAll(tmp, prefix) {
    for (var j = 0; j < tmp.length; j++) { var vn = tmp[j]; if (vn && typeof vn === 'object' && vn.key == null) vn.key = prefix + ':' + j; }
  }
  function build(n, scope, vals, out, key, pos) {
    if (typeof n === 'string') { out.push(n); return; }
    if (Array.isArray(n)) { out.push(buildEl(n, scope, vals, key)); return; }
    if (n.$ !== undefined) { out.push(str(lookup(n.$, scope, vals))); return; }
    if (n['if'] !== undefined) {
      if (!lookup(n['if'], scope, vals)) return;
      // Keyed on the condition: when one screen's block gives way to another, Preact mounts fresh
      // nodes instead of recycling them, so entrance animations play on every navigation.
      var tmp = []; buildList(n.c, scope, vals, tmp); keyAll(tmp, 'if' + pos + ':' + n['if']);
      for (var k = 0; k < tmp.length; k++) out.push(tmp[k]);
      return;
    }
    if (n['for'] !== undefined) {
      var items = lookup(n['for'], scope, vals); if (!items || !items.length) return;
      for (var i = 0; i < items.length; i++) {
        var sc = Object.create(scope); sc[n.as] = items[i]; sc.$index = i;
        var tmp2 = []; buildList(n.c, sc, vals, tmp2);
        var id = items[i] && typeof items[i] === 'object' && items[i].id != null ? String(items[i].id) : String(i);
        keyAll(tmp2, 'for' + pos + ':' + id);
        for (var j = 0; j < tmp2.length; j++) out.push(tmp2[j]);
      }
    }
  }

  /* DCLogic shim: the core's component base. State changes are routed to the Preact host. */
  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (p, cb) {
    var host = this.__host;
    if (!host) { var patch = typeof p === 'function' ? p(this.state) : p; this.state = Object.assign({}, this.state, patch); if (cb) cb(); return; }
    host.setState(function (prev) { return typeof p === 'function' ? p(prev) : p; }, cb);
  };
  DCLogic.prototype.forceUpdate = function () { if (this.__host) this.__host.forceUpdate(); };

  function App(props) {
    P.Component.call(this, props);
    var L = props.logic; this.logic = new L({}); this.logic.__host = this;
    if (typeof props.init === 'function') props.init(this.logic);
    this.state = this.logic.state; global.SteadySite.app = this; global.SteadySite.logic = this.logic;
  }
  App.prototype = Object.create(P.Component.prototype); App.prototype.constructor = App;
  App.prototype.componentDidMount = function () { this.logic.state = this.state; if (this.logic.componentDidMount) this.logic.componentDidMount(); if (typeof this.props.onMounted === 'function') this.props.onMounted(this.logic); };
  App.prototype.componentDidUpdate = function (pp, ps) { this.logic.state = this.state; if (this.logic.componentDidUpdate) this.logic.componentDidUpdate(pp, ps); };
  App.prototype.componentWillUnmount = function () { if (this.logic.componentWillUnmount) this.logic.componentWillUnmount(); };
  App.prototype.componentDidCatch = function (e) { console.error('Steady render error', e); if (typeof this.props.onError === 'function') this.props.onError(e); };
  App.prototype.render = function () {
    this.logic.state = this.state;
    var vals = this.logic.renderVals(); var out = [];
    buildList(this.props.template, {}, vals, out);
    return h('div', { 'class': 'dc-root' }, out);
  };

  global.SteadySite = {
    mount: function (opts) {
      opts = opts || {};
      var template = opts.template;
      if (!template) { var tplEl = document.getElementById(opts.templateId || 'tpl'); template = JSON.parse(tplEl.textContent); }
      var Core = global.makeSteadyCore(DCLogic);
      var mode = opts.mode || 'cs';
      class Component extends Core { mode() { return mode; } }
      var root = typeof opts.root === 'string' ? document.querySelector(opts.root) : (opts.root || document.getElementById(opts.rootId || 'app'));
      P.render(h(App, { logic: Component, template: template, init: opts.init, onMounted: opts.onMounted, onError: opts.onError }), root);
      return global.SteadySite.logic;
    }
  };
})(typeof window !== 'undefined' ? window : this);
