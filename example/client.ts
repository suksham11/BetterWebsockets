import {
  encode,
  BufReader,
  TextProtoReader,
  green, red
} from "./deps.ts";
import { WebSocketClient, StandardWebSocketClient } from "../lib/websocket.ts";

const endpoint = Deno.args[0] || "ws://127.0.0.1:1234";

const ws: WebSocketClient = new StandardWebSocketClient(endpoint);
ws.on("open", function() {
  Deno.stdout.write(encode(green("ws connected! (type 'close' to quit)\n")));
  Deno.stdout.write(encode("> "));
});
ws.on("message", function (eventName: string, data: object) {
  if (eventName != "message") return;

  Deno.stdout.write(encode(`${(data as { message: string }).message}\n`));
  Deno.stdout.write(encode("> "));
});

/** simple websocket cli */
try {
  const cli = async (): Promise<void> => {
    const tpr = new TextProtoReader(new BufReader(Deno.stdin));
    while (true) {
      const line = await tpr.readLine();
      if (line === null || line === "close") {
        break;
      } else if (line === "ping") {
        await ws.ping();
      } else {
        await ws.send("message", { message: line });
      }
    }
  };
  await cli().catch(console.error);
  if (!ws.isClosed) {
    await ws.close(1000).catch(console.error);
  }
} catch (err) {
  Deno.stderr.write(encode(red(`Could not connect to WebSocket: '${err}'`)));
}
Deno.exit(0);
