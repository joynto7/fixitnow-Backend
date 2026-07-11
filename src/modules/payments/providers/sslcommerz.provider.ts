import SSLCommerzPayment from 'sslcommerz-lts';
import { config } from '../../../config/env';
import { AppError } from '../../../utils/AppError';

const getClient = () => {
  if (!config.sslcommerz.storeId || !config.sslcommerz.storePassword) {
    throw new AppError(500, 'SSLCommerz is not configured on this server (missing store id/password)');
  }
  return new SSLCommerzPayment(config.sslcommerz.storeId, config.sslcommerz.storePassword, config.sslcommerz.isLive);
};

interface CreateSslcommerzSessionParams {
  transactionId: string;
  amount: number;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

export const createSslcommerzSession = async (params: CreateSslcommerzSessionParams) => {
  const sslcz = getClient();

  const response = await sslcz.init({
    total_amount: params.amount,
    currency: 'BDT',
    tran_id: params.transactionId,
    success_url: `${config.baseUrl}/api/payments/sslcommerz/success`,
    fail_url: `${config.baseUrl}/api/payments/sslcommerz/fail`,
    cancel_url: `${config.baseUrl}/api/payments/sslcommerz/cancel`,
    ipn_url: `${config.baseUrl}/api/payments/ipn/sslcommerz`,
    shipping_method: 'NO',
    product_name: params.description,
    product_category: 'Service',
    product_profile: 'service',
    cus_name: params.customerName,
    cus_email: params.customerEmail,
    cus_add1: 'N/A',
    cus_city: 'N/A',
    cus_postcode: '1000',
    cus_country: 'Bangladesh',
    cus_phone: params.customerPhone || '00000000000',
    ship_name: params.customerName,
    ship_add1: 'N/A',
    ship_city: 'N/A',
    ship_postcode: '1000',
    ship_country: 'Bangladesh',
  });

  if (!response?.GatewayPageURL) {
    throw new AppError(502, 'SSLCommerz did not return a checkout URL', response);
  }

  return { redirectUrl: response.GatewayPageURL };
};

export const validateSslcommerzPayment = async (valId: string) => {
  const sslcz = getClient();
  return sslcz.validate({ val_id: valId });
};
