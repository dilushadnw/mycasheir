// utils.js
export function beep() {
  new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=").play().catch(() => {});
}

export function printReceipt(data, settings) {
  const win = window.open('', '_blank');
  win.document.write(`
<!DOCTYPE html>
<html><head><title>Receipt</title>
<style>
  body { font-family: monospace; max-width: 80mm; margin: 0 auto; padding: 10px; font-size: 14px; text-align: center; }
  .line { border-top: 2px dashed #000; margin: 10px 0; }
  .big { font-size: 20px; font-weight: bold; }
</style>
</head>
<body>
  <h2>${settings.shopName}</h2>
  <p>${settings.address || ''}<br>${new Date().toLocaleString()}</p>
  <div class="line"></div>
  ${data.items.map(i => 
    `<div style="display:flex;justify-content:space-between">
      <span>${i.name} × ${i.qty}</span>
      <span>${settings.currency}${(i.price*i.qty).toFixed(2)}</span>
    </div>`
  ).join('')}
  <div class="line"></div>
  <div class="big">TOTAL: ${settings.currency}${data.total.toFixed(2)}</div>
  <div>Paid: ${data.tendered.toFixed(2)} • Change: ${settings.currency}${data.change.toFixed(2)}</div>
  <br><p>*** Thank You ***</p>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 600);
}