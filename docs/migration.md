<!-- # Migrating from v2 to v3

Review breaking changes in [CHANGELOG.md](./CHANGELOG.md).
Update dependencies: npm install color-space@^3.0.0
Handle deprecated features:
Removed old API: Replace oldMethod() with newMethod().
Example: If using color.convert(), now requires explicit space param.

 -->

## Migrating from v1 to v2

> [!WARNING]
> v2 will work only in ESM environment. For CJS please use bundler.

Replace imports like `var rgb = require('color-space/rgb')` with `import rgb from 'color-space/rgb.js'`.

Test thoroughly.
