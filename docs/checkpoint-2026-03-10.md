# Checkpoint - 2026-03-10

## Resumo da sessão
- Avaliação do fluxo de faturamento e aviso de faturamento existente.
- Confirmado que o aviso aparece apenas quando o status da venda está em **Aguardando Pagamento**.
- Definição de novo comportamento desejado: aviso deve ocorrer sempre que já exista faturamento anterior, independente do status.
- Proposta de novas opções de status em faturamento: **Faturada** e **Medida**.

## Observações importantes
- O app não está conectado ao financeiro, portanto **não é possível inferir pagamento real** do cliente.
- O status **Aguardando Pagamento** pode ser enganoso, pois não reflete a realidade financeira do cliente.
- Precisamos tratar faturamento como registro de solicitação/execução, não como confirmação de pagamento.

## Proposta de plano
1. **Atualizar lista de status de vendas**
   - Incluir opções: `Faturada` e `Medida`.
   - (Opcional) Manter `A Iniciar`, `Em Andamento`, `Cancelado`, `Finalizado`, mas evitar uso de `Aguardando Pagamento`.

2. **Aviso de faturamento anterior**
   - Ao clicar em **Faturar**: verificar se já existe registro de faturamento (`billing-logs`) para a venda.
   - Se sim, exibir modal com histórico e detalhes (valor, saldo, data, quem solicitou, etc.).
   - Não bloquear: permitir continuar a faturar mesmo após ver aviso.

3. **Ajustar lógica de status na página de faturamento**
   - Ao enviar solicitação de faturamento, permitir que o usuário escolha definir o status como `Faturada` ou `Medida` (ou manter status atual).
   - Opcionalmente, ao faturar, atualizar venda para `Faturada` para marcar que já foi solicitado faturamento.

4. **Validar duplicate handling**
   - Garantir que uma mesma venda não seja faturada indefinidamente sem aviso.
   - Modificar o aviso para aparecer sempre que houver **billing-log** associado à venda, não apenas status.

## Próximos passos (amanhã)
- Implementar mudanças no esquema de status e na UI de faturamento.
- Testar com cenários de faturamento parcial, aditivo e medição.
- Verificar que o aviso aparece corretamente para vendas já faturadas anteriormente.

---

> Nota: não foram feitas alterações de código nesta sessão; o foco foi entender o fluxo atual e planejar as mudanças com segurança.