!(function() {

/**
 * Wraps fastdom in a Promise API
 * for improved control-flow.
 *
 * @example
 *
 * // returning a result
 * fastdom.measure(() => el.clientWidth)
 *   .then(result => ...);
 *
 * // returning promises from tasks
 * fastdom.measure(() => {
 *   var w = el1.clientWidth;
 *   return fastdom.mutate(() => el2.style.width = w + 'px');
 * }).then(() => console.log('all done'));
 *
 * // clearing pending tasks
 * var promise = fastdom.measure(...)
 * fastdom.clear(promise);
 *
 * @type {Object}
 */
var exports = {
  initialize: function() {
    this._tasks = new Map();
  },

  mutate: function(fn, ctx) {
    return create(this, 'mutate', fn, ctx);
  },

  measure: function(fn, ctx) {
    return create(this, 'measure', fn, ctx);
  },

  clear: function(promise) {
    var tasks = this._tasks;
    var task = tasks.get(promise);
    this.fastdom.clear(task);
    tasks.delete(promise);
  }
};

/**
 * Create a fastdom task wrapped in
 * a 'cancellable' Promise.
 *
 * @param  {FastDom}  fastdom
 * @param  {String}   type - 'measure'|'mutate'
 * @param  {Function} fn
 * @return {Promise}
 */
function create(promised, type, fn, ctx) {
  var tasks = promised._tasks;
  var fastdom = promised.fastdom;
  var task;

  var promise = new Promise(function(resolve, reject) {
    task = fastdom[type](function() {
      tasks.delete(promise);
      try {
        const res = ctx ? fn.call(ctx) : fn();
        if (res instanceof Promise)
          res.then(resolve, reject);
        else resolve(res);
      }
      catch (e) { reject(e); }
    }, ctx);
  });

  tasks.set(promise, task);
  return promise;
}

// Expose to CJS, AMD or global
if ((typeof define)[0] == 'f') define(function() { return exports; });
else if ((typeof module)[0] == 'o') module.exports = exports;
else window.fastdom = window.fastdom.extend(exports);

})();