
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
import { Settings, Mail, Save } from 'lucide-react';

export default function ConfiguracoesPage() {
  const { settings, updateSettings, loadingSettings } = useSettings();
  const { toast } = useToast();

  const [enableNotifications, setEnableNotifications] = useState(false);
  const [emailList, setEmailList] = useState('');

  useEffect(() => {
    if (!loadingSettings) {
      setEnableNotifications(settings.enableEmailNotifications);
      setEmailList(settings.notificationEmails.join(', '));
    }
  }, [settings, loadingSettings]);

  const handleSaveSettings = () => {
    const emails = emailList
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)); // Basic email validation

    updateSettings({
      enableEmailNotifications: enableNotifications,
      notificationEmails: emails,
    });

    toast({
      title: "Configurações Salvas",
      description: "Suas preferências de notificação foram atualizadas.",
    });
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
            Gerencie as preferências da aplicação.
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5 text-primary" />
            Notificações por E-mail (Novas Vendas)
          </CardTitle>
          <CardDescription>
            Controle se e para quem os e-mails de notificação são preparados quando uma nova venda é inserida.
            O envio final do e-mail ainda requer sua confirmação no seu cliente de e-mail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="email-notifications-toggle"
              checked={enableNotifications}
              onCheckedChange={setEnableNotifications}
            />
            <Label htmlFor="email-notifications-toggle" className="text-base">
              Habilitar preparação de e-mail para novas vendas
            </Label>
          </div>
          {enableNotifications && (
            <div className="space-y-2">
              <Label htmlFor="notification-emails" className="text-base">
                E-mails para Notificação (separados por vírgula)
              </Label>
              <Textarea
                id="notification-emails"
                placeholder="exemplo1@dominio.com, exemplo2@dominio.com"
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Insira os endereços de e-mail que devem ser incluídos no campo "Para" do e-mail de notificação.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
