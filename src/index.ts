import * as wasm from "@kareszklub/roblib-encoder-wasm"

export class Robot {
    private readonly ws: WebSocket;
    private id: number;

    private constructor(url: string) {
        this.ws = new WebSocket(url);
        this.id = 1;
    }

    public static connect(host = "roland") {
        const url = `ws://${host}:1111`
        const r = new Robot(url);
        return new Promise((res, rej) => {
            r.ws.addEventListener("open", () => {
                console.log(`Connected to ${url}`);
                res(r);
            });
            r.ws.addEventListener("close", () => {
                console.warn("Connection closed");
                rej("L");
            });
        })
    }

    private send(data: Uint8Array) {
        this.id++;
        this.ws.send(data);
    }
    private send_recv(data: Uint8Array): Promise<wasm.Response> {
        return new Promise((res, rej) => {
            let id = this.id;
            this.id++;
            this.ws.send(data);
            this.ws.addEventListener("message", msg => {
                let data = wasm.decode_resp(msg.data);
                if (data.id !== id) return;
                res(data);
            })
        })
    }

    disconnect() {
        this.ws.close();
    }

    async get_uptime() {
        let res = await this.send_recv(wasm.get_uptime(this.id));
        let ret = wasm.decode_uptime(res.get_data());
        res.free();
        return Number(ret);
    }

    drive(left: number, right: number) {
        this.send(wasm.drive(this.id, left, right));
    }
    stop() {
        this.send(wasm.stop_robot(this.id));
    }
    led(r: boolean, g: boolean, b: boolean) {
        this.send(wasm.led(this.id, r, g, b));
    }
    roland_servo(degree: number) {
        this.send(wasm.roland_servo(this.id, degree));
    }
    buzzer(pw: number) {
        this.send(wasm.buzzer(this.id, pw));
    }
    async track_sensor() {
        let res = await this.send_recv(wasm.track_sensor(this.id));
        let n = wasm.decode_track_sensor(res.get_data());
        res.free();
        let ret: boolean[] = Array(4);
        for (let i = 0; i < 4; i++) {
            const b = (n & 1 << i) > 0;
            console.log({ b });
            ret[i] = b;
        }
        return ret;
    }
    async ultra_sensor() {
        let res = await this.send_recv(wasm.ultra_sensor(this.id));
        let ret = wasm.decode_ultra_sensor(res.get_data());
        res.free();
        return ret;
    }

    async read_pin(pin: number) {
        let res = await this.send_recv(wasm.read_pin(this.id, pin));
        let ret = wasm.decode_read_pin(res.get_data());
        res.free();
        return ret;
    }
    write_pin(pin: number, value: boolean) {
        this.send(wasm.write_pin(this.id, pin, value));
    }
    pwm(pin: number, hz: number, cycle: number) {
        this.send(wasm.set_pwm(this.id, pin, hz, cycle));
    }
    servo(pin: number, degree: number) {
        this.send(wasm.servo_basic(this.id, pin, degree));
    }
    pin_mode(pin: number, mode: PinMode) {
        this.send(wasm.pin_mode(this.id, pin, mode));
    }
}

export type PinMode = "input" | "output";
