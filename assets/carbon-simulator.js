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
  const initialFillWidth = xSpan(sliderFill)
  const knob = document.getElementById('Knob')
  const poundsOfMeat = document.querySelector('#Pounds-of-Meat tspan')
  const initialMeat = parseFloat(poundsOfMeat.textContent)
  const poundsOfCarbon = document.querySelector('#Pounds-of-Carbon tspan')
  const initialCarbon = parseFloat(poundsOfCarbon.textContent)
  const grass = document.querySelector('#Grass')
  const initialGrassScale = parseFloat(/scale\(([^)]+)\)/.exec(grass.getAttribute('transform'))[1].split(/,/)[1])
  const grassTransform = grass.getAttribute('transform')
  const fakeMeatButton = document.getElementById('Fake-Meat-Button')
  const feedLotMeatButton = document.getElementById('Feed-Lot-Meat-Button')

  let boost = fakeMeatButton.classList.contains('is-toggled') ? 'fakeMeat' : feedLotMeatButton.classList.contains('is-toggled') ? 'feedLotMeat' : null

  const carbonBubbles = [...document.querySelectorAll('#Carbon-Bubbles > circle')]

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

  let currentMeat = initialMeat, targetMeat = initialMeat
  const initialMeatToCarbon = parseFloat(poundsOfCarbon.textContent) / initialMeat

  function meatRatio(meat) {
    return (meat - minMeat) / (maxMeat - minMeat)
  }

  function meatToCarbon(meat) {
    return meat * initialMeatToCarbon * (boost === 'fakeMeat' ? 2 : boost === 'feedLotMeat' ? 10 : 1)
  }
  const maxCarbon = meatToCarbon(maxMeat)

  function meatToGrassScale(meat) {
    const f = meatToCarbon(meat) / initialCarbon
    const rf = 1 - f
    return rf * initialGrassScale / 3 + f * initialGrassScale
  }

  function meatToSequestered(meat) {
    return Math.max(0, Math.min(carbonBubbles.length, Math.round(meatToCarbon(meat) * carbonBubbles.length / maxCarbon)))
  }

  let currentSequestered = 0
  let targetSequestered = meatToSequestered(currentMeat)

  function meatToX(meat) {
    return meatRatio(meat) * trackWidth
  }
  function xToMeat(x) {
    const f = x / trackWidth
    const rf = 1 - f
    return Math.round(rf * minMeat + f * maxMeat)
  }
  let updateTextInterval

  function updateText() {
    const x = pxToSvg(sliderFill.getBoundingClientRect().width)
    const meat = xToMeat(x)
    currentMeat = meat
    if (currentMeat === targetMeat) clearInterval(updateTextInterval)
    indicatorText.textContent = meat.toFixed(0)
    poundsOfMeat.textContent = meat.toFixed(0) + (meat === 1 ? ' lb' : ' lbs')
    const carbon = meatToCarbon(meat)
    poundsOfCarbon.textContent = carbon.toFixed(0) + (carbon === 1 ? ' lb' : ' lbs')
  }

  let animatingBubbles = false
  function animateBubbles() {
    if (currentSequestered === targetSequestered) {
      animatingBubbles = false
      return
    }
    animatingBubbles = true
    if (currentSequestered < targetSequestered) {
      carbonBubbles[currentSequestered++].setAttribute('class', 'sequestered')
    } else {
      carbonBubbles[--currentSequestered].setAttribute('class', '')
    }
    setTimeout(animateBubbles, 20)
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
    sliderFill.setAttribute('transform', 'scale(' + (x / initialFillWidth).toFixed(3) + ', 1)')
    valueIndicator.setAttribute('transform', 'translate(' + x + ', 0)')
    grass.setAttribute('transform', grassTransform.replace(/(scale\([^,]+,)([^)]+)/, (match, before) => before + meatToGrassScale(meat)))
    fakeMeatButton.setAttribute('class', boost === 'fakeMeat' ? 'boost-button is-toggled' : 'boost-button')
    feedLotMeatButton.setAttribute('class', boost === 'feedLotMeat' ? 'boost-button is-toggled' : 'boost-button')
    clearInterval(updateTextInterval)
    updateText()
    updateTextInterval = setInterval(updateText, 20)
    if (!animatingBubbles) animateBubbles()
  }

  animateBubbles()

  setMeat(10)

  knob.addEventListener('mousedown', function (e) {
    e.preventDefault()
    const startPounds = currentMeat

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