// The color field's name search (web/js/namesearch.js): how a name meets what is typed, a typo forgiven, a name kept once
import test, { is } from 'tst'
import { findNames, edits } from '../web/js/namesearch.js'

const L = [['css', [['tomato', [255, 99, 71]], ['dodgerblue', [30, 144, 255]], ['turquoise', [64, 224, 208]]]],
	['xkcd', [['tomato red', [236, 45, 1]], ['dodger blue', [62, 130, 252]], ['dusky blue', [71, 95, 148]]]]]
const names = (q, n) => findNames(q, L, n).map(x => x.src + ':' + x.name)

test('namesearch: whole, start, a word\'s start, inside – shorter first', () => {
	is(names('tom'), ['css:tomato', 'xkcd:tomato red'])
	is(names('blue'), ['xkcd:dusky blue', 'xkcd:dodger blue'], 'a word\'s start, shorter first – and dodgerblue once, as the spelling that meets it best')
})
test('namesearch: spaces aside, a name in two lists kept once – from the first', () => {
	is(names('dodger blue'), ['css:dodgerblue'])
})
test('namesearch: a typo forgiven with few found – one edit up to six letters, two from seven', () => {
	is(names('turqoise'), ['css:turquoise'])
	is(names('tomatp'), ['css:tomato', 'xkcd:tomato red'])
	is(edits('turqoise', 'turquoise', 2), 1); is(edits('abcd', 'abdc', 1), 1, 'a transposition is one edit'); is(edits('abc', 'xyz', 1), 2, 'given up past the bound')
})
