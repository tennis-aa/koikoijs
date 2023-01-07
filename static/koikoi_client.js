const ws = new WebSocket("ws:" + window.location.host);

const room_id = Number(window.location.pathname.split("/").pop());
ws.onopen = () => {
  console.log("connecting",room_id);
  ws.send(JSON.stringify({type: "registration", room: room_id}));
}

let player;
let x;
let answer;
ws.onmessage = (event) => {
  msg = JSON.parse(event.data);
  if (msg.type == "player") {
    player = msg.player;
  }
  else if (msg.type == "update") {
    x = msg.update;
    answer = msg.answer;
    update();
  }
}

function send_action(act) {
  ws.send(JSON.stringify({type: "action", action: act}));
}

//////////////////////////////////////////////////////////

let p2hand = document.querySelectorAll("#p2hand>div");
let board = document.querySelectorAll("#board>div");
let oppcollection = document.getElementById("p1collection");
let mycollection = document.getElementById("p2collection");
let mypoints = document.getElementById("p1_points");
let opppoints = document.getElementById("p2_points");
let state = document.getElementById("state");
let deck = document.getElementById("deck");
let modal_window = document.getElementById("modal_window");

// Attach events to cards
for (let i=0; i<8; ++i) {
  p2hand[i].onclick = hand_click;
  p2hand[i].onmouseover = highlight_pairs;
  p2hand[i].onmouseout = unhighlight;
}
for (let i=0; i<16; ++i) {
  board[i].addEventListener("click",board_click,false)
}

function hand_click(e) {
  if (x.turn != player) return;

  let hand_pressed = null;
  for (let i=0; i<8;++i) {
    if (e.currentTarget == p2hand[i]) {
      hand_pressed = i;
      break;
    }
  }

  if (x.state == "choose_hand") {
    send_action(hand_pressed);
  }
  else if (x.state == "select_pair") {
    send_action(null);
  }
}

function board_click(e) {
  if (x && x.state == "choose_hand") {
    return;
  }
  else if (x.state == "blank") {
    send_action(null);
  }
  if (x.turn != player) return;

  let j;
  for (let i=0; i<16;++i) {
    if (e.currentTarget == board[i]){
      j=i;
      break;
    }
  }

  send_action(j);
}

function highlight_pairs(e) {
  if (!x || x.turn != player) {
    e.currentTarget.style.cursor = "not-allowed";
  }
  else {
    e.currentTarget.style.cursor = "pointer";
  }
  if (!x || x.state == "select_pair" || x.state == "flipping_decision") return;

  let card = null;
  let hand = player == 1 ? x.p1_hand : x.p2_hand;
  for (let i=0; i<8;++i) {
    if (e.currentTarget == p2hand[i]) {
      card = hand[i];
      break;
    }
  }

  for (let i=0; i<16; ++i) {
    if (card != 0 && card_month(card) == card_month(x.board[i])) {
      board[i].style.borderColor = "green";
    }
  }
}

function unhighlight(e) {
  if (!x || x.state == "select_pair" || x.state == "flipping_decision") return;

  for (let i=0; i<16; ++i) {
    board[i].style.borderColor = "white";
  }
}

function request_koikoi() {
  modal_window.replaceChildren();
  let hand = document.createElement("div");
  hand.style.backgroundColor = "white";
  hand.textContent = "junk=" + x.junk +
    "; ribbons=" + x.ribbons +
    "; animals=" + x.animals +
    "; brights=" + x.brights +
    "; cup=" + x.cup +
    "; season=" + x.season;
  modal_window.append(hand);
  modal_window.style.display = "flex";
  if (x.turn == player) {
    let call_koi = document.createElement("button");
    call_koi.textContent = "koikoi";
    call_koi.onclick = () => koikoi_choice(true);
    let peace_out = document.createElement("button");
    peace_out.textContent = "Peace out";
    peace_out.onclick = () => koikoi_choice(false);
    modal_window.append(call_koi);
    modal_window.append(peace_out);
  }
}

function koikoi_choice(choice) {
  if (choice) {
    send_action(true);
  }
  else {
    send_action(false);
  }
}

function show_month_results() {
  modal_window.replaceChildren();
  let hand = document.createElement("div");
  hand.style.backgroundColor = "white";
  hand.textContent = "junk=" + x.junk +
    "; ribbons=" + x.ribbons +
    "; animals=" + x.animals +
    "; brights=" + x.brights +
    "; cup=" + x.cup +
    "; season=" + x.season;
  modal_window.append(hand);
  modal_window.style.display = "flex";
  if (x.turn == player) {
    let continue_button = document.createElement("button");
    continue_button.textContent = "continue";
    continue_button.onclick = function() {
      modal_window.style.display = "none";
      send_action(null);
    };
    modal_window.append(continue_button);
  }
}

function update() {
  if (x.state == "koikoi_decision") {
    request_koikoi();
  }
  else if (x.state == "month_end") {
    show_month_results();
  }
  else {
    modal_window.style.display = "none";
  }

  deck.replaceChildren();
  if (x.state == "flipping_decision") {
    deck.append(print_card(x.topdeck))
    deck.style.borderColor = "purple";
  }
  else {
    deck.style.borderColor = "white";
  }

  let hand = player == 1 ? x.p1_hand : x.p2_hand;
  for (let i=0; i<8; ++i) {
    p2hand[i].replaceChildren(print_card(hand[i]));

    // color selected hands
    p2hand[i].style.borderColor = "white";
    if (x.turn == player && x.hand_selection == i) {
      p2hand[i].style.borderColor = "red";
    }
  }

  for (let i=0; i<16; ++i) {
    board[i].replaceChildren(print_card(x.board[i]));
    board[i].style.borderColor = "white";
    board[i].style.cursor = "auto"; 
    if (x.hand_selection != null && card_month(x.turn == 1 ? x.p1_hand[x.hand_selection] : x.p2_hand[x.hand_selection]) == card_month(x.board[i])) {
      board[i].style.borderColor = "red";
      board[i].style.cursor = "pointer"; 
    }
    if (x.state == "flipping_decision" && card_month(x.topdeck) == card_month(x.board[i])) {
      board[i].style.borderColor = "purple";
      board[i].style.cursor = "pointer"; 
    }
  }
  state.textContent = "month=" + x.month;

  oppcollection.children[0].replaceChildren();
  oppcollection.children[1].replaceChildren();
  oppcollection.children[2].replaceChildren();
  oppcollection.children[3].replaceChildren();
  let collection = player == 1 ? x.p2_collection : x.p1_collection;
  for (let i=0; i<collection.length; ++i) {
    let div = document.createElement("div");
    div.appendChild(print_card(collection[i]));
    let point = card_point(collection[i]);
    oppcollection.children[4-point].append(div);
  }
  mycollection.children[0].replaceChildren();
  mycollection.children[1].replaceChildren();
  mycollection.children[2].replaceChildren();
  mycollection.children[3].replaceChildren();
  collection = player == 1 ? x.p1_collection : x.p2_collection;
  for (let i=0; i<collection.length; ++i) {
    let div = document.createElement("div");
    div.appendChild(print_card(collection[i]));
    let point = card_point(collection[i]);
    mycollection.children[4-point].append(div);
  }
  mypoints.textContent = player == 1 ? x.p1_year_points : x.p2_year_points;
  opppoints.textContent = player == 1 ? x.p2_year_points : x.p1_year_points;
}

function print_card(i) {
  if (i == 0) {
    let div = document.createElement("div");
    return div;
  }
  let img = document.createElement("img");
  img.src = "../hanafuda_cards/" + i + ".png";
  img.style.width = "100%";
  img.style.height = "100%";
  return img;
}

function card_month(card) {
  return Math.floor((card-1)/4) + 1;
}

function card_point(card) {
  if ([1,9,29,41,45].includes(card)) {
    return 4; // 20-point card
  } else if ([5,13,17,21,25,30,33,37,42].includes(card)) {
    return 3; // 10-point card
  } else if ([2,6,10,14,18,22,26,34,38,43].includes(card)) {
    return 2; // 5-point card
  } else if (card>0 && card<=48) {
    return 1; // 1-point card
  } else {
    return 0; // error
  }
}