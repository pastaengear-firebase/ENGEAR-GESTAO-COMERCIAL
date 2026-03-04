'use client';
import { useState, useMemo } from 'react';
import { format, parseISO, isBefore, subDays, differenceInDays } from 'date-fns';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Receipt, Search, Send, AlertTriangle, Loader2, Link as LinkIcon } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import type { Sale, BillingLog } from '@/lib/types';
import { ALL_SELLERS_OPTION } from '@/lib/constants';

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
        const isProcess = s.status === 'A INICIAR' || s.status === 'EM ANDAMENTO';
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

  const getStatusBadgeVariant = (status: Sale['status']): React.ComponentProps<typeof Badge>['variant'] => {
    switch (status) {
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

      const subject = `FATURAMENTO - OS ${selectedSale.os || 'NÃO INFORMADO'} - ${selectedSale.project || 'NÃO INFORMADO'} - Empresa ${selectedSale.company || 'NÃO INFORMADO'}`;

      const pdfUrl = (selectedSale as any).attachmentUrl as string | undefined;
      const pdfLine = pdfUrl ? `PDF: ${pdfUrl}` : `PDF: (sem)`;

      const body = [
        `Solicitação de faturamento`,
        ``,
        `Projeto: ${selectedSale.project || 'NÃO INFORMADO'}`,
        `OS: ${selectedSale.os || 'NÃO INFORMADO'}`,
        `Cliente/Serviço: ${selectedSale.clientService || 'NÃO INFORMADO'}`,
        `Área: ${selectedSale.area || 'NÃO INFORMADA'}`,
        `Vendedor: ${selectedSale.seller || 'NÃO INFORMADO'}`,
        ``,
        `Valor a faturar: ${amountBRL}`,
        pdfLine,
        ``,
        billingInfo?.trim() ? `Observações: ${billingInfo.trim()}` : `Observações: (sem)`,
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center"><Receipt className="mr-2" /> FATURAMENTO</h1>

      <Tabs defaultValue="request">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="request">Solicitar</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendas (lista)</CardTitle>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Buscar por projeto, empresa, O.S., cliente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <Button variant="secondary" type="button">
                  <Search className="h-4 w-4 mr-2" /> Filtrar
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
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Data</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>O.S.</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Cliente/Serviço</TableHead>
                      <TableHead className="text-right">Valor Venda</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Pagamento</TableHead>
                      <TableHead>PDF</TableHead>
                      <TableHead className="text-right">Faturar</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredSales.map((s) => {
                      const pdfUrl = (s as any).attachmentUrl as string | undefined;

                      return (
                        <TableRow key={s.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>{format(parseISO(s.date), 'dd/MM/yy')}</TableCell>
                          <TableCell>{s.seller}</TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate" title={s.company}>{s.company}</TableCell>
                          <TableCell className="max-w-[140px] truncate" title={s.project}>{s.project}</TableCell>
                          <TableCell className="max-w-[120px] truncate" title={s.os}>{s.os}</TableCell>
                          <TableCell className="max-w-[140px] truncate" title={s.area}>{s.area}</TableCell>
                          <TableCell className="max-w-[240px] truncate" title={s.clientService}>{s.clientService}</TableCell>
                          <TableCell className="text-right">
                            {s.salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(s.status)} className="capitalize">
                              {s.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {s.payment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell>
                            {pdfUrl ? (
                              <Button asChild variant="outline" size="sm">
                                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                                  <LinkIcon className="mr-2 h-4 w-4" /> Ver PDF
                                </a>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground/70 italic">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              onClick={() => handleSelectSale(s)}
                              disabled={!canRequestBilling}
                            >
                              <Send className="mr-2 h-4 w-4" /> Faturar
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
    </div>
  );
}
