const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });
const { koikoi } = require("./koikoi");

let rooms = {}; 

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get("/koikoi", (req, res) => {
  let room_id = Math.floor(Math.random()*1e16);
  rooms[room_id] = {koikoi: new koikoi(), player1: null, player2: null};
  res.redirect(307, "/koikoi/"+room_id);
});

app.get("/koikoi/:room_id", (req, res) => {
  let room = req.params.room_id;
  // if the room exists and has an available spot 
  if (rooms[room] && (rooms[room].player1 == null || rooms[room].player2 == null))
    res.sendFile(__dirname + "/koikoi.html");
  else
    res.redirect(307,"/");
});

wss.on("connection", (ws) => {
  console.log("new connection")

  let room;
  let player;
  ws.on("message", (data) => {
    let msg = JSON.parse(data);

    if (msg.type == "registration") {
      room = msg.room;
      if (rooms[room].player1 == null) {
        player = 1;
        rooms[room].player1 = ws;
      }
      else if (rooms[room].player2 == null) {
        player = 2;
        rooms[room].player2 = ws;
      }
      else {
        ws.close();
        return;
      }

      ws.send(JSON.stringify({type: "player", player: player}));
      // send state of the game
      update_game(room);
      return;
    }
    else if (msg.type == "action") {
      if (!room || !player) {
        console.error("unregistered user.");
        return;
      }
      else if (rooms[room]["koikoi"].turn != 0 && rooms[room]["koikoi"].turn != player) {
        console.error("user attempted action when it was not his turn.");
        return;
      }
      update_game(room, msg.action);
    }
  });

  ws.on("close",() => {
    console.log("closed connection")

    // remove player and close room if empty
    if (player == 1) {
      rooms[room].player1 = null;
    }
    else if (player == 2) {
      rooms[room].player2 = null;
    }

    if (rooms[room].player1 == null && rooms[room].player2 == null) {
      delete rooms[room];
    }
  });
});

function update_game(room,act=-1) {
  if (!rooms[room]) return;
  let koi = rooms[room]["koikoi"];
  let answer;
  if (act == -1) {
    answer = null;
  }
  else {
    answer = koi.action(act);
  }
  let update = update_object(koi);
  update.p2_hand = Array(8).fill(0);
  if (rooms[room].player1) rooms[room].player1.send(JSON.stringify({type: "update", update: update, answer: answer}));
  update.p1_hand = update.p2_hand;
  update.p2_hand = koi.p2_hand;
  if (rooms[room].player2) rooms[room].player2.send(JSON.stringify({type: "update", update: update, answer: answer}));
}

app.use(express.static(__dirname + '/static'));

function update_object(k) {
  let collection = k.turn == 1 ? k.p1_collection : k.p2_collection; 
  let res = {state: k.state, turn: k.turn,
    hand_selection: k.hand_selection, month: k.month,
    board: k.board,
    p1_collection: k.p1_collection, p2_collection: k.p2_collection,
    p1_year_points: k.p1_year_points, p2_year_points: k.p2_year_points,
    p1_hand: k.p1_hand.slice(), p2_hand: k.p2_hand.slice(),
    topdeck: k.state == "flipping_decision" ? k.deck[k.deck.length - 1] : 0,
    junk: k.junk(collection),
    ribbons: (k.poetry_ribbons(collection) + k.blue_ribbons(collection) + k.ribbons(collection)),
    animals: (k.boar_dear_butterfly(collection) + k.animals(collection)),
    brights: k.brights(collection),
    cup: (k.moon_viewing(collection) + k.cherryblossom_viewing(collection)),
    season: k.season(collection)
  }
  return res;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('listening on *:' + PORT);
});