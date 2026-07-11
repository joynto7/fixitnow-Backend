declare module 'sslcommerz-lts' {
  interface SslInitResponse {
    status?: string;
    GatewayPageURL?: string;
    failedreason?: string;
    [key: string]: unknown;
  }

  interface SslValidationResponse {
    status?: string;
    tran_id?: string;
    val_id?: string;
    amount?: string;
    currency_type?: string;
    [key: string]: unknown;
  }

  class SSLCommerzPayment {
    constructor(storeId: string, storePassword: string, isLive: boolean);
    init(data: Record<string, unknown>): Promise<SslInitResponse>;
    validate(data: Record<string, unknown>): Promise<SslValidationResponse>;
    transactionQueryByTransactionId(data: Record<string, unknown>): Promise<unknown>;
    transactionQueryBySessionId(data: Record<string, unknown>): Promise<unknown>;
    initiateRefund(data: Record<string, unknown>): Promise<unknown>;
    refundQuery(data: Record<string, unknown>): Promise<unknown>;
  }

  export = SSLCommerzPayment;
}
