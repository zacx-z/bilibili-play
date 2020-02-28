var actionMap = [
    {
        keyCode: 0x26,
        commands: ["w", "up", "u", "上", "前", "forward", "f", "shang", "qian"],
        durationMultiplier: 2
    },
    {
        keyCode: 0x28,
        commands: ["s", "down", "下", "后", "退", "back", "b", "xia", "hou", "tui"],
    },
    {
        keyCode: 0x25,
        commands: ["a", "left", "l", "左", "zuo"],
    },
    {
        keyCode: 0x27,
        commands: ["d", "right", "r", "右", "you"],
    },
    {
        keyCode: 0x20,
        commands: ["_", "horn", "喇叭", "laba"],
    },
];

const keyHoldDuration = 1;

module.exports = {
    actionMap: actionMap,
    keyHoldDuration: keyHoldDuration,
    getCommandMap: () => {
        var commandMap = {}
        for (var idx in actionMap) {
            var data = actionMap[idx];
            var duration = keyHoldDuration * (data.durationMultiplier ? data.durationMultiplier : 1);
            for (var cmdId in data.commands) {
                commandMap[data.commands[cmdId]] = {
                    keyCode: data.keyCode,
                    duration: duration
                };
            }
        }
        return commandMap;
    }
}