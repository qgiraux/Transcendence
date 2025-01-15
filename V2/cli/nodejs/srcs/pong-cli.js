const {Parser} = require("./Parser")

p = new Parser();
patterns = ["[--help]", "[--version]"]
callbacks = [()=>{p.displayHelp = true}, ()=>{process.stdout.write("pong-cli version 0.1.0\n")}]
commandNames = ["register"]
p.setOptions(patterns, callbacks);
p.commandNames = commandNames;
p.eval();


