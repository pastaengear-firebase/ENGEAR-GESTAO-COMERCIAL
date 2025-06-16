
// src/app/(app)/configuracoes/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Settings, Mail, Save, DatabaseZap, Trash2, FileText } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LOCAL_STORAGE_SALES_KEY, LOCAL_STORAGE_QUOTES_KEY } from '@/lib/constants';

export default function ConfiguracoesPage() {
  const { settings, updateSettings, loadingSettings } = useSettings();
  const { toast } = useToast();

  const [enableSalesNotifications, setEnableSalesNotifications] = useState(false);
  const [salesEmailList, setSalesEmailList] = useState('');
  const [enableProposalNotifications, setEnableProposalNotifications] = useState(false);
  // const [proposalEmailList, setProposalEmailList] = useState(''); // Futuro: se emails de proposta forem configuráveis

  useEffect(() => {
    if (!loadingSettings) {
      setEnableSalesNotifications(settings.enableEmailNotifications);
      setSalesEmailList(settings.notificationEmails.join(', '));
      setEnableProposalNotifications(settings.enableProposalEmailNotifications);
      // setProposalEmailList(settings.proposalNotificationEmails.join(', ')); // Futuro
    }
  }, [settings, loadingSettings]);

  const handleSaveNotificationSettings = () => {
    const salesEmails = salesEmailList
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    // const proposalEmails = proposalEmailList... // Futuro

    updateSettings({
      enableEmailNotifications: enableSalesNotifications,
      notificationEmails: salesEmails,
      enableProposalEmailNotifications: enableProposalNotifications,
      // proposalNotificationEmails: proposalEmails, // Futuro
    });

    toast({
      title: "Configurações de Notificação Salvas",
      description: "Suas preferências de notificação foram atualizadas.",
    });
  };

  const handleClearData = (key: string, type: 'Vendas' | 'Propostas') => {
    localStorage.removeItem(key);
    toast({
      title: `Dados de ${type} Limpos`,
      description: `Todos os dados de ${type} armazenados localmente foram removidos. A página será recarregada.`,
    });
    setTimeout(() => {
      window.location.reload();
    }, 1500); // Pequeno delay para o toast ser lido
  };

  if (loadingSettings) {
    return (
      <div className="flex justify-center items-center h-full">
        <Settings className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Settings className="mr-3 h-8 w-8" /> Configurações
          </h1>
          <p className="text-muted-foreground">
            Gerencie as preferências e dados da aplicação.
          </p>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center">
              <Mail className="mr-2 h-5 w-5 text-primary" /> Notificações por E-mail
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="shadow-none border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Novas Vendas</CardTitle>
                <CardDescription>
                  Controle o preparo de e-mails quando uma nova venda é inserida.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sales-email-notifications-toggle"
                    checked={enableSalesNotifications}
                    onCheckedChange={setEnableSalesNotifications}
                  />
                  <Label htmlFor="sales-email-notifications-toggle" className="text-base">
                    Habilitar preparação de e-mail para novas vendas
                  </Label>
                </div>
                {enableSalesNotifications && (
                  <div className="space-y-2">
                    <Label htmlFor="sales-notification-emails" className="text-base">
                      E-mails para Notificação de Vendas (separados por vírgula)
                    </Label>
                    <Textarea
                      id="sales-notification-emails"
                      placeholder="exemplo1@dominio.com, exemplo2@dominio.com"
                      value={salesEmailList}
                      onChange={(e) => setSalesEmailList(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                )}
              </CardContent>
              <CardHeader className="pb-2 pt-4">
                 <CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/> Novas Propostas</CardTitle>
                <CardDescription>
                  Controle o preparo de e-mails quando uma nova proposta é criada ou atualizada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="proposal-email-notifications-toggle"
                    checked={enableProposalNotifications}
                    onCheckedChange={setEnableProposalNotifications}
                  />
                  <Label htmlFor="proposal-email-notifications-toggle" className="text-base">
                    Habilitar preparação de e-mail para novas propostas
                  </Label>
                </div>
                {/* Futuro: adicionar textarea para emails de proposta se se tornarem configuráveis */}
                {enableProposalNotifications && (
                    <p className="text-xs text-muted-foreground">
                        Os e-mails de notificação de propostas serão preparados para a lista pré-definida no sistema.
                    </p>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveNotificationSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações de Notificação
                </Button>
              </CardFooter>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center">
                <DatabaseZap className="mr-2 h-5 w-5 text-destructive" /> Gerenciamento de Dados Locais
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="shadow-none border-0">
              <CardHeader>
                <CardTitle className="text-lg">Limpeza de Dados</CardTitle>
                <CardDescription>
                  Estas ações removerão permanentemente os dados armazenados no seu navegador. Use com cautela.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" /> Limpar Dados de Vendas
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Limpeza</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir todos os dados de VENDAS armazenados localmente? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleClearData(LOCAL_STORAGE_SALES_KEY, 'Vendas')} className="bg-destructive hover:bg-destructive/90">
                          Confirmar Limpeza de Vendas
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="destructive" className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" /> Limpar Dados de Propostas
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Limpeza</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir todos os dados de PROPOSTAS armazenados localmente? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleClearData(LOCAL_STORAGE_QUOTES_KEY, 'Propostas')} className="bg-destructive hover:bg-destructive/90">
                           Confirmar Limpeza de Propostas
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

