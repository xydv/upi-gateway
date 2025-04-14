export type createKeyArgs = {
  name: string;
  vpa: string;
  webhook?: string;
};

export type createKeyResponse = {
  key: string;
};

export type setWebhookArgs = {
  webhook: string;
};

export type setWebhookResponse = boolean;

export type deleteWebhookResponse = boolean;

export type createRequestArgs = {
  amount: string;
};

export type createRequestResponse = {
  id: string;
  uri: string;
  qr: string;
};

export type cancelRequestArgs = {
  id: string;
};

export type cancelRequestResponse = boolean;

export type getRequestArgs = cancelRequestArgs;

export type getRequestResponse = {
  id: string;
  amount: string;
  status: number;
  timestamp: string;
  uri: string;
  qr: string;
};
