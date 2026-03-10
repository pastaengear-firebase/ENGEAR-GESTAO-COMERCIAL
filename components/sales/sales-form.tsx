"use client";
import type React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SalesFormSchema, type SalesFormData } from "@/lib/schemas";
import { AREA_OPTIONS, STATUS_OPTIONS, COMPANY_OPTIONS, ALL_SELLERS_OPTION } from "@/lib/constants";
import { useSales } from "@/hooks/use-sales";
import { useQuotes } from "@/hooks/use-quotes";
import { useSettings } from "@/hooks/use-settings";
import { useFirestore, useStorage } from "@/firebase/provider";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogContent, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { CalendarIcon, DollarSign, Save, RotateCcw, Info, Check, UploadCloud, Link as LinkIcon, Trash2, Download } from "lucide-react";
import { cn, getFriendlyPdfErrorMessage } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { Sale } from "@/lib/types";
import { normalizeArea, normalizeCompany, normalizeSaleStatus } from "@/lib/normalizers";

const sanitizeSelectValue = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

interface SalesFormProps {
  saleToEdit?: Sale | null;
  fromQuoteId?: string | null;
  onFormSubmit?: () => void;
  showReadOnlyAlert?: boolean;
}

export default function SalesForm({
  saleToEdit,
  fromQuoteId,
  onFormSubmit,
  showReadOnlyAlert,
}: SalesFormProps) {
  const { addSale, updateSale, userRole, sales } = useSales();
  const { getQuoteById: getQuoteByIdFromContext, updateQuote: updateQuoteStatus, loadingQuotes } = useQuotes();
  const { settings: appSettings } = useSettings();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [originatingSeller, setOriginatingSeller] = useState<string | null>(null);

  const [duplicateSales, setDuplicateSales] = useState<Sale[]>([]);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const pendingSaleRef = useRef<SalesFormData | null>(null);

  // PDF (vendas)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [deleteExistingPdf, setDeleteExistingPdf] = useState(false);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);
  const [existingPdfPath, setExistingPdfPath] = useState<string | null>(null);
  const [existingPdfName, setExistingPdfName] = useState<string | null>(null);

  const editMode = !!saleToEdit;

  // Garante que o pré-preenchimento só acontece 1x por fromQuoteId (não sobrescreve edição do usuário)
  const prefillDoneRef = useRef(false);
  useEffect(() => {
    prefillDoneRef.current = false;
  }, [fromQuoteId]);

  const form = useForm<SalesFormData>({
    resolver: zodResolver(SalesFormSchema),
    defaultValues: {
      date: new Date(),
      company: COMPANY_OPTIONS[0],
      project: "",
      os: "",
      area: AREA_OPTIONS[0],
      clientService: "",
      salesValue: 0,
      status: STATUS_OPTIONS[0],
      payment: 0,
      summary: "",
      sendSaleNotification: false,
    },
  });

  const isFormDisabled =
    (userRole === ALL_SELLERS_OPTION && !editMode) ||
    (editMode && userRole !== saleToEdit?.seller);

  const resetPdfStateFromSale = useCallback((sale?: any) => {
    const url = sale?.attachmentUrl ?? null;
    const path = sale?.attachmentPath ?? null;
    const name = sale?.attachmentName ?? null;
    setExistingPdfUrl(url);
    setExistingPdfPath(path);
    setExistingPdfName(name);
    setPdfFile(null);
    setDeleteExistingPdf(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // Função para resetar o formulário com segurança
  const resetForm = useCallback(
    (data?: any) => {
      if (data) {
        form.reset({
          ...data,
          date: typeof data.date === "string" ? parseISO(data.date) : data.date,
          os: data.os || "",
          summary: data.summary || "",
          payment: data.payment || 0,
          company: normalizeCompany(data.company) ?? COMPANY_OPTIONS[0],
          area: normalizeArea(data.area) ?? AREA_OPTIONS[0],
          status: normalizeSaleStatus(data.status) ?? STATUS_OPTIONS[0],
          sendSaleNotification: data.sendSaleNotification ?? false,
        });
        form.clearErrors();
      } else {
        form.reset({
          date: new Date(),
          company: COMPANY_OPTIONS[0],
          project: "",
          os: "",
          area: AREA_OPTIONS[0],
          clientService: "",
          salesValue: undefined,
          status: STATUS_OPTIONS[0],
          payment: 0,
          summary: "",
          sendSaleNotification: appSettings?.enableSalesEmailNotifications || false,
        });
        form.clearErrors();
      }
    },
    [form, appSettings?.enableSalesEmailNotifications]
  );

  useEffect(() => {
    // 1) Edição de venda: sempre carrega a venda completa
    if (editMode && saleToEdit) {
      resetForm(saleToEdit);
      resetPdfStateFromSale(saleToEdit);
      setOriginatingSeller(saleToEdit.seller);
      return;
    }

    // 2) Conversão proposta -> venda: aguarda carregar quotes e preenche quando disponível
    if (fromQuoteId) {
      const quoteToConvert = getQuoteByIdFromContext(fromQuoteId);

      if (!quoteToConvert) {
        if (loadingQuotes) return;
        toast({
          title: "Proposta não encontrada",
          description: "Não foi possível localizar a proposta para conversão. Volte e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      if (!prefillDoneRef.current) {
        if (userRole !== quoteToConvert.seller) {
          toast({
            title: "Aviso de Vendedor",
            description: `Atenção: você está convertendo uma proposta de ${quoteToConvert.seller}.`,
            variant: "default",
            duration: 5000,
          });
        }

        resetForm({
          date: new Date(),
          company: quoteToConvert.company,
          project: "",
          os: "",
          area: quoteToConvert.area,
          clientService: quoteToConvert.clientName,
          salesValue: quoteToConvert.proposedValue,
          status: "A INICIAR",
          payment: 0,
          summary: `Convertido da Proposta: ${quoteToConvert.description || ""}`,
          sendSaleNotification: appSettings?.enableSalesEmailNotifications || false,
        });

        // Herda PDF da proposta, se houver
        resetPdfStateFromSale(quoteToConvert);

        prefillDoneRef.current = true;
      }

      setOriginatingSeller(quoteToConvert.seller);
      return;
    }

    // 3) Nova venda “normal”
    resetForm();
    resetPdfStateFromSale(undefined);
    setOriginatingSeller(null);
  }, [
    editMode,
    saleToEdit,
    fromQuoteId,
    getQuoteByIdFromContext,
    loadingQuotes,
    resetForm,
    resetPdfStateFromSale,
    userRole,
    toast,
    appSettings?.enableSalesEmailNotifications,
  ]);

  const handlePickPdf = () => fileInputRef.current?.click();

  const handlePdfSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.type !== "application/pdf") {
      toast({ title: "Formato inválido", description: "Selecione apenas PDF.", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      toast({ title: "Arquivo grande", description: "Máximo permitido: 4MB.", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPdfFile(f);
    // se escolher novo PDF, não deletamos automaticamente; substituição ocorrerá no submit
    setDeleteExistingPdf(false);
  };

  const removeExistingPdfLocally = () => {
    // marca para remover do storage e limpar campos no submit
    setDeleteExistingPdf(true);
    setPdfFile(null);
  };

  const uploadSalePdf = async (saleId: string) => {
    if (!storage || !firestore) throw new Error("Storage/Firestore não inicializado.");
    if (!pdfFile) return null;

    // apaga o anterior se existir
    if (existingPdfPath) {
      const oldRef = ref(storage, existingPdfPath);
      await deleteObject(oldRef).catch(() => {});
    }

    const safeName = pdfFile.name.replace(/[^\w.\-() ]+/g, "_");
    const filePath = `sales/${saleId}/${Date.now()}-${safeName}`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, pdfFile);
    const url = await getDownloadURL(fileRef);

    const saleRef = doc(firestore, "sales", saleId);
    await updateDoc(saleRef, {
      attachmentUrl: url,
      attachmentPath: filePath,
      attachmentName: pdfFile.name,
      updatedAt: new Date(),
    } as any);

    setExistingPdfUrl(url);
    setExistingPdfPath(filePath);
    setExistingPdfName(pdfFile.name);
    setPdfFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    return url;
  };

  const deleteSalePdf = async (saleId: string) => {
    if (!storage || !firestore) throw new Error("Storage/Firestore não inicializado.");
    if (!existingPdfPath) {
      // só limpa os campos
      const saleRef = doc(firestore, "sales", saleId);
      await updateDoc(saleRef, { attachmentUrl: null, attachmentPath: null, attachmentName: null } as any);
      setExistingPdfUrl(null);
      setExistingPdfPath(null);
      setExistingPdfName(null);
      return;
    }

    const fileRef = ref(storage, existingPdfPath);
    await deleteObject(fileRef).catch(() => {});
    const saleRef = doc(firestore, "sales", saleId);
    await updateDoc(saleRef, { attachmentUrl: null, attachmentPath: null, attachmentName: null } as any);

    setExistingPdfUrl(null);
    setExistingPdfPath(null);
    setExistingPdfName(null);
  };

  const triggerEmailNotification = async (
    sale: Sale & any,
    options?: { isConversion?: boolean; sourceQuote?: any }
  ) => {
    if (!appSettings.enableSalesEmailNotifications) return;

    const recipients = appSettings.salesNotificationEmails.join(",");
    const subjectValue = sale.salesValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const company = sale.company || "NÃO INFORMADO";
    const project = sale.project || "NÃO INFORMADO";
    const os = sale.os || "NÃO INFORMADO";
    const client = sale.clientService || "NÃO INFORMADO";
    const seller = sale.seller || "NÃO INFORMADO";
    const dateValue = sale.date ? format(parseISO(sale.date), 'dd/MM/yyyy', { locale: ptBR }) : format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
    const sourceQuote = options?.sourceQuote;
    const hasProposalPdf = Boolean(sourceQuote?.attachmentUrl || sourceQuote?.attachmentPath || sale.attachmentUrl);
    const appBaseUrl = window.location.origin;
    const salesLink = `${appBaseUrl}/vendas/gerenciar`;

    const subject = options?.isConversion
      ? `A PROPOSTA FOI ACEITA! CONVERTIDA EM VENDA! - ${company} PROJETO ${project} - O.S. N. ${os} - VALOR: ${subjectValue} - CLIENTE ${client} - VENDEDOR: ${seller}`
      : `NOVA VENDA REALIZADA! - ${company} PROJETO ${project} - O.S. N. ${os} - VALOR: ${subjectValue} - CLIENTE ${client} - VENDEDOR: ${seller}`;

    const body = [
      `Cliente: ${client}`,
      `Dados do Cliente: `,
      `Valor Proposto: ${subjectValue}`,
      `Área: ${sale.area || 'NÃO INFORMADA'}`,
      `Data: ${dateValue}`,
      `Projeto: ${project}`,
      `O.S.: ${os}`,
      `Descrição: ${sale.summary || ''}`,
      `PDF da Proposta: ${hasProposalPdf ? 'Sim' : 'Não'}`,
      `Vendedor: ${seller}`,
      ``,
      `Resumo: ${sale.summary || ''}`,
      ``,
      `Para consultar, acesse: ${salesLink}`,
    ].join("\n");

    const mailtoLink = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, "_blank");
  };

  const doSubmit = useCallback(async (data: SalesFormData) => {
    setIsSubmitting(true);
    setIsSaved(false);

    const salePayload = {
      ...data,
      date: format(data.date, "yyyy-MM-dd"),
      salesValue: Number(data.salesValue || 0),
      payment: Number(data.payment || 0),
    };

    try {
      let saleId: string;
      let savedSale: any;

      if (editMode && saleToEdit) {
        await updateSale(saleToEdit.id, salePayload);
        saleId = saleToEdit.id;
        savedSale = { ...saleToEdit, ...salePayload };

        if (deleteExistingPdf && (existingPdfUrl || existingPdfPath)) {
          await deleteSalePdf(saleId);
          savedSale.attachmentUrl = null;
        }

        if (pdfFile) {
          setPdfUploading(true);
          const url = await uploadSalePdf(saleId);
          savedSale.attachmentUrl = url;
        }

        toast({ title: "Sucesso", description: "Venda atualizada com sucesso!" });
      } else {
        const newSale = await addSale(salePayload);
        saleId = newSale.id;
        savedSale = { ...newSale };

        if (fromQuoteId) {
          await updateQuoteStatus(fromQuoteId, { status: "Aceita" } as any);
        }

        if (pdfFile) {
          setPdfUploading(true);
          const url = await uploadSalePdf(saleId);
          savedSale.attachmentUrl = url;
        }

        if (savedSale && data.sendSaleNotification) {
          const sourceQuote = fromQuoteId ? getQuoteByIdFromContext(fromQuoteId) : undefined;
          await triggerEmailNotification(savedSale, {
            isConversion: Boolean(fromQuoteId),
            sourceQuote,
          });
        }

        toast({ title: "Sucesso", description: "Venda cadastrada com sucesso!" });
      }

      setIsSaved(true);
      if (onFormSubmit) onFormSubmit();
    } catch (e: any) {
      toast({ title: "Erro", description: getFriendlyPdfErrorMessage(e), variant: "destructive" });
    } finally {
      setPdfUploading(false);
      setIsSubmitting(false);
      setTimeout(() => setIsSaved(false), 2000);
    }
  }, [addSale, deleteExistingPdf, deleteSalePdf, editMode, existingPdfPath, existingPdfUrl, fileInputRef, fromQuoteId, getQuoteByIdFromContext, onFormSubmit, pdfFile, toast, triggerEmailNotification, updateQuoteStatus, updateSale, userRole]);

  const onSubmit = async (data: SalesFormData) => {
    if (isFormDisabled) {
      toast({ title: "Ação Não Permitida", description: "Sem permissão para salvar.", variant: "destructive" });
      return;
    }

    const normalizedProject = (data.project || "").trim().toLowerCase();
    const normalizedOs = (data.os || "").trim().toLowerCase();
    const normalizedClient = (data.clientService || "").trim().toLowerCase();

    const duplicates = (sales || []).filter((s) => {
      if (editMode && saleToEdit && s.id === saleToEdit.id) return false;
      return (
        (s.project || "").trim().toLowerCase() === normalizedProject &&
        (s.os || "").trim().toLowerCase() === normalizedOs &&
        (s.clientService || "").trim().toLowerCase() === normalizedClient
      );
    });

    if (duplicates.length > 0) {
      pendingSaleRef.current = data;
      setDuplicateSales(duplicates);
      setIsDuplicateDialogOpen(true);
      return;
    }

    await doSubmit(data);
  };

  const handleConfirmDuplicate = async () => {
    if (!pendingSaleRef.current) return;
    setIsDuplicateDialogOpen(false);
    await doSubmit(pendingSaleRef.current);
    pendingSaleRef.current = null;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {showReadOnlyAlert && isFormDisabled && (
          <Alert variant="default" className="bg-amber-50 border-amber-300 text-amber-700">
            <Info className="h-4 w-4 !text-amber-600" />
            <AlertTitle>Modo Somente Leitura</AlertTitle>
            <AlertDescription>
              {originatingSeller && userRole !== originatingSeller
                ? `Apenas o vendedor ${originatingSeller} pode modificar este item.`
                : "Faça login autorizado para habilitar."}
            </AlertDescription>
          </Alert>
        )}

        <AlertDialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Vendas semelhantes encontradas</AlertDialogTitle>
              <AlertDialogDescription>
                Já existe(m) cadastro(s) com os mesmos Projeto / O.S. / Cliente. Confirme se deseja prosseguir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              {duplicateSales.map((dup) => (
                <div key={dup.id} className="rounded-md border p-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-semibold">{dup.project} • {dup.os}</p>
                      <p className="text-xs text-muted-foreground">{dup.clientService}</p>
                    </div>
                    <p className="text-sm font-semibold">{dup.salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Status: {dup.status} • Pagamento: {dup.payment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
              ))}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDuplicate}>Prosseguir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data da Venda</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        disabled={isFormDisabled || isSubmitting || pdfUploading}
                      >
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || isFormDisabled || isSubmitting || pdfUploading}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Vendedor</FormLabel>
            <Input value={originatingSeller || userRole} disabled className="bg-muted" />
          </FormItem>

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <Select onValueChange={(value) => field.onChange(sanitizeSelectValue(value))} value={sanitizeSelectValue(field.value)} disabled={isFormDisabled || isSubmitting || pdfUploading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a Empresa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COMPANY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="project"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projeto (máx 5 dígitos)</FormLabel>
                <FormControl>
                  <Input placeholder="Código do Projeto" {...field} maxLength={5} disabled={isFormDisabled || isSubmitting || pdfUploading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="os"
            render={({ field }) => (
              <FormItem>
                <FormLabel>O.S. (máx 5 dígitos)</FormLabel>
                <FormControl>
                  <Input placeholder="Número da O.S." {...field} maxLength={5} disabled={isFormDisabled || isSubmitting || pdfUploading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área</FormLabel>
                <Select onValueChange={(value) => field.onChange(sanitizeSelectValue(value))} value={sanitizeSelectValue(field.value)} disabled={isFormDisabled || isSubmitting || pdfUploading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a Área" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AREA_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientService"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente/Serviço</FormLabel>
                <FormControl>
                  <Input placeholder="Cliente ou Serviço" {...field} disabled={isFormDisabled || isSubmitting || pdfUploading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salesValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor da Venda (R$)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      className="pl-8"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                      disabled={isFormDisabled || isSubmitting || pdfUploading}
                      step="0.01"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={(value) => field.onChange(sanitizeSelectValue(value))} value={sanitizeSelectValue(field.value)} disabled={isFormDisabled || isSubmitting || pdfUploading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Pagamento (R$)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      className="pl-8"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                      disabled={isFormDisabled || isSubmitting || pdfUploading}
                      step="0.01"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* PDF da Venda */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">PDF da Venda</div>
              <div className="text-sm text-muted-foreground">Máximo 4MB. Será salvo e o link vai no e-mail.</div>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" onChange={handlePdfSelected} />
            <Button type="button" variant="secondary" onClick={handlePickPdf} disabled={isFormDisabled || isSubmitting || pdfUploading}>
              <UploadCloud className="mr-2 h-4 w-4" /> Selecionar PDF
            </Button>
          </div>

          {pdfFile && (
            <div className="text-sm">
              Selecionado: <span className="font-medium">{pdfFile.name}</span>
            </div>
          )}

          {!pdfFile && existingPdfUrl && !deleteExistingPdf && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={existingPdfUrl} target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="mr-2 h-4 w-4" /> Ver PDF
                  </a>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <a href={existingPdfUrl} download={existingPdfName || undefined}>
                    <Download className="mr-2 h-4 w-4" /> Download
                  </a>
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeExistingPdfLocally}
                disabled={isFormDisabled || isSubmitting || pdfUploading}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Remover PDF
              </Button>
              {existingPdfName && (
                <p className="text-xs text-muted-foreground basis-full truncate" title={existingPdfName}>
                  {existingPdfName}
                </p>
              )}
            </div>
          )}

          {deleteExistingPdf && (
            <div className="text-sm text-destructive">
              PDF marcado para remoção. Salve a venda para confirmar.
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resumo</FormLabel>
              <FormControl>
                <Textarea {...field} disabled={isFormDisabled || isSubmitting || pdfUploading} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={() => resetForm()}
            disabled={isSubmitting || pdfUploading}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar
          </Button>
          <Button
            type="submit"
            disabled={isFormDisabled || isSubmitting || pdfUploading || isSaved}
            className="w-full sm:w-auto"
          >
            {isSaved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {pdfUploading ? "Enviando PDF..." : isSubmitting ? "Salvando..." : editMode ? "Atualizar Venda" : "Salvar Venda"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
