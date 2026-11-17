const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 1900;
const ROOT_DIR = __dirname;
const SUBPROJECT_DIR = path.join(ROOT_DIR, '2026-redbull-rb22');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function resolveAssetPath(relativePath) {
    const primaryPath = path.resolve(ROOT_DIR, relativePath);
    if (primaryPath.startsWith(ROOT_DIR) && fs.existsSync(primaryPath) && fs.statSync(primaryPath).isFile()) {
        return primaryPath;
    }

    const fallbackPath = path.resolve(SUBPROJECT_DIR, relativePath);
    if (fallbackPath.startsWith(SUBPROJECT_DIR) && fs.existsSync(fallbackPath) && fs.statSync(fallbackPath).isFile()) {
        return fallbackPath;
    }

    return null;
}

const server = http.createServer((req, res) => {
    const safeUrl = decodeURIComponent((req.url || '/').split('?')[0]);
    const relativePath = safeUrl === '/' ? 'index.html' : safeUrl.replace(/^\/+/, '');
    const filePath = resolveAssetPath(relativePath);

    if (!filePath) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Archivo no encontrado');
        return;
    }

    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        }
        res.end('Error al leer el archivo');
    });
    stream.pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Node.js activo en http://localhost:${PORT}`);
});
