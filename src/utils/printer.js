function formatMoney(value) {
  return `KES ${Number(value || 0).toLocaleString()}`;
}

function formatDateTime(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);
  return `${date.toLocaleDateString("en-CA")} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
}

function buildReceiptHtml(order, mpesaPaybill) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Urban Trends Receipt</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
          }

          body {
            width: 80mm;
            box-sizing: border-box;
            padding: 4mm 8mm 8mm 8mm;
          }

          .receipt {
            width: 100%;
            box-sizing: border-box;
            margin-top: -2px;
          }

          .header {
            text-align: center;
            border-bottom: 2px solid #111827;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }

          h1 {
            margin: 0;
            font-size: 20px;
            letter-spacing: 1px;
          }

          .title {
            margin-top: 5px;
            font-size: 11px;
            text-transform: uppercase;
            color: #4b5563;
          }

          .section {
            border-bottom: 1px dashed #9ca3af;
            padding: 4px 0 8px;
            margin-bottom: 8px;
          }

          .row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin: 6px 0;
            font-size: 12px;
          }

          .row strong {
            text-align: right;
            overflow-wrap: anywhere;
          }

          .total {
            font-size: 15px;
            font-weight: 800;
            border-top: 2px solid #111827;
            padding-top: 9px;
          }

          .payment {
            background: #f3f4f6;
            padding: 10px 9px;
            margin-top: 10px;
            border: 1px solid #e5e7eb;
            font-weight: 700;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .payment .row {
            font-weight: 700;
          }

          .payment strong {
            font-weight: 900;
          }

          .footer {
            text-align: center;
            margin-top: 12px;
            color: #4b5563;
            font-size: 10px;
            line-height: 1.4;
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>URBAN TRENDS</h1>
            <div class="title">Dispatch Receipt</div>
          </div>

          <div class="section">
            <div class="row"><strong>Order</strong><strong>${String(order.id || "").slice(0, 8).toUpperCase()}</strong></div>
            <div class="row"><span>Date</span><span>${formatDateTime(order.createdAt)}</span></div>
            <div class="row"><span>Status</span><span>${String(order.orderStatus || "").replaceAll("_", " ")}</span></div>
          </div>

          <div class="section">
            <div class="row"><span>Customer</span><strong>${order.customerName || "-"}</strong></div>
            <div class="row"><span>Phone</span><strong>${order.phoneNumber || "-"}</strong></div>
            <div class="row"><span>City</span><strong>${order.deliveryCity || "-"}</strong></div>
          </div>

          <div class="section">
            <div class="row"><span>Product</span><strong>${order.productName || "-"}</strong></div>
            <div class="row total"><span>Amount Due</span><span>${formatMoney(order.totalAmount)}</span></div>
          </div>

          <div class="payment">
            <div class="row"><span>M-Pesa Paybill</span><strong>${mpesaPaybill || "522522"}</strong></div>
            <div class="row"><span>Account No</span><strong>${order.accountNumber || "Use order number"}</strong></div>
          </div>

          <div class="footer">
            Payment due upon delivery.<br />
            Thank you for shopping with us.
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function printReceiptToUSB(order, mpesaPaybill) {
  if (typeof window === "undefined" || !order) return false;

  const printWindow = window.open("", "_blank", "width=420,height=700");
  if (!printWindow) {
    alert("Please allow pop-ups to print the receipt.");
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(buildReceiptHtml(order, mpesaPaybill));
  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 300);

  setTimeout(() => {
    try {
      printWindow.close();
    } catch (e) {
      // no-op
    }
  }, 1500);

  return true;
}
