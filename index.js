/*
  PGUSER=dbuser \
  PGPASSWORD=secretpassword \
  PGHOST=database.server.com \
  PGPORT=3211 \
  PGDATABASE=mydb \
  node script.js
*/
const { Client } = require("pg");
const client = new Client();
client.connect();

const WebSocket = require("ws");
const wss = new WebSocket.Server({
    port: process.env.PORT || "8081"
});


roomlist = new Map();
connetionlist = []


wss.on("connection", socket => {
    socket.on("message", message => {
        console.log(message);
        socket.send("Hello "+ JSON.parse(message).dttext);
    });
    connetionlist.push(socket);
});

wss.on("close", () => {    // Cleanup
     connectionlist = []
})


/*
    Example

    setInterval(() => {
        console.log("interval" + connetionlist.length);
        connetionlist[0].send("periodic");
    },3000);


    message
        ask room
        enter room
        send chat
        receive chat
        quit room

*/