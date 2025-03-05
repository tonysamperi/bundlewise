#!/usr/bin/env node

import fs from "fs";
import {join, dirname} from "path";
import {execSync} from "child_process";
import {gzipSizeSync} from "gzip-size";
import {fileURLToPath} from "url";

class BundlewiseNode {
    constructor(packageArg) {
        if (!packageArg) {
            console.error("❌ You must specify a package or a .tgz file");
            process.exit(1);
        }

        this.packageArg = packageArg;
        this.tempDir = join(dirname(fileURLToPath(import.meta.url)), "temp-package");
        this.run();
    }

    cleanTempDir(create) {
        if (fs.existsSync(this.tempDir)) {
            fs.rmSync(this.tempDir, {recursive: true});
        }
        create && fs.mkdirSync(this.tempDir);
    }

    preparePackage() {
        this.cleanTempDir(!0);
        if (this.packageArg.endsWith(".tgz")) {
            console.log(`📦 Analyzing local package: ${this.packageArg}`);
            execSync(`tar -xvzf ${this.packageArg} -C ${this.tempDir}`);
        }
        else {
            console.log(`📦 Downloading and analyzing ${this.packageArg} from npm...`);
            execSync(`npm pack ${this.packageArg} --pack-destination ${this.tempDir}`);
            const tgzFile = fs.readdirSync(this.tempDir)
                .find(file => file.endsWith(".tgz"));
            if (!tgzFile) {
                throw new Error("❌ Error downloading the package!");
            }
            execSync(`tar -xvzf ${join(this.tempDir, tgzFile)} -C ${this.tempDir}`);
        }
    }

    getMainFile() {
        const pkgJsonPath = join(this.tempDir, "package", "package.json");
        if (!fs.existsSync(pkgJsonPath)) {
            throw new Error("❌ Cannot find package.json!");
        }

        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
        const mainFile = pkgJson.module || pkgJson.main || "index.js";
        const mainFilePath = join(this.tempDir, "package", mainFile);

        if (!fs.existsSync(mainFilePath)) {
            throw new Error(`❌ Cannot find the main file: ${mainFile}`);
        }
        return mainFilePath;
    }

    analyzeSize(filePath) {
        const rawSize = fs.statSync(filePath).size;
        const gzippedSize = gzipSizeSync(fs.readFileSync(filePath));

        console.log(`📏 Analyzing: ${filePath}`);
        console.log(`✅ Size: ${(rawSize / 1024).toFixed(2)} KB (raw)`);
        console.log(`✅ Gzipped Size: ${(gzippedSize / 1024).toFixed(2)} KB`);
    }

    run() {
        try {
            this.preparePackage();
            const mainFile = this.getMainFile();
            this.analyzeSize(mainFile);
            this.cleanTempDir();
        }
        catch (error) {
            console.error(error.message);
            process.exit(1);
        }
    }
}

new BundlewiseNode(process.argv[2]);
