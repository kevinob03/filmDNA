import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'

const projectRoot = resolve(process.cwd())
const sourceRoot = join(projectRoot, 'src')
const componentsRoot = join(sourceRoot, 'components')
const pagesRoot = join(sourceRoot, 'pages')
const routesRoot = join(sourceRoot, 'routes')

function fail(message) {
  throw new Error(`Estructura React inválida: ${message}`)
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)
    return entry.isDirectory() ? walk(entryPath) : [entryPath]
  })
}

function localImports(file) {
  const source = readFileSync(file, 'utf8')
  return [...source.matchAll(/(?:from\s+|import\s+)(['"])(\.\.?\/[^'"\r\n]+)\1/g)]
    .map((match) => ({ specifier: match[2], target: resolve(dirname(file), match[2]) }))
}

function isInside(target, directory) {
  const pathFromDirectory = relative(directory, target)
  return pathFromDirectory !== '' && !pathFromDirectory.startsWith(`..${sep}`) && pathFromDirectory !== '..'
}

for (const requiredPath of [componentsRoot, pagesRoot, routesRoot, join(sourceRoot, 'App.jsx'), join(sourceRoot, 'main.jsx')]) {
  if (!existsSync(requiredPath)) fail(`falta ${relative(projectRoot, requiredPath)}`)
}

for (const obsoleteDirectory of ['modules', 'shared']) {
  if (existsSync(join(sourceRoot, obsoleteDirectory))) {
    fail(`src/${obsoleteDirectory} no debe sustituir las capas components/pages`)
  }
}

const indexHtml = readFileSync(join(projectRoot, 'index.html'), 'utf8')
if (!indexHtml.includes('src="/src/main.jsx"')) fail('index.html debe cargar /src/main.jsx')

const mainImports = localImports(join(sourceRoot, 'main.jsx'))
if (!mainImports.some(({ target }) => target === join(sourceRoot, 'App.jsx'))) {
  fail('main.jsx debe importar App.jsx')
}
if (mainImports.some(({ target }) => isInside(target, componentsRoot) || isInside(target, pagesRoot) || isInside(target, routesRoot))) {
  fail('main.jsx no debe saltarse App.jsx')
}

const appImports = localImports(join(sourceRoot, 'App.jsx'))
if (appImports.length !== 1 || !isInside(appImports[0].target, routesRoot)) {
  fail('App.jsx debe importar únicamente la capa routes')
}

for (const routeFile of walk(routesRoot).filter((file) => ['.js', '.jsx'].includes(extname(file)))) {
  for (const { specifier, target } of localImports(routeFile)) {
    if (!isInside(target, pagesRoot)) fail(`${relative(projectRoot, routeFile)} importa ${specifier}; routes solo debe componer pages`)
  }
}

for (const componentFile of walk(componentsRoot).filter((file) => ['.js', '.jsx'].includes(extname(file)))) {
  for (const { specifier, target } of localImports(componentFile)) {
    if (isInside(target, pagesRoot) || isInside(target, routesRoot) || target === join(sourceRoot, 'App.jsx') || target === join(sourceRoot, 'main.jsx')) {
      fail(`${relative(projectRoot, componentFile)} tiene una dependencia ascendente: ${specifier}`)
    }
  }
}

let pagesUseComponents = false
for (const pageFile of walk(pagesRoot).filter((file) => ['.js', '.jsx'].includes(extname(file)))) {
  for (const { specifier, target } of localImports(pageFile)) {
    if (isInside(target, componentsRoot)) pagesUseComponents = true
    if (isInside(target, routesRoot) || target === join(sourceRoot, 'App.jsx') || target === join(sourceRoot, 'main.jsx')) {
      fail(`${relative(projectRoot, pageFile)} tiene una dependencia ascendente: ${specifier}`)
    }
  }
}

if (!pagesUseComponents) fail('las páginas deben componerse a partir de components')

console.log('Estructura válida: components → pages → routes → App.jsx → main.jsx → index.html')
