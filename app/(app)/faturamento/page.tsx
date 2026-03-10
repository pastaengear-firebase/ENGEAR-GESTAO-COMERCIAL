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
import type { Sale, BillingLog } from '@/lib/types';
import { ALL_SELLERS_OPTION } from '@/lib/constants';
import { normalizeSaleStatus } from '@/lib/normalizers';

type MeasurementMode = 'SERVICOS' | 'PRECO_GLOBAL_COM_ABATIMENTO';

type MaterialDeductionRow = {
  id: string;
  docNumber: string;
  description: string;
  value: number;
};

const COMPANY_PROFILE: Record<'ENGEAR' | 'CLIMAZONE', { legalName: string; taxId: string; address: string; bankData: string }> = {
  ENGEAR: {
    legalName: 'Engear Engenharia de Aquecimento e Refrigeração LTDA',
    taxId: 'CNPJ: 00.976.914/0001-92 | Inscrição Estadual PB: 16.137.828-5',
    address: 'Avenida Cel. Estevão D\'avila Lins, N. 780\nCruz das Armas - João Pessoa PB\nCEP: 58085-010',
    bankData: 'ENGEAR ENGENHARIA DE AQ. E REF. LTDA - CNPJ: 00.976.914./0001-92\nBanco N. 104 - Caixa Econômica Federal - Agência: 1033 - Conta Corrente 1024-0 Operação: 003\nOu via PIX, chave CNPJ: 00.976.914./0001-92',
  },
  CLIMAZONE: {
    legalName: 'Engear Climazone Comercio e Serviços Térmicos LTDA',
    taxId: 'CNPJ: 09.575.551/0001-58 | Inscrição Estadual PB: 16.156.531-0',
    address: 'Avenida Jose Vasconcelos Maia, N. 134\nParque Esperança - Cabedelo, PB\nCEP: 58108-540',
    bankData: 'ENGEAR CLIMAZONE COM. E SERV. TÉRMICOS LTDA - CNPJ: 09.575.551/0001-58\nBanco 104 - Caixa Econômica Federal - Agência: 1033 Conta Corrente: 2678-3 Operação: 03\nOu via PIX, chave CNPJ: 09.575.551/0001-58',
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
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>('SERVICOS');
  const [measurementClient, setMeasurementClient] = useState('');
  const [measurementWork, setMeasurementWork] = useState('');
  const [measurementContractRef, setMeasurementContractRef] = useState('');
  const [measurementService, setMeasurementService] = useState('');
  const [measurementContractValue, setMeasurementContractValue] = useState<number>(0);
  const [measurementExecPercent, setMeasurementExecPercent] = useState<number>(100);
  const [measurementPrevPercent, setMeasurementPrevPercent] = useState<number>(0);
  const [measurementResponsible, setMeasurementResponsible] = useState<'SERGIO' | 'RODRIGO'>('SERGIO');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyBankData, setCompanyBankData] = useState('');
  const [materialRows, setMaterialRows] = useState<MaterialDeductionRow[]>([
    { id: '1', docNumber: '', description: '', value: 0 },
  ]);


  const billingEnabled = settings?.enableBillingEmailNotifications ?? false;
  const billingEmails = settings?.billingNotificationEmails ?? [];
  const hasBillingEmails = Array.isArray(billingEmails) && billingEmails.length > 0;

  const logsQuery = useMemo(
    () => firestore ? query(collection(firestore, 'billing-logs'), orderBy('requestedAt', 'desc')) : null,
    [firestore]
  );
  const { data: billingLogs } = useCollection<BillingLog>(logsQuery);

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
    return sales[0] || null;
  }, [sales, measurementSaleId]);

  useEffect(() => {
    if (!measurementSale) return;
    setMeasurementClient((prev) => prev || measurementSale.clientService || '');
    setMeasurementWork((prev) => prev || measurementSale.project || '');
    setMeasurementContractRef((prev) => prev || measurementSale.os || '');
    setMeasurementService((prev) => prev || measurementSale.clientService || '');
    setMeasurementContractValue((prev) => (prev > 0 ? prev : measurementSale.salesValue || 0));
    setMeasurementResponsible(measurementSale.seller === 'RODRIGO' ? 'RODRIGO' : 'SERGIO');

    const companyKey = measurementSale.company === 'CLIMAZONE' ? 'CLIMAZONE' : 'ENGEAR';
    setCompanyAddress((prev) => prev || COMPANY_PROFILE[companyKey].address);
    setCompanyBankData((prev) => prev || COMPANY_PROFILE[companyKey].bankData);
  }, [measurementSale]);

  const measurementUnitValue = measurementContractValue;
  const measurementProject = measurementWork;
  const measurementAccumulatedPercent = Math.max(0, Math.min(100, measurementPrevPercent + measurementExecPercent));
  const measurementServicePeriodValue = Math.max(0, measurementUnitValue * (measurementExecPercent / 100));
  const measurementDeductionPeriod = measurementMode === 'PRECO_GLOBAL_COM_ABATIMENTO'
    ? materialRows.reduce((sum, row) => sum + Math.max(0, row.value || 0), 0)
    : 0;
  const measurementTotalPeriod = Math.max(0, measurementServicePeriodValue - measurementDeductionPeriod);
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

  const handlePrintMeasurementPdf = () => {
    const w = window.open('', '_blank', 'width=1024,height=768');
    if (!w) return;

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

    const html = `
      <html>
        <head>
          <title>Boletim de Medição ${measurementNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
            .logo { width: 180px; }
            .title { text-align: right; }
            .title h1 { margin: 0; font-size: 20px; }
            .title p { margin: 4px 0 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
            .box { border: 1px solid #999; border-radius: 6px; padding: 10px; }
            .box h3 { margin: 0 0 6px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #999; padding: 6px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; }
            .totals { margin-top: 12px; width: 360px; margin-left: auto; }
            .totals td { font-size: 13px; }
            .bold { font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header">
            <img class="logo" src="${window.location.origin}/novologoe.png" alt="Logo" />
            <div class="title">
              <h1>BOLETIM DE MEDIÇÃO Nº ${measurementNumber}</h1>
              <p>Revisão: ${measurementRevision.toUpperCase()} | Data: ${format(parseISO(measurementDate), 'dd/MM/yyyy')}</p>
            </div>
          </div>

          <div class="grid">
            <div class="box">
              <h3>Dados da Medição</h3>
              <p><strong>Cliente:</strong> ${measurementClient || '-'}</p>
              <p><strong>Obra:</strong> ${measurementProject || '-'}</p>
              <p><strong>Contrato/O.S.:</strong> ${measurementContractRef || '-'}</p>
              <p><strong>Serviço:</strong> ${measurementService || '-'}</p>
            </div>
            <div class="box">
              <h3>Responsável pela Medição</h3>
              <p><strong>${measurementResponsible}</strong></p>
              <p><strong>E-mail:</strong> ${responsibleContact.email}</p>
              <p><strong>Contato:</strong> ${responsibleContact.phone}</p>
            </div>
            <div class="box">
              <h3>Empresa Executora</h3>
              <p><strong>${measurementCompany.legalName}</strong></p>
              <p>${measurementCompany.taxId}</p>
              <p>${companyAddress.replace(/\n/g, '<br/>')}</p>
            </div>
            <div class="box">
              <h3>DADOS BANCÁRIOS PARA PAGAMENTO</h3>
              <p>${companyBankData.replace(/\n/g, '<br/>')}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>% Anterior</th>
                <th>% Período</th>
                <th>% Acumulado</th>
                <th>Valor Contrato</th>
                <th>Valor Serviços (Período)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${measurementPrevPercent.toFixed(2)}%</td>
                <td>${measurementExecPercent.toFixed(2)}%</td>
                <td>${measurementAccumulatedPercent.toFixed(2)}%</td>
                <td>${measurementUnitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td>${measurementServicePeriodValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
            </tbody>
          </table>

          ${measurementMode === 'PRECO_GLOBAL_COM_ABATIMENTO' ? `
          <table>
            <thead>
              <tr>
                <th>NF/Pedido (8 dígitos)</th>
                <th>Descrição do Material</th>
                <th style="text-align:right;">Valor a Abater</th>
              </tr>
            </thead>
            <tbody>
              ${materialRowsHtml || '<tr><td>-</td><td>-</td><td style="text-align:right;">R$ 0,00</td></tr>'}
            </tbody>
          </table>
          ` : ''}

          <table class="totals">
            <tbody>
              <tr><td>Valor serviços (período)</td><td style="text-align:right;">${measurementServicePeriodValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>
              <tr><td>Abatimento materiais</td><td style="text-align:right;">${measurementDeductionPeriod.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>
              <tr><td class="bold">Total da medição</td><td class="bold" style="text-align:right;">${measurementTotalPeriod.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };
  const pendingTotalValue = useMemo(
    () => pendingSales.reduce((sum, s: any) => sum + Math.max(0, (s.salesValue || 0) - (s.payment || 0)), 0),
    [pendingSales]
  );

  const getStatusBadgeVariant = (status: Sale['status']): React.ComponentProps<typeof Badge>['variant'] => {
    const normalizedStatus = normalizeSaleStatus(status);
    switch (normalizedStatus) {
      case 'FINALIZADO':
        return 'default';
      case 'A INICIAR':
      case 'EM ANDAMENTO':
      case 'AGUARDANDO PAGAMENTO':
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

      await updateSale(selectedSale.id, { status: "AGUARDANDO PAGAMENTO" });

      const amountBRL = Number(billingAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const requestDate = format(new Date(), 'dd/MM/yyyy');
      const appBaseUrl = window.location.origin;
      const billingLink = `${appBaseUrl}/faturamento`;
      const hasMeasurement = /medição|medicao/i.test(billingInfo || '');

      const subject = `SOLICITAÇÃO DE FATURAMENTO! ${selectedSale.company || 'NÃO INFORMADO'} PROJETO ${selectedSale.project || 'NÃO INFORMADO'} - O.S. N. ${selectedSale.os || 'NÃO INFORMADO'} - VALOR A FATURAR: ${amountBRL} - CLIENTE ${selectedSale.clientService || 'NÃO INFORMADO'} - VENDEDOR: ${selectedSale.seller || 'NÃO INFORMADO'}`;

      const hasPdf = Boolean((selectedSale as any).attachmentUrl);

      const body = [
        `Cliente: ${selectedSale.clientService || 'NÃO INFORMADO'}`,
        `Dados do Cliente: `,
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
        `Observações e orientações: ${billingInfo?.trim() || ''}`,
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
            Boletim (beta)
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
          <Card className="border-amber-400/40 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-base">Boletim de Medição (beta)</CardTitle>
              <p className="text-sm text-amber-700 font-medium">Em construção e testes</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Esta versão já permite montar uma medição básica para conferência do documento.
              </p>
            </CardContent>
          </Card>

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
                    value={measurementSale?.id || ''}
                    onChange={(e) => setMeasurementSaleId(e.target.value)}
                  >
                    {sales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.project} - {s.clientService}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Data da medição</Label>
                  <Input type="date" value={measurementDate} onChange={(e) => setMeasurementDate(e.target.value)} />
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
                  <Label>Cliente (editável)</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Serviço (editável)</Label>
                  <Input value={measurementService} onChange={(e) => setMeasurementService(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Valor do contrato/venda (editável)</Label>
                  <Input type="number" min={0} value={measurementContractValue} onChange={(e) => setMeasurementContractValue(Number(e.target.value || 0))} />
                </div>
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

              <div className="flex justify-end">
                <Button type="button" onClick={handlePrintMeasurementPdf}>Gerar PDF</Button>
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
                <p><span className="font-medium">Abatimento materiais:</span> {measurementDeductionPeriod.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
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
