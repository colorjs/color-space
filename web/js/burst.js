// The burst – the hero's background, drawn by one fragment shader on one canvas: every hue as a ray from a centre,
// each ray one width end to end, so where they crowd at the centre they melt into a cloud of hue and outward they part.
// Where rays pass closer than a few pixels apart a pixel takes their mean coverage (width over spacing) – thin rays
// would otherwise alias into moiré.
// Ray k carries hue k·360/n at the current color's OKLCH lightness and chroma (Ottosson's OKLab → linear sRGB,
// clipped), the current hue at the top – until the burst turns, its colors riding along. It fades out toward its reach, and toward the hero's foot – behind the pinned
// row, which sits on it. One quad a frame, no DOM – the page's styles never hear of it.
const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'
const FS = `precision highp float;
uniform vec2 uC,uS;uniform float uH,uL,uK,uN,uW,uR,uB,uA,uP;
vec3 enc(vec3 c){c=clamp(c,0.,1.);return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
vec3 oklch(float L,float C,float h){float a=C*cos(h),b=C*sin(h);
 vec3 l=vec3(L+.3963377774*a+.2158037573*b,L-.1055613458*a-.0638541728*b,L-.0894841775*a-1.291485548*b);l=l*l*l;
 return enc(vec3(4.0767416621*l.x-3.3077115913*l.y+.2309699292*l.z,-1.2684380046*l.x+2.6097574011*l.y-.3413193965*l.z,-.0041960863*l.x-.7034186147*l.y+1.707614701*l.z));}
void main(){vec2 q=vec2(gl_FragCoord.x,uS.y-gl_FragCoord.y),d=q-uC;float r=length(d),t=atan(d.x,-d.y)+uP,h=t+uH;
 float s=6.2831853/uN,dh=mod(t+s*.5,s)-s*.5,cov=clamp(uW*.5-r*abs(sin(dh))+.5,0.,1.),sp=r*s;
 cov=mix(min(1.,uW/sp),cov,smoothstep(1.,3.,sp));
 float a=cov*(1.-smoothstep(uR*.12,uR,r))*(1.-smoothstep(uB*.7,uB,q.y))*uA;
 gl_FragColor=vec4(oklch(uL,uK,h)*a,a);}`

/** A burst on `cv`, or null where WebGL is not to be had. draw() takes the frame's numbers (device pixels, radians). */
export function burst(cv) {
	const gl = cv.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true }); if (!gl) return null
	const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s }
	const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr)
	if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null
	gl.useProgram(pr); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
	const at = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0)
	const u = Object.fromEntries(['uC', 'uS', 'uH', 'uL', 'uK', 'uN', 'uW', 'uR', 'uB', 'uA', 'uP'].map(k => [k, gl.getUniformLocation(pr, k)]))
	return {
		/** cx, cy – the centre; hue – at the top; L, C – the band; n – rays; w – a ray's width;
		 *  reach – where it is gone; foot – the y it is gone by; alpha – its strength; spin – the burst's turn, its
		 *  colors riding along the rays */
		draw({ cx, cy, hue, L, C, n, w, reach, foot, alpha, spin = 0 }) {
			gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
			gl.uniform2f(u.uC, cx, cy); gl.uniform2f(u.uS, cv.width, cv.height); gl.uniform1f(u.uH, hue); gl.uniform1f(u.uL, L); gl.uniform1f(u.uK, C)
			gl.uniform1f(u.uN, n); gl.uniform1f(u.uW, w); gl.uniform1f(u.uR, reach); gl.uniform1f(u.uB, foot); gl.uniform1f(u.uA, alpha); gl.uniform1f(u.uP, spin)
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4) } }
}
