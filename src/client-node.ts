import WebSocket from "ws";

export class Robot {
    private ws: WebSocket;

    private constructor(addr: string, options?: WebSocket.ClientOptions) {
        this.ws = new WebSocket(addr, options);
    }

    static async connect(
        addr: string,
        options?: WebSocket.ClientOptions
    ): Promise<Robot> {
        const r = new Robot(addr, options);
        return new Promise((res, rej) => {
            r.ws.on("open", () => res(r));
            r.ws.on("error", err => rej(err));
        });
    }

    private send(cmd: string) {
        return new Promise<void>((res, rej) => {
            this.ws.send(cmd);
            this.ws.once("message", msg => {
                if (msg.toString() === "OK") return void res();
                rej(new Error(msg.toString()));
            });
        });
    }
    private send_receive(cmd: string): Promise<string> {
        return new Promise<string>((res, _) => {
            this.ws.send(cmd);
            this.ws.once("message", msg => res(msg.toString()));
        });
    }

    move = (left: number, right: number) => this.send(`m ${left} ${right}`);
    stop = () => this.send("s");
    led = ({ r, g, b }: { r: boolean; g: boolean; b: boolean }) =>
        this.send(`l ${Number(r)} ${Number(g)} ${Number(b)}`);
    servo = (angle: number) => this.send(`v ${angle}`);
    buzzer = (freq: number) => this.send(`b ${freq}`);
    getSensorData = async () => (await this.send_receive("t")).split(",");
}
export default Robot;
