/* Outback Overflow '26: countdown, the 36-hour buffer and local start times. Everything works without this file; it only adds live state. */
(function () {
  var START = Date.parse('2026-11-21T10:00:00+11:00');
  var END = Date.parse('2026-11-22T22:00:00+11:00');
  var HOUR = 3600000;

  var status = document.querySelector('[data-status]');
  var buffer = document.querySelector('[data-buffer]');
  var cells = buffer ? Array.prototype.slice.call(buffer.querySelectorAll('.c')) : [];

  function num(n, unit) {
    return '<span class="num">' + n + '</span><span class="unit">' + unit + (n === 1 ? '' : 's') + '</span>';
  }

  function render() {
    if (!status) return;
    var now = Date.now();
    var html, elapsed = 0, current = -1;

    if (now < START) {
      var ms = START - now;
      var d = Math.floor(ms / 864e5);
      var h = Math.floor((ms % 864e5) / HOUR);
      var m = Math.floor((ms % HOUR) / 60000);
      html = (d > 0 ? num(d, 'day') : '') + num(h, 'hour') + (d > 0 ? '' : num(m, 'minute')) + '<span class="rest">until the start</span>';
    } else if (now < END) {
      var hour = Math.floor((now - START) / HOUR);
      elapsed = hour;
      current = hour;
      var left = Math.ceil((END - now) / HOUR);
      html = '<span class="rest">Live now. Hour</span><span class="num">' + (hour + 1) + '</span><span class="rest">of 36,</span>' + num(left, 'hour') + '<span class="rest">to go</span>';
    } else {
      elapsed = 36;
      html = '<span class="rest">Finished. Thanks to everyone who played.</span>';
    }

    status.innerHTML = html;
    cells.forEach(function (c, i) {
      c.classList.toggle('on', i < elapsed);
      c.classList.toggle('now', i === current);
    });
  }

  render();
  setInterval(render, 30000);

  /* local start and end times */
  var row = document.querySelector('[data-local]');
  if (row && window.Intl && Intl.DateTimeFormat) {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      var fmt = new Intl.DateTimeFormat('en-AU', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
      row.querySelector('[data-local-name]').textContent = 'Your device (' + String(tz).replace(/_/g, ' ') + ')';
      row.querySelector('[data-local-start]').textContent = fmt.format(new Date(START));
      row.querySelector('[data-local-end]').textContent = fmt.format(new Date(END));
      row.hidden = false;
    } catch (e) { /* leave the row hidden */ }
  }
})();
