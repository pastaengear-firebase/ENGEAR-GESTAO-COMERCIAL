import type { Sale, Measurement } from './types';
import { normalizeSaleStatus } from './normalizers';

export interface SaleFinancialSummary {
  sale: Sale;
  totalMeasuredValue: number;
  measuredPercent: number;
  totalReceived: number;
  pendingBalance: number;
  remainingToMeasure: number;
  hasMeasurement: boolean;
  isPartiallyMeasured: boolean;
  isFullyMeasured: boolean;
  isFinalized: boolean;
}

/**
 * Calcula o valor líquido apurado em uma medição individual
 */
export function calculateMeasurementNetValue(m: Measurement): number {
  const contractVal = m.contractValue || 0;
  const execPct = m.execPercent || 0;
  const serviceVal = Math.max(0, contractVal * (execPct / 100));

  const deductions = (m.mode === 'PRECO_GLOBAL_COM_ABATIMENTO' && Array.isArray(m.materialRows))
    ? m.materialRows.reduce((sum, r) => sum + Math.max(0, r?.value || 0), 0)
    : 0;

  const complementary = Array.isArray(m.complementaryRows)
    ? m.complementaryRows.reduce((sum, r) => sum + Math.max(0, r?.totalValue || 0), 0)
    : 0;

  return Math.max(0, (serviceVal - deductions) + complementary);
}

/**
 * Consolida as métricas financeiras de uma venda individual contra o histórico de medições
 */
export function calculateSaleFinancialSummary(
  sale: Sale,
  measurementsForSale: Measurement[] = []
): SaleFinancialSummary {
  const isFinalized = normalizeSaleStatus(sale.status) === 'FINALIZADA';
  const salesValue = Math.max(0, sale.salesValue || 0);

  // Soma de todas as medições registradas para esta venda
  let totalMeasuredValue = 0;
  let maxAccumulatedPercent = 0;

  if (measurementsForSale && measurementsForSale.length > 0) {
    for (const m of measurementsForSale) {
      totalMeasuredValue += calculateMeasurementNetValue(m);
      const accPct = (m.prevPercent || 0) + (m.execPercent || 0);
      if (accPct > maxAccumulatedPercent) {
        maxAccumulatedPercent = accPct;
      }
    }
  }

  const hasMeasurement = measurementsForSale.length > 0;
  const isFullyMeasured = maxAccumulatedPercent >= 100 || (salesValue > 0 && totalMeasuredValue >= salesValue);

  // Regra de recebimento:
  // 1. Se finalizada: assume 100% da venda como recebido
  // 2. Se tem medições: o recebido é no mínimo o total medido (ou payment se maior)
  // 3. Caso contrário: respeita o payment manual
  let totalReceived = 0;
  if (isFinalized) {
    totalReceived = salesValue;
  } else if (hasMeasurement) {
    totalReceived = Math.min(salesValue, Math.max(totalMeasuredValue, sale.payment || 0));
  } else {
    totalReceived = Math.min(salesValue, Math.max(0, sale.payment || 0));
  }

  const pendingBalance = Math.max(0, salesValue - totalReceived);

  // Saldo a medir: relevante para vendas em andamento/a iniciar que têm medição parcial
  const remainingToMeasure = !isFinalized
    ? Math.max(0, salesValue - totalMeasuredValue)
    : 0;

  const isPartiallyMeasured = hasMeasurement && !isFinalized && remainingToMeasure > 0;

  const monetaryPercent = salesValue > 0 ? (totalMeasuredValue / salesValue) * 100 : 0;
  const measuredPercent = Math.min(100, Math.max(0, monetaryPercent > 0 ? monetaryPercent : maxAccumulatedPercent));

  return {
    sale,
    totalMeasuredValue,
    measuredPercent,
    totalReceived,
    pendingBalance,
    remainingToMeasure,
    hasMeasurement,
    isPartiallyMeasured,
    isFullyMeasured,
    isFinalized,
  };
}
