// @ts-ignore
let WebSocket: typeof window.WebSocket;
if ("window" in globalThis) {
    // we're in a browser
    WebSocket = window.WebSocket;
} else {
    // not in a browser: node
    WebSocket = require("ws");
}
if (!WebSocket) throw new Error("failed to find websocket client")

class Robot {
    private ws: WebSocket;

    private constructor(addr: string) {
        this.ws = new WebSocket(addr);
    }

    static connect(addr: string): Promise<Robot> {
        const r = new Robot(addr);
        return new Promise((res, rej) => {
            r.ws.addEventListener("open", () => res(r), { once: true });
            r.ws.addEventListener("error", rej, { once: true });
        });
    }

    private send(cmd: string) {
        return new Promise<void>((res, _) => {
            this.ws.send(cmd);
            this.ws.addEventListener(
                "message",
                msg => res(void console.log(msg.data)),
                { once: true }
            );
        });
    }
    private send_receive(cmd: string): Promise<string> {
        return new Promise<string>((res, _) => {
            this.ws.send(cmd);
            this.ws.addEventListener("message", msg => res(msg.data), {
                once: true,
            });
        });
    }

    disconnect = () => this.ws.close();

    move = (left: number, right: number) => this.send(`m ${left} ${right}`);
    stop = () => this.send("s");
    led = ({ r, g, b }: { r: boolean; g: boolean; b: boolean }) =>
        this.send(`l ${Number(r)} ${Number(g)} ${Number(b)}`);
    servo = (angle: number) => this.send(`v ${angle}`);
    buzzer = (freq: number) => this.send(`b ${freq}`);
    getSensorData = async () =>
        (await this.send_receive("t")).split(",").map(Number);
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

module.exports = { Robot, sleep }
