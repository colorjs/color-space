/**
 * http://seer.ufrgs.br/rita/article/viewFile/rita_v16_n2_p141/7428
 *
 * @module color-space/hsm
 */
import rgb from './rgb.js';

var hsm = {
    name: 'hsm',
    min: [0, 0, 0],
    max: [1, 1, 1],
    channel: ['hue', 'saturation', 'mixture']
};

export default hsm


/**
 * HSM to RGB
 *
    Given an HSM color (with h, s, m ∈ [0,1]) returns the corresponding RGB
    color (with r, g, b ∈ [0,1]). This implementation uses an alternate derivation, since the one in paper is incorrect.
    The idea is that the original RGB is recovered as:
    [r, g, b] = m + d,
    where d = s * D(m) * [cos(omega)*u + sin(omega)*v],
    with omega = 2π * h.
    We choose reference vector u as the normalized version of (3, -4, -4) (this is
    consistent with the forward computation of hue in the paper) and then take v to be
    an orthonormal vector in the same plane. The plane is defined by the constraint
    4*(r-m) + 2*(g-m) + (b-m) = 0.
 *
 * @param {Array<number>} hsm Channel values
 *
 * @return {Array<number>} RGB channel values
 */
hsm.rgb = function ([h, s, m]) {
    // 1. Compute the normalization denominator D(m) piecewise
    let D;
    if (m >= 0 && m <= 1/7) {
        D = Math.sqrt((0 - m)**2 + (0 - m)**2 + (7 - m)**2);
    } else if (m > 1/7 && m <= 3/7) {
        const term = (7 * m - 1) / 2;
        D = Math.sqrt((0 - m)**2 + (term - m)**2 + (1 - m)**2);
    } else if (m > 3/7 && m <= 0.5) {
        const term = (7 * m - 3) / 2;
        D = Math.sqrt((term - m)**2 + (1 - m)**2 + (1 - m)**2);
    } else if (m > 0.5 && m <= 4/7) {
        const term = (7 * m) / 4;
        D = Math.sqrt((term - m)**2 + (0 - m)**2 + (0 - m)**2);
    } else if (m > 4/7 && m <= 6/7) {
        const term = (7 * m - 4) / 2;
        D = Math.sqrt((1 - m)**2 + (term - m)**2 + (0 - m)**2);
    } else if (m > 6/7 && m <= 1) {
        const term = 7 * m - 6;
        D = Math.sqrt((1 - m)**2 + (1 - m)**2 + (term - m)**2);
    } else {
        D = 1; // Fallback (invalid m)
    }

    // 2. Compute the chromatic magnitude R_val = s * D(m)
    const R_val = s * D;

    // 3. Define orthonormal basis vectors u and v in the deviation plane
    const u = {
        x: 3 / Math.sqrt(41),   // Normalized (3, -4, -4)
        y: -4 / Math.sqrt(41),
        z: -4 / Math.sqrt(41)
    };
    const v = {
        x: -4 / Math.sqrt(861), // Orthonormal complement (-4, 19, -22)
        y: 19 / Math.sqrt(861),
        z: -22 / Math.sqrt(861)
    };

    // 4. Compute angle omega = 2πh
    const omega = 2 * Math.PI * h;

    // 5. Calculate chromatic offset components
    const dx = R_val * (Math.cos(omega) * u.x + Math.sin(omega) * v.x);
    const dy = R_val * (Math.cos(omega) * u.y + Math.sin(omega) * v.y);
    const dz = R_val * (Math.cos(omega) * u.z + Math.sin(omega) * v.z);

    // 6. Reconstruct RGB values by adding m to deviations
    let r = m + dx;
    let g = m + dy;
    let b = m + dz;

    // 7. Clamp to [0, 1] and scale to [0, 255]
    r = (Math.max(0, Math.min(1, r)) * 255);
    g = (Math.max(0, Math.min(1, g)) * 255);
    b = (Math.max(0, Math.min(1, b)) * 255);

    return [r, g, b];
};


/**
 * RGB to HSM
 *
 * @param {Array<number>} rgb Channel values
 *
 * @return {Array<number>} HSM channel values
 */
rgb.hsm = function ([r, g, b]) {
    r /= 255, g /= 255, b /= 255;

    let m = (4 * r + 2 * g + b) / 7;

    // distance in the deviation space
    let dr = r - m, dg = g - m, db = b - m;
    let d = Math.sqrt(dr * dr + dg * dg + db * db);

    // calc hue based on the angle in the deviation plane.
    let theta = Math.acos(((3 * dr - 4 * dg - 4 * db) / Math.sqrt(41 * (dr * dr + dg * dg + db * db))) || 0);
    let h = (b <= g) ? theta / (2 * Math.PI) : 1 - theta / (2 * Math.PI);


    // Calculate saturation (s) based on the value of m
    let s;

    if (0 <= m && m <= 1 / 7) s = d / Math.sqrt((0 - m) ** 2 + (0 - m) ** 2 + (7 - m) ** 2);
    else if (1 / 7 < m && m <= 3 / 7) s = d / Math.sqrt((0 - m) ** 2 + ((7 * m - 1) / 2 - m) ** 2 + (1 - m) ** 2);
    else if (3 / 7 < m && m <= 1 / 2) s = d / Math.sqrt(((7 * m - 3) / 2 - m) ** 2 + (1 - m) ** 2 + (1 - m) ** 2);
    else if (1 / 2 < m && m <= 4 / 7) s = d / Math.sqrt(((7 * m) / 4 - m) ** 2 + (0 - m) ** 2 + (0 - m) ** 2);
    else if (4 / 7 < m && m <= 6 / 7) s = d / Math.sqrt((1 - m) ** 2 + ((7 * m - 4) / 2 - m) ** 2 + (0 - m) ** 2);
    else if (6 / 7 < m && m < 1) s = d / Math.sqrt((1 - m) ** 2 + (1 - m) ** 2 + ((7 * m - 6) - m) ** 2);
    else s = 0;

    // s = Math.max(0, Math.min(1, s))

    return [h, s, m]
};
