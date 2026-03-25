import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
} from 'pdf-lib';
import type { PDFField } from 'pdf-lib';
import type { FormFieldModel, IngestDocumentPayload } from '@/domain/types';

export async function inspectPdfFile(file: File, documentId: string): Promise<IngestDocumentPayload> {
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
  const pages = pdf.getPages().map((page, index) => {
    const size = page.getSize();
    return {
      id: `${documentId}-page-${index + 1}`,
      sourcePageIndex: index,
      width: size.width,
      height: size.height,
      label: `Page ${index + 1}`,
    };
  });

  const metadata = {
    title: pdf.getTitle() ?? undefined,
    author: pdf.getAuthor() ?? undefined,
    subject: pdf.getSubject() ?? undefined,
    creator: pdf.getCreator() ?? undefined,
    producer: pdf.getProducer() ?? undefined,
    creationDate: pdf.getCreationDate()?.toISOString(),
    modificationDate: pdf.getModificationDate()?.toISOString(),
    keywords: pdf.getKeywords()?.split(',').map((item) => item.trim()).filter(Boolean),
  };

  const form = pdf.getForm();
  const fields = form.getFields().map(readFormField);

  return {
    id: documentId,
    name: file.name,
    pageCount: pdf.getPageCount(),
    metadata,
    hasForms: fields.length > 0,
    formFields: fields,
    pages,
  };
}

function readFormField(field: PDFField): FormFieldModel {
  if (field instanceof PDFTextField) {
    return buildField(field.getName(), 'text', field.getText() ?? '', undefined, field.isReadOnly(), field.isRequired());
  }

  if (field instanceof PDFCheckBox) {
    return buildField(field.getName(), 'checkbox', field.isChecked(), undefined, field.isReadOnly(), field.isRequired());
  }

  if (field instanceof PDFDropdown) {
    return buildField(field.getName(), 'dropdown', field.getSelected().at(0) ?? '', field.getOptions(), field.isReadOnly(), field.isRequired());
  }

  if (field instanceof PDFRadioGroup) {
    return buildField(field.getName(), 'radio', field.getSelected() ?? '', field.getOptions(), field.isReadOnly(), field.isRequired());
  }

  if (field instanceof PDFOptionList) {
    return buildField(field.getName(), 'option-list', field.getSelected(), field.getOptions(), field.isReadOnly(), field.isRequired());
  }

  return buildField(field.getName(), 'unsupported', null, undefined, field.isReadOnly(), field.isRequired());
}

function buildField(
  name: string,
  kind: FormFieldModel['kind'],
  value: FormFieldModel['value'],
  options: string[] | undefined,
  readOnly: boolean,
  required: boolean,
): FormFieldModel {
  return {
    name,
    label: name,
    kind,
    value,
    options,
    readOnly,
    required,
  };
}
