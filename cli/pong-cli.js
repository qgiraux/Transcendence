const {Parser} = require("./Parser");
const {CmdRegister} = require("./CmdRegister");
const {CmdChat} = require("./CmdChat");
const {CmdGame} = require("./CmdGame");
const {CmdTest} = require("./CmdTest");
const {HttpsClient} = require("./HttpsClient");

function main () {
    const p = new Parser();
    patterns = ["[--help]", "[--version]"]
    callbacks = [()=>{p.displayHelp = true}, ()=>{process.stdout.write("pong-cli version 0.1.0\n")}]
    p.setOptions(patterns, callbacks);
    p.commands = [new CmdRegister(), new CmdChat(), new CmdGame(), new CmdTest()];
    p.defaultCallback = ()=>{p.printHelp()};
    
    p.eval();
}

HttpsClient.allowSelfSigned(); //WARNING: ALLOWS SELF SIGNED (OK for eval)

try {
    main();
} catch (e) {
    console.log(`pong-cli: exited with code 1: ${e}`);
    process.exit(1);
}
