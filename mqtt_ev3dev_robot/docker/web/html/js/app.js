// Create a client instance
var client = new Paho.MQTT.Client(location.hostname, Number(9001), "clientId");
var first_position = true;

var max_x = 0;
var max_y = 0;

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({onSuccess:onConnect});


// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription.
  console.log("onConnect");
  client.subscribe("robot/#");
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:"+responseObject.errorMessage);
  }
}


function drawRobot(x, y, r, max_x, max_y) {
    var c = $("#robot_layer");
    var ctx = c[0].getContext('2d');

    ctx.canvas.height = max_y;
    ctx.canvas.width = max_x;

    ctx.clearRect(0, 0, max_x, max_y);

    ctx.beginPath();

    ctx.arc(x, y, r, 2 * Math.PI, false);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.stroke();



}


// called when a message arrives
function onMessageArrived(message) {

    var c = $("#map_layer");
    var ctx = c[0].getContext('2d');




    var body = JSON.parse(message.payloadString)
    if (message.destinationName === 'robot/position') {
        if(first_position) {

        function getMousePos(canvas, evt) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
               };
         }

        ctx.canvas.addEventListener('mousemove', function(evt) {
            var mousePos = getMousePos(ctx.canvas, evt);
             $("#mouse").empty()
                .append("<li>x: " + mousePos.x + "</li>")
                .append("<li>y: " + mousePos.y + "</li>");
        }, false);

            ctx.canvas.height = body.world.y_max;
            ctx.canvas.width = body.world.x_max;

            max_x = body.world.x_max;
            max_y = body.world.y_max;

            $("#world").empty()
                .append("<li>x max: " + body.world.x_max + "</li>")
                .append("<li>y max: " + body.world.y_max + "</li>")
                .append("<li>x min: 0 </li>")
                .append("<li>y min: 0 </li>");

            first_position = false;

        } else {
            var points = body.points;

            $.each(body.points, function(index, point) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, point.r, 0, 2 * Math.PI, false);

                if (point.collected) {
                    ctx.fillStyle = 'green';
                    ctx.fill();
                }

                ctx.stroke();
            });

            var robot = body.robot
            drawRobot(robot.x, robot.y, 7.5, max_x, max_y)

        }
    }

    if (message.destinationName === 'robot/state') {

         $("#state").empty()
            .append("<li>angle: " + body.angle + "</li>")
            .append("<li>left motor: " + body.left_motor + "</li>")
            .append("<li>right motor: " + body.right_motor + "</li>");
    }


}
