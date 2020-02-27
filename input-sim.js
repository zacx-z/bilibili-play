const ref = require('ref-napi')
const ffi = require('ffi-napi')
const StructType = require('ref-struct-di')(ref)
const UnionType = require('ref-union-di')(ref)

const ulongPtr = ref.refType(ref.types.ulong)

const CMouseInput = StructType({
    dx: ref.types.long,
    dy: ref.types.long,
    mouseData: ref.types.uint32,
    dwFlags: ref.types.uint32,
    time: ref.types.uint32,
    dwExtraInfo: ulongPtr
})

const CKeyboardInput = StructType({
    wVk: ref.types.int32,
    wScan: ref.types.int32,
    dwFlags: ref.types.uint32,
    time: ref.types.uint32,
    dwExtraInfo: ulongPtr
})

const CHardwareInput = StructType({
    uMsg: ref.types.uint32,
    wParamL: ref.types.int32,
    wParamH: ref.types.int32
})

const CInput = StructType({
    type: ref.types.uint32,
    dummyUnionName: UnionType({
        mi: CMouseInput,
        ki: CKeyboardInput,
        hi: CHardwareInput
    })
})

const CSendInput = ffi.Library('user32', {
    'SendInput':['uint', ['uint', ref.refType(CInput), 'int']]
}).SendInput

var keyTimeouts = {}

module.exports = {
    CInput: CInput,
    SendKey: function (keyCode, duration) {
        if (keyTimeouts[keyCode] != null) clearTimeout(keyTimeouts[keyCode])
        this.SendKeyDown(keyCode);
        keyTimeouts[keyCode] = setTimeout(() => this.SendKeyUp(keyCode), duration * 1000)
    },
    SendKeyDown: function (keyCode) {
        var input = new CInput
        input.type = 1 // keyboard
        input.dummyUnionName.ki.wVk = keyCode
        input.dummyUnionName.ki.wScan = 0
        input.dummyUnionName.ki.dwFlags = 0
        input.dummyUnionName.ki.time = 0
        input.dummyUnionName.ki.dwExtraInfo = ref.NULL
        return CSendInput(1, input.ref(), CInput.size)
    },
    SendKeyUp: function (keyCode) {
        var input = new CInput
        input.type = 1 // keyboard
        input.dummyUnionName.ki.wVk = keyCode
        input.dummyUnionName.ki.wScan = 0
        input.dummyUnionName.ki.dwFlags = 2
        input.dummyUnionName.ki.time = 0
        input.dummyUnionName.ki.dwExtraInfo = ref.NULL
        return CSendInput(1, input.ref(), CInput.size)
    },
    SendScanKeyDown: function (scanCode, extended = false) {
        var input = new CInput
        input.type = 1 // keyboard
        input.dummyUnionName.ki.wVk = 0
        input.dummyUnionName.ki.wScan = scanCode
        var flags = 8;
        if (extended) flags |= 1;
        input.dummyUnionName.ki.dwFlags = flags
        input.dummyUnionName.ki.time = 0
        input.dummyUnionName.ki.dwExtraInfo = ref.NULL
        return CSendInput(1, input.ref(), CInput.size)
    },
    SendScanKeyUp: function (scanCode, extended = false) {
        var input = new CInput
        input.type = 1 // keyboard
        input.dummyUnionName.ki.wVk = 0
        input.dummyUnionName.ki.wScan = scanCode
        var flags = 8 | 2;
        if (extended) flags |= 1;
        input.dummyUnionName.ki.dwFlags = flags
        input.dummyUnionName.ki.time = 0
        input.dummyUnionName.ki.dwExtraInfo = ref.NULL
        return CSendInput(1, input.ref(), CInput.size)
    }
}
