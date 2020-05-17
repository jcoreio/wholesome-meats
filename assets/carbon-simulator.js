(function () {
  var minMeat = parseFloat(document.getElementById('Min-Value').textContent.trim())
  var maxMeat = parseFloat(document.getElementById('Max-Value').textContent.trim())

  var svg = document.querySelector('svg')
  var svgWidth = parseFloat(svg.getAttribute('viewBox').split(/\s+/g)[2])
  var oval = document.getElementById('Oval')
  var ovalBounds = oval.getBoundingClientRect()

  var cx = ovalBounds.x + ovalBounds.width / 2
  var cy = ovalBounds.y + ovalBounds.width / 2 // use width because it's cropped at the bottom

  function xSpan(el) {
    return parseFloat(el.getAttribute('x2')) - parseFloat(el.getAttribute('x1'))
  }

  var valueIndicator = document.getElementById('Value-Indicator')
  var indicatorText = document.querySelector('#Pounds tspan')
  var slider = document.getElementById('Slider')
  var sliderTrack = document.getElementById('Slider-Track')
  var trackWidth = xSpan(sliderTrack)
  var sliderFill = document.getElementById('Slider-Fill')
  var knob = document.getElementById('Knob')
  var poundsOfMeat = document.querySelector('#Pounds-of-Meat tspan')
  var poundsOfCarbon = document.querySelector('#Pounds-of-Carbon tspan')
  var grass = document.querySelector('#Grass')
  var initialGrassScale = parseFloat(/scale\(([^)]+)\)/.exec(grass.getAttribute('transform'))[1].split(/,/)[1])
  var grassTransform = grass.getAttribute('transform')
  var fakeMeatButton = document.getElementById('Fake-Meat-Button')
  var feedLotMeatButton = document.getElementById('Feed-Lot-Meat-Button')

  var boost = 'feedLotMeat'

  var carbonBubbles = Array.prototype.slice.call(document.querySelectorAll('#Carbon-Bubbles > circle'))

  function bubbleSize(bubble) {
    var r = parseFloat(bubble.getAttribute('r'))
    return r * r
  }
  var totalBubbleSize = carbonBubbles.reduce(function (total, bubble) {
    return total + bubbleSize(bubble)
  }, 0)

  function pxToSvg(px) {
    return px * svgWidth / document.body.offsetWidth
  }

  function centerDistSq(el) {
    var bounds = el.getBoundingClientRect()
    var dx = bounds.x + bounds.width / 2 - cx
    var dy = bounds.y + bounds.height / 2 - cy
    return dx * dx + dy * dy
  }

  carbonBubbles.sort(function (a, b) {
    return centerDistSq(a) - centerDistSq(b)
  })

  var targetMeat = 0
  var initialMeatToCarbon = 3

  function meatRatio(meat) {
    return (meat - minMeat) / (maxMeat - minMeat)
  }

  var feedLotBoost = 10
  var maxCarbon = maxMeat * initialMeatToCarbon * feedLotBoost
  function meatToCarbon(meat) {
    return Math.max(0, Math.min(maxCarbon, meat * initialMeatToCarbon * (boost === 'fakeMeat' ? 2 : boost === 'feedLotMeat' ? feedLotBoost : 1)))
  }

  function meatToSequestered(meat) {
    return meatToCarbon(meat) * totalBubbleSize / maxCarbon
  }

  function meatToGrassScale(meat) {
    var f = meatToCarbon(meat) / maxCarbon
    var rf = 1 - f
    return rf * initialGrassScale + f * initialGrassScale * 6
  }

  var numSequestered = 0
  var currentSequestered = 0
  var targetSequestered = meatToSequestered(targetMeat)

  function meatToX(meat) {
    return meatRatio(meat) * trackWidth
  }
  function xToMeat(x) {
    var f = x / trackWidth
    var rf = 1 - f
    return Math.round(rf * minMeat + f * maxMeat)
  }

  function updateText() {
    var meat = targetMeat
    indicatorText.textContent = meat.toFixed(0)
    poundsOfMeat.textContent = meat.toFixed(0) + (meat === 1 ? ' lb' : ' lbs')
    var carbon = meatToCarbon(meat)
    poundsOfCarbon.textContent = carbon.toFixed(0) + (carbon === 1 ? ' lb' : ' lbs')
  }

  var animatingBubbles = false
  function animateBubbles() {
    animatingBubbles = false
    var nextNumSequestered = numSequestered + (currentSequestered < targetSequestered ? 1 : -1)
    var bubble = carbonBubbles[Math.min(numSequestered, nextNumSequestered)]
    if (!bubble) return
    var isIncrease = nextNumSequestered > numSequestered 
    var nextSequestered = currentSequestered + bubbleSize(bubble) * (isIncrease ? 1 : -1)
    if (Math.abs(nextSequestered - targetSequestered) < Math.abs(currentSequestered - targetSequestered)) {
      animatingBubbles = true
      bubble.setAttribute('class', isIncrease ? 'sequestered' : '')
      currentSequestered = nextSequestered
      numSequestered = nextNumSequestered
    }
    if (animatingBubbles) setTimeout(animateBubbles, 20)
  }

  function setMeat(meat) {
    meat = Math.max(minMeat, Math.min(maxMeat, Math.round(meat)))
    targetMeat = meat
    update()
  }

  function setBoost(_boost) {
    boost = _boost
    update()
  }

  function update() {
    var meat = targetMeat
    targetSequestered = meatToSequestered(meat)
    var x = meatToX(meat)
    sliderFill.setAttribute('transform', 'scale(' + (x.toFixed(3) / trackWidth) + ', 1)')
    valueIndicator.setAttribute('transform', 'translate(' + x + ', 0)')
    grass.setAttribute('transform', grassTransform.replace(/(scale\([^,]+,)([^)]+)/, function (match, before) {
      return before + meatToGrassScale(meat)
    }))
    addClasses(boost === 'fakeMeat' ? fakeMeatButton : feedLotMeatButton, 'is-toggled')
    removeClasses(boost === 'feedLotMeat' ? fakeMeatButton : feedLotMeatButton, 'is-toggled')
    updateText()
    if (!animatingBubbles) animateBubbles()
  }

  animateBubbles()

  setMeat(10)

  addDragListener(knob, function (e) {
    setMeat(xToMeat(pxToSvg(e.clientX - sliderTrack.getBoundingClientRect().x)))
    if (e.type === 'end') removeClasses(document.body, 'is-adjusting')
    else addClasses(document.body, 'is-adjusting')
  })

  function handleBoostClick(e) {
    e.preventDefault()
    var clickedBoost = e.currentTarget === fakeMeatButton ? 'fakeMeat' : 'feedLotMeat'
    setBoost(clickedBoost === boost ? null : clickedBoost)
  }
  fakeMeatButton.addEventListener('click', handleBoostClick)
  feedLotMeatButton.addEventListener('click', handleBoostClick)
})()