import axios, { RawAxiosRequestHeaders, Method } from "axios";
import type {
  cancelRequestArgs,
  cancelRequestResponse,
  createKeyArgs,
  createKeyResponse,
  createRequestArgs,
  createRequestResponse,
  deleteWebhookResponse,
  getRequestArgs,
  getRequestResponse,
  setWebhookArgs,
  setWebhookResponse,
} from "./types";

class UpiGateway {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private static async sendRequest(
    method: Method,
    url: string,
    headers?: RawAxiosRequestHeaders,
    data?: any,
  ) {
    return await axios.request({
      url,
      method,
      baseURL: API_BASE_URL,
      data,
      headers,
    });
  }

  static async createKey(args: createKeyArgs): Promise<createKeyResponse> {
    const { data } = await this.sendRequest(
      "POST",
      "createKey",
      { "content-type": "application/json" },
      args,
    );

    return data as createKeyResponse;
  }

  async setWebhook(args: setWebhookArgs): Promise<setWebhookResponse> {
    const { status } = await UpiGateway.sendRequest(
      "POST",
      "setWebhook",
      { "content-type": "application/json", key: this.apiKey },
      args,
    );

    return status === 200;
  }

  async deleteWebhook(): Promise<deleteWebhookResponse> {
    const { status } = await UpiGateway.sendRequest("POST", "deleteWebhook", {
      "content-type": "application/json",
      key: this.apiKey,
    });

    return status === 200;
  }

  async createRequest(args: createRequestArgs): Promise<createRequestResponse> {
    const { data } = await UpiGateway.sendRequest(
      "POST",
      "createRequest",
      { "content-type": "application/json", key: this.apiKey },
      args,
    );

    return data as createRequestResponse;
  }

  async cancelRequest(args: cancelRequestArgs): Promise<cancelRequestResponse> {
    const { status } = await UpiGateway.sendRequest(
      "POST",
      "cancelRequest",
      { "content-type": "application/json", key: this.apiKey },
      args,
    );

    return status === 200;
  }

  async getRequest(args: getRequestArgs): Promise<getRequestResponse> {
    const { data } = await UpiGateway.sendRequest(
      "GET",
      `getRequest?${new URLSearchParams(args).toString()}`,
      {
        key: this.apiKey,
      },
    );

    return data as getRequestResponse;
  }
}

export default UpiGateway;
export * from "./types";
export const API_BASE_URL = "https://upi.234892.xyz/api/";
export const EVENT_BASE_URL = "https://upi.234892.xyz/event/";
