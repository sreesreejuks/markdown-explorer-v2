export function highlightTextMatches(
  root: HTMLElement,
  query: string,
  matchIndex = 0,
  targetLine?: number,
): void {
  root.querySelectorAll('mark[data-folder-search]').forEach((mark) => {
    mark.replaceWith(document.createTextNode(mark.textContent || ''));
  });
  root.normalize();

  if (!query) return;

  const lowerQuery = query.toLocaleLowerCase();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => node.parentElement?.closest('[aria-hidden="true"]')
      ? NodeFilter.FILTER_REJECT
      : NodeFilter.FILTER_ACCEPT,
  });
  const textNodes: Text[] = [];
  let node: Node | null;

  while ((node = walker.nextNode())) {
    if (node.textContent?.toLocaleLowerCase().includes(lowerQuery)) {
      textNodes.push(node as Text);
    }
  }

  const marks: HTMLElement[] = [];
  textNodes.forEach((textNode) => {
    const text = textNode.textContent || '';
    const lowerText = text.toLocaleLowerCase();
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let match = lowerText.indexOf(lowerQuery);

    while (match !== -1) {
      fragment.append(document.createTextNode(text.slice(cursor, match)));
      const mark = document.createElement('mark');
      mark.dataset.folderSearch = 'true';
      mark.className = 'rounded-sm bg-yellow-200 px-0.5 text-inherit';
      mark.textContent = text.slice(match, match + query.length);
      marks.push(mark);
      fragment.append(mark);
      cursor = match + query.length;
      match = lowerText.indexOf(lowerQuery, cursor);
    }

    fragment.append(document.createTextNode(text.slice(cursor)));
    textNode.replaceWith(fragment);
  });

  if (marks.length) {
    const lineMark = targetLine
      ? root.querySelectorAll('.file-search-content > div')[targetLine - 1]?.querySelector('mark')
      : null;
    const activeMark = lineMark || marks[Math.min(matchIndex, marks.length - 1)];
    activeMark.classList.remove('bg-yellow-200');
    activeMark.classList.add('bg-orange-300');
    activeMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
