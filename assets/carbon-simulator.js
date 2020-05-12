(function () {
  const minMeat = parseFloat(document.getElementById('Min-Value').textContent.trim())
  const maxMeat = parseFloat(document.getElementById('Max-Value').textContent.trim())

  const valueIndicator = document.getElementById('Value-Indicator')
  const indicatorText = document.querySelector('#Pounds tspan')
  const slider = document.getElementById('Slider')
  const sliderTrack = document.getElementById('Slider-Track')
  const sliderFill = document.getElementById('Slider-Fill')
  const knob = document.getElementById('Knob')
  const poundsOfMeat = document.querySelector('#Pounds-of-Meat tspan')
  const poundsOfCarbon = document.querySelector('#Pounds-of-Carbon tspan')

  let currentMeat = parseFloat(poundsOfMeat.textContent)
  let prevMeat = currentMeat
  let targetMeat = currentMeat
  const meatToCarbon = parseFloat(poundsOfCarbon.textContent) / currentMeat

  const trackBounds = sliderTrack.getBoundingClientRect()
  const initialFillWidth = sliderFill.getBoundingClientRect().width

  function meatToX(meat) {
    return (meat - minMeat) * trackBounds.width / (maxMeat - minMeat)
  }
  function xToMeat(x) {
    const f = x / trackBounds.width
    const rf = 1 - f
    return Math.round(rf * minMeat + f * maxMeat)
  }

  let updateTextInterval

  function updateText() {
    const x = sliderFill.getBoundingClientRect().width
    const meat = xToMeat(x)
    currentMeat = meat
    if (currentMeat === prevMeat) clearInterval(updateTextInterval)
    prevMeat = meat
    indicatorText.textContent = meat.toFixed(0)
    poundsOfMeat.textContent = meat.toFixed(0) + (meat === 1 ? ' lb' : ' lbs')
    const carbon = meat * meatToCarbon
    poundsOfCarbon.textContent = carbon.toFixed(0) + (carbon === 1 ? ' lb' : ' lbs')
  }

  function setMeat(meat) {
    meat = Math.max(minMeat, Math.min(maxMeat, Math.round(meat)))
    if (targetMeat === meat) return
    targetMeat = meat
    const x = meatToX(meat)
    sliderFill.setAttribute('transform', 'scale(' + (x / initialFillWidth).toFixed(3) + ', 1)')
    valueIndicator.setAttribute('transform', 'translate(' + x + ', 0)')
    clearInterval(updateTextInterval)
    updateText()
    updateTextInterval = setInterval(updateText, 20)
  }

  setMeat(10)

  knob.addEventListener('mousedown', function (e) {
    e.preventDefault()
    const startPounds = currentMeat

    document.body.setAttribute('class', 'is-adjusting')

    function handleMove(e) {
      e.preventDefault()
      setMeat(xToMeat(e.clientX - trackBounds.x))
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

  document.getElementById('Fake-Meat-Button').addEventListener('click', function (e) {
    e.preventDefault()
    setMeat(20)
  })
  document.getElementById('Feed-Lot-Meat-Button').addEventListener('click', function (e) {
    e.preventDefault()
    setMeat(60)
  })
})()