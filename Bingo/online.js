
var peer = null;
var conns = [];
var host = true;
var tmp = false;

//TODO: host migration :)

function initConnection() {
    host = true;
    conns.forEach(item => item.close());
    conns = [];

    if (peer !== null)
        peer.destroy();

    peer = new Peer("jahvabingo-" + SEED, {debug: 2});

    peer.on('error', function(err) {
        if (err.type === 'unavailable-id')
        {
            peer = new Peer(null, {reliable: true});
            peer.on('open', function(id) {
                $("#connection").html("Opened");
                console.log("ID: " + id);
                var c = peer.connect("jahvabingo-" + SEED, {reliable: true, debug: 2});
            
                c.on('open', function() {
                    console.log("connected: " + c.peer);
                    $("#connection").html("Connected");
                });
                
                c.on('data', function(data) {
                    onClientReceive(JSON.parse(data));
                });
                
                c.on('close', function() {
                    conns = conns.filter(item => item !== c);
                });
                conns.push(c);
            });
            host = false;
        }
    });

    peer.on('open', function(id) {
		console.log("ID: " + id);
        $("#connection").html("Opened");
        // Not sure why it doesn't work but this fixes it. Makes no sense but oh well :)
        if (tmp == false)
        {
            tmp = true;
            initConnection();
        }
	});

    peer.on('connection', function(c) {
		console.log("connected: " + c.peer);
        $("#connection").html("Connected");
        c.on('data', function(data) {
			onHostReceive(c, data);
		});
		
		c.on('close', function() {
			conns = conns.filter(item => item !== c);
		});
		conns.push(c);
    });
}

function onClientReceive(data) {
    var square = $("#" + data.id);
	square.removeClass(ALL_COLOURS);
	square.addClass(data.colour);
}

function onHostReceive(conn, data) {
    // ignore conn
    if (conn !== null)
        onClientReceive(JSON.parse(data));

    conns.filter(item => item !== conn).forEach(item => item.send(data));
} 

function updateConnectionSquare(square, colourClass) {
    if (peer != null)
    {
        var data = {"id": square.attr('id'), "colour": colourClass};

        if (host)
            onHostReceive(null, JSON.stringify(data));
        else
            conns[0].send(JSON.stringify(data));
    }
}

function resetConnection() {
    host = true;
    conns.forEach(item => item.close());
    conns = [];

    if (peer !== null)
        peer.destroy();
    peer = null;
    tmp = false;

    $("#connection").html("Open Connection");
}