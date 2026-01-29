
import { z } from 'zod';
import { AREA_OPTIONS, STATUS_OPTIONS, COMPANY_OPTIONS, SELLERS, PROPOSAL_STATUS_OPTIONS, CONTACT_SOURCE_OPTIONS, FOLLOW_UP_OPTIONS } from './constants';

export const LoginSchema = z.object({
  username: z.string().min(1, 'Usuário é obrigatório.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
});
export type LoginFormData = z.infer<typeof LoginSchema>;

export const SalesFormSchema = z.object({
  date: z.date({ required_error: 'Data é obrigatória.' }),
  company: z.enum(COMPANY_OPTIONS, { required_error: 'Empresa é obrigatória.' }),
  project: z.string().min(1, 'Projeto é obrigatório.'),
  os: z.string(), // Opcional
  area: z.enum(AREA_OPTIONS, { required_error: 'Área é obrigatória.' }),
  clientService: z.string().min(1, 'Cliente/Serviço é obrigatório.'),
  salesValue: z.coerce.number().positive('Valor da Venda deve ser positivo.'),
  status: z.enum(STATUS_OPTIONS, { required_error: 'Status é obrigatório.' }),
  payment: z.coerce.number().min(0, 'Valor do Pagamento não pode ser negativo.'),
  summary: z.string().optional(),
  sendSaleNotification: z.boolean().optional().default(false),
  seller: z.enum(SELLERS).optional(), // Adicionado para validação, mas será definido via estado
});
export type SalesFormData = z.infer<typeof SalesFormSchema>;

const followUpValues = FOLLOW_UP_OPTIONS.map(opt => opt.value);

export const QuoteFormSchema = z.object({
  clientName: z.string().min(1, 'Nome do cliente é obrigatório.'),
  proposalDate: z.date({ required_error: 'Data da proposta é obrigatória.' }),
  validityDate: z.date().optional(),
  company: z.enum(COMPANY_OPTIONS, { required_error: 'Empresa é obrigatória.' }),
  area: z.enum(AREA_OPTIONS, { required_error: 'Área é obrigatória.' }),
  contactSource: z.enum(CONTACT_SOURCE_OPTIONS, { required_error: 'Fonte do contato é obrigatória.'}),
  description: z.string().min(1, 'Descrição/Escopo é obrigatório.'),
  proposedValue: z.coerce.number().positive('Valor proposto deve ser positivo.'),
  status: z.enum(PROPOSAL_STATUS_OPTIONS, { required_error: 'Status da proposta é obrigatório.'}),
  notes: z.string().optional(),
  followUpOption: z.string()
    .refine(val => followUpValues.includes(val as any), {
        message: "Selecione uma opção válida para o follow-up."
    })
    .default('0'),
  sendProposalNotification: z.boolean().optional().default(false),
  followUpDone: z.boolean().optional().default(false),
});
export type QuoteFormData = z.infer<typeof QuoteFormSchema>;
