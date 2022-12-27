let p1hand = document.querySelectorAll("#p1hand>div");
let p2hand = document.querySelectorAll("#p2hand>div");
let board = document.querySelectorAll("#board>div");
let p1collection = document.getElementById("p1collection");
let p2collection = document.getElementById("p2collection");
let p1_points = document.getElementById("p1_points");
let p2_points = document.getElementById("p2_points");
let state = document.getElementById("state");
let deck = document.getElementById("deck");
let modal_window = document.getElementById("modal_window");


let hand_pressed = null;


// Attach events to cards
for (let i=0; i<8; ++i) {
  p1hand[i].onclick = hand_click;
  p2hand[i].onclick = hand_click;
}
for (let i=0; i<16; ++i) {
  board[i].addEventListener("click",board_click,false)
}

function hand_click(e) {
  for (let i=0; i<8;++i) {
    if (e.currentTarget == p1hand[i] || e.currentTarget == p2hand[i]) {
      hand_pressed = i;
      break;
    }
  }
}

function board_click(e) {
  let j;
  for (let i=0; i<16;++i) {
    if (e.currentTarget == board[i]){
      j=i;
      break;
    }
  }
  console.log("click board",j)
  let answer;
  if (x.state != "choose_pairs") {
    answer = x.action(j);
  }
  else {
    if (hand_pressed == null) return;
    answer = x.action(hand_pressed,j);
  }
  console.log(answer)
  update();
  if (answer[0] == "koikoi_decision") {
    request_koikoi();
  }
  else if (answer[0] == "month_end") {
    show_month_results();
  }
  hand_pressed = null
}

function request_koikoi() {
  modal_window.replaceChildren();
  let hand = document.createElement("div");
  hand.style.backgroundColor = "white";
  let collection = x.turn == 1 ? x.p1_collection : x.p2_collection;
  hand.textContent = "junk=" + x.junk(collection) + "; ribbons=" + (x.poetry_ribbons(collection) + x.blue_ribbons(collection) + x.ribbons(collection)) +
    "; animals=" + (x.boar_dear_butterfly(collection) + x.animals(collection)) +
    "; brights=" + x.brights(collection) +
    "; cup=" + (x.moon_viewing(collection) + x.cherryblossom_viewing(collection));
  let call_koi = document.createElement("button");
  call_koi.textContent = "koikoi";
  call_koi.onclick = () => koikoi_choice(true);
  let peace_out = document.createElement("button");
  peace_out.textContent = "Peace out";
  peace_out.onclick = () => koikoi_choice(false);
  modal_window.append(hand);
  modal_window.append(call_koi);
  modal_window.append(peace_out);
  modal_window.style.display = "flex";
}

function koikoi_choice(choice) {
  if (choice) {
    x.action(true);
    modal_window.style.display = "none";
    update();
  }
  else {
    x.action(false)
    show_month_results();
  }
}

function show_month_results() {
  modal_window.replaceChildren();
  let hand = document.createElement("div");
  hand.style.backgroundColor = "white";
  let collection = x.turn == 1 ? x.p1_collection : x.p2_collection;
  hand.textContent = "junk=" + x.junk(collection) + "; ribbons=" + (x.poetry_ribbons(collection) + x.blue_ribbons(collection) + x.ribbons(collection)) +
    "; animals=" + (x.boar_dear_butterfly(collection) + x.animals(collection)) +
    "; brights=" + x.brights(collection) +
    "; cup=" + (x.moon_viewing(collection) + x.cherryblossom_viewing(collection));
  let continue_button = document.createElement("button");
  continue_button.textContent = "continue";
  continue_button.onclick = function() {
    modal_window.style.display = "none";
    x.action();
    update();
  };
  modal_window.append(hand);
  modal_window.append(continue_button);
  modal_window.style.display = "flex";
}

function update() {
  deck.replaceChildren();
  if (x.state == "flipping_decision") {
    deck.append(print_card(x.deck[x.deck.length-1]))
  }

  for (let i=0; i<8; ++i) {
    p1hand[i].replaceChildren(print_card(x.p1_hand[i]));
    p2hand[i].replaceChildren(print_card(x.p2_hand[i]));
  }
  for (let i=0; i<16; ++i) {
    board[i].replaceChildren(print_card(x.board[i]));
  }
  state.textContent = x.state + "; turn player " + x.turn;
  p1collection.children[0].replaceChildren();
  p1collection.children[1].replaceChildren();
  p1collection.children[2].replaceChildren();
  p1collection.children[3].replaceChildren();
  for (let i=0; i<x.p1_collection.length; ++i) {
    let div = document.createElement("div");
    div.appendChild(print_card(x.p1_collection[i]));
    let point = card_point(x.p1_collection[i]);
    p1collection.children[4-point].append(div);
  }
  p2collection.children[0].replaceChildren();
  p2collection.children[1].replaceChildren();
  p2collection.children[2].replaceChildren();
  p2collection.children[3].replaceChildren();
  for (let i=0; i<x.p2_collection.length; ++i) {
    let div = document.createElement("div");
    div.appendChild(print_card(x.p2_collection[i]));
    let point = card_point(x.p2_collection[i]);
    p2collection.children[4-point].append(div);
  }
  p1_points.textContent = x.p1_year_points;
  p2_points.textContent = x.p2_year_points;
}

function print_card(i) {
  if (i == 0) {
    let div = document.createElement("div");
    return div;
  }
  let img = document.createElement("img");
  img.src = "./hanafuda_cards/" + i + ".png";
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