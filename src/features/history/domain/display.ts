import { TEMPLATE_OPTIONS } from '../../create/domain/templates';

export function templateLabel(templateType: string): string {
  return TEMPLATE_OPTIONS.find((option) => option.id === templateType)?.label ?? 'Wish';
}
