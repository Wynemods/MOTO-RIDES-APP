import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

export interface MpesaResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface MpesaCallback {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: {
    Item: Array<{
      Name: string;
      Value: string | number;
    }>;
  };
}

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly baseUrl: string;
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly passkey: string;
  private readonly shortcode: string;
  private readonly callbackUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('MPESA_BASE_URL') || 'https://sandbox.safaricom.co.ke';
    this.consumerKey = this.configService.get<string>('MPESA_CONSUMER_KEY');
    this.consumerSecret = this.configService.get<string>('MPESA_CONSUMER_SECRET');
    this.passkey = this.configService.get<string>('MPESA_PASSKEY');
    this.shortcode = this.configService.get<string>('MPESA_SHORTCODE');
    this.callbackUrl = this.configService.get<string>('MPESA_CALLBACK_URL');

    if (!this.consumerKey || !this.consumerSecret || !this.passkey || !this.shortcode) {
      throw new Error('M-Pesa configuration is incomplete');
    }
  }

  /**
   * Get M-Pesa access token
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 60) * 1000);

      return this.accessToken;
    } catch (error) {
      throw new HttpException('Failed to get M-Pesa access token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate M-Pesa password
   */
  private generatePassword(): string {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
    return password;
  }

  /**
   * Initiate STK Push payment
   */
  async initiateSTKPush(
    phoneNumber: string,
    amount: number,
    accountReference: string,
    transactionDesc: string
  ): Promise<MpesaResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = this.generatePassword();

      // Format phone number (remove leading 0 and add 254)
      const formattedPhone = phoneNumber.startsWith('254') 
        ? phoneNumber 
        : `254${phoneNumber.replace(/^0/, '')}`;

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('M-Pesa STK Push failed', {
        error: error.response?.data || error.message,
        phoneNumber,
        amount,
      });
      throw new HttpException(
        error.response?.data?.errorMessage || 'M-Pesa payment failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Query STK Push status
   */
  async querySTKPushStatus(checkoutRequestID: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = this.generatePassword();

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('M-Pesa query failed', {
        error: error.response?.data || error.message,
        checkoutRequestID,
      });
      throw new HttpException('Failed to query M-Pesa payment', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Process M-Pesa callback
   */
  processCallback(callbackData: MpesaCallback): {
    success: boolean;
    transactionId?: string;
    amount?: number;
    phoneNumber?: string;
    message: string;
  } {
    if (callbackData.ResultCode === 0) {
      // Payment successful
      const metadata = callbackData.CallbackMetadata?.Item || [];
      const transactionId = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value as string;
      const amount = metadata.find(item => item.Name === 'Amount')?.Value as number;
      const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value as string;

      return {
        success: true,
        transactionId,
        amount,
        phoneNumber,
        message: 'Payment successful',
      };
    } else {
      // Payment failed
      return {
        success: false,
        message: callbackData.ResultDesc || 'Payment failed',
      };
    }
  }

  /**
   * Send money to M-Pesa account (for driver payouts)
   */
  async sendMoney(
    phoneNumber: string,
    amount: number,
    remarks: string
  ): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = this.generatePassword();

      const formattedPhone = phoneNumber.startsWith('254') 
        ? phoneNumber 
        : `254${phoneNumber.replace(/^0/, '')}`;

      const payload = {
        InitiatorName: 'MotoLink',
        SecurityCredential: this.configService.get<string>('MPESA_SECURITY_CREDENTIAL'),
        CommandID: 'BusinessPayment',
        Amount: amount,
        PartyA: this.shortcode,
        PartyB: formattedPhone,
        Remarks: remarks,
        QueueTimeOutURL: `${this.callbackUrl}/timeout`,
        ResultURL: `${this.callbackUrl}/result`,
        Occasion: 'Driver Payout',
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('M-Pesa send money failed', {
        error: error.response?.data || error.message,
        phoneNumber,
        amount,
      });
      throw new HttpException('Failed to send money via M-Pesa', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
