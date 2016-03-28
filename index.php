<?php

session_start();

# FORCE LOGIN
if (!$_SESSION["loggedIn"]) {
	header("Location: login.php");
	exit();
}

# Setup DB
require_once("api/db.php");
$db = new DB();

# Users
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

$db->disconnect();
?>
<!DOCTYPE html>
<html>
<head>
<title>Oh Heck!</title>
<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<link rel="stylesheet" href="css/style.css" />
<link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/jqueryui/1/themes/smoothness/jquery-ui.css" />
</head>
<body>
<div id="wrapper">
	<div id="banner"><h1>OH HECK!</h1></div>
	<div id="nav">
		<div id="status" class="lobby">Welcome, <?php echo $_SESSION["name"]; ?></div>
		<ul id="quickStats">
			<li id="round">Round: <span></span></li>
			<li id="bids">Current Bid: <span></span></li>
			<li id="trump">Trump: <span></span></li>
		</ul>
		<ul id="menu">
			<!--li><a href="rules.php" target="_blank">Rules</a></li-->
			<li id="delete"><a href="#" onClick="deleteGameConfirm();">Delete Game</a></li>
			<!--li id="leave"><a href="#">Leave Game</a></li-->
			<li><a href="login.php?logout=1">Logout</a></li>
		</ul>
	</div>
	<div id="utility">
		<div id="left">
			<div id="lobby-page" class="inner-page" style="display:block;">
				<h2>Active Games</h2>
				<div id="activeGames"><div class="loading">Loading...</div></div>
				<button id="create-game">Create New Game</button>
			</div>
			
			<div id="board" class="inner-page">
				<div id="playersBlock"></div>
				<div id="playersBidBlock"></div>
				<div id="messageBox"><p>Loading...</p></div>
				<button id="deal">Deal Next Hand</button>
				<div id="bid"><h4>What is your bid?</h4></div>
				<!--canvas id="nascar" height="200" width="200">Your browser lacks canvas support.</canvas-->
			</div>
		</div>
		<div id="right">
			<div class="lobby block">
				<h2>Players Online</h2>
				<div id="playersOnline"><div class="loading">Loading...</div></div>
			</div>
			<div class="play block">
				<h2>Scoreboard</h2>
				<div id="scoreboard"><div class="loading">Loading...</div></div>
			</div>
		</div>
		<div class="c"></div>
	</div>
	<div id="footer" class="c"></div>
</div>

<!-- Dialogs -->
<div id="create-game-form-dialog" class="dialog" title="New Game">
	<form id="create-game-form">
	<table>
	<tr>
	<td style="width:70px;">
	<label for="players">Players</label>
	</td>
	<td>
	<select id="players" name="players">
	<option value="2">2</option>
	<option value="3">3</option>
	<option value="4" selected>4</option>
	<option value="5">5</option>
	<option value="6">6</option>
	</select>
	</td>
	</tr>
	<tr>
	<td>
	<label for="rounds">Rounds</label>
	</td>
	<td>
	<select id="rounds" name="rounds">
	<option value="1">1</option>
	<option value="2">2</option>
	<option value="3">3</option>
	<option value="4">4</option>
	<option value="5">5</option>
	<option value="6">6</option>
	<option value="7">7</option>
	<option value="8">8</option>
	<option value="9">9</option>
	<option value="10" selected>10</option>
	<option value="11">11</option>
	<option value="12">12</option>
	</select>
	</td>
	</tr>
	<tr>
	<td>
	<label for="decks">Decks</label>
	</td>
	<td>
	<select id="decks" name="decks">
	<option value="1" selected>1</option>
	<option value="2">2</option>
	<option value="3">3</option>
	<option value="4">4</option>
	</select>
	</td>
	</tr>
	<!--tr>
	<td>
	<label for="scoring">Scoring</label>
	</td>
	<td>
	<select id="scoring" name="scoring">
	<option value="High" selected>High</option>
	<option value="Mid">Mid</option>
	<option value="Low">Low</option>
	</select>
	</td>
	</tr-->
	<tr>
	<td>
	<label for="trump">Trump</label>
	</td>
	<td>
	<input type="checkbox" id="trump" name="trump" value="1" checked />
	</td>
	</tr>
	<!--tr>
	<td>
	<label for="instant">Instant Bidding</label>
	</td>
	<td>
	<input type="checkbox" id="instant" name="instant" value="1" class="ui-widget-content ui-corner-all" />
	</td>
	</tr>
	<tr>
	<td>
	<label for="nascar">Nascar</label>
	</td>
	<td>
	<input type="checkbox" id="nascar" name="nascar" value="1" class="ui-widget-content ui-corner-all" checked />
	</td>
	</tr-->
	</table>
	<!--p><b>Scoring:</b> For correct bid, scoring is 10 points + 1 for each trick bid. For incorrect bid,</p>
	<ul>
	<li><b>High</b> +1 for each trick taken</li>
	<li><b>Mid</b> 0 for missed bid</li>
	<li><b>Low</b> -1 for each trick bid</li>
	</ul-->
	<br />
	<p><b>Scoring:</b></p>
	<p>For correct bid, 10 points, +1 for each trick</p>
	<p>For incorrect bid, +1 for each trick</p>
	<input type="hidden" name="scoring" value="High" />
	<input type="hidden" name="instant" value="0" />
	<input type="hidden" name="nascar" value="1" />
	</form>
</div>
<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.7/jquery.min.js"></script>
<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js"></script>
<script type="text/javascript" src="js/particle.js"></script>
<script type="text/javascript">
var userID = <?php echo $_SESSION["userID"]; ?>;
var users = <?php echo json_encode($users); ?>;
var user = users[userID];
var games = {};
</script>
<script type="text/javascript" src="js/lobby.js"></script>
<script type="text/javascript" src="js/oheck.js"></script>
</body>
</html>