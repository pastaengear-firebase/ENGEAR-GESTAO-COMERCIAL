import { z } from 'zod';
import { AREA_OPTIONS, STATUS_OPTIONS, COMPANY_OPTIONS, SELLERS } from './constants';

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
  seller: z.enum(SELLERS).optional(), // Adicionado para validação, mas será definido via estado
});
export type SalesFormData = z.infer<typeof SalesFormSchema>;
