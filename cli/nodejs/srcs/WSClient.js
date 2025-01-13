#!/usr/bin/env node

//npm install websocket

const WebSocket = require('ws');


const ws = new WebSocket('wss://echo.websocket.org');

ws.on('error', console.error);

ws.on('open', function open() {
  ws.send('something');
});

ws.on('message', function message(data) {
  console.log('received: %s', data);
});
