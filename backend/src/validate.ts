import { z } from "zod";
import { AppError } from "./errors";

/**
 * Mensagens padrão do zod em pt-BR. Só valem quando o schema não define mensagem própria
 * (mensagens customizadas continuam prevalecendo).
 */
export const ptBrErrorMap: z.ZodErrorMap = (issue) => {
  const field = issue.path.length > 0 ? `O campo "${issue.path.join(".")}"` : "O valor enviado";
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === z.ZodParsedType.undefined) return { message: `${field} é obrigatório.` };
      return { message: `${field} tem um valor inválido.` };
    case z.ZodIssueCode.invalid_literal:
    case z.ZodIssueCode.invalid_enum_value:
    case z.ZodIssueCode.invalid_union:
    case z.ZodIssueCode.invalid_union_discriminator:
      return { message: `${field} tem um valor inválido.` };
    case z.ZodIssueCode.too_small:
    case z.ZodIssueCode.too_big:
      return { message: `${field} está fora do limite permitido.` };
    case z.ZodIssueCode.invalid_string:
    case z.ZodIssueCode.invalid_date:
      return { message: `${field} está em um formato inválido.` };
    case z.ZodIssueCode.unrecognized_keys:
      return { message: "A requisição tem campos desconhecidos." };
    default:
      return { message: "Dados inválidos." };
  }
};

z.setErrorMap(ptBrErrorMap);

export function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new AppError("VALIDATION", result.error.issues[0]?.message ?? "Dados inválidos.");
  return result.data;
}
