const { JSDOM } = require('jsdom')
const fs = require('fs')

const source = fs.readFileSync('assets/carbon-simulator.html', 'utf8')
const dom = new JSDOM(source)

const {document} = dom.window

const colors = ['#424242', '#484848', '#757575', '#8C8C8C', '#9E9E9E']

document.querySelectorAll('#Carbon-Bubbles > circle').forEach(c => {
  c.setAttribute('fill', colors[Math.floor(Math.random() * colors.length)])
  console.log(c.outerHTML)
})
