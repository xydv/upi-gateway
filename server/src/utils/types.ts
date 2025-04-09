export enum MESSAGE {
	INVALID_KEY = 'Invalid Merchant Key',
	WEBHOOK_SET = 'Webhook Was Set',
	WEBHOOK_DELETED = 'Webhook Was Deleted',
	REQUEST_NOT_FOUND = 'Request Not Found',
	SERVER_ERROR = 'Internal Server Error',
}

enum PAYMENT_STATUS {
	PENDING = 0,
	SUCCESS = 1,
	EXPIRED = 2,
	CANCELLED = 3,
}

export type WEBHOOK_DATA = {
	webhookId: string;
	requestId: string;
	status: PAYMENT_STATUS;
	timestamp: number;
};
