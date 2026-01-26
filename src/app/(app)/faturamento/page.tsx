
// src/app/(app)/faturamento/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useSales } from '@/hooks/use-sales';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, Send, Printer, DollarSign, AlertTriangle, CheckCircle, Info, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Sale } from '@/lib/types';
import { format, parseISO, isBefore, subDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PendingSale = Sale & { daysPending: number };

export default function FaturamentoPage() {
  const { sales, loading: salesLoading } = useSales();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  const [billingInfo, setBillingInfo] = useState('');
  const [billingAmount, setBillingAmount] = useState<number | string>('');
  const [recipientEmail, setRecipientEmail] = useState('');

  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);

  useEffect(() => {
    // Clear selected sale and form if search results change (e.g. new search)
    setSelectedSale(null);
    setBillingInfo('');
    setBillingAmount('');
    setRecipientEmail('');
  }, [searchResults]);

  useEffect(() => {
    if (!salesLoading) {
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);
        const filtered = sales.filter(sale => {
            try {
                const saleDate = parseISO(sale.date);
                const isPendingPayment = sale.payment < sale.salesValue;
                const isPendingStatus = sale.status === 'Á INICAR' || sale.status === 'EM ANDAMENTO';
                const isOlderThan30Days = isBefore(saleDate, thirtyDaysAgo);
                return isPendingPayment && isPendingStatus && isOlderThan30Days;
            } catch (e) {
                console.error(`Could not parse date for sale ${sale.id}: ${sale.date}`);
                return false;
            }
        });
        
        const salesWithDaysPending = filtered.map(sale => ({
            ...sale,
            daysPending: differenceInDays(today, parseISO(sale.date))
        }));

        salesWithDaysPending.sort((a, b) => b.daysPending - a.daysPending);
        
        setPendingSales(salesWithDaysPending);
    }
  }, [sales, salesLoading]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSelectedSale(null);
      return;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = sales.filter(sale =>
      sale.project.toLowerCase().includes(lowerSearchTerm) ||
      sale.os.toLowerCase().includes(lowerSearchTerm) ||
      sale.company.toLowerCase().includes(lowerSearchTerm) ||
      sale.clientService.toLowerCase().includes(lowerSearchTerm)
    );
    setSearchResults(filtered);
    if (filtered.length === 0) {
        setSelectedSale(null);
    }
  };

  const handleSelectSale = (sale: Sale) => {
    setSelectedSale(sale);
    setBillingInfo('');
    setBillingAmount(sale.salesValue);
    setRecipientEmail('');
  };

  const handleSendEmail = () => {
    if (!selectedSale) {
      toast({ title: "Erro", description: "Nenhuma venda selecionada.", variant: "destructive" });
      return;
    }
    if (!recipientEmail) {
      toast({ title: "Erro", description: "Por favor, insira o e-mail do destinatário.", variant: "destructive" });
      return;
    }
    if (billingAmount === '' || isNaN(Number(billingAmount)) || Number(billingAmount) <= 0) {
      toast({ title: "Erro", description: "Por favor, insira um valor a faturar válido.", variant: "destructive" });
      return;
    }

    const subject = `Faturamento: Venda ${selectedSale.project} / OS ${selectedSale.os}`;
    const body = `
Prezados,

Seguem os dados para faturamento da venda abaixo:

Detalhes da Venda:
--------------------------------------------------
Data: ${format(parseISO(selectedSale.date), 'dd/MM/yyyy', { locale: ptBR })}
Vendedor: ${selectedSale.seller}
Empresa: ${selectedSale.company}
Projeto: ${selectedSale.project}
O.S.: ${selectedSale.os}
Área: ${selectedSale.area}
Cliente/Serviço: ${selectedSale.clientService}
Valor da Venda: ${selectedSale.salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
Status: ${selectedSale.status}
Pagamento Registrado: ${selectedSale.payment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
--------------------------------------------------

Informações de Faturamento Adicionais:
--------------------------------------------------
${billingInfo || "Nenhuma informação adicional."}
--------------------------------------------------

Valor a Faturar: ${Number(billingAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
--------------------------------------------------

Atenciosamente,
Equipe Comercial ENGEAR
    `;

    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
    toast({ title: "Sucesso", description: "Seu cliente de e-mail foi aberto para enviar os dados." });
  };
  
  const handlePrint = (printArea: 'main' | 'pending') => {
    if (printArea === 'main') {
        document.body.classList.add('printing-main-faturamento');
    } else {
        document.body.classList.add('printing-pending-faturamento');
    }
    window.print();
    if (printArea === 'main') {
        document.body.classList.remove('printing-main-faturamento');
    } else {
        document.body.classList.remove('printing-pending-faturamento');
    }
  };

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div id="faturamento-printable-area">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 print-hide">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
              <Receipt className="mr-3 h-8 w-8" /> FATURAMENTO
            </h1>
            <p className="text-muted-foreground">
              Localize uma venda, adicione informações e prepare para faturamento.
            </p>
          </div>
          <Button onClick={() => handlePrint('main')} variant="outline" size="icon" disabled={!selectedSale}>
            <Printer className="h-4 w-4" />
            <span className="sr-only">Imprimir</span>
          </Button>
        </div>

        <Card className="shadow-lg print-hide">
          <CardHeader>
            <CardTitle>Buscar Venda</CardTitle>
            <CardDescription>Digite termos como nome do projeto, O.S., empresa ou cliente.</CardDescription>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar vendas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 w-full"
                />
              </div>
              <Button onClick={handleSearch} className="w-full sm:w-auto">
                <Search className="mr-2 h-4 w-4" /> Buscar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {salesLoading && <p>Carregando dados de vendas...</p>}
            {!salesLoading && searchResults.length === 0 && searchTerm && (
              <div className="flex flex-col items-center justify-center h-40 text-center p-4 border border-dashed rounded-lg">
                <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhuma venda encontrada para "{searchTerm}".</p>
              </div>
            )}
            {!salesLoading && searchResults.length > 0 && (
              <ScrollArea className="h-[250px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((sale) => (
                      <TableRow key={sale.id} 
                                className={`cursor-pointer hover:bg-muted ${selectedSale?.id === sale.id ? 'bg-muted font-semibold' : ''}`}
                                onClick={() => handleSelectSale(sale)}>
                        <TableCell>{format(parseISO(sale.date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                        <TableCell className="max-w-[150px] sm:max-w-[200px] truncate" title={sale.project}>{sale.project}</TableCell>
                        <TableCell>{sale.company}</TableCell>
                        <TableCell>{formatCurrency(sale.salesValue)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant={selectedSale?.id === sale.id ? "default" : "outline"} size="sm" className="w-full sm:w-auto">
                            {selectedSale?.id === sale.id ? <CheckCircle className="mr-1 h-4 w-4" /> : <Info className="mr-1 h-4 w-4" />}
                            {selectedSale?.id === sale.id ? "Selecionada" : "Selecionar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {selectedSale && (
          <Card className="shadow-lg mt-6 printable-content">
            <CardHeader>
              <CardTitle className="text-2xl">Detalhes da Venda Selecionada</CardTitle>
              <CardDescription>Projeto: {selectedSale.project} / O.S.: {selectedSale.os}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <p><strong className="font-medium text-muted-foreground">Data:</strong> {format(parseISO(selectedSale.date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                <p><strong className="font-medium text-muted-foreground">Vendedor:</strong> {selectedSale.seller}</p>
                <p><strong className="font-medium text-muted-foreground">Empresa:</strong> {selectedSale.company}</p>
                <p><strong className="font-medium text-muted-foreground">Projeto:</strong> {selectedSale.project}</p>
                <p><strong className="font-medium text-muted-foreground">O.S.:</strong> {selectedSale.os}</p>
                <p><strong className="font-medium text-muted-foreground">Área:</strong> {selectedSale.area}</p>
                <p><strong className="font-medium text-muted-foreground">Cliente/Serviço:</strong> {selectedSale.clientService}</p>
                <p><strong className="font-medium text-muted-foreground">Status:</strong> {selectedSale.status}</p>
                <p><strong className="font-medium text-muted-foreground">Valor da Venda:</strong> {formatCurrency(selectedSale.salesValue)}</p>
                <p><strong className="font-medium text-muted-foreground">Pagamento Registrado:</strong> {formatCurrency(selectedSale.payment)}</p>
              </div>
              
              <hr className="my-4"/>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="billingInfo" className="text-base font-semibold">INFORMAÇÕES DE FATURAMENTO</Label>
                  <Textarea
                    id="billingInfo"
                    placeholder="Insira aqui observações, dados bancários, condições de pagamento, etc."
                    value={billingInfo}
                    onChange={(e) => setBillingInfo(e.target.value)}
                    maxLength={300}
                    className="mt-1 min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">{billingInfo.length} / 300 caracteres</p>
                </div>

                <div>
                  <Label htmlFor="billingAmount" className="text-base font-semibold">VALOR Á FATURAR</Label>
                  <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="billingAmount"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={billingAmount}
                        onChange={(e) => setBillingAmount(e.target.value)}
                        className="pl-8"
                      />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="recipientEmail" className="text-base font-semibold">ENVIAR PARA O E-MAIL</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="print-hide border-t pt-4">
              <Button onClick={handleSendEmail} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                <Send className="mr-2 h-4 w-4" /> Enviar Dados por E-mail
              </Button>
            </CardFooter>
          </Card>
        )}
        {!selectedSale && searchResults.length > 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center p-4 border border-dashed rounded-lg mt-6 print-hide">
              <Info className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Selecione uma venda da lista acima para ver os detalhes e adicionar informações de faturamento.</p>
          </div>
        )}
      </div>

      {/* Seção de Controle de Cobrança */}
      <Card className="shadow-lg mt-8" id="cobranca">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <AlertTriangle className="mr-3 h-7 w-7 text-amber-500" />
            Controle de Cobrança
          </CardTitle>
          <CardDescription>
            Vendas com mais de 30 dias, status "À Iniciar" ou "Em Andamento", e com pagamento pendente (parcial ou total).
            Atualmente, há <span className="font-bold text-foreground">{pendingSales.length}</span> venda(s) nesta condição.
          </CardDescription>
        </CardHeader>
        <CardContent id="pending-billing-printable-area">
          <CardTitle className="text-lg font-semibold mb-4 print-only">Relatório de Cobrança</CardTitle>
          {salesLoading ? (
            <p>Analisando dados...</p>
          ) : pendingSales.length > 0 ? (
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead className="text-right">Valor Venda</TableHead>
                    <TableHead className="text-right">Valor Pago</TableHead>
                    <TableHead className="text-center">Dias Atraso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-muted/50">
                      <TableCell>{format(parseISO(sale.date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                      <TableCell>{sale.seller}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={sale.project}>{sale.project}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.salesValue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.payment)}</TableCell>
                      <TableCell className="text-center font-bold text-destructive">{sale.daysPending}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center p-4 border border-dashed rounded-lg">
                <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                <p className="text-muted-foreground">Excelente! Nenhuma venda encontrada com faturamento atrasado.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="print-hide border-t pt-4">
          <Button onClick={() => handlePrint('pending')} disabled={pendingSales.length === 0}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir Lista de Cobrança
          </Button>
        </CardFooter>
      </Card>


      <style jsx global>{`
        .print-only {
            display: none;
        }
        @media print {
          .print-hide {
            display: none !important;
          }
          .print-only {
            display: block;
          }

          /* Regras para impressão do Faturamento Principal */
          body.printing-main-faturamento * {
            visibility: hidden;
          }
          body.printing-main-faturamento #faturamento-printable-area, 
          body.printing-main-faturamento #faturamento-printable-area * {
            visibility: visible;
          }
          body.printing-main-faturamento .printable-content, 
          body.printing-main-faturamento .printable-content * {
            visibility: visible;
          }
          body.printing-main-faturamento #faturamento-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 15mm;
            font-size: 10pt;
          }
          
          /* Regras para impressão da Lista de Cobrança */
          body.printing-pending-faturamento * {
            visibility: hidden;
          }
          body.printing-pending-faturamento #pending-billing-printable-area,
          body.printing-pending-faturamento #pending-billing-printable-area * {
            visibility: visible;
          }
          body.printing-pending-faturamento #pending-billing-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 15mm;
            font-size: 9pt;
          }

          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          .card-header, .card-content, .card-footer {
            border: none !important;
            box-shadow: none !important;
          }
           hr {
            border-color: #ccc !important;
            margin-top: 10px !important;
            margin-bottom: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
