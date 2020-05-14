(function () {
  const minMeat = parseFloat(document.getElementById('Min-Value').textContent.trim())
  const maxMeat = parseFloat(document.getElementById('Max-Value').textContent.trim())

  const svg = document.querySelector('svg')
  const svgWidth = parseFloat(svg.getAttribute('viewBox').split(/\s+/g)[2])
  const oval = document.getElementById('Oval')
  const ovalBounds = oval.getBoundingClientRect()

  const cx = ovalBounds.x + ovalBounds.width / 2
  const cy = ovalBounds.y + ovalBounds.width / 2 // use width because it's cropped at the bottom

  function xSpan(el) {
    return parseFloat(el.getAttribute('x2')) - parseFloat(el.getAttribute('x1'))
  }

  const valueIndicator = document.getElementById('Value-Indicator')
  const indicatorText = document.querySelector('#Pounds tspan')
  const slider = document.getElementById('Slider')
  const sliderTrack = document.getElementById('Slider-Track')
  const trackWidth = xSpan(sliderTrack)
  const sliderFill = document.getElementById('Slider-Fill')
  const knob = document.getElementById('Knob')
  const poundsOfMeat = document.querySelector('#Pounds-of-Meat tspan')
  const poundsOfCarbon = document.querySelector('#Pounds-of-Carbon tspan')
  const grass = document.querySelector('#Grass')
  const initialGrassScale = parseFloat(/scale\(([^)]+)\)/.exec(grass.getAttribute('transform'))[1].split(/,/)[1])
  const grassTransform = grass.getAttribute('transform')
  const fakeMeatButton = document.getElementById('Fake-Meat-Button')
  const feedLotMeatButton = document.getElementById('Feed-Lot-Meat-Button')

  let boost = null

  const carbonBubbles = [...document.querySelectorAll('#Carbon-Bubbles > circle')]

  function bubbleSize(bubble) {
    const r = parseFloat(bubble.getAttribute('r'))
    return r * r
  }
  const totalBubbleSize = carbonBubbles.reduce(function (total, bubble) {
    return total + bubbleSize(bubble)
  }, 0)

  function pxToSvg(px) {
    return px * svgWidth / document.body.offsetWidth
  }

  function centerDistSq(el) {
    const bounds = el.getBoundingClientRect()
    const dx = bounds.x + bounds.width / 2 - cx
    const dy = bounds.y + bounds.height / 2 - cy
    return dx * dx + dy * dy
  }

  carbonBubbles.sort(function (a, b) {
    return centerDistSq(a) - centerDistSq(b)
  })

  let targetMeat = 0
  const initialMeatToCarbon = 3

  function meatRatio(meat) {
    return (meat - minMeat) / (maxMeat - minMeat)
  }

  const feedLotBoost = 10
  const maxCarbon = maxMeat * initialMeatToCarbon * feedLotBoost
  function meatToCarbon(meat) {
    return Math.max(0, Math.min(maxCarbon, meat * initialMeatToCarbon * (boost === 'fakeMeat' ? 2 : boost === 'feedLotMeat' ? feedLotBoost : 1)))
  }

  function meatToSequestered(meat) {
    return meatToCarbon(meat) * totalBubbleSize / maxCarbon
  }

  function meatToGrassScale(meat) {
    const f = meatToCarbon(meat) / maxCarbon
    const rf = 1 - f
    return rf * initialGrassScale + f * initialGrassScale * 6
  }

  let numSequestered = 0
  let currentSequestered = 0
  let targetSequestered = meatToSequestered(targetMeat)

  function meatToX(meat) {
    return meatRatio(meat) * trackWidth
  }
  function xToMeat(x) {
    const f = x / trackWidth
    const rf = 1 - f
    return Math.round(rf * minMeat + f * maxMeat)
  }

  function updateText() {
    const meat = targetMeat
    indicatorText.textContent = meat.toFixed(0)
    poundsOfMeat.textContent = meat.toFixed(0) + (meat === 1 ? ' lb' : ' lbs')
    const carbon = meatToCarbon(meat)
    poundsOfCarbon.textContent = carbon.toFixed(0) + (carbon === 1 ? ' lb' : ' lbs')
  }

  let animatingBubbles = false
  function animateBubbles() {
    animatingBubbles = false
    const nextNumSequestered = numSequestered + (currentSequestered < targetSequestered ? 1 : -1)
    const bubble = carbonBubbles[Math.min(numSequestered, nextNumSequestered)]
    if (!bubble) return
    const isIncrease = nextNumSequestered > numSequestered 
    const nextSequestered = currentSequestered + bubbleSize(bubble) * (isIncrease ? 1 : -1)
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
    const meat = targetMeat
    targetSequestered = meatToSequestered(meat)
    const x = meatToX(meat)
    sliderFill.setAttribute('transform', 'scale(' + (x.toFixed(3) / trackWidth) + ', 1)')
    valueIndicator.setAttribute('transform', 'translate(' + x + ', 0)')
    grass.setAttribute('transform', grassTransform.replace(/(scale\([^,]+,)([^)]+)/, function (match, before) {
      return before + meatToGrassScale(meat)
    }))
    fakeMeatButton.setAttribute('class', boost === 'fakeMeat' ? 'boost-button is-toggled' : 'boost-button')
    feedLotMeatButton.setAttribute('class', boost === 'feedLotMeat' ? 'boost-button is-toggled' : 'boost-button')
    updateText()
    if (!animatingBubbles) animateBubbles()
  }

  animateBubbles()

  setMeat(10)

  knob.addEventListener('mousedown', function (e) {
    e.preventDefault()

    document.body.setAttribute('class', 'is-adjusting')

    function handleMove(e) {
      e.preventDefault()
      setMeat(xToMeat(pxToSvg(e.clientX - sliderTrack.getBoundingClientRect().x)))
    }
    function handleUp(e) {
      e.preventDefault()
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      document.body.setAttribute('class', '')
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  })

  function handleBoostClick(e) {
    e.preventDefault()
    const clickedBoost = e.currentTarget === fakeMeatButton ? 'fakeMeat' : 'feedLotMeat'
    setBoost(clickedBoost === boost ? null : clickedBoost)
  }
  fakeMeatButton.addEventListener('click', handleBoostClick)
  feedLotMeatButton.addEventListener('click', handleBoostClick)
})()