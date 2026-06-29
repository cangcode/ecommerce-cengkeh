declare module "midtrans-client" {
  namespace midtransClient {
    interface SnapOptions {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    }

    interface CoreApiOptions {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    }

    interface TransactionDetails {
      order_id: string;
      gross_amount: number;
    }

    interface ItemDetail {
      id: string;
      price: number;
      quantity: number;
      name: string;
    }

    interface CustomerDetails {
      first_name?: string;
      email?: string;
    }

    interface Callbacks {
      finish?: string;
    }

    interface SnapParameter {
      transaction_details: TransactionDetails;
      item_details?: ItemDetail[];
      customer_details?: CustomerDetails;
      callbacks?: Callbacks;
    }

    interface SnapTransaction {
      token: string;
      redirect_url: string;
    }

    class Snap {
      constructor(options: SnapOptions);
      createTransaction(parameter: SnapParameter): Promise<SnapTransaction>;
    }

    class CoreApi {
      constructor(options: CoreApiOptions);
      transaction: {
        refund(
          orderId: string,
          params?: { amount?: number; reason?: string },
        ): Promise<unknown>;
      };
    }
  }

  export = midtransClient;
}
