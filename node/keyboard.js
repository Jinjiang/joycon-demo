// setKeyboardDelay(ms)
// keyTap(key, [modifier])
// keyToggle(key, down, [modifier])
// typeString(string)
// typeStringDelayed(string, cpm)

const keyboardMap = {
  up: { side: 'L', key: 'up' },
  down: { side: 'L', key: 'down' },
  right: { side: 'L', key: 'right' },
  left: { side: 'L', key: 'left' },

  pageup: { side: 'R', key: 'X' },
  pagedown: { side: 'R', key: 'Y' },

  enter: { side: 'R', key: 'A' },
  backspace: { side: 'R', key: 'B' },
  tab: { side: 'L', key: 'axes' },
  space: { side: 'R', key: 'axes' },
  escape: { side: 'R', key: 'plus' },

  command: { side: 'L', key: 'L' },
  shift: { side: 'L', key: 'ZL' },
  control: { side: 'R', key: 'R' },
  alt: { side: 'R', key: 'ZR' },

  audio_vol_down: { side: 'L', key: 'SR' },
  audio_vol_up: { side: 'L', key: 'SL' },
  f7: { side: 'R', key: 'SR' },
  f8: { side: 'R', key: 'home' },
  f9: { side: 'R', key: 'SL' }
}

const robot = require("robotjs")

const timeout = 50

const keyMap = {}

let nextHitTimer

function hit (data) {
  clearTimeout(nextHitTimer)
  for (const name in keyboardMap) {
    const { side, key } = keyboardMap[name]
    if (!keyMap[name] && data[side][key]) {
      robot.keyToggle(name, 'down')
      keyMap[name] = true
    }
    if (keyMap[name] && !data[side][key]) {
      robot.keyToggle(name, 'up')
      keyMap[name] = false
    }
  }
  nextHitTimer = setTimeout(() => {
    hit({ L: {}, R: {}})
  }, timeout)
}

exports.hit = hit
