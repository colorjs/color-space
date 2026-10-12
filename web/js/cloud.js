// The cloud – the hero's background, and the social card's (scripts/generate-og.js): seven soft blobs of hue laid out
// as a wheel round the words – cyan and green to the left, yellow and red over the title, pink below, violet and blue
// to the right. The hues ride on the current color: none picked, the wheel keeps its order with the current hue in
// the lead (as the color roams, the cloud turns); picked, the blobs gather round its hue (spread 1 → .35), stronger.
// One fragment shader, one quad: each pixel the blobs' mean in OKLab (Ottosson's OKLab → linear sRGB, clipped),
// weighted by a heavy-tailed falloff – a Gaussian's would switch colors on a hard line between two far blobs – and as
// opaque as their Gaussians are dense there (1 − e^−density: the paper shows between them), fading out from the box's
// middle (the window's sides and corners nearly bare, the left the more – the rail's side) and toward the foot.

/** x, y – the centre, of the box's width and height; r – the radius, of the side of a 1.9 : 1 card as large as the box
 *  (on the 1200 × 630 card, of its width – a long low hero gets smaller blobs, not taller ones); hue – its place on
 *  the wheel; dL – its lightness, off the cloud's */
export const BLOBS = [[.117, .413, .275, 190, 0], [.258, .095, .217, 140, .02], [.433, .333, .25, 70, 0], [.533, .175, .233, 10, -.02],
	[.4, .635, .2, 340, 0], [.733, .476, .267, 285, -.02], [.883, .206, .233, 240, .02]]
const LEAD = 10   // the blob that wears the current hue itself – the one over the title

/** Each blob's OKLCH [L, C, h°] for the cloud's lightness L and chroma C, the current hue (degrees) and spread (1 – the wheel, < 1 – gathered). */
export const tints = ({ hue, L, C, spread }) => BLOBS.map(([, , , h, dL]) => [L + dL, C, hue + (((h - LEAD) % 360 + 540) % 360 - 180) * spread])

const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'
const FS = `precision highp float;
uniform vec2 uS;uniform vec3 uP[7],uK[7];uniform float uA,uF,uR;
vec3 enc(vec3 c){c=clamp(c,0.,1.);return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
vec3 rgb(vec3 k){vec3 l=vec3(k.x+.3963377774*k.y+.2158037573*k.z,k.x-.1055613458*k.y-.0638541728*k.z,k.x-.0894841775*k.y-1.291485548*k.z);l=l*l*l;
 return enc(vec3(4.0767416621*l.x-3.3077115913*l.y+.2309699292*l.z,-1.2684380046*l.x+2.6097574011*l.y-.3413193965*l.z,-.0041960863*l.x-.7034186147*l.y+1.707614701*l.z));}
void main(){vec2 q=vec2(gl_FragCoord.x,uS.y-gl_FragCoord.y);vec3 m=vec3(0.);float s=0.;
 float t=0.;for(int i=0;i<7;i++){vec2 d=(q-uP[i].xy)/uP[i].z;float e=dot(d,d),c=1./(1.+3.*e);c*=c;m+=c*uK[i];t+=c;s+=exp(-3.*e);}
 vec2 e=q-uS*.5;e.x*=e.x<0.?1.3:1.;
 float a=(1.-exp(-1.6*s))*uA*(1.-smoothstep(.3*uR,uR,length(e)))*(1.-smoothstep(uF*.7,uF,q.y));
 gl_FragColor=vec4(rgb(m/t)*a,a);}`

/** A cloud on `cv`, or null where WebGL is not to be had. draw() takes the frame's numbers: the state for tints(),
 *  grow – the blobs' size (0 – 1), alpha – the cloud's strength, foot – the y it is gone by (device pixels). */
export function cloud(cv) {
	const gl = cv.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true }); if (!gl) return null
	const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s }
	const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr)
	if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null
	gl.useProgram(pr); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
	const at = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0)
	const u = Object.fromEntries(['uS', 'uP', 'uK', 'uA', 'uF', 'uR'].map(k => [k, gl.getUniformLocation(pr, k)]))
	return {
		draw({ hue, L, C, spread, grow = 1, alpha = 1, foot = cv.height }) {
			const W = cv.width, H = cv.height, R = Math.sqrt(1.9 * W * H) * grow
			gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
			gl.uniform2f(u.uS, W, H); gl.uniform1f(u.uA, alpha); gl.uniform1f(u.uF, foot); gl.uniform1f(u.uR, .7 * Math.max(W, 1.9 * H))
			gl.uniform3fv(u.uP, BLOBS.flatMap(([x, y, r]) => [x * W, y * H, Math.max(1, r * R)]))
			gl.uniform3fv(u.uK, tints({ hue, L, C, spread }).flatMap(([l, c, h]) => [l, c * Math.cos(h * Math.PI / 180), c * Math.sin(h * Math.PI / 180)]))
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4) } }
}
