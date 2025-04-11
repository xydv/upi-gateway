export enum MESSAGE {
	INVALID_KEY = 'Invalid Merchant Key',
	WEBHOOK_SET = 'Webhook Was Set',
	WEBHOOK_DELETED = 'Webhook Was Deleted',
	REQUEST_NOT_FOUND = 'Request Not Found',
	SERVER_ERROR = 'Internal Server Error',
	SUCCESS = 'Success',
	EXPIRED_OR_CANCELLED = 'Request Expired or Cancelled',
}

export enum WEBHOOK_TYPE {
	SUCCESS = 'SUCCESS', // 1
	EXPIRED = 'EXPIRED', // 2
	CANCELLED = 'CANCELLED', // 3
}

export type WEBHOOK_DATA = {
	type: WEBHOOK_TYPE;
	webhookId: string;
	requestId: string;
	status: number;
	timestamp: number;
};
