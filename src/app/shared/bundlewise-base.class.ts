import JSZip from "jszip";
import pako from "pako";
import { untar } from "@andrewbranch/untar.js";

export abstract class BundlewiseBase {
  protected _packageArg: string | File;
  protected _pkgJson: any;
  protected _tgzData?: ArrayBuffer;
  protected _zip: JSZip | null = null;

  constructor(packageArg: string | File) {
    if (!packageArg) {
      throw new Error("❌ Devi specificare un pacchetto npm o un file .tgz");
    }
    this._packageArg = packageArg;
  }

  /**
   * Gets the package tgz as an ArrayBuffer and stores it in this._tgzData
   */
  protected async _download() {
    console.log(`📦 Scaricamento di ${this._packageArg} da npm...`);
    const [pkgName, pkgVersion = "latest"] = (this._packageArg as string).split("@");
    const packageInfo = await fetch(`https://registry.npmjs.org/${pkgName}`).then(res => res.json());

    const tgzUrl = packageInfo.versions[packageInfo['dist-tags'][pkgVersion]].dist.tarball;
    const response = await fetch(tgzUrl);
    this._tgzData = await response.arrayBuffer();
  }

  protected async _extractLocalFile() {
    const file = this._packageArg as File;
    console.log(`📦 Analisi del file locale: ${file.name}`);
    const tgzData = await file.arrayBuffer();

    await this._extractTgz(tgzData);
  }

  protected async _extractTgz(data: ArrayBuffer) {
    console.log("📂 Decomprimendo il .tgz...");
    const tarData = pako.ungzip(new Uint8Array(data));
    console.log("📂 Estraendo il tar...");
    const files = untar(tarData);

    this._zip = new JSZip();
    for await (const file of files) {
      this._zip.file(file.name, file.fileData);
    }
  }

  protected async _getMainFile() {
    const pkgJsonFile = this._zip!.file("package/package.json");
    if (!pkgJsonFile) throw new Error("❌ Cannot find package.json!");

    const pkgJsonContent = await pkgJsonFile.async("string");
    this._pkgJson = JSON.parse(pkgJsonContent);
    const mainFile = this._pkgJson.module || this._pkgJson.main || "index.js";

    const mainFilePath = new URL(mainFile, "https://dummy.com/package/").pathname.slice(1);
    const mainFileEntry = this._zip!.file(mainFilePath);
    if (!mainFileEntry) {
      throw new Error(`❌ Cannot find main file: ${mainFile}!`);
    }

    return { name: mainFile, content: await mainFileEntry.async("uint8array") };
  }
}
