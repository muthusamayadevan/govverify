/**
 * Calculates income tax based on SIMPLIFIED Indian income tax slabs (new regime, approximate for demo).
 * NOTE: These are simplified, illustrative slabs for educational/demo purposes and not exact government rates.
 * 
 * Progressive Slabs:
 * - 0 to 3,00,000: 0%
 * - 3,00,001 to 6,00,000: 5%
 * - 6,00,001 to 9,00,000: 10%
 * - 9,00,001 to 12,00,000: 15%
 * - 12,00,001 to 15,00,000: 20%
 * - Above 15,00,000: 30%
 * 
 * @param {number} taxableIncome - Annual income after deductions
 * @returns {number} Calculated tax payable rounded to nearest rupee
 */
function calculateTax(taxableIncome) {
  const income = Math.max(0, Number(taxableIncome) || 0);
  let tax = 0;

  // Slab 1: 3,00,001 to 6,00,000 at 5%
  if (income > 300000) {
    const slabIncome = Math.min(income, 600000) - 300000;
    tax += slabIncome * 0.05;
  }

  // Slab 2: 6,00,001 to 9,00,000 at 10%
  if (income > 600000) {
    const slabIncome = Math.min(income, 900000) - 600000;
    tax += slabIncome * 0.10;
  }

  // Slab 3: 9,00,001 to 12,00,000 at 15%
  if (income > 900000) {
    const slabIncome = Math.min(income, 1200000) - 900000;
    tax += slabIncome * 0.15;
  }

  // Slab 4: 12,00,001 to 15,00,000 at 20%
  if (income > 1200000) {
    const slabIncome = Math.min(income, 1500000) - 1200000;
    tax += slabIncome * 0.20;
  }

  // Slab 5: Above 15,00,000 at 30%
  if (income > 1500000) {
    const slabIncome = income - 1500000;
    tax += slabIncome * 0.30;
  }

  return Math.round(tax);
}

module.exports = calculateTax;
