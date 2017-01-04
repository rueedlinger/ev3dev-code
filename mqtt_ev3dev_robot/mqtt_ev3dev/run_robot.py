#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import logging
import json
import getopt
import time
import paho.mqtt.client as mqtt

from command import CommandDispatcher
from robot import Robot

logging.basicConfig(format="%(levelname)s:%(message)s", level=logging.INFO)

###
# constants
###
TIMEOUT_SEC = 2
KEEPALIVE_SEC = 60

###
# default settings
###

# default topic
topic = "robot"

# default mqtt broker (hostname or ip) and port
server = "127.0.0.1"
port = 1883

if __name__ == "__main__":

    # default robot
    robot = Robot()

    # parse args
    optlist, args = getopt.getopt(sys.argv[1:], shortopts="", longopts=["broker=", "port=", "topic=", "mode="])

    for opt, arg in optlist:
        if opt == '--broker':
            server = arg
        elif opt == '--port':
            port = arg
        elif opt == '--topic':
            topic = arg

    dispatcher = CommandDispatcher(robot)

    logging.info("Try to connect to " + str(server) + ":" + str(port) + " and topic " + str(topic))

    mqtt = mqtt.Client()
    mqtt.connect(server, port, KEEPALIVE_SEC)

    # The callback for when the client receives a CONNACK response from the server.
    def on_connect(client, userdata, flags, rc):
        logging.info("Connected with return code " + str(rc))

        # Subscribing in on_connect() means that if we lose the connection and
        # reconnect then subscriptions will be renewed.
        client.subscribe(topic + "/process")


    # The callback for when a PUBLISH message is received from the server.
    def on_message(client, userdata, msg):
        logging.info("Received message '" + str(msg.payload) + " on topic " + msg.topic + " with QoS " + str(msg.qos))

        try:
            obj = json.loads(msg.payload.decode('utf-8'))
            dispatcher.exec(obj)
            client.publish(topic + "/done", json.dumps(obj))
        except Exception as ex:
            logging.exception("Invalid message format! %s" % msg.payload)
            client.publish(topic + "/error", json.dumps({'type': type(ex).__name__, 'error': str(ex)}))


    def on_disconnect(client, userdata, rc):
        logging.info("Disconnected with return code " + str(rc))


    mqtt.on_connect = on_connect
    mqtt.on_message = on_message
    mqtt.on_disconnect = on_disconnect

    while True:
        time.sleep(TIMEOUT_SEC)

        mqtt.publish(topic + "/state", json.dumps(robot.state()))


