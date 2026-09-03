document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.org-ul li').forEach(function (li) {
    // Only foldable if it contains a child <ul>
    if (!li.querySelector('ul')) return;

    li.classList.add('has-subtree');

    li.addEventListener('click', function (e) {
      // Let <a> clicks pass through for normal navigation
      if (e.target.tagName === 'A') return;

      // Toggle only when clicking the item text/indicator itself,
      // not when a descendant foldable was the actual target
      e.stopPropagation();
      li.classList.toggle('expanded');
    });
  });

  enhanceHomeIndex();
  enhanceHomeTabs();
  enhanceRecentList();

  function enhanceRecentList() {
    var BATCH_SIZE = 8;
    var recent = document.querySelector('.site-recent');
    var list = recent && recent.querySelector(':scope > ul.org-ul');
    var items = list ? Array.prototype.slice.call(list.children) : [];

    if (!items.length || items.length <= BATCH_SIZE) return;

    var shown = 0;
    var sentinel = document.createElement('div');
    sentinel.className = 'site-recent-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');

    var observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        revealNextBatch();
      }
    }, { rootMargin: '400px' });

    items.forEach(function (li, index) {
      li.hidden = index >= BATCH_SIZE;
    });
    shown = Math.min(BATCH_SIZE, items.length);

    list.parentElement.appendChild(sentinel);
    observer.observe(sentinel);

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

  function enhanceHomeIndex() {
    var searchInput = document.getElementById('site-search');
    var index = document.querySelector('.site-index');

    if (!searchInput || !index) return;

    // Lift every folder's "Name (N)" text into a labeled pill + count chip,
    // at every depth, so folders read distinctly from post cards.
    index.querySelectorAll('li.has-subtree').forEach(function (li) {
      var childNodes = Array.prototype.slice.call(li.childNodes);

      childNodes.some(function (node) {
        if (node.nodeType !== Node.TEXT_NODE) return false;

        var match = node.textContent.match(/^\s*(.*?)\s*\((\d+)\)\s*$/);
        if (!match) return false;

        var label = document.createElement('span');
        var chip = document.createElement('span');

        label.className = 'folder-name';
        label.textContent = match[1];
        chip.className = 'count-chip';
        chip.textContent = match[2];

        li.replaceChild(label, node);
        li.insertBefore(chip, label.nextSibling);
        return true;
      });
    });

    var allItems = Array.prototype.slice.call(index.querySelectorAll('li'));

    function isLeaf(li) {
      return !li.querySelector('ul');
    }

    searchInput.addEventListener('input', function () {
      var query = searchInput.value.trim().toLowerCase();

      if (!query) {
        allItems.forEach(function (li) {
          li.classList.remove('filtered-out');
        });
        return;
      }

      allItems.forEach(function (li) {
        if (!isLeaf(li)) return;

        var matches = li.textContent.toLowerCase().indexOf(query) !== -1;
        li.classList.toggle('filtered-out', !matches);
        if (!matches) return;

        var ancestor = li.parentElement && li.parentElement.closest('li.has-subtree');
        while (ancestor) {
          ancestor.classList.add('expanded');
          ancestor.classList.remove('filtered-out');
          ancestor = ancestor.parentElement && ancestor.parentElement.closest('li.has-subtree');
        }
      });

      // Post-order: a directory is visible once its children are decided.
      allItems.slice().reverse().forEach(function (li) {
        if (isLeaf(li)) return;

        var visibleChild = li.querySelector(':scope > ul > li:not(.filtered-out)');
        li.classList.toggle('filtered-out', !visibleChild);
      });
    });
  }

  var calloutNumber = 0;

  document.querySelectorAll('div.problem, div.math-solution, div.eg').forEach(function (block) {
    // Avoid adding duplicate controls if the initializer runs more than once.
    if (block.classList.contains('math-callout')) return;

    calloutNumber += 1;

    var kind = block.classList.contains('math-solution')
      ? 'Solution'
      : block.classList.contains('eg')
        ? 'Example'
        : 'Problem';
    var startsCollapsed = kind !== 'Problem';
    var toggle = document.createElement('button');
    var content = document.createElement('div');
    var contentInner = document.createElement('div');
    var contentId = 'math-callout-content-' + calloutNumber;

    while (document.getElementById(contentId)) {
      calloutNumber += 1;
      contentId = 'math-callout-content-' + calloutNumber;
    }

    toggle.type = 'button';
    toggle.className = 'math-callout-toggle';
    toggle.textContent = kind;
    toggle.setAttribute('aria-controls', contentId);

    content.id = contentId;
    content.className = 'math-callout-content';
    contentInner.className = 'math-callout-content-inner';

    while (block.firstChild) {
      contentInner.appendChild(block.firstChild);
    }

    content.appendChild(contentInner);
    block.appendChild(toggle);
    block.appendChild(content);
    block.classList.add('math-callout');

    function setCollapsed(collapsed) {
      block.classList.toggle('is-collapsed', collapsed);
      toggle.setAttribute('aria-expanded', String(!collapsed));
      content.setAttribute('aria-hidden', String(collapsed));
    }

    setCollapsed(startsCollapsed);

    toggle.addEventListener('click', function () {
      setCollapsed(!block.classList.contains('is-collapsed'));
    });
  });

  enhanceAdmonitions();

  function enhanceAdmonitions() {
    var admonitionNumber = 0;
    var types = {
      note: { label: 'Note' },
      info: { label: 'Info' },
      warning: { label: 'Warning' },
      danger: { label: 'Danger' },
      attention: { label: 'Attention' }
    };

    document.querySelectorAll(
      'div.note, div.info, div.warning, div.danger, div.attention'
    ).forEach(function (block) {
      // Avoid duplicate controls if this initializer is called again.
      if (block.classList.contains('admonition')) return;

      var kind = Object.keys(types).find(function (type) {
        return block.classList.contains(type);
      });

      if (!kind) return;

      admonitionNumber += 1;

      var customTitle = takeAdmonitionTitle(block);
      var title = customTitle || types[kind].label;
      var contentId = 'admonition-content-' + admonitionNumber;
      var titleId = 'admonition-title-' + admonitionNumber;

      while (document.getElementById(contentId) || document.getElementById(titleId)) {
        admonitionNumber += 1;
        contentId = 'admonition-content-' + admonitionNumber;
        titleId = 'admonition-title-' + admonitionNumber;
      }

      var toggle = document.createElement('button');
      var titleElement = document.createElement('span');
      var content = document.createElement('div');
      var contentInner = document.createElement('div');

      toggle.type = 'button';
      toggle.className = 'admonition-toggle';
      toggle.setAttribute('aria-controls', contentId);
      toggle.appendChild(createAdmonitionIcon(kind));

      titleElement.id = titleId;
      titleElement.className = 'admonition-title';
      titleElement.textContent = title;
      toggle.appendChild(titleElement);

      content.id = contentId;
      content.className = 'admonition-content';
      contentInner.className = 'admonition-content-inner';

      while (block.firstChild) {
        contentInner.appendChild(block.firstChild);
      }

      content.appendChild(contentInner);
      block.appendChild(toggle);
      block.appendChild(content);
      block.classList.add('admonition');
      block.dataset.admonitionType = kind;

      if (!block.hasAttribute('role')) block.setAttribute('role', 'note');
      if (!block.hasAttribute('aria-labelledby')) {
        block.setAttribute('aria-labelledby', titleId);
      }

      function setCollapsed(collapsed) {
        var action = collapsed ? 'Expand ' : 'Collapse ';

        block.classList.toggle('is-collapsed', collapsed);
        toggle.setAttribute('aria-expanded', String(!collapsed));
        toggle.setAttribute(
          'aria-label',
          action + types[kind].label + ' callout: ' + title
        );
        toggle.title = action + title;
        content.setAttribute('aria-hidden', String(collapsed));
      }

      // General admonitions are collapsible, but visible by default.
      setCollapsed(false);

      toggle.addEventListener('click', function () {
        setCollapsed(!block.classList.contains('is-collapsed'));
      });
    });
  }

  function takeAdmonitionTitle(block) {
    var firstElement = block.firstElementChild;

    if (!firstElement || firstElement.tagName !== 'P') return '';
    if (firstElement.children.length !== 1) return '';

    var titleElement = firstElement.firstElementChild;
    var tagName = titleElement && titleElement.tagName;

    if (tagName !== 'B' && tagName !== 'STRONG') return '';

    var paragraphText = firstElement.textContent.trim();
    var titleText = titleElement.textContent.trim();

    if (!titleText || paragraphText !== titleText) return '';

    firstElement.remove();
    return titleText;
  }

  function createAdmonitionIcon(kind) {
    var namespace = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(namespace, 'svg');
    var paths = {
      note: '<path d="M14 2H6a2 2 0 0 0-2 2v16l4-4h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/><path d="M8 7h4M8 11h3"/>',
      info: '<circle cx="10" cy="10" r="8"/><path d="M10 9v5M10 6h.01"/>',
      warning: '<path d="M10 2 1.5 17h17L10 2Z"/><path d="M10 7v4M10 14h.01"/>',
      danger: '<path d="m6 2-4 4v8l4 4h8l4-4V6l-4-4H6Z"/><path d="M10 6v5M10 14h.01"/>',
      attention: '<path d="M1.5 10s3-6 8.5-6 8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z"/><circle cx="10" cy="10" r="2.5"/>'
    };

    svg.setAttribute('class', 'admonition-icon');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.innerHTML = paths[kind];
    return svg;
  }

  enhanceCodeBlocks();

  function enhanceCodeBlocks() {
    var codeBlocks = Array.prototype.slice.call(
      document.querySelectorAll('.org-src-container > pre.src')
    );

    if (!codeBlocks.length) return;

    var languageAliases = {
      bash: 'shell',
      js: 'javascript',
      'odin-ts': 'odin',
      sh: 'shell',
      ts: 'typescript'
    };
    var languageScopes = {
      'emacs-lisp': 'source.emacs.lisp',
      gradle: 'source.groovy.gradle',
      'odin-ts': 'source.odin'
    };
    var languageNames = {
      bash: 'Bash',
      c: 'C',
      c3: 'C3',
      clojure: 'Clojure',
      cpp: 'C++',
      'emacs-lisp': 'Emacs Lisp',
      gradle: 'Gradle',
      haskell: 'Haskell',
      java: 'Java',
      javascript: 'JavaScript',
      js: 'JavaScript',
      koka: 'Koka',
      kotlin: 'Kotlin',
      lua: 'Lua',
      ocaml: 'OCaml',
      odin: 'Odin',
      'odin-ts': 'Odin',
      python: 'Python',
      r: 'R',
      rust: 'Rust',
      sh: 'Shell',
      shell: 'Shell',
      ts: 'TypeScript',
      typescript: 'TypeScript',
      zig: 'Zig'
    };

    var blockDetails = codeBlocks.map(function (pre, index) {
      var classNames = Array.prototype.slice.call(pre.classList);
      var languageClass = classNames.find(function (className) {
        return className.indexOf('src-') === 0;
      });
      var language = languageClass ? languageClass.slice(4).toLowerCase() : 'text';
      var displayName = languageNames[language] || formatLanguageName(language);
      var source = pre.textContent;
      var container = pre.parentElement;
      var blockNumber = index + 1;
      var contentId = 'org-code-content-' + blockNumber;
      var toolbar = document.createElement('div');
      var content = document.createElement('div');
      var contentInner = document.createElement('div');
      var button = createCopyButton(displayName);
      var resetTimer = null;

      while (document.getElementById(contentId)) {
        blockNumber += codeBlocks.length;
        contentId = 'org-code-content-' + blockNumber;
      }

      var toggle = createCodeToggle(displayName, contentId);
      toolbar.className = 'org-code-toolbar';
      content.id = contentId;
      content.className = 'org-code-content';
      contentInner.className = 'org-code-content-inner';

      container.dataset.codeLanguage = language;
      toolbar.appendChild(toggle);
      toolbar.appendChild(button);
      container.insertBefore(toolbar, pre);
      container.insertBefore(content, pre);
      content.appendChild(contentInner);
      contentInner.appendChild(pre);

      function setCollapsed(collapsed) {
        container.classList.toggle('is-collapsed', collapsed);
        toggle.setAttribute('aria-expanded', String(!collapsed));
        toggle.setAttribute(
          'aria-label',
          (collapsed ? 'Expand ' : 'Collapse ') + displayName + ' code'
        );
        toggle.title = (collapsed ? 'Expand ' : 'Collapse ') + displayName + ' code';
        content.setAttribute('aria-hidden', String(collapsed));
      }

      setCollapsed(false);

      toggle.addEventListener('click', function () {
        setCollapsed(!container.classList.contains('is-collapsed'));
      });

      button.addEventListener('click', function () {
        clearTimeout(resetTimer);
        copyText(source).then(function () {
          setCopyState(button, 'success', 'Copied!', displayName);
          resetTimer = setTimeout(function () {
            setCopyState(button, '', '', displayName);
          }, 1600);
        }).catch(function () {
          setCopyState(button, 'error', 'Copy failed', displayName);
          resetTimer = setTimeout(function () {
            setCopyState(button, '', '', displayName);
          }, 2200);
        });
      });

      return {
        language: language,
        pre: pre,
        source: source
      };
    });

    loadStarryNight()
      .then(function (starryNightModule) {
        return starryNightModule.createStarryNight(starryNightModule.all, {
          getOnigurumaUrlFetch: function () {
            return new URL(
              'https://cdn.jsdelivr.net/npm/vscode-oniguruma@2.0.1/release/onig.wasm'
            );
          }
        });
      })
      .then(function (starryNight) {
        blockDetails.forEach(function (detail) {
          var highlighterLanguage = languageAliases[detail.language] || detail.language;
          var scope = starryNight.flagToScope(highlighterLanguage)
            || languageScopes[detail.language];

          if (!scope || starryNight.scopes().indexOf(scope) === -1) {
            detail.pre.dataset.highlightState = 'unsupported';
            return;
          }

          try {
            var tree = starryNight.highlight(detail.source, scope);
            var fragment = document.createDocumentFragment();
            appendHighlightedNode(fragment, tree);
            detail.pre.replaceChildren(fragment);
            detail.pre.classList.add('org-code-highlighted');
            detail.pre.dataset.highlightState = 'complete';
          } catch (error) {
            detail.pre.dataset.highlightState = 'failed';
          }
        });
      })
      .catch(function (error) {
        console.warn('Syntax highlighting is unavailable.', error);
        blockDetails.forEach(function (detail) {
          detail.pre.dataset.highlightState = 'unavailable';
        });
      });
  }

  function createCodeToggle(languageName, contentId) {
    var button = document.createElement('button');
    var indicator = document.createElement('span');
    var label = document.createElement('span');

    button.type = 'button';
    button.className = 'org-code-toggle';
    button.setAttribute('aria-controls', contentId);

    indicator.className = 'org-code-toggle-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    label.className = 'org-code-language';
    label.textContent = languageName;

    button.appendChild(indicator);
    button.appendChild(label);
    return button;
  }

  function loadStarryNight() {
    /*
     * esm.sh 3.10.0 bundles vscode-textmate as a CommonJS module marked
     * __esModule, but then reads it through `.default`. Patch that pinned
     * generated bundle before importing it. Loading from a blob also lets us
     * remove its otherwise unnecessary Node process shim.
     */
    var bundleUrl =
      'https://esm.sh/@wooorm/starry-night@3.10.0/es2022/starry-night.bundle.mjs';
    var processImport = 'import __Process$ from "/node/process.mjs";';
    var interop = 'var En=Nn(Uu()),Yu=Nn(Zu());';

    return fetch(bundleUrl)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Highlighter download failed with status ' + response.status);
        }
        return response.text();
      })
      .then(function (source) {
        if (source.indexOf(processImport) === -1 || source.indexOf(interop) === -1) {
          throw new Error('Unexpected highlighter bundle format');
        }

        source = source
          .replace(processImport, 'const __Process$={env:{}};')
          .replace(interop, interop + 'En.default=En;Yu.default=Yu;');

        var moduleUrl = URL.createObjectURL(
          new Blob([source], { type: 'text/javascript' })
        );

        return import(moduleUrl).finally(function () {
          URL.revokeObjectURL(moduleUrl);
        });
      });
  }

  function createCopyButton(languageName) {
    var button = document.createElement('button');
    var copyLabel = document.createElement('span');
    var status = document.createElement('span');

    button.type = 'button';
    button.className = 'org-code-copy';
    button.title = 'Copy ' + languageName + ' code';
    button.setAttribute('aria-label', 'Copy ' + languageName + ' code');

    copyLabel.className = 'org-code-copy-label';
    copyLabel.textContent = 'Copy';
    status.className = 'org-code-copy-status';
    status.setAttribute('aria-live', 'polite');

    button.appendChild(copyLabel);
    button.appendChild(status);
    return button;
  }

  function setCopyState(button, state, message, languageName) {
    var status = button.querySelector('.org-code-copy-status');

    if (state) {
      button.dataset.copyState = state;
      button.setAttribute('aria-label', message);
    } else {
      button.removeAttribute('data-copy-state');
      button.setAttribute('aria-label', 'Copy ' + languageName + ' code');
    }
    status.textContent = message;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var textarea = document.createElement('textarea');
      var copied = false;

      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        copied = document.execCommand('copy');
      } catch (error) {
        copied = false;
      }

      textarea.remove();
      if (copied) {
        resolve();
      } else {
        reject(new Error('Clipboard access is unavailable'));
      }
    });
  }

  function appendHighlightedNode(parent, node) {
    if (node.type === 'text') {
      parent.appendChild(document.createTextNode(node.value));
      return;
    }

    if (node.type === 'root') {
      node.children.forEach(function (child) {
        appendHighlightedNode(parent, child);
      });
      return;
    }

    if (node.type !== 'element' || node.tagName !== 'span') return;

    var element = document.createElement('span');
    var classNames = node.properties && node.properties.className;
    if (Array.isArray(classNames)) {
      element.className = classNames.join(' ');
    } else if (typeof classNames === 'string') {
      element.className = classNames;
    }

    node.children.forEach(function (child) {
      appendHighlightedNode(element, child);
    });
    parent.appendChild(element);
  }

  function formatLanguageName(language) {
    return language
      .split('-')
      .map(function (part) {
        return part ? part.charAt(0).toUpperCase() + part.slice(1) : '';
      })
      .join(' ');
  }

  var footnoteRoot = document.getElementById('footnotes');
  var contentRoot = document.getElementById('content');
  var footnoteReferences = Array.prototype.slice.call(
    document.querySelectorAll('a.footref[href^="#fn."]')
  );

  if (!footnoteRoot || !contentRoot || !footnoteReferences.length) return;

  var footnotesById = {};
  footnoteRoot.querySelectorAll('.footdef').forEach(function (definition) {
    var numberLink = definition.querySelector('a.footnum[id]');
    var paragraph = definition.querySelector('.footpara');

    if (numberLink && paragraph) {
      footnotesById[numberLink.id] = {
        number: numberLink.textContent.trim(),
        content: paragraph
      };
    }
  });

  var mappedReferences = footnoteReferences.map(function (reference) {
    var targetId = decodeURIComponent(reference.getAttribute('href').slice(1));
    var definition = footnotesById[targetId];
    return definition ? { reference: reference, definition: definition } : null;
  }).filter(Boolean);

  if (!mappedReferences.length) return;

  var configuredStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--org-footnote-style')
    .trim()
    .replace(/^["']|["']$/g, '');
  if (configuredStyle !== 'card' && configuredStyle !== 'sidenote') {
    configuredStyle = 'sidenote';
  }

  var wideViewport = window.matchMedia('(min-width: 1280px)');
  var sidenoteLayer = document.createElement('div');
  var card = document.createElement('aside');
  var cardId = 'org-footnote-card';
  var activeReference = null;
  var closeTimer = null;
  var cardPinned = false;
  var layoutFrame = null;

  sidenoteLayer.className = 'org-sidenote-layer';
  sidenoteLayer.setAttribute('aria-hidden', 'true');
  contentRoot.appendChild(sidenoteLayer);

  card.id = cardId;
  card.className = 'org-footnote-card';
  card.setAttribute('role', 'tooltip');
  card.setAttribute('aria-hidden', 'true');
  document.body.appendChild(card);

  mappedReferences.forEach(function (item, index) {
    var note = document.createElement('aside');
    var number = document.createElement('span');
    var noteContent = item.definition.content.cloneNode(true);

    note.className = 'org-sidenote';
    note.dataset.referenceIndex = String(index);
    number.className = 'org-sidenote-number';
    number.textContent = item.definition.number;
    note.appendChild(number);
    note.appendChild(noteContent);
    sidenoteLayer.appendChild(note);
    item.sidenote = note;

    item.reference.setAttribute('aria-haspopup', 'true');
    item.reference.setAttribute('aria-expanded', 'false');

    item.reference.addEventListener('mouseenter', function () {
      if (effectiveStyle() === 'card') openCard(item, false);
    });
    item.reference.addEventListener('mouseleave', scheduleClose);
    item.reference.addEventListener('focus', function () {
      if (effectiveStyle() === 'card') openCard(item, false);
    });
    item.reference.addEventListener('blur', scheduleClose);
    item.reference.addEventListener('click', function (event) {
      if (effectiveStyle() !== 'card') return;

      event.preventDefault();
      if (activeReference === item.reference && cardPinned) {
        closeCard();
      } else {
        openCard(item, true);
      }
    });
  });

  function effectiveStyle() {
    return configuredStyle === 'sidenote' && wideViewport.matches
      ? 'sidenote'
      : 'card';
  }

  function applyStyle() {
    var style = effectiveStyle();
    document.documentElement.dataset.orgFootnoteStyle = style;
    closeCard();

    if (style === 'sidenote') {
      requestSidenoteLayout();
    } else {
      contentRoot.style.removeProperty('--org-sidenote-overflow');
    }
  }

  function requestSidenoteLayout() {
    if (layoutFrame !== null) cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(function () {
      layoutFrame = null;
      layoutSidenotes();
    });
  }

  function layoutSidenotes() {
    if (effectiveStyle() !== 'sidenote') return;

    var contentRect = contentRoot.getBoundingClientRect();
    var previousBottom = 0;
    var gap = 12;

    mappedReferences.forEach(function (item) {
      var referenceRect = item.reference.getBoundingClientRect();
      var desiredTop = referenceRect.top - contentRect.top;
      var top = Math.max(desiredTop, previousBottom);
      item.sidenote.style.top = Math.round(top) + 'px';
      previousBottom = top + item.sidenote.getBoundingClientRect().height + gap;
    });

    var overflow = Math.max(0, previousBottom - contentRect.height);
    contentRoot.style.setProperty('--org-sidenote-overflow', Math.ceil(overflow) + 'px');
  }

  function fillCard(item) {
    var number = document.createElement('span');
    var noteContent = item.definition.content.cloneNode(true);

    card.replaceChildren();
    number.className = 'org-footnote-card-number';
    number.textContent = item.definition.number + '.';
    card.appendChild(number);
    card.appendChild(noteContent);
  }

  function openCard(item, pinned) {
    clearTimeout(closeTimer);
    if (activeReference && activeReference !== item.reference) {
      activeReference.setAttribute('aria-expanded', 'false');
      activeReference.removeAttribute('aria-describedby');
    }

    activeReference = item.reference;
    cardPinned = pinned;
    fillCard(item);
    activeReference.setAttribute('aria-expanded', 'true');
    activeReference.setAttribute('aria-describedby', cardId);
    card.setAttribute('aria-hidden', 'false');
    card.classList.add('is-open');
    requestAnimationFrame(positionCard);
  }

  function positionCard() {
    if (!activeReference || !card.classList.contains('is-open')) return;

    var margin = 12;
    var gap = 9;
    var referenceRect = activeReference.getBoundingClientRect();
    var cardRect = card.getBoundingClientRect();
    var roomBelow = window.innerHeight - referenceRect.bottom - gap - margin;
    var roomAbove = referenceRect.top - gap - margin;
    var placeAbove = cardRect.height > roomBelow && roomAbove > roomBelow;
    var left = referenceRect.left + referenceRect.width / 2 - cardRect.width / 2;
    var top = placeAbove
      ? referenceRect.top - cardRect.height - gap
      : referenceRect.bottom + gap;

    left = Math.max(margin, Math.min(left, window.innerWidth - cardRect.width - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - cardRect.height - margin));

    card.dataset.placement = placeAbove ? 'above' : 'below';
    card.style.left = Math.round(left) + 'px';
    card.style.top = Math.round(top) + 'px';
  }

  function scheduleClose() {
    if (cardPinned) return;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () {
      if (!card.matches(':hover')) closeCard();
    }, 80);
  }

  function closeCard() {
    clearTimeout(closeTimer);
    if (activeReference) {
      activeReference.setAttribute('aria-expanded', 'false');
      activeReference.removeAttribute('aria-describedby');
    }
    card.classList.remove('is-open');
    card.setAttribute('aria-hidden', 'true');
    activeReference = null;
    cardPinned = false;
  }

  card.addEventListener('mouseenter', function () {
    clearTimeout(closeTimer);
  });
  card.addEventListener('mouseleave', scheduleClose);
  card.addEventListener('focusin', function () {
    clearTimeout(closeTimer);
  });
  card.addEventListener('focusout', scheduleClose);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      var referenceToFocus = activeReference;
      closeCard();
      if (referenceToFocus) referenceToFocus.focus();
    }
  });

  document.addEventListener('pointerdown', function (event) {
    if (!cardPinned || !activeReference) return;
    if (card.contains(event.target) || activeReference.contains(event.target)) return;
    closeCard();
  });

  window.addEventListener('scroll', function () {
    if (activeReference) positionCard();
  }, { passive: true });

  window.addEventListener('resize', function () {
    if (effectiveStyle() === 'sidenote') requestSidenoteLayout();
    if (activeReference) positionCard();
  });

  if (typeof wideViewport.addEventListener === 'function') {
    wideViewport.addEventListener('change', applyStyle);
  } else {
    wideViewport.addListener(applyStyle);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(requestSidenoteLayout);
  }

  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(requestSidenoteLayout).observe(contentRoot);
  }

  document.documentElement.classList.add('org-footnotes-enhanced');
  applyStyle();
});
