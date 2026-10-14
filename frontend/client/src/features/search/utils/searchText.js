// Use indexOf instead of regex so search characters such as "(" and "*" stay literal.
function findMatch(text, query) {
	const index = text.toLowerCase().indexOf(query.toLowerCase());
	return index === -1 ? null : { index, length: query.length };
}

// Keep long posts readable by showing a short excerpt around the match.
export function getSnippet(text, query, maxLength = 80) {
	if (text.length <= maxLength) return text;

	const match = findMatch(text, query);
	const start = match ? Math.max(0, match.index - 25) : 0;
	const end = start + maxLength;

	return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

// Split matched text into surrounding text and the match for highlighting.
// Return null when the query is absent.
export function splitByMatch(text, query) {
	const match = findMatch(text, query);
	if (!match) return null;

	return {
		before: text.slice(0, match.index),
		match: text.slice(match.index, match.index + match.length),
		after: text.slice(match.index + match.length),
	};
}