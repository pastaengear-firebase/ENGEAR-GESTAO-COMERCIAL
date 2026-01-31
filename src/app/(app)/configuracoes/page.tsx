
// src/app/(app)/configuracoes/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Settings, Mail, Save, Check, FileText } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ConfiguracoesPage() {
  const { settings, updateSettings, loadingSettings } = useSettings();

  // State for Sales notifications
  const [enableSalesNotifications, setEnableSalesNotifications] = useState(false);
  const [salesEmailList, setSalesEmailList] = useState('');
  const [isSubmittingSales, setIsSubmittingSales] = useState(false);
  const [isSavedSales, setIsSavedSales] = useState(false);
  
  // State for Proposals notifications
  const [enableProposalsNotifications, setEnableProposalsNotifications] = useState(false);
  const [proposalsEmailList, setProposalsEmailList] = useState('');
  const [isSubmittingProposals, setIsSubmittingProposals] = useState(false);
  const [isSavedProposals, setIsSavedProposals] = useState(false);
  
  useEffect(() => {
    if (!loadingSettings && settings) {
      setEnableSalesNotifications(settings.enableSalesEmailNotifications);
      setSalesEmailList(settings.salesNotificationEmails?.join(', ') || '');
      setEnableProposalsNotifications(settings.enableProposalsEmailNotifications);
      setProposalsEmailList(settings.proposalsNotificationEmails?.join(', ') || '');
    }
  }, [settings, loadingSettings]);

  const handleSaveSalesSettings = async () => {
    setIsSubmittingSales(true);
    setIsSavedSales(false);
    const salesEmails = salesEmailList.split(',').map(email => email.trim()).filter(email => email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    
    await updateSettings({
      enableSalesEmailNotifications: enableSalesNotifications,
      salesNotificationEmails: salesEmails,
    });

    setIsSavedSales(true);
    setIsSubmittingSales(false);
    setTimeout(() => setIsSavedSales(false), 2000);
  };

  const handleSaveProposalsSettings = async () => {
    setIsSubmittingProposals(true);
    setIsSavedProposals(false);
    const proposalsEmails = proposalsEmailList.split(',').map(email => email.trim()).filter(email => email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      
    await updateSettings({
      enableProposalsEmailNotifications: enableProposalsNotifications,
      proposalsNotificationEmails: proposalsEmails,
    });

    setIsSavedProposals(true);
    setIsSubmittingProposals(false);
    setTimeout(() => setIsSavedProposals(false), 2000);
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
            Gerencie as preferências de notificação da aplicação.
          </p>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={['vendas-notifications']} className="w-full">
        <AccordionItem value="vendas-notifications">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center">
              <Mail className="mr-2 h-5 w-5 text-primary" /> Notificações de Vendas
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
                      E-mails para Notificação (separados por vírgula)
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
              <CardFooter>
                <Button onClick={handleSaveSalesSettings} disabled={isSubmittingSales || isSavedSales}>
                  {isSavedSales ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmittingSales ? 'Salvando...' : isSavedSales ? 'Salvo!' : 'Salvar'}
                </Button>
              </CardFooter>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="propostas-notifications">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" /> Notificações de Propostas
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="shadow-none border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Novas Propostas</CardTitle>
                <CardDescription>
                  Controle o preparo de e-mails quando uma nova proposta é criada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="proposals-email-notifications-toggle"
                    checked={enableProposalsNotifications}
                    onCheckedChange={setEnableProposalsNotifications}
                  />
                  <Label htmlFor="proposals-email-notifications-toggle" className="text-base">
                    Habilitar preparação de e-mail para novas propostas
                  </Label>
                </div>
                {enableProposalsNotifications && (
                  <div className="space-y-2">
                    <Label htmlFor="proposals-notification-emails" className="text-base">
                      E-mails para Notificação (separados por vírgula)
                    </Label>
                    <Textarea
                      id="proposals-notification-emails"
                      placeholder="exemplo1@dominio.com, exemplo2@dominio.com"
                      value={proposalsEmailList}
                      onChange={(e) => setProposalsEmailList(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProposalsSettings} disabled={isSubmittingProposals || isSavedProposals}>
                  {isSavedProposals ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmittingProposals ? 'Salvando...' : isSavedProposals ? 'Salvo!' : 'Salvar'}
                </Button>
              </CardFooter>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
