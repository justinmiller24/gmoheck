<!DOCTYPE html>
<html>
<head>
<title>Oh Heck!</title>
<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
</head>
<body>
<canvas id="nascar" height="200" width="200">Your browser lacks canvas support.</canvas>
<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.7/jquery.min.js"></script>
<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js"></script>
<script type="text/javascript" src="js/particle.js"></script>
<script type="text/javascript">
$(document).ready(function() {
	var particles = new ParticleCanvas($('#nascar')[0], {x:50});
	particles.start();
});
</script>
<!--script type="text/javascript" src="js/lobby.js"></script>
<script type="text/javascript" src="js/oheck.js"></script-->
</body>
</html>