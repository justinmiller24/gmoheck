<?php

session_start();

require_once("api/db.php");
$db = new DB();

# LOGIN
if (isset($_REQUEST["user"], $_REQUEST["pass"])) {
	
	$sql = "SELECT id, name FROM user WHERE username = ? AND password = ? LIMIT 1";
	$db->query($sql, "ss", $_REQUEST["user"], $_REQUEST["pass"]);
	if ($db->numRows() == 1) {
		$rows = $db->fetchAll();
		$db->freeResult();
		
		# Set user as logged in
		$_SESSION["loggedIn"] = true;
		$_SESSION["userID"] = $rows[0]["id"];
		$_SESSION["name"] = $rows[0]["name"];
		
		# Set user as active
		$db->query("UPDATE `user` SET lastLogin = NOW(), active = NOW() WHERE id = ?", "i", $_SESSION["userID"]);
		
		header("Location: /");
		exit();
	}
	$error = true;
}


# LOGOUT USER
if (isset($_REQUEST["logout"])) {
	
	# Set user as inactive
	$db->query("UPDATE `user` SET active = NULL WHERE id = ?", "i", $_SESSION["userID"]);
	
	# Destroy session
	$_SESSION = array();
	session_destroy();
	
	header("Location: /");
	exit();
}
$db->disconnect();
?>
<!DOCTYPE html>
<html>
<head>
<title>Oh Heck!</title>
<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
<link rel="stylesheet" href="css/style.css" />
<style type="text/css">
td input {border:1px solid #000; padding:8px; margin:5px; box-shadow:0 1px 2px rgba(0, 0, 0, 0.3); -webkit-border-radius:6px; -moz-border-radius:6px; -khtml-border-radius:6px; -o-border-radius:6px; border-radius:6px; }

.button {
	border:1px solid #000; cursor:pointer; padding:6px 8px; text-decoration:none; font-weight:bold;
	-webkit-border-radius:5px; -moz-border-radius:5px; -khtml-border-radius:5px; -o-border-radius:5px; border-radius:5px; 
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	background: -moz-linear-gradient(top,  #e7e295 0%, #EDBC19 100%);
	background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#e7e295), color-stop(100%,#EDBC19));
	background: -webkit-linear-gradient(top,  #e7e295 0%,#EDBC19 100%);
	background: -o-linear-gradient(top,  #e7e295 0%,#EDBC19 100%);
	background: -ms-linear-gradient(top,  #e7e295 0%,#EDBC19 100%);
	background: linear-gradient(top,  #e7e295 0%,#EDBC19 100%);
}
.button:hover {
	background: -moz-linear-gradient(top,  #e7e295 0%, #EDBC19 100%);
	background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#e7e295), color-stop(100%,#EDBC19));
	background: -webkit-linear-gradient(top,  #e7e295 0%,#EDBC19 100%);
	background: -o-linear-gradient(top,  #e7e295 0%,#EDBC19 100%);
	background: -ms-linear-gradient(top,  #e7e295 0%,#EDBC19 100%);
	background: linear-gradient(top,  #e7e295 0%,#EDBC19 100%);
}

</style>
</head>
<body onLoad="document.login.username.focus();">
<div id="wrapper">
	<div id="banner">
		<h1>OH HECK!</h1>
	</div>
	<div id="nav">
		<div id="status" class="lobby">Let's take down the sultan!</div>
	</div>
	<div id="utility">
		<div id="left">
			<div id="pagecontent">
				<div id="login-page" class="inner-page" style="display:block;">
					<?php if (isset($error)) { echo '<p>Invalid username or password</p>'; } ?>
					<form name="login" action="<?php echo $_SERVER["REQUEST_URI"]; ?>" method="post">
					<table class="form">
					<tr>
					<td class="label">Username</td>
					<td class="input"><input id="username" name="user" type="text" value="" /></td>
					</tr>
					<tr>
					<td class="label">Password</td>
					<td class="input"><input name="pass" type="password" value="" /></td>
					</tr>
					<tr><td></td><td><input type="submit" class="button" name="login" value="Login" /></td></tr>
					</table>
					</form>
				</div>
			</div>
		</div>
		<div class="c"></div>
	</div>
</div>
</body>
</html>