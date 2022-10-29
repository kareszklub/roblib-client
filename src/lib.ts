import * as wasm from "@kareszklub/roblib-encoder-wasm";
export const wasmEncoder = wasm;

// @ts-ignore
let ws: Promise<typeof window.WebSocket>;
if ("window" in globalThis) {
    // we're in a browser
    ws = Promise.resolve(window.WebSocket);
} else {
    // not in a browser: node
    ws = import("ws").then(ws => ws.WebSocket) as typeof ws;
}
if (!ws) throw new Error("failed to find websocket client");

export class Robot {
    private readonly ws: WebSocket;
    public useWasm: boolean;

    private constructor(
        ws: typeof window.WebSocket,
        addr: string,
        useWasm = false
    ) {
        this.ws = new ws(addr);
        this.useWasm = useWasm;
    }

    static async connect(addr: string, useWasm = false): Promise<Robot> {
        const r = new Robot(await ws, addr, useWasm);
        return new Promise((res, rej) => {
            r.ws.addEventListener("open", () => res(r), { once: true });
            r.ws.addEventListener("error", rej, { once: true });
        });
    }

    private send(cmd: string | Uint8Array) {
        return new Promise<void>((res, _) => {
            this.ws.send(cmd);
            this.ws.addEventListener(
                "message",
                msg => res(void console.log(msg.data)),
                { once: true }
            );
        });
    }
    private send_receive(cmd: string | Uint8Array): Promise<string> {
        return new Promise<string>((res, _) => {
            this.ws.send(cmd);
            this.ws.addEventListener("message", msg => res(msg.data), {
                once: true,
            });
        });
    }

    disconnect = () => this.ws.close();

    // generic
    setPin = (pin: number, value: boolean) =>
        this.useWasm
            ? this.send(wasm.set_pin(pin, value))
            : this.send(`p ${pin} ${Number(value)}`);
    setPwm = (pin: number, hz: number, cycle: number) =>
        this.useWasm
            ? this.send(wasm.set_pwm(pin, hz, cycle))
            : this.send(`w ${pin} ${hz} ${cycle}`);
    servoBasic = (pin: number, angle: number) =>
        this.useWasm
            ? this.send(wasm.servo_basic(pin, angle))
            : this.send(`V ${pin} ${angle}`);

    // roland specific
    move = (left: number, right: number) =>
        this.useWasm
            ? this.send(wasm.move_robot(left, right))
            : this.send(`m ${left} ${right}`);
    moveByAngle = (angle: number, speed: number) =>
        this.useWasm
            ? this.send(wasm.move_robot_by_angle(angle, speed))
            : this.send(`M ${angle} ${speed}`);
    moveByAngleWithLeds = (
        angle: number,
        speed: number,
        { r, g, b }: { r: boolean; g: boolean; b: boolean }
    ) =>
        this.useWasm
            ? this.send(
                  wasm.move_robot_by_angle_with_leds(angle, speed, r, g, b)
              )
            : this.send(
                  `M ${angle} ${speed} ${Number(r)} ${Number(g)} ${Number(b)}`
              );
    stop = () => (this.useWasm ? this.send(wasm.stop_robot()) : this.send("s"));
    led = ({ r, g, b }: { r: boolean; g: boolean; b: boolean }) =>
        this.useWasm
            ? this.send(wasm.led(r, g, b))
            : this.send(`l ${Number(r)} ${Number(g)} ${Number(b)}`);
    servo = (angle: number) =>
        this.useWasm
            ? this.send(wasm.servo_absolute(angle))
            : this.send(`v ${angle}`);
    buzzer = (freq: number) =>
        this.useWasm ? this.send(wasm.buzzer(freq)) : this.send(`b ${freq}`);
    getSensorData = async () =>
        (await this.send_receive(this.useWasm ? wasm.track_sensor() : "t"))
            .split(",")
            .map(Number);
}

export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
