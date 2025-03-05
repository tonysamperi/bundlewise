import JSZip from "jszip";
import pako from "pako";
import { untar } from "@andrewbranch/untar.js";

export class Bundlewise {
  private _packageArg: string | File;
  private _zip: JSZip | null = null;

  constructor(packageArg: string | File) {
    if (!packageArg) {
      throw new Error("❌ Devi specificare un pacchetto npm o un file .tgz");
    }

    this._packageArg = packageArg;
  }

  async run(): Promise<{ rawSize: number; gzippedSize: number; fileName: string }> {
    this._zip = new JSZip();

    if (typeof this._packageArg === "string") {
      await this._downloadAndExtract();
    } else {
      await this._extractLocalFile();
    }

    const mainFile = await this._getMainFile();
    return this._analyzeSize(mainFile);
  }

  private async _downloadAndExtract() {
    console.log(`📦 Scaricamento di ${this._packageArg} da npm...`);
    const packageInfo = await fetch(`https://registry.npmjs.org/${this._packageArg}`)
      .then(res => res.json());

    if (!packageInfo.dist || !packageInfo.dist.tarball) {
      throw new Error("❌ Errore nel recupero del pacchetto!");
    }

    const tgzUrl = packageInfo.dist.tarball;
    const response = await fetch(tgzUrl);
    const tgzData = await response.arrayBuffer();

    await this._extractTgz(tgzData);
  }

  private async _extractLocalFile() {
    const file = this._packageArg as File;
    console.log(`📦 Analisi del file locale: ${file.name}`);
    const tgzData = await file.arrayBuffer();

    await this._extractTgz(tgzData);
  }

  private async _extractTgz(data: ArrayBuffer) {
    console.log("📂 Decomprimendo il .tgz...");
    
    // Decomprimi il gzip (.tgz -> .tar)
    const tarData = pako.ungzip(new Uint8Array(data));

    console.log("📂 Estraendo il tar...");
    const files = untar(tarData);

    for await (const file of files) {
      console.log(`📄 Trovato file: ${file.name}`);
      this._zip!.file(file.name, file.fileData);
    }
  }

  private async _getMainFile(): Promise<{ name: string; content: Uint8Array }> {
    const pkgJsonFile = this._zip!.file("package/package.json");
    if (!pkgJsonFile) throw new Error("❌ Impossibile trovare package.json!");

    const pkgJsonContent = await pkgJsonFile.async("string");
    const pkgJson = JSON.parse(pkgJsonContent);
    const mainFile = pkgJson.module || pkgJson.main || "index.js";

    const mainFilePath = `package/${mainFile}`;
    const mainFileEntry = this._zip!.file(mainFilePath);
    if (!mainFileEntry) throw new Error(`❌ Impossibile trovare il file principale: ${mainFile}`);

    return { name: mainFile, content: await mainFileEntry.async("uint8array") };
  }

  private _analyzeSize(file: { name: string; content: Uint8Array }) {
    const rawSize = file.content.length;
    const gzippedSize = pako.gzip(file.content).length;

    console.log(`📊 Analisi: ${file.name}`);
    console.log(`✅ Dimensione: ${(rawSize / 1024).toFixed(2)} KB (raw)`);
    console.log(`✅ Dimensione Gzipped: ${(gzippedSize / 1024).toFixed(2)} KB`);

    return { rawSize, gzippedSize, fileName: file.name };
  }
}
