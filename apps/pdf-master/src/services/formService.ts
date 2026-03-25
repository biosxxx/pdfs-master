import type { FormFieldKind, FormFieldModel, FormFieldValue } from '@/domain/types';

export function normalizeFormValue(kind: FormFieldKind, value: unknown): FormFieldValue {
  switch (kind) {
    case 'checkbox':
      return Boolean(value);
    case 'dropdown':
    case 'radio':
    case 'text':
      return typeof value === 'string' ? value : String(value ?? '');
    case 'option-list':
      return Array.isArray(value) ? value.map(String) : typeof value === 'string' ? [value] : [];
    default:
      return null;
  }
}

export function getFormFieldMap(fields: FormFieldModel[]): Record<string, FormFieldValue> {
  return fields.reduce<Record<string, FormFieldValue>>((accumulator, field) => {
    accumulator[field.name] = field.value;
    return accumulator;
  }, {});
}

export function countCompletedFields(fields: FormFieldModel[]): number {
  return fields.filter((field) => {
    if (field.kind === 'checkbox') {
      return Boolean(field.value);
    }
    if (field.kind === 'option-list') {
      return Array.isArray(field.value) && field.value.length > 0;
    }
    return typeof field.value === 'string' && field.value.trim().length > 0;
  }).length;
}
