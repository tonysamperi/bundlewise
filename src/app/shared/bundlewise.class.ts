import pako from "pako";
//
import { BundlewiseBase } from "./bundlewise-base.class";

export class Bundlewise extends BundlewiseBase {
  constructor(packageArg: string | File) {
    super(packageArg);
  }

  async run() {
    if (typeof this._packageArg === "string") {
      await this._download();
      await this._extractTgz(this._tgzData!);
    } else {
      await this._extractLocalFile();
    }
    
    const mainFile = await this._getMainFile();
    return this._analyzeSize(mainFile);
  }
  
  private _analyzeSize(file: { name: string; content: Uint8Array }) {
    const rawSize = Math.round(file.content.length * 100 / 1024) / 100;
    const gzippedSize = Math.round(pako.gzip(file.content).length * 100 / 1024) / 100;
    
    console.log(`📊 Analisys: ${file.name}`);
    console.log(`✅ Size: ${rawSize.toFixed(2)} KB (raw)`);
    console.log(`✅ Gzipped: ${gzippedSize.toFixed(2)} KB`);
    
    return {
      rawSize,
      gzippedSize,
      fileName: file.name,
      pkgJson: this._pkgJson,
    };
  }
}
