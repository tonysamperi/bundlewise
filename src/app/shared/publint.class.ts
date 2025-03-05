import { publint } from "publint";
//
import { BundlewiseBase } from "./bundlewise-base.class";

export class Publint extends BundlewiseBase {

    constructor(packageArg: string | File) {
        super(packageArg);
    }

    async run() {
        if (typeof this._packageArg === "string") {
            await this._download();

            return publint({
                pack: { tarball: this._tgzData! }
            })
        } else {
            return publint({
                pack: { tarball: await this._packageArg.arrayBuffer() }
            })
        }

    }
}
