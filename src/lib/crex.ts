import axios, { AxiosInstance } from "axios";
import {
  CrExArgAllPackage,
  CrExArgBuildPackage,
  CrExArgNewPackage,
  CrExArgPackage,
  CrExArgUploadPackage,
  CrExOptions,
  CrExResponse,
} from "../index";

import {
  doDelete,
  doDownload,
  doGet,
  doPost,
  doUpload,
} from "./request";

const rootPath = "/apps/creative-exchange/api";
export default class CrEx {
  public user: string = "admin";
  public password: string = "admin";
  public url: string = "localhost";
  public port: string = "4502";
  public proxy: any = process.env.https_proxy || process.env.http_proxy;
  public instance: AxiosInstance;

  constructor(options: CrExOptions = {}) {
    Object.assign(this, options);
    this.instance = this.createAxiosInstance();
  }

  public setTarget(target: string) {
    const credentials = target.substr(0, target.lastIndexOf("@")).split(":");
    const address = target.substr(target.lastIndexOf("@") + 1).split(":");

    this.user = credentials[0];
    this.password = credentials[1];
    this.url = address[0];
    this.port = address.length > 1 ? address[1] : "";
  }

  // API
  public getPackageStatus = (args: CrExArgPackage): CrExResponse => (
    this.request("GET", `${rootPath}/status.json`, args)
  )

  public getPackageList =  (args?: CrExArgAllPackage): CrExResponse => (
    this.request("GET", `${rootPath}/packages.json`, args)
  )

  public createPackage = (args: CrExArgNewPackage): CrExResponse => (
    this.request("POST", `${rootPath}/create.json`, args)
  )

  public buildPackage = (args: CrExArgBuildPackage): CrExResponse => (
    this.request("POST", `${rootPath}/build.json`, args)
  )

  public downloadPackage = (args: CrExArgPackage): CrExResponse => (
    this.request("DOWNLOAD", `${rootPath}/download`, args)
  )

  public deletePackage = (args: CrExArgPackage): CrExResponse => (
    this.request("DELETE", `${rootPath}/package.json`, args)
  )

  public uploadPackage = (args: CrExArgUploadPackage): CrExResponse => (
    this.request("UPLOAD", `${rootPath}/upload.json`, args)
  )

  public installPackage = (args: CrExArgPackage): CrExResponse => (
    this.request("POST", `${rootPath}/install.json`, args)
  )

  private request(method: string, path: string, args: any): CrExResponse {
    switch (method) {
      case "POST":
        return doPost(path, args, this.instance);
      case "DELETE":
        return doDelete(path, args, this.instance);
      case "UPLOAD":
        return doUpload(path, args, this.instance);
      case "DOWNLOAD":
        return doDownload(path, args, this.instance);
      default:
        return doGet(path, args, this.instance);
    }
  }

  private getAddress = (): string => {
    let address;

    if (this.port !== "") {
      address = `http://${this.url}:${this.port}`;
    }

    return address || "";
  }

  private createAxiosInstance = (): AxiosInstance => {
    const instance = axios.create({
      auth: {
        password: this.password,
        username: this.user,
      },
      baseURL: this.getAddress(),
    });

    if (this.proxy) {
      instance.defaults.proxy = this.proxy;
    }

    return instance;
  }
}