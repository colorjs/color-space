import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'

const MIME = {
	'.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
	'.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
	'.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8',
}

/** Start a loopback-only static server. Returns { origin, close }. */
export async function serve(root = process.cwd()) {
	root = resolve(root)
	const server = createServer(async (req, res) => {
		try {
			const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
			let file = normalize(join(root, pathname))
			if (file !== root && !file.startsWith(root + sep)) throw new Error('outside root')
			let info
			try { info = await stat(file) }
			catch (error) {
				if (extname(file)) throw error
				file += '.html'; info = await stat(file) // GitHub Pages extensionless route
			}
			if (info.isDirectory()) file = join(file, 'index.html')
			const body = await readFile(file)
			res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' })
			res.end(body)
		} catch {
			res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
			res.end('not found')
		}
	})
	await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok) })
	const { port } = server.address()
	return { origin: `http://127.0.0.1:${port}`, close: () => new Promise(ok => server.close(ok)) }
}
