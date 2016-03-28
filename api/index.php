<?php

# OH HECK API
# Created by Justin Miller on 5.19.2012

header('Content-Type: text/html; charset=utf-8');
session_start();
require_once("db.php");

define("TIMEOUT_USER", 300);
define("TIMEOUT_GAME", 600);

# Setup DB
errorLog("Setup DB...");
$db = new DB();
if (!$db->ping()) {
	errorLog("DB Ping Failed!");
	exit();
}


switch($_REQUEST["op"]) {
	
	# Set active user
	case "setActiveUser":
		
		# Update user record
		$sql = "UPDATE `user` SET active = NOW() WHERE id = ?";
		$db->query($sql, "i", $_SESSION["userID"]);
		
#		# If user is currently waiting for a game to start, update the game also
#		$sql = "UPDATE `game` SET active = NOW() WHERE id = (SELECT currentGameID FROM user WHERE id = ?) AND status = 'Wait'";
#		$db->query($sql, "i", $_SESSION["userID"]);
		
		$json = array("has_data" => true, "isActive" => true);
		echo json_encode($json);
		break;
	
	# Get users
	case "getUsers":
		$users = array();
		$sql = "SELECT
					id, name, currentGameID, games, wins,
					IF(active IS NOT NULL AND active >= (NOW() - ?),1,0) AS isActive
				FROM `user`";
		$db->query($sql, "i", TIMEOUT_USER);
		$rows = $db->fetchAll();
		foreach ($rows as $user) {
			$users[$user["id"]] = $user;
		}
		$db->freeResult();
		$json = array("has_data" => true, "users" => $users);
		echo json_encode($json);
		break;
	
	# Get games
	case "getGames":
		$games = array();
		$sql = "SELECT
					game.*,
					COUNT(*) AS numPlayers,
					GROUP_CONCAT(DISTINCT player.userID ORDER BY player.seatID SEPARATOR ',') AS users,
					IF(game.active IS NOT NULL AND game.active >= (NOW() - ?),1,0) AS isActive
				FROM `game`
				LEFT JOIN `player` ON player.gameID = game.id
				WHERE game.status = 'Wait' OR game.status = 'Play'
				GROUP BY game.id";
		$db->query($sql, "i", TIMEOUT_GAME);
		$numGames = 0;
		$rows = $db->fetchAll();
		foreach ($rows as $game) {
			$games[$game["id"]] = $game;
			$numGames++;
		}
		$db->freeResult();
		$json = array("has_data" => true, "numGames" => $numGames, "games" => $games);
		echo json_encode($json);
		break;
	
	# Create game
	case "createGame":
		$trump = (isset($_REQUEST["trump"])) ? 1 : 0;
		$instant = (isset($_REQUEST["instant"])) ? 1 : 0;
		$nascar = (isset($_REQUEST["nascar"])) ? 1 : 0;
		
		$sql = "INSERT INTO `game`
					(ownerID, players, rounds, decks, trump, instant, nascar, scoring, active)
				VALUES
					(?,?,?,?,?,?,?,?,NOW())";
		$db->query($sql, "iiiiiiis", $_SESSION["userID"], $_REQUEST["players"], $_REQUEST["rounds"], $_REQUEST["decks"], $trump, $instant, $nascar, $_REQUEST["scoring"]);
		$gameID = $db->insertID();
		
		# Add user to game
		$db->query("UPDATE `user` SET currentGameID = ? WHERE id = ?", "ii", $gameID, $_SESSION["userID"]);
		
		# Add player (game owner) to first seat
		$sql = "INSERT INTO player (userID, gameID, seatID) VALUES (?,?,1)";
		$db->query($sql, "ii", $_SESSION["userID"], $gameID);
		
		$json = array("has_data" => true, "gameID" => $gameID);
		echo json_encode($json);
		break;
	
	# Delete game
	case "deleteGame":
		$gameID = $_REQUEST["gameID"];
		
		# Delete users
		$db->query("UPDATE `user` SET currentGameID = NULL WHERE currentGameID = ?", "i", $gameID);
		
		# Delete players
		$db->query("DELETE FROM `player` WHERE gameID = ?", "i", $gameID);
		
		# Delete hands
		$db->query("DELETE FROM `hand` WHERE gameID = ?", "i", $gameID);
		
		# Delete rounds
		$db->query("DELETE FROM `round` WHERE gameID = ?", "i", $gameID);
		
		# Delete game
		$db->query("DELETE FROM `game` WHERE id = ?", "i", $gameID);
		
		$json = array("has_data" => true, "gameID" => $gameID);
		echo json_encode($json);
		break;
	
	# Set active game
	case "setActiveGame":
		$sql = "UPDATE `game` SET active = NOW() WHERE id = ?";
		$db->query($sql, "i", $_REQUEST["gameID"]);
		$json = array("has_data" => true, "gameID" => $_REQUEST["gameID"]);
		echo json_encode($json);
		break;
	
	# Join game
	case "joinGame":
		$gameID = $_REQUEST["gameID"];
		
		# Check for available seat
		$sql = "SELECT
					game.players AS total,
					COUNT(*) AS numPlayers
				FROM `game`
				LEFT JOIN `player` ON player.gameID = game.id
				WHERE game.id = ?
				AND game.status = 'Wait'
				AND game.active IS NOT NULL
				AND game.active >= (NOW() - ?)
				GROUP BY game.id";
		$db->query($sql, "ii", $gameID, TIMEOUT_GAME);
		if ($db->numRows() == 1) {
			$rows = $db->fetchAll();
			$currentPlayers = $rows[0]["numPlayers"];
			$totalPlayers = $rows[0]["total"];
			
			# Seat open
			if ($currentPlayers < $totalPlayers) {
				
				# Update player current game
				$db->query("UPDATE `user` SET currentGameID = ? WHERE id = ?", "ii", $gameID, $_SESSION["userID"]);
				
				# Add player
				$sql = "INSERT INTO `player` (userID, gameID, seatID) VALUES (?,?,?)";
				$db->query($sql, "iii", $_SESSION["userID"], $gameID, $currentPlayers + 1);
				if ($db->affectedRows() == 1) {
					$json = array("has_data" => true, "gameID" => $gameID);
				}
			}
			else {
				$json = array("has_data" => false, "error" => "Game is already full");
			}
		}
		else {
			$json = array("has_data" => false, "error" => "Error joining game: " . $db->error);
		}
		echo json_encode($json);
		break;
	
	# Leave game
	case "leaveGame":
		$gameID = $_REQUEST["gameID"];
		
		# Delete player history
		$sql = "DELETE FROM `player` WHERE userID = ? AND gameID = ?";
		$db->query($sql, "ii", $_SESSION["userID"], $gameID);
		
		# Delete player from game
		$sql = "UPDATE `user` SET currentGameID = NULL WHERE currentGameID = ? AND id = ?";
		$db->query($sql, "ii", $gameID, $_SESSION["userID"]);
		
		$json = array("has_data" => true, "gameID" => $gameID);
		echo json_encode($json);
		break;
	
	# Load game info
	case "getGame":
		$sql = "SELECT
					game.*,
					COUNT(*) AS numPlayers,
					GROUP_CONCAT(DISTINCT player.userID ORDER BY player.seatID SEPARATOR ',') AS users
				FROM `game`
				LEFT JOIN `player` ON player.gameID = game.id
				WHERE game.id = ?
				GROUP BY game.id";
		$db->query($sql, "i", $_REQUEST["gameID"]);
		$rows = $db->fetchAll();
		$db->freeResult();
		
		# Players
		$sql = "SELECT * FROM `player` WHERE gameID = ? ORDER BY seatID";
		$db->query($sql, "i", $_REQUEST["gameID"]);
		$players = $db->fetchAll();
		$db->freeResult();
		$rows[0]["players"] = array();
		foreach ($players as $player) {
			$rows[0]["players"][$player["seatID"]] = $player;
		}
		
		# Rounds
		$sql = "SELECT * FROM `round` WHERE gameID = ? ORDER BY roundID";
		$db->query($sql, "i", $_REQUEST["gameID"]);
		$rounds = $db->fetchAll();
		$db->freeResult();
		$rows[0]["rounds"] = array();
		foreach ($rounds as $round) {
			$rows[0]["rounds"][$round["roundID"]] = $round;
		}
		
		$json = array("has_data" => true, "game" => $rows[0]);
		echo json_encode($json);
		break;
	
	# Start game
	case "startGame":
		$gameID = $_REQUEST["gameID"];
		
		# Make sure all players are here and this is the game owner
		$sql = "SELECT game.players AS total, COUNT(*) AS numPlayers
				FROM `game`
				LEFT JOIN `player` ON player.gameID = game.id
				WHERE game.id = ?
				AND game.status = 'Wait'
				AND game.active IS NOT NULL
				AND game.active >= (NOW() - ?)
				AND game.ownerID = ?
				GROUP BY game.id";
		$db->query($sql, "iii", $gameID, TIMEOUT_GAME, $_SESSION["userID"]);
		if ($db->numRows() == 1) {
			$rows = $db->fetchAll();
			$currentPlayers = $rows[0]["numPlayers"];
			$totalPlayers = $rows[0]["total"];
			
			# All players are here - let's begin!
			if ($currentPlayers == $totalPlayers) {
				$sql = "UPDATE `game`
						SET status = 'Play', currentRoundID = 0, currentPlayerID = 1, active = NOW()
						WHERE id = ?";
				$db->query($sql, "i", $gameID);
				$json = array(
					"has_data" => true,
					"gameID" => $gameID,
					"roundID" => 0,
					"playerID" => 1,
					"hand" => ""
				);
			}
			else {
				$json = array("has_data" => false, "error" => "Waiting for all players to start");
			}
		}
		else {
			$json = array("has_data" => false, "error" => "Error starting game: " . $db->error);
		}
		echo json_encode($json);
		break;
	
	# Load player info
	case "getRound":
		$gameID = $_REQUEST["gameID"];
		$json = array();
		
		# Game
		$sql = "SELECT
					game.*,
					COUNT(*) AS numPlayers,
					GROUP_CONCAT(DISTINCT player.userID ORDER BY player.seatID SEPARATOR ',') AS users
				FROM `game`
				LEFT JOIN `player` ON player.gameID = game.id
				WHERE game.id = ?
				GROUP BY game.id";
		$db->query($sql, "i", $gameID);
		$rows = $db->fetchAll();
		$json["game"] = $rows[0];
		$roundID = $json["game"]["currentRoundID"];
		$json["currentPlayerID"] = $json["game"]["currentPlayerID"];
		$json["currentRoundID"] = $roundID;
		$db->freeResult();
		
		# Player
		$sql = "SELECT
					player.userID,
					user.name,
					player.seatID,
					player.currentBid AS bid,
					player.hand,
					player.currentHand,
					SUM(hand.trick) AS tricks,
					player.score
				FROM `player`
				LEFT JOIN `user` ON player.userID = user.id
				LEFT OUTER JOIN `hand` ON hand.seatID = player.seatID
				WHERE player.gameID = ?
				GROUP BY player.userID";
		$db->query($sql, "i", $gameID);
		$rows = $db->fetchAll();
		$json["player"] = array();
		foreach ($rows as $player) {
			$json["player"][$player["seatID"]] = $player;
			
			# Find current seat
			if ($player["userID"] == $_SESSION["userID"]) {
				$json["seatID"] = $player["seatID"];
			}
		}
		$db->freeResult();
		
		# Round
		if ($roundID > 0) {
			$db->query("SELECT * FROM `round` WHERE gameID = ? AND roundID = ? AND status != 'Complete'", "ii", $gameID, $roundID);
			$rows = $db->fetchAll();
			$json["round"] = $rows[0];
			$handID = $json["round"]["currentHandID"];
			$json["handID"] = $handID;
			$db->freeResult();
			
			# Hand
			if ($handID > 0) {
				$sql = "SELECT handID, seatID, card, trick
						FROM `hand`
						WHERE gameID = ?
						AND roundID = ?
						ORDER BY handID, active";
				$db->query($sql, "ii", $gameID, $roundID);
				$rows = $db->fetchAll();
				$db->freeResult();
				foreach ($rows as $hand) {
					if (!isset($json["hand"][$hand["handID"]])) {
						$json["hand"][$hand["handID"]] = array();
					}
					$json["hand"][$hand["handID"]][$hand["seatID"]] = array("card" => $hand["card"], "trick" => $hand["trick"]);
				}
			}
		}
		$json["has_data"] = true;
		echo json_encode($json);
		break;
	
	# Deal hand
	case "dealHand":
		$gameID = $_REQUEST["gameID"];
		
		$sql = "SELECT players, rounds, decks, trump, currentRoundID FROM `game`
					LEFT JOIN `user` ON user.currentGameID = game.id
				WHERE user.id = ?
				AND game.id = ?";
		$db->query($sql, "ii", $_SESSION["userID"], $gameID);
		if ($db->numRows() == 1) {
			$rows = $db->fetchAll();
			$db->freeResult();
			
			# Set active
			$db->query("UPDATE `game` SET active = NOW() WHERE id = ?", "i", $gameID);
			
			$players = $rows[0]["players"];
			$rounds = $rows[0]["rounds"];
			$decks = $rows[0]["decks"];
			$trump = ($rows[0]["trump"] == 1);
			$currentRoundID = $rows[0]["currentRoundID"];
			$nextRoundID = $currentRoundID + 1;
			$nextDealerID = (($currentRoundID - 1) % $players) + 1;
			if ($nextDealerID == 0) {
				$nextDealerID = $players;
			}
			
			if ($nextRoundID <= $rounds) {
				$maxCards = floor(52 * $decks / $players);
#				$cardsToDeal = $rounds - $nextRoundID + 1;
				$cardsToDeal = 10;
				
				# Can't deal less than 1 card or more than MAX_CARDS
				$cardsToDeal = max(1, min($maxCards, $cardsToDeal));
				$trumpArray = array("D","C","H","S","N");
				$nextTrump = ($trump) ? $trumpArray[rand(0,3)] : $trumpArray[4];
				
				# Create round
				$sql = "INSERT INTO `round` (gameID, roundID, hands, dealerID, trump) VALUES (?,?,?,?,?)";
				$db->query($sql, "iiiis", $gameID, $nextRoundID, $cardsToDeal, $nextDealerID, $nextTrump);
				
				# Update game
				$nextPlayerID = ($nextDealerID % $players) + 1;
				$sql = "UPDATE `game` SET currentRoundID = ?, currentPlayerID = ? WHERE id = ?";
				$db->query($sql, "iii", $nextRoundID, $nextPlayerID, $gameID);
				
				$cardArray = array();
				for ($i=2; $i<=14; $i++) {
					$cardArray[] = "H" . $i;
					$cardArray[] = "S" . $i;
					$cardArray[] = "D" . $i;
					$cardArray[] = "C" . $i;
				}
				
				# Create deck/cards to deal
				$cards = array();
				for ($i=0; $i<$decks; $i++) {
					foreach ($cardArray as $c) {
						$cards[] = $c;
					}
				}
				
				# Deal cards
				for ($seat=1; $seat<=$players; $seat++) {
					$playerCards = array();
					for ($i=0; $i<$cardsToDeal; $i++) {
						# Pick a random card from remaining cards
						$random = rand(0, count($cards) - 1);
						$playerCards[] = $cards[$random];
						array_splice($cards, $random, 1);
					}
					
					$playerHand = implode(",", $playerCards);
					$sql = "UPDATE `player` SET currentBid = NULL, hand = ?, currentHand = ?
							WHERE gameID = ?
							AND seatID = ?";
					$db->query($sql, "ssii", $playerHand, $playerHand, $gameID, $seat);
				}
				
				$json = array("has_data" => true, "round" => $nextRoundID);
			}
			else {
				$json = array("has_data" => false, "error" => "Game is complete");
			}	
		}
		else {
			$json = array("has_data" => false, "error" => "Could not create round: " . $db->error);
		}
		echo json_encode($json);
		break;
	
	# Bid
	case "bid":
		$gameID = $_REQUEST["gameID"];
		$roundID = $_REQUEST["roundID"];
		$bid = $_REQUEST["bid"];
		
		# Make sure it is the user's turn to bid
		$sql = "SELECT round.dealerID, game.players, game.currentPlayerID, player.*
					FROM `game`
					LEFT JOIN `player` ON (player.gameID = game.id AND player.seatID = game.currentPlayerID)
					LEFT JOIN `round` ON (round.gameID = game.id AND round.roundID = game.currentRoundID)
				WHERE game.id = ?
				AND game.currentRoundID = ?
				AND player.userID = ?";
		$db->query($sql, "iii", $gameID, $roundID, $_SESSION["userID"]);
		if ($db->numRows() == 1) {
			$rows = $db->fetchAll();
			$dealerID = $rows[0]["dealerID"];
			$players = $rows[0]["players"];
			$currentPlayerID = $rows[0]["currentPlayerID"];
			
			# Update player bid
			$sql = "UPDATE `player` SET currentBid = ? WHERE userID = ? AND seatID = ? AND gameID = ?";
			$db->query($sql, "iiii", $bid, $_SESSION["userID"], $currentPlayerID, $gameID);
			
			# Update round total bid
			$sql = "UPDATE `round` SET bids = (SELECT SUM(currentBid) FROM `player` WHERE gameID = ? AND roundID = ?)
					WHERE gameID = ?
					AND roundID = ?";
			$db->query($sql, "iiii", $gameID, $roundID, $gameID, $roundID);
			
			# Update current player
			$nextPlayerID = ($currentPlayerID % $players) + 1;
			$sql = "UPDATE `game` SET currentPlayerID = (currentPlayerID % players + 1) WHERE id = ?";
			$db->query($sql, "i", $gameID);
			
			# Check for last player to bid
			if ($currentPlayerID == $dealerID) {
				
				# Update round
				$sql = "UPDATE `round` SET status = 'Play', currentHandID = 1
						WHERE gameID = ?
						AND roundID = ?";
				$db->query($sql, "ii", $gameID, $roundID);
				$json = array("has_data" => true, "hand" => 1);
			}
		}
		else {
			$json = array("has_data" => false, "error" => "Wrong bidding order: " . $db->error);
		}
		echo json_encode($json);
		break;
	
	# Play card
	case "playCard":
		$gameID = $_REQUEST["gameID"];
		$roundID = $_REQUEST["roundID"];
		$handID = $_REQUEST["handID"];
		$card = $_REQUEST["card"];
		
		# Make sure it is the user's turn to play
		$sql = "SELECT game.players, game.rounds, game.currentPlayerID, game.nascar,
						round.trump, round.hands, round.dealerID,
						player.userID, player.currentHand
					FROM `game`
					LEFT JOIN `player` ON (player.gameID = game.id AND player.seatID = game.currentPlayerID)
					LEFT JOIN `round` ON (round.gameID = game.id AND round.roundID = game.currentRoundID)
				WHERE game.id = ?
				AND game.currentRoundID = ?
				AND round.currentHandID = ?
				AND player.userID = ?";
		$db->query($sql, "iiii", $gameID, $roundID, $handID, $_SESSION["userID"]);
		$rows = $db->fetchAll();
		$db->freeResult();
		$players = intval($rows[0]["players"]);
		$rounds = intval($rows[0]["rounds"]);
		$currentPlayerID = intval($rows[0]["currentPlayerID"]);
		$nascar = ($rows[0]["nascar"] == 1);
		$trump = $rows[0]["trump"];
		$hands = intval($rows[0]["hands"]);
		$dealerID = intval($rows[0]["dealerID"]);
		$currentUserID = intval($rows[0]["userID"]);
		$currentHand = explode(",", $rows[0]["currentHand"]);
		
		# Correct bidding order
		if ($currentUserID == $_SESSION["userID"]) {
			
			# Make sure user has this card in their hand
			if (in_array($card, $currentHand)) {
				$cardPos = array_search($card, $currentHand);
				
				# Update card played
				$sql = "INSERT INTO `hand` (gameID, roundID, handID, seatID, card) VALUES (?,?,?,?,?)";
				$db->query($sql, "iiiis", $gameID, $roundID, $handID, $currentPlayerID, $card);
				
				# Update player hand
				array_splice($currentHand, $cardPos, 1);
				$newHand = implode(",", $currentHand);
				$sql = "UPDATE `player` SET currentHand = ? WHERE gameID = ? AND userID = ?";
				$db->query($sql, "sii", $newHand, $gameID, $_SESSION["userID"]);
				
				# Update current player
				$nextPlayerID = ($currentPlayerID % $players) + 1;
				$db->query("UPDATE `game` SET currentPlayerID = ? WHERE id = ?", "ii", $nextPlayerID, $gameID);
				
				$json = array("has_data" => true, "currentPlayerID" => $nextPlayerID);
				
				# Check for last card in hand
				$sql = "SELECT COUNT(*) AS total FROM `hand` WHERE gameID = ? AND roundID = ? AND handID = ?";
				$db->query($sql, "iii", $gameID, $roundID, $handID);
				$rows = $db->fetchAll();
				$db->freeResult();
				if ($rows[0]["total"] == $players) {
					
					# Update hand
					$sql = "SELECT seatID, card FROM `hand` WHERE gameID = ? AND roundID = ? AND handID = ? ORDER BY active";
					$db->query($sql, "iii", $gameID, $roundID, $handID);
					$cardsPlayed = $db->fetchAll();
					$firstCard = $cardsPlayed[0];
					$highestCardSeat = $firstCard["seatID"];
					$highestCardSuit = substr($firstCard["card"], 0, 1);
					$highestCardVal = intval(substr($firstCard["card"], 1));
					
					foreach ($cardsPlayed as $card) {
						$thisCard = $card["card"];
						$thisCardSeat = $card["seatID"];
						$thisCardSuit = substr($thisCard, 0, 1);
						$thisCardVal = intval(substr($thisCard, 1));
						$out[] = "this card: " . $thisCard;
						$out[] = "this card seat: " . $thisCardSeat;
						$out[] = "this card val: " . $thisCardVal;
						$out[] = "this card suit: " . $thisCardSuit;
						
						# Trump over no trump
						if ($thisCardSuit == $trump && $highestCardSuit != $trump) {
							$highestCardSeat = $thisCardSeat;
							$highestCardSuit = $thisCardSuit;
							$highestCardVal = $thisCardVal;
							$out[] = "this card is now highest because of trump";
						}
						# Higher card in same suit
						elseif ($thisCardSuit == $highestCardSuit && $thisCardVal >= $highestCardVal) {
							$highestCardSeat = $thisCardSeat;
							$highestCardSuit = $thisCardSuit;
							$highestCardVal = $thisCardVal;
							$out[] = "this card is now highest because of val";
						}
					}
					$out[] = "highest card seat is: " . $highestCardSeat;
					
					# Update trick
					$sql = "UPDATE `hand` SET trick = 1 WHERE gameID = ? AND roundID = ? AND handID = ? AND seatID = ?";
					$db->query($sql, "iiii", $gameID, $roundID, $handID, $highestCardSeat);
					
					# Update current player
					# Trick winner leads next hand
					$nextPlayerID = $highestCardSeat;
					$sql = "UPDATE `game` SET currentPlayerID = ? WHERE id = ?";
					$db->query($sql, "ii", $nextPlayerID, $gameID);
					
					# Update round -- this is not the last hand in round
					if ($handID < $hands) {
						$nextHandID = $handID + 1;
						$sql = "UPDATE `round` SET currentHandID = currentHandID + 1 WHERE gameID = ? AND roundID = ?";
						$db->query($sql, "ii", $gameID, $roundID);
						
						$json = array("has_data" => true, "currentHandID" => $nextHandID, "currentPlayerID" => $nextPlayerID, "out" => $out);
					}
					
					# Check for last hand in round
					else {
						
						# Update score
						$sql = "SELECT player.userID, player.currentBid, SUM(hand.trick) AS tricks
								FROM `player`
								LEFT JOIN `hand` ON (hand.gameID = player.gameID AND hand.seatID = player.seatID)
								WHERE hand.gameID = ?
								AND hand.roundID = ?
								GROUP BY player.userID";
						$db->query($sql, "ii", $gameID, $roundID);
						$rows = $db->fetchAll();
						$db->freeResult();
						
						$usersMadeBid = 0;
						foreach ($rows as $row) {
							
							# User made bid
							if ($row["currentBid"] == $row["tricks"]) {
								$usersMadeBid++;
								$points = $row["tricks"] + 10;
							}
							else {
								$points = $row["tricks"];
							}
							$sql = "UPDATE `player` SET
										score = score + ?,
										hand = NULL,
										currentHand = NULL
									WHERE gameID = ?
									AND userID = ?";
							$db->query($sql, "iii", $points, $gameID, $row["userID"]);
						}
						
						# Update round
						$sql = "UPDATE `round` SET status = 'Complete', winningPlayers = ? WHERE gameID = ? AND roundID = ?";
						$db->query($sql, "iii", $usersMadeBid, $gameID, $roundID);
						
						# Update game
						$nextDealerID = ($dealerID % $players) + 1;
						$nextPlayerID = $nextDealerID;
						$nextRoundID = $roundID + 1;
						$json = array(
							"has_data" => true,
							"currentRoundID" => $nextRoundID,
							"currentHandID" => 1,
							"currentPlayerID" => $nextPlayerID
						);
						
						# Check for last round in game
						if ($roundID == $rounds) {
							
							# Calculate winner
							$sql = "SELECT userID
									FROM `player`
									WHERE gameID = ?
									ORDER BY score DESC, seatID ASC
									LIMIT 1";
							$db->query($sql, "i", $gameID);
							$rows = $db->fetchAll();
							$winningUserID = $rows[0]["userID"];
							$db->freeResult();
							
							# Update game
							$sql = "UPDATE `game` SET status = 'Complete', winningUserID = ? WHERE id = ?";
							$db->query($sql, "ii", $winningUserID, $gameID);
							
							# Update all users
							$sql = "UPDATE `user` SET games = games + 1 WHERE currentGameID = ?";
							$db->query($sql, "i", $gameID);
							
							# Update winning user
							$sql = "UPDATE `user` SET wins = wins + 1 WHERE id = ?";
							$db->query($sql, "i", $winningUserID);
							
							$json = array("has_data" => true, "finished" => true, "winningUserID" => $winningUserID);
						}
						
						# Check for nascar
						else if ($roundID == ($rounds - 3) && $rounds > 6) {
							
							# Calculate scores
							$sql = "SELECT userID, score, score AS newScore
										FROM `player`
									WHERE gameID = ?
									ORDER BY score DESC, seatID ASC";
							$db->query($sql, "i", $gameID);
							$rows = $db->fetchAll();
							$db->freeResult();
							
							# Update scores
							for ($i=1; $i<count($rows); $i++) {
								$pointsBehindNextPlayer = $rows[$i-1]["score"] - $rows[$i]["score"];
								$newPointsBehindNextPlayer = min($pointsBehindNextPlayer, 2);
								$rows[$i]["newScore"] = $rows[$i-1]["newScore"] - $newPointsBehindNextPlayer;
								
								$sql = "UPDATE `player` SET score = ? WHERE gameID = ? AND userID = ? LIMIT 1";
								$db->query($sql, "iii", $rows[$i]["newScore"], $gameID, $rows[$i]["userID"]);
							}
						}
					}
				}
			}
			# User played illegal card
			else {
				$json = array("has_data" => false, "error" => "User played illegal card.", "json" => $rows);
			}
		}
		# Wrong playing order
		else {
			$json = array("has_data" => false, "error" => "User played out of turn.", "json" => $rows);
		}
		echo json_encode($json);
		break;
	
	# Error
	default:
		$json = array("has_data" => false, "error" => "Invalid request");
		echo json_encode($json);
		break;
}

exit();


function errorLog($msg) {
	$fp = fopen("api.log", "a");
	if ($fp) {
		fwrite($fp, date('Y-m-d H:i:s') . " - $msg\n");
		fclose($fp);
	}
}



/*
 * OH HECK DB SCHEMA
 *
 *
 
CREATE TABLE `user` (
	`id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(64) NOT NULL,
	`username` VARCHAR(64) NOT NULL,
	`password` VARCHAR(32) NOT NULL,
	`currentGameID` INT UNSIGNED,
	`games` INT UNSIGNED NOT NULL DEFAULT 0,
	`wins` INT UNSIGNED NOT NULL DEFAULT 0,
	`lastLogin` DATETIME,
	`active` TIMESTAMP,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_general_ci;

CREATE TABLE `game` (
	`id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
	`ownerID` INT UNSIGNED NOT NULL,
	`players` INT UNSIGNED NOT NULL DEFAULT 4,
	`rounds` INT UNSIGNED NOT NULL DEFAULT 10,
	`decks` INT UNSIGNED NOT NULL DEFAULT 1,
	`trump` TINYINT(1) NOT NULL DEFAULT 1,
	`instant` TINYINT(1) NOT NULL DEFAULT 0,
	`nascar` TINYINT(1) NOT NULL DEFAULT 1,
	`scoring` ENUM('High','Mid','Low') NOT NULL DEFAULT 'High',
	`status` ENUM('Wait','Play','Complete') NOT NULL DEFAULT 'Wait',
	`currentRoundID` INT UNSIGNED NOT NULL DEFAULT 0,
	`currentPlayerID` INT UNSIGNED,
	`winningUserID` INT UNSIGNED,
	`active` TIMESTAMP,
	PRIMARY KEY (`id`),
	FOREIGN KEY (`ownerID`) REFERENCES user(id)
) ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_general_ci;

CREATE TABLE `round` (
	`gameID` INT UNSIGNED NOT NULL,
	`roundID` INT UNSIGNED NOT NULL,
	`hands` INT UNSIGNED NOT NULL DEFAULT 6,
	`bids` INT UNSIGNED NOT NULL DEFAULT 0,
	`dealerID` INT UNSIGNED NOT NULL,
	`trump` ENUM('C','S','H','D','N') NOT NULL DEFAULT 'N',
	`status` ENUM('Bid','Play','Complete') NOT NULL DEFAULT 'Bid',
	`currentHandID` INT UNSIGNED NOT NULL DEFAULT 0,
	`winningPlayers` INT UNSIGNED,
	`active` TIMESTAMP,
	PRIMARY KEY (`gameID`, `roundID`),
	FOREIGN KEY (`gameID`) REFERENCES game(id),
	FOREIGN KEY (`dealerID`) REFERENCES user(id)
) ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_general_ci;

CREATE TABLE `player` (
	`userID` INT UNSIGNED NOT NULL,
	`gameID` INT UNSIGNED NOT NULL,
	`seatID` INT UNSIGNED NOT NULL,
	`currentBid` INT UNSIGNED,
	`hand` VARCHAR(255) NULL,
	`currentHand` VARCHAR(255) NULL,
	`score` INT UNSIGNED NOT NULL DEFAULT 0,
	`active` TIMESTAMP,
	PRIMARY KEY (`userID`, `gameID`),
	FOREIGN KEY (`userID`) REFERENCES user(id),
	FOREIGN KEY (`gameID`) REFERENCES game(id)
) ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_general_ci;

CREATE TABLE `hand` (
	`gameID` INT UNSIGNED NOT NULL,
	`roundID` INT UNSIGNED NOT NULL,
	`handID` INT UNSIGNED NOT NULL,
	`seatID` INT UNSIGNED NOT NULL,
	`card` VARCHAR(10) NOT NULL,
	`trick` TINYINT(1) NOT NULL DEFAULT 0,
	`active` TIMESTAMP,
	PRIMARY KEY (`gameID`, `roundID`, `handID`, `seatID`),
	FOREIGN KEY (`gameID`) REFERENCES game(id)
) ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_general_ci;

 *
 *
 */

?>