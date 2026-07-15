ALTER TABLE orders RENAME COLUMN midtrans_order_id TO xendit_invoice_id;
ALTER TABLE orders RENAME COLUMN snap_token TO invoice_url;