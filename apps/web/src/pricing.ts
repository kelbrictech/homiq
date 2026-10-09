// HOMIQ MVP TEST DATA — suggested PHP amounts, not binding market prices.
// Final quotations must be submitted by the assigned provider and approved by the customer.
export const demoPricing={
 repairs:{starting:400,typicalMin:400,typicalMax:2500,example:800},
 cleaning:{starting:500,typicalMin:500,typicalMax:3500,example:1200},
 maintenance:{starting:600,typicalMin:600,typicalMax:3000,example:800},
 outdoor:{starting:400,typicalMin:400,typicalMax:3000,example:700},
 moving_delivery:{starting:500,typicalMin:500,typicalMax:4000,example:1500},
 personal_assistance:{starting:120,typicalMin:120,typicalMax:960,example:480}
} as const;
export const php=(amount:number)=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(amount);
