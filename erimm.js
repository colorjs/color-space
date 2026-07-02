/**
 * ERIMM RGB color space
 *
 * Extended Reference Input Medium Metric RGB (ISO 22028-3): the log-encoded,
 * extended-dynamic-range member of the ROMM/RIMM family — scene exposures from 0.001
 * to 316.2 (relative to diffuse white 1.0) over the ROMM (ProPhoto) primaries, D50.
 * A transfer over `prophoto-linear`, whose values it extends far past 1. Linear toe
 * below e·0.001. 18% grey → 0.4101.
 *
 * @see {@link https://www.iso.org/standard/58005.html} ISO 22028-3 / Spaulding et al. 2000
 * @channel {R} 0 1 Red (ERIMM)
 * @channel {G} 0 1 Green (ERIMM)
 * @channel {B} 0 1 Blue (ERIMM)
 * @illuminant D50
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
import prophotoLinear from './prophoto-linear.js';

const erimm = { name: 'erimm', range: [[0, 1], [0, 1], [0, 1]] };

const Emin = 0.001, Eclip = 316.2, Et = Math.E * Emin;
const lmin = Math.log(Emin), lclip = Math.log(Eclip), lt = Math.log(Et);
const yt = (lt - lmin) / (lclip - lmin); // code value at the toe junction
const enc = X => X < Et ? yt * X / Et : (Math.log(X) - lmin) / (lclip - lmin);
const dec = y => y < yt ? y / yt * Et : Math.exp(y * (lclip - lmin) + lmin);

erimm['prophoto-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
prophotoLinear.erimm = (r, g, b) => [enc(r), enc(g), enc(b)];

export default erimm;
