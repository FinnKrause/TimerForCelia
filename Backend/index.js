// import { WSRes, OnlineClient, OfflineClient } from "./Interfaces";
import DeviceDetector from "device-detector-js";
import fetch from "node-fetch";
import { WebSocketServer } from "ws";

const deviceDetector = new DeviceDetector();
var wss = new WebSocketServer({ port: 6971 });

let currentClients = new Map(); //OnlineClient
let clientHistory; //OfflineClient[]

wss.broadcast = function (d) {
  wss.clients.forEach((client) => {
    const datathatcameback = reply("onlineClients", d, false, null);
    client.send(datathatcameback);
  });
};

wss.on("connection", (ws, req) => {
  const clientId = req.headers["sec-websocket-key"];
  const userAgent = req.headers["user-agent"];
  const startTime = new Date().getTime();

  let country;
  fetch(`http://ip-api.com/json/${ws._socket.remoteAddress}`)
    .then((res) => res.json())
    .then((data) => {
      if (!data) return;
      country = data["country"] === "France" ? "France" : "Germany";

      logMessage(
        `Client "${userAgendString(
          deviceDetector.parse(userAgent)
        )}" from "${country}" connected.`
      );

      currentClients.set(clientId, {
        connectedSince: startTime,
        country: country,
        name: userAgendString(deviceDetector.parse(userAgent)),
      });
      ws.send(reply("other", null, false, "You Are Connected"));
      wss.broadcast(Array.from(currentClients.values()));
    });

  ws.on("close", () => {
    const duration = new Date().getTime() - startTime;
    currentClients.delete(clientId);
    wss.broadcast(Array.from(currentClients.values()));

    logMessage(
      `Client "${userAgendString(
        deviceDetector.parse(userAgent)
      )}" from "${country}" disconnected. Duration: ${duration / 1000}s`
    );
  });
});

function userAgendString(userAgend) {
  return `${userAgend.os.name}, ${userAgend.device.type}`;
}

function logMessage(message) {
  var today = new Date();
  var date =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  console.log(`[${date}] ${message}`);
}

function reply(
  typeshit, //WSRes
  d,
  error,
  message
) {
  const res = JSON.stringify({
    type: typeshit,
    data: d,
    error,
    message,
  });
  // console.log(`Message response: ${res}`);
  return res;
}
