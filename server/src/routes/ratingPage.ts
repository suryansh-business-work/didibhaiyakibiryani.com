/** Minimal branded HTML shell for the public rating survey pages. */
export function ratingShell(brandName: string, primaryColor: string, inner: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Rate your order — ${brandName}</title>
<style>
  :root { --gold: ${primaryColor}; }
  * { box-sizing: border-box; margin: 0; }
  body { background: #0b0705; color: #f5ece0; font-family: 'Segoe UI', system-ui, sans-serif;
         display: flex; min-height: 100vh; align-items: center; justify-content: center; padding: 20px; }
  .card { background: #17110c; border: 1px solid rgba(232,200,140,0.18); border-radius: 16px;
          padding: 28px; width: 100%; max-width: 430px; }
  h1 { font-size: 1.3rem; margin-bottom: 4px; }
  .sub { color: #8d8073; font-size: 0.9rem; margin-bottom: 20px; }
  .q { font-weight: 700; margin: 18px 0 8px; }
  .stars { display: flex; flex-direction: row-reverse; justify-content: flex-end; gap: 6px; }
  .stars input { display: none; }
  .stars label { font-size: 2rem; color: #4a4036; cursor: pointer; transition: color .15s; }
  .stars input:checked ~ label, .stars label:hover, .stars label:hover ~ label { color: var(--gold); }
  textarea { width: 100%; background: #110c08; color: #f5ece0; border: 1px solid rgba(232,200,140,0.26);
             border-radius: 10px; padding: 10px; min-height: 80px; margin-top: 8px; font-family: inherit; }
  button { width: 100%; margin-top: 22px; background: var(--gold); border: 0; color: #2a1a06;
           font-weight: 800; font-size: 1rem; padding: 13px; border-radius: 10px; cursor: pointer; }
  .ok { color: #5fb45f; font-weight: 700; }
  .err { color: #e0584b; font-weight: 700; }
  .big { font-size: 2.6rem; margin-bottom: 10px; }
</style>
</head>
<body><div class="card">${inner}</div></body>
</html>`;
}

function starGroup(name: string): string {
  const stars = [5, 4, 3, 2, 1]
    .map(
      (v) =>
        `<input type="radio" id="${name}${v}" name="${name}" value="${v}" required />` +
        `<label for="${name}${v}" title="${v} star${v > 1 ? "s" : ""}">★</label>`
    )
    .join("");
  return `<div class="stars">${stars}</div>`;
}

export function ratingFormHtml(orderNumber: string): string {
  return `
  <h1>How was your order?</h1>
  <p class="sub">Order ${orderNumber} · your feedback makes the next biryani better.</p>
  <form method="POST">
    <div class="q">Food quality</div>
    ${starGroup("food")}
    <div class="q">Delivery experience</div>
    ${starGroup("delivery")}
    <div class="q">Anything else? (optional)</div>
    <textarea name="comment" maxlength="500" placeholder="Tell us what you loved (or didn't)…"></textarea>
    <button type="submit">Submit rating</button>
  </form>`;
}

export function ratingThanksHtml(): string {
  return `
  <div class="big">🙏</div>
  <h1 class="ok">Thank you!</h1>
  <p class="sub">Your rating has been recorded. See you at the next biryani!</p>`;
}

export function ratingErrorHtml(message: string): string {
  return `
  <div class="big">😕</div>
  <h1 class="err">${message}</h1>
  <p class="sub">If this looks wrong, reply to your order email and we'll sort it out.</p>`;
}
