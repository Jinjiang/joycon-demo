// mouseClick([button], [double])
// mouseToggle([down], [button])

const robot = require("robotjs")

robot.setMouseDelay(0)

const offsetMap = {
  135: { x: -1, y: -1 },  90: { x:  0, y: -1 },  45: { x: 1, y: -1 },
  180: { x: -1, y:  0 },                          0: { x: 1, y:  0 },
  225: { x: -1, y:  1 }, 270: { x:  0, y:  1 }, 315: { x: 1, y:  1 }
}

const mouseMap = {
  left: { side: 'L', key: 'minus' },
  right: { side: 'L', key: 'screenshot' }
}

const timeout = 50

const keyMap = {}

let nextHitTimer

function move (axes) {
  offset = offsetMap[axes]
  console.log('move mouse', axes, offset)
  const { x, y } = robot.getMousePos()
  robot.moveMouse(x + offset.x, y + offset.y)
}

function scroll (axes) {
  offset = offsetMap[axes]
  console.log('move mouse', axes, offset)
  robot.scrollMouse(offset.x * 50, offset.y * 50)
}

function hit (data) {
  clearTimeout(nextHitTimer)
  for (const name in mouseMap) {
    const { side, key } = mouseMap[name]
    if (!keyMap[name] && data[side][key]) {
      robot.mouseToggle('down', name)
      keyMap[name] = true
    }
    if (keyMap[name] && !data[side][key]) {
      robot.mouseToggle('up', name)
      keyMap[name] = false
    }
  }
  nextHitTimer = setTimeout(() => {
    hit({ L: {}, R: {}})
  }, timeout)
}

exports.move = move
exports.scroll = scroll
exports.hit = hit
