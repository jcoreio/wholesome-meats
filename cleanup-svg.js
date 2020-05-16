const { JSDOM } = require('jsdom')
const fs = require('fs')

const source = fs.readFileSync('assets/carbon-simulator.html', 'utf8')
const dom = new JSDOM(source)

const {document} = dom.window

const carbonBubbles = document.querySelector('#Carbon-Bubbles')

function mmul(a, b) {
  return [
    a[0] * b[0] + a[1] * b[3],
    a[0] * b[1] + a[1] * b[4],
    a[0] * b[2] + a[1] * b[5] + a[2],
    a[3] * b[0] + a[4] * b[3],
    a[3] * b[1] + a[4] * b[4],
    a[3] * b[2] + a[4] * b[5] + a[5],
  ]  
}

function mpmul(m, p) {
  return [
    m[0] * p[0] + m[1] * p[1] + m[2],
    m[3] * p[0] + m[4] * p[1] + m[5],
  ]
}

function translate(x, y) {
  return [
    1, 0, x,
    0, 1, y,
  ]
}

function rotate(deg) {
  const theta = deg * Math.PI / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  return [
    cos, -sin, 0,
    sin, cos, 0,
  ]
}

function scale(x, y) {
  return [
    x, 0, 0,
    0, y, 0,
  ]
}

function identity() {
  return [1, 0, 0, 0, 1, 0]
}

const matrixCache = new Map([
  [carbonBubbles, identity()]
])

function getMatrix(el) {
  if (!el) return identity()
  const cached = matrixCache.get(el)
  if (cached) return cached
  let matrix = getMatrix(el.parentElement) 
  const transform = el.getAttribute('transform')
  if (transform) {
    const rx = /(scale|translate|rotate)\(([^\)]+)\)/g
    let match
    while ((match = rx.exec(transform))) {
      const nums = match[2].split(',').map(s => parseFloat(s.trim()))
      let next
      switch (match[1]) {
        case 'scale': 
          next = scale(nums[0], nums[1] != null ? nums[1] : nums[0])
          break
        case 'translate':
          next = translate(nums[0], nums[1])
          break
        case 'rotate':
          next = rotate(nums[0])
          break
      }
      matrix = mmul(matrix, next)
    }
  }
  matrixCache.set(el, matrix)
  return matrix
}

for (const e of carbonBubbles.querySelectorAll('ellipse')) {
  const c = document.createElementNS("http://www.w3.org/2000/svg", 'circle')
  for (const attr of ['id', 'transform', 'fill', 'cx', 'cy'])
    c.setAttribute(attr, e.getAttribute(attr))
  c.setAttribute('r', e.getAttribute('rx'))
  e.parentElement.appendChild(c)
  e.remove()
}

console.log([...carbonBubbles.querySelectorAll('circle')].map(c => {
  const matrix = getMatrix(c)
  const [x, y] = mpmul(matrix, [c.getAttribute('cx'), c.getAttribute('cy')])
  c.setAttribute('cx', x)
  c.setAttribute('cy', y)
  // c.setAttribute('id', 'Transformed-' + c.getAttribute('id'))
  c.removeAttribute('id')
  c.removeAttribute('transform')
  return c.outerHTML
}).join('\n'))
