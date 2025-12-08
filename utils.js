// utils.js
export function beep() {
  new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=").play().catch(() => {});
}

// Format currency in LKR format
function formatLKR(amount) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(amount);
}

export function printReceipt(data, settings) {
  const win = window.open('', '_blank');
  win.document.write(`
<!DOCTYPE html>
<html><head><title>Receipt</title>
<meta charset="UTF-8">
<style>
  body { 
    font-family: 'Courier New', monospace; 
    max-width: 80mm; 
    margin: 0 auto; 
    padding: 10px; 
    font-size: 13px; 
    text-align: center; 
  }
  .line { border-top: 2px dashed #000; margin: 8px 0; }
  .big { font-size: 18px; font-weight: bold; margin: 10px 0; }
  .header { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
  .items { text-align: left; margin: 10px 0; }
  .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
  .small { font-size: 11px; color: #666; }
  @media print {
    body { margin: 0; padding: 5mm; }
  }
</style>
</head>
<body>
  <div class="header">${settings.shopName}</div>
  <p>${settings.address || 'Your Address'}</p>
  <p class="small">${new Date().toLocaleString('en-LK')}</p>
  ${data.transactionId ? `<p class="small"><strong>TXN:</strong> ${data.transactionId}</p>` : ''}
  ${data.userName ? `<p class="small">Served by: ${data.userName}</p>` : ''}
  <div class="line"></div>
  <div class="items">
    ${data.items.map(i => 
      `<div class="item-row">
        <span>${i.name} × ${i.qty}</span>
        <span>${formatLKR(i.price*i.qty)}</span>
      </div>
      <div class="small" style="margin-top: -3px; margin-bottom: 5px;">@ ${formatLKR(i.price)} each</div>`
    ).join('')}
  </div>
  <div class="line"></div>
  <div class="big">TOTAL: ${formatLKR(data.total)}</div>
  <div>Cash: ${formatLKR(data.tendered)}</div>
  <div>Change: ${formatLKR(data.change)}</div>
  <div class="line"></div>
  <p style="margin-top: 15px;">*** THANK YOU ***</p>
  <p class="small">Please Come Again!</p>
  <p class="small" style="margin-top: 10px;">Powered by CashierPOS</p>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 600);
}

// Helper function to be used in receipt generation
function formatLKR(amount) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(amount);
}