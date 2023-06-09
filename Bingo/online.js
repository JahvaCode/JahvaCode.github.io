
var peer = null;

//TODO: host migration :)

function initConnection() {
    if (peer !== null)
        peer.destroy();
    
    peer = new Peer();

    peer.on('open', function(id) {
        var conn = peer.connect("jahvabingo-" + SEED);
        $("#connection").html("Opened");

        conn.on('open', function() {
            $("#connection").html("Connected");
        });

        conn.on('data', function(data) {
            onClientReceive(JSON.parse(data));
        });

        conn.on('error', function(err) {
            console.log(err);
        });
    });

    peer.on('error', function(err) {
        if (err.type === 'peer-unavailable') {
            peer.destroy();
            initHost();
        }
    });
}

function initHost() {
    peer = new Peer("jahvabingo-" + SEED);

    peer.on('open', function(id) {
        console.log("Hosting on: " + id);
        $("#connection").html("Opened");
    });

    peer.on('connection', function(c) {
        console.log("connected: " + c.peer);
        $("#connection").html("Connected");

        c.on('data', function(data) {
			onHostReceive(c, data);
		});

        c.on('open', function() {
            for (var i = 1; i <= 25; ++i)
            {
                console.log("sending board to new connection");
                c.send(JSON.stringify({"id": "slot" + i, "colour": $("#slot" + i).attr("class")}));
            }
        });
    });
}

function initConnectionOld() {
    host = true;
    conns.forEach(item => item.close());
    conns = [];

    if (peer !== null)
        peer.destroy();

    peer = new Peer("jahvabingo-" + SEED, {debug: 2});

    peer.on('error', function(err) {
        console.log(err);
        if (err.type === 'peer-unavailable')
        {
            console.log("no-id!!");
            peer.destroy();
            peer = new Peer(null, {reliable: true});
            peer.on('open', function(id) {
                $("#connection").html("Opened");
                console.log("ID2: " + id);
                var c = peer.connect("jahvabingo-" + SEED, {reliable: true, debug: 2});
            
                c.on('open', function() {
                    console.log("connected: " + c.peer);
                    $("#connection").html("Connected");
                });
                
                c.on('data', function(data) {
                    onClientReceive(JSON.parse(data));
                });
            });
            host = false;
        }
    });

    peer.on('open', function(id) {
		console.log("ID: " + id);
        $("#connection").html("Opened");
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

        c.on('open', function() {
            for (var i = 1; i <= 25; ++i)
            {
                console.log("sending board to new connection");
                c.send(JSON.stringify({"id": "slot" + i, "colour": $("#slot" + i).attr("class")}));
            }
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

    for (x in peer.connections)
        if (x !== conn)
            peer.connections[x][0].send(data);
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

    if (peer !== null)
        peer.destroy();
    peer = null;
    tmp = false;

    $("#connection").html("Open Connection");
}