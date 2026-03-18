'use client';
import { useMemo, useState } from 'react';
import { useSales } from '@/hooks/use-sales';
import { normalizeSaleStatus } from '@/lib/normalizers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

export default function AuditPage() {
  const { sales, updateSale, loading } = useSales();
  const { toast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);

  const salesToMigrate = useMemo(() => {
    return (sales || []).filter(s => {
      // Find rows that haven't been normalized yet in the DB
      // We look for the literal string "AGUARDANDO PAGAMENTO" or "FINALIZADO"
      return s.status === 'AGUARDANDO PAGAMENTO' || s.status === 'FINALIZADO';
    });
  }, [sales]);

  const handleMigrateAll = async () => {
    if (!salesToMigrate.length) return;
    setIsMigrating(true);
    try {
      let count = 0;
      for (const sale of salesToMigrate) {
        await updateSale(sale.id, { status: 'FINALIZADA' as any });
        count++;
      }
      toast({ 
        title: 'Migração Concluída', 
        description: `${count} vendas foram atualizadas para "FINALIZADA" com sucesso.` 
      });
    } catch (error) {
      console.error(error);
      toast({ 
        title: 'Erro na Migração', 
        description: 'Houve um erro ao tentar atualizar algumas vendas.', 
        variant: 'destructive' 
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria de Dados</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
            <AlertCircle className="h-4 w-4" /> 
            Consolidação de Status para o novo padrão financeiro.
          </p>
        </div>
      </div>

      <Card className={salesToMigrate.length > 0 ? "border-amber-200 bg-amber-50/30" : "border-emerald-200 bg-emerald-50/30"}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {salesToMigrate.length > 0 ? (
                  <>
                    <AlertCircle className="text-amber-600 h-5 w-5" />
                    Atenção: Vendas com Status Antigo
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="text-emerald-600 h-5 w-5" />
                    Banco de Dados Sincronizado
                  </>
                )}
              </CardTitle>
              <CardDescription className="mt-2">
                {salesToMigrate.length > 0 
                  ? `Foram encontradas ${salesToMigrate.length} vendas que utilizam os status "AGUARDANDO PAGAMENTO" ou "FINALIZADO".`
                  : "Não há vendas com status pendentes de migração para o novo padrão."}
              </CardDescription>
            </div>
            {salesToMigrate.length > 0 && (
              <Button onClick={handleMigrateAll} disabled={isMigrating} className="bg-amber-600 hover:bg-amber-700">
                {isMigrating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                Corrigir Todas Agora
              </Button>
            )}
          </div>
        </CardHeader>
        {salesToMigrate.length > 0 && (
          <CardContent>
            <div className="rounded-md border bg-white max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>O.S.</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status Atual</TableHead>
                    <TableHead className="text-right">Novo Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesToMigrate.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.project}</TableCell>
                      <TableCell>{s.os}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{s.clientService}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">FINALIZADA</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>
      
      <div className="text-xs text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <p className="font-semibold mb-1">Por que corrigir?</p>
        <p>No novo padrão do sistema, vendas concluídas são marcadas como <strong>FINALIZADA</strong> e são automaticamente consideradas como <strong>100% recebidas</strong> no Dashboard para fins de relatório financeiro. A migração garante que seus dados históricos reflitam corretamente esse novo comportamento.</p>
      </div>
    </div>
  );
}
