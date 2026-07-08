/**
 * ERIMM RGB — Kodak's Extended Reference Input Medium Metric RGB, a log-encoded,
 * scene-referred format standardized in ISO 22028-3 as the extended-range member of
 * the ROMM/RIMM family. It shares the wide ROMM (ProPhoto) primaries and D50 white
 * point with ProPhoto RGB, but its logarithmic curve lets it hold a much larger
 * range of scene exposures — well beyond diffuse white — than a linear or
 * gamma-encoded format could, making it suited to archiving raw, high-dynamic-range
 * scene data.
 *
 * @see {@link https://www.iso.org/standard/58005.html} ISO 22028-3 / Spaulding et al. 2000
 * @year 2000
 * @by Kodak (Spaulding, Woolfe & Giorgianni)
 * @use Archival log scene-referred encoding for raw HDR scene data; niche/historical, part of the Kodak ROMM/RIMM family.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D50
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Scene exposures from 0.001 to 316.2 relative to diffuse white 1.0. Linear toe
// below e·0.001. 18% grey → 0.4101.
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
