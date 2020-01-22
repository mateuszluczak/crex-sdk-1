import { Command } from "commander";
import util from "util";
import { CrExPackage } from "../index";
import { spinnerMsg } from "./msgs";

const ora = require("ora");
const CrEx = require("../lib/crex");

export default class Create {
  private spinner = ora("");
  private crex = new CrEx();

  constructor(program: Command) {
    this.init(program.args[0], program.packageName);
  }

  private init(path: string, packageName: string) {
    this.createPackage(path, packageName);
  }

  private createPackage(path: string, name: string) {
    const rootPath = !path.startsWith("/") ? `/${path}` : path;

    this.spinner.start(spinnerMsg.creating);

    this.crex
      .createPackage({ rootPath, name })
      .then(({ name, packageId }: CrExPackage) => {
        const msg = util.format("Package created named %s (%s)", name, packageId);
        this.spinner.succeed(msg);
      })
      .catch((err: string) => {
        this.spinner.fail(err);
      });
  }
}