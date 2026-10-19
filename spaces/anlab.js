/**
 * ANLAB is the chromatic-valence opponent space Adams developed in 1942 and Nickerson extended
 * in 1950, the direct ancestor of CIELAB. It runs each adapted tristimulus ratio through the
 * Munsell Renotation System's empirical value function, then takes differences of the results
 * to get lightness and two opponent channels. In 1976 CIELAB kept that logic but replaced the
 * iterative Munsell function with a closed-form cube root.
 *
 * @see {@link https://onlinelibrary.wiley.com/doi/10.1111/j.1478-4408.1970.tb02962.x} McLaren 1970 (ANLAB formula)
 * @see {@link https://opg.optica.org/josa/abstract.cfm?uri=josa-32-3-168} Adams 1942
 * @year 1942
 * @by Elliot Q. Adams (ext. Dorothy Nickerson, 1950)
 * @use Industrial color-difference measurement; superseded by CIELAB and CIEDE2000.
 * @successor lab CIELAB kept its opponent logic and swapped the Munsell function for a cube root
 * @channel {L} 0 100 Lightness
 * @channel {a} -100 100 Red-Green
 * @channel {b} -100 100 Yellow-Blue
 * @method opponent
 * @encoding perceptual
 * @illuminant C
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// This is the ANLAB-40 form (illuminant C, 2° observer). Because L is 9.2·V(Y)
// rather than a renormalized 0-100 scale, white resolves to L ≈ 9.2·V(100) ≈ 91,
// not 100.
import xyz from './xyz.js';

const anlab = { name: 'anlab',
	range: [[0, 100], [-100, 100], [-100, 100]] };

const Cn = [98.074, 100, 118.232]; // Illuminant C 2° white (0-100)

// Munsell (Newhall 1943) value function V -> reflectance Y (0-~102.57), and its inverse
// Y = 1.2219V − 0.23111V² + 0.23951V³ − 0.021009V⁴ + 0.0008404V⁵, in Horner form (V8 reduces V ** 2 to a multiply, not V ** 3…5)
const valueToY = V => V * (1.2219 + V * (-0.23111 + V * (0.23951 + V * (-0.021009 + V * 0.0008404))));
const YtoValue = Y => {
	let V = 10 * Math.cbrt(Math.max(Y, 0) / 100);
	for (let i = 0; i < 40; i++) {
		const f = valueToY(V) - Y;
		const d = 1.2219 + V * (-0.46222 + V * (0.71853 + V * (-0.084036 + V * 0.004202)));
		V -= f / d; if (Math.abs(f) < 1e-9) break;
	}
	return V;
};

// XYZ (0-100, Illuminant C) -> ANLAB
xyz.anlab = (X, Y, Z) => {
	const Vx = YtoValue(100 * X / Cn[0]), Vy = YtoValue(100 * Y / Cn[1]), Vz = YtoValue(100 * Z / Cn[2]);
	return [9.2 * Vy, 40 * (Vx - Vy), 16 * (Vy - Vz)];
};

// ANLAB -> XYZ (0-100)
anlab.xyz = (L, a, b) => {
	const Vy = L / 9.2, Vx = Vy + a / 40, Vz = Vy - b / 16;
	return [Cn[0] * valueToY(Vx) / 100, Cn[1] * valueToY(Vy) / 100, Cn[2] * valueToY(Vz) / 100];
};

export default anlab;
