"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculatorService = void 0;
function getSavingCalculatorFromDB(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const { amount, frequency, returnRate, years, inflationRate, taxRate } = payload;
        const periodsPerYear = frequency === 'Monthly' ? 12 : 1;
        const periodicRate = returnRate / 100 / periodsPerYear;
        const totalPeriods = years * periodsPerYear;
        // Future value formula for annuity
        const futureValue = amount * ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate);
        const totalContributions = amount * totalPeriods; // Principal only
        const interestEarned = futureValue - totalContributions;
        const taxPaid = interestEarned * (taxRate / 100);
        const afterTaxValue = futureValue - taxPaid;
        const inflationAdjusted = afterTaxValue / Math.pow(1 + inflationRate / 100, years);
        const netGain = inflationAdjusted - totalContributions;
        return {
            totalSavedBeforeTax: Number(futureValue.toFixed(2)),
            afterTax: Number(afterTaxValue.toFixed(2)),
            inflationAdjustedValue: Number(inflationAdjusted.toFixed(2)),
            netGain: Number(netGain.toFixed(2)),
        };
    });
}
const loanRepaymentCalculatorFromDB = (payload) => {
    const { principal, loanTermYears, annualInterestRate } = payload;
    const monthlyInterestRate = annualInterestRate / 100 / 12;
    const totalPayments = loanTermYears * 12;
    let monthlyPayment;
    if (monthlyInterestRate === 0) {
        monthlyPayment = principal / totalPayments;
    }
    else {
        monthlyPayment = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) / (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);
    }
    const totalPayableAmount = monthlyPayment * totalPayments;
    return {
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalPayableAmount: Math.round(totalPayableAmount * 100) / 100,
    };
};
const inflationCalculatorFromDB = (payload) => {
    const { initialAmount, annualInflationRate, years } = payload;
    const rateDecimal = annualInflationRate / 100;
    const futureValue = initialAmount * Math.pow(1 + rateDecimal, years);
    return {
        futureValue: Math.round(futureValue * 100) / 100,
    };
};
// import fetch from 'node-fetch';
// type InflationPayload = {
//   fromYear: number;
//   toYear: number;
//   amount: number;
// };
// type InflationData = Record<number, number>;
// const FRED_API_KEY = 'YOUR_FRED_API_KEY_HERE'; // Replace with your actual key
// const SERIES_ID = 'CPIAUCSL'; // CPI for All Urban Consumers: All Items (US)
// async function fetchCPIData(): Promise<InflationData> {
//   const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${SERIES_ID}&observation_start=1900-01-01&observation_end=2100-01-01&api_key=${FRED_API_KEY}&file_type=json`;
//   const response = await fetch(url);
//   if (!response.ok) {
//     throw new Error('Failed to fetch CPI data from FRED');
//   }
//   const data = await response.json();
//   const cpiData: InflationData = {};
//   for (const obs of data.observations) {
//     const date = obs.date as string; // format YYYY-MM-DD
//     const year = parseInt(date.slice(0, 4));
//     const value = parseFloat(obs.value);
//     if (!isNaN(value)) {
//       // Store annual CPI as the average of monthly values (sum all months then average)
//       if (!cpiData[year]) {
//         cpiData[year] = 0;
//       }
//       cpiData[year] += value;
//     }
//   }
//   // Now average the CPI per year (12 months)
//   for (const year in cpiData) {
//     cpiData[parseInt(year)] = +(cpiData[parseInt(year)] / 12).toFixed(4);
//   }
//   return cpiData;
// }
// async function historicalInflationCalculator(payload: InflationPayload) {
//   const { fromYear, toYear, amount } = payload;
//   if (fromYear >= toYear) {
//     throw new Error('From year must be less than To year');
//   }
//   const cpiData = await fetchCPIData();
//   if (!cpiData[fromYear] || !cpiData[toYear]) {
//     throw new Error(`CPI data missing for requested years: ${fromYear} or ${toYear}`);
//   }
//   // Inflation factor = CPI_toYear / CPI_fromYear
//   const inflationFactor = cpiData[toYear] / cpiData[fromYear];
//   // Value in fromYear = current amount divided by inflation factor
//   const valueInFromYear = amount / inflationFactor;
//   // Total inflation in percentage
//   const totalInflationPercent = (inflationFactor - 1) * 100;
//   return {
//     valueInFromYear: Math.round(valueInFromYear * 100) / 100,
//     totalInflation: Math.round(totalInflationPercent * 100) / 100,
//   };
// }
// // Example usage:
// (async () => {
//   try {
//     const result = await inflationCalculator({
//       fromYear: 2010,
//       toYear: 2020,
//       amount: 1000,
//     });
//     console.log(`Value in 2010: $${result.valueInFromYear}`);
//     console.log(`Total Inflation: ${result.totalInflation}%`);
//   } catch (err) {
//     console.error(err);
//   }
// })();
exports.CalculatorService = {
    getSavingCalculatorFromDB,
    loanRepaymentCalculatorFromDB,
    inflationCalculatorFromDB,
};
