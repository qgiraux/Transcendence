const {Parser} = require("./Parser")
const {CmdRegister} = require("./CmdRegister")
const {CmdChat} = require("./CmdChat")
const {CmdGame} = require("./CmdGame")
const {HttpsClient} = require("./HttpsClient")

HttpsClient.allowSelfSigned(); //

const p = new Parser();
patterns = ["[--help]", "[--version]"]
callbacks = [()=>{p.displayHelp = true}, ()=>{process.stdout.write("pong-cli version 0.1.0\n")}]
p.setOptions(patterns, callbacks);
p.commands = [new CmdRegister(), new CmdChat(), new CmdGame()];
p.defaultCallback = ()=>{p.printHelp()};
p.eval();
