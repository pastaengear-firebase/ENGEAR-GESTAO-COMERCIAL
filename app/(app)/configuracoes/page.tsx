// src/app/(app)/configuracoes/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
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

  // State for Proposals notifications
  const [enableProposalsNotifications, setEnableProposalsNotifications] = useState(false);
  const [proposalsEmailList, setProposalsEmailList] = useState('');

  // State for Billing notifications
  const [enableBillingNotifications, setEnableBillingNotifications] = useState(false);
  const [billingEmailList, setBillingEmailList] = useState('');

  // Unified saving state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!loadingSettings && settings) {
      setEnableSalesNotifications(settings.enableSalesEmailNotifications ?? false);
      setSalesEmailList(settings.salesNotificationEmails?.join(', ') || '');

      setEnableProposalsNotifications(settings.enableProposalsEmailNotifications ?? false);
      setProposalsEmailList(settings.proposalsNotificationEmails?.join(', ') || '');

      setEnableBillingNotifications(settings.enableBillingEmailNotifications ?? false);
      setBillingEmailList(settings.billingNotificationEmails?.join(', ') || '');
    }
  }, [settings, loadingSettings]);

  const handleSaveAllSettings = async () => {
    setIsSubmitting(true);
    setIsSaved(false);

    const salesEmails = salesEmailList.split(',').map(email => email.trim()).filter(Boolean);
    const proposalsEmails = proposalsEmailList.split(',').map(email => email.trim()).filter(Boolean);
    const billingEmails = billingEmailList.split(',').map(email => email.trim()).filter(Boolean);

    await updateSettings({
      enableSalesEmailNotifications: enableSalesNotifications,
      salesNotificationEmails: salesEmails,

      enableProposalsEmailNotifications: enableProposalsNotifications,
      proposalsNotificationEmails: proposalsEmails,

      enableBillingEmailNotifications: enableBillingNotifications,
      billingNotificationEmails: billingEmails,
    });

    setIsSaved(true);
    setIsSubmitting(false);
    setTimeout(() => setIsSaved(false), 2000);
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

      <Accordion
        type="multiple"
        defaultValue={['vendas-notifications', 'propostas-notifications', 'faturamento-notifications']}
        className="w-full"
      >
        <AccordionItem value="vendas-notifications">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center">
              <Mail className="mr-2 h-5 w-5 text-primary" /> Notificações de Vendas
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="shadow-none border-0">
              <CardHeader className="pb-2 px-1">
                <CardTitle className="text-lg">Novas Vendas</CardTitle>
                <CardDescription>
                  Controle o preparo de e-mails quando uma nova venda é inserida.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2 px-1">
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
              <CardHeader className="pb-2 px-1">
                <CardTitle className="text-lg">Novas Propostas</CardTitle>
                <CardDescription>
                  Controle o preparo de e-mails quando uma nova proposta é criada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2 px-1">
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
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faturamento-notifications">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" /> Notificações de Faturamento
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="shadow-none border-0">
              <CardHeader className="pb-2 px-1">
                <CardTitle className="text-lg">Solicitação de Faturamento</CardTitle>
                <CardDescription>
                  Controle os e-mails usados ao solicitar faturamento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2 px-1">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="billing-email-notifications-toggle"
                    checked={enableBillingNotifications}
                    onCheckedChange={setEnableBillingNotifications}
                  />
                  <Label htmlFor="billing-email-notifications-toggle" className="text-base">
                    Habilitar preparação de e-mail para faturamento
                  </Label>
                </div>

                {enableBillingNotifications && (
                  <div className="space-y-2">
                    <Label htmlFor="billing-notification-emails" className="text-base">
                      E-mails para Notificação (separados por vírgula)
                    </Label>
                    <Textarea
                      id="billing-notification-emails"
                      placeholder="financeiro@dominio.com, faturamento@dominio.com"
                      value={billingEmailList}
                      onChange={(e) => setBillingEmailList(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card className="mt-6 shadow-md">
        <CardFooter className="p-4 flex justify-end">
          <Button onClick={handleSaveAllSettings} disabled={isSubmitting || isSaved}>
            {isSaved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Salvando...' : isSaved ? 'Salvo!' : 'Salvar Configurações'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
