/**
 * ANLAB (Adams-Nickerson) color space
 *
 * The chromatic-valence opponent space (Adams 1942; Nickerson 1950) — the direct
 * historical precursor of CIELAB. Applies the Munsell value function to the adapted
 * tristimulus ratios, then opponent differences. This is the ANLAB-40 form under
 * CIE Illuminant C / 2°; CIELAB later replaced the (iterative) Munsell value with a
 * cube root and renormalised lightness to 100 — here white is L ≈ 9.2·V(100) ≈ 91.
 *
 * @see {@link https://onlinelibrary.wiley.com/doi/10.1111/j.1478-4408.1970.tb02962.x} McLaren 1970 (ANLAB formula)
 * @see {@link https://opg.optica.org/josa/abstract.cfm?uri=josa-32-3-168} Adams 1942
 * @channel {L} 0 100 Lightness (9.2·V)
 * @channel {a} -100 100 Red-Green (40·ΔV)
 * @channel {b} -100 100 Yellow-Blue (16·ΔV)
 * @illuminant C
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';

const anlab = { name: 'anlab' };

const Cn = [98.074, 100, 118.232]; // Illuminant C 2° white (0-100)

// Munsell (Newhall 1943) value function V -> reflectance Y (0-~102.57), and its inverse
const valueToY = V => 1.2219 * V - 0.23111 * V ** 2 + 0.23951 * V ** 3 - 0.021009 * V ** 4 + 0.0008404 * V ** 5;
const YtoValue = Y => {
	let V = 10 * Math.cbrt(Math.max(Y, 0) / 100);
	for (let i = 0; i < 40; i++) {
		const f = valueToY(V) - Y;
		const d = 1.2219 - 0.46222 * V + 0.71853 * V ** 2 - 0.084036 * V ** 3 + 0.004202 * V ** 4;
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
