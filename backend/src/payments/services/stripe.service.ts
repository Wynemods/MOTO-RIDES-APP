import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface StripePaymentIntent {
  id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
}

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (!secretKey) {
      throw new Error('Stripe secret key is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId?: string,
    metadata?: Record<string, string>
  ): Promise<StripePaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customer: customerId,
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      console.error('Stripe payment intent error:', error);
      throw new HttpException('Failed to create payment intent', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.confirm(paymentIntentId);
    } catch (error) {
      console.error('Stripe confirm payment error:', error);
      throw new HttpException('Failed to confirm payment', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieve a payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error('Stripe retrieve payment error:', error);
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(
    email: string,
    name?: string,
    phone?: string
  ): Promise<StripeCustomer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        phone,
      });

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
      };
    } catch (error) {
      console.error('Stripe create customer error:', error);
      throw new HttpException('Failed to create customer', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<StripeCustomer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
      
      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
      };
    } catch (error) {
      console.error('Stripe get customer error:', error);
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Create a setup intent for saving payment methods
   */
  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      return await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });
    } catch (error) {
      console.error('Stripe setup intent error:', error);
      throw new HttpException('Failed to create setup intent', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * List customer payment methods
   */
  async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('Stripe get payment methods error:', error);
      throw new HttpException('Failed to get payment methods', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create a refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<Stripe.Refund> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to cents
      }

      if (reason) {
        refundData.reason = reason as Stripe.RefundCreateParams.Reason;
      }

      return await this.stripe.refunds.create(refundData);
    } catch (error) {
      console.error('Stripe refund error:', error);
      throw new HttpException('Failed to create refund', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Process webhook event
   */
  async processWebhook(payload: string, signature: string): Promise<Stripe.Event> {
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret is not configured');
      }

      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error) {
      console.error('Stripe webhook error:', error);
      throw new HttpException('Invalid webhook signature', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get payment method details
   */
  async getPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      return await this.stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
      console.error('Stripe get payment method error:', error);
      throw new HttpException('Payment method not found', HttpStatus.NOT_FOUND);
    }
  }
}
