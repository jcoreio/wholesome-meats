function getClasses(el) {
  return (el.getAttribute('class') || '').split(/\s+/g)
}

function toggleClass(el, className) {
  var classes = getClasses(el)
  var index = classes.indexOf(className)
  if (index >= 0) classes.splice(index, 1)
  else classes.push(className)
  el.setAttribute('class', classes.join(' '))
}

function addClasses(el) {
  var classes = getClasses(el)
  for (let i = 1; i < arguments.length; i++) {
    if (classes.indexOf(arguments[i]) < 0) classes.push(arguments[i])
  }
  el.setAttribute('class', classes.join(' '))
}

function removeClasses(el) {
  var ownArgs = arguments
  var classes = getClasses(el).filter(function (cls) {
    return Array.prototype.indexOf.call(ownArgs, cls) < 0
  })
  el.setAttribute('class', classes.join(' '))
}
