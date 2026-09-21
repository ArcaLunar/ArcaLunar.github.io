/* Generic collapsible nested lists (see foldable-lists.css): replaces the
 * bullet with a rotating triangle and toggles an .expanded class on click.
 * Runs on every page — the homepage's All Notes tree, and any plain nested
 * list inside an article. */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.org-ul li').forEach(function (li) {
    // The All Notes tree drives its own folders as drill-down navigation
    // (see enhanceHomeIndex in home.js), not expand-in-place.
    if (li.closest('.site-index')) return;

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
});
