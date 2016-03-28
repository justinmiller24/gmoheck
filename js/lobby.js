var g = {
	timeout: {
		user: null,
		users: null,
		game: null,
		games: null
	},
	status: {},
	currentRoundID: 0,
	inLobby: true,
	game: null,
	human: null,
	nascar: null,
	cardsDealt: false,
	roundLoading: 0,
	waiting: false,
	userOrder: [],
	userPosition: 0
};

$(document).ready(function() {
	
/*	// Manual reset
	$('#reset a').click(function() {
		g.waiting = false;
		g.roundLoading = 0;
		doLog('Reset counter to ' + g.roundLoading);
		return false;
	});*/
	
	setActiveUser();
	g.timeout.user = setInterval("setActiveUser();", 60000);
	getUsers();
	g.timeout.users = setInterval("getUsers();", 5000);
	getGames();
	g.timeout.games = setInterval("getGames();", 5000);
	
	// Create game
	$("#create-game").click(function() {
		$("#create-game-form-dialog").dialog({
			height: 300,
			width: 420,
			modal: true,
			buttons: {
				"Create Game": function() {
					var str = $("#create-game-form").serialize() + "&op=createGame";
					getJSON(str, function(data) {
						document.location.reload();
					});
				},
				"Cancel": function() {
					$(this).dialog('destroy');
				}
			}
		});
	});
});

function setActiveUser() {
	if (g.inLobby) {
		getJSON({op:"setActiveUser"}, function(data) {});
	}
}

function getUsers() {
	if (g.inLobby) {
		getJSON({op:"getUsers"}, function(data) {
			users = data.users;
			if (users != {} && users != []) {
				var h = '';
				
				// Show active users
				for (var i in users) {
					var u = users[i];
					if (u.isActive) {
						h += '<div class="row">';
						h += '<div class="player-' + i + '"></div>';
						h += '<span>' + u.name + '<br />';
						h += 'Games: ' + u.games + '<br />';
						h += 'Wins: ' + u.wins + '</span></div>';
					}
				}
				$('#playersOnline').html(h);
			}
		});
	}
}

function getGames() {
	if (g.inLobby) {
		getJSON({op:"getGames"}, function(data) {
			if (data.has_data && data.numGames > 0) {
				games = data.games;
				
				var h = '';
				h += '<table>';
				h += '<thead>';
				h += '<tr>';
				h += '<th>Game</th>';
				h += '<th>Seats</th>';
				h += '<th>Players</th>';
				h += '<th>Status</th>';
				h += '</tr>';
				h += '</thead>';
				h += '<tbody>';
				for (var i in games) {
					var ga = games[i];
					
					// User is in this game
					if (user.currentGameID == ga.id) {
						
						// Load game
						if (ga.status == 'Play') {
							
							// Lower timeouts
							g.inLobby = false;
							clearInterval(g.timeout.user);
							clearInterval(g.timeout.users);
							clearInterval(g.timeout.games);
							
							// User is owner
							if (ga.ownerID == userID) {
								$('#delete').show();
							}
							
							// Fade out to game board
							$('#lobby-page, .lobby').hide();
							$('#nav').addClass('play');
							$('#board, #nav ul, .play').fadeIn();
							
							// Load initial data
							getJSON({op:"getRound", gameID:user.currentGameID}, function(data) {
								g.status = data;
								loadGameBoard();
								updateStats();
								
								// At this point, we don't know if cards have already been dealt or not
								// Delay updates until we *know* dealing is finished (if cards were already dealt)
								g.timeout.game = setInterval("getRound();", 1500);
								
								// Check if cards are being dealt
								if (g.game.cardsDealt) {
									g.waiting = true;
									setTimeout("g.waiting = false;", 5000);
								}
								else {
									getRound();
								}
							});
						}
					}
					
					h += '<tr id="game-' + ga.id + '" class="game">';
					h += '<td>GAME #' + ga.id + '</td>';
					h += '<td>' + ga.players + '</td>';
					
					// Get HTML for users
					h += '<td class="gamesRow">';
					var userOrder = ga.users.split(',');
					for (var i=0; i<userOrder.length; i++) {
						h += '<span class="player-' + userOrder[i] + '"></span>';
					}
					h += '</td>';
					
					// Game loading
					if (ga.status == 'Wait') {
						
						// Owner
						if (ga.ownerID == userID) {
							// Update game
							getJSON({op:"setActiveGame", "gameID":user.currentGameID}, function() {});
							
							// All players are here
							if (ga.numPlayers == ga.players) {
								h += '<td><button id="start-game">Start game</button></td>';
							}
							else {
								h += '<td><button id="delete-game">Delete game</button></td>';
							}
						}
						
						// Not owner
						else {
							// Game not full
							if (ga.numPlayers < ga.players) {
								if (ga.id != user.currentGameID) {
									h += '<td><button id="join-game">Join game</button></td>';
								}
								else {
									h += '<td><button id="leave-game">Leave game</button></td>';
								}
							}
							// Game full
							else if (ga.id != user.currentGameID) {
								h += '<td>Game Full</td>';
							}
							else {
								h += '<td>Waiting</td>';
							}
						}
					}
					else if (ga.status == 'Play') {
						h += '<td>In Progress</td>';
					}
					h += '</tr>';
				}
				h += '</tbody>';
				h += '</table>';
				$('#activeGames').html(h);
				
				// Join game
				$('#join-game')
					.click(function () {
						var gameID = $(this).parent().parent().attr('id').substr(5);
						if (confirm('You are about to join game #' + gameID + '. Are you sure?'))
							getJSON({"op":"joinGame", "gameID":gameID}, function(data) {
								document.location.reload();
							});
					});
				
				// Leave game
				$('#leave-game')
					.click(function () {
						var gameID = $(this).parent().parent().attr('id').substr(5);
						if (confirm('You are about to leave game #' + gameID + '. Are you sure?'))
							getJSON({"op":"leaveGame", "gameID":gameID}, function(data) {
								document.location.reload();
							});
					});
				
				// Delete game
				$('#delete-game')
					.click(function () {
						var gameID = $(this).parent().parent().attr('id').substr(5);
						if (confirm('This will erase all game data. Are you sure?'))
							getJSON({"op":"deleteGame", "gameID":gameID}, function(data) {
								document.location.reload();
							});
					});
				
				// Start game
				$("#start-game")
					.click(function() {
						var gameID = $(this).parent().parent().attr('id').substr(5);
						if (confirm('You are about to start game #' + gameID + '. Are you sure?'))
							getJSON({"op":"startGame", "gameID":gameID}, function(data) {
								getGames();
							});
					});
			}
			else {
				$('#activeGames').html('<p>No active games.');
			}
		});
	}
}

function updateStats() {
	
	// Quick stats (nav bar)
	var trumpSuits = {
		S: "spades",
		H: "hearts",
		D: "diamonds",
		C: "clubs",
		N: ""
	};
	$('#round span').text(g.status.game.currentRoundID + '/' + g.status.game.rounds);
	var bids = '-';
	var trump = 'N';
	
	if (g.status.round != null) {
		if (g.status.round.bids > g.status.round.hands) {
			var ou = '+' + (g.status.round.bids - g.status.round.hands);
			bids = g.status.round.bids + '/' + g.status.round.hands + ' ' + '<font color="green">(' + ou + ')</font>';
		}
		else if (g.status.round.bids < g.status.round.hands) {
			var ou = '-' + (g.status.round.hands - g.status.round.bids);
			bids = g.status.round.bids + '/' + g.status.round.hands + ' ' + '<font color="red">(' + ou + ')</font>';
		}
		else {
			var ou = 0;
			bids = g.status.round.bids + '/' + g.status.round.hands;
		}
		trump = g.status.round.trump;
	}
	$('#bids span').html(bids);
	$('#trump span').removeClass().addClass(trumpSuits[trump]);
	
	// Update scoreboard (right sidebar)
	var leader = g.game.players[0];
	var scoreboardHTML = '';
	for (var i=0; i<g.game.players.length; i++) {
		var p = g.game.players[i];
		
		// Waiting
		var c = (g.game.currentPlayerIndex == i) ? ' current' : '';
		scoreboardHTML += '<div class="row' + c + '">';
		scoreboardHTML += '<div class="player-' + g.status.player[i+1].userID + '"></div>';
		scoreboardHTML += '<span>' + p.name;
		
		// Check for dealer
		if (g.game.dealerIndex == i) {
			scoreboardHTML += ' - DEALER';
		}
		scoreboardHTML += '<br />';
		
		// Update player score
		if (g.status.player[i+1].score != p.score) {
			p.score = g.status.player[i+1].score;
		}
		scoreboardHTML += 'Score: ' + p.score;
		
		scoreboardHTML += '<br />';
		var cb = (p.bidValue < 0) ? '-' : (p.tricks.length + ' / ' + p.bidValue);
		scoreboardHTML += 'Tricks: ' + cb + '</span></div>';
		if (p.score > leader.score) {
			leader = p;
		}
	}
	$('#leader span').text(leader.name + ' (' + leader.score + ')');
	$('#scoreboard').html(scoreboardHTML);
}


function loadGameBoard() {
	g.game = new OhHeck();
	
	// Setup event renderers
	for (var name in g.game.renderers) {
		g.game.setEventRenderer(name, function (e) {
			e.callback();
		});
	}
	g.game.setEventRenderer('dealcard', webRenderer.dealCard);
	g.game.setEventRenderer('play', webRenderer.play);
	g.game.setEventRenderer('sorthand', webRenderer.sortHand);
	
	// Setup deal handler
	$('#deal').click(function(e) {
		$(this).hide();
		g.game.message('Dealing...');
		
		// Deal hand
		getJSON({"op":"dealHand", "gameID":user.currentGameID}, function(data) {
			g.waiting = false;
			getRound();
			
			// TODO: update bidIndex, currentPlayerIndex, etc on next round
		});
	});
	
	// Setup start handler
	g.game.setEventRenderer('start', function (e) {
		$('.card').click(function() {
			g.human.useCard(this.card);
		});
		$('.bubble').fadeOut();
		e.callback();
	});
	
	// Extra setup
	g.game.setEventRenderer('taketrick', webRenderer.takeTrick);
	g.game.setEventRenderer('bid', webRenderer.bid);
	
	// Preload images
	var imgs = ['horizontal-trick', 'vertical-trick'];
	var img = new Image();
	for (var i = 0; i < imgs.length; i++) {
		img.src = 'images/' + imgs[i] + '.png';
	}
	
	
	// Calculate table positions
	var game = games[user.currentGameID];
	g.userOrder = game.users.split(',');
	for (var j=0; j<g.userOrder.length; j++) {
		if (userID == g.userOrder[j]) {
			g.userPosition = j+1;
			break;
		}
	}
//	doLog('Total players: ' + games[user.currentGameID].numPlayers);
//	doLog('My position: ' + g.userPosition);
	
	// Add players class
	if (games[user.currentGameID].numPlayers > 4) {
		$('#wrapper').addClass('wide');
	}
	$('#board').addClass('players-' + games[user.currentGameID].numPlayers);
	
	var players = [],
		p = null,
		h = '',
		h2 = '',
		uid = null;
	
	// Add players blocks
	for (var i=0; i<game.players; i++) {
		h += '<div id="player-position-' + (i+1) + '" class="avatar"><div class="userPic"></div><small></small></div>';
		h2 += '<div id="player-position-' + (i+1) + '-bubble" class="bubble"><p></p></div>';
	}
	$('#playersBlock').html(h);
	$('#playersBidBlock').html(h2);
	
	switch (games[user.currentGameID].numPlayers) {
		
		// 2 PLAYER GAME
		case 2:
			
			// Create player 2 (top center)
			uid = g.userOrder[(g.userPosition + 0) % game.players];
			$('#player-position-1 div').addClass('player-' + uid);
			$('#player-position-1 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = oh.VERTICAL_MARGIN;
			p.left = $('#board').width() / 2;
			p.align = "h";
			p.position = 'top';
			p.id = 'player-position-1';
			players.push(p);
			
			// Create player 1 (bottom)
			uid = g.userOrder[(g.userPosition + 1) % game.players];
			$('#player-position-2 div').addClass('player-' + uid);
			$('#player-position-2 small').text(users[uid].name);
			g.human = new HumanPlayer(users[uid].name);
			g.human.top = $('#board').height() - oh.CARD_SIZE.height - oh.VERTICAL_MARGIN;
			g.human.left = $('#board').width() / 2;
			g.human.align = "h";
			g.human.position = 'bottom';
			g.human.id = 'player-position-2';
			players.push(g.human);
			
			break;
		
		// 3 PLAYER GAME
		case 3:
			
			// Create player 2 (left)
			uid = g.userOrder[(g.userPosition + 0) % game.players];
			$('#player-position-1 div').addClass('player-' + uid);
			$('#player-position-1 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = $('#board').height() / 2;
			p.left = oh.HORIZONTAL_MARGIN;
			p.align = "v";
			p.position = 'left';
			p.id = 'player-position-1';
			players.push(p);
			
			// Create player 3 (right)
			uid = g.userOrder[(g.userPosition + 1) % game.players];
			$('#player-position-2 div').addClass('player-' + uid);
			$('#player-position-2 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = $('#board').height() / 2;
			p.left = $('#board').width() - oh.CARD_SIZE.height - oh.HORIZONTAL_MARGIN;
			p.align = "v";
			p.position = 'right';
			p.id = 'player-position-2';
			players.push(p);
			
			// Create player 1 (bottom)
			uid = g.userOrder[(g.userPosition + 2) % game.players];
			$('#player-position-3 div').addClass('player-' + uid);
			$('#player-position-3 small').text(users[uid].name);
			g.human = new HumanPlayer(users[uid].name);
			g.human.top = $('#board').height() - oh.CARD_SIZE.height - oh.VERTICAL_MARGIN;
			g.human.left = $('#board').width() / 2;
			g.human.align = "h";
			g.human.position = 'bottom';
			g.human.id = 'player-position-3';
			players.push(g.human);
			
			break;
			
		// 4 PLAYER GAME
		case 4:
			
			// Create player 2 (left)
			uid = g.userOrder[(g.userPosition + 0) % game.players];
			$('#player-position-1 div').addClass('player-' + uid);
			$('#player-position-1 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = $('#board').height() / 2;
			p.left = oh.HORIZONTAL_MARGIN;
			p.align = "v";
			p.position = 'left';
			p.id = 'player-position-1';
			players.push(p);
			
			// Create player 3 (top center)
			uid = g.userOrder[(g.userPosition + 1) % game.players];
			$('#player-position-2 div').addClass('player-' + uid);
			$('#player-position-2 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = oh.VERTICAL_MARGIN;
			p.left = $('#board').width() / 2;
			p.align = "h";
			p.position = 'top';
			p.id = 'player-position-2';
			players.push(p);
			
			// Create player 4 (right)
			uid = g.userOrder[(g.userPosition + 2) % game.players];
			$('#player-position-3 div').addClass('player-' + uid);
			$('#player-position-3 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = $('#board').height() / 2;
			p.left = $('#board').width() - oh.CARD_SIZE.height - oh.HORIZONTAL_MARGIN;
			p.align = "v";
			p.position = 'right';
			p.id = 'player-position-3';
			players.push(p);
			
			// Create player 1 (bottom)
			uid = g.userOrder[(g.userPosition + 3) % game.players];
			$('#player-position-4 div').addClass('player-' + uid);
			$('#player-position-4 small').text(users[uid].name);
			g.human = new HumanPlayer(users[uid].name);
			g.human.top = $('#board').height() - oh.CARD_SIZE.height - oh.VERTICAL_MARGIN;
			g.human.left = $('#board').width() / 2;
			g.human.align = "h";
			g.human.position = 'bottom';
			g.human.id = 'player-position-4';
			players.push(g.human);
			
			break;
		
		// 5 PLAYER GAME
		case 5:
			
			// Create player 2 (left)
			uid = g.userOrder[(g.userPosition + 0) % game.players];
			$('#player-position-1 div').addClass('player-' + uid);
			$('#player-position-1 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = $('#board').height() / 2;
			p.left = oh.HORIZONTAL_MARGIN;
			p.align = "v";
			p.position = 'left';
			p.id = 'player-position-1';
			players.push(p);
			
			// Create player 3 (top left)
			uid = g.userOrder[(g.userPosition + 1) % game.players];
			$('#player-position-2 div').addClass('player-' + uid);
			$('#player-position-2 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = oh.VERTICAL_MARGIN;
			p.left = 0.3 * $('#board').width();
			p.align = "h";
			p.position = 'topLeft';
			p.id = 'player-position-2';
			players.push(p);
			
			// Create player 4 (top right)
			uid = g.userOrder[(g.userPosition + 2) % game.players];
			$('#player-position-3 div').addClass('player-' + uid);
			$('#player-position-3 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = oh.VERTICAL_MARGIN;
			p.left = 0.7 * $('#board').width();
			p.align = "h";
			p.position = 'topRight';
			p.id = 'player-position-3';
			players.push(p);
			
			// Create player 5 (right)
			uid = g.userOrder[(g.userPosition + 3) % game.players];
			$('#player-position-4 div').addClass('player-' + uid);
			$('#player-position-4 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = $('#board').height() / 2;
			p.left = $('#board').width() - oh.CARD_SIZE.height - oh.HORIZONTAL_MARGIN;
			p.align = "v";
			p.position = 'right';
			p.id = 'player-position-4';
			players.push(p);
			
			// Create player 1 (bottom)
			uid = g.userOrder[(g.userPosition + 4) % game.players];
			$('#player-position-5 div').addClass('player-' + uid);
			$('#player-position-5 small').text(users[uid].name);
			g.human = new HumanPlayer(users[uid].name);
			g.human.top = $('#board').height() - oh.CARD_SIZE.height - oh.VERTICAL_MARGIN;
			g.human.left = $('#board').width() / 2;
			g.human.align = "h";
			g.human.position = 'bottom';
			g.human.id = 'player-position-5';
			players.push(g.human);
			
			break;
		
		// 6 PLAYER GAME
		case 6:
		default:
			
			// Create player 2 (left)
			uid = g.userOrder[(g.userPosition + 0) % game.players];
			$('#player-position-1 div').addClass('player-' + uid);
			$('#player-position-1 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = $('#board').height() / 2;
			p.left = oh.HORIZONTAL_MARGIN;
			p.align = "v";
			p.position = 'left';
			p.id = 'player-position-1';
			players.push(p);
			
			// Create player 3 (top left)
			uid = g.userOrder[(g.userPosition + 1) % game.players];
			$('#player-position-2 div').addClass('player-' + uid);
			$('#player-position-2 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = oh.VERTICAL_MARGIN;
			p.left = 0.3 * $('#board').width();
			p.align = "h";
			p.position = 'topLeft';
			p.id = 'player-position-2';
			players.push(p);
			
			// Create player 4 (top right)
			uid = g.userOrder[(g.userPosition + 2) % game.players];
			$('#player-position-3 div').addClass('player-' + uid);
			$('#player-position-3 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = oh.VERTICAL_MARGIN;
			p.left = 0.7 * $('#board').width();
			p.align = "h";
			p.position = 'topRight';
			p.id = 'player-position-3';
			players.push(p);
			
			// Create player 5 (right)
			uid = g.userOrder[(g.userPosition + 3) % game.players];
			$('#player-position-4 div').addClass('player-' + uid);
			$('#player-position-4 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = $('#board').height() / 2;
			p.left = $('#board').width() - oh.CARD_SIZE.height - oh.HORIZONTAL_MARGIN;
			p.align = "v";
			p.position = 'right';
			p.id = 'player-position-4';
			players.push(p);
			
			// Create player 5 (bottom right)
			uid = g.userOrder[(g.userPosition + 4) % game.players];
			$('#player-position-5 div').addClass('player-' + uid);
			$('#player-position-5 small').text(users[uid].name);
			p = new ComputerPlayer(users[uid].name);
			p.top = $('#board').height() - oh.CARD_SIZE.height - oh.VERTICAL_MARGIN;
			p.left = 0.7 * $('#board').width();
			p.align = "h";
			p.position = 'bottomRight';
			p.id = 'player-position-5';
			players.push(p);
			
			// Create player 1 (bottom left)
			uid = g.userOrder[(g.userPosition + 5) % game.players];
			$('#player-position-6 div').addClass('player-' + uid);
			$('#player-position-6 small').text(users[uid].name);
			g.human = new HumanPlayer(users[uid].name);
			g.human.top = $('#board').height() - oh.CARD_SIZE.height - oh.VERTICAL_MARGIN;
			g.human.left = 0.3 * $('#board').width();
			g.human.align = "h";
			g.human.position = 'bottomLeft';
			g.human.id = 'player-position-6';
			players.push(g.human);
			
			break;
	}
	
	// Add players
	for (var i=0; i<games[user.currentGameID].numPlayers; i++) {
		var pos = (players.length + i - g.userPosition) % players.length;
		g.game.addPlayer(players[pos]);
	}
	
	
	// Set rounds
	g.game.rounds = g.status.game.rounds;
//	doLog('# rounds in game: ' + g.game.rounds);
	
	// Set game to current state (if page was reloaded)
	if (g.status.currentRoundID > 0) {
		
		// In middle of round
		if (g.status.round != null) {
			g.game.cardCount = parseInt(g.status.round.hands, 10);
//			doLog('Set card count: ' + g.game.cardCount);
			g.game.round = g.status.currentRoundID;
//			doLog('Set Round: ' + g.game.round);
			
			// Set dealer index
			g.game.dealerIndex = (g.status.currentRoundID - 2 + g.game.players.length) % g.game.players.length;;
			g.game.nextPlayerToDealTo = g.game.nextIndex(g.game.dealerIndex);
			g.game.currentPlayerIndex = g.game.nextIndex(g.game.dealerIndex);
			g.game.bidPlayerIndex = g.game.currentPlayerIndex;
//			doLog('Dealer: ' + g.game.dealerIndex);
//			doLog('Player: ' + g.game.currentPlayerIndex);
			
			// If cards were already dealt (page reloaded), go ahead and deal
			if (g.status.player[1].hand != null && g.status.player[1].hand) {
//				doLog('Cards already dealt... deal!');
				g.game.newDeck();
				g.game.deal();
			}
		}
		// Beginning of round
		else {
			g.game.round = g.status.currentRoundID;
//			doLog('Set Round: ' + g.game.round);
			
			// Set dealer index to next round
			g.game.dealerIndex = (g.status.currentRoundID - 1) % g.game.players.length;
			g.game.nextPlayerToDealTo = g.game.nextIndex(g.game.dealerIndex);
			g.game.currentPlayerIndex = g.game.nextIndex(g.game.dealerIndex);
			g.game.bidPlayerIndex = g.game.currentPlayerIndex;
//			doLog('Dealer: ' + g.game.dealerIndex);
//			doLog('Player: ' + g.game.currentPlayerIndex);
		}
	}
	// Beginning of game
	else {
//		doLog('No rounds exist yet!');
		g.game.dealerIndex = g.game.players.length - 1;
		g.game.nextPlayerToDealTo = g.game.nextIndex(g.game.dealerIndex);
		g.game.currentPlayerIndex = g.game.nextIndex(g.game.dealerIndex);
		g.game.bidPlayerIndex = g.game.currentPlayerIndex;
//		doLog('Dealer: ' + g.game.dealerIndex);
//		doLog('Player: ' + g.game.currentPlayerIndex);
	}
//	doLog('Seat: ' + (g.status.seatID-1));
}

// Delete game (while in progress)
function deleteGameConfirm() {
	if (confirm('You are about to delete game #' + user.currentGameID + '. Are you sure?')) {
		getJSON({"op":"deleteGame", "gameID":user.currentGameID}, function(data) {
			document.location.reload();
		});
	}
}

function doLog(msg) {
	console.log(msg);
//	$('#console').prepend('<p>' + msg + '</p>');
}

function getJSON(data2, callback) {
	$.ajax({
		type: "POST",
		url: "/api/",
		data: data2,
		success: function(data) {
			callback(data);
		},
		error: function(event, request, settings) {
			doLog("Error with AJAX request: " + settings.url);
		},
		dataType: "json"
	});
}