// @ts-ignore
let ws: Promise<typeof window.WebSocket>;
if ("window" in globalThis) {
    // we're in a browser
    ws = Promise.resolve(window.WebSocket);
} else {
    // not in a browser: node
    ws = import("ws") as unknown as typeof ws;
}
if (!ws) throw new Error("failed to find websocket client")

export class Robot {
    private ws: WebSocket;

    private constructor(ws:typeof window.WebSocket, addr: string) {
        this.ws = new ws(addr);
    }

    static async connect(addr: string): Promise<Robot> {
        const r = new Robot(await ws, addr);
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

export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
