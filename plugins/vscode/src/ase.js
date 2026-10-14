/**
 * Adobe Swatch Exchange (.ase), read only: the swatches Illustrator, Photoshop and InDesign exchange. Big-endian: "ASEF",
 * version 1.0 (two uint16), a uint32 block count; then blocks – a uint16 type (0x0001 a color, 0xC001/0xC002 a group's
 * start and end), a uint32 length, and for a color its name (a uint16 count of UTF-16 units, the 0 included), its model
 * (4 ASCII: "RGB ", "CMYK", "LAB ", "Gray"), its values (float32) and a uint16 type (global, spot, normal).
 * @see http://www.selapa.net/swatches/colors/fileformats.php#adobe_ase
 *
 * Only RGB swatches are read, as sRGB 0–1 (the file names no profile; sRGB is the usual one). CMYK and Gray depend on the
 * document's profiles, which the file doesn't carry, and no source states LAB's scale: those are counted as skipped,
 * never guessed.
 */
export function readAse(bytes) {
	const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), ascii = (o, n) => String.fromCharCode(...bytes.subarray(o, o + n))
	if (bytes.length < 12 || ascii(0, 4) !== 'ASEF') return null
	const colors = [], n = dv.getUint32(8)
	let skipped = 0, o = 12
	for (let b = 0; b < n && o + 6 <= bytes.length; b++) {
		const type = dv.getUint16(o), len = dv.getUint32(o + 2), s = o + 6
		o = s + len
		if (type !== 1 || o > bytes.length) continue
		const units = dv.getUint16(s), m = s + 2 + units * 2
		if (m + 4 + 12 > o) { skipped++; continue }   // a name or model past the block's own length: malformed, not read
		let name = ''
		for (let i = 0; i < units - 1; i++) name += String.fromCharCode(dv.getUint16(s + 2 + i * 2))
		if (ascii(m, 4) !== 'RGB ') { skipped++; continue }
		colors.push({ name, space: 'rgb', v: [0, 1, 2].map(i => dv.getFloat32(m + 4 + i * 4) * 255), alpha: 1 })
	}
	return { colors, skipped }
}
