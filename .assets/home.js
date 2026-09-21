/* Blog homepage only (body.site-home): the "Recently Updated" / "All Notes"
 * tabs, and fuzzy search (title + description + full post content, via
 * .assets/search-index.json) on both of their lists. See home.css for the
 * matching styles and modules/local/org/publish.el's
 * `my/org-generate-search-index' for how the index is built. */
document.addEventListener('DOMContentLoaded', function () {
  enhanceHomeIndex();
  enhanceHomeTabs();
  enhanceRecentList();

  // Shared by both homepage search bars (Recently Updated + All Notes): a
  // per-post {title, description, content} index fetched once from
  // .assets/search-index.json (generated at publish time — see
  // `my/org-generate-search-index' in modules/local/org/publish.el), keyed
  // by each post's href so it can be matched up with its <li>.
  var searchIndexPromise = null;

  function loadSearchIndex(onReady) {
    if (!document.body.classList.contains('site-home')) {
      onReady({});
      return;
    }

    if (!searchIndexPromise) {
      searchIndexPromise = fetch('.assets/search-index.json')
        .then(function (response) { return response.ok ? response.json() : []; })
        .then(function (records) {
          var byUrl = {};
          records.forEach(function (record) { byUrl[record.url] = record; });
          return byUrl;
        })
        .catch(function () { return {}; });
    }

    searchIndexPromise.then(onReady);
  }

  // Subsequence match: every character of TERM appears in WORD in order,
  // possibly with gaps — the usual definition of "fuzzy" (as in fzf-style
  // finders), so a typo'd or abbreviated term ("plcy") still hits "policy".
  // Scoped to a single word (see `matchesQuery') rather than the whole text,
  // since a subsequence check against one long blob of prose is so loose it
  // matches almost anything — e.g. "noising" is trivially a subsequence of
  // "a policy is generated using..." even though the words are unrelated.
  function fuzzyContains(word, term) {
    var from = 0;

    for (var i = 0; i < term.length; i++) {
      from = word.indexOf(term.charAt(i), from);
      if (from === -1) return false;
      from += 1;
    }

    return true;
  }

  function tokenize(text) {
    return text.toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean);
  }

  // Each whitespace-separated word in the query must fuzzy-match at least
  // one whole word in TEXT (order between query words doesn't matter, so
  // "gradient policy" still finds "The Policy Gradient Theorem").
  function matchesQuery(query, text) {
    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return true;

    var words = tokenize(text);
    return terms.every(function (term) {
      return words.some(function (word) { return fuzzyContains(word, term); });
    });
  }

  // The <li>'s own text already covers title/date/description (see
  // `my/org-post-entry'); the search index contributes the post's content.
  function searchTextFor(li, searchIndex) {
    var link = li.querySelector('a');
    var href = link && link.getAttribute('href');
    var record = href && searchIndex && searchIndex[href];
    var text = li.textContent || '';

    return record ? text + ' ' + record.content : text;
  }

  function enhanceRecentList() {
    var BATCH_SIZE = 8;
    var recent = document.querySelector('.site-recent');
    var list = recent && recent.querySelector(':scope > ul.org-ul');
    var items = list ? Array.prototype.slice.call(list.children) : [];
    var searchInput = document.getElementById('site-search-recent');

    if (!items.length) return;

    var lazyEnabled = items.length > BATCH_SIZE;
    var shown = lazyEnabled ? Math.min(BATCH_SIZE, items.length) : items.length;
    var searching = false;
    var sentinel = document.createElement('div');
    sentinel.className = 'site-recent-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');

    var observer = lazyEnabled && new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        revealNextBatch();
      }
    }, { rootMargin: '400px' });

    if (lazyEnabled) {
      items.forEach(function (li, index) { li.hidden = index >= BATCH_SIZE; });
      list.parentElement.appendChild(sentinel);
      observer.observe(sentinel);
    }

    function revealNextBatch() {
      items.slice(shown, shown + BATCH_SIZE).forEach(function (li) {
        li.hidden = false;
      });
      shown += BATCH_SIZE;

      if (shown >= items.length) {
        observer.disconnect();
        sentinel.remove();
        return;
      }

      // The observer only fires on enter/exit transitions. If this batch
      // didn't push the sentinel back outside the viewport (+ rootMargin),
      // no further callback will ever come, so keep revealing synchronously.
      if (sentinel.getBoundingClientRect().top < window.innerHeight + 400) {
        revealNextBatch();
      }
    }

    if (!searchInput) return;

    var searchIndex = null;
    loadSearchIndex(function (data) {
      searchIndex = data;
      applyFilter(searchInput.value);
    });

    searchInput.addEventListener('input', function () {
      applyFilter(searchInput.value);
    });

    function applyFilter(rawQuery) {
      var query = rawQuery.trim();

      if (!query) {
        if (searching && lazyEnabled) {
          items.forEach(function (li, index) { li.hidden = index >= shown; });
          if (shown < items.length) {
            list.parentElement.appendChild(sentinel);
            observer.observe(sentinel);
          }
        } else if (searching) {
          items.forEach(function (li) { li.hidden = false; });
        }
        searching = false;
        return;
      }

      // A search shows every match at once — pause the batched reveal so it
      // doesn't fight the search over which items are visible.
      if (!searching && lazyEnabled) {
        observer.disconnect();
        sentinel.remove();
      }
      searching = true;

      items.forEach(function (li) {
        li.hidden = !matchesQuery(query, searchTextFor(li, searchIndex));
      });
    }
  }

  function enhanceHomeTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.site-tab'));
    var panels = Array.prototype.slice.call(document.querySelectorAll('.site-panel'));

    if (!tabs.length || !panels.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.dataset.panel;

        tabs.forEach(function (t) {
          var active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', String(active));
        });

        panels.forEach(function (panel) {
          panel.hidden = panel.dataset.panel !== target;
        });
      });
    });
  }

  // All Notes is a drill-down directory browser: only one folder's contents
  // are ever on screen. Clicking a folder replaces the list with its own
  // children; the bar above (back button + breadcrumb) is the way out; and
  // the search box runs a fuzzy, recursive search scoped to whatever
  // directory is currently open, rendering a flat list of matches (each
  // tagged with its path, since nesting can no longer show where a result
  // lives).
  function enhanceHomeIndex() {
    var searchInput = document.getElementById('site-search-index');
    var panel = document.querySelector('.site-index');
    var rootList = panel && panel.querySelector(':scope > ul.org-ul');

    if (!searchInput || !panel || !rootList) return;

    var backBtn = document.createElement('button');
    var crumbs = document.createElement('nav');
    var bar = document.createElement('div');
    var resultsList = document.createElement('ul');
    var navStack = [{ name: 'All Notes', list: rootList, li: null }];
    var searchIndex = null;

    backBtn.type = 'button';
    backBtn.className = 'site-index-back';
    backBtn.setAttribute('aria-label', 'Back to parent folder');
    backBtn.innerHTML =
      '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M10 3.5 5.5 8 10 12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
    backBtn.addEventListener('click', function () {
      if (navStack.length > 1) {
        navStack.pop();
        searchInput.value = '';
        showLevel();
      }
    });

    crumbs.className = 'site-index-crumbs';
    crumbs.setAttribute('aria-label', 'Breadcrumb');

    bar.className = 'site-index-bar';
    bar.appendChild(backBtn);
    bar.appendChild(crumbs);
    panel.insertBefore(bar, rootList);

    resultsList.className = 'site-index-results';
    resultsList.hidden = true;
    panel.insertBefore(resultsList, rootList);

    restructureList(rootList);
    showLevel();

    loadSearchIndex(function (data) {
      searchIndex = data;
      applyFilter(searchInput.value);
    });

    searchInput.addEventListener('input', function () {
      applyFilter(searchInput.value);
    });

    function currentEntry() {
      return navStack[navStack.length - 1];
    }

    function renderCrumbs() {
      crumbs.innerHTML = '';

      navStack.forEach(function (entry, i) {
        if (i > 0) {
          var sep = document.createElement('span');
          sep.className = 'site-index-sep';
          sep.setAttribute('aria-hidden', 'true');
          sep.textContent = '/';
          crumbs.appendChild(sep);
        }

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = entry.name;

        if (i === navStack.length - 1) {
          btn.setAttribute('aria-current', 'page');
        } else {
          btn.addEventListener('click', function () {
            navStack = navStack.slice(0, i + 1);
            searchInput.value = '';
            showLevel();
          });
        }

        crumbs.appendChild(btn);
      });

      backBtn.disabled = navStack.length <= 1;
    }

    function showLevel() {
      // Every nested ul.org-ul already exists in the DOM (it's how Org
      // exports the tree) — drill-down just decides which <li>s render.
      // A hidden ancestor blocks all of its descendants no matter what
      // their own `hidden` says, so an ancestor folder's <li> must stay
      // un-hidden (only its own row is hidden) for the current level —
      // however deep — to be reachable at all.
      var activeFolders = new Set(navStack.slice(1).map(function (entry) { return entry.li; }));
      var currentChildren = new Set(currentEntry().list.children);

      panel.querySelectorAll('li').forEach(function (li) {
        var row = li.querySelector(':scope > .row');
        var childUl = li.querySelector(':scope > ul.org-ul');

        if (activeFolders.has(li)) {
          li.hidden = false;
          if (row) row.hidden = true;
          if (childUl) childUl.hidden = false;
        } else if (currentChildren.has(li)) {
          li.hidden = false;
          if (row) row.hidden = false;
          if (childUl) childUl.hidden = true;
        } else {
          li.hidden = true;
        }
      });

      renderCrumbs();
      searchInput.placeholder = 'Search in ' + currentEntry().name + '…';
      applyFilter(searchInput.value);
    }

    // Folders arrive from Org as "<li>Name (N)<ul>…</ul></li>"; posts as
    // "<li><a><b>Title</b></a> <i>date</i> <span class=site-desc>…</span></li>".
    // Both get restructured once, up front, into the shape the drill-down
    // view and its CSS expect — after which every folder's own click
    // handler is already wired, however deep it's nested.
    function restructureList(ul) {
      Array.prototype.forEach.call(ul.children, function (li) {
        var childUl = li.querySelector(':scope > ul.org-ul');

        if (childUl) {
          restructureFolderLi(li, childUl);
          restructureList(childUl);
        } else {
          restructurePostLi(li);
        }
      });
    }

    function restructureFolderLi(li, childUl) {
      li.classList.add('folder');

      var textNode = Array.prototype.find.call(li.childNodes, function (node) {
        return node.nodeType === Node.TEXT_NODE && /\S/.test(node.textContent);
      });
      var name = '';
      var count = '';

      if (textNode) {
        var match = textNode.textContent.match(/^\s*(.*?)\s*\((\d+)\)\s*$/);
        if (match) {
          name = match[1];
          count = match[2];
        }
      }

      var row = document.createElement('div');
      row.className = 'row folder-row';
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.innerHTML =
        '<svg class="folder-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M2.5 5.5a1 1 0 0 1 1-1h4l1.5 2h7.5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-9Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>' +
        '</svg>' +
        '<span class="name"></span><span class="count"></span>' +
        '<svg class="enter" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>';
      row.querySelector('.name').textContent = name;
      row.querySelector('.count').textContent = count;

      li.insertBefore(row, textNode || childUl);
      if (textNode) textNode.remove();

      function enter() {
        navStack.push({ name: name, list: childUl, li: li });
        searchInput.value = '';
        showLevel();
      }

      row.addEventListener('click', enter);
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); }
      });
    }

    function restructurePostLi(li) {
      li.classList.add('post');

      var link = li.querySelector(':scope > a');
      if (!link) return;

      link.classList.add('row', 'post-row');

      // Move the date inside the link so the whole title+date row is one
      // real hit target; the description stays a separate paragraph after
      // it, so a link inside a description (rare, but it happens) stays
      // its own click target rather than being swallowed by the post link.
      var dateEl = li.querySelector(':scope > i');
      if (dateEl) {
        dateEl.classList.add('date');
        link.appendChild(dateEl);
      }

      var descEl = li.querySelector(':scope > span.site-desc');
      if (descEl) descEl.title = descEl.textContent.trim();
    }

    function collectPosts(ul, relPath, results) {
      Array.prototype.forEach.call(ul.children, function (li) {
        var childUl = li.querySelector(':scope > ul.org-ul');

        if (childUl) {
          var nameEl = li.querySelector(':scope > .folder-row > .name');
          collectPosts(childUl, relPath.concat(nameEl ? nameEl.textContent : ''), results);
        } else {
          results.push({ li: li, relPath: relPath });
        }
      });
    }

    function applyFilter(rawQuery) {
      var query = rawQuery.trim();
      var entry = currentEntry();

      if (!query) {
        resultsList.hidden = true;
        entry.list.hidden = false;
        return;
      }

      var all = [];
      collectPosts(entry.list, [], all);
      var matches = all.filter(function (item) {
        return matchesQuery(query, searchTextFor(item.li, searchIndex));
      });

      entry.list.hidden = true;
      resultsList.innerHTML = '';
      resultsList.hidden = false;

      if (!matches.length) {
        var empty = document.createElement('li');
        empty.className = 'site-index-empty';
        empty.textContent = 'No posts match “' + query + '” in ' + entry.name + '.';
        resultsList.appendChild(empty);
        return;
      }

      matches.forEach(function (item) {
        var clone = item.li.cloneNode(true);
        // The source <li> (and its row) may be `hidden` in the normal
        // browsing view — e.g. a match two folders deeper than the one
        // being searched — but the clone always needs to render.
        clone.hidden = false;
        var clonedRow = clone.querySelector(':scope > .row');
        if (clonedRow) clonedRow.hidden = false;

        if (item.relPath.length) {
          var tag = document.createElement('span');
          tag.className = 'result-path';
          tag.textContent = item.relPath.join(' / ');
          clone.insertBefore(tag, clone.firstChild);
        }

        resultsList.appendChild(clone);
      });
    }
  }
});
