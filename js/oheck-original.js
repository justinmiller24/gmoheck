/*
Hi there

You are here for one of two possible reasons:

 1. You are creating a card game yourself and want to look at the source
    to see how it's done.
	
 2. You're trying to figure out how you can cheat.
 
If the reason is (1) then run the code through a javascript beautifier, e.g.
http://jsbeautifier.org and look at the code. You are free to borrow things from
it, re-use some of it etc. The only thing you can't do is republish the game like
it is here on your own site.

If the reason is (2) then I can't help but wonder why you'd want to cheat in a 
single player card game. But, feel free to do so. You can't affect anything on
the server and can't affect other users in any way, so if you want to cheat it's
completely harmless. Just look at the code and cheat away! Try "game.players[1].hand"
or "game.deck" in the javascript console to get some info about what's going on :)

Any questions or comments? Send them to einar@einaregilsson.com

Enjoy!	
*/
function $A(arr) {
	return {
		arr: arr,
		each: function (func) {
			for (var i = 0; i < this.arr.length; i++) {
				func.call(this.arr, this.arr[i]);
			}
		},
		any: function (func) {
			for (var i = 0; i < this.arr.length; i++) {
				if (func.call(this.arr, this.arr[i])) {
					return true;
				}
			}
			return false;
		},
		max: function (func) {
			var max = null;
			for (var i = 0; i < this.arr.length; i++) {
				var val = func.call(this.arr, this.arr[i])
				if (max === null) {
					max = val;
				} else if (val >= max) {
					max = val;
				}
			}
			return max;
		},
		random: function () {
			return this.arr[Math.floor(Math.random() * this.arr.length)];
		},
		where: function (func) {
			var result = [];
			for (var i = 0; i < this.arr.length; i++) {
				var obj = this.arr[i];
				if (func(obj)) {
					result.push(obj);
				}
			}
			return result;
		},
		count: function (func) {
			var counter = 0;
			for (var i = 0; i < this.arr.length; i++) {
				if (func.call(this.arr, this.arr[i])) {
					counter++;
				}
			}
			return counter;
		},
		all: function (func) {
			for (var i = 0; i < this.arr.length; i++) {
				if (!func.call(this.arr, this.arr[i])) {
					return false;
				}
			}
			return true;
		},
		remove: function (item) {
			for (var i = 0; i < this.arr.length; i++) {
				if (this.arr[i] == item) {
					this.arr.splice(i, 1);
					return true;
				}
			}
			return false;
		},
		last: function () {
			if (!this.arr.length) {
				return null;
			}
			return this.arr[this.arr.length - 1];
		},
		indexOf: function (item) {
			for (var i = 0; i < this.arr.length; i++) {
				if (this.arr[i] == item) {
					return i;
				}
			}
			return -1;
		},
		contains: function (item) {
			return this.indexOf(item) != -1;
		}
	};
}
var errorHandling = true;

function handleError(error) {
	throw error;
}

function log(msg) {
	if (typeof WScript == "object") {
		WScript.Echo(msg);
	}
}

function trace(msg) {
	log(msg);
}
trace.enabled = false;

function Card(suit, rank) {
	this.init(suit, rank);
}
Card.prototype = {
	playable: false,
	init: function (suit, rank) {
		this.shortName = suit + rank;
		this.suit = suit;
		this.rank = rank;
		if (suit == 'bj') {
			this.longName = 'black joker';
			this.shortName = 'BJ';
			return;
		} else if (suit == 'rj') {
			this.longName = 'red joker';
			this.shortName = 'RJ';
			return;
		}
		var sorts = {
			"h": 'hearts',
			"s": 'spades',
			"d": 'diamonds',
			"c": 'clubs'
		};
		var specialCards = {
			11: 'jack',
			12: 'queen',
			13: 'king',
			1: 'ace',
			14: 'ace'
		}
		if (specialCards[rank]) {
			this.longName = specialCards[rank] + ' of ' + sorts[suit];
		} else {
			this.longName = rank + ' of ' + sorts[suit];
		}
		this.shortName = this.suit.toUpperCase() + this.rank;
	},
	toString: function () {
		return this.shortName;
	},
	rankName: function () {
		var names = [null, null, 'a two', 'a three', 'a four', 'a five', 'a six', 'a seven', 'an eight', 'a nine', 'a ten', 'a jack', 'a queen', 'a king', 'an ace'];
		return names[this.rank];
	},
	shortRankName: function () {
		var names = [null, null, 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king', 'ace'];
		return names[this.rank];
	},
	suitName: function () {
		var sorts = {
			"h": 'heart',
			"s": 'spade',
			"d": 'diamond',
			"c": 'club'
		};
		return sorts[this.suit];
	}
};

function CardGame() {
	this.initDefaults();
}
CardGame.prototype = {
	cardCount: 8,
	enableRendering: true,
	defaultPlayerCount: 2,
	useBlackJoker: false,
	useRedJoker: false,
	acesHigh: true,
	makeRenderFunc: function (format) {
		return function (e) {
			with(e) {
				var msg = eval(format.replace(/@(\w+(\.\w+)*)/g, "'+$1+'").replace(/(.*)/, "'$1'"));
				log(msg);
			}
			e.game.callbackQueue.push(e);
		};
	},
	initDefaults: function () {
		this.callbackQueue = [];
		this.renderers = {};
		this.renderers['deckready'] = this.makeRenderFunc('deckready');
		this.renderers['dealcard'] = this.makeRenderFunc('dealcard - @card - @player.name - hand: @player.hand');
		this.renderers['selectcard'] = this.makeRenderFunc('selectcard - @card - @player.name');
		this.renderers['unselectcard'] = this.makeRenderFunc('unselectcard - @card - @player.name');;
		this.renderers['start'] = this.makeRenderFunc('start');
		this.renderers['playerturn'] = this.makeRenderFunc('playerturn - @player.name');
		this.renderers['play'] = this.makeRenderFunc('play - @player.name played @cards - hand: @player.hand');
		this.renderers['draw'] = this.makeRenderFunc('draw - @card - @player.name');
		this.renderers['pass'] = this.makeRenderFunc('pass - @player.name');
		this.renderers['win'] = this.makeRenderFunc('win - @player.name');
		this.renderers['sorthand'] = this.makeRenderFunc('sorthand - @player.name - @player.hand');
		this.renderers['pickdealer'] = this.makeRenderFunc('pickdealer - @player.name');
		this.players = [];
	},
	runInConsole: function () {
		this.start();
		var names = ['Bill', 'John', 'Alice', 'Alex', 'Christy', 'Sarah', 'William'];
		for (var i = 0; i < this.defaultPlayerCount; i++) {
			this.addPlayer(new ComputerPlayer(names[i]));
		}
		this.deal();
		while (this.callbackQueue.length > 0) {
			var e = this.callbackQueue.splice(0, 1)[0];
			e.callback();
		}
	},
	message: function (msg) {},
	renderEvent: function (name, callback, eventData) {
		if (!eventData) {
			eventData = {};
		}
		if (!eventData.player) {
			eventData.player = this.currentPlayer();
		}
		eventData.name = name;
		eventData.game = this;
		var game = this;
		eventData.callback = function () {
			if (errorHandling) {
				try {
					callback.call(game);
				} catch (e) {
					handleError(e);
				}
			} else {
				callback.call(game);
			}
		};
		if (this.enableRendering) {
			if (errorHandling) {
				try {
					this.renderers[name](eventData);
				} catch (e) {
					handleError(e);
				}
			} else {
				this.renderers[name](eventData);
			}
		} else {
			eventData.callback();
		}
	},
	setEventRenderer: function (eventName, func) {
		this.renderers[eventName] = func;
	},
	getPlayableCards: function (player) {
		var playableCards = [];
		$A(player.hand).each(function (c) {
			if (c.playable) {
				playableCards.push(c);
			}
		});
		return playableCards;
	},
	players: null,
	deck: null,
	pile: null,
	currentPlayerIndex: 0,
	playCards: function (player, cards) {
		for (var i = 0; i < cards.length; i++) {
			var card = cards[i];
			if (!this.canPlayCard(player, card)) {
				throw 'Illegal card from ' + player.name + ', ' + card;
			}
			this.pile.push(card);
			card.selected = false;
			if (!player.remove(card)) {
				throw 'Card ' + card + ' is not held by player ' + player.name;
			}
		}
		player.selectedCards = [];
		player.canPlay = false;
		this.renderEvent('play', this.afterPlayCards, {
			cards: cards
		});
	},
	afterPlayCards: function () {
		this.nextPlayerTurn();
	},
	selectCard: function (player, card, callback) {
		if (!player.hasCard(card)) {
			throw "Player can't select a card he doesn't hold!";
		}
		if (card.selected) {
			throw 'Card is already selected!';
		}
		if (player.selectedCards === this.undefined) {
			player.selectedCards = [];
		}
		card.selected = true;
		player.selectedCards.push(card);
		this.renderEvent('selectcard', callback ||
		function () {}, {
			card: card,
			player: player
		});
	},
	unselectCard: function (player, card) {
		if (!player.hasCard(card)) {
			throw "Player can't unselect a card he doesn't hold!";
		}
		if (!card.selected) {
			throw 'Card is not selected!';
		}
		card.selected = false;
		$A(player.selectedCards).remove(card);
		this.renderEvent('unselectcard', function () {}, {
			card: card,
			player: player
		});
	},
	sortHand: function (player, callback, dontRender) {
		if (!player.hand) {
			return;
		}
		var diff = function (a, b) {
				if (player.handSorted == 'ASC') {
					return b - a;
				}
				return a - b;
			}
		if (this.sortType == 'suit') {
			player.hand.sort(function (c1, c2) {
				var suits = {
					"h": 0,
					"s": 1,
					"d": 2,
					"c": 3
				};
				if (c1.suit == c2.suit) {
					return diff(c1.rank, c2.rank);
				}
				return diff(suits[c1.suit], suits[c2.suit]);
			});
		} else if (this.sortType == 'rank') {
			player.hand.sort(function (c1, c2) {
				var suits = {
					"h": 0,
					"s": 1,
					"d": 2,
					"c": 3
				};
				if (c1.rank == c2.rank) {
					return diff(suits[c1.suit], suits[c2.suit]);
				}
				return diff(c1.rank, c2.rank);
			});
		}
		player.handSorted = (player.handSorted == 'ASC') ? 'DESC' : 'ASC';
		if (!dontRender) {
			this.renderEvent('sorthand', callback ||
			function () {});
		}
	},
	drawCard: function (player) {
		player.hand.push(this.deck.pop());
		player.handSorted = false;
		player.canPlay = false;
		this.renderEvent('draw', this.playerPlay, {
			card: $A(player.hand).last(),
			cardpos: player.hand.length - 1
		});
	},
	currentPlayerTurn: function () {
		this.beforePlayerTurn(this.currentPlayer());
		this.renderEvent('playerturn', this.playerPlay);
	},
	playerDraw: function (player) {
		player.draw();
	},
	playerPlay: function () {
		var p = this.currentPlayer();
		var playable = [];
		for (var i = 0; i < p.hand.length; i++) {
			var card = p.hand[i];
			card.playable = this.canPlayCard(p, card);
			if (card.playable) {
				playable.push(card);
			}
		}
		p.canPlay = true;
		p.hasPlayableCards = playable.length > 0;
		if (playable.length == 0) {
			if (this.mustSayPass(p)) {
				this.renderEvent('pass', this.nextPlayerTurn);
			} else if (this.mustDraw(p)) {
				this.playerDraw(p);
			} else {
				throw 'Game must implement mustSayPass or mustDraw correctly';
			}
		} else {
			this.currentPlayer().play(playable);
		}
	},
	nextPlayerTurn: function () {
		var player = this.currentPlayer();
		if (this.hasWon(player)) {
			this.message(player.name + ' wins!');
			this.renderEvent('win', function () {});
		} else {
			this.currentPlayerIndex = this.pickNextPlayerIndex();
			if (this.isNewRoundStarting()) {
				this.round++;
			}
			this.currentPlayerTurn();
		}
	},
	addPlayer: function (player) {
		player.game = this;
		player.pos = this.players.length;
		this.players.push(player);
	},
	getNextPlayer: function (player) {
		var pos = $A(this.players).indexOf(player);
		return this.players[this.nextIndex(pos)];
	},
	start: function () {
		this.pile = [];
		this.round = 0;
		this.newDeck();
	},
	afterDealing: function () {
		this.currentPlayerIndex = this.pickFirstPlayerIndex();
		this.renderEvent('start', this.currentPlayerTurn);
	},
	currentPlayer: function () {
		return this.players[this.currentPlayerIndex];
	},
	newDeck: function () {
		this.deck = [];
		var start = this.acesHigh ? 2 : 1;
		var end = start + 12;
		for (var i = start; i <= end; i++) {
			this.deck.push(new Card('h', i));
			this.deck.push(new Card('s', i));
			this.deck.push(new Card('d', i));
			this.deck.push(new Card('c', i));
		}
		if (this.useBlackJoker) {
			this.deck.push(new Card('bj', 0));
		}
		if (this.useRedJoker) {
			this.deck.push(new Card('rj', 0));
		}
		this.shuffle(this.deck);
		this.renderEvent('deckready', function () {});
	},
	shuffle: function (deck) {
		var i = deck.length;
		if (i == 0) return;
		while (--i) {
			var j = Math.floor(Math.random() * (i + 1));
			var tempi = deck[i];
			var tempj = deck[j];
			deck[i] = tempj;
			deck[j] = tempi;
		}
	},
	dealtCardCount: 0,
	nextPlayerToDealTo: 0,
	dealerIndex: -1,
	lastDealerIndex: -1,
	deal: function () {
		if (this.dealerIndex == -1) {
			this.dealerIndex = this.pickDealerIndex();
			this.nextPlayerToDealTo = this.nextIndex(this.dealerIndex);
			this.renderEvent('pickdealer', this.deal, {
				player: this.players[this.dealerIndex]
			});
			return;
		}
		if (this.dealtCardCount == this.cardCount * this.players.length) {
			this.afterDealing();
		} else {
			var card = this.deck.pop();
			var player = this.players[this.nextPlayerToDealTo];
			player.hand.push(card);
			this.nextPlayerToDealTo = this.nextIndex(this.nextPlayerToDealTo);
			this.dealtCardCount++;
			this.renderEvent('dealcard', this.deal, {
				player: player,
				cardpos: player.hand.length - 1,
				card: card
			});
		}
	},
	create: function (realGame) {
		for (var i in this) {
			if (!realGame[i]) {
				realGame[i] = this[i];
			}
		}
		realGame.base = this;
	},
	pickDealerIndex: function () {
		if (this.lastDealerIndex >= 0) {
			return this.nextIndex(this.lastDealerIndex);
		} else {
			return Math.floor(Math.random() * this.players.length);
		}
	},
	pickFirstPlayerIndex: function () {
		return this.nextIndex(this.dealerIndex);
	},
	hasWon: function (player) {
		return false;
	},
	beforePlayerTurn: function (player) {},
	canPlayCard: function (player, card) {
		return true;
	},
	canSelectCard: function (player, card) {
		return true;
	},
	mustSayPass: function (player) {
		return false;
	},
	mustDraw: function (player) {
		return false;
	},
	nextIndex: function (index) {
		return (index + 1) % this.players.length;
	},
	pickNextPlayerIndex: function () {
		return this.nextIndex(this.currentPlayerIndex);
	},
	isNewRoundStarting: function () {
		return this.currentPlayerIndex == 0;
	}
}

function Spades() {
	CardGame.prototype.create(this);
	this.init();
}
Spades.prototype = {
	cardCount: 13,
	sortType: 'suit',
	canSelectCards: false,
	defaultPlayerCount: 4,
	spadesIsBroken: false,
	previousGameScores: null,
	init: function () {
		this.initDefaults();
		this.renderers['spadesbroken'] = this.makeRenderFunc('spadesbroken - @player.name breaks spades');
		this.renderers['taketrick'] = this.makeRenderFunc('taketrick - @player.name takes the trick');
		this.renderers['bid'] = this.makeRenderFunc('bid - @player.name bids @bid');
		this.renderers['showscore'] = this.makeRenderFunc('showscore');
	},
	toString: function () {
		return 'Spades';
	},
	canPlayCard: function (player, card) {
		if (this.pile.length == 0) {
			if (card.suit != 's') {
				return true;
			}
			return this.spadesIsBroken || $A(player.hand).all(function (c) {
				return c.suit == 's';
			});
		}
		var trickSuit = this.pile[0].suit;
		return card.suit == trickSuit || !$A(player.hand).any(function (c) {
			return c.suit == trickSuit;
		});
	},
	canSelectCard: function (player, card) {
		return this.canPlayCard(player, card);
	},
	afterDealing: function () {
		for (var i = 0; i < this.players.length; i++) {
			var p = this.players[i];
			if (p.isHuman && !p.handSorted) {
				return this.sortHand(p, this.afterDealing);
			}
		}
		$A(this.players).each(function (p) {
			p.tricks = [];
			p.bidValue = -1;
		});
		for (var i = 0; i < this.players.length; i++) {
			this.players[i].partner = this.players[(i + 2) % this.players.length];
		}
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].beforeGameStart) {
				this.players[i].beforeGameStart();
			}
		}
		this.currentPlayerIndex = this.pickFirstPlayerIndex();
		this.bidPlayerIndex = this.currentPlayerIndex;
		this.players[this.bidPlayerIndex].bid();
	},
	bid: function (player, bid) {
		player.bidValue = bid;
		this.renderEvent('bid', this.afterRenderBid, {
			player: player,
			bid: bid
		});
	},
	afterRenderBid: function () {
		if ($A(this.players).all(function (p) {
			return p.bidValue >= 0;
		})) {
			this.renderEvent('start', this.currentPlayerTurn);
		} else {
			this.bidPlayerIndex = (this.bidPlayerIndex + 1) % this.players.length;
			this.players[this.bidPlayerIndex].bid();
		}
	},
	beforePlayerTurn: function (player) {},
	playCards: function (player, cards) {
		if (cards[0].suit == 's' && !this.spadesIsBroken) {
			this.spadesIsBroken = true;
			this.renderEvent('spadesbroken', function () {});
		}
		for (var i = 0; i < this.players.length; i++) {
			this.players[i].notifyPlay(this.pile, player, cards[0]);
		}
		this.base.playCards.call(this, player, cards);
	},
	playerPlay: function () {
		this.base.playerPlay.call(this);
	},
	calculateScore: function () {
		function calcForTeam(p1, p2) {
			var result = {
				bid: p1.bidValue + p2.bidValue,
				tricks: 0,
				bagsPrevRound: p1.bags || 0,
				bags: 0,
				totalBags: 0,
				bagsNextRound: 0,
				nilBidScore: 0,
				nilBidPenalty: 0,
				bagsScore: 0,
				bagsPenalty: 0,
				tricksScore: 0,
				tricksPenalty: 0,
				score: 0,
				scoreLastRound: p1.scoreLastRound || 0,
				scoreTotal: 0
			};
			var nilBidBonus = 100;
			var pointsPerBidTrick = 10;
			var pointsPerBag = 1;
			var tenBagsPenalty = 100;
			var team = [p1, p2];
			for (var i in team) {
				var p = team[i];
				if (p.bidValue == 0 && p.tricks.length == 0) {
					result.nilBidScore += nilBidBonus;
				} else if (p.bidValue == 0 && p.tricks.length > 0) {
					result.nilBidPenalty -= nilBidBonus;
					result.bags += p.tricks.length;
				} else {
					result.tricks += p.tricks.length;
				}
			}
			if (result.tricks >= result.bid) {
				result.bags += result.tricks - result.bid;
				result.totalBags = result.bags + result.bagsPrevRound;
				result.bagsNextRound = result.totalBags;
				result.bagsScore += (result.tricks - result.bid);
				result.tricksScore += result.bid * pointsPerBidTrick;
				if (result.bagsNextRound >= 10) {
					result.bagsPenalty -= tenBagsPenalty;
					result.bagsNextRound -= 10;
				}
			} else {
				result.tricksPenalty -= result.bid * pointsPerBidTrick;
			}
			result.score = result.tricksScore + result.tricksPenalty + result.bagsScore + result.bagsPenalty + result.nilBidScore + result.nilBidPenalty;
			result.scoreTotal = result.score + result.scoreLastRound;
			return result;
		}
		var result1 = calcForTeam(this.players[0], this.players[2]);
		var result2 = calcForTeam(this.players[1], this.players[3]);
		if ((result1.scoreTotal < 500 && result2.scoreTotal < 500) || (result1.scoreTotal >= 500 && result1.score == result2.score)) {
			this.renderEvent('showscore', function () {}, {
				team1: result1,
				team2: result2
			});
		} else if (result1.scoreTotal >= 500 && result1.scoreTotal > result2.scoreTotal) {
			this.renderEvent('win', function () {}, {
				team1: result1,
				team2: result2,
				winner: 1
			});
		} else if (result2.scoreTotal >= 500) {
			this.renderEvent('win', function () {}, {
				team1: result1,
				team2: result2,
				winner: 2
			});
		} else {
			alert('someth ' + result1.scoreTotal);
		}
	},
	afterPlayCards: function () {
		if (this.pile.length < this.players.length) {
			this.nextPlayerTurn();
		} else {
			var winner = 0;
			var firstCard = this.pile[0];
			var bestCard = firstCard;
			var firstPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
			for (var i = 1; i < this.pile.length; i++) {
				var card = this.pile[i];
				if (bestCard.suit != 's' && card.suit == 's') {
					bestCard = card;
					winner = i;
				} else if (card.suit == bestCard.suit && card.rank > bestCard.rank) {
					bestCard = card;
					winner = i;
				}
			}
			var winnerIndex = (firstPlayerIndex + winner) % this.players.length;
			var finished = this.players[0].hand.length == 0;
			this.currentPlayerIndex = winnerIndex;
			this.currentPlayer().tricks.push(this.pile.slice(0));
			var oldPile = this.pile;
			this.pile = [];
			var callback = !finished ? this.currentPlayerTurn : this.calculateScore;
			this.renderEvent('taketrick', callback, {
				trick: oldPile
			});
		}
	}
};

function createGame() {
	return new Spades();
}
var INTELLIGENT = 0;
var RANDOM = 1;
var EVIL = 2;
var INTELLIGENT_AND_EVIL = 3;

function ComputerPlayer(name) {
	this.init(name);
}
ComputerPlayer.prototype = {
	name: null,
	hand: null,
	strategy: INTELLIGENT,
	isHuman: false,
	init: function (name) {
		this.name = name;
		this.hand = [];
		this.selectedCards = [];
	},
	play: function (playable) {
		var randomCard = playable[Math.floor(Math.random() * playable.length)];
		var playCards = [randomCard];
		this.game.playCards(this, playCards);
	},
	draw: function () {
		this.game.drawCard(this);
	},
	extend: function (type) {
		this.base = {};
		for (var i in type) {
			if (this[i]) {
				this.base[i] = this[i];
			}
			this[i] = type[i];
		}
		if (type.hasOwnProperty('toString')) {
			this.toString = type.toString;
		}
	},
	toString: function () {
		var str = this.name;
		if (this.hand.length) {
			str += ' - HAND: ' + this.hand;
		}
		return str;
	},
	hasCard: function (card) {
		return $A(this.hand).contains(card);
	},
	remove: function (card) {
		return $A(this.hand).remove(card);
	}
};
ComputerPlayer.prototype.extend({
	notifyPlay: function (pile, player, card) {
		if (pile.length > 0 && pile[0].suit != card.suit) {
			this.playerInfo[player.name][pile[0].suit] = false;
		}
		$A(this.remaining[card.suit]).remove(card.rank);
		if (this.remaining[card.suit].length == 0) {
			for (var i in this.playerInfo) {
				this.playerInfo[i][card.suit] = false;
			}
		}
	},
	play: function (playable) {
		if (this.game.pile.length == 0) {
			this.playPos1(playable);
		} else if (this.game.pile.length == 1) {
			this.playPos2(playable);
		} else if (this.game.pile.length == 2) {
			this.playPos3(playable);
		} else if (this.game.pile.length == 3) {
			this.playPos4(playable);
		}
	},
	playPos1: function (playable) {
		var myIndex = $A(this.game.players).indexOf(this);
		var op1 = this.game.players[(myIndex + 1) % 4];
		var op2 = this.game.players[(myIndex + 3) % 4];
		var partner = this.partner;
		for (var i in playable) {
			var card = playable[i];
			card.goodness = 0;
			for (var j in this.remaining[card.suit]) {
				if (this.remaining[card.suit][j] > card.rank) {
					card.goodness--;
				}
			}
			if (this.playerInfo[partner.name][card.suit] == false && card.goodness < 0) {
				card.goodness -= 1000;
			}
			if (this.playerInfo[op1.name][card.suit] == false && this.playerInfo[op1.name]['s'] == false && this.playerInfo[op2.name][card.suit] == false && this.playerInfo[op2.name]['s'] == false) {
				card.goodness += 1000;
			}
			if (this.playerInfo[op1.name][card.suit] == false) {
				card.goodness += 2;
				if (this.playerInfo[op1.name]['s'] == false) {
					card.goodness += 3;
				}
			}
			if (this.playerInfo[op2.name][card.suit] == false) {
				card.goodness += 2;
				if (this.playerInfo[op1.name]['s'] == false) {
					card.goodness += 3;
				}
			}
		}
		playable.sort(function (a, b) {
			return a.goodness - b.goodness;
		});
		var best = playable[playable.length - 1];
		var worst = playable[0];
		if (this.bidValue == 0) {
			this.playCard(worst);
		} else {
			this.playCard(best);
		}
	},
	playPos2: function (playable) {
		this.sortPlayable(playable);
		var worst = playable[0];
		var best = playable[playable.length - 1];
		if (this.bidValue == 0) {
			this.playCard(worst);
		} else {
			if (this.canWinCard(best, this.game.pile[0])) {
				this.playCard(best);
			} else {
				this.playCard(worst);
			}
		}
	},
	sortPlayable: function (playable) {
		playable.sort(function (a, b) {
			if (a.suit != 's' && b.suit == 's') {
				return -1;
			} else if (a.suit == 's' && b.suit != 's') {
				return 1;
			}
			return a.rank - b.rank;
		});
	},
	playPos3: function (playable) {
		this.sortPlayable(playable);
		var worst = playable[0];
		var best = playable[playable.length - 1];
		var bestCard = this.getBestCard();
		if (this.bidValue == 0) {
			this.playCard(worst);
		} else {
			if (!this.canWinCard(best, this.game.pile[0])) {
				this.playCard(worst);
			} else if (bestCard == this.game.pile[0] && bestCard.rank > 10) {
				this.playCard(worst);
			} else if (bestCard == this.game.pile[1] && this.canWinCard(best, bestCard)) {
				this.playCard(best);
			} else if (bestCard == this.game.pile[1] && !this.canWinCard(best, bestCard)) {
				this.playCard(worst);
			} else {
				this.playCard(best);
			}
		}
	},
	playPos4: function (playable) {
		this.sortPlayable(playable);
		var worst = playable[0];
		var best;
		var bestCard = this.getBestCard();
		for (var i = 0; i < playable.length; i++) {
			if (this.canWinCard(playable[i], bestCard)) {
				best = playable[i];
				break;
			}
		}
		var partnerHasTrick = bestCard == this.game.pile[1];
		var partnerHasGoodNilBid = this.partner.bidValue == 0 && this.partner.tricks.length == 0;
		var partnerHasFailedNilBid = this.partner.bidValue == 0 && this.partner.tricks.length > 0;
		var canTakeTrick = !! best;
		if (canTakeTrick) {
			if (this.bidValue == 0) {
				if (this.canWinCard(worst, bestCard)) {
					this.playCard(playable[playable.length - 1]);
				} else {
					for (var i = 0; i < playable.length; i++) {
						if (this.canWinCard(playable[i + 1], bestCard)) {
							this.playCard(playable[i]);
						}
					}
				}
			} else {
				if (partnerHasTrick) {
					if (this.partner.bidValue == 0) {
						this.playCard(best);
					} else {
						this.playCard(worst);
					}
				} else {
					this.playCard(best);
				}
			}
		} else {
			if (this.bidValue == 0) {
				this.playCard(playable[playable.length - 1]);
			} else {
				this.playCard(worst);
			}
		}
	},
	playCard: function (card) {
		this.game.playCards(this, [card]);
	},
	canWinCard: function (contenderCard, bestCard) {
		return contenderCard.suit == bestCard.suit && contenderCard.rank > bestCard.rank || contenderCard.suit == 's' && bestCard.suit != 's';
	},
	getBestCard: function () {
		var card = this.game.pile[0];
		for (var i = 1; i < this.game.pile.length; i++) {
			var newCard = this.game.pile[i];
			if (this.canWinCard(newCard, card)) {
				card = newCard;
			}
		}
		return card;
	},
	beforeGameStart: function () {
		this.remaining = {};
		var suits = ['h', 's', 'd', 'c'];
		for (var i in suits) {
			this.remaining[suits[i]] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
		}
		for (var i in this.hand) {
			var card = this.hand[i];
			$A(this.remaining[card.suit]).remove(card.rank);
		}
		this.playerInfo = {};
		for (var i = 0; i < this.game.players.length; i++) {
			var p = this.game.players[i];
			this.playerInfo[p.name] = {
				"h": true,
				"s": true,
				"d": true,
				"c": true
			};
		}
	},
	bid: function () {
		var bid = 0;
		for (var i = 0; i < this.hand.length; i++) {
			var card = this.hand[i];
			if (card.rank > 12 || card.suit == 's' && card.rank > 9) {
				bid++;
			}
		}
		bid = Math.min(bid, 6);
		bid = Math.max(bid, 1);
		if (this.partner.bidValue > 6) {
			bid = 1;
		} else if (bid + this.partner.bidValue > 8) {
			bid = 8 - this.partner.bidValue;
		}
		bid = Math.max(bid, 1);
		this.game.bid(this, bid);
	}
});

function HumanPlayer(name) {
	this.init(name);
}
HumanPlayer.prototype = {
	name: null,
	hand: null,
	isHuman: true,
	canOnlyDraw: false,
	playable: null,
	init: function (name) {
		this.name = name;
		this.hand = [];
		this.selectedCards = [];
	},
	wrongCardMessageIndex: 0,
	play: function (playable) {
		this.playable = playable;
	},
	draw: function () {
		this.canOnlyDraw = true;
		this.mustDrawMessage();
	},
	useCard: function (card, selecting) {
		if (!card) {
			throw 'card was null';
		}
		if (selecting && !this.game.canSelectCards) {
			return;
		}
		this.game.message('');
		if (this.canOnlyDraw) {
			this.drawing(card);
		} else if (!this.hasCard(card)) {
			this.illegalCardUsed(card, selecting);
		} else if (!this.canPlay) {
			this.notYourTurnMessage();
		} else if (selecting) {
			this.selecting(card);
		} else if ($A(this.playable).contains(card) || this.game.canSelectCard(this, card)) {
			this.playing(card);
		} else {
			this.nonPlayableCardUsed(card, selecting);
		}
	},
	playing: function (card) {
		if ($A(this.selectedCards).contains(card)) {
			this.game.playCards(this, this.selectedCards);
		} else if (!this.game.canSelectCard(this, card)) {
			this.cannotSelectCardMessage(card);
		} else {
			this.selectedCards.push(card);
			this.game.playCards(this, this.selectedCards);
		}
	},
	drawing: function (card) {
		if (card == $A(this.game.deck).last()) {
			this.game.message('');
			this.canOnlyDraw = false;
			this.game.drawCard(this);
		} else {
			this.mustDrawMessage();
		}
	},
	selecting: function (card) {
		if (!card.selected) {
			if (this.game.canSelectCard(this, card)) {
				this.game.selectCard(this, card);
			} else {
				this.cannotSelectCardMessage(card);
			}
		} else {
			this.game.unselectCard(this, card);
		}
	},
	illegalCardUsed: function (card, selecting) {
		if (card == $A(this.game.deck).last()) {
			this.cannotDrawCardMessage();
		} else if ($A(this.game.pile).contains(card)) {
			this.game.message('You cannot take cards from the pile!');
		} else {
			if (this.wrongCardMessageIndex == this.wrongCardMessages.length) {
				this.game.message('');
			} else {
				this.game.message(this.wrongCardMessages[this.wrongCardMessageIndex++]);
			}
			if (this.wrongCardPressed) {
				this.wrongCardPressed(card.toString());
			}
		}
	},
	nonPlayableCardUsed: function (card, selecting) {
		this.cannotPlayCardMessage(card);
	},
	wrongCardMessages: ['That\'s not even your card. What the hell??', 'No, really, you can\'t play the opponents cards!', 'Are you sure you understand the rules of this game?', 'THESE ARE NOT THE CARDS YOU\'RE LOOKING FOR!', 'OK, now you\'re just messing with me!', 'STOP TOUCHING MY CARDS!', 'STOP IT!', 'Play your own cards, not mine!', 'Ok, have you had your fun now? Can we keep on playing the game?', 'Just play!', 'If you touch my cards one more time there will be CONSEQUENCES!!!', 'At some point this is just gonna stop being funny...', 'I\'m giving you the silent treatment from now on!'],
	notYourTurnMessage: function () {
		this.game.message('It\'s not your turn to play!');
	},
	cannotSelectCardMessage: function (card) {
		if (this.selectedCards.length == 0) {
			this.cannotPlayCardMessage(card);
		} else {
			this.game.message('You cannot play this card with the other cards you have selected.');
		}
	},
	cannotPlayCardMessage: function (card) {
		this.game.message('You cannot play the ' + card.longName + ' now.');
	},
	cannotDrawCardMessage: function (card) {
		this.game.message('You may not draw a card now, you have cards in your hand that you can play!');
	},
	mustDrawMessage: function () {
		this.game.message('You have no cards you can play, you must draw.');
	},
	extend: ComputerPlayer.prototype.extend,
	toString: ComputerPlayer.prototype.toString,
	hasCard: ComputerPlayer.prototype.hasCard,
	remove: ComputerPlayer.prototype.remove
}
HumanPlayer.prototype.extend({
	init: ComputerPlayer.prototype.init,
	bid: function () {
		var maxBid = 13;
		if (this.partner.bidValue >= 0) {
			maxBid -= this.partner.bidValue;
		}
		this.startBid(maxBid);
		this.isBidding = true;
	},
	doBid: function (bid) {
		this.isBidding = false;
		this.game.bid(this, bid);
	},
	notifyPlay: function (pile, player, card) {},
	useCard: function (card, selecting) {
		if (this.isBidding) {
			this.game.message('It\'s your turn to bid now. You can\'t play any card while you\'re bidding!');
		} else {
			this.base.useCard.call(this, card, selecting);
		}
	},
	cannotPlayCardMessage: function (card) {
		if (this.game.pile.length == 0) {
			if (card.suit == 's' && !this.game.spadesIsBroken) {
				this.game.message('You cannot lead with a spade until spades have been broken (a spade played on another suit).');
			} else {
				throw 'Unexpected state: Can\'t lead with a card even though it\s not spades or spades has been broken!';
			}
		} else {
			var leadCard = this.game.pile[0];
			if ($A(this.hand).any(function (c) {
				return c.suit == leadCard.suit;
			})) {
				this.game.message('The suit of the current trick is ' + leadCard.suitName() + 's. You have a ' + leadCard.suitName() + ' so you must play it!');
				return;
			}
			throw 'Unexpected state: Can\'t play card even though we don\'t have the trick card suit';
		}
	}
});
var TABLE_SIZE = {
	width: 700,
	height: 600
};
var CARD_SIZE = {
	width: 71,
	height: 96
};
var CONDENSE_COUNT = 6;
var DECK_POS = {
	left: TABLE_SIZE.width / 2 - 1.3 * CARD_SIZE.width,
	top: TABLE_SIZE.height / 2 - CARD_SIZE.height / 2
};
var PILE_POS = {
	left: DECK_POS.left + 1.3 * CARD_SIZE.width,
	top: DECK_POS.top
};
var CARD_PADDING = 18;
var HORIZONTAL_MARGIN = 60;
var VERTICAL_MARGIN = 80;
var OVERLAY_MARGIN = 2;
var HORIZONTAL = 'h';
var VERTICAL = 'v';
var LEFT = 'left',
	RIGHT = 'right',
	TOP = 'top',
	BOTTOM = 'bottom';
var BOTTOM_PLAYER_TOP = TABLE_SIZE.height - CARD_SIZE.height - VERTICAL_MARGIN;
var TOP_PLAYER_TOP = VERTICAL_MARGIN;
var LEFT_PLAYER_TOP = TABLE_SIZE.height / 2;
var RIGHT_PLAYER_TOP = TABLE_SIZE.height / 2;
var BOTTOM_PLAYER_LEFT = TABLE_SIZE.width / 2;
var TOP_PLAYER_LEFT = TABLE_SIZE.width / 2;
var LEFT_PLAYER_LEFT = HORIZONTAL_MARGIN;
var RIGHT_PLAYER_LEFT = TABLE_SIZE.width - CARD_SIZE.height - HORIZONTAL_MARGIN;
var ANIMATION_SPEED = 500;
var TAKE_TRICK_DELAY = 750;
var zIndexCounter = 1;
var CARDBACK = {
	x: 0,
	y: -4 * CARD_SIZE.height
};
var HCARDBACK = {
	x: -8 * CARD_SIZE.height,
	y: -5 * CARD_SIZE.height
};
jQuery.fn.moveCard = function (top, left, callback, speed) {
	var props = {};
	props['top'] = top;
	props['left'] = left;
	props['queue'] = false;
	this.animate(props, speed || ANIMATION_SPEED, callback);
	return this;
};
jQuery.fn.setBackground = function (x, y) {
	var props = {};
	props['background-position'] = x + ' ' + y;
	this.css(props);
	return this;
};
Card.prototype.rotate = function (angle) {
	$(this.guiCard).css('-webkit-transform', 'rotate(' + angle + 'deg)').css('-moz-transform', 'rotate(' + angle + 'deg)').css('-ms-transform', 'rotate(' + angle + 'deg)').css('transform', 'rotate(' + angle + 'deg)').css('-o-transform', 'rotate(' + angle + 'deg)');
}
Card.prototype.showCard = function (position) {
	var offsets = {
		"c": 0,
		"d": 1,
		"h": 2,
		"s": 3
	};
	var xpos, ypos;
	if (!position) {
		position = BOTTOM;
	}
	var h = $(this.guiCard).height(),
		w = $(this.guiCard).width();
	if (position == TOP || position == BOTTOM) {
		var rank = this.rank;
		if (rank == 1) {
			rank = 14;
		}
		xpos = (-rank + 2) * CARD_SIZE.width;
		ypos = -offsets[this.suit] * CARD_SIZE.height;
		if (position == TOP && this.rank > 10) {
			xpos -= 4 * CARD_SIZE.width;
		}
		if (this.rank == 0) {
			ypos = -4 * CARD_SIZE.height;
			var extra = position == TOP ? 2 : 0;
			if (this.suit == 'rj') {
				xpos = (-2 - extra) * CARD_SIZE.width;
			} else if (this.suit == 'bj') {
				xpos = (-3 - extra) * CARD_SIZE.width;
			}
		}
		if (w > h) {
			$(this.guiCard).height(w).width(h);
		}
		this.rotate(0);
	} else {
		ypos = -5 * CARD_SIZE.height;
		var rank = this.rank;
		if (rank == 1) {
			rank = 14;
		}
		if (this.rank == 0) {
			xpos = -8 * CARD_SIZE.height;
			var extra = position == RIGHT ? 0 : 2;
			if (this.suit == 'rj') {
				ypos -= (2 + extra) * CARD_SIZE.width;
			} else if (this.suit == 'bj') {
				ypos -= (3 + extra) * CARD_SIZE.width;
			}
		} else if (this.rank <= 10) {
			ypos -= (this.rank - 2) * CARD_SIZE.width;
			xpos = -offsets[this.suit] * CARD_SIZE.height;
		} else {
			xpos = -4 * CARD_SIZE.height - offsets[this.suit] * CARD_SIZE.height;
			if (position == LEFT) {
				ypos -= (this.rank - 7) * CARD_SIZE.width;
			} else {
				ypos -= (this.rank - 11) * CARD_SIZE.width;
			}
		}
		if (h > w) {
			$(this.guiCard).height(w).width(h);
		}
		this.rotate(0);
	}
	$(this.guiCard).setBackground(xpos + 'px', ypos + 'px');
};
Card.prototype.moveToFront = function () {
	this.guiCard.style.zIndex = zIndexCounter++;
};
Card.prototype.hideCard = function (position) {
	if (!position) {
		position = BOTTOM;
	}
	var h = $(this.guiCard).height(),
		w = $(this.guiCard).width();
	if (position == TOP || position == BOTTOM) {
		$(this.guiCard).setBackground(CARDBACK.x + 'px', CARDBACK.y + 'px');
		if (w > h) {
			$(this.guiCard).height(w).width(h);
		}
	} else {
		$(this.guiCard).setBackground(HCARDBACK.x + 'px', HCARDBACK.y + 'px');
		if (h > w) {
			$(this.guiCard).height(w).width(h);
		}
	}
	this.rotate(0);
};

function showCards(cards, position, speed) {
	setTimeout(function () {
		for (var i = 0; i < cards.length; i++) {
			cards[i].showCard(position);
		}
	}, speed || (ANIMATION_SPEED / 2));
}

function hideCards(cards, position, speed) {
	setTimeout(function () {
		for (var i = 0; i < cards.length; i++) {
			cards[i].hideCard(position);
		}
	}, speed || (ANIMATION_SPEED / 2));
}
var webRenderer = {
	extend: function (type) {
		this.base = {};
		for (var i in type) {
			if (this[i]) {
				this.base[i] = this[i];
			}
			this[i] = type[i];
		}
	},
	deckReady: function (e) {
		var left = DECK_POS.left,
			top = DECK_POS.top;
		webRenderer._createCardPile(e.game.deck, DECK_POS.top, DECK_POS.left, false);
		e.callback();
	},
	_createCardPile: function (cards, top, left, showCards) {
		var tableDiv = $('#play-page');
		for (var i = 0; i < cards.length; i++) {
			var card = cards[i];
			if ((i + 1) % CONDENSE_COUNT == 0) {
				left -= OVERLAY_MARGIN;
				top -= OVERLAY_MARGIN;
			}
			webRenderer._createGuiCard(card, {
				"left": left,
				"top": top
			});
			if (showCards) {
				card.showCard();
			} else {
				card.hideCard();
			}
		}
	},
	_createGuiCard: function (card, cssProps) {
		var tableDiv = $('#play-page');
		var divCard = $('<div>').addClass('card').css(cssProps);
		tableDiv.append(divCard[0]);
		card.guiCard = divCard[0];
		divCard[0].card = card;
		card.moveToFront();
		card.hideCard();
	},
	_getCardPos: function (player, pos, handLength) {
		if (!handLength) {
			handLength = player.hand.length;
		}
		var handWidth = (handLength - 1) * CARD_PADDING + CARD_SIZE.width;
		var props = {};
		var selectOffset = 0;
		if (player.hand[pos] && player.hand[pos].selected) {
			selectOffset = 15;
		}
		if (player.position == TOP) {
			props.left = (player.left + handWidth / 2 - CARD_SIZE.width) - pos * CARD_PADDING;
			props.top = player.top + selectOffset;
		} else if (player.position == BOTTOM) {
			props.left = player.left - (handWidth / 2) + pos * CARD_PADDING;
			props.top = player.top - selectOffset;
		} else if (player.position == LEFT) {
			props.top = player.top - (handWidth / 2) + pos * CARD_PADDING;
			props.left = player.left + selectOffset;
		} else if (player.position == RIGHT) {
			props.top = (player.top + handWidth / 2 - CARD_SIZE.width) - pos * CARD_PADDING;
			props.left = player.left - selectOffset;
		}
		return props;
	},
	dealCard: function (e) {
		webRenderer._adjustHand(e.player, e.callback, ANIMATION_SPEED / 2, false, e.game.cardCount);
	},
	selectCard: function (e) {
		webRenderer._adjustHand(e.player, e.callback, ANIMATION_SPEED / 3);
	},
	unselectCard: function (e) {
		webRenderer._adjustHand(e.player, e.callback, ANIMATION_SPEED / 3);
	},
	pass: function (e) {
		var pass = $('#pass');
		pass.css({
			"font-size": '16px',
			"top": e.player.top,
			"z-index": zIndexCounter + 1000
		});
		if (e.player.position == BOTTOM) {
			pass.css("top", e.player.top + 100);
		}
		var props = {
			"top": PILE_POS.top - 40,
			"font-size": '120px'
		};
		if (e.player.align == VERTICAL) {
			if (e.player.position == LEFT) {
				pass.css({
					"right": '',
					"left": 0
				});
			} else {
				pass.css({
					"left": '',
					"right": 0
				});
			}
			pass.css("width", '100px');
			props['width'] = TABLE_SIZE.width;
		} else {
			pass.css('width', TABLE_SIZE.width + 'px');
			pass.css('text-align', 'center');
		}
		pass.show().animate(props, ANIMATION_SPEED * 2).fadeOut(ANIMATION_SPEED, e.callback);
	},
	play: function (e) {
		var beforeCount = e.game.pile.length - e.cards.length;

		function renderCard(i) {
			if (e.cards.length == 0) {
				e.callback();
			} else {
				var zIndexCards = e.player.hand.slice(0);
				$A(e.cards).each(function (c) {
					zIndexCards.push(c);
				});
				zIndexCards.sort(function (c1, c2) {
					return $(c1.guiCard).css('z-index') - $(c2.guiCard).css('z-index');
				});
				for (var i = zIndexCards.length - 1; i >= 0; i--) {
					$(zIndexCards[i].guiCard).css('z-index', zIndexCounter + i + 1);
				}
				zIndexCounter += zIndexCards.length + 3;
				var card = e.cards[0];
				$A(e.cards).remove(e.cards[0]);
				var top = PILE_POS.top - (Math.floor((beforeCount + i) / CONDENSE_COUNT) * OVERLAY_MARGIN);
				var left = PILE_POS.left - (Math.floor((beforeCount + i) / CONDENSE_COUNT) * OVERLAY_MARGIN);
				$(card.guiCard).moveCard(top, left, function () {
					renderCard(i + 1);
				});
				if (e.cards.length == 0) {
					webRenderer._adjustHand(e.player, null, ANIMATION_SPEED, true);
				}
				showCards([card]);
			}
		}
		if (e.cards.length > 1 && $($A(e.cards).last().guiCard).css('top') != $(e.cards[0].guiCard).css('top')) {
			$($A(e.cards).last().guiCard).animate({
				"top": $(e.cards[0].guiCard).css('top')
			}, ANIMATION_SPEED / 4, function () {
				renderCard(0);
			});
		} else {
			renderCard(0);
		}
	},
	_adjustHand: function (player, callback, speed, dontMoveToFront, handLength) {
		if (!speed) {
			speed = ANIMATION_SPEED;
		}
		for (var i = 0; i < player.hand.length; i++) {
			var card = player.hand[i];
			var props = webRenderer._getCardPos(player, i, handLength);
			var f;
			if (i == player.hand.length - 1) {
				f = callback;
			}
			$(card.guiCard).moveCard(props.top, props.left, f, speed);
			if (!dontMoveToFront) {
				card.moveToFront();
			}
		}
		if (player.showCards) {
			showCards(player.hand, player.position, speed / 2);
		} else {
			hideCards(player.hand, player.position, speed / 2);
		}
	},
	draw: function (e) {
		webRenderer._adjustHand(e.player, e.callback);
	},
	sortHand: function (e) {
		webRenderer._adjustHand(e.player, e.callback);
	},
	takeTrick: function (e) {
		setTimeout(function () {
			$A(e.trick).each(function (c) {
				$(c.guiCard).addClass('trick');
			});
			var props = {};
			var cssClass;
			var trickProps = {};
			var playerMargin = 2;
			var trickHeight = 45;
			var trickWidth = 33;
			var halfTrickHeight = trickHeight / 2;
			var halfTrickWidth = trickWidth / 2;
			var overlay = 10;
			var playerSize = 50;
			var sidePlayerTop = 250;
			var edgeDistance = playerMargin + (playerSize - trickHeight) / 2;
			var cardDistance = (TABLE_SIZE.width / 2) + playerSize / 2 + e.player.tricks.length * overlay;
			if (e.player.position == TOP) {
				props['left'] = ((TABLE_SIZE.width - CARD_SIZE.width) / 2) + 'px';
				cssClass = 'verticalTrick';
				trickProps['top'] = edgeDistance;
				trickProps['left'] = cardDistance;
				props = trickProps;
			} else if (e.player.position == BOTTOM) {
				cssClass = 'verticalTrick';
				trickProps['bottom'] = playerMargin + $('#bottom-player').height() - playerSize + ((playerSize - trickHeight) / 2);
				trickProps['right'] = cardDistance;
				props['top'] = TABLE_SIZE.height - trickProps['bottom'] - CARD_SIZE.height;
				props['left'] = TABLE_SIZE.width - trickProps['right'] - CARD_SIZE.width;
			} else if (e.player.position == LEFT) {
				cssClass = 'horizontalTrick';
				trickProps['bottom'] = TABLE_SIZE.height - sidePlayerTop + e.player.tricks.length * overlay;
				trickProps['left'] = edgeDistance + 1;
				props['top'] = TABLE_SIZE.height - trickProps['bottom'] - CARD_SIZE.height;
				props['left'] = trickProps['left'];
			} else if (e.player.position == RIGHT) {
				cssClass = 'horizontalTrick';
				trickProps['top'] = sidePlayerTop + $('#left-player').height() + e.player.tricks.length * overlay;
				trickProps['right'] = edgeDistance;
				props['top'] = trickProps['top'];
				props['left'] = TABLE_SIZE.width - trickProps['right'] - CARD_SIZE.width;
			}
			for (var i = 0; i < e.trick.length; i++) {
				e.trick[i].moveToFront();
			}
			for (var i = 0; i < e.trick.length; i++) {
				var callback = function () {};
				if (i == e.trick.length - 1) {
					callback = function () {
						$('.trick').hide();
						$('#play-page').append($('<div/>').addClass(cssClass).css(trickProps));
						if (e.player.isHuman) {
							$('#current-score').text('Your points: ' + e.player.points);
						}
						e.callback();
					};
				}
				$(e.trick[i].guiCard).animate(props, ANIMATION_SPEED, callback);
			}
		}, TAKE_TRICK_DELAY);
	}
};
webRenderer.extend({
	dealCard: function (e) {
		ANIMATION_SPEED = 100;
		webRenderer.base.dealCard.call(webRenderer, e);
		ANIMATION_SPEED = 500;
	},
	bid: function (e) {
		var selector = '#' + e.player.id + ' small';
		var name = $(selector).html();
		var name = $(selector).html(name + ' (' + e.bid + ')');
		var bubble = '#' + e.player.id + '-bubble';
		$(bubble + ' p').text('I bid ' + e.bid);
		$(bubble).fadeIn();
		setTimeout(e.callback, 1000);
	},
	showScore: function (e) {
		$('#messageBox').hide();
		$('#result-box').show();
		var results = [e.team1, e.team2];
		if (e.team1.score >= e.team2.score) {
			$('#result-header').text('Congratulations, you won this hand!');
		} else {
			$('#result-header').text('Sorry, you lost this hand.');
		}
		for (var i = 0; i <= 1; i++) {
			var r = results[i];
			var cell = i == 0 ? '.t1' : '.t2';
			$('#combined-bid ' + cell).text(r.bid);
			$('#tricks-taken ' + cell).text(r.tricks);
			$('#bags ' + cell).text(r.bags);
			$('#bags-last-round ' + cell).text(r.bagsPrevRound);
			$('#bags-total ' + cell).text(r.totalBags);
			$('#successful-bid ' + cell).text(r.tricksScore);
			$('#failed-bid ' + cell).text(r.tricksPenalty);
			$('#successful-nil-bid ' + cell).text(r.nilBidScore);
			$('#failed-nil-bid ' + cell).text(r.nilBidPenalty);
			$('#bag-score ' + cell).text(r.bagsScore);
			$('#bag-penalty ' + cell).text(r.bagsPenalty);
			$('#points-this-round ' + cell).text(r.score);
			$('#points-last-round ' + cell).text(r.scoreLastRound);
			$('#points-total ' + cell).text(r.scoreTotal);
		}
		var r1 = e.team1,
			r2 = e.team2;
		if (r1.tricksScore == 0 && r2.tricksScore == 0) {
			$('#successful-bid').hide();
		}
		if (r1.tricksPenalty == 0 && r2.tricksPenalty == 0) {
			$('#failed-bid').hide();
		}
		if (r1.nilBidScore == 0 && r2.nilBidScore == 0) {
			$('#successful-nil-bid').hide();
		}
		if (r1.nilBidPenalty == 0 && r2.nilBidPenalty == 0) {
			$('#failed-nil-bid').hide();
		}
		if (r1.bagsScore == 0 && r2.bagsScore == 0) {
			$('#bag-score').hide();
		}
		if (r1.bagsPenalty == 0 && r2.bagsPenalty == 0) {
			$('#bag-penalty').hide();
		}
		if (e.winner) {
			$('#start-new-game').hide();
			$('#reset-game').hide();
			$('#start-new-tournament').show();
			$('#winner-pics').show();
			if (e.winner == 1) {
				$('.opponent-win-pics').hide();
				$('#result-header').text('You and Bill win the game!');
			} else {
				$('.human-win-pics').hide();
				$('#result-header').text('John and Lisa win the game!');
			}
		}
		var cardTableHeight = $('#play-page').height();
		var resultHeight = $('#result-box').height();
		var cardTableWidth = $('#play-page').width();
		var resultWidth = $('#result-box').width();
		$('#result-box').css('left', parseInt((cardTableWidth - resultWidth) / 2));
		$('#result-box').css('top', parseInt((cardTableHeight - resultHeight) / 2));
		e.callback();
	},
	win: function (e) {
		e.callback();
	},
	spadesBroken: function (e) {
		game.message('SPADES IS BROKEN!!! SPADES IS BROKEN!!!');
		$('#bigspade').show().delay(300).hide('explode', {
			"pieces": 16
		});
		e.callback();
	},
	play: function (e) {
		PILE_POS.left = (TABLE_SIZE.width - CARD_SIZE.width) / 2;
		PILE_POS.top = (TABLE_SIZE.height - CARD_SIZE.height) / 2;
		if (e.player.position == TOP) {
			PILE_POS.top -= 60;
		} else if (e.player.position == BOTTOM) {
			PILE_POS.top += 10;
		} else if (e.player.position == LEFT) {
			PILE_POS.left -= 40;
			PILE_POS.top -= 25;
		} else if (e.player.position == RIGHT) {
			PILE_POS.left += 40;
			PILE_POS.top -= 25;
		}
		webRenderer.base.play(e);
	}
});

function showPage(id) {
	$('.inner-page').hide();
	$(id + '-page').show();
	trackEvent('Page', id.substr(1, 1).toUpperCase() + id.substr(2));
}

function handleError(error) {
	var msg = ((error.message || error['message'] || error) + '');
	alert('Well, this is embarassing! An error occurred and I have no idea what to do now! :(');
	if (!handleError.errorCount) {
		handleError.errorCount = 0;
	}
	handleError.errorCount++;
	trackEvent('Game', 'Error', msg.substr(0, 100), handleError.errorCount);
	if (window.console && window.console.log) {
		window.console.log('ERROR: ' + msg);
	}
}

function trackEvent(category, action, label, value) {
	var values = ['_trackEvent', category, action];
	if (label) {
		values.push(label);
	}
	if (value) {
		values.push(value);
	}
	if (typeof window._gaq != "undefined") {
		log(values.join(' - '));
		_gaq.push(values);
	} else {
		log(values.join(' - '));
	}
}

function WebCardGame() {}
WebCardGame.prototype = {
	createGameObject: function () {
		throw "Game must override createGameObject!";
	},
	initPageNavigation: function () {
		$('#menu li a').click(function (event) {
			showPage($(this).attr('href'));
		});
		if (location.hash == '#rules' || location.hash == '#about') {
			showPage(location.hash);
		} else {
			$('#play-page').show();
		}
	},
	createHumanPlayer: function () {
		if (location.search && location.search.indexOf('autoplay') != -1) {
			human = new ComputerPlayer('You');
			ANIMATION_SPEED = 100;
		} else {
			human = new HumanPlayer('You');
		}
		human.top = BOTTOM_PLAYER_TOP;
		human.left = BOTTOM_PLAYER_LEFT;
		human.align = HORIZONTAL;
		human.position = BOTTOM;
		human.showCards = true;
		human.isHuman = true;
		human.id = 'bottom-player';
		human.wrongCardPressed = function (label) {
			trackEvent('Game', 'ClickWrongCard', label);
		}
	},
	createComputerPlayers: function () {
		topPlayer = new ComputerPlayer($('#top-player small').text());
		topPlayer.top = TOP_PLAYER_TOP;
		topPlayer.left = TOP_PLAYER_LEFT;
		topPlayer.align = HORIZONTAL;
		topPlayer.position = TOP;
		topPlayer.id = 'top-player';
		leftPlayer = new ComputerPlayer($('#left-player small').text());
		leftPlayer.top = LEFT_PLAYER_TOP;
		leftPlayer.left = LEFT_PLAYER_LEFT;
		leftPlayer.align = VERTICAL;
		leftPlayer.position = LEFT;
		leftPlayer.id = 'left-player';
		rightPlayer = new ComputerPlayer($('#right-player small').text());
		rightPlayer.top = RIGHT_PLAYER_TOP;
		rightPlayer.left = RIGHT_PLAYER_LEFT;
		rightPlayer.align = VERTICAL;
		rightPlayer.position = RIGHT;
		rightPlayer.id = 'right-player';
	},
	setEventRenderers: function () {
		for (var name in game.renderers) {
			game.setEventRenderer(name, function (e) {
				e.callback();
			});
		}
		game.setEventRenderer('deckready', webRenderer.deckReady);
		game.setEventRenderer('dealcard', webRenderer.dealCard);
		game.setEventRenderer('selectcard', webRenderer.selectCard);
		game.setEventRenderer('unselectcard', webRenderer.unselectCard);
		game.setEventRenderer('play', webRenderer.play);
		game.setEventRenderer('draw', webRenderer.draw);
		game.setEventRenderer('pass', webRenderer.pass);
		game.setEventRenderer('sorthand', webRenderer.sortHand);
	},
	setupOpponentClickTracking: function () {
		$('.avatar').click(function () {
			trackEvent('Game', 'ClickPlayer', $(this).attr('id'));
		});
	},
	setupSortHandler: function () {
		$('#sortHand').click(function () {
			try {
				if (!window.human.canPlay) {
					game.message('You can only sort when it is your turn to play.');
					trackEvent('Game', 'SortCards', 'Failure');
				} else {
					game.sortHand(window.human, function () {});
					trackEvent('Game', 'SortCards', 'Success');
				}
			} catch (e) {
				handleError(e);
			}
		});
	},
	setupPlayerCountHandler: function () {
		window.playerCount = game.defaultPlayerCount;
		if (playerCount > 2) {
			$('#left-player').show();
		}
		if (playerCount == 4) {
			$('#right-player').show();
		}
		var playerCountSelect = $('#player-count')[0];
		if (playerCountSelect) {
			playerCountSelect.options[playerCount - 2].selected = 'selected';
		}
		$('#player-count').change(function () {
			window.playerCount = this.selectedIndex + 2;
			if (playerCount == 4) {
				$('#right-player').fadeIn();
				$('#left-player').fadeIn();
			}
			if (playerCount == 3) {
				$('#right-player').fadeOut();
				$('#left-player').fadeIn();
			}
			if (playerCount == 2) {
				$('#right-player').fadeOut();
				$('#left-player').fadeOut();
			}
		});
	},
	bindCardEventHandlers: function () {
		$('.card').mousedown(function (ev) {
			if (errorHandling) {
				try {
					human.useCard(this.card, ev.which == 3 || ev.metaKey);
				} catch (e) {
					handleError(e);
				}
			} else {
				human.useCard(this.card, ev.which == 3 || ev.metaKey);
			}
		});
		$('.card').bind('contextmenu', function (e) {
			return false;
		});
	},
	setupStartHandler: function () {
		game.setEventRenderer('start', function (e) {
			$('#sortHand').show();
			webGame.bindCardEventHandlers();
			if (webRenderer.start) {
				webRenderer.start(e);
			} else {
				e.callback();
			}
		});
	},
	setupTurnHandler: function () {
		game.setEventRenderer('playerturn', function (e) {
			if (e.player.isHuman) {
				if (e.game.round <= 3) {
					var msg = 'Your turn! Click a card to play.';
					if (game.canSelectCards) {
						msg += ' Right click to select multiple cards.';
					}
					e.game.message(msg);
				} else {
					e.game.message('Your turn!');
				}
			} else {
				e.game.message(e.player.name + "'s turn!");
			}
			e.callback();
		});
	},
	setupDealHandler: function () {
		$('#deal').click(function (e) {
			try {
				game.addPlayer(human);
				if (playerCount > 2) {
					game.addPlayer(leftPlayer);
				}
				game.addPlayer(topPlayer);
				if (playerCount == 4) {
					game.addPlayer(rightPlayer);
				}
				game.message('');
				game.deal();
				$('#deal').hide();
				$('#player-count').hide();
				trackEvent('Game', 'Deal', playerCount + ' players', playerCount);
			} catch (e) {
				handleError(e);
			}
		});
	},
	setupRestartHandler: function () {
		$('#start-new-game').click(function (e) {
			trackEvent('Game', 'Restart', result);
			location.reload();
		});
	},
	setupMessageHandler: function () {
		game.message = function (msg) {
			$('#messageBox p').html(msg);
		};
	},
	setupWinHandler: function () {
		game.setEventRenderer('win', function (e) {
			trackEvent('Game', 'Win', e.player.name);
			for (var i = 0; i < game.pile.length; i++) {
				$(game.pile[i].guiCard).hide();
			}
			for (var i = 0; i < game.deck.length; i++) {
				$(game.deck[i].guiCard).hide();
			}
			window.zIndexCounter++;
			if (e.player.isHuman) {
				$('#result-box h3').text('CONGRATULATIONS!!! YOU WIN!');
				result = 'Win';
			} else {
				$('#result-box h3').text(e.player.name.toUpperCase() + ' WINS!!!');
				result = 'Lose';
			}
			$('#result-box img.winner-img').hide();
			$('#result-box img#' + e.player.id + '-win').show();
			$('#messageBox').hide();
			$('#result-box').css('z-index', zIndexCounter).show();
		});
	},
	setupLogging: function () {
		if (location.search && location.search.indexOf('log') != -1) {
			window.log = function (msg) {
				for (var i = 1; i < arguments.length; i++) {
					msg = msg.replace('%' + i, arguments[i]);
				}
				if (this.console) {
					this.console.log(msg);
				}
			};
		}
	},
	startGame: function () {
		try {
			game.start();
		} catch (e) {
			handleError(e);
		}
	},
	extraSetup: function () {},
	extend: function (obj) {
		for (var i in this) {
			if (!obj[i]) {
				obj[i] = this[i];
			}
		}
		obj.base = this;
	}
};

function loadSocialScripts() {
	var js, fjs = document.getElementsByTagName('script')[0];
	js = document.createElement('script');
	js.id = 'facebook-jssdk';
	js.src = "//connect.facebook.net/is_IS/all.js#xfbml=1&appId=259330057429410";
	js.async = true;
	fjs.parentNode.insertBefore(js, fjs);
	$.getScript('https://apis.google.com/js/plusone.js');
	$.getScript('http://platform.twitter.com/widgets.js');
}
$(document).ready(function () {
	try {
		loadSocialScripts();
		webGame.initPageNavigation();
		webGame.setupLogging();
		window.game = webGame.createGameObject();
		webGame.createHumanPlayer();
		webGame.createComputerPlayers();
		webGame.setEventRenderers();
		webGame.setupOpponentClickTracking();
		webGame.setupSortHandler();
		webGame.setupPlayerCountHandler()
		webGame.setupDealHandler();
		webGame.setupRestartHandler();
		webGame.setupWinHandler();
		webGame.setupStartHandler();
		webGame.setupTurnHandler();
		webGame.setupMessageHandler();
		webGame.extraSetup();
		webGame.startGame();
	} catch (e) {
		handleError(e);
	}
});
var appCache = window.applicationCache;
if (appCache && appCache.addEventListener) {
	appCache.addEventListener('error', function () {
		$('#authorpic img').attr('src', 'images/author.jpg');
		$('#promo-footer').hide();
	}, false);
}
if (document.referrer && document.referrer.length) {
	if (document.location.href.substr(0, 25) != document.referrer.substr(0, 25)) {
		trackEvent('Traffic', 'Visit', document.referrer);
	}
}

function WebSpades() {}
WebSpades.prototype = {
	createGameObject: function () {
		return new Spades();
	},
	setupStartHandler: function () {
		game.setEventRenderer('start', function (e) {
			if (location.search && location.search.indexOf('autoplay') != -1) {
				ANIMATION_SPEED = 100;
				TAKE_TRICK_DELAY = 100;
			}
			if (window.results) {
				for (var i = 0; i < game.players.length; i++) {
					game.players[i].scoreLastRound = window.results[i * 2];
					game.players[i].bags = window.results[(i * 2) + 1];
				}
			}
			webGame.bindCardEventHandlers();
			$('.bubble').fadeOut();
			e.callback();
		});
	},
	extraSetup: function () {
		game.setEventRenderer('taketrick', webRenderer.takeTrick);
		game.setEventRenderer('bid', webRenderer.bid);
		game.setEventRenderer('showscore', function (e) {
			var newResults = [];
			var r = [e.team1, e.team2, e.team1, e.team2];
			for (var i = 0; i < game.players.length; i++) {
				newResults.push(r[i].scoreTotal);
				newResults.push(r[i].bagsNextRound);
			}
			$.cookie('results', '' + newResults);
			window.result = e.team1.scoreTotal > e.team2.scoreTotal ? 'Win' : 'Lose';
			trackEvent('Statistics', 'ScoreAverage', 'You & Bill', e.team1.score);
			trackEvent('Statistics', 'ScoreAverage', 'John & Lisa', e.team2.score);
			trackEvent('Statistics', 'TrickDeviation', 'You & Bill', e.team1.tricks - e.team1.bid);
			trackEvent('Statistics', 'TrickDeviation', 'John & Lisa', e.team2.tricks - e.team2.bid);
			webRenderer.showScore(e);
		});
		game.setEventRenderer('win', function (e) {
			$.cookie('results', '');
			window.result = e.team1.scoreTotal > e.team2.scoreTotal ? 'Win' : 'Lose';
			trackEvent('Statistics', 'ScoreAverage', 'You & Bill', e.team1.score);
			trackEvent('Statistics', 'ScoreAverage', 'John & Lisa', e.team2.score);
			trackEvent('Statistics', 'WinPercentage', 'You & Bill', result == 'Win' ? 100 : 0);
			trackEvent('Statistics', 'WinPercentage', 'John & Lisa', result == 'Win' ? 0 : 100);
			trackEvent('Statistics', 'TrickDeviation', 'You & Bill', e.team1.tricks - e.team1.bid);
			trackEvent('Statistics', 'TrickDeviation', 'John & Lisa', e.team2.tricks - e.team2.bid);
			webRenderer.showScore(e);
		});
		game.setEventRenderer('spadesbroken', webRenderer.spadesBroken);
		var imgs = ['horizontal-trick', 'vertical-trick', 'bigspade'];
		var img = new Image();
		for (var i = 0; i < imgs.length; i++) {
			img.src = 'images/' + imgs[i] + '.png';
		}
		$('#reset-game').click(function () {
			if (confirm('This will erase all the scores and start a completely new game. Are you sure you want to do that?')) {
				$.cookie('results', '');
				window.document.location.reload();
			}
		});
		$('#start-new-tournament').click(function () {
			$.cookie('results', '');
			window.document.location.reload();
		});
		window.results = [];
		var oldResults = $.cookie('results');
		if (oldResults) {
			var oldArray = oldResults.split(',');
			for (var i = 0; i < oldArray.length; i++) {
				results.push(parseFloat(oldArray[i]));
			}
		}
		human.startBid = function (maxBid) {
			$('#bid-div').css('z-index', zIndexCounter + 10000).show();
			var msg = 'Choose how many tricks you think you will be able to take.';
			window.game.message(msg);
			for (var i = 0; i <= maxBid; i++) {
				$('<div/>').text(i).appendTo('#bid-div > div').click(function () {
					human.doBid(parseInt($(this).text()));
					$('#bid-div').hide();
					game.message('');
				}).mouseover(function () {
					game.message('Bid ' + $(this).text());
				}).mouseout(function () {
					game.message('');
				});
			}
		};
	}
}
errorHandling = false;
WebCardGame.prototype.extend(WebSpades.prototype);
window.webGame = new WebSpades();