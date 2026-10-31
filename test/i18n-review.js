import test, { is, ok } from 'tst'
import { changes, review } from '../scripts/i18n-review.js'

test('i18n — review: empty, unchanged, metadata and format migration', () => {
	is(changes({}, {}), [], 'empty catalogs have no changes')
	is(review({}, {}), 'No English strings changed.\n', 'zero-work report')
	is(changes({ '@meta': { name: 'English' }, a: { t: 'one', h: 'old' } }, { a: 'one' }), [], 'metadata and the format migration do not request retranslation')
	is(changes({ a: 'one' }, { a: 'one' }), [], 'A → A has no changes')
	is(changes({ a: 'one' }, { a: 'two' }), ['a'], 'A → different B requests review')
})

test('i18n — review: additions, removals, unchanged and edited translations', () => {
	const before = { a: 'one', removed: 'gone' }, after = { a: 'two', added: 'new' }
	is(changes(before, after), ['a', 'added', 'removed'], 'changed, new and removed keys in stable order')
	const report = review(before, after, {
		ru: { before: { a: { t: 'один', h: 'old' } }, after: { a: 'один' } },
		de: { before: { a: 'eins' }, after: { a: 'zwei', added: 'neu' } },
		fr: { before: {}, after: {} }
	})
	ok(report.includes('Before: one\nAfter: two'), 'the old and new English are visible')
	ok(report.includes('Review unchanged translations: ru.'), 'an unchanged native translation needs review')
	is(report.includes('Review unchanged translations: de'), false, 'an edited translation is not flagged as unchanged')
	ok(report.includes('Missing translations: ru, fr.'), 'a new key lists locales without translations')
	ok(report.includes('removed (removed)') && report.includes('After: (removed)'), 'deleted English is reported without requesting translation')
})

test('i18n — review: source text cannot inject markup into the summary', () => {
	const report = review({ a: 'safe' }, { a: '<script>bad & worse</script>' })
	ok(report.includes('&lt;script&gt;bad &amp; worse&lt;/script&gt;'), 'English markup is shown as text')
	is(report.includes('<script>'), false, 'the summary contains no source HTML element')
})
