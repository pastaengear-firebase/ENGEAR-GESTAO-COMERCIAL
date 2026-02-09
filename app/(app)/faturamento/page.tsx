'use client';
import { useState, useMemo } from 'react';
import { format, parseISO, isBefore, subDays, differenceInDays } from 'date-fns';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Receipt, Search, Send, AlertTriangle, Loader2 } from 'lucide-react';
import { useSales } from '@/hooks/use-sales';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import type { Sale, BillingLog } from '@/lib/types';

export default function FaturamentoPage() {
  const { sales, updateSale, userRole, user } = useSales();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [billingInfo, setBillingInfo] = useState('');
  const [billingAmount, setBillingAmount] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logsQuery = useMemo(() => firestore ? query(collection(firestore, 'billing-logs'), orderBy('requestedAt', 'desc')) : null, [firestore]);
  const { data: billingLogs } = useCollection<BillingLog>(logsQuery);

  const pendingSales = useMemo(() => {
    const limit = subDays(new Date(), 30);
    return sales.filter(s => {
        const isPending = s.payment < s.salesValue;
        const isProcess = s.status === 'Á INICAR' || s.status === 'EM ANDAMENTO';
        return isPending && isProcess && isBefore(parseISO(s.date), limit);
    }).map(s => ({ ...s, daysPending: differenceInDays(new Date(), parseISO(s.date)) })).sort((a,b) => b.daysPending - a.daysPending);
  }, [sales]);

  const handleSearch = () => {
    const term = searchTerm.toLowerCase();
    setSearchResults(sales.filter(s => s.project.toLowerCase().includes(term) || (s.os || '').toLowerCase().includes(term) || s.clientService.toLowerCase().includes(term)));
  };

  const handleSendEmail = async () => {
    if (!selectedSale || !user) return;
    if (!recipientEmail || !billingAmount) {
        toast({ title: "Erro", description: "Preencha valor e e-mail.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);
    try {
        await addDoc(collection(firestore!, 'billing-logs'), {
            saleId: selectedSale.id, saleData: selectedSale, billingInfo, billingAmount: Number(billingAmount),
            recipientEmail, requestedBy: userRole, requestedByUid: user.uid, requestedAt: serverTimestamp()
        });
        await updateSale(selectedSale.id, { status: "AGUARDANDO PAGAMENTO" });
        window.open(`mailto:${recipientEmail}?subject=FATURAMENTO: ${selectedSale.project}&body=Favor faturar ${Number(billingAmount).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`);
        toast({ title: "Sucesso", description: "Solicitação registrada." });
        setSelectedSale(null);
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
              <CardTitle>Buscar Venda</CardTitle>
              <div className="flex gap-2 mt-2">
                <Input placeholder="Projeto, OS ou Cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                <Button onClick={handleSearch}><Search className="h-4 w-4 mr-2" /> Buscar</Button>
              </div>
            </CardHeader>
            <CardContent>
              {searchResults.length > 0 && (
                <ScrollArea className="h-48 border rounded-md">
                  <Table>
                    <TableBody>
                      {searchResults.map(s => (
                        <TableRow key={s.id} className="cursor-pointer" onClick={() => { setSelectedSale(s); setBillingAmount(String(s.salesValue - s.payment)); }}>
                          <TableCell>{s.project}</TableCell>
                          <TableCell>{s.clientService}</TableCell>
                          <TableCell className="text-right">{(s.salesValue - s.payment).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {selectedSale && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader><CardTitle>Solicitar Faturamento</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Projeto:</strong> {selectedSale.project}</div>
                  <div><strong>Saldo:</strong> {(selectedSale.salesValue - selectedSale.payment).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</div>
                </div>
                <div className="space-y-2">
                  <Label>Valor a Faturar</Label>
                  <Input type="number" value={billingAmount} onChange={e => setBillingAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail do Destinatário</Label>
                  <Input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="financeiro@..." />
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
                    <TableRow><TableHead>Data</TableHead><TableHead>Vendedor</TableHead><TableHead>Projeto</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingLogs?.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>{log.requestedAt?.toDate ? format(log.requestedAt.toDate(), 'dd/MM/yy HH:mm') : '...'}</TableCell>
                        <TableCell>{log.requestedBy}</TableCell>
                        <TableCell>{log.saleData.project}</TableCell>
                        <TableCell className="text-right">{log.billingAmount.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</TableCell>
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
        <CardHeader><CardTitle className="flex items-center text-amber-600"><AlertTriangle className="mr-2" /> Controle de Cobrança</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Vendedor</TableHead><TableHead>Projeto</TableHead><TableHead className="text-right">Atraso</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {pendingSales.map(s => (
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
