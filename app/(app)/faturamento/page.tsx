'use client';
import { useEffect, useMemo, useState } from 'react';
import { format, parseISO, isBefore, subDays, differenceInDays } from 'date-fns';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Receipt, Search, Send, AlertTriangle, Loader2, Link as LinkIcon, Printer, RotateCcw } from 'lucide-react';
import { useSales } from '@/hooks/use-sales';
import { useSettings } from '@/hooks/use-settings';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogContent, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { Sale, BillingLog, Measurement, MaterialDeductionRow, ComplementaryRow } from '@/lib/types';
import { ALL_SELLERS_OPTION, STATUS_OPTIONS } from '@/lib/constants';
import { normalizeSaleStatus } from '@/lib/normalizers';
import { updateDoc, doc } from 'firebase/firestore';

type MeasurementMode = 'SERVICOS' | 'PRECO_GLOBAL_COM_ABATIMENTO';

// MaterialDeductionRow is now imported from @/lib/types

const COMPANY_PROFILE: Record<'ENGEAR' | 'CLIMAZONE', { legalName: string; taxId: string; address: string; bankData: string }> = {
  ENGEAR: {
    legalName: 'Engear Engenharia de Aquecimento e Refrigeração LTDA',
    taxId: 'CNPJ: 00.976.914/0001-92 | Inscrição Estadual PB: 16.137.828-5',
    address: 'Avenida Cel. Estevão D\'avila Lins, N. 780.\nCruz das Armas - João Pessoa PB\nCEP: 58085-010',
    bankData: 'ENGEAR ENGENHARIA DE AQ. E REF. LTDA - CNPJ: 00.976.914./0001-92\nBanco N. 104 - Caixa Econômica Federal - Agência: 1033 - Conta Corrente 1024-0 Operação: 003\nOu via PIX, chave CNPJ: 00.976.914./0001-92',
  },
  CLIMAZONE: {
    legalName: 'Engear Climazone Comercio e Serviços Térmicos LTDA',
    taxId: 'CNPJ: 09.575.551/0001-58 | Inscrição Estadual PB: 16.156.531-0',
    address: 'Avenida Jose Vasconcelos Maia, N. 134\nParque Esperança – Cabedelo, PB. CEP: 58108-540',
    bankData: 'ENGEAR CLIMAZONE COM. E SERV. TÉRMICOS LTDA - CNPJ: 09.575.551/0001-58\nBanco 104 – Caixa Econômica Federal - Agencia: 1033 Conta Corrente: 2678-3 Operação: 03\nOu via PIX, chave CNPJ: 09.575.551/0001-58',
  },
};

const MEASUREMENT_RESPONSIBLE = {
  SERGIO: {
    email: 'sergio@engearpb.com.br',
    phone: '(83) 9 9979.2102',
  },
  RODRIGO: {
    email: 'rodrigobarros@engearpb.com.br',
    phone: '(83) 9 9951-0804',
  },
} as const;

export default function FaturamentoPage() {
  const { sales, updateSale, userRole, user } = useSales();
  const { settings } = useSettings();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [billingInfo, setBillingInfo] = useState('');
  const [billingAmount, setBillingAmount] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isBillingHistoryOpen, setIsBillingHistoryOpen] = useState(false);
  const [billingHistory, setBillingHistory] = useState<BillingLog[]>([]);

  // Medicao (beta) - implementacao segura para validacao em campo.
  const [measurementSaleId, setMeasurementSaleId] = useState('');
  const [measurementNumber, setMeasurementNumber] = useState('01');
  const [measurementRevision, setMeasurementRevision] = useState('rev0');
  const [measurementDate, setMeasurementDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [measurementStartDate, setMeasurementStartDate] = useState<string>('');
  const [measurementEndDate, setMeasurementEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>('SERVICOS');
  const [measurementClient, setMeasurementClient] = useState('');
  const [measurementWork, setMeasurementWork] = useState('');
  const [measurementContractRef, setMeasurementContractRef] = useState('');
  const [measurementService, setMeasurementService] = useState('');
  const [measurementQuantity, setMeasurementQuantity] = useState('');
  const [measurementContractValue, setMeasurementContractValue] = useState<number>(0);
  const [measurementExecPercent, setMeasurementExecPercent] = useState<number>(100);
  const [measurementPrevPercent, setMeasurementPrevPercent] = useState<number>(0);
  const [measurementResponsible, setMeasurementResponsible] = useState<'SERGIO' | 'RODRIGO'>('SERGIO');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyBankData, setCompanyBankData] = useState('');
  const [materialRows, setMaterialRows] = useState<MaterialDeductionRow[]>([
    { id: '1', docNumber: '', description: '', value: 0 },
  ]);
  const [complementaryRows, setComplementaryRows] = useState<{ id: string; description: string; unitValue: number; quantity: number; totalValue: number; }[]>([]);

  const [isSavingMeasurement, setIsSavingMeasurement] = useState(false);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
  const [isMeasurementHistoryModalOpen, setIsMeasurementHistoryModalOpen] = useState(false);
  const [measurementAlertOpen, setMeasurementAlertOpen] = useState(false);

  // Novos campos de faturamento (opcionais)
  const [billingClientName, setBillingClientName] = useState('');
  const [billingClientTaxId, setBillingClientTaxId] = useState('');
  const [billingClientAddress, setBillingClientAddress] = useState('');
  const [billingNotes, setBillingNotes] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');


  const billingEnabled = settings?.enableBillingEmailNotifications ?? false;
  const billingEmails = settings?.billingNotificationEmails ?? [];
  const hasBillingEmails = Array.isArray(billingEmails) && billingEmails.length > 0;

  const logsQuery = useMemo(
    () => firestore ? query(collection(firestore, 'billing-logs'), orderBy('requestedAt', 'desc')) : null,
    [firestore]
  );
  const { data: billingLogs } = useCollection<BillingLog>(logsQuery);

  const measurementsQuery = useMemo(
    () => firestore ? query(collection(firestore, 'measurements'), orderBy('requestedAt', 'desc')) : null,
    [firestore]
  );
  const { data: measurements } = useCollection<Measurement>(measurementsQuery);

  // ALERTA: Controle de Cobrança (+30 dias) - mantém a lógica existente
  const pendingSales = useMemo(() => {
    const limit = subDays(new Date(), 30);
    return sales
      .filter(s => {
        const isPending = s.payment < s.salesValue;
        const normalizedStatus = normalizeSaleStatus(s.status);
        const isProcess = normalizedStatus === 'A INICIAR' || normalizedStatus === 'EM ANDAMENTO';
        return isPending && isProcess && isBefore(parseISO(s.date), limit);
      })
      .map(s => ({ ...s, daysPending: differenceInDays(new Date(), parseISO(s.date)) }))
      .sort((a, b) => b.daysPending - a.daysPending);
  }, [sales]);

  // LISTA PRINCIPAL: parecida com Gerenciar Vendas
  // - todo mundo vê tudo
  // - só vendedor logado (não ALL) pode solicitar faturamento
  const filteredSales = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = [...sales].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (!term) return base;

    return base.filter(s =>
      (s.project || '').toLowerCase().includes(term) ||
      (s.os || '').toLowerCase().includes(term) ||
      (s.company || '').toLowerCase().includes(term) ||
      (s.area || '').toLowerCase().includes(term) ||
      (s.clientService || '').toLowerCase().includes(term) ||
      (s.seller || '').toLowerCase().includes(term)
    );
  }, [sales, searchTerm]);

  const canRequestBilling = userRole !== ALL_SELLERS_OPTION;
  const measurementSale = useMemo(() => {
    if (measurementSaleId) return sales.find(s => s.id === measurementSaleId) || null;
    return null; // Don't default to sales[0] to keep the form blank initially
  }, [sales, measurementSaleId]);

  useEffect(() => {
    if (!measurementSale) {
      if (!selectedMeasurementId) {
        // Clear fields if no sale is selected and we are not editing an existing measurement
        setMeasurementClient('');
        setMeasurementWork('');
        setMeasurementContractRef('');
        setMeasurementService('');
        setMeasurementContractValue(0);
        setMeasurementStartDate('');
        setCompanyAddress('');
        setCompanyBankData('');
      }
      return;
    }
    
    // Sync current UI fields with the selected sale data
    setMeasurementClient(measurementSale.clientService || '');
    setMeasurementWork(measurementSale.project || '');
    setMeasurementContractRef(measurementSale.os || '');
    setMeasurementService(measurementSale.clientService || '');
    setMeasurementContractValue(measurementSale.salesValue || 0);
    setMeasurementResponsible(measurementSale.seller === 'RODRIGO' ? 'RODRIGO' : 'SERGIO');

    // Reset period start to sale date
    if (measurementSale.date) {
      setMeasurementStartDate(measurementSale.date);
    }

    const companyKey = measurementSale.company === 'CLIMAZONE' ? 'CLIMAZONE' : 'ENGEAR';
    setCompanyAddress(COMPANY_PROFILE[companyKey].address);
    setCompanyBankData(COMPANY_PROFILE[companyKey].bankData);

    // Reset rows and check history only for new measurements
    if (!selectedMeasurementId) {
      setMaterialRows([{ id: '1', docNumber: '', description: '', value: 0 }]);
      setComplementaryRows([]);
      setMeasurementNumber('01');
      setMeasurementRevision('rev0');

      // Check if there are previous measurements for this sale to alert the user
      const hasHistory = measurements?.some(m => m.saleId === measurementSale.id);
      if (hasHistory) {
        setMeasurementAlertOpen(true);
      }
    }
  }, [measurementSale, selectedMeasurementId, measurements]);

  const measurementUnitValue = measurementContractValue;
  const measurementProject = measurementWork;
  const measurementAccumulatedPercent = Math.max(0, Math.min(100, measurementPrevPercent + measurementExecPercent));
  const measurementServicePeriodValue = Math.max(0, measurementUnitValue * (measurementExecPercent / 100));
  const measurementDeductionPeriod = measurementMode === 'PRECO_GLOBAL_COM_ABATIMENTO'
    ? materialRows.reduce((sum, row) => sum + Math.max(0, row.value || 0), 0)
    : 0;
  const measurementComplementaryTotal = complementaryRows.reduce((sum, row) => sum + Math.max(0, row.totalValue || 0), 0);
  const measurementTotalPeriod = Math.max(0, (measurementServicePeriodValue - measurementDeductionPeriod) + measurementComplementaryTotal);
  const measurementCompanyKey: 'ENGEAR' | 'CLIMAZONE' = measurementSale?.company === 'CLIMAZONE' ? 'CLIMAZONE' : 'ENGEAR';
  const measurementCompany = COMPANY_PROFILE[measurementCompanyKey];
  const responsibleContact = MEASUREMENT_RESPONSIBLE[measurementResponsible];

  const handleAddMaterialRow = () => {
    setMaterialRows((prev) => [...prev, { id: String(Date.now()), docNumber: '', description: '', value: 0 }]);
  };

  const handleRemoveMaterialRow = (id: string) => {
    setMaterialRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  const handleMaterialRowChange = (id: string, field: keyof MaterialDeductionRow, value: string | number) => {
    setMaterialRows((prev) => prev.map((row) => {
      if (row.id !== id) return row;
      if (field === 'docNumber') {
        const onlyDigits = String(value).replace(/\D/g, '').slice(0, 8);
        return { ...row, docNumber: onlyDigits };
      }
      if (field === 'value') {
        return { ...row, value: Number(value || 0) };
      }
      return { ...row, [field]: value };
    }));
  };

  const handleAddComplementaryRow = () => {
    setComplementaryRows((prev) => [...prev, { id: String(Date.now()), description: '', unitValue: 0, quantity: 1, totalValue: 0 }]);
  };

  const handleRemoveComplementaryRow = (id: string) => {
    setComplementaryRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleComplementaryRowChange = (id: string, field: string, value: string | number) => {
    setComplementaryRows((prev) => prev.map((row) => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      if (field === 'unitValue' || field === 'quantity') {
        updated.totalValue = Number(updated.unitValue || 0) * Number(updated.quantity || 1);
      }
      return updated;
    }));
  };

  const loadMeasurement = (m: Measurement) => {
    setSelectedMeasurementId(m.id);
    setMeasurementSaleId(m.saleId);
    setMeasurementNumber(m.number);
    setMeasurementRevision(m.revision);
    setMeasurementDate(m.date);
    setMeasurementStartDate(m.startDate);
    setMeasurementEndDate(m.endDate);
    setMeasurementMode(m.mode);
    setMeasurementClient(m.client);
    setMeasurementWork(m.work);
    setMeasurementContractRef(m.contractRef);
    setMeasurementService(m.service);
    setMeasurementQuantity(m.quantity);
    setMeasurementContractValue(m.contractValue);
    setMeasurementExecPercent(m.execPercent);
    setMeasurementPrevPercent(m.prevPercent);
    setMeasurementResponsible(m.responsible);
    setCompanyAddress(m.companyAddress);
    setCompanyBankData(m.companyBankData);
    setMaterialRows(m.materialRows);
    setComplementaryRows(m.complementaryRows || []);
    setBillingClientName(m.billingClientName || '');
    setBillingClientTaxId(m.billingClientTaxId || '');
    setBillingClientAddress(m.billingClientAddress || '');
    setBillingNotes(m.billingNotes || '');
    setIsMeasurementHistoryModalOpen(false);
    toast({ title: 'Sucesso', description: 'Medição carregada para edição.' });
  };

  const handleNewMeasurement = () => {
    setSelectedMeasurementId(null);
    setMeasurementSaleId('');
    setMeasurementNumber('01');
    setMeasurementRevision('rev0');
    setMaterialRows([{ id: '1', docNumber: '', description: '', value: 0 }]);
    setComplementaryRows([]);
    setBillingClientName('');
    setBillingClientTaxId('');
    setBillingClientAddress('');
    setBillingNotes('');
    toast({ title: 'Nova Medição', description: 'Formulário resetado para nova medição.' });
  };

  const handleSaveMeasurement = async () => {
    if (!measurementSaleId) {
      toast({ title: 'Aviso', description: 'Selecione uma venda base.', variant: 'destructive' });
      return;
    }
    
    setIsSavingMeasurement(true);
    try {
      const measurementData = {
        saleId: measurementSaleId || measurementSale?.id,
        number: measurementNumber,
        revision: measurementRevision,
        date: measurementDate,
        startDate: measurementStartDate,
        endDate: measurementEndDate,
        mode: measurementMode,
        client: measurementClient,
        work: measurementWork,
        contractRef: measurementContractRef,
        service: measurementService,
        quantity: measurementQuantity,
        contractValue: measurementContractValue,
        execPercent: measurementExecPercent,
        prevPercent: measurementPrevPercent,
        responsible: measurementResponsible,
        companyAddress: companyAddress,
        companyBankData: companyBankData,
        materialRows: materialRows,
        complementaryRows: complementaryRows,
        billingClientName: billingClientName,
        billingClientTaxId: billingClientTaxId,
        billingClientAddress: billingClientAddress,
        billingNotes: billingNotes,
        createdByUid: user?.uid,
        requestedAt: serverTimestamp(),
      };

      if (selectedMeasurementId) {
        await updateDoc(doc(firestore!, 'measurements', selectedMeasurementId), measurementData);
        toast({ title: 'Sucesso', description: 'Medição atualizada com sucesso!' });
      } else {
        await addDoc(collection(firestore!, 'measurements'), measurementData);
        toast({ title: 'Sucesso', description: 'Medição salva com sucesso no banco de dados!' });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Erro', description: 'Falha ao salvar a medição.', variant: 'destructive' });
    } finally {
      setIsSavingMeasurement(false);
    }
  };

  const handlePrintMeasurementPdf = () => {
    const w = window.open('', '_blank', 'width=1024,height=768');
    if (!w) return;

    const rawRevision = measurementRevision ? measurementRevision.toUpperCase() : 'REV0';
    const cleanClient = measurementClient ? measurementClient.replace(/[^a-zA-Z0-9]/g, '_') : 'CLIENTE';
    const cleanProject = measurementProject ? measurementProject.replace(/[^a-zA-Z0-9]/g, '_') : 'PROJETO';
    const pdfFilename = `Medicao_${cleanClient}_${cleanProject}_${rawRevision}_${format(parseISO(measurementEndDate), 'dd-MM-yyyy')}`;

    const materialRowsHtml = materialRows
      .filter((row) => row.docNumber || row.description || row.value > 0)
      .map((row) => `
        <tr>
          <td>${row.docNumber || '-'}</td>
          <td>${row.description || '-'}</td>
          <td style="text-align:right;">${row.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        </tr>
      `)
      .join('');

    const complementaryRowsHtml = complementaryRows
      .filter((row) => row.description || row.totalValue > 0)
      .map((row) => `
        <tr>
          <td>${row.description || '-'}</td>
          <td style="text-align:right;">${row.unitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
          <td style="text-align:center;">${row.quantity}</td>
          <td style="text-align:right;">${row.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        </tr>
      `)
      .join('');


    const html = `
      <html>
        <head>
          <title>${pdfFilename}</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; color: #222; font-size: 12px; line-height: 1.25; 
              margin: 0; padding: 0; background: #fff;
            }
            .a4-wrapper {
              width: 180mm; 
              height: 267mm;
              margin: 15mm auto; 
              padding: 0;
              box-sizing: border-box;
            }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #991b1b; padding-bottom: 12px; margin-bottom: 20px; }
            .logo { height: 70px; object-fit: contain; }
            .header-text { text-align: right; }
            .header-text h1 { margin: 0 0 2px 0; font-size: 21px; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px; }
            .header-text p { margin: 2px 0 0; font-size: 13px; color: #555; }
            
            .section { margin-bottom: 15px; page-break-inside: avoid; }
            .section-title { font-size: 13px; font-weight: bold; background: #fef2f2; color: #7f1d1d; padding: 5px 10px; border-left: 4px solid #991b1b; margin: 0 0 8px 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-block { display: flex; flex-direction: column; gap: 2px; }
            .info-row { display: flex; align-items: flex-start; margin-bottom: 2px; }
            .info-label { font-weight: bold; min-width: 90px; color: #475569; }
            .info-value { flex: 1; }
            
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
            th { background: #991b1b; color: white; text-align: left; padding: 8px 12px; font-weight: 500; font-size: 11px; text-transform: uppercase; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            tr:last-child td { border-bottom: 2px solid #fca5a5; }
            tr:nth-child(even) td { background: #fdf2f8; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            .totals-container { display: flex; justify-content: flex-end; margin-top: 20px; page-break-inside: avoid; }
            .totals-table { width: 350px; border-collapse: collapse; }
            .totals-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
            .totals-table tr.grand-total td { font-weight: bold; font-size: 14px; color: #7f1d1d; border-top: 2px solid #991b1b; border-bottom: none; background: #fef2f2; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>
          <div class="a4-wrapper">
          <div class="header">
            <img class="logo" src="data:image/png;base64,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" alt="Logo" />
            <div class="header-text">
              <h1>BOLETIM DE MEDIÇÃO Nº ${measurementNumber}</h1>
              <p>Revisão: ${rawRevision} &nbsp;|&nbsp; Período de Medição: ${format(parseISO(measurementStartDate), 'dd/MM/yyyy')} a ${format(parseISO(measurementEndDate), 'dd/MM/yyyy')}</p>
            </div>
          </div>

          <div class="info-grid section">
            <div>
              <h3 class="section-title">Dados do Contrato</h3>
              <div class="info-block">
                <div class="info-row"><span class="info-label">Cliente:</span><span class="info-value">${measurementClient || '-'} ${billingClientName ? `(${billingClientName})` : ''}</span></div>
                <div class="info-row"><span class="info-label">Obra:</span><span class="info-value">${measurementProject || '-'}</span></div>
                <div class="info-row"><span class="info-label">Contrato/O.S:</span><span class="info-value">${measurementContractRef || '-'}</span></div>
                <div class="info-row"><span class="info-label">Serviço:</span><span class="info-value">${measurementService || '-'}</span></div>
                <div class="info-row"><span class="info-label">Quantitativo:</span><span class="info-value">${measurementQuantity || '-'}</span></div>
              </div>
            </div>
            <div>
              <h3 class="section-title">Responsável pela Medição</h3>
              <div class="info-block">
                <div class="info-row"><span class="info-label">Nome:</span><span class="info-value">${measurementResponsible}</span></div>
                <div class="info-row"><span class="info-label">E-mail:</span><span class="info-value">${responsibleContact.email}</span></div>
                <div class="info-row"><span class="info-label">Contato:</span><span class="info-value">${responsibleContact.phone}</span></div>
              </div>
            </div>
          </div>

          ${(billingClientTaxId || billingClientAddress || billingNotes) ? `
          <div class="section" style="margin-top: 10px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px; background-color: #f8fafc;">
            <h3 style="margin: 0 0 8px 0; font-size: 11px; color: #1e293b; text-transform: uppercase; font-weight: bold;">Informações para Faturamento</h3>
            ${billingClientTaxId ? `<p style="margin: 2px 0; font-size: 11px;"><strong>CNPJ/CPF:</strong> ${billingClientTaxId}</p>` : ''}
            ${billingClientAddress ? `<p style="margin: 2px 0; font-size: 11px;"><strong>Endereço faturamento:</strong> ${billingClientAddress}</p>` : ''}
            ${billingNotes ? `<p style="margin: 8px 0 2px 0; font-size: 11px; font-style: italic; color: #475569; border-top: 1px dashed #cbd5e1; pt: 4px;"><strong>Obs:</strong> ${billingNotes}</p>` : ''}
          </div>
          ` : ''}

          <div class="info-grid section" style="margin-top: 20px;">
            <div>
              <h3 class="section-title">Empresa Executora</h3>
              <div class="info-block">
                <div class="info-row"><span class="info-label">Empresa:</span><span class="info-value">${measurementCompany.legalName}</span></div>
                <div class="info-row"><span class="info-label">Documento:</span><span class="info-value">${measurementCompany.taxId}</span></div>
                <div class="info-row"><span class="info-label">Endereço:</span><span class="info-value">${companyAddress.replace(/\n/g, '<br/>')}</span></div>
              </div>
            </div>
            <div>
              <h3 class="section-title">Dados Bancários para Pagamento</h3>
              <div class="info-block">
                <p style="margin:0;">${companyBankData.replace(/\n/g, '<br/>')}</p>
              </div>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Resumo Financeiro</h3>
            <table>
              <thead>
                <tr>
                  <th>% Anterior</th>
                  <th>% Período</th>
                  <th>% Acumulado</th>
                  <th style="text-align:right;">Valor Contrato</th>
                  <th style="text-align:right;">Valor Serviços (Período)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${measurementPrevPercent.toFixed(2)}%</td>
                  <td>${measurementExecPercent.toFixed(2)}%</td>
                  <td>${measurementAccumulatedPercent.toFixed(2)}%</td>
                  <td style="text-align:right;">${measurementUnitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td style="text-align:right;">${measurementServicePeriodValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${measurementMode === 'PRECO_GLOBAL_COM_ABATIMENTO' && materialRowsHtml.trim() ? `
          <div class="section">
            <h3 class="section-title">Abatimentos e Materiais</h3>
            <table>
              <thead>
                <tr>
                  <th>NF/Pedido (8 dígitos)</th>
                  <th>Descrição do Material</th>
                  <th style="text-align:right;">Valor a Abater</th>
                </tr>
              </thead>
              <tbody>
                ${materialRowsHtml}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${complementaryRowsHtml.trim() ? `
          <div class="section">
            <h3 class="section-title">Serviços Complementares</h3>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th style="text-align:right;">Valor Unit.</th>
                  <th style="text-align:center;">Qtd.</th>
                  <th style="text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${complementaryRowsHtml}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="totals-container">
            <table class="totals-table">
              <tbody>
                <tr>
                  <td>Subtotal Serviços (Período)</td>
                  <td style="text-align:right;">${measurementServicePeriodValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
                ${measurementMode === 'PRECO_GLOBAL_COM_ABATIMENTO' ? `
                <tr>
                  <td>Abatimento Materiais (Período)</td>
                  <td style="text-align:right; color:#dc2626;">- ${measurementDeductionPeriod.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
                ` : ''}
                ${measurementComplementaryTotal > 0 ? `
                <tr>
                  <td>Total Serviços Complementares</td>
                  <td style="text-align:right;">+ ${measurementComplementaryTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
                ` : ''}
                <tr class="grand-total">
                  <td>Total Líquido da Medição</td>
                  <td style="text-align:right;">${measurementTotalPeriod.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="margin-top: 50px; page-break-inside: avoid;">
            <p style="font-size: 10px; color: #475569; text-align: justify; line-height: 1.4; margin-bottom: 40px;">
              Este documento constitui registro oficial da medição de serviços, conforme previsto em contrato. 
              Qualquer objeção deverá ser formalizada em até 03 (três) dias corridos a partir da data de emissão. 
              Decorrido este prazo, a medição será considerada aceita e o faturamento correspondente será emitido automaticamente 
              em até 10 (dez) dias corridos, nos termos contratuais.
            </p>
            
            <div style="display: flex; justify-content: space-between; margin-top: 60px;">
              <div style="width: 45%; border-top: 1px solid #334155; text-align: center; padding-top: 8px;">
                <p style="margin: 0; font-weight: bold;">${measurementResponsible}</p>
                <p style="margin: 0; font-size: 11px; color: #64748b;">${measurementCompany.legalName}</p>
              </div>
              <div style="width: 45%; border-top: 1px solid #334155; text-align: center; padding-top: 8px;">
                <p style="margin: 0; font-weight: bold;">ASSINATURA DO CONTRATANTE</p>
                <p style="margin: 0; font-size: 11px; color: #64748b;">${measurementClient || 'CLIENTE'}</p>
              </div>
            </div>
          </div>

          
          <script>
            document.title = "${pdfFilename}";
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `;

    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
  };
  const pendingTotalValue = useMemo(
    () => pendingSales.reduce((sum, s: any) => sum + Math.max(0, (s.salesValue || 0) - (s.payment || 0)), 0),
    [pendingSales]
  );

  const getStatusBadgeVariant = (status: Sale['status']): React.ComponentProps<typeof Badge>['variant'] => {
    const normalizedStatus = normalizeSaleStatus(status);
    switch (normalizedStatus) {
      case 'FINALIZADA':
        return 'default';
      case 'A INICIAR':
      case 'EM ANDAMENTO':
        return 'secondary';
      case 'CANCELADO':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleSelectSale = (s: Sale) => {
    setSelectedSale(s);
    setBillingAmount(String(s.salesValue - s.payment));

    const history = (billingLogs || []).filter((log) => log.saleId === s.id);
    setBillingHistory(history);
    if (history.length > 0) {
      setIsBillingHistoryOpen(true);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedSale || !user) return;

    const resolvedRecipients = (billingEnabled && hasBillingEmails)
      ? billingEmails.join(';')
      : recipientEmail.trim();

    if (!billingAmount) {
      toast({ title: "Erro", description: "Preencha o valor.", variant: "destructive" });
      return;
    }

    if (!resolvedRecipients) {
      toast({
        title: "Erro",
        description: billingEnabled ? "Cadastre os e-mails de faturamento em Configurações." : "Preencha o e-mail do destinatário.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore!, 'billing-logs'), {
        saleId: selectedSale.id,
        saleData: selectedSale,
        billingInfo,
        billingAmount: Number(billingAmount),
        recipientEmail: resolvedRecipients,
        requestedBy: userRole,
        requestedByUid: user.uid,
        requestedAt: serverTimestamp(),
      });

      await updateSale(selectedSale.id, { status: "FINALIZADA" });

      const amountBRL = Number(billingAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const requestDate = format(new Date(), 'dd/MM/yyyy');
      const appBaseUrl = window.location.origin;
      const billingLink = `${appBaseUrl}/faturamento`;
      const hasMeasurement = /medição|medicao/i.test(billingInfo || '');

      const subject = `SOLICITAÇÃO DE FATURAMENTO! ${selectedSale.company || 'NÃO INFORMADO'} PROJETO ${selectedSale.project || 'NÃO INFORMADO'} - O.S. N. ${selectedSale.os || 'NÃO INFORMADO'} - VALOR A FATURAR: ${amountBRL} - CLIENTE ${selectedSale.clientService || 'NÃO INFORMADO'} - VENDEDOR: ${selectedSale.seller || 'NÃO INFORMADO'}`;

      const hasPdf = Boolean((selectedSale as any).attachmentUrl);

      const body = [
        `Cliente: ${selectedSale.clientService || 'NÃO INFORMADO'}`,
        `Dados do Cliente para NF: ${billingClientName || ''} ${billingClientTaxId || ''}`,
        `Endereço Faturamento: ${billingClientAddress || ''}`,
        `Valor a faturar: ${amountBRL}`,
        `Área: ${selectedSale.area || 'NÃO INFORMADA'}`,
        `Data: ${requestDate}`,
        `Projeto: ${selectedSale.project || 'NÃO INFORMADO'}`,
        `O.S.: ${selectedSale.os || 'NÃO INFORMADO'}`,
        `Descrição: ${selectedSale.summary || ''}`,
        `PDF da Proposta: ${hasPdf ? 'Sim' : 'Não'}`,
        `Medição: ${hasMeasurement ? 'Sim' : 'Não'}`,
        `Vendedor: ${selectedSale.seller || 'NÃO INFORMADO'}`,
        ``,
        `Observações de Faturamento: ${billingNotes || ''}`,
        `Observações Gerais: ${billingInfo?.trim() || ''}`,
        ``,
        `Para consultar, acesse: ${billingLink}`,
      ].join('\n');

      const mailtoLink = `mailto:${resolvedRecipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, '_blank');

      toast({ title: "Sucesso", description: "Solicitação registrada." });
      setSelectedSale(null);
      setRecipientEmail('');
      setBillingInfo('');
      setBillingAmount('');
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao processar.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="faturamento-printable-area">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print-hide">
        <h1 className="text-3xl font-bold flex items-center"><Receipt className="mr-2" /> FATURAMENTO</h1>
        <Button variant="outline" size="icon" onClick={() => window.print()} aria-label="Imprimir faturamento">
          <Printer className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print-hide">
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Vendas na Lista</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{filteredSales.length}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Solicitações</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{billingLogs?.length || 0}</p></CardContent>
        </Card>
        <Card className="shadow-sm border-amber-300/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pendentes +30 dias</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-amber-700">{pendingSales.length}</p></CardContent>
        </Card>
        <Card className="shadow-sm border-amber-300/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Saldo Pendente</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-amber-700">{pendingTotalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="request" className="space-y-4">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto print-hide">
          <TabsTrigger
            value="request"
            className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-0 mr-6 text-sm data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Solicitar
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-0 mr-6 text-sm data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Histórico
          </TabsTrigger>
          <TabsTrigger
            value="measurement"
            className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-0 text-sm data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Boletim de Medição
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Vendas (lista)</CardTitle>
              <div className="flex gap-2 mt-2 flex-wrap print-hide">
                <Input
                  placeholder="Buscar por projeto, empresa, O.S., cliente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <Button variant="outline" type="button" onClick={() => setSearchTerm('')}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Limpar
                </Button>
              </div>
              {!canRequestBilling && (
                <div className="text-sm text-muted-foreground mt-2">
                  Você está em modo de visualização (ALL). Para solicitar faturamento, selecione SERGIO ou RODRIGO.
                </div>
              )}
            </CardHeader>

            <CardContent>
              <ScrollArea className="whitespace-nowrap rounded-md border">
                <Table className="w-full table-fixed text-[12px] lg:text-[13px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-9 px-2 w-[7%]">Data</TableHead>
                      <TableHead className="h-9 px-2 w-[8%]">Vendedor</TableHead>
                      <TableHead className="h-9 px-2 w-[9%]">Empresa</TableHead>
                      <TableHead className="h-9 px-2 w-[7%]">Projeto</TableHead>
                      <TableHead className="h-9 px-2 w-[6%]">O.S.</TableHead>
                      <TableHead className="h-9 px-2 w-[8%]">Área</TableHead>
                      <TableHead className="h-9 px-2 w-[16%]">Cliente/Serviço</TableHead>
                      <TableHead className="h-9 px-2 text-right w-[11%]">Valor Venda</TableHead>
                      <TableHead className="h-9 px-2 w-[11%]">Status</TableHead>
                      <TableHead className="h-9 px-2 text-right w-[11%]">Pagamento</TableHead>
                      <TableHead className="h-9 px-2 w-[3%] text-center">PDF</TableHead>
                      <TableHead className="h-9 px-2 text-right w-[4%]">Faturar</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredSales.map((s) => {
                      const pdfUrl = (s as any).attachmentUrl as string | undefined;

                      return (
                        <TableRow key={s.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="px-2 py-2 whitespace-nowrap">{format(parseISO(s.date), 'dd/MM/yy')}</TableCell>
                          <TableCell className="px-2 py-2 whitespace-nowrap">{s.seller}</TableCell>
                          <TableCell className="px-2 py-2 font-medium truncate" title={s.company}>{s.company}</TableCell>
                          <TableCell className="px-2 py-2 truncate" title={s.project}>{s.project}</TableCell>
                          <TableCell className="px-2 py-2 whitespace-nowrap" title={s.os}>{s.os}</TableCell>
                          <TableCell className="px-2 py-2 truncate" title={s.area}>{s.area}</TableCell>
                          <TableCell className="px-2 py-2 truncate" title={s.clientService}>{s.clientService}</TableCell>
                          <TableCell className="px-2 py-2 text-right whitespace-nowrap">
                            {s.salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            <Badge variant={getStatusBadgeVariant(s.status)} className="capitalize text-[11px] px-2 py-0.5">
                              {normalizeSaleStatus(s.status) || s.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-2 text-right whitespace-nowrap">
                            {s.payment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell className="px-2 py-2 text-center">
                            {pdfUrl ? (
                              <Button asChild variant="outline" size="icon" className="h-7 w-7" title="Ver PDF">
                                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                                  <LinkIcon className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground/70 italic">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-2 text-right">
                            <Button
                              type="button"
                              onClick={() => handleSelectSale(s)}
                              disabled={!canRequestBilling}
                              size="sm"
                              className="h-8 px-2 text-xs"
                            >
                              <Send className="mr-1 h-3.5 w-3.5" /> Faturar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>

          {selectedSale && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader><CardTitle>Solicitar Faturamento</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Projeto:</strong> {selectedSale.project}</div>
                  <div><strong>Saldo:</strong> {(selectedSale.salesValue - selectedSale.payment).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                </div>

                <div className="space-y-2">
                  <Label>Valor a Faturar</Label>
                  <Input type="number" value={billingAmount} onChange={e => setBillingAmount(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>E-mail do Destinatário</Label>

                  {billingEnabled && (
                    <div className="text-sm text-muted-foreground">
                      Faturamento por e-mail está <strong>ATIVADO</strong>.{" "}
                      {hasBillingEmails ? `Destinatários: ${billingEmails.join(', ')}` : "Nenhum e-mail cadastrado em Configurações."}
                    </div>
                  )}

                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="financeiro@..."
                    disabled={billingEnabled && hasBillingEmails}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={billingInfo} onChange={e => setBillingInfo(e.target.value)} />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleSendEmail} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Enviar Solicitação
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingLogs?.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>{log.requestedAt?.toDate ? format(log.requestedAt.toDate(), 'dd/MM/yy HH:mm') : '...'}</TableCell>
                        <TableCell>{log.requestedBy}</TableCell>
                        <TableCell>{log.saleData.project}</TableCell>
                        <TableCell className="text-right">{log.billingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="measurement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Medição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Venda base</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={measurementSaleId}
                    onChange={(e) => setMeasurementSaleId(e.target.value)}
                  >
                    <option value="">Selecione uma venda...</option>
                    {sales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.project} - {s.clientService}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Início do período</Label>
                  <Input type="date" value={measurementStartDate} onChange={(e) => setMeasurementStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Término do período</Label>
                  <Input type="date" value={measurementEndDate} onChange={(e) => setMeasurementEndDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nº medição</Label>
                  <Input value={measurementNumber} onChange={(e) => setMeasurementNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Revisão</Label>
                  <Input value={measurementRevision} onChange={(e) => setMeasurementRevision(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Modalidade</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={measurementMode}
                    onChange={(e) => setMeasurementMode(e.target.value as 'SERVICOS' | 'PRECO_GLOBAL_COM_ABATIMENTO')}
                  >
                    <option value="SERVICOS">Só serviços</option>
                    <option value="PRECO_GLOBAL_COM_ABATIMENTO">Preço global com abatimento</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>% acumulado anterior</Label>
                  <Input type="number" min={0} max={100} value={measurementPrevPercent} onChange={(e) => setMeasurementPrevPercent(Number(e.target.value || 0))} />
                </div>
                <div className="space-y-2">
                  <Label>% executado no período</Label>
                  <Input type="number" min={0} max={100} value={measurementExecPercent} onChange={(e) => setMeasurementExecPercent(Number(e.target.value || 0))} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Dados para emissão da Nota Fiscal</Label>
                  <Input value={measurementClient} onChange={(e) => setMeasurementClient(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Obra (editável)</Label>
                  <Input value={measurementWork} onChange={(e) => setMeasurementWork(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Contrato/O.S. (editável)</Label>
                  <Input value={measurementContractRef} onChange={(e) => setMeasurementContractRef(e.target.value)} />
                </div>
              </div>

              <div className="rounded-md border p-4 bg-muted/20 space-y-4">
                <h3 className="text-sm font-semibold text-primary">Objeto do Contrato</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Serviço (editável)</Label>
                    <Input value={measurementService} onChange={(e) => setMeasurementService(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantitativo (editável)</Label>
                    <Input placeholder="Ex: 100%, 1 und, 50h, 10m²" value={measurementQuantity} onChange={(e) => setMeasurementQuantity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor do contrato/venda (editável)</Label>
                    <Input type="number" min={0} value={measurementContractValue} onChange={(e) => setMeasurementContractValue(Number(e.target.value || 0))} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Responsável pela medição</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={measurementResponsible}
                    onChange={(e) => setMeasurementResponsible(e.target.value as 'SERGIO' | 'RODRIGO')}
                  >
                    <option value="SERGIO">SERGIO</option>
                    <option value="RODRIGO">RODRIGO</option>
                  </select>
                </div>
              </div>

              {measurementMode === 'PRECO_GLOBAL_COM_ABATIMENTO' && (
                <div className="space-y-3 rounded-md border p-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label>Materiais comprados pelo cliente - a abater</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddMaterialRow}>Adicionar linha</Button>
                  </div>
                  <div className="space-y-2">
                    {materialRows.map((row) => (
                      <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                        <div className="md:col-span-2">
                          <Input
                            placeholder="NF/Pedido (8)"
                            value={row.docNumber}
                            onChange={(e) => handleMaterialRowChange(row.id, 'docNumber', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-7">
                          <Input
                            placeholder="Descrição do material"
                            value={row.description}
                            onChange={(e) => handleMaterialRowChange(row.id, 'description', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Input
                            type="number"
                            min={0}
                            placeholder="Valor"
                            value={row.value}
                            onChange={(e) => handleMaterialRowChange(row.id, 'value', Number(e.target.value || 0))}
                          />
                        </div>
                        <div className="md:col-span-1">
                          <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveMaterialRow(row.id)}>X</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 rounded-md border p-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label>Serviços complementares (adição ao valor da medição)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddComplementaryRow}>Adicionar linha</Button>
                </div>
                <div className="space-y-2">
                  {complementaryRows.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-1 px-1">
                      <div className="md:col-span-5 text-xs font-semibold text-muted-foreground">Descrição</div>
                      <div className="md:col-span-2 text-xs font-semibold text-muted-foreground">Vlr. Unitário</div>
                      <div className="md:col-span-2 text-xs font-semibold text-muted-foreground">Qtd.</div>
                      <div className="md:col-span-2 text-xs font-semibold text-muted-foreground">Total</div>
                      <div className="md:col-span-1"></div>
                    </div>
                  )}
                  {complementaryRows.map((row) => (
                    <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      <div className="md:col-span-5">
                        <Input
                          placeholder="Descrição do serviço complementar"
                          value={row.description}
                          onChange={(e) => handleComplementaryRowChange(row.id, 'description', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Valor unitário"
                          value={row.unitValue}
                          onChange={(e) => handleComplementaryRowChange(row.id, 'unitValue', Number(e.target.value || 0))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          type="number"
                          min={1}
                          placeholder="Qtd"
                          value={row.quantity}
                          onChange={(e) => handleComplementaryRowChange(row.id, 'quantity', Number(e.target.value || 1))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          type="number"
                          disabled
                          placeholder="Total"
                          value={row.totalValue}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveComplementaryRow(row.id)}>X</Button>
                      </div>
                    </div>
                  ))}
                  {complementaryRows.length > 0 && (
                    <div className="flex justify-end pt-2">
                      <p className="text-sm font-semibold">Total Adicional: {measurementComplementaryTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                <div className="space-y-2">
                  <Label>Endereço completo da empresa (editável)</Label>
                  <Textarea rows={4} value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Dados bancários para pagamento (editável)</Label>
                  <Textarea rows={4} value={companyBankData} onChange={(e) => setCompanyBankData(e.target.value)} />
                </div>
              </div>
              <div className="pt-6 border-t">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" /> Dados Adicionais de Faturamento (Opcional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Razão Social / Nome</Label>
                    <Input value={billingClientName} onChange={(e) => setBillingClientName(e.target.value)} placeholder="Ex: Cliente Exemplo LTDA" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">CNPJ / CPF</Label>
                    <Input value={billingClientTaxId} onChange={(e) => setBillingClientTaxId(e.target.value)} placeholder="00.000.000/0001-00" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Endereço Padrão</Label>
                    <Input value={billingClientAddress} onChange={(e) => setBillingClientAddress(e.target.value)} placeholder="Rua Exemplo, 123..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Observações para Faturamento (Máx. 200 caracteres)</Label>
                  <Textarea 
                    value={billingNotes} 
                    onChange={(e) => setBillingNotes(e.target.value.slice(0, 200))} 
                    placeholder="Notas que aparecerão no faturamento e PDF..." 
                    className="h-20"
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{billingNotes.length}/200</p>
                </div>
              </div>

              {/* Resumo de Valores Ponderados */}
              <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-center md:text-left">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Resumo da Medição</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold text-primary">
                        {((measurementContractValue * (measurementExecPercent / 100)) - materialRows.reduce((acc, r) => acc + (r.value || 0), 0) + complementaryRows.reduce((acc, r) => acc + (r.totalValue || 0), 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <Badge variant="secondary" className="bg-primary/20 text-primary border-none">
                        {measurementExecPercent}% Medido
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Base ({measurementExecPercent}%)</p>
                      <p className="font-semibold">{(measurementContractValue * (measurementExecPercent / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Deduções</p>
                      <p className="font-semibold text-destructive">(- {materialRows.reduce((acc, r) => acc + (r.value || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Acréscimos</p>
                      <p className="font-semibold text-green-600">(+ {complementaryRows.reduce((acc, r) => acc + (r.totalValue || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t mt-6">
                <Button type="button" variant="outline" onClick={handleNewMeasurement}>Nova Medição</Button>
                <Button type="button" variant="outline" onClick={() => setIsMeasurementHistoryModalOpen(true)}>Mostrar histórico</Button>
                <Button type="button" variant="secondary" onClick={handlePrintMeasurementPdf}>Gerar PDF</Button>
                <Button type="button" onClick={handleSaveMeasurement} disabled={isSavingMeasurement}>
                  {isSavingMeasurement ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                  ) : (
                    selectedMeasurementId ? "Atualizar medição" : "Salvar medição"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prévia do Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="rounded-md border p-3 space-y-2">
                <p className="font-semibold">Boletim de Medição Nº {measurementNumber} - {measurementRevision.toUpperCase()}</p>
                <p><span className="font-medium">Projeto:</span> {measurementProject || '-'}</p>
                <p><span className="font-medium">Contrato/O.S.:</span> {measurementContractRef || '-'}</p>
                <p><span className="font-medium">Cliente:</span> {measurementClient || '-'}</p>
                <p><span className="font-medium">Serviço:</span> {measurementService || '-'}</p>
                <p><span className="font-medium">Modalidade:</span> {measurementMode === 'SERVICOS' ? 'Só serviços' : 'Preço global com abatimento'}</p>
                <p><span className="font-medium">% acumulado:</span> {measurementAccumulatedPercent.toFixed(2)}%</p>
                <p><span className="font-medium">Responsável:</span> {measurementResponsible} | {responsibleContact.email} | {responsibleContact.phone}</p>
                <p><span className="font-medium">Valor serviços (período):</span> {measurementServicePeriodValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                {measurementMode === 'PRECO_GLOBAL_COM_ABATIMENTO' && (
                  <p><span className="font-medium">Abatimento materiais:</span> {measurementDeductionPeriod.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                )}
                <p><span className="font-medium">Serviços complementares:</span> {measurementComplementaryTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p className="font-semibold border-t pt-2"><span>Total da medição:</span> {measurementTotalPeriod.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p><span className="font-medium">Empresa:</span> {measurementCompany.legalName}</p>
                <p><span className="font-medium">Documento:</span> {measurementCompany.taxId}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card id="cobranca" className="border-amber-500/20">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-600">
            <AlertTriangle className="mr-2" /> Controle de Cobrança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead className="text-right">Atraso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSales.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell>{s.seller}</TableCell>
                  <TableCell>{s.project}</TableCell>
                  <TableCell className="text-right text-destructive font-bold">{s.daysPending} dias</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isBillingHistoryOpen} onOpenChange={setIsBillingHistoryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Histórico de faturamento</AlertDialogTitle>
            <AlertDialogDescription>
              Já existem solicitações anteriores para esta venda. Revise os valores e datas antes de continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            {billingHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum histórico encontrado.</p>
            ) : (
              <div className="space-y-2">
                {billingHistory.map((log) => (
                  <div key={log.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">Solicitação em {log.requestedAt?.toDate ? format(log.requestedAt.toDate(), 'dd/MM/yyyy HH:mm') : '---'}</p>
                        <p className="text-xs text-muted-foreground">Solicitado por: {log.requestedBy}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{log.billingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p className="text-xs text-muted-foreground">Para: {log.recipientEmail}</p>
                      </div>
                    </div>
                    {log.billingInfo && (
                      <p className="mt-2 text-xs text-muted-foreground">Obs: {log.billingInfo}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction onClick={() => setIsBillingHistoryOpen(false)}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={measurementAlertOpen} onOpenChange={setMeasurementAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aviso: Medição Anterior Encontrada</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe pelo menos uma medição salva para este projeto. Deseja visualizar o histórico antes de prosseguir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMeasurementAlertOpen(false)}>Agora não</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setMeasurementAlertOpen(false); setIsMeasurementHistoryModalOpen(true); }}>
              Ver Histórico
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMeasurementHistoryModalOpen} onOpenChange={setIsMeasurementHistoryModalOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Histórico Global de Medições</AlertDialogTitle>
            <AlertDialogDescription>
              Visualize todas as medições cadastradas. Use a busca para encontrar clientes ou projetos específicos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por cliente, projeto ou O.S..." 
              value={historySearchTerm} 
              onChange={(e) => setHistorySearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-3">
              {(measurements || [])
                .filter(m => {
                  const term = historySearchTerm.toLowerCase();
                  return (m.client || '').toLowerCase().includes(term) || 
                         (m.work || '').toLowerCase().includes(term) || 
                         (m.contractRef || '').toLowerCase().includes(term) ||
                         (m.number || '').includes(term);
                })
                .map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{m.client}</p>
                        <Badge variant="outline" className="text-[10px]">{m.work}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Medição Nº {m.number} ({m.revision.toUpperCase()}) | {format(parseISO(m.date), 'dd/MM/yyyy')}</p>
                      <p className="text-xs font-medium text-primary mt-1">Total: {((m.contractValue * (m.execPercent / 100)) - (m.materialRows?.reduce((acc, r) => acc + (r.value || 0), 0) || 0) + (m.complementaryRows?.reduce((acc, r) => acc + (r.totalValue || 0), 0) || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => loadMeasurement(m)}>Carregar</Button>
                      <Button variant="outline" size="sm" onClick={() => { loadMeasurement(m); setTimeout(handlePrintMeasurementPdf, 100); }}>Reimprimir</Button>
                    </div>
                  </div>
                ))}
              {(measurements || []).length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhuma medição encontrada no banco de dados.</p>
              )}
            </div>
          </ScrollArea>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setHistorySearchTerm('')}>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #faturamento-printable-area, #faturamento-printable-area * { visibility: visible; }
          #faturamento-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-size: 9pt;
          }
          .print-hide { display: none !important; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>
    </div>
  );
}
