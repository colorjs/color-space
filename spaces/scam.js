/**
 * sCAM is the simple color appearance model Li and Luo published in 2024 together with
 * its uniform space sUCS. It takes D65-referred XYZ, adapts it to the viewing
 * conditions (adapting luminance, background, surround) and reads lightness,
 * colorfulness and hue off sUCS, with brightness, vividness, blackness, whiteness and
 * depth as further correlates. Its pipeline is shorter than CAM16's and inverts in
 * closed form; this is its J, M, h form.
 *
 * @see {@link https://doi.org/10.1364/OE.510196} Li & Luo 2024, Opt. Express 32(3), 3100-3122
 * @year 2024
 * @by Li & Luo
 * @use Lightweight appearance correlates (lightness, colorfulness, hue) on top of sUCS; new/emerging.
 * @channel {J} 0 100 Lightness
 * @channel {M} 0 25 Colorfulness
 * @channel {h} 0 360 Hue angle in degrees
 * @method appearance
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Reference: colour-science 0.4.7 colour/appearance/scam.py (XYZ_to_sCAM / sCAM_to_XYZ,
// "after confirmation with the author"); the Optica full text was not reachable here.
// Viewing conditions are cam16.js's: white D65 [95.047, 100, 108.883], L_A = 64/π·0.2
// cd/m², Y_b = 20, average surround (F = 1, c = 0.52, colour VIEWING_CONDITIONS_sCAM).
// sCAM's chromatic adaptation (colour chromatic_adaptation_Li2025, CAT16 + CIECAM02 D)
// maps the adopted white to TVS_D65_sCAM [0.95047, 1, 1.08883]·100·L_A/Y_b; with this
// D65 white that target is proportional to the source, so the transform is the identity
// for any D and sCAM reduces to an edge on sUCS:
//   C   = ln(1 + 0.0447·hypot(a, b)) / 0.0252          (sUCS chroma)
//   J   = 100·(I/100)^(c·z),  z = 1.48 + √(Y_b/Y_w)
//   F_L = 0.1710·L_A^(1/3) / (1 − 0.4934·e^(−0.9934·L_A))
//   M   = C·F_L^0.1·e_t·F / J^0.27,  e_t = 1 + 0.06·cos(110° + h)
// J = 0 gives M = 0 (colour's sdiv zero conversion). M reaches ≈ 19.9 over sRGB and ≈ 23.5
// over BT.2020 under these conditions, hence 0–25.
import sucs from './sucs.js';
import { spow, cartToPolar, polarToCart } from '../util.js';

const scam = { name: 'scam', range: [[0, 100], [0, 25], [0, 360]] };

const LA = 64 / Math.PI * 0.2, Yb = 20, F = 1, c = 0.52;
const cz = c * (1.48 + Math.sqrt(Yb / 100));
const FL = 0.1710 * Math.cbrt(LA) / (1 - 0.4934 * Math.exp(-0.9934 * LA));
const kM = Math.pow(FL, 0.1) * F;
const et = h => 1 + 0.06 * Math.cos((110 + h) * Math.PI / 180);

// sUCS Iab -> sCAM J, M, h
sucs.scam = (I, a, b) => {
	const [, Cab, h] = cartToPolar(I, a, b);
	const C = Math.log(1 + 0.0447 * Cab) / 0.0252;
	const J = 100 * spow(I / 100, cz);
	return [J, J === 0 ? 0 : C * kM * et(h) / spow(J, 0.27), h];
};

// sCAM J, M, h -> sUCS Iab
scam.sucs = (J, M, h) => {
	const C = M * spow(J, 0.27) / (kM * et(h));
	return polarToCart(100 * spow(J / 100, 1 / cz), (Math.exp(0.0252 * C) - 1) / 0.0447, h);
};

export default scam;
