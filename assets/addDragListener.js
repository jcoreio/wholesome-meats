function addDragListener(el, handler) {
  let startX, startY
  el.addEventListener('mousedown', function (e) {
    startX = e.clientX
    startY = e.clientY
    e.preventDefault()

    handler({type: 'start', startX: startX, startY: startY, clientX: e.clientX, clientY: e.clientY})

    function handleMove(e) {
      e.preventDefault()
      handler({type: 'move', startX: startX, startY: startY, clientX: e.clientX, clientY: e.clientY})
    }
    function handleUp(e) {
      e.preventDefault()
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      handler({type: 'end', startX: startX, startY: startY, clientX: e.clientX, clientY: e.clientY})
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  })

  let touchId
  el.addEventListener('touchstart', function (e) {
    const touch = e.changedTouches[0]
    if (touchId != null || !touch) return
    startX = touch.clientX
    startY = touch.clientY
    touchId = touch.identifier
    handler({type: 'start', startX: startX, startY: startY, clientX: touch.clientX, clientY: touch.clientY})
  })
  function getMatchingTouch(e) {
    if (touchId == null) return null
    return Array.prototype.find.call(e.changedTouches, function (t) {
      return t.identifier === touchId
    })
  }
  el.addEventListener('touchmove', function (e) {
    const touch = getMatchingTouch(e)
    if (!touch) return
    handler({type: 'move', startX: startX, startY: startY, clientX: touch.clientX, clientY: touch.clientY})
  })
  function handleTouchEnd(e) {
    const touch = getMatchingTouch(e)
    if (!touch) return
    touchId = null
    handler({type: 'end', startX: startX, startY: startY, clientX: touch.clientX, clientY: touch.clientY})
  }
  el.addEventListener('touchend', handleTouchEnd)
  el.addEventListener('touchcancel', handleTouchEnd)
}
