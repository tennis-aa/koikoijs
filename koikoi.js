class koikoi {
  constructor() {
    this.deck = [];
    this.p1_hand = Array(8).fill(0);
    this.p2_hand = Array(8).fill(0);
    this.p1_collection = [];
    this.p2_collection = [];
    this.board = Array(16).fill(0);
    this.turn = 0;
    this.dealer = 0;
    this.month = 0;
    this.state = "blank";
    this.possible_states = ["blank","choose_hand","select_pair","flipping_decision","koikoi_decision","month_end","instant_win","game_over"];
    this.p1_year_points = 0;
    this.p2_year_points = 0;
    this.p1_month_points = 0;
    this.p2_month_points = 0;
    this.p1_koi = false;
    this.p2_koi = false;
    this.hand_selection = null;
  }

  start_year(player,perfect=false) {
    if (player == 1 || player == 2) {
      this.dealer = player;
      this.month = 0;
      this.p1_year_points = 0;
      this.p2_year_points = 0;
      this.start_month(perfect);
      return true;
    }
    else
      return false;
  }

  start_month(perfect = false) {
    if (this.state == "game_over") {
      return false;
    }
    if (perfect) this.dealer = 1;
    ++this.month;
    if (this.month > 12) {
      this.state = "game_over";
      return false;
    }
    this.shuffle_deck(perfect);
    this.p1_hand.fill(0);
    this.p2_hand.fill(0);
    this.p1_collection = [];
    this.p2_collection = [];
    this.board.fill(0);
    this.turn = this.dealer;
    this.state = "choose_hand";
    this.p1_month_points = 0;
    this.p2_month_points = 0;
    this.p1_koi = false;
    this.p2_koi = false;
    for (let i=0; i<8; ++i) {
      this.p1_hand[i] = this.deck.pop();
      this.p2_hand[i] = this.deck.pop();
      this.board[i] = this.deck.pop();
    }
    // redealt hands
    if (this.four_of_a_kind(this.board) || this.four_pairs(this.board)) {
      --this.month;
      return this.start_month();
    }
    // Check for automatic hands
    let p1_win = this.four_of_a_kind(this.p1_hand) || this.four_pairs(this.p1_hand);
    let p2_win = this.four_of_a_kind(this.p2_hand) || this.four_pairs(this.p2_hand);
    if (p1_win && p2_win) {
      --this.month;
      return this.start_month();
    }
    if (p1_win) {
      this.state = "instant_win";
      this.dealer = 1;
      this.p1_year_points += 6;
    }
    else if (p2_win) {
      this.state = "instant_win";
      this.dealer = 2;
      this.p2_year_points += 6;
    }
    return true;
  }

  four_pairs(collection) {
    let pair_count = 0;
    let paired = [];
    for (let i=0; i<collection.length; ++i) {
      if (paired.includes(i)) continue;
      let count = 0;
      for (let j=i+1; j<collection.length; ++j) {
        if (this.card_month(collection[i]) == this.card_month(collection[j])) {
          ++count;
          paired.push(j);
        }
      }
      if (count == 1)
        ++pair_count;
    }
    return pair_count == 4;
  }

  four_of_a_kind(collection) {
    let quartet_count = 0;
    let paired = [];
    for (let i=0; i<collection.length; ++i) {
      if (paired.includes(i)) continue;
      let count = 0;
      for (let j=i+1; j<collection.length; ++j) {
        if (this.card_month(collection[i]) == this.card_month(collection[j])) {
          ++count;
          paired.push(j);
        }
      }
      if (count == 3)
        ++quartet_count;
    }
    return quartet_count == 1;
  }

  shuffle_deck(perfect = false) {
    if (perfect) {
      this.deck = [1,13,2,   9,19,10,  6,14,42,   35,27,33,
                   41,37,38, 39,40,46, 26,25,30, 23,24,21,
                   29,28,45,20,34,47,3,4,7,8,11,12,15,16,17,18,
                   22,31,32,36,5,43,44,48];
      this.deck.reverse();
      return;
    }
    this.deck = Array(48).fill().map((element, index) => index + 1);
    for (let idx = 0; idx < this.deck.length; idx++) {
      let swpIdx = idx + Math.floor(Math.random() * (this.deck.length - idx));
      // now swap elements at idx and swpIdx
      let tmp = this.deck[idx];
      this.deck[idx] = this.deck[swpIdx];
      this.deck[swpIdx] = tmp;
    }
  }

  possibilities() {
    switch (this.state) {
      case "blank":
        return "start_game";
      case "koikoi_decision":
        return "choose `true` to call koi and false to peace out";
      case "flipping_decision":
        return "choose the card on the board that you want to pair with the flip.";
      case "choose_hand":
        return "choose pair in hand and board";
      case "select_pair":
        return "select pair on the board";
      case "instant_win":
        return "instant win: any action continues to next month";
      case "game_over":
        return "game is over";
      default:
        return "unknown state";
    }
  }

  action(x) {
    if (this.state == "game_over") {
      return ["game_over"];
    }
    else if (this.state == "blank") {
      this.start_year(Math.random() < 0.5 ? 1 : 2);
      return ["start_game"];
    }
    else if (this.state == "month_end") {
      this.start_month();
      return ["start_month"];
    }
    else if (this.state == "instant_win") {
      this.start_month();
      return ["start_month"];
    }
    else if (this.state == "koikoi_decision") {
      return this.make_koikoi_decision(x);
    }
    else if (this.state == "flipping_decision") {
      let flip_decision = this.make_flipping_decision(x); 
      if (flip_decision[0] == "error") {
        return flip_decision;
      }
      else {
        return this.check_if_hand_formed();
      }
    }
    else if (this.state == "select_pair") {
      let result = this.select_pair(x);
      if (result[0] == "error") {
        this.state = "choose_hand";
        return result;
      }
      else {
        let flip = this.flip_top_deck();
        if (flip[0] == "flipping_decision") {
          this.state = "flipping_decision";
          return flip;
        }
        else {
          return this.check_if_hand_formed();
        }
      }
    }
    else if (this.state == "choose_hand") {
      let pairing = this.make_hand_choice(x)
      if (pairing[0] == "error") {
        return pairing;
      }
      else if (pairing[0] == "select_pair") {
        this.state = "select_pair";
        return pairing;
      }
      else {
        let flip = this.flip_top_deck();
        if (flip[0] == "flipping_decision") {
          this.state = "flipping_decision";
          return flip;
        }
        else {
          return this.check_if_hand_formed();
        }
      }
    }
  }

  make_koikoi_decision(x) {
    if (this.state != "koikoi_decision") {
      return ["error: not time to make koikoi decision"];
    }
    if (x) {
      this.state = "choose_hand";
      if (this.turn == 1) {
        this.p1_koi = true;
        this.turn = 2
      }
      else {
        this.p2_koi = true;
        this.turn = 1;
      }
      return ["koi-koi"]
    }
    else {
      let points;
      if (this.turn == 1) {
        points = this.p1_month_points * (this.p2_koi ? 2 : 1)
        this.p1_year_points += points;
        this.dealer = 1;
      } else {
        points = this.p2_month_points * (this.p1_koi ? 2 : 1)
        this.p2_year_points += points;
        this.dealer = 2;
      }
      this.state = "month_end";
      return ["month_end", this.turn, points];
    }
  }

  make_flipping_decision(x) {
    let flip = this.deck[this.deck.length-1];
    let collection = this.turn == 1 ? this.p1_collection : this.p2_collection;
    if (this.card_month(flip) != this.card_month(this.board[x])) {
      return ["error","flip and choice of card are not the same month.", this.card_month(flip), this.card_month(this.board[x])];
    }
    else { // proper matching
      collection.push(this.deck.pop(),this.board[x]);
      this.board[x] = 0;
      return ["flip_pair",collection[collection.length-1],collection[collection.length-2]];
    }
  }

  make_hand_choice(x) {
    let hand = this.turn == 1 ? this.p1_hand : this.p2_hand;
    let collection = this.turn == 1 ? this.p1_collection : this.p2_collection;

    if (hand[x] == 0) return ["error","no card from hand selected"];

    let pairings = [];
    for (let i=0; i<this.board.length; ++i) {
      if (this.card_month(hand[x]) == this.card_month(this.board[i]))
        pairings.push(i);
    }
    if (pairings.length == 0) {
      let y;
      for (let i=0; i<this.board.length; ++i) {
        if (this.board[i] == 0){
          y = i;
          break;
        }
      }
      this.board[y] = hand[x];
      hand[x] = 0;
      return ["card_to_board"];
    }
    else if (pairings.length == 1) {
      let y = pairings[0];
      collection.push(hand[x],this.board[y]);
      hand[x] = 0;
      this.board[y] = 0;
      return ["pairing",collection.slice(collection.length-2)];
    }
    else if (pairings.length == 3) {
      collection.push(hand[x],this.board[pairings[0]],this.board[pairings[1]],this.board[pairings[2]])
      hand[x] = 0;
      this.board[pairings[0]] = 0;
      this.board[pairings[1]] = 0;
      this.board[pairings[2]] = 0;
      return ["pairing",collection.slice(collection.length-4)]
    }
    else if (pairings.length == 2) {
      this.hand_selection = x;
      return ["select_pair", x, pairings[0], pairings[1]];
    }
  }

  select_pair(x) {
    let hand = this.turn == 1 ? this.p1_hand : this.p2_hand;
    let collection = this.turn == 1 ? this.p1_collection : this.p2_collection;

    if (this.card_month(hand[this.hand_selection]) != this.card_month(this.board[x])) {
      this.hand_selection = null;
      return ["error","hand and board are not the same month"]
    }
    else {
      collection.push(hand[this.hand_selection],this.board[x]);
      hand[this.hand_selection] = 0;
      this.board[x] = 0;
      this.hand_selection = null;
      return ["pairing",collection.slice(collection.length-2)];
    }
  }

  flip_top_deck() {
    let flip = this.deck[this.deck.length-1];
    let flip_month = this.card_month(flip);
    let flippable = [];
    let collection = this.turn == 1 ? this.p1_collection : this.p2_collection;

    for (let i=0; i<this.board.length; ++i) {
      if (this.card_month(this.board[i]) == flip_month) flippable.push(i);
    }

    if (flippable.length == 0) {
      for (let i=0; i<this.board.length; ++i) {
        if (this.board[i] == 0){
          this.board[i] = this.deck.pop();
          return ["flipped_no_pairing",this.board[i]];
        }
      }
    }
    else if (flippable.length == 1) {
      collection.push(this.board[flippable[0]])
      this.board[flippable[0]] = 0;
      collection.push(this.deck.pop());
      return ["flipped_1_pairing",collection.slice(collection.length-2)];
    }
    else if (flippable.length == 3) {
      for (let i=0; i<flippable.length; ++i) {
        collection.push(this.board[flippable[i]])
        this.board[flippable[i]] = 0;
      }
      collection.push(this.deck.pop());
      return ["flipped_3_pairing",collection.slice(collection.length-4)];
    }
    else if (flippable.length == 2) {
      return ["flipping_decision",this.deck[this.deck.length-1],flippable[0],flippable[1]];
    }
    else {
      return ["error"]
    }
  }

  check_if_hand_formed() {
    let collection = this.turn == 1 ? this.p1_collection : this.p2_collection;
    let old_points = this.turn == 1 ? this.p1_month_points : this.p2_month_points;
    let new_points = this.compute_points(collection);
    let hand = this.turn == 1 ? this.p1_hand : this.p2_hand;
    if (new_points > old_points) {
        if (this.turn == 1) this.p1_month_points = new_points; 
        else this.p2_month_points = new_points;
        this.state = "koikoi_decision";
        let sum_hand = hand.reduce((a,b)=>a+b,0);
        if (sum_hand > 0) {
          return ["koikoi_decision",new_points];
        }
        else {
          return this.make_koikoi_decision(false);
        }
    }
    else if (this.p1_hand.reduce((a,b)=>a+b,0) == 0 && this.p2_hand.reduce((a,b)=>a+b,0) == 0) {
      this.state = "koikoi_decision";
      if (this.dealer == 1) {
        this.p1_month_points = 1;
        this.turn = 1;
        return this.make_koikoi_decision(false);
      }
      else {
        this.p2_month_points = 1;
        this.turn = 2;
        return this.make_koikoi_decision(false);
      }
    }
    this.state = "choose_hand";
    this.turn = this.turn == 1 ? 2 : 1;
    return ["no_hands"];
  }

  compute_points(collection) {
    let points = 0;
    points += this.junk(collection);
    points += this.season(collection);
    points += this.poetry_ribbons(collection);
    points += this.blue_ribbons(collection);
    points += this.ribbons(collection);
    points += this.boar_dear_butterfly(collection);
    points += this.animals(collection);
    points += this.brights(collection);
    if (points > 0) {
      points += this.moon_viewing(collection);
      points += this.cherryblossom_viewing(collection)
    }
    return points;
  }

  card_month(card) {
    return Math.floor((card-1)/4) + 1;
  }

  card_point(card) {
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

  junk(collection) {
    let count = 0;
    for (let i=0; i<collection.length; ++i) {
      if (this.card_point(collection[i]) == 1 || collection[i]==33) ++count;
    }
    return Math.max(0,count-9);
  }

  season(collection) {
    if (collection.includes((this.month-1)*4+1) && collection.includes((this.month-1)*4+2) && 
    collection.includes((this.month-1)*4+3) && collection.includes((this.month-1)*4+4)) {
      return 4;
    }
    return 0;
  }

  ribbons(collection) {
    let count = 0;
    for (let i=0; i<collection.length; ++i) {
      if (this.card_point(collection[i]) == 2) ++count;
    }
    if (count < 3) return 0;
    if (this.poetry_ribbons(collection) && this.blue_ribbons(collection)) {
      return count-6;
    } else if (this.poetry_ribbons(collection) || this.blue_ribbons(collection)) {
      return count-3;
    }
    return Math.max(0,count-4);
  }

  poetry_ribbons(collection) {
    if (collection.includes(2) && collection.includes(6) && collection.includes(10)) {
      return 6;
    }
    return 0;
  }

  blue_ribbons(collection) {
    if (collection.includes(22) && collection.includes(34) && collection.includes(38)) {
      return 6;
    }
    return 0;
  }

  animals(collection) {
    let count = 0;
    for (let i=0; i<collection.length; ++i) {
      if (this.card_point(collection[i]) == 3) ++count;
    }
    if (count < 4) return 0;
    if (this.boar_dear_butterfly(collection)) {
      return count-3;
    }
    return Math.max(0,count-4);
  }

  boar_dear_butterfly(collection) {
    if (collection.includes(25) && collection.includes(21) && collection.includes(37)) 
      return 5;
    return 0;
  }

  brights(collection) {
    let count = 0;
    for (let i=0; i<collection.length; ++i) {
      if (this.card_point(collection[i]) == 4) ++count;
    }
    let rainman = collection.includes(41);
    if (count==5) {
      return 15;
    } else if (rainman && count==4) {
      return 8;
    }
    else if (!rainman && count==4) {
      return 10;
    }
    else if (!rainman && count==3) {
      return 6;
    }
    return 0;
  }

  moon_viewing(collection) {
    if (collection.includes(33) && collection.includes(29) && 
      !this.board.includes(45) && !this.board.includes(46) && !this.board.includes(47) && !this.board.includes(48)) {
        return 5;
      }
    return 0;
  }
  
  cherryblossom_viewing(collection) {
    if (collection.includes(33) && collection.includes(9) && 
      !this.board.includes(41) && !this.board.includes(42) && !this.board.includes(43) && !this.board.includes(44)) {
        return 5;
      }
    return 0;
  }
}

module.exports = { koikoi };