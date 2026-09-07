(function () {
  'use strict';

  var FAVORITES_KEY = 'wird-favorites';
  var COUNTS_KEY = 'wird-counts';

  function readJSON(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* localStorage غير متاح (وضع التصفح الخاص مثلاً) */
    }
  }

  function getFavorites() {
    return readJSON(FAVORITES_KEY, []);
  }

  function getCounts() {
    return readJSON(COUNTS_KEY, {});
  }

  var heartIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7.5-4.6-10-9.3C.5 8.2 2.4 5 6 5c2.1 0 3.6 1.1 4.5 2.4C11.4 6.1 12.9 5 15 5c3.6 0 5.5 3.2 4 6.7C19.5 16.4 12 21 12 21z"/></svg>';
  var heartIconFilled =
    '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7.5-4.6-10-9.3C.5 8.2 2.4 5 6 5c2.1 0 3.6 1.1 4.5 2.4C11.4 6.1 12.9 5 15 5c3.6 0 5.5 3.2 4 6.7C19.5 16.4 12 21 12 21z"/></svg>';
  var resetIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>';

  function renderFavoriteButton(btn) {
    var id = btn.getAttribute('data-id');
    var isFav = getFavorites().indexOf(id) !== -1;
    btn.innerHTML = isFav ? heartIconFilled : heartIcon;
    btn.classList.toggle('active', isFav);
    btn.setAttribute('aria-label', isFav ? 'إزالة من المفضلة' : 'حفظ في المفضلة');
  }

  function renderCountButton(btn) {
    var id = btn.getAttribute('data-id');
    var max = parseInt(btn.getAttribute('data-max'), 10) || 1;
    var count = getCounts()[id] || 0;
    var done = count >= max;
    btn.innerHTML =
      '<span class="num">' + count + '</span><span style="opacity:.6">/</span><span class="num">' + max + '</span>' +
      '<span class="label">' + (done ? 'مكتمل' : 'اضغط للعدّ') + '</span>';
    btn.classList.toggle('done', done);
  }

  function initPage() {
    document.querySelectorAll('.reset-btn').forEach(function (btn) {
      btn.innerHTML = resetIcon;
    });

    document.querySelectorAll('[data-id]').forEach(function (el) {
      if (el.classList.contains('fav-btn')) renderFavoriteButton(el);
      if (el.classList.contains('count-btn')) renderCountButton(el);
    });

    document.addEventListener('click', function (event) {
      var favBtn = event.target.closest('.fav-btn');
      if (favBtn) {
        var id = favBtn.getAttribute('data-id');
        var favorites = getFavorites();
        var idx = favorites.indexOf(id);
        if (idx === -1) favorites.push(id);
        else favorites.splice(idx, 1);
        writeJSON(FAVORITES_KEY, favorites);
        renderFavoriteButton(favBtn);
        return;
      }

      var countBtn = event.target.closest('.count-btn');
      if (countBtn) {
        var cid = countBtn.getAttribute('data-id');
        var max = parseInt(countBtn.getAttribute('data-max'), 10) || 1;
        var counts = getCounts();
        var current = counts[cid] || 0;
        if (current < max) {
          counts[cid] = current + 1;
          writeJSON(COUNTS_KEY, counts);
          renderCountButton(countBtn);
        }
        return;
      }

      var resetBtn = event.target.closest('.reset-btn');
      if (resetBtn) {
        var rid = resetBtn.getAttribute('data-id');
        var allCounts = getCounts();
        allCounts[rid] = 0;
        writeJSON(COUNTS_KEY, allCounts);
        var pair = document.querySelector('.count-btn[data-id="' + rid + '"]');
        if (pair) renderCountButton(pair);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    initPage();
  }
})();
